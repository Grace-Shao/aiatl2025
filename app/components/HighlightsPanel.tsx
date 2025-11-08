'use client';

import type { Highlight } from '@/app/types';
import { Lightbulb, AlertCircle, CheckCircle, MessageSquare } from 'lucide-react';

interface HighlightsPanelProps {
  highlights: Highlight[];
  onHighlightClick?: (timestamp: number) => void;
}

export default function HighlightsPanel({
  highlights,
  onHighlightClick,
}: HighlightsPanelProps) {
  const getIcon = (type: Highlight['type']) => {
    switch (type) {
      case 'decision':
        return <CheckCircle className="w-4 h-4" />;
      case 'action-item':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getColor = (type: Highlight['type'], importance: Highlight['importance']) => {
    const baseColors = {
      decision: 'blue',
      'action-item': 'orange',
      discussion: 'purple',
    };
    const color = baseColors[type];
    const opacity = importance === 'high' ? '600' : importance === 'medium' ? '400' : '300';
    return `bg-${color}-${opacity} text-${color}-900 dark:text-${color}-100`;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sortedHighlights = [...highlights].sort((a, b) => {
    const importanceOrder = { high: 3, medium: 2, low: 1 };
    return importanceOrder[b.importance] - importanceOrder[a.importance];
  });

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          <h3 className="font-semibold">Key Highlights</h3>
          <span className="ml-auto text-sm text-gray-500">
            {highlights.length} highlights
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sortedHighlights.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No highlights yet. Processing transcript...
          </div>
        ) : (
          sortedHighlights.map((highlight) => (
            <div
              key={highlight.id}
              onClick={() => onHighlightClick?.(highlight.timestamp)}
              className={`p-3 rounded-lg cursor-pointer transition-all hover:shadow-md ${getColor(
                highlight.type,
                highlight.importance
              )}`}
            >
              <div className="flex items-start gap-2 mb-2">
                {getIcon(highlight.type)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase">
                      {highlight.type.replace('-', ' ')}
                    </span>
                    <span className="text-xs opacity-75">
                      {formatTime(highlight.timestamp)}
                    </span>
                    {highlight.importance === 'high' && (
                      <span className="text-xs font-bold">⭐</span>
                    )}
                  </div>
                  <p className="text-sm">{highlight.text}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

