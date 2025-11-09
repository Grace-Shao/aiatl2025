"use client"

import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect, type CSSProperties } from "react"
import { useKeyMomentsConnector, type TimelineKeyMoment as KeyMoment } from "@/lib/keyMomentsConnector"
import styles from "./timeline.module.css"

interface TimelineProps {
  currentTime: number
  duration: number
  isPlaying: boolean
  onNewMoment?: (moment: { id: string; time: number; title: string; description: string }) => void
}

const VIEW_PAST_SECONDS = 60
const VIEW_FUTURE_SECONDS = 20
const TICK_INTERVAL = 10
const PIXELS_PER_SECOND = 9
const TRACK_ANCHOR_PERCENT = 65

export function Timeline({ currentTime, duration, isPlaying, onNewMoment }: TimelineProps) {
  const [selectedMoment, setSelectedMoment] = useState<KeyMoment | null>(null)
  const [visibleMoments, setVisibleMoments] = useState<KeyMoment[]>([])
  const [isDetectionActive, setIsDetectionActive] = useState(false)
  const processedMomentIdsRef = useRef<Set<string>>(new Set())

  // Use the connector hook
  const { isConnected, error, stats, keyMoments, connect, disconnect, reset, updateCurrentTime } = useKeyMomentsConnector()

  // Update current time in connector
  useEffect(() => {
    updateCurrentTime(currentTime)
  }, [currentTime, updateCurrentTime])

  // Sync keyMoments from API to visibleMoments
  useEffect(() => {
    keyMoments.forEach((moment: KeyMoment) => {
      if (processedMomentIdsRef.current.has(moment.id)) {
        return
      }

      processedMomentIdsRef.current.add(moment.id)

      setVisibleMoments((prev) => {
        if (prev.find((m) => m.id === moment.id)) {
          return prev
        }

        console.log("[Timeline] Adding API key moment:", moment.title)

        return [...prev, moment].sort((a, b) => a.time - b.time)
      })

      if (onNewMoment) {
        onNewMoment({
          id: moment.id,
          time: moment.time,
          title: moment.title,
          description: moment.description,
        })
      }
    })
  }, [keyMoments, onNewMoment])

  const handleStartDetection = () => {
    processedMomentIdsRef.current.clear()
    setVisibleMoments([])
    reset()
    updateCurrentTime(currentTime)
    connect()
    setIsDetectionActive(true)
  }

  const handleStopDetection = () => {
    setIsDetectionActive(false)
    disconnect()
    reset()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const latestMoment = visibleMoments.length > 0 ? visibleMoments[visibleMoments.length - 1] : null

  let timelineAnchorTime = Math.max(currentTime, latestMoment?.time ?? 0)
  if (timelineAnchorTime - currentTime > VIEW_PAST_SECONDS - 5) {
    timelineAnchorTime = currentTime + VIEW_PAST_SECONDS - 5
  }
  const viewStartTime = Math.max(0, timelineAnchorTime - VIEW_PAST_SECONDS)
  const maxVisibleTime = duration > 0 ? duration : timelineAnchorTime + VIEW_FUTURE_SECONDS
  const viewEndTime = Math.min(maxVisibleTime, timelineAnchorTime + VIEW_FUTURE_SECONDS)

  const clampValue = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
  const clampedCurrentTime = clampValue(currentTime, viewStartTime, viewEndTime)

  const getTrackPosition = (time: number) => {
    const offset = timelineAnchorTime - time
    return `calc(${TRACK_ANCHOR_PERCENT}% - ${offset * PIXELS_PER_SECOND}px)`
  }

  const playheadLeft = getTrackPosition(clampedCurrentTime)

  const ticks: number[] = []
  const firstTick = Math.floor(viewStartTime / TICK_INTERVAL) * TICK_INTERVAL
  for (let tick = Math.max(0, firstTick); tick <= viewEndTime; tick += TICK_INTERVAL) {
    ticks.push(tick)
  }

  const isMomentNew = (moment: KeyMoment) => {
    if (!moment.addedAt) return false
    return Date.now() - moment.addedAt < 3000 // 3 seconds
  }

  const statusIndicator = (() => {
    if (!isDetectionActive) {
      return { color: "#6b7280", text: "Detection Inactive", animate: false }
    }
    if (error) {
      return { color: "#ef4444", text: "LIVE - Error", animate: true }
    }
    if (isConnected) {
      return { color: "#22c55e", text: "LIVE - Key Moments Active", animate: true }
    }
    return { color: "#eab308", text: "LIVE - Connecting...", animate: true }
  })()

  return (
    <Card className={styles.timelineCard}>
      <div className={styles.header}>
        <div className={styles.headerCopy}>
          <h2 className={styles.heading}>Live Timeline</h2>
          <p className={styles.statusRow}>
            <span
              className={`${styles.statusDot} ${statusIndicator.animate ? styles.statusDotPulse : ""}`}
              style={{ backgroundColor: statusIndicator.color }}
            />
            <span className={styles.statusText}>
              {statusIndicator.text}
              {isDetectionActive && !isPlaying ? " (Video Paused)" : ""}
            </span>
          </p>
          {error && isDetectionActive && <p className={styles.errorText}>{error}</p>}
        </div>
        <div className={styles.headerActions}>
          <div className={styles.timeBlock}>
            <div className={styles.currentTime}>{formatTime(currentTime)}</div>
            <div className={styles.timeLabel}>Current Time</div>
          </div>
          {!isDetectionActive ? (
            <Button onClick={handleStartDetection} className={styles.startButton}>
              Start Detection
            </Button>
          ) : (
            <Button onClick={handleStopDetection} variant="destructive">
              Stop Detection
            </Button>
          )}
        </div>
      </div>

      <div className={styles.timelineOuter}>
        <div className={styles.trackSurface}>
          <div className={styles.trackCanvas}>
            <div className={styles.trackGlow} />
            <div className={styles.trackBaseline} />

            {ticks.map((time) => {
              const leftPosition = getTrackPosition(time)

              return (
                <div key={`tick-${time}`} className={styles.tick} style={{ left: leftPosition }}>
                  <div className={styles.tickLine} />
                  <div className={styles.tickLabel}>{formatTime(time)}</div>
                </div>
              )
            })}

            {visibleMoments
              .filter((moment, index, self) => self.findIndex((m) => m.id === moment.id) === index)
              .map((moment) => {
                if (moment.time < viewStartTime || moment.time > viewEndTime) {
                  return null
                }

                const leftPosition = getTrackPosition(moment.time)
                const isLatest = latestMoment?.id === moment.id
                const isNew = isMomentNew(moment)
                const showAnimation = isLatest && isNew
                const rawScore = moment.score ?? 60
                const normalizedScore = Math.min(Math.max(rawScore / 100, 0.15), 1)
                const starSize = 26 + normalizedScore * 18
                const starLift = 28 + normalizedScore * 10
                const starOpacity = 0.15 + normalizedScore * 0.65

                return (
                  <div key={moment.id} className={styles.momentMarker} style={{ left: leftPosition }}>
                    {showAnimation && (
                      <div className={styles.latestBadge}>Latest key moment</div>
                    )}
                    <button
                      onClick={() => setSelectedMoment(moment)}
                      className={styles.starButton}
                      style={{
                        "--star-size": `${starSize}px`,
                        "--star-lift": `${starLift}px`,
                      } as CSSProperties}
                    >
                      <div className={styles.starIconWrap}>
                        <div className={styles.starGlow} style={{ opacity: showAnimation ? 0.9 : starOpacity }} />
                        <svg
                          viewBox="0 0 64 64"
                          className={`${styles.starIcon} ${showAnimation ? styles.starIconPulse : ""}`}
                        >
                          <defs>
                            <linearGradient id={`star-gradient-${moment.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#fde68a" />
                              <stop offset="50%" stopColor="#fbbf24" />
                              <stop offset="100%" stopColor="#fb923c" />
                            </linearGradient>
                          </defs>
                          <path
                            d="M32 4l7.9 15.9 17.6 2.6-12.7 12.4 3 17.5L32 44.8 16.2 52.4l3-17.5L6.5 22.5l17.6-2.6L32 4z"
                            fill={`url(#star-gradient-${moment.id})`}
                            stroke="rgba(255,255,255,0.45)"
                            strokeWidth={2.2}
                          />
                        </svg>
                      </div>
                      <span className={styles.starLabel}>{moment.title}</span>
                    </button>
                  </div>
                )
              })}

            <div className={styles.playhead} style={{ left: playheadLeft }}>
              <div className={styles.playheadNeedle} />
              <div className={styles.playheadCap} />
              <div className={styles.playheadLabel}>{formatTime(currentTime)}</div>
            </div>
          </div>

          <div className={styles.fadeLeft} />
          <div className={styles.fadeRight} />

          {visibleMoments.length === 0 && isDetectionActive && !error && (
            <div className={styles.emptyState}>
              <div className={styles.emptyTextBlock}>
                <div className={styles.emptyText}>
                  {isConnected ? "Analyzing gameplay..." : "Connecting to key moment detector..."}
                </div>
                <div className={styles.emptySubtext}>
                  {isConnected ? "Moments will illuminate the track" : "Waiting for server stream..."}
                </div>
              </div>
            </div>
          )}
          {visibleMoments.length === 0 && isDetectionActive && error && (
            <div className={styles.emptyState}>
              <div className={styles.emptyError}>
                <div className={styles.emptyText}>Unable to stream key moments</div>
                <div className={styles.emptySubtext}>{error}</div>
              </div>
            </div>
          )}
          {visibleMoments.length === 0 && !isDetectionActive && (
            <div className={styles.emptyState}>
              <div className={styles.emptyTextBlock}>
                <div className={styles.emptyText}>Click "Start Detection" to begin</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{visibleMoments.length}</div>
          <div className={styles.statLabel}>Key Moments</div>
          {stats.total_detected > 0 && (
            <div className={styles.statHint}>{stats.total_detected} from API</div>
          )}
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{Math.floor((currentTime / duration) * 100) || 0}%</div>
          <div className={styles.statLabel}>Complete</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{formatTime(Math.max(0, duration - currentTime))}</div>
          <div className={styles.statLabel}>Remaining</div>
        </div>
      </div>

      {/* Highlight Dialog */}
      <Dialog open={selectedMoment !== null} onOpenChange={(open) => !open && setSelectedMoment(null)}>
        <DialogContent className={styles.dialogContent}>
          <DialogHeader>
            <DialogTitle className={styles.dialogTitle}>
              {selectedMoment?.title}
            </DialogTitle>
          </DialogHeader>
          <div className={styles.dialogBody}>
            <div className={styles.dialogText}>
              Time:{" "}
              <span className={styles.dialogHighlight}>{selectedMoment && formatTime(selectedMoment.time)}</span>
            </div>
            <p className={styles.dialogDescription}>{selectedMoment?.description}</p>
            <div className={styles.dialogHighlightBox}>
              <p className={styles.dialogHighlightLabel}>5-Second Highlight Clip</p>
              <p className={styles.dialogHighlightRange}>
                {selectedMoment && `${formatTime(selectedMoment.videoStart)} - ${formatTime(selectedMoment.videoEnd)}`}
              </p>
              <div className={styles.dialogPreview}>
                <p className={styles.dialogPreviewText}>Video clip preview will play here</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
