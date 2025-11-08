"use client"

import { Card } from "@/components/ui/card"

interface TimelineProps {
  currentTime: number
  duration: number
  isPlaying: boolean
}

export function Timeline({ currentTime, duration, isPlaying }: TimelineProps) {
  // Format time in MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Calculate progress percentage
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <Card className="p-6 h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
          <span className="text-2xl">🕐</span>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Live Timeline</h2>
          <p className="text-sm text-gray-300">{isPlaying ? "Tracking in real-time" : "Paused"}</p>
        </div>
      </div>

      {/* Time Display */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-2xl font-bold text-purple-400">{formatTime(currentTime)}</span>
          <span className="text-sm text-gray-400">{formatTime(duration)}</span>
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-200 ease-linear"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Timeline Events Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Key Moments</h3>

        <div className="space-y-3">
          {/* Placeholder for future key moments */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-700/50 border border-gray-600">
            <div className="h-2 w-2 rounded-full bg-purple-500 mt-2" />
            <div className="flex-1">
              <p className="text-sm text-gray-300">Key moments will appear here as the game progresses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-gray-700/30">
            <div className="text-2xl font-bold text-white">{Math.floor(progress)}%</div>
            <div className="text-xs text-gray-400 mt-1">Complete</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-gray-700/30">
            <div className="text-2xl font-bold text-white">{formatTime(duration - currentTime)}</div>
            <div className="text-xs text-gray-400 mt-1">Remaining</div>
          </div>
        </div>
      </div>
    </Card>
  )
}

