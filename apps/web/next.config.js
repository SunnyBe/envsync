/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow the dev server to be accessed from local network IPs (e.g. 192.168.x.x)
  // This is safe in a local dev environment — do not carry into production.
  allowedDevOrigins: ['*'],
};

module.exports = nextConfig;
