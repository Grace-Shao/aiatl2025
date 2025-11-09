export interface GameEvent {
  timestamp: number; // in seconds
  type: 'touchdown' | 'field_goal' | 'fumble' | 'penalty' | 'highlight' | 'injury' | 'stat_update';
  player?: string;
  team?: string;
  description: string;
  score?: {
    home: number;
    away: number;
  };
}

export interface GameStatus {
  quarter: number;
  timeRemaining: string;
  possession: string;
  down?: number;
  distance?: number;
  yardLine?: number;
  score: {
    home: {
      team: string;
      score: number;
    };
    away: {
      team: string;
      score: number;
    };
  };
}

export interface PlayerStats {
  id: string;
  name: string;
  team: string;
  position: string;
  stats: {
    passingYards?: number;
    rushingYards?: number;
    receivingYards?: number;
    touchdowns?: number;
    tackles?: number;
    sacks?: number;
    interceptions?: number;
  };
}

export interface InjuryReport {
  player: string;
  team: string;
  injury: string;
  status: 'probable' | 'questionable' | 'doubtful' | 'out';
  lastUpdated: string;
}
