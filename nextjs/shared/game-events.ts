import { GameEvent } from './types';

// Sample game events from Ravens vs Chiefs game (timestamps in seconds)
export const gameEvents: GameEvent[] = [
  {
    timestamp: 964, // 16:04
    type: 'touchdown',
    player: 'Derrick Henry',
    team: 'Ravens',
    description: "Derrick Henry's touchdown run caps off an impressive opening drive for Baltimore!",
    score: {
      home: 7,
      away: 0
    }
  },
  {
    timestamp: 1218, // 20:18
    type: 'touchdown',
    player: 'Xavier Worthy',
    team: 'Chiefs',
    description: "Xavier Worthy scores with an electrifying touchdown run, showcasing incredible rookie speed!",
    score: {
      home: 7,
      away: 7
    }
  },
  {
    timestamp: 1777, // 29:37
    type: 'fumble',
    player: 'Lamar Jackson',
    team: 'Ravens',
    description: "Chris Jones forces a fumble from Lamar Jackson! First turnover of the game sets up KC scoring opportunity.",
  },
  {
    timestamp: 2067, // 34:27
    type: 'field_goal',
    player: 'Harrison Butker',
    team: 'Chiefs',
    description: "Harrison Butker converts field goal after Ravens' defensive stop in the red zone",
    score: {
      home: 7,
      away: 10
    }
  },
  {
    timestamp: 2169, // 36:09
    type: 'highlight',
    player: 'Lamar Jackson',
    team: 'Ravens',
    description: "Lamar Jackson showing strong leadership, addressing his offensive line after the fumble",
  },
  {
    timestamp: 2696, // 44:56
    type: 'field_goal',
    player: 'Harrison Butker',
    team: 'Chiefs',
    description: "Harrison Butker adds another field goal to extend the Chiefs' lead",
    score: {
      home: 7,
      away: 13
    }
  },
  {
    timestamp: 2884, // 48:04
    type: 'highlight',
    player: 'Lamar Jackson',
    team: 'Ravens',
    description: "Lamar Jackson demonstrates his explosive running ability with a 13-yard gain!",
  },
  // Penalties throughout the game
  {
    timestamp: 453, // 7:33
    type: 'penalty',
    team: 'Ravens',
    description: "Illegal formation penalty impacts Baltimore's drive",
  },
  {
    timestamp: 616, // 10:16
    type: 'penalty',
    team: 'Chiefs',
    description: "Pass interference penalty on Kansas City",
  },
  {
    timestamp: 690, // 11:30
    type: 'penalty',
    team: 'Ravens',
    description: "Illegal formation called on the Ravens",
  },
  {
    timestamp: 1174, // 19:34
    type: 'penalty',
    team: 'Chiefs',
    description: "Pass interference penalty impacts field position",
  },
];

// Function to get events within a time window (for timeline display)
export function getEventsInWindow(currentTime: number, windowSize: number = 30): GameEvent[] {
  const windowStart = Math.max(0, currentTime - windowSize);
  return gameEvents.filter(event => 
    event.timestamp >= windowStart && event.timestamp <= currentTime
  );
}

// Function to get the next upcoming event
export function getNextEvent(currentTime: number): GameEvent | null {
  const upcoming = gameEvents.find(event => event.timestamp > currentTime);
  return upcoming || null;
}

// Function to format game events for forum posts
export function formatEventForPost(event: GameEvent): {
  title: string;
  content: string;
} {
  let title = '';
  let content = '';

  const timeString = `${Math.floor(event.timestamp / 60)}:${(event.timestamp % 60).toString().padStart(2, '0')}`;

  switch (event.type) {
    case 'touchdown':
      title = `🏈 TOUCHDOWN! ${event.player} scores for the ${event.team}!`;
      content = `**${timeString}** - ${event.description}\n\n`;
      if (event.score) {
        content += `**Current Score:**\nRavens: ${event.score.home}\nChiefs: ${event.score.away}`;
      }
      break;
    
    case 'field_goal':
      title = `⚡ Field Goal: ${event.player} puts points on the board`;
      content = `**${timeString}** - ${event.description}\n\n`;
      if (event.score) {
        content += `**Score Update:**\nRavens: ${event.score.home}\nChiefs: ${event.score.away}`;
      }
      break;
    
    case 'fumble':
      title = `💥 TURNOVER! ${event.description.substring(0, 50)}...`;
      content = `**${timeString}** - ${event.description}`;
      break;
    
    case 'penalty':
      title = `⚠️ Penalty Flag: ${event.team}`;
      content = `**${timeString}** - ${event.description}`;
      break;
    
    case 'highlight':
      title = `⭐ Big Play: ${event.player}`;
      content = `**${timeString}** - ${event.description}`;
      break;
    
    default:
      title = `Game Update: ${event.player || event.team}`;
      content = `**${timeString}** - ${event.description}`;
  }

  return { title, content };
}
