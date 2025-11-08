import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Transform Your Workflow with{' '}
            <span className="bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
              AI Power
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            Experience the next generation of intelligent automation.
            Simple, powerful, and built for everyone.
          </p>
          <Link href="/choose-game" className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:scale-105 transition-transform duration-200 shadow-lg hover:shadow-purple-500/50">
            Get Started Free
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Feature 1 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 border border-white/20">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-2xl font-bold text-white mb-3">Lightning Fast</h3>
            <p className="text-gray-300">
              Get instant results powered by cutting-edge AI technology.
              No waiting, no hassle.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 border border-white/20">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold text-white mb-3">Accurate Results</h3>
            <p className="text-gray-300">
              Advanced algorithms ensure precision and reliability in every task.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 border border-white/20">
            <div className="text-4xl mb-4">💡</div>
            <h3 className="text-2xl font-bold text-white mb-3">Easy to Use</h3>
            <p className="text-gray-300">
              Intuitive interface designed for everyone. No technical knowledge required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
