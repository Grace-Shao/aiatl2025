"use client"

import { Timeline } from "@/components/timeline"
import { GameEventTracker } from "@/components/game-event-tracker"
import TwitterFeed from "@/components/TwitterFeed"
import { KeyMomentPopup } from "@/components/key-moment-popup"
import { MessagesPanel } from "@/components/messages-panel"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Monitor, ExternalLink, MessageCircle } from "lucide-react"

export default function Page() {
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoWindow, setVideoWindow] = useState<Window | null>(null)
  const [showForum, setShowForum] = useState(true)
  const [isMessagesOpen, setIsMessagesOpen] = useState(false)
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
    <div className="min-h-screen h-screen overflow-hidden gradient-primary">
      <div className="w-full mx-auto px-6 sm:px-8 pt-8 pb-0">
        {/* Top bar: HypeX left + Open Video button right */}
        <div className="mb-3 flex items-center justify-between">
          <div className="text-left py-1">
            <h1 className="ml-2 sm:ml-4 text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-purple-400 via-purple-300 to-pink-400 bg-clip-text text-transparent leading-tight pb-2">
              HypeZone
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMessagesOpen(true)}
              className="text-white hover:bg-white/10 p-2 rounded-md transition-all"
              aria-label="Open messages"
            >
              <MessageCircle className="h-6 w-6" />
            </button>
            <button
              onClick={openVideoWindow}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-3 py-2 rounded-md font-medium flex items-center gap-2 transition-all"
              aria-label="Open video on second screen"
            >
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">Open Video</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
        {/* Removed back link and centered title as requested */}

  {/* Side-by-side layout: left timeline + right social feed */}
  <div className="w-full flex flex-col lg:flex-row items-start gap-6 h-[calc(100vh-150px)] -mt-2">
          {/* Left column: tracker + timeline (auto height, not stretched) */}
          <div className="w-full lg:w-1/2 lg:shrink-0 space-y-3 px-2 lg:px-4 lg:self-center overflow-hidden">
            {/* Section title + tagline above timeline - centered */}
            <div className="text-center -mt-1">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Live Hype Feed & Timeline</h2>
              <p className="mt-1 text-base sm:text-lg text-gray-300/90">Real-time sports hype engine — moments, stats, and memes in one stream.</p>
            </div>
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

          {/* Right column: Twitter-style feed fills page height with scrollbar */}
          <div className="w-full lg:w-1/2 min-w-0 px-2 lg:px-4 h-full overflow-y-auto">
            <TwitterFeed />
          </div>
        </div>
      </div>

      {/* {currentKeyMoment && (
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
      )} */}

      <MessagesPanel isOpen={isMessagesOpen} onClose={() => setIsMessagesOpen(false)} />
    </div>
  )
}