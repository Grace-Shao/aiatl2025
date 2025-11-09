"use client"

import { useEffect, useState, useCallback, useRef } from 'react';
import { gameEvents, formatEventForPost, getEventsInWindow } from '@/shared/game-events';
import type { GameEvent } from '@/shared/types';

interface GameEventTrackerProps {
  currentTime: number;
  isPlaying: boolean;
  onEventTriggered?: (event: GameEvent) => void;
}

export function GameEventTracker({ currentTime, isPlaying, onEventTriggered }: GameEventTrackerProps) {
  const [triggeredEvents, setTriggeredEvents] = useState<Set<number>>(new Set());
  const [recentEvents, setRecentEvents] = useState<GameEvent[]>([]);
  const lastCheckTimeRef = useRef(0);

  // Check for new events every second when playing
  useEffect(() => {
    if (!isPlaying) return;

    const checkForEvents = () => {
      // Find events that should have triggered between last check and now
      const newEvents = gameEvents.filter(event => {
        const shouldTrigger = 
          event.timestamp <= currentTime && 
          event.timestamp > lastCheckTimeRef.current &&
          !triggeredEvents.has(event.timestamp);
        return shouldTrigger;
      });

      if (newEvents.length > 0) {
        console.log('[GameEventTracker] New events detected:', newEvents);
        
        // Mark events as triggered
        setTriggeredEvents(prev => {
          const updated = new Set(prev);
          newEvents.forEach(event => updated.add(event.timestamp));
          return updated;
        });

        // Post events to forum
        newEvents.forEach(event => {
          postEventToForum(event);
          onEventTriggered?.(event);
        });

        // Update recent events display
        setRecentEvents(prev => [...newEvents, ...prev].slice(0, 5));
      }

      lastCheckTimeRef.current = currentTime;
    };

    const interval = setInterval(checkForEvents, 1000);
    return () => clearInterval(interval);
  }, [currentTime, isPlaying, triggeredEvents, onEventTriggered]);

  // Post game stats periodically (every minute)
  useEffect(() => {
    if (!isPlaying) return;

    const postStats = async () => {
      try {
        const response = await fetch('/api/game-data');
        const data = await response.json();

        // Post interesting player stats
        if (data.playerStats?.length) {
          const highlights = data.playerStats.filter((player: any) =>
            (player.stats.touchdowns && player.stats.touchdowns > 1) ||
            (player.stats.rushingYards && player.stats.rushingYards > 100) ||
            (player.stats.passingYards && player.stats.passingYards > 250)
          );

          for (const player of highlights) {
            await fetch('/api/forum/threads', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: `📊 ${player.name} Stats Update`,
                content: `${player.name} (${player.team} - ${player.position}) is having a great game!\n\n` +
                  Object.entries(player.stats)
                    .map(([key, value]) => `**${key}:** ${value}`)
                    .join('\n'),
                author: 'StatsBot',
              }),
            });
          }
        }

        // Post injury updates
        for (const injury of data.injuries || []) {
          await fetch('/api/forum/threads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: `🏥 Injury Update: ${injury.player}`,
              content: `**${injury.player}** (${injury.team})\n**Injury:** ${injury.injury}\n**Status:** ${injury.status.toUpperCase()}`,
              author: 'InjuryBot',
            }),
          });
        }
      } catch (error) {
        console.error('[GameEventTracker] Error fetching game data:', error);
      }
    };

    const statsInterval = setInterval(postStats, 60000); // Every minute
    return () => clearInterval(statsInterval);
  }, [isPlaying]);

  const postEventToForum = async (event: GameEvent) => {
    const { title, content } = formatEventForPost(event);

    try {
      const response = await fetch('/api/forum/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          author: 'GameBot',
        }),
      });

      if (!response.ok) {
        console.error('[GameEventTracker] Failed to create thread for event');
      } else {
        console.log('[GameEventTracker] Posted event to forum:', title);
      }
    } catch (error) {
      console.error('[GameEventTracker] Error posting event:', error);
    }
  };

  // Display recent events in the UI
  if (recentEvents.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/20 rounded-lg p-4 mb-4">
      <h3 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
        <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
        Recent Game Events
      </h3>
      <div className="space-y-2">
        {recentEvents.map((event, index) => (
          <div key={`${event.timestamp}-${index}`} className="text-sm text-gray-300 flex items-start gap-2">
            <span className="text-purple-400 font-medium min-w-[45px]">
              {Math.floor(event.timestamp / 60)}:{(event.timestamp % 60).toString().padStart(2, '0')}
            </span>
            <span className="flex-1">{event.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
