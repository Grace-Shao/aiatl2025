"use client"

import { Timeline } from "@/components/timeline"
import { useState, useEffect } from "react"
import Link from "next/link"
import Forum from "@/app/forum/Forum"
import { ChevronDown, ChevronUp, Monitor, ExternalLink } from "lucide-react"

export default function Page() {
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoWindow, setVideoWindow] = useState<Window | null>(null)
  const [showForum, setShowForum] = useState(true)

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
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/choose-game"
          className="inline-flex items-center text-gray-300 hover:text-white transition-colors mb-6"
        >
          <span className="mr-2">←</span> Back to Game Selection
        </Link>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-balance bg-gradient-to-r from-purple-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            PrizePicks Live Track
          </h1>
          <p className="text-muted-foreground mt-2">Your second screen sports companion</p>
        </header>

        <div className="mb-6">
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

        {/* Timeline Section */}
        <div className="max-w-6xl mb-8">
          <Timeline currentTime={currentTime} duration={duration} isPlaying={isPlaying} />
        </div>
        
        {/* Bottom Section - Social Forum & Group Chats */}
        <div className="max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Social Forum Box - Left Half */}
          <div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
              {/* Header - Always Visible */}
              <button
                onClick={() => setShowForum(!showForum)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <h3 className="font-semibold text-white text-lg">Social / Forum</h3>
                {showForum ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>
              
              {/* Collapsible Content */}
              <div className={`transition-all duration-300 ease-in-out ${
                showForum ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
              } overflow-hidden`}>
                <div className="border-t border-white/10">
                  <Forum />
                </div>
              </div>
            </div>
          </div>
          
          {/* Group Chats - Right Half */}
          <div>
            <div className="grid grid-cols-2 gap-4">
              {/* 4 Chat boxes in 2x2 grid */}
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 h-48 flex items-center justify-center hover:border-white/30 transition-colors">
                  <p className="text-gray-400">Group Chat {i}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}