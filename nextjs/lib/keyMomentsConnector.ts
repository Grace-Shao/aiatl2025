import { useKeyMoments, type KeyMoment as APIKeyMoment } from './hooks/useKeyMoments'

export interface TimelineKeyMoment {
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

export class KeyMomentsConnector {
  private onNewMomentCallback?: (moment: TimelineKeyMoment) => void
  private keyMomentsHook?: ReturnType<typeof useKeyMoments>
  private currentTime = 0
  private processedMomentIds = new Set<string>()

  constructor() {
    console.log('🔧 KeyMomentsConnector initialized')
  }

  /**
   * Set the callback to be called when new key moments are detected
   */
  setOnNewMoment(callback: (moment: TimelineKeyMoment) => void) {
    this.onNewMomentCallback = callback
  }

  /**
   * Update current time (used for positioning moments on timeline)
   */
  updateCurrentTime(time: number) {
    this.currentTime = time
  }

  /**
   * Convert API key moment to timeline format
   */
  private convertToTimelineFormat(apiMoment: APIKeyMoment): TimelineKeyMoment {
    // Position moment relative to current time + some spacing
    const rawTimestamp = typeof apiMoment.timestamp === 'string'
      ? parseFloat(apiMoment.timestamp)
      : apiMoment.timestamp

    const baseTime = Number.isFinite(rawTimestamp) ? rawTimestamp : this.currentTime
    const momentTime = Math.max(0, baseTime)
    
    return {
      id: apiMoment.id,
      time: momentTime,
      title: apiMoment.play_category,
      description: apiMoment.description,
      videoStart: Math.max(0, momentTime - 3),
      videoEnd: momentTime + 3,
      addedAt: Date.now(),
      score: apiMoment.combined_score,
      category: apiMoment.play_category
    }
  }

  /**
   * Initialize the connector with key moments hook (call this from a React component)
   */
  init(keyMomentsHook: ReturnType<typeof useKeyMoments>) {
    this.keyMomentsHook = keyMomentsHook
    
    // Process new key moments as they arrive
    keyMomentsHook.keyMoments.forEach(apiMoment => {
      if (!apiMoment.id || this.processedMomentIds.has(apiMoment.id)) {
        return
      }

      this.processedMomentIds.add(apiMoment.id)

      if (this.onNewMomentCallback) {
        const timelineMoment = this.convertToTimelineFormat(apiMoment)
        console.log('🎯 New key moment converted for timeline:', timelineMoment.title, 
          `(Score: ${timelineMoment.score})`)
        this.onNewMomentCallback(timelineMoment)
      }
    })
  }

  /**
   * Start listening for key moments
   */
  start() {
    if (this.keyMomentsHook) {
      console.log('🚀 Starting key moments detection')
      this.keyMomentsHook.connect()
    } else {
      console.warn('⚠️ Key moments hook not initialized')
    }
  }

  /**
   * Stop listening for key moments
   */
  stop() {
    if (this.keyMomentsHook) {
      console.log('⏹️ Stopping key moments detection')
      this.keyMomentsHook.disconnect()
    }
  }

  /**
   * Get connection status
   */
  get isConnected() {
    return this.keyMomentsHook?.isConnected || false
  }

  /**
   * Get any connection errors
   */
  get error() {
    return this.keyMomentsHook?.error || null
  }

  /**
   * Get detection stats
   */
  get stats() {
    return this.keyMomentsHook?.stats || { total_analyzed: 0, total_detected: 0 }
  }

  /**
   * Reset the connector
   */
  reset() {
    this.processedMomentIds.clear()
    if (this.keyMomentsHook) {
      this.keyMomentsHook.reset()
    }
  }
}

// Create a singleton instance
export const keyMomentsConnector = new KeyMomentsConnector()

// React hook to use the connector in components
export function useKeyMomentsConnector() {
  const keyMomentsHook = useKeyMoments({
    speed: 100.0,
    audio_weight: 0.3,
    play_weight: 0.7,
    key_moment_threshold: 50.0
  })

  // Initialize the connector with the hook
  keyMomentsConnector.init(keyMomentsHook)

  return {
    connector: keyMomentsConnector,
    isConnected: keyMomentsHook.isConnected,
    error: keyMomentsHook.error,
    stats: keyMomentsHook.stats
  }
}