import Link from 'next/link';

// Prevent Next.js from trying to collect page data
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900">404</h1>
          <h2 className="text-2xl font-semibold text-gray-600 mb-4">Page Not Found</h2>
          <p className="text-lg text-gray-500 max-w-md mx-auto">
            The page you are looking for could not be found. It might have been moved, deleted, or you might have typed the wrong URL.
          </p>
        </div>

        <div className="space-x-4">
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Go Home
          </Link>

          <Link
            href="/browse"
            className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            Browse Apps
          </Link>
        </div>
      </div>
    </div>
  );
}