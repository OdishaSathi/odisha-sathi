import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.odishasathi.in" }],
        destination: "https://odishasathi.in/:path*",
        permanent: true,
      },
      {
        source: "/tools/:path*",
        destination: "/citizen-services",
        permanent: true,
      },
      {
        source: "/tools",
        destination: "/citizen-services",
        permanent: true,
      },
      {
        source: "/admin/tools/:path*",
        destination: "/admin/citizen-services",
        permanent: false,
      },
      {
        source: "/admin/tools",
        destination: "/admin/citizen-services",
        permanent: false,
      },
      {
        source: "/schemes/:path*",
        destination: "/admissions",
        permanent: true,
      },
      {
        source: "/schemes",
        destination: "/admissions",
        permanent: true,
      },
      {
        source: "/scholarships/:path*",
        destination: "/admissions",
        permanent: true,
      },
      {
        source: "/scholarships",
        destination: "/admissions",
        permanent: true,
      },
      {
        source: "/admin/schemes/:path*",
        destination: "/admin/admissions",
        permanent: false,
      },
      {
        source: "/admin/schemes",
        destination: "/admin/admissions",
        permanent: false,
      },
      {
        source: "/category/schemes",
        destination: "/admissions",
        permanent: true,
      },
      {
        source: "/category/scholarships",
        destination: "/admissions",
        permanent: true,
      },
      {
        source: "/category/tools",
        destination: "/citizen-services",
        permanent: true,
      },
      {
        source: "/category/pdf-tools",
        destination: "/citizen-services",
        permanent: true,
      },
      {
        source: "/category/image-tools",
        destination: "/citizen-services",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "images.unsplash.com" }
    ]
  }
};

export default nextConfig;
