import Link from "next/link"
import Image from "next/image"
import { Play, Zap, Users, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background with sports action image effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950/40 to-black">
          <div className="absolute inset-0 bg-[url('/intense-sports-action-crowd-celebrating.jpg')] bg-cover bg-center opacity-30 mix-blend-luminosity" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-7xl md:text-9xl font-black mb-6 tracking-tighter">
            <span className="block text-white">HYPE</span>
            <span className="block bg-gradient-to-r from-purple-400 via-purple-600 to-pink-600 text-transparent bg-clip-text">
              ZONE
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto font-light">
            Your ultimate second screen companion. Never miss a key moment. Feel every play.
          </p>

          <div className="flex justify-center items-center">
            <Link href="/choose-game">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg font-bold rounded-full border-0 shadow-2xl shadow-purple-600/50 hover:scale-105 transition-all duration-300"
              >
                ENTER THE ZONE
                <Play className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-black mb-4 tracking-tight">
            THE <span className="text-purple-500">WINNING</span> FORMULA
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Real-time highlights, instant reactions, zero delays
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Feature 1 */}
          <div className="group relative bg-gradient-to-br from-purple-950/50 to-black border border-purple-800/30 rounded-2xl p-8 hover:border-purple-600/50 transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-purple-600/0 group-hover:from-purple-600/10 group-hover:to-pink-600/10 rounded-2xl transition-all duration-300" />
            <div className="relative">
              <div className="mb-6 w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">INSTANT HIGHLIGHTS</h3>
              <p className="text-gray-400 leading-relaxed">
                Key moments captured in real-time. Never miss a touchdown, buzzer beater, or game-changing play.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="group relative bg-gradient-to-br from-purple-950/50 to-black border border-purple-800/30 rounded-2xl p-8 hover:border-purple-600/50 transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-purple-600/0 group-hover:from-purple-600/10 group-hover:to-pink-600/10 rounded-2xl transition-all duration-300" />
            <div className="relative">
              <div className="mb-6 w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">SOCIAL HYPE</h3>
              <p className="text-gray-400 leading-relaxed">
                Share reactions instantly with your squad. Post highlights, join group chats, and feel the energy.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="group relative bg-gradient-to-br from-purple-950/50 to-black border border-purple-800/30 rounded-2xl p-8 hover:border-purple-600/50 transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-purple-600/0 group-hover:from-purple-600/10 group-hover:to-pink-600/10 rounded-2xl transition-all duration-300" />
            <div className="relative">
              <div className="mb-6 w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">LIVE TIMELINE</h3>
              <p className="text-gray-400 leading-relaxed">
                Track the game flow with visual timelines. See momentum shifts and pivotal moments at a glance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-3xl" />
          <div className="relative bg-gradient-to-br from-purple-950/80 to-black border border-purple-700/50 rounded-3xl p-12 md:p-16">
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">READY TO ELEVATE YOUR GAME?</h2>
            <p className="text-xl text-gray-400 mb-8 leading-relaxed">
              Join thousands of fans experiencing sports like never before
            </p>
            <Link href="/choose-game">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-12 py-6 text-xl font-bold rounded-full border-0 shadow-2xl shadow-purple-600/50 hover:scale-105 transition-all duration-300"
              >
                START NOW
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
