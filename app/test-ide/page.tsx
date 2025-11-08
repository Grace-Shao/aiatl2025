'use client';

import { useState, useEffect } from 'react';
import IDEEditor from '@/app/components/IDEEditor';
import type { CodeReference } from '@/app/types';

// Mock code references for testing
const mockCodeReferences: CodeReference[] = [
  {
    id: 'ref-1',
    timestamp: 10,
    fileName: 'app/page.tsx',
    lineNumber: 4,
    context: 'Discussed the main component structure',
  },
  {
    id: 'ref-2',
    timestamp: 25,
    fileName: 'app/page.tsx',
    lineNumber: 8,
    context: 'Updated the heading text',
  },
  {
    id: 'ref-3',
    timestamp: 45,
    fileName: 'app/components/VideoRecorder.tsx',
    lineNumber: 15,
    context: 'Fixed the recording state logic',
  },
  {
    id: 'ref-4',
    timestamp: 60,
    fileName: 'app/components/VideoRecorder.tsx',
    lineNumber: 30,
    context: 'Added error handling',
  },
  {
    id: 'ref-5',
    timestamp: 90,
    fileName: 'app/lib/gemini-config.ts',
    lineNumber: 5,
    context: 'Configured API key validation',
  },
];

export default function TestIDEPage() {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Simulate video playback
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= 120) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  const handleTimeJump = (timestamp: number) => {
    setCurrentTime(timestamp);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <h1 className="text-2xl font-bold mb-2">Monaco Editor Test Page</h1>
        <p className="text-sm text-gray-400">
          Testing the IDE component with simulated video timeline
        </p>
      </header>

      <div className="p-4 space-y-4">
        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h2 className="text-lg font-semibold mb-3">Video Timeline Simulator</h2>
          
          <div className="space-y-4">
            {/* Timeline Display */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">Current Time:</span>
              <span className="text-2xl font-mono font-bold text-blue-400">
                {formatTime(currentTime)}
              </span>
              <span className="text-sm text-gray-500">/ 2:00</span>
            </div>

            {/* Progress Bar */}
            <div className="relative">
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${(currentTime / 120) * 100}%` }}
                />
              </div>
              {/* Code reference markers */}
              {mockCodeReferences.map((ref) => (
                <div
                  key={ref.id}
                  className="absolute top-0 w-1 h-4 bg-yellow-400 cursor-pointer hover:bg-yellow-300"
                  style={{ left: `${(ref.timestamp / 120) * 100}%` }}
                  onClick={() => handleTimeJump(ref.timestamp)}
                  title={`${ref.fileName}:${ref.lineNumber} @ ${formatTime(ref.timestamp)}`}
                />
              ))}
            </div>

            {/* Playback Controls */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>
              <button
                onClick={() => setCurrentTime(0)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
              >
                ⏮ Reset
              </button>
              <button
                onClick={() => handleTimeJump(10)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Jump to 0:10
              </button>
              <button
                onClick={() => handleTimeJump(45)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Jump to 0:45
              </button>
              <button
                onClick={() => handleTimeJump(90)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Jump to 1:30
              </button>
            </div>
          </div>
        </div>

        {/* Code References Info */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h2 className="text-lg font-semibold mb-3">Mock Code References</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
            {mockCodeReferences.map((ref) => (
              <div
                key={ref.id}
                className={`p-2 rounded border transition-all cursor-pointer ${
                  Math.abs(ref.timestamp - currentTime) < 10
                    ? 'bg-yellow-900 border-yellow-500'
                    : 'bg-gray-700 border-gray-600'
                }`}
                onClick={() => handleTimeJump(ref.timestamp)}
              >
                <div className="font-mono text-xs text-blue-400">
                  {ref.fileName}
                </div>
                <div className="text-gray-300">
                  Line {ref.lineNumber} @ {formatTime(ref.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* IDE Editor */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden h-[600px]">
          <IDEEditor
            codeReferences={mockCodeReferences}
            currentTime={currentTime}
            onTimeJump={handleTimeJump}
          />
        </div>

        {/* Instructions */}
        <div className="bg-blue-900 bg-opacity-30 rounded-lg p-4 border border-blue-700">
          <h3 className="font-semibold mb-2">🧪 How to Test:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
            <li>Click "Play" to simulate video playback (auto-advances time)</li>
            <li>Watch the IDE highlight lines as time progresses</li>
            <li>Click timeline buttons in the IDE to jump to specific moments</li>
            <li>Click yellow markers on the progress bar to jump to code references</li>
            <li>Switch between file tabs to see different files</li>
            <li>Try fullscreen mode (button in top-right of IDE)</li>
            <li>Notice the yellow highlight on lines mentioned at current time</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

