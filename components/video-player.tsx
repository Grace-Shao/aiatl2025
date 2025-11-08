"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  onTimeUpdate?: (time: number) => void
  onDurationChange?: (duration: number) => void
  onPlayStateChange?: (isPlaying: boolean) => void
}

export function VideoPlayer({ onTimeUpdate, onDurationChange, onPlayStateChange }: VideoPlayerProps) {
  const playerRef = useRef<any>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isReady, setIsReady] = useState(false)

  const onTimeUpdateRef = useRef(onTimeUpdate)
  const onDurationChangeRef = useRef(onDurationChange)
  const onPlayStateChangeRef = useRef(onPlayStateChange)

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate
    onDurationChangeRef.current = onDurationChange
    onPlayStateChangeRef.current = onPlayStateChange
  }, [onTimeUpdate, onDurationChange, onPlayStateChange])

  // YouTube video ID
  const videoId = "q7Asmb749xY"

  useEffect(() => {
    if ((window as any).YT && (window as any).YT.Player) {
      initializePlayer()
    } else {
      // Load YouTube IFrame API
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

      // Create YouTube player when API is ready
      ;(window as any).onYouTubeIframeAPIReady = () => {
        initializePlayer()
      }
    }

    function initializePlayer() {
      console.log("[v0] Initializing YouTube player")
      const ytPlayer = new (window as any).YT.Player("youtube-player", {
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            console.log("[v0] YouTube player ready")
            playerRef.current = event.target
            setIsReady(true)
            const duration = event.target.getDuration()
            console.log("[v0] Video duration:", duration)
            onDurationChangeRef.current?.(duration)
          },
          onStateChange: (event: any) => {
            const playing = event.data === (window as any).YT.PlayerState.PLAYING
            console.log("[v0] Player state changed, playing:", playing)
            setIsPlaying(playing)
            onPlayStateChangeRef.current?.(playing)
          },
        },
      })
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy()
      }
    }
  }, [])

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    if (!playerRef.current || !isPlaying) return

    console.log("[v0] Starting time update interval")
    intervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const currentTime = playerRef.current.getCurrentTime()
        onTimeUpdateRef.current?.(currentTime)
      }
    }, 100)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying])

  const togglePlay = () => {
    if (!playerRef.current) return
    if (isPlaying) {
      playerRef.current.pauseVideo()
    } else {
      playerRef.current.playVideo()
    }
  }

  const toggleMute = () => {
    if (!playerRef.current) return
    if (isMuted) {
      playerRef.current.unMute()
      setIsMuted(false)
    } else {
      playerRef.current.mute()
      setIsMuted(true)
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-black relative">
        <div id="youtube-player" className="w-full h-full" />
      </div>

      <div className="p-4 flex items-center gap-3">
        <Button
          size="icon"
          variant="secondary"
          onClick={togglePlay}
          disabled={!isReady}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <span className="text-xl">{isPlaying ? "⏸" : "▶"}</span>
        </Button>

        <Button size="icon" variant="secondary" onClick={toggleMute} disabled={!isReady}>
          <span className="text-xl">{isMuted ? "🔇" : "🔊"}</span>
        </Button>

        <div className="flex-1 text-sm text-gray-300">
          {isReady ? <span>{isPlaying ? "Playing" : "Paused"}</span> : <span>Loading player...</span>}
        </div>
      </div>
    </Card>
  )
}
