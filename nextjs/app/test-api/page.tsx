"use client"

import { useState, useEffect } from 'react'

export default function TestConnectorPage() {
  const [status, setStatus] = useState('Not connected')
  const [messages, setMessages] = useState<string[]>([])
  const [eventSource, setEventSource] = useState<EventSource | null>(null)

  const addMessage = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setMessages(prev => [...prev, `[${timestamp}] ${msg}`])
  }

  const testConnection = async () => {
    addMessage('Testing API connection...')
    
    try {
      addMessage('Fetching from http://localhost:3001/')
      const response = await fetch('http://localhost:3001/')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      addMessage(`API reachable: ${JSON.stringify(data)}`)
      
      addMessage('Starting stream...')
      startStream()
    } catch (error) {
      addMessage(`API not reachable: ${String(error)}`)
      setStatus('Error')
    }
  }

  const startStream = () => {
    if (eventSource) {
      eventSource.close()
    }

    addMessage('Connecting to key moments stream...')
    setStatus('Connecting...')

    const url = 'http://localhost:3001/getkeymoments?speed=100&audio_weight=0.3&play_weight=0.7&key_moment_threshold=50&context_segments=2'
    const es = new EventSource(url)
    
    es.onopen = () => {
      addMessage('Stream connected!')
      setStatus('Connected')
    }

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.status === 'connected') {
          addMessage(`Started: ${data.message}`)
        } else if (data.status === 'completed') {
          addMessage(`Completed: ${data.message}`)
        } else if (data.status === 'error') {
          addMessage(`Error: ${data.message}`)
        } else if (data.timestamp) {
          addMessage(`KEY MOMENT: ${data.play_category} (Score: ${data.combined_score})`)
        } else if (data.status === 'heartbeat') {
          addMessage(`Heartbeat`)
        }
      } catch (err) {
        addMessage(`Parse error: ${err}`)
      }
    }

    es.onerror = (error) => {
      addMessage(`Stream error: ${error}`)
      setStatus('Error')
    }

    setEventSource(es)
  }

  const stopStream = () => {
    if (eventSource) {
      eventSource.close()
      setEventSource(null)
      addMessage('Stream disconnected')
      setStatus('Disconnected')
    }
  }

  const clearMessages = () => {
    setMessages([])
  }

  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [eventSource])

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Key Moments API Test</h1>
      
      <div style={{ backgroundColor: '#f5f5f5', padding: '20px', marginBottom: '20px', borderRadius: '8px' }}>
        <h2>Connection Status</h2>
        <p>Status: <strong>{status}</strong></p>
        
        <div style={{ marginTop: '10px' }}>
          <button
            onClick={() => {
              console.log('Button clicked!')
              addMessage('Button clicked!')
              testConnection()
            }}
            style={{ 
              marginRight: '10px', 
              padding: '10px 20px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: status === 'Connected' || status === 'Connecting...' ? 'not-allowed' : 'pointer',
              opacity: status === 'Connected' || status === 'Connecting...' ? 0.6 : 1
            }}
            disabled={status === 'Connected' || status === 'Connecting...'}
          >
            Test API & Connect
          </button>
          
          <button
            onClick={() => {
              console.log('Stop button clicked!')
              addMessage('Stop button clicked!')
              stopStream()
            }}
            style={{ 
              marginRight: '10px', 
              padding: '10px 20px', 
              backgroundColor: '#dc3545', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: status !== 'Connected' ? 'not-allowed' : 'pointer',
              opacity: status !== 'Connected' ? 0.6 : 1
            }}
            disabled={status !== 'Connected'}
          >
            Disconnect
          </button>
          
          <button
            onClick={() => {
              console.log('Clear button clicked!')
              clearMessages()
            }}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear Log
          </button>
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#000', 
        color: '#00ff00', 
        padding: '20px', 
        borderRadius: '8px', 
        fontFamily: 'monospace',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '10px' }}>Activity Log</div>
        {messages.length === 0 ? (
          <div style={{ color: '#999' }}>No activity yet. Click "Test API & Connect" to start.</div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} style={{ marginBottom: '5px' }}>{msg}</div>
          ))
        )}
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '20px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '8px' 
      }}>
        <h3>What this test does:</h3>
        <ul>
          <li>Tests if FastAPI server is reachable at localhost:3001</li>
          <li>Connects to the /getkeymoments Server-Sent Events stream</li>
          <li>Shows real-time messages from the key moment detection process</li>
          <li>Displays any detected key moments with scores and categories</li>
        </ul>
      </div>
    </div>
  )
}