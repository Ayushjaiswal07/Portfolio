import type { NextConfig } from "next";
type RemotePattern = Exclude<NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number], URL>;

// Allow next/image to optimise files served from Supabase Storage.
const supabaseUrl = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  } catch {
    return null;
  }
})();

// Local Supabase (`npx supabase start`) serves storage from http://127.0.0.1:54321.
const isLocalSupabase =
  !!supabaseUrl && ["localhost", "127.0.0.1", "[::1]"].includes(supabaseUrl.hostname);

const remotePatterns: RemotePattern[] = [
  {
    protocol: "https",
    hostname: "**.supabase.co",
    pathname: "/storage/v1/object/public/**",
  },
];

if (supabaseUrl && !supabaseUrl.hostname.endsWith(".supabase.co")) {
  remotePatterns.push({
    protocol: supabaseUrl.protocol.replace(":", "") as "http" | "https",
    hostname: supabaseUrl.hostname,
    port: supabaseUrl.port,
    pathname: "/storage/v1/object/public/**",
  });
}

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image. Vercel ignores this.
  output: "standalone",
  images: {
    remotePatterns,
    // Only true when Supabase itself runs on this machine (local development).
    dangerouslyAllowLocalIP: isLocalSupabase,
  },
};

export default nextConfig;
