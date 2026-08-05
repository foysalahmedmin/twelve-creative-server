/**
 * Placeholder clips for a fresh install, one per orientation.
 *
 * Stable, HTTPS, CC0 fallback media. Client-owned project footage can replace
 * these references through the admin without changing the seed contract.
 *
 * YouTube links rather than hot-linked media files: the sample .mp4 that used
 * to sit here was served from a third-party host that has since stopped
 * serving it, so a freshly seeded site came up with every player broken.
 */

export const SAMPLE_REEL_VIDEO = 'https://www.youtube.com/shorts/sOxloXyOAKA';
export const SAMPLE_LANDSCAPE_VIDEO = 'https://youtu.be/668nUCeBHyY';

export const reelVideo = () => ({
  source: 'youtube' as const,
  value: SAMPLE_REEL_VIDEO,
});

export const landscapeVideo = () => ({
  source: 'youtube' as const,
  value: SAMPLE_LANDSCAPE_VIDEO,
});
