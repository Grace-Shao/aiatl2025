"use client"

import { Timeline } from "@/components/timeline"
import { GameEventTracker } from "@/components/game-event-tracker"
import TwitterFeed from "@/components/TwitterFeed"
import { KeyMomentPopup } from "@/components/key-moment-popup"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Monitor, ExternalLink } from "lucide-react"

export default function Page() {
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoWindow, setVideoWindow] = useState<Window | null>(null)
  const [showForum, setShowForum] = useState(true)
  const [currentKeyMoment, setCurrentKeyMoment] = useState<{
    id: string
    time: number
    title: string
    description: string
  } | null>(null)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        console.log("[v0] Rejected message from:", event.origin)
        return
      }

      const { type, data } = event.data

      console.log("[v0] Received message:", type, data)

      switch (type) {
        case "VIDEO_TIME_UPDATE":
          setCurrentTime(data.currentTime)
          break
        case "VIDEO_DURATION":
          setDuration(data.duration)
          console.log("[v0] Duration set to:", data.duration)
          break
        case "VIDEO_PLAY_STATE":
          setIsPlaying(data.isPlaying)
          console.log("[v0] Play state set to:", data.isPlaying)
          break
      }
    }

    window.addEventListener("message", handleMessage)
    console.log("[v0] Main window listening for messages")

    return () => window.removeEventListener("message", handleMessage)
  }, [])

  const openVideoWindow = () => {
    const width = 1280
    const height = 720
    const left = window.screen.width - width - 100
    const top = 100

    const newWindow = window.open(
      "/video-player",
      "VideoPlayer",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes`,
    )

    if (newWindow) {
      setVideoWindow(newWindow)
      console.log("[v0] Video window opened")
    } else {
      console.log("[v0] Failed to open video window - popup might be blocked")
    }
  }

  return (
    <div className="min-h-screen gradient-primary">
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <Link
          href="/choose-game"
          className="inline-flex items-center text-gray-300 hover:text-white transition-colors mb-6"
        >
          <span className="mr-2">←</span> Back to Game Selection
        </Link>

        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-balance bg-gradient-to-r from-purple-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            PrizePicks Live Track
          </h1>
          <p className="text-muted-foreground mt-2">Your second screen sports companion</p>
        </header>

        <div className="mb-6 flex justify-center">
          <div className="flex flex-col items-center">
            <button
              onClick={openVideoWindow}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all hover:scale-105"
            >
              <Monitor className="h-5 w-5" />
              Open Video on Second Screen
              <ExternalLink className="h-4 w-4" />
            </button>
            {videoWindow && !videoWindow.closed && (
              <p className="text-sm text-gray-300 mt-2">✓ Video player is open on second screen</p>
            )}
          </div>
        </div>

        {/* Timeline Section */}
        <div className="w-full mb-8 flex justify-center">
          <div className="w-full max-w-6xl space-y-4">
            {/* Game Event Tracker - Shows recent events and auto-posts to forum */}
            <GameEventTracker 
              currentTime={currentTime} 
              isPlaying={isPlaying}
              onEventTriggered={(event) => {
                console.log('[Main] Event triggered:', event);
              }}
            />
            
            {/* Timeline Component */}
            <Timeline
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              onNewMoment={setCurrentKeyMoment}
            />
          </div>
        </div>
        
        {/* Twitter-Style Social Media Feed - Full Width */}
        <div className="w-full">
          <div className="max-w-2xl mx-auto border-x border-gray-800">
            <TwitterFeed />
          </div>
        </div>
      </div>

      {currentKeyMoment && (
        <KeyMomentPopup
          moment={currentKeyMoment}
          onClose={() => setCurrentKeyMoment(null)}
          onMakePost={() => {
            console.log("[v0] Make post for moment:", currentKeyMoment)
            setCurrentKeyMoment(null)
          }}
          onSendToGC={() => {
            console.log("[v0] Send to GC for moment:", currentKeyMoment)
            setCurrentKeyMoment(null)
          }}
        />
      )}
    </div>
  )
}