import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright builds into a separate directory so e2e runs never clobber `.next`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  transpilePackages: ["@roll/shared"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // camera/microphone stay allowed: the extension's camera bubble iframe
          // must work when recording Roll's own pages.
          { key: "Permissions-Policy", value: "geolocation=(), payment=(), usb=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
