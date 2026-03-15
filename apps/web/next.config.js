/** @type {import('next').NextConfig} */

// Runs at build time — visible in Railway build logs.
// Tells you exactly what URL the bundle will embed for API calls.
console.log('[next.config] NEXT_PUBLIC_API_URL =', process.env.NEXT_PUBLIC_API_URL ?? '(not set — will fall back to localhost:3001)');
console.log('[next.config] NODE_ENV =', process.env.NODE_ENV);

const nextConfig = {
  // Allow the dev server to be accessed from local network IPs (e.g. 192.168.x.x)
  // This is safe in a local dev environment — do not carry into production.
  allowedDevOrigins: ['*'],
};

module.exports = nextConfig;
