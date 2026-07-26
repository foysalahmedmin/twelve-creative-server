import {
  isSafeImageReference,
  isSafeLinkReference,
  isSafeMarkdown,
  isSafeVideoReference,
} from '../cms-content.security';

describe('CMS content security', () => {
  it('accepts safe local and remote image references', () => {
    expect(isSafeImageReference('/uploads/images/work.jpg')).toBe(true);
    expect(isSafeImageReference('https://cdn.example.com/work.jpg')).toBe(true);
  });

  it.each([
    '//evil.example/image.jpg',
    '/uploads/../secret.jpg',
    '/uploads/%2e%2e/secret.jpg',
    'javascript:alert(1)',
    '/uploads\\secret.jpg',
  ])('rejects unsafe image reference %s', (value) => {
    expect(isSafeImageReference(value)).toBe(false);
  });

  it.each([
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://youtube.com/embed/dQw4w9WgXcQ',
    'https://m.youtube.com/shorts/dQw4w9WgXcQ',
  ])('accepts a playable YouTube URL form: %s', (value) => {
    expect(isSafeVideoReference('youtube', value)).toBe(true);
  });

  it.each([
    'https://www.youtube.com/',
    'https://www.youtube.com/watch',
    'https://www.youtube.com/watch?v=too-short',
    'https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ',
    'http://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
  ])('rejects a non-playable or insecure YouTube URL: %s', (value) => {
    expect(isSafeVideoReference('youtube', value)).toBe(false);
  });

  it('validates direct and uploaded video locations by source', () => {
    expect(
      isSafeVideoReference('url', 'https://media.example.com/video.mp4'),
    ).toBe(true);
    expect(
      isSafeVideoReference('url', 'http://media.example.com/video.mp4'),
    ).toBe(false);
    expect(isSafeVideoReference('upload', '/uploads/video/demo.mp4')).toBe(
      true,
    );
    expect(
      isSafeVideoReference(
        'upload',
        'https://storage.googleapis.com/twelve-creative/video.mp4',
      ),
    ).toBe(true);
    expect(
      isSafeVideoReference(
        'upload',
        'http://127.0.0.1:5003/uploads/files/video.mp4',
      ),
    ).toBe(true);
    expect(
      isSafeVideoReference(
        'upload',
        'http://storage.example.com/twelve-creative/video.mp4',
      ),
    ).toBe(false);
    expect(isSafeVideoReference('upload', '/private/video.mp4')).toBe(false);
    expect(
      isSafeVideoReference(
        'vimeo' as never,
        'https://media.example.com/video.mp4',
      ),
    ).toBe(false);
    expect(isSafeVideoReference('url', undefined as never)).toBe(false);
  });

  it('allows supported CTA links and rejects executable protocols', () => {
    expect(isSafeLinkReference('/contact?from=home')).toBe(true);
    expect(isSafeLinkReference('#workwithus')).toBe(true);
    expect(isSafeLinkReference('mailto:hello@example.com')).toBe(true);
    expect(isSafeLinkReference('tel:+1 (951) 822-6223')).toBe(true);
    expect(isSafeLinkReference('https://example.com/contact')).toBe(true);
    expect(isSafeLinkReference('javascript:alert(1)')).toBe(false);
  });

  it('rejects raw HTML and executable protocols in Markdown', () => {
    expect(isSafeMarkdown('# Privacy\n\nApproved copy.')).toBe(true);
    expect(isSafeMarkdown('<script>alert(1)</script>')).toBe(false);
    expect(isSafeMarkdown('[click](javascript:alert(1))')).toBe(false);
  });

  it('allows protocol-like words in ordinary legal prose', () => {
    expect(
      isSafeMarkdown(
        '## Data: We collect information\n\nJavaScript: disabled clients remain supported.',
      ),
    ).toBe(true);
  });

  it.each([
    '[click][unsafe]\n\n[unsafe]: javascript:alert(1)',
    '![pixel](data:image/svg+xml;base64,PHN2Zz4=)',
    '[click](javascript&#58;alert(1))',
    '[click](java&#x73;cript:alert(1))',
    '[click](java&Tab;script&colon;alert(1))',
    '[click](javascript%3Aalert(1))',
    '[click](javascript%253Aalert(1))',
  ])('rejects an obfuscated unsafe Markdown destination', (markdown) => {
    expect(isSafeMarkdown(markdown)).toBe(false);
  });
});
