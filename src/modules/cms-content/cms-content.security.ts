const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
]);

const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

const hasControlCharacters = (value: string): boolean =>
  Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });

const hasUnsafeCharacters = (value: string): boolean =>
  hasControlCharacters(value) || value.includes('\\');

export const isSafeRootRelativePath = (
  value: string,
  uploadsOnly = false,
): boolean => {
  if (!value.startsWith('/') || value.startsWith('//')) return false;
  if (hasUnsafeCharacters(value)) return false;

  const pathname = value.split(/[?#]/, 1)[0];
  try {
    const decoded = decodeURIComponent(pathname);
    if (decoded.split('/').includes('..')) return false;
    return (
      !uploadsOnly || decoded === '/uploads' || decoded.startsWith('/uploads/')
    );
  } catch {
    return false;
  }
};

export const isHttpUrl = (value: string): boolean => {
  if (hasUnsafeCharacters(value)) return false;
  try {
    const url = new URL(value);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      Boolean(url.hostname)
    );
  } catch {
    return false;
  }
};

export const isHttpsUrl = (value: string): boolean => {
  if (hasUnsafeCharacters(value)) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
};

const isDevelopmentLoopbackUrl = (value: string): boolean => {
  if (process.env.NODE_ENV === 'production' || hasUnsafeCharacters(value)) {
    return false;
  }
  try {
    const url = new URL(value);
    return (
      url.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '::1'].includes(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
};

const isRenderableRemoteVideoUrl = (value: string): boolean =>
  isHttpsUrl(value) || isDevelopmentLoopbackUrl(value);

export const isSafeImageReference = (value: string): boolean =>
  isSafeRootRelativePath(value) || isHttpUrl(value);

export const isSafeYoutubeUrl = (value: string): boolean => {
  if (!isHttpsUrl(value)) return false;
  const url = new URL(value);
  const hostname = url.hostname.toLowerCase();

  if (hostname === 'youtu.be') {
    const parts = url.pathname.split('/').filter(Boolean);
    return parts.length === 1 && YOUTUBE_VIDEO_ID_PATTERN.test(parts[0]);
  }

  if (!YOUTUBE_HOSTS.has(hostname)) return false;

  const pathname = url.pathname.replace(/\/+$/, '') || '/';
  if (pathname === '/watch') {
    return YOUTUBE_VIDEO_ID_PATTERN.test(url.searchParams.get('v') ?? '');
  }

  const parts = pathname.split('/').filter(Boolean);
  return (
    parts.length === 2 &&
    (parts[0] === 'embed' || parts[0] === 'shorts') &&
    YOUTUBE_VIDEO_ID_PATTERN.test(parts[1])
  );
};

export const isSafeVideoReference = (
  source: 'youtube' | 'url' | 'upload',
  value: string,
): boolean => {
  if (typeof value !== 'string' || !value.trim()) return false;
  if (source === 'youtube') return isSafeYoutubeUrl(value);
  if (source === 'upload') {
    // Local storage can use /uploads/... (or a loopback URL outside
    // production) while remote object storage must be HTTPS.
    return (
      isSafeRootRelativePath(value, true) || isRenderableRemoteVideoUrl(value)
    );
  }
  if (source === 'url') return isRenderableRemoteVideoUrl(value);
  return false;
};

export const isSafeLinkReference = (value: string): boolean => {
  if (hasUnsafeCharacters(value)) return false;
  if (isSafeRootRelativePath(value)) return true;
  if (value.startsWith('#')) {
    return /^#[A-Za-z0-9][A-Za-z0-9_-]*$/.test(value);
  }
  if (isHttpUrl(value)) return true;

  if (value.startsWith('mailto:')) {
    const address = value.slice('mailto:'.length);
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address);
  }

  if (value.startsWith('tel:')) {
    return /^tel:\+?[0-9(). -]{5,30}$/.test(value);
  }

  return false;
};

/**
 * Markdown is stored as source and rendered by the frontend. Raw HTML and
 * executable/data protocols are disallowed so a permissive Markdown renderer
 * cannot turn managed legal copy into script-capable markup.
 */
export const isSafeMarkdown = (value: string): boolean => {
  if (hasControlCharacters(value.replace(/[\n\r\t]/g, ''))) {
    return false;
  }
  if (/<\/?[A-Za-z][^>]*>/.test(value)) return false;

  // Protocol names are ordinary prose (for example, "Data: we collect...").
  // Only inspect Markdown URL destinations, where a protocol can become an
  // executable link or image source.
  const destinations: string[] = [];
  const inlineDestination =
    /!?\[[^\]\r\n]*\]\(\s*(?:<([^>\r\n]+)>|([^\s)\r\n]+))/g;
  const referenceDestination =
    /^[ \t]{0,3}\[[^\]\r\n]+\]:\s*(?:<([^>\r\n]+)>|(\S+))/gm;

  for (const pattern of [inlineDestination, referenceDestination]) {
    for (const match of value.matchAll(pattern)) {
      destinations.push((match[1] ?? match[2] ?? '').trim());
    }
  }

  return destinations.every((destination) => {
    const decodedEntities = destination
      .replace(
        /&#(?:x([0-9a-f]{1,6})|([0-9]{1,7}));?/gi,
        (_match, hex: string | undefined, decimal: string | undefined) => {
          const codePoint = Number.parseInt(
            hex ?? decimal ?? '',
            hex ? 16 : 10,
          );
          return Number.isFinite(codePoint) && codePoint <= 0x10ffff
            ? String.fromCodePoint(codePoint)
            : '';
        },
      )
      .replace(/&(?:colon);/gi, ':')
      .replace(/&(?:tab|newline);/gi, ' ')
      .replace(/\s+/g, '');
    let normalized = decodedEntities;
    for (let pass = 0; pass < 2; pass += 1) {
      try {
        const decoded = decodeURIComponent(normalized);
        if (decoded === normalized) break;
        normalized = decoded;
      } catch {
        // A malformed escape cannot hide a literal unsafe scheme matched below.
        break;
      }
    }
    return !/^(?:javascript|vbscript|data):/i.test(normalized);
  });
};

export const normalizeMarkdown = (value: string): string =>
  value.replace(/\r\n?/g, '\n').trim();
