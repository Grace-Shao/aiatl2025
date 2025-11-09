"use client"

import { useState, useEffect, useRef, useCallback } from 'react'

export interface KeyMoment {
  id: string
  timestamp: string
  combined_score: number
  play_score: number
  audio_score: number
  play_category: string
  description: string
  play_type: string
  quarter: number
  down: number
  distance: number
  yard_line: string
  detected_at: number
}

interface KeyMomentStreamData {
  status?: 'connected' | 'completed' | 'error'
  message?: string
  total_moments_analyzed?: number
  key_moments_detected?: number
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
}

interface UseKeyMomentsOptions {
  speed?: number
  audio_weight?: number
  play_weight?: number
  key_moment_threshold?: number
  context_segments?: number
  apiUrl?: string
}

export function useKeyMoments(options: UseKeyMomentsOptions = {}) {
  const {
    speed = 100.0,
    audio_weight = 0.3,
    play_weight = 0.7,
    key_moment_threshold = 50.0,
    context_segments = 2,
    apiUrl = 'http://localhost:3001'
  } = options

  const [keyMoments, setKeyMoments] = useState<KeyMoment[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total_analyzed: 0,
    total_detected: 0
  })

  const eventSourceRef = useRef<EventSource | null>(null)

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const url = new URL(`${apiUrl}/getkeymoments`)
    url.searchParams.append('speed', speed.toString())
    url.searchParams.append('audio_weight', audio_weight.toString())
    url.searchParams.append('play_weight', play_weight.toString())
    url.searchParams.append('key_moment_threshold', key_moment_threshold.toString())
    url.searchParams.append('context_segments', context_segments.toString())

    console.log('🔗 Connecting to key moments stream:', url.toString())

    const eventSource = new EventSource(url.toString())
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log('✅ Key moments stream connected')
      setIsConnected(true)
      setError(null)
    }

    eventSource.onmessage = (event) => {
      try {
        const data: KeyMomentStreamData = JSON.parse(event.data)
        console.log('📡 Received key moment data:', data)

        if (data.status === 'connected') {
          console.log('🚀 Stream started:', data.message)
        } else if (data.status === 'completed') {
          console.log('🏁 Stream completed:', data.message)
          setIsCompleted(true)
          setStats({
            total_analyzed: data.total_moments_analyzed || 0,
            total_detected: data.key_moments_detected || 0
          })
        } else if (data.status === 'error') {
          console.error('❌ Stream error:', data.message)
          setError(data.message || 'Unknown error')
        } else if (data.timestamp) {
          // This is a key moment!
          const newKeyMoment: KeyMoment = {
            id: `moment-${data.detected_at}-${Date.now()}`,
            timestamp: data.timestamp,
            combined_score: data.combined_score || 0,
            play_score: data.play_score || 0,
            audio_score: data.audio_score || 0,
            play_category: data.play_category || 'Unknown',
            description: data.description || 'No description',
            play_type: data.play_type || 'Unknown',
            quarter: data.quarter || 0,
            down: data.down || 0,
            distance: data.distance || 0,
            yard_line: data.yard_line || '',
            detected_at: data.detected_at || 0
          }

          console.log('🎯 NEW KEY MOMENT DETECTED:', newKeyMoment.play_category, 
            `(Score: ${newKeyMoment.combined_score})`)

          setKeyMoments(prev => [...prev, newKeyMoment])
        }
      } catch (err) {
        console.error('❌ Error parsing key moment data:', err)
        setError('Failed to parse stream data')
      }
    }

    eventSource.onerror = (event) => {
      console.error('❌ Key moments stream error:', event)
      setError('Connection failed')
      setIsConnected(false)
    }

  }, [speed, audio_weight, play_weight, key_moment_threshold, context_segments, apiUrl])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('🔌 Disconnecting from key moments stream')
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsConnected(false)
  }, [])

  const reset = useCallback(() => {
    setKeyMoments([])
    setError(null)
    setIsCompleted(false)
    setStats({ total_analyzed: 0, total_detected: 0 })
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    keyMoments,
    isConnected,
    isCompleted,
    error,
    stats,
    connect,
    disconnect,
    reset
  }
}