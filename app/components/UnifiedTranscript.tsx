'use client';

import { useState } from 'react';
import type { TranscriptEvent, TranscriptSegment, CodeEdit } from '@/app/types';
import { MessageSquare, Code2, Clock, ChevronDown, ChevronRight } from 'lucide-react';

interface UnifiedTranscriptProps {
  events: TranscriptEvent[];
  currentTime?: number;
  onEventClick?: (timestamp: number) => void;
}

export default function UnifiedTranscript({
  events,
  currentTime = 0,
  onEventClick,
}: UnifiedTranscriptProps) {
  const [expandedEdits, setExpandedEdits] = useState<Set<string>>(new Set());

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleEditExpanded = (id: string) => {
    setExpandedEdits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const isSpeechEvent = (event: TranscriptEvent): event is TranscriptEvent & { data: TranscriptSegment } => {
    return event.type === 'speech';
  };

  const isCodeEditEvent = (event: TranscriptEvent): event is TranscriptEvent & { data: CodeEdit } => {
    return event.type === 'code-edit';
  };

  // Sort events by timestamp
  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-gray-50 dark:bg-gray-900">
        <h3 className="font-semibold text-lg mb-2">Live Session Transcript</h3>
        <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            <span>{events.filter(e => e.type === 'speech').length} speech</span>
          </div>
          <div className="flex items-center gap-1">
            <Code2 className="w-4 h-4" />
            <span>{events.filter(e => e.type === 'code-edit').length} code edits</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {sortedEvents.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <MessageSquare className="w-8 h-8 opacity-50" />
              <Code2 className="w-8 h-8 opacity-50" />
            </div>
            <p>No activity yet.</p>
            <p className="text-sm mt-1">Speech and code edits will appear here during the session.</p>
          </div>
        ) : (
          sortedEvents.map((event) => {
            const isActive = Math.abs(event.timestamp - currentTime) < 2;
            const isExpanded = expandedEdits.has(event.id);

            if (isSpeechEvent(event)) {
              const data = event.data;
              return (
                <div
                  key={event.id}
                  onClick={() => onEventClick?.(event.timestamp)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-600 shadow-md'
                      : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <MessageSquare className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400">
                          <Clock className="w-3 h-3" />
                          {formatTime(event.timestamp)}
                        </button>
                        {data.speaker && (
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {data.speaker}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {data.text}
                      </p>
                    </div>
                  </div>
                </div>
              );
            } else if (isCodeEditEvent(event)) {
              const data = event.data;
              return (
                <div
                  key={event.id}
                  onClick={() => onEventClick?.(event.timestamp)}
                  className={`rounded-lg cursor-pointer transition-all ${
                    isActive
                      ? 'bg-green-100 dark:bg-green-900 border-l-4 border-green-600 shadow-md'
                      : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <Code2 className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-purple-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400">
                            <Clock className="w-3 h-3" />
                            {formatTime(event.timestamp)}
                          </button>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            data.changeType === 'add' ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200' :
                            data.changeType === 'delete' ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200' :
                            'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                          }`}>
                            {data.changeType}
                          </span>
                        </div>
                        <div className="font-mono text-sm text-blue-600 dark:text-blue-400 mb-1">
                          {data.fileName}:{data.lineNumber}
                        </div>
                        
                        {/* Toggle for showing diff */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleEditExpanded(event.id);
                          }}
                          className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        >
                          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          <span>{isExpanded ? 'Hide' : 'Show'} changes</span>
                        </button>
                        
                        {/* Code diff */}
                        {isExpanded && (data.before || data.after) && (
                          <div className="mt-2 font-mono text-xs bg-gray-900 dark:bg-gray-950 rounded p-2 overflow-x-auto">
                            {data.before && (
                              <div className="text-red-400">
                                - {data.before}
                              </div>
                            )}
                            {data.after && (
                              <div className="text-green-400">
                                + {data.after}
                              </div>
                            )}
                            {data.linesBefore !== undefined && data.linesAfter !== undefined && (
                              <div className="text-gray-500 mt-1">
                                {data.linesBefore} → {data.linesAfter} lines
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })
        )}
      </div>
    </div>
  );
}

