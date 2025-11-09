"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState, useRef, useEffect } from "react"
import { useKeyMomentsConnector } from "@/lib/keyMomentsConnector"
import { Flame } from "lucide-react"

interface TimelineProps {
  currentTime: number
  duration: number
  isPlaying: boolean
  onNewMoment?: (moment: { id: string; time: number; title: string; description: string }) => void
  onStartClock?: () => void
  onStopClock?: () => void
}

interface KeyMoment {
  id: string
  time: number
  title: string
  description: string
  videoStart: number
  videoEnd: number
  addedAt?: number
  score?: number
  category?: string
}

const PREDEFINED_MOMENTS: Omit<KeyMoment, "addedAt">[] = [
  {
    id: "moment-0",
    time: 0,
    title: "Game Start",
    description: "The game begins with the opening kickoff!",
    videoStart: 0,
    videoEnd: 5,
  },
  {
    id: "moment-3",
    time: 5,
    title: "First Pass",
    description: "Quarterback completes a quick pass to the receiver!",
    videoStart: 1,
    videoEnd: 6,
  },
  {
    id: "moment-5",
    time: 15,
    title: "Big Play",
    description: "Amazing run breaks through the defense!",
    videoStart: 3,
    videoEnd: 8,
  },
]

export function Timeline({ currentTime, duration, isPlaying, onNewMoment, onStartClock, onStopClock }: TimelineProps) {
  const [selectedMoment, setSelectedMoment] = useState<KeyMoment | null>(null)
  const [visibleMoments, setVisibleMoments] = useState<KeyMoment[]>([])
  const [isDetectionActive, setIsDetectionActive] = useState(false)
  const timelineRef = useRef<HTMLDivElement>(null)
  const triggeredMomentsRef = useRef<Set<string>>(new Set())
  const processedMomentIdsRef = useRef<Set<string>>(new Set())
  const { connector, isConnected, error, stats } = useKeyMomentsConnector()

  useEffect(() => {
    const handleNewMoment = (moment: KeyMoment) => {
      if (processedMomentIdsRef.current.has(moment.id)) {
        return
      }

      processedMomentIdsRef.current.add(moment.id)

      setVisibleMoments((prev) => {
        if (prev.find((m) => m.id === moment.id)) {
          return prev
        }

        const enrichedMoment: KeyMoment = { ...moment, addedAt: Date.now() }
        return [...prev, enrichedMoment].sort((a, b) => a.time - b.time)
      })

      onNewMoment?.({
        id: moment.id,
        time: moment.time,
        title: moment.title,
        description: moment.description,
      })
    }

    connector.setOnNewMoment(handleNewMoment)

    return () => {
      connector.setOnNewMoment(() => {})
    }
  }, [connector, onNewMoment])

  useEffect(() => {
    if (isDetectionActive) {
      connector.updateCurrentTime(currentTime)
    }
  }, [connector, currentTime, isDetectionActive])

  useEffect(() => {
    return () => {
      connector.stop()
      connector.reset()
      processedMomentIdsRef.current.clear()
    }
  }, [connector])

  const handleStartDetection = () => {
    if (isDetectionActive) return

    connector.reset()
    processedMomentIdsRef.current.clear()
    connector.updateCurrentTime(currentTime)
    connector.start()
    setIsDetectionActive(true)
    onStartClock?.()
  }

  const handleStopDetection = () => {
    connector.stop()
    connector.reset()
    processedMomentIdsRef.current.clear()
    setIsDetectionActive(false)
    onStopClock?.()
  }

  useEffect(() => {
    PREDEFINED_MOMENTS.forEach((moment) => {
      if (currentTime >= moment.time && !triggeredMomentsRef.current.has(moment.id)) {
        setVisibleMoments((prev) => {
          // Check if moment already exists in previous state
          if (prev.find((m) => m.id === moment.id)) {
            return prev
          }

          console.log("[v0] Adding key moment at", moment.time, "seconds:", moment.title)
          const newMoment = { ...moment, addedAt: Date.now() }
          return [...prev, newMoment].sort((a, b) => a.time - b.time)
        })
        
        // Mark as triggered and call callback outside of setState
        triggeredMomentsRef.current.add(moment.id)
        if (onNewMoment) {
          // Use setTimeout to defer the callback to avoid setState during render
          setTimeout(() => {
            onNewMoment({
              id: moment.id,
              time: moment.time,
              title: moment.title,
              description: moment.description,
            })
          }, 0)
        }
      }
    })
  }, [currentTime, onNewMoment])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const pixelsPerSecond = 10
  const playheadPosition = "90%"

  const getMarkerLeftPosition = (momentTime: number) => {
    const offset = currentTime - momentTime
    return `calc(90% - ${offset * pixelsPerSecond}px)`
  }

  const latestMoment = visibleMoments.length > 0 ? visibleMoments[visibleMoments.length - 1] : null
  const liveMomentsCount = visibleMoments.length
  const hypeLevel = Math.min(100, liveMomentsCount * 25 + (isDetectionActive ? 20 : 0))
  const hypeDescriptor = hypeLevel >= 80 ? "On fire" : hypeLevel >= 50 ? "Heating up" : "Warming up"
  const detectedMoments = stats?.total_detected ?? liveMomentsCount

  const isMomentNew = (moment: KeyMoment) => {
    if (!moment.addedAt) return false
    return Date.now() - moment.addedAt < 3000 // 3 seconds
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Live Timeline</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            {isPlaying && (
              <>
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span>LIVE</span>
              </>
            )}
            {!isPlaying && "Paused"}
            <span className="ml-3 text-xs">
              {isConnected ? "Detector connected" : "Detector offline"}
              {error && ` · ${error}`}
            </span>
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary">{formatTime(currentTime)}</div>
          <div className="text-xs text-muted-foreground">Current Time</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-orange-400/20 bg-orange-500/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={`relative flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/20 ${
              isDetectionActive ? "animate-pulse" : ""
            }`}>
              {isDetectionActive && <span className="absolute inset-0 rounded-full bg-orange-500/20 blur-md" />}
              <Flame className={`h-5 w-5 text-orange-400 ${isDetectionActive ? "drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" : ""}`} />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.12em] text-orange-300/80">Hype meter</div>
              <div className="text-sm font-semibold text-orange-100">
                {Math.round(hypeLevel)}% heat · {hypeDescriptor}
              </div>
            </div>
          </div>
          <div className="text-xs text-orange-200/80">
            {detectedMoments || liveMomentsCount} live moments tracked
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Button onClick={handleStartDetection} disabled={isDetectionActive}>
          {isDetectionActive ? "Detection Running" : "Start Key Moment Detection"}
        </Button>
        <Button variant="outline" onClick={handleStopDetection} disabled={!isDetectionActive}>
          Stop Detection
        </Button>
      </div>

      <div className="relative mb-6">
        <div className="overflow-hidden relative h-24 bg-secondary/20 rounded-lg border border-border">
          <div ref={timelineRef} className="absolute inset-0">
            {/* Timeline line */}
            <div
              className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-purple-500/30 to-pink-500/30"
              style={{ transform: "translateY(-50%)" }}
            />

            {/* Tick marks every 10 seconds - scroll from right to left */}
            {Array.from({ length: Math.ceil(currentTime / 10) + 5 }).map((_, i) => {
              const time = i * 10
              const offset = currentTime - time
              const leftPosition = `calc(90% - ${offset * pixelsPerSecond}px)`

              // Only show if within visible range
              if (offset > currentTime + 50 || offset < -100) return null

              return (
                <div
                  key={`tick-${i}`}
                  className="absolute top-1/2 transform -translate-y-1/2 transition-all duration-200"
                  style={{ left: leftPosition }}
                >
                  <div className="w-px h-4 bg-muted-foreground/30" />
                  <div className="text-xs text-muted-foreground/50 mt-1 transform -translate-x-1/2 whitespace-nowrap">
                    {formatTime(time)}
                  </div>
                </div>
              )
            })}

            {/* Key moment teardrops - appear when timestamp is crossed */}
            {visibleMoments
              .filter((moment, index, self) => self.findIndex((m) => m.id === moment.id) === index)
              .map((moment) => {
                const offset = currentTime - moment.time

                // Only show if within reasonable range
                if (offset < -5 || offset > 100) return null

                const isLatest = latestMoment?.id === moment.id
                const isNew = isMomentNew(moment)
                const showAnimation = isLatest && isNew

                return (
                  <button
                    key={moment.id}
                    onClick={() => setSelectedMoment(moment)}
                    className="absolute top-2 transform -translate-x-1/2 cursor-pointer group z-10 flex flex-col items-center gap-1 transition-all duration-200"
                    style={{ left: getMarkerLeftPosition(moment.time) }}
                >
                  {showAnimation && (
                    <div className="absolute -top-8 mb-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap animate-pulse">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        Latest key moment
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-pink-500" />
                      </div>
                    </div>
                  )}

                  <div className="relative flex flex-col items-center">
                    <div className="relative flex h-12 w-12 items-center justify-center">
                      <span
                        className={`absolute h-12 w-12 rounded-full bg-red-500/20 blur-xl transition-opacity ${
                          isLatest ? "opacity-90" : "opacity-40"
                        }`}
                      />
                      <span
                        className={`absolute h-10 w-10 rounded-full bg-orange-500/30 blur-md transition-transform duration-300 ${
                          showAnimation ? "scale-110" : ""
                        }`}
                      />
                      <Flame
                        className={`relative h-8 w-8 text-orange-400 drop-shadow-[0_0_12px_rgba(249,115,22,0.55)] ${
                          showAnimation ? "animate-[pulse_1.2s_ease-in-out_infinite]" : ""
                        }`}
                        strokeWidth={1.5}
                      />
                    </div>

                    {showAnimation && (
                      <div className="absolute top-2 left-1/2 -translate-x-1/2">
                        <div className="w-10 h-10 rounded-full border-4 border-red-500/40 animate-ping" />
                      </div>
                    )}

                    <svg
                      width={showAnimation ? "34" : "26"}
                      height={showAnimation ? "40" : "32"}
                      viewBox="0 0 24 32"
                      fill="none"
                      className={`relative drop-shadow-lg transition-all duration-500 ${
                        showAnimation ? "animate-[bounce_1s_ease-in-out_3]" : ""
                      } group-hover:scale-125 group-hover:-translate-y-1`}
                      style={{
                        filter: showAnimation ? "drop-shadow(0 0 12px rgba(249, 115, 22, 0.85))" : "drop-shadow(0 0 6px rgba(249,115,22,0.4))",
                      }}
                    >
                      <defs>
                        <linearGradient id={`flame-fill-${moment.id}`} x1="12" y1="0" x2="12" y2="32" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#fb923c" />
                          <stop offset="55%" stopColor="#f97316" />
                          <stop offset="100%" stopColor="#dc2626" />
                        </linearGradient>
                        <radialGradient id={`flame-core-${moment.id}`} cx="12" cy="20" r="6" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#fde68a" />
                          <stop offset="70%" stopColor="#fb923c" stopOpacity="0.7" />
                          <stop offset="100%" stopColor="#f97316" stopOpacity="0.3" />
                        </radialGradient>
                      </defs>
                      <path
                        d="M12 0C12 0 0 12 0 20C0 26.6274 5.37258 32 12 32C18.6274 32 24 26.6274 24 20C24 12 12 0 12 0Z"
                        fill={`url(#flame-fill-${moment.id})`}
                      />
                      <path
                        d="M12 6C12 6 5 13 5 19C5 23.9706 8.02944 27 12 27C15.9706 27 19 23.9706 19 19C19 13 12 6 12 6Z"
                        fill={`url(#flame-core-${moment.id})`}
                      />
                    </svg>
                  </div>

                  <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                    <div className="bg-black/90 text-white text-xs px-2 py-1 rounded shadow-lg">{moment.title}</div>
                  </div>
                </button>
              )
            })}

            <div
              className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-lg shadow-primary/50 z-20"
              style={{ left: playheadPosition }}
            >
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <div className="w-3 h-3 bg-primary rounded-full shadow-lg shadow-primary/50 animate-pulse" />
              </div>
              <div className="absolute top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                <div className="text-sm font-bold text-primary">{formatTime(currentTime)}</div>
              </div>
            </div>
          </div>

          {/* Right edge overlay to show space for future moments */}
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-secondary/40 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-3 rounded-lg bg-secondary/30">
          <div className="text-lg font-bold text-foreground">{visibleMoments.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Key Moments</div>
        </div>
        <div className="p-3 rounded-lg bg-secondary/30">
          <div className="text-lg font-bold text-foreground">{Math.floor((currentTime / duration) * 100) || 0}%</div>
          <div className="text-xs text-muted-foreground mt-1">Complete</div>
        </div>
        <div className="p-3 rounded-lg bg-secondary/30">
          <div className="text-lg font-bold text-foreground">{formatTime(Math.max(0, duration - currentTime))}</div>
          <div className="text-xs text-muted-foreground mt-1">Remaining</div>
        </div>
      </div>

      {/* Highlight Dialog */}
      <Dialog open={selectedMoment !== null} onOpenChange={(open) => !open && setSelectedMoment(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {selectedMoment?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Time:{" "}
              <span className="text-primary font-semibold">{selectedMoment && formatTime(selectedMoment.time)}</span>
            </div>
            <p className="text-foreground">{selectedMoment?.description}</p>
            <div className="bg-secondary/30 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">5-Second Highlight Clip</p>
              <p className="text-xs text-muted-foreground">
                {selectedMoment && `${formatTime(selectedMoment.videoStart)} - ${formatTime(selectedMoment.videoEnd)}`}
              </p>
              <div className="mt-4 aspect-video bg-black/50 rounded flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Video clip preview will play here</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
