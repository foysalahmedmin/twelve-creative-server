/* eslint-disable no-console */
import { execFile } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import { path as ffprobePath } from 'ffprobe-static';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

/**
 * Shrinks an uploaded video in place, in the background, after the upload
 * has already succeeded — the admin never waits on this. Every failure mode
 * (corrupt input, ffmpeg missing, a run that would take too long) falls back
 * to silently keeping the original file exactly as it was. This module must
 * never make an upload worse than doing nothing would have.
 */

// Below this, a re-encode's CPU cost isn't worth chasing marginal savings.
const MIN_SIZE_TO_COMPRESS_BYTES = 8 * 1024 * 1024; // 8 MB

// Roughly h264 in an mp4 that's already reasonably encoded — re-encoding
// something already at or under this would likely make it larger, not
// smaller (observed firsthand: one already-efficient source file grew 0.4%
// after a full re-encode pass).
const SKIP_IF_BITRATE_BELOW_BPS = 3_500_000; // 3.5 Mbps

// Caps the longer of width/height; the shorter side is scaled to match,
// preserving aspect ratio. Never upscales — see the `-2:-2` fallback below.
const MAX_DIMENSION = 1920;

// This runs with nothing waiting on it, so there's no request timeout to
// respect — this is purely a guard against a corrupt/pathological input
// spinning ffmpeg forever and quietly eating CPU indefinitely.
const FFMPEG_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const FFPROBE_TIMEOUT_MS = 30 * 1000;

// Only one re-encode runs at a time, however many uploads land at once —
// ffmpeg is CPU-heavy, and this server also needs to keep serving normal
// requests. A short in-process queue is enough; nothing here needs to
// survive a restart, since a job that never got to run just leaves the
// original file in place, exactly as if compression didn't exist yet.
let queueTail: Promise<void> = Promise.resolve();
function runExclusive<T>(task: () => Promise<T>): Promise<T> {
  const result = queueTail.then(task, task);
  queueTail = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

type ProbeResult = {
  width: number;
  height: number;
  bitRate: number;
};

async function probeVideo(filePath: string): Promise<ProbeResult | null> {
  try {
    const { stdout } = await execFileAsync(
      ffprobePath,
      [
        '-v',
        'error',
        '-select_streams',
        'v:0',
        '-show_entries',
        'stream=width,height,bit_rate',
        '-show_entries',
        'format=bit_rate,size',
        '-of',
        'json',
        filePath,
      ],
      { timeout: FFPROBE_TIMEOUT_MS },
    );
    const parsed = JSON.parse(stdout) as {
      streams?: { width?: number; height?: number; bit_rate?: string }[];
      format?: { bit_rate?: string; size?: string };
    };
    const stream = parsed.streams?.[0];
    if (!stream?.width || !stream?.height) return null;

    // The video stream's own bit_rate is frequently absent (container-level
    // muxing doesn't always report it per-stream); the format-level rate
    // covers audio+video together, which is a fine proxy for "is this file
    // already lean" — it only feeds a skip heuristic, not the encode itself.
    const bitRate = Number(stream.bit_rate || parsed.format?.bit_rate || 0);

    return { width: stream.width, height: stream.height, bitRate };
  } catch (error) {
    console.warn(
      `ffprobe failed for ${filePath}, skipping compression:`,
      error,
    );
    return null;
  }
}

function buildScaleFilter(width: number, height: number): string | null {
  if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) return null;
  // Scale the long edge down to MAX_DIMENSION, derive the short edge from
  // it (rounded to an even number — h264 requires even dimensions), never
  // scale up. Handles portrait and landscape identically.
  return width >= height
    ? `scale=${MAX_DIMENSION}:-2`
    : `scale=-2:${MAX_DIMENSION}`;
}

/**
 * Re-encodes `filePath` to a sibling temp file, and only if that result is
 * genuinely smaller, atomically replaces the original with it. Returns the
 * new file size when a swap happened, or null when the original was left
 * untouched (compression skipped, failed, or didn't help).
 */
export async function compressInPlace(
  filePath: string,
): Promise<number | null> {
  const probe = await probeVideo(filePath);
  if (!probe) return null;

  if (probe.bitRate > 0 && probe.bitRate < SKIP_IF_BITRATE_BELOW_BPS) {
    return null;
  }

  const scaleFilter = buildScaleFilter(probe.width, probe.height);
  const tempPath = path.join(
    path.dirname(filePath),
    `.compressing-${path.basename(filePath)}`,
  );

  try {
    const args = [
      '-nostdin',
      '-y',
      '-i',
      filePath,
      ...(scaleFilter ? ['-vf', scaleFilter] : []),
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '24',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-movflags',
      '+faststart',
      tempPath,
    ];

    await execFileAsync(ffmpegPath as string, args, {
      timeout: FFMPEG_TIMEOUT_MS,
      killSignal: 'SIGKILL',
      maxBuffer: 16 * 1024 * 1024,
    });

    const [originalStat, compressedStat] = await Promise.all([
      fs.promises.stat(filePath),
      fs.promises.stat(tempPath),
    ]);

    if (compressedStat.size >= originalStat.size) {
      return null;
    }

    // Same directory, same filesystem — POSIX rename is atomic, so the file
    // being served under this exact path is either the full original or the
    // full compressed version, never a partial write.
    await fs.promises.rename(tempPath, filePath);
    return compressedStat.size;
  } catch (error) {
    console.warn(`Video compression failed for ${filePath}:`, error);
    return null;
  } finally {
    await fs.promises.unlink(tempPath).catch(() => undefined);
  }
}

export type VideoCompressionResult = {
  fileId: string;
  filePath: string;
  newSize: number;
};

/**
 * Fire-and-forget entry point. Never call this before the upload response
 * has already been sent (or is at least guaranteed to be sent regardless of
 * how long this takes) — nothing here is meant to be awaited by a request.
 */
export function scheduleVideoCompression(
  fileId: string,
  filePath: string,
  mimetype: string,
  size: number,
  onCompressed: (result: VideoCompressionResult) => void | Promise<void>,
): void {
  if (mimetype !== 'video/mp4') return;
  if (size < MIN_SIZE_TO_COMPRESS_BYTES) return;

  void runExclusive(async () => {
    try {
      if (!fs.existsSync(filePath)) return; // deleted before its turn came up
      const newSize = await compressInPlace(filePath);
      if (newSize === null) return;
      await onCompressed({ fileId, filePath, newSize });
    } catch (error) {
      // Belt and suspenders: runExclusive already isolates failures per
      // task, but this function must never let an exception escape into
      // whatever fired it without awaiting, which would otherwise surface
      // as an unhandled rejection.
      console.warn(
        `Background video compression errored for ${fileId}:`,
        error,
      );
    }
  });
}
