/**
 * Static application config.
 *
 * Rules:
 *   - Values that are the same in every environment → hardcode them here.
 *   - Values that differ between dev / staging / prod → use NEXT_PUBLIC_* env vars.
 *
 * This keeps .env files for secrets and environment-specific runtime values only
 * (DATABASE_URL, API keys, API base URLs, etc.).
 */
export const config = {
  links: {
    docs: 'https://github.com/SunnyBe/envsync#readme',
    issues: 'https://github.com/SunnyBe/envsync/issues/new',
    contact: 'ndusunday@gmail.com',
  },
} as const;
