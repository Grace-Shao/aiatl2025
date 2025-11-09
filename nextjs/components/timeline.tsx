"use client"

import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState, useRef, useEffect } from "react"

interface TimelineProps {
  currentTime: number
  duration: number
  isPlaying: boolean
  onNewMoment?: (moment: { id: string; time: number; title: string; description: string }) => void
}

interface KeyMoment {
  id: string
  time: number
  title: string
  description: string
  videoStart: number
  videoEnd: number
  addedAt?: number
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

export function Timeline({ currentTime, duration, isPlaying, onNewMoment }: TimelineProps) {
  const [selectedMoment, setSelectedMoment] = useState<KeyMoment | null>(null)
  const [visibleMoments, setVisibleMoments] = useState<KeyMoment[]>([])
  const timelineRef = useRef<HTMLDivElement>(null)
  const triggeredMomentsRef = useRef<Set<string>>(new Set())

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
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary">{formatTime(currentTime)}</div>
          <div className="text-xs text-muted-foreground">Current Time</div>
        </div>
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
                  className="absolute top-2 transform -translate-x-1/2 cursor-pointer group z-10 transition-all duration-200"
                  style={{ left: getMarkerLeftPosition(moment.time) }}
                >
                  {showAnimation && (
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap animate-pulse">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        Latest key moment
                      </div>
                      {/* Arrow pointing down */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-pink-500" />
                      </div>
                    </div>
                  )}

                  {showAnimation && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-4 border-red-500/60 animate-ping-upward" />
                      </div>
                    </div>
                  )}

                  <svg
                    width={showAnimation ? "32" : "24"}
                    height={showAnimation ? "42" : "32"}
                    viewBox="0 0 24 32"
                    fill="none"
                    className={`drop-shadow-lg transition-all duration-500 ${
                      showAnimation ? "animate-[bounce_1s_ease-in-out_3]" : ""
                    } group-hover:scale-125 group-hover:-translate-y-1`}
                    style={{
                      filter: showAnimation ? "drop-shadow(0 0 10px rgba(239, 68, 68, 0.8))" : undefined,
                    }}
                  >
                    <path
                      d="M12 0C12 0 0 12 0 20C0 26.6274 5.37258 32 12 32C18.6274 32 24 26.6274 24 20C24 12 12 0 12 0Z"
                      fill="#EF4444"
                    />
                    <circle cx="12" cy="20" r="4" fill="white" fillOpacity="0.4" />
                  </svg>
                  {/* Tooltip */}
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
