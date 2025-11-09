import { NextResponse } from 'next/server';
import type { PlayerStats, InjuryReport } from '@/shared/types';
import fs from 'fs';
import path from 'path';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const timestamp = searchParams.get('timestamp');
    
    // Read play-by-play data
    const dataPath = path.join(process.cwd(), '..', 'research', 'data', 'game_18684_play_by_play.json');
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // Aggregate player stats from plays
    const playerStatsMap = new Map<string, any>();
    
    data.Plays?.forEach((play: any) => {
      // Filter by timestamp if provided
      if (timestamp && new Date(play.PlayTime) >= new Date(timestamp)) {
        return;
      }
      
      play.PlayStats?.forEach((stat: any) => {
        const key = `${stat.PlayerID}-${stat.Name}`;
        if (!playerStatsMap.has(key)) {
          playerStatsMap.set(key, {
            id: stat.PlayerID.toString(),
            name: stat.Name,
            team: stat.Team === 'BAL' ? 'Ravens' : stat.Team === 'KC' ? 'Chiefs' : stat.Team,
            position: 'N/A',
            stats: {
              passingYards: 0,
              rushingYards: 0,
              receivingYards: 0,
              touchdowns: 0,
              tackles: 0,
              sacks: 0,
              interceptions: 0
            }
          });
        }
        
        const player = playerStatsMap.get(key);
        player.stats.passingYards += stat.PassingYards || 0;
        player.stats.rushingYards += stat.RushingYards || 0;
        player.stats.receivingYards += stat.ReceivingYards || 0;
        player.stats.touchdowns += (stat.PassingTouchdowns || 0) + (stat.RushingTouchdowns || 0) + (stat.ReceivingTouchdowns || 0);
        player.stats.tackles += (stat.SoloTackles || 0) + (stat.AssistedTackles || 0);
        player.stats.sacks += stat.Sacks || 0;
        player.stats.interceptions += stat.Interceptions || 0;
      });
    });
    
    const playerStats: PlayerStats[] = Array.from(playerStatsMap.values());
    const injuries: InjuryReport[] = [];
    
    return NextResponse.json({
      playerStats,
      injuries,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({
      playerStats: [],
      injuries: [],
      lastUpdated: new Date().toISOString()
    });
  }
}
