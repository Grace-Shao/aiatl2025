import { NextResponse } from 'next/server';
import type { PlayerStats, InjuryReport } from '@/shared/types';

// Mock player stats (in production, this would fetch from PrizePicks API or ESPN API)
const playerStats: PlayerStats[] = [
  {
    id: '1',
    name: 'Lamar Jackson',
    team: 'Ravens',
    position: 'QB',
    stats: {
      passingYards: 245,
      rushingYards: 89,
      touchdowns: 2,
      interceptions: 1
    }
  },
  {
    id: '2',
    name: 'Derrick Henry',
    team: 'Ravens',
    position: 'RB',
    stats: {
      rushingYards: 112,
      touchdowns: 1
    }
  },
  {
    id: '3',
    name: 'Xavier Worthy',
    team: 'Chiefs',
    position: 'WR',
    stats: {
      receivingYards: 98,
      touchdowns: 1
    }
  },
  {
    id: '4',
    name: 'Patrick Mahomes',
    team: 'Chiefs',
    position: 'QB',
    stats: {
      passingYards: 312,
      touchdowns: 2
    }
  },
  {
    id: '5',
    name: 'Chris Jones',
    team: 'Chiefs',
    position: 'DT',
    stats: {
      tackles: 6,
      sacks: 1.5
    }
  }
];

// Mock injury reports (in production, fetch from NFL injury API)
const injuries: InjuryReport[] = [
  {
    player: 'Travis Kelce',
    team: 'Chiefs',
    injury: 'Ankle',
    status: 'questionable',
    lastUpdated: new Date().toISOString()
  },
  {
    player: 'Mark Andrews',
    team: 'Ravens',
    injury: 'Knee',
    status: 'probable',
    lastUpdated: new Date().toISOString()
  }
];

export async function GET() {
  return NextResponse.json({
    playerStats,
    injuries,
    lastUpdated: new Date().toISOString()
  });
}
