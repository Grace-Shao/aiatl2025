import Link from 'next/link';

export default function ChooseGame() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-20">
        {/* Back Button */}
        <Link 
          href="/" 
          className="inline-flex items-center text-gray-300 hover:text-white transition-colors mb-8"
        >
          <span className="mr-2">←</span> Back to Home
        </Link>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/20">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🏈</div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Choose Your Game
              </h1>
              <p className="text-xl text-gray-300">
                Select a sports game to analyze with AI-powered insights
              </p>
            </div>

            {/* Game Selection Buttons */}
            <div className="space-y-6">
              <Link 
                href="/main-view"
                className="block bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-4xl">🏈</span>
                  <h2 className="text-2xl font-semibold text-white group-hover:text-purple-300 transition-colors">
                    NFL Game Today
                  </h2>
                </div>
                <p className="text-gray-300 ml-14">
                  Predictions, player stats, and strategic insights for NFL matchups.
                  Perfect for fantasy football and game-day decisions.
                </p>
              </Link>

              <Link 
                href="/main-view"
                className="block bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-4xl">⚽</span>
                  <h2 className="text-2xl font-semibold text-white group-hover:text-purple-300 transition-colors">
                    Basketball Game Today
                  </h2>
                </div>
                <p className="text-gray-300 ml-14">
                  Predictions, player stats, and strategic insights for NBA matchups.
                  Perfect for fantasy basketball and game-day decisions.
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

