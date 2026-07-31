/* eslint-disable no-console */
/**
 * Pushes LEGAL_PAGE_SEED to a running API via PUT /api/legal-pages/:slug.
 *
 * Use this instead of the seed runner when the records already exist and you
 * only want to update their copy — the seed's non-force path skips existing
 * slugs, and its force path would drop the collection.
 *
 * Usage:
 *   API_BASE=https://twelvecreative.io \
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... \
 *   npx ts-node src/scripts/push-legal-pages.ts
 */
import { LEGAL_PAGE_SEED } from './seeds/legal-page.seed';

const API_BASE = process.env.API_BASE || 'http://localhost:5000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required');
  }

  const signin = await fetch(`${API_BASE}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const signinBody = (await signin.json()) as {
    data?: { token?: string };
    message?: string;
  };
  const token = signinBody?.data?.token;
  if (!token) throw new Error(`Sign-in failed: ${signinBody?.message}`);
  console.log(`signed in against ${API_BASE}`);

  for (const page of LEGAL_PAGE_SEED) {
    const res = await fetch(`${API_BASE}/api/legal-pages/${page.slug}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify({
        slug: page.slug,
        title: page.title,
        markdown: page.markdown,
        effective_date:
          page.effective_date instanceof Date
            ? page.effective_date.toISOString()
            : page.effective_date,
        seo: page.seo,
        is_published: page.is_published,
      }),
    });

    const body = (await res.json()) as {
      success?: boolean;
      message?: string;
      errorSources?: { path: string; message: string }[];
    };

    if (!res.ok || body.success === false) {
      console.error(
        `  ✗ ${page.slug}: ${res.status} ${body.message}`,
        body.errorSources ?? '',
      );
      process.exitCode = 1;
      continue;
    }
    console.log(
      `  ✓ ${page.slug}: published=${page.is_published}, ${page.markdown.length} chars`,
    );
  }
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
