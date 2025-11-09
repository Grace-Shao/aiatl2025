"use client"

import { VideoPlayer } from "@/components/video-player"
import { useEffect } from "react"

export default function VideoPlayerPage() {
  const handleTimeUpdate = (time: number) => {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        {
          type: "VIDEO_TIME_UPDATE",
          data: { currentTime: time },
        },
        window.location.origin,
      )
    }
  }

  const handleDurationChange = (dur: number) => {
    console.log("[v0] Duration received:", dur)
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        {
          type: "VIDEO_DURATION",
          data: { duration: dur },
        },
        window.location.origin,
      )
    }
  }

  const handlePlayStateChange = (playing: boolean) => {
    console.log("[v0] Play state changed:", playing)
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        {
          type: "VIDEO_PLAY_STATE",
          data: { isPlaying: playing },
        },
        window.location.origin,
      )
    }
  }

  useEffect(() => {
    console.log("[v0] Video player page loaded")
    console.log("[v0] Has opener window:", !!window.opener)
  }, [])

  return (
    <div className="min-h-screen gradient-primary flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            Video Player - Second Screen
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Syncing with main timeline</p>
        </div>
        <VideoPlayer
          onTimeUpdate={handleTimeUpdate}
          onDurationChange={handleDurationChange}
          onPlayStateChange={handlePlayStateChange}
        />
      </div>
    </div>
  )
}
