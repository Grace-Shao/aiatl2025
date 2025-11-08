import Link from 'next/link';
import Forum from '../forum/Forum';

export default function MainView() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-20">
        {/* Back Button */}
        <Link 
          href="/choose-game" 
          className="inline-flex items-center text-gray-300 hover:text-white transition-colors mb-8"
        >
          <span className="mr-2">←</span> Back to Choose Game
        </Link>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/20">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Main View
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Live discussion, memes, and timeline for in-game key moments.
            </p>

            {/* Forum */}
            <Forum />
          </div>
        </div>
      </div>
    </div>
  );
}

