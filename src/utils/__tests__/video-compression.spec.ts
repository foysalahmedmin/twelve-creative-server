// execFile is promisified internally via util.promisify — the mock must
// follow Node's (args..., callback) => void shape so promisify's wrapper
// resolves/rejects correctly, exactly as the real child_process API does.
const execFileMock = jest.fn();
jest.mock('child_process', () => ({
  execFile: (...args: any[]) => execFileMock(...args),
}));

jest.mock('ffmpeg-static', () => '/fake/ffmpeg');
jest.mock('ffprobe-static', () => ({ path: '/fake/ffprobe' }));

const statMock = jest.fn();
const renameMock = jest.fn();
const unlinkMock = jest.fn();
const existsSyncMock = jest.fn();
jest.mock('fs', () => ({
  existsSync: (...args: any[]) => existsSyncMock(...args),
  promises: {
    stat: (...args: any[]) => statMock(...args),
    rename: (...args: any[]) => renameMock(...args),
    unlink: (...args: any[]) => unlinkMock(...args),
  },
}));

import { scheduleVideoCompression } from '../video-compression';

const PROBE_ARGS_MARKER = '-show_entries';

/** True while the mocked execFile call was ffprobe (vs. the ffmpeg encode). */
const isProbeCall = (args: unknown[]) =>
  Array.isArray(args[1]) && (args[1] as string[]).includes(PROBE_ARGS_MARKER);

const succeedCallback = (args: unknown[], stdout = ''): void => {
  const callback = args[args.length - 1] as (
    err: Error | null,
    result: { stdout: string; stderr: string },
  ) => void;
  callback(null, { stdout, stderr: '' });
};

const failCallback = (args: unknown[], error: Error): void => {
  const callback = args[args.length - 1] as (err: Error) => void;
  callback(error);
};

const probeJson = (overrides: {
  width?: number;
  height?: number;
  bitRate?: string;
  formatBitRate?: string;
}): string =>
  JSON.stringify({
    streams: [
      {
        width: overrides.width ?? 2160,
        height: overrides.height ?? 3840,
        bit_rate: overrides.bitRate,
      },
    ],
    format: { bit_rate: overrides.formatBitRate ?? '8000000' },
  });

describe('scheduleVideoCompression', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    existsSyncMock.mockReturnValue(true);
  });

  const wait = () => new Promise((resolve) => setImmediate(resolve));

  it('does nothing for a non-video/mp4 mimetype', async () => {
    const onCompressed = jest.fn();
    scheduleVideoCompression(
      'id1',
      '/f.webm',
      'video/webm',
      20_000_000,
      onCompressed,
    );
    await wait();
    expect(execFileMock).not.toHaveBeenCalled();
    expect(onCompressed).not.toHaveBeenCalled();
  });

  it('does nothing for a file below the size floor', async () => {
    const onCompressed = jest.fn();
    scheduleVideoCompression(
      'id1',
      '/f.mp4',
      'video/mp4',
      1_000_000,
      onCompressed,
    );
    await wait();
    expect(execFileMock).not.toHaveBeenCalled();
    expect(onCompressed).not.toHaveBeenCalled();
  });

  it('skips (no throw, no callback) when ffprobe fails', async () => {
    const onCompressed = jest.fn();
    execFileMock.mockImplementation((...args: any[]) =>
      failCallback(args, new Error('not a video')),
    );

    scheduleVideoCompression(
      'id1',
      '/f.mp4',
      'video/mp4',
      20_000_000,
      onCompressed,
    );
    await wait();
    await wait();

    expect(onCompressed).not.toHaveBeenCalled();
  });

  it('skips a file whose bitrate is already lean', async () => {
    const onCompressed = jest.fn();
    execFileMock.mockImplementation((...args: any[]) => {
      if (isProbeCall(args)) {
        succeedCallback(
          args,
          probeJson({ formatBitRate: '2000000' }), // 2 Mbps — below the floor
        );
      }
    });

    scheduleVideoCompression(
      'id1',
      '/f.mp4',
      'video/mp4',
      20_000_000,
      onCompressed,
    );
    await wait();
    await wait();

    // Only the probe should have run — never the encode.
    expect(execFileMock).toHaveBeenCalledTimes(1);
    expect(onCompressed).not.toHaveBeenCalled();
  });

  it('swaps the file and reports the new size when the encode is smaller', async () => {
    const onCompressed = jest.fn();
    execFileMock.mockImplementation((...args: any[]) => {
      if (isProbeCall(args)) {
        succeedCallback(args, probeJson({}));
      } else {
        succeedCallback(args, '');
      }
    });
    statMock.mockImplementation((p: string) =>
      Promise.resolve({ size: p.includes('.compressing-') ? 500 : 1000 }),
    );
    renameMock.mockResolvedValue(undefined);
    unlinkMock.mockResolvedValue(undefined);

    scheduleVideoCompression(
      'id1',
      '/dir/f.mp4',
      'video/mp4',
      20_000_000,
      onCompressed,
    );
    await wait();
    await wait();
    await wait();

    expect(renameMock).toHaveBeenCalledWith(
      '/dir/.compressing-f.mp4',
      '/dir/f.mp4',
    );
    expect(onCompressed).toHaveBeenCalledWith({
      fileId: 'id1',
      filePath: '/dir/f.mp4',
      newSize: 500,
    });
  });

  it('keeps the original and never renames when the encode is not smaller', async () => {
    const onCompressed = jest.fn();
    execFileMock.mockImplementation((...args: any[]) => {
      if (isProbeCall(args)) {
        succeedCallback(args, probeJson({}));
      } else {
        succeedCallback(args, '');
      }
    });
    // Compressed result is larger than the original.
    statMock.mockImplementation((p: string) =>
      Promise.resolve({ size: p.includes('.compressing-') ? 2000 : 1000 }),
    );
    unlinkMock.mockResolvedValue(undefined);

    scheduleVideoCompression(
      'id1',
      '/dir/f.mp4',
      'video/mp4',
      20_000_000,
      onCompressed,
    );
    await wait();
    await wait();
    await wait();

    expect(renameMock).not.toHaveBeenCalled();
    expect(onCompressed).not.toHaveBeenCalled();
    // The (larger) temp file is still cleaned up either way.
    expect(unlinkMock).toHaveBeenCalledWith('/dir/.compressing-f.mp4');
  });

  it('never throws and never calls back when the encode itself fails', async () => {
    const onCompressed = jest.fn();
    execFileMock.mockImplementation((...args: any[]) => {
      if (isProbeCall(args)) {
        succeedCallback(args, probeJson({}));
      } else {
        failCallback(args, new Error('ffmpeg crashed'));
      }
    });
    unlinkMock.mockResolvedValue(undefined);

    expect(() =>
      scheduleVideoCompression(
        'id1',
        '/dir/f.mp4',
        'video/mp4',
        20_000_000,
        onCompressed,
      ),
    ).not.toThrow();
    await wait();
    await wait();
    await wait();

    expect(renameMock).not.toHaveBeenCalled();
    expect(onCompressed).not.toHaveBeenCalled();
  });

  it('does not run compression at all if the file was deleted before its turn', async () => {
    const onCompressed = jest.fn();
    existsSyncMock.mockReturnValue(false);

    scheduleVideoCompression(
      'id1',
      '/dir/f.mp4',
      'video/mp4',
      20_000_000,
      onCompressed,
    );
    await wait();

    expect(execFileMock).not.toHaveBeenCalled();
    expect(onCompressed).not.toHaveBeenCalled();
  });

  it('never lets onCompressed throwing escape as an unhandled rejection', async () => {
    execFileMock.mockImplementation((...args: any[]) => {
      if (isProbeCall(args)) {
        succeedCallback(args, probeJson({}));
      } else {
        succeedCallback(args, '');
      }
    });
    statMock.mockImplementation((p: string) =>
      Promise.resolve({ size: p.includes('.compressing-') ? 500 : 1000 }),
    );
    renameMock.mockResolvedValue(undefined);
    unlinkMock.mockResolvedValue(undefined);

    const throwingCallback = jest.fn().mockRejectedValue(new Error('DB down'));

    scheduleVideoCompression(
      'id1',
      '/dir/f.mp4',
      'video/mp4',
      20_000_000,
      throwingCallback,
    );
    await wait();
    await wait();
    await wait();

    expect(throwingCallback).toHaveBeenCalled();
    // If this test file completes without Jest reporting an unhandled
    // rejection, the failure was contained as intended.
  });

  it('runs compressions one at a time, never overlapping', async () => {
    const started: string[] = [];
    const finished: string[] = [];
    let releaseFirst: () => void = () => undefined;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    execFileMock.mockImplementation(async (...args: any[]) => {
      if (!isProbeCall(args)) {
        return succeedCallback(args, '');
      }
      const filePath = args[1][args[1].length - 1] as string;
      started.push(filePath);
      if (filePath === '/dir/first.mp4') {
        await firstGate;
      }
      finished.push(filePath);
      succeedCallback(args, probeJson({ formatBitRate: '2000000' })); // skip encode either way
    });

    scheduleVideoCompression(
      'a',
      '/dir/first.mp4',
      'video/mp4',
      20_000_000,
      jest.fn(),
    );
    scheduleVideoCompression(
      'b',
      '/dir/second.mp4',
      'video/mp4',
      20_000_000,
      jest.fn(),
    );

    await wait();
    // The second job's probe must not have started while the first is still
    // pending — that's the entire point of the queue.
    expect(started).toEqual(['/dir/first.mp4']);

    releaseFirst();
    await wait();
    await wait();

    expect(started).toEqual(['/dir/first.mp4', '/dir/second.mp4']);
    expect(finished).toEqual(['/dir/first.mp4', '/dir/second.mp4']);
  });
});
