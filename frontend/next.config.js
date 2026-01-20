/**
 * DriftMirror Next.js Configuration
 * ============================================================
 * 
 * Security Features:
 * - Security headers (CSP, X-Frame-Options, etc.)
 * - X-Powered-By header removed
 * - API proxy (no direct backend exposure)
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove X-Powered-By header
  poweredByHeader: false,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Enable XSS filter
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Referrer policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions policy (disable unused features)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline/eval in dev
              "style-src 'self' 'unsafe-inline'", // Tailwind requires inline styles
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // API proxy - backend not directly exposed to client
  // Use beforeFiles to ensure rewrites happen before Next.js processing
  async rewrites() {
    return {
      beforeFiles: [
        // Rewrite API calls to backend - preserve trailing slashes
        {
          source: '/api/:path*/',
          destination: 'http://127.0.0.1:8000/api/:path*/',
        },
        {
          source: '/api/:path*',
          destination: 'http://127.0.0.1:8000/api/:path*/',
        },
      ],
    };
  },
};

module.exports = nextConfig;
