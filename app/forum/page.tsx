import Link from 'next/link';
import Forum from './Forum';

export const metadata = {
  title: 'Social Forum',
};

export default function ForumPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center text-gray-300 hover:text-white mb-6">
          <span className="mr-2">←</span> Home
        </Link>

        <div className="max-w-5xl mx-auto bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10">
          <h1 className="text-4xl font-bold text-white mb-2">Social Forum</h1>
          <p className="text-gray-300 mb-6">Community discussion — post threads, reply, and vote. Trending threads surface to the top.</p>

          <Forum />
        </div>
      </div>
    </div>
  );
}
