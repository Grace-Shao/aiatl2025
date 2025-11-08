'use client';

import { useState } from 'react';
import type { TranscriptSegment, CodeReference } from '@/app/types';
import { FileCode, Clock } from 'lucide-react';

interface TranscriptViewProps {
  segments: TranscriptSegment[];
  codeReferences: CodeReference[];
  currentTime?: number;
  onSegmentClick?: (timestamp: number) => void;
}

export default function TranscriptView({
  segments,
  codeReferences,
  currentTime = 0,
  onSegmentClick,
}: TranscriptViewProps) {
  const [selectedReference, setSelectedReference] = useState<string | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getReferenceForSegment = (timestamp: number) => {
    return codeReferences.find(
      ref => Math.abs(ref.timestamp - timestamp) < 5
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-gray-50 dark:bg-gray-900">
        <h3 className="font-semibold text-lg mb-2">Transcript</h3>
        {codeReferences.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {codeReferences.map(ref => (
              <button
                key={ref.id}
                onClick={() => setSelectedReference(
                  selectedReference === ref.id ? null : ref.id
                )}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                  selectedReference === ref.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 dark:bg-blue-900 text-blue-800'
                }`}
              >
                <FileCode className="w-3 h-3" />
                {ref.fileName}
                {ref.lineNumber && `:${ref.lineNumber}`}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {segments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No transcript available yet. Start recording to generate transcript.
          </div>
        ) : (
          segments.map((segment) => {
            const ref = getReferenceForSegment(segment.timestamp);
            const isActive = Math.abs(segment.timestamp - currentTime) < 2;
            
            return (
              <div
                key={segment.id}
                onClick={() => onSegmentClick?.(segment.timestamp)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-600'
                    : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-start gap-2 mb-1">
                  <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    {formatTime(segment.timestamp)}
                  </button>
                  {segment.speaker && (
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {segment.speaker}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  {segment.text}
                </p>
                {ref && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                    <FileCode className="w-3 h-3" />
                    <span className="font-mono">
                      {ref.fileName}
                      {ref.lineNumber && `:${ref.lineNumber}`}
                    </span>
                    {ref.context && (
                      <span className="text-gray-500">— {ref.context}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

