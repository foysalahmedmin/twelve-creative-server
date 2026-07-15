import { hasCompleteVideoRef } from '../lib/industry-media-patch';

describe('Industry media patch helpers', () => {
  it('preserves a complete existing admin video reference', () => {
    expect(
      hasCompleteVideoRef({
        source: 'youtube',
        value: 'https://youtu.be/admin-video',
      }),
    ).toBe(true);
  });

  it('identifies a reference with a missing value as incomplete', () => {
    expect(hasCompleteVideoRef({ source: 'youtube', value: '' })).toBe(false);
  });

  it('identifies a reference with an invalid source as incomplete', () => {
    expect(
      hasCompleteVideoRef({
        source: 'vimeo' as 'url',
        value: 'https://vimeo.com/admin-video',
      }),
    ).toBe(false);
  });

  it('identifies absent reel media as incomplete', () => {
    expect(hasCompleteVideoRef(null)).toBe(false);
  });
});
