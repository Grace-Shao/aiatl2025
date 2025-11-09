"use client"

import { useState, useEffect, useRef, useCallback } from 'react'

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

interface KeyMomentData {
  status?: 'connected' | 'completed' | 'error' | 'heartbeat'
  message?: string
  timestamp?: string
  combined_score?: number
  play_score?: number
  audio_score?: number
  play_category?: string
  description?: string
  play_type?: string
  quarter?: number
  down?: number
  distance?: number
  yard_line?: string
  detected_at?: number
  total_moments_analyzed?: number
  key_moments_detected?: number
}

export function useKeyMomentsConnector() {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [keyMoments, setKeyMoments] = useState<TimelineKeyMoment[]>([])
  const [stats, setStats] = useState({ total_analyzed: 0, total_detected: 0 })
  const eventSourceRef = useRef<EventSource | null>(null)
  const currentTimeRef = useRef(0)

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    console.log('🚀 Connecting to key moments API...')
    setIsConnected(false)
    setError(null)

    const url = 'http://localhost:3001/getkeymoments?speed=20&audio_weight=0.3&play_weight=0.7&key_moment_threshold=50&context_segments=2'
    const es = new EventSource(url)
    
    es.onopen = () => {
      console.log('✅ Connected to key moments API')
      setIsConnected(true)
      setError(null)
    }

    es.onmessage = (event) => {
      try {
        const data: KeyMomentData = JSON.parse(event.data)
        
        if (data.status === 'connected') {
          console.log(`📡 ${data.message}`)
        } else if (data.status === 'completed') {
          console.log(`🏁 ${data.message}`)
          setStats({
            total_analyzed: data.total_moments_analyzed || 0,
            total_detected: data.key_moments_detected || 0
          })
        } else if (data.status === 'error') {
          console.error(`❌ ${data.message}`)
          setError(data.message || 'Unknown error')
        } else if (data.timestamp) {
          // KEY MOMENT DETECTED!
          console.log(`🎯 KEY MOMENT: ${data.play_category} (Score: ${data.combined_score})`)
          
          const momentTime = currentTimeRef.current + (data.detected_at || 0) * 3
          
          const newMoment: TimelineKeyMoment = {
            id: `moment-${data.detected_at}-${Date.now()}`,
            time: momentTime,
            title: data.play_category || 'Key Moment',
            description: data.description || 'No description',
            videoStart: momentTime - 2,
            videoEnd: momentTime + 3,
            addedAt: Date.now(),
            score: data.combined_score,
            category: data.play_category
          }
          
          setKeyMoments(prev => [...prev, newMoment])
        }
      } catch (err) {
        console.error('❌ Parse error:', err)
        setError('Failed to parse stream data')
      }
    }

    es.onerror = (error) => {
      console.error('❌ Stream error:', error)
      setError('Connection failed')
      setIsConnected(false)
      es.close()
      eventSourceRef.current = null
    }

    eventSourceRef.current = es
  }, [])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('🔌 Disconnecting from key moments API')
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsConnected(false)
    setIsConnected(false)
  }, [])

  const reset = useCallback(() => {
    setKeyMoments([])
    setError(null)
    setStats({ total_analyzed: 0, total_detected: 0 })
  }, [])

  const updateCurrentTime = useCallback((time: number) => {
    currentTimeRef.current = time
  }, [])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    isConnected,
    error,
    keyMoments,
    stats,
    connect,
    disconnect,
    reset,
    updateCurrentTime
  }
}
