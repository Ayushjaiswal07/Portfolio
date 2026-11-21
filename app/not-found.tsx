import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-semibold text-accent">404</p>
      <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="text-muted">The page you are looking for doesn&apos;t exist or was moved.</p>
      <Link href="/" className="btn btn-primary mt-2">
        Back home
      </Link>
    </div>
  );
}
