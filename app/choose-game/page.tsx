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
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Welcome to Your AI App
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              This is a template page ready for your content. You can add any features,
              forms, or interactive elements here.
            </p>

            {/* Placeholder Content Area */}
            <div className="space-y-6">
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h2 className="text-2xl font-semibold text-white mb-3">
                  Content Section 1
                </h2>
                <p className="text-gray-300">
                  Add your content here. This could be a form, dashboard, or any feature
                  you need for your AI app.
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h2 className="text-2xl font-semibold text-white mb-3">
                  Content Section 2
                </h2>
                <p className="text-gray-300">
                  Another section ready for your custom content and functionality.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

