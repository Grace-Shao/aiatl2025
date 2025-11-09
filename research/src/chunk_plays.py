import json
import sqlite3
from pathlib import Path
from typing import List, Dict, Any

DATA_DIR = Path(__file__).parent.parent / "data"
PLAY_BY_PLAY_FILE = DATA_DIR / "game_18684_play_by_play.json"
DB_FILE = DATA_DIR / "rag_db" / "plays.db"


def chunk_plays(plays: List[Dict[Any, Any]], chunk_size: int = 10) -> List[List[Dict[Any, Any]]]:
    """
    Simple chunking function - splits plays into groups of chunk_size.
    
    Args:
        plays: List of play objects
        chunk_size: Number of plays per chunk (default: 10)
    
    Returns:
        List of play chunks (each chunk is a list of plays)
    """
    chunks = []
    for i in range(0, len(plays), chunk_size):
        chunks.append(plays[i:i + chunk_size])
    return chunks


def create_database(db_path: Path, game_data: dict, chunks: List[List[Dict]]):
    """Create SQLite database and store chunks"""
    
    # Create directory if it doesn't exist
    db_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Remove existing database
    if db_path.exists():
        db_path.unlink()
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create tables
    cursor.execute("""
        CREATE TABLE game_info (
            game_key TEXT PRIMARY KEY,
            away_team TEXT,
            home_team TEXT,
            date TEXT,
            away_score INTEGER,
            home_score INTEGER
        )
    """)
    
    cursor.execute("""
        CREATE TABLE play_chunks (
            chunk_id INTEGER PRIMARY KEY,
            quarter TEXT,
            time_range TEXT,
            plays_json TEXT,
            play_count INTEGER
        )
    """)
    
    # Insert game info
    cursor.execute("""
        INSERT INTO game_info (game_key, away_team, home_team, date, away_score, home_score)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        game_data['Score']['GameKey'],
        game_data['Score']['AwayTeam'],
        game_data['Score']['HomeTeam'],
        game_data['Score']['Date'],
        game_data['Score']['AwayScore'],
        game_data['Score']['HomeScore']
    ))
    
    # Insert chunks
    for i, chunk in enumerate(chunks):
        if not chunk:
            continue
            
        # Get quarter and time range from first and last play
        first_play = chunk[0]
        last_play = chunk[-1]
        
        quarter = first_play.get('QuarterName', 'unknown')
        time_range = f"{first_play['TimeRemainingMinutes']}:{first_play['TimeRemainingSeconds']:02d} - {last_play['TimeRemainingMinutes']}:{last_play['TimeRemainingSeconds']:02d}"
        
        cursor.execute("""
            INSERT INTO play_chunks (chunk_id, quarter, time_range, plays_json, play_count)
            VALUES (?, ?, ?, ?, ?)
        """, (
            i,
            quarter,
            time_range,
            json.dumps(chunk),
            len(chunk)
        ))
    
    conn.commit()
    conn.close()


def main():
    """Load play-by-play data, chunk it, and save to SQLite database"""
    print(f"Loading play-by-play data from {PLAY_BY_PLAY_FILE}...")
    
    with open(PLAY_BY_PLAY_FILE, 'r') as f:
        game_data = json.load(f)
    
    plays = game_data.get('Plays', [])
    print(f"Found {len(plays)} plays")
    
    # Chunk the plays
    chunk_size = 10
    chunks = chunk_plays(plays, chunk_size)
    print(f"Created {len(chunks)} chunks of {chunk_size} plays each")
    
    # Create database
    print(f"\nCreating SQLite database at {DB_FILE}...")
    create_database(DB_FILE, game_data, chunks)
    
    print(f"✓ Saved {len(chunks)} chunks to database")
    
    # Show sample of first chunk
    print(f"\nSample - First chunk contains {len(chunks[0])} plays:")
    for play in chunks[0][:3]:  # Show first 3 plays of first chunk
        print(f"  - Quarter {play['QuarterName']}, {play['TimeRemainingMinutes']}:{play['TimeRemainingSeconds']:02d} - {play['Type']}: {play['Team']}")
    
    # Show database stats
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM play_chunks")
    chunk_count = cursor.fetchone()[0]
    cursor.execute("SELECT away_team, home_team FROM game_info")
    teams = cursor.fetchone()
    conn.close()
    
    print(f"\n✓ Database created with {chunk_count} chunks for {teams[0]} vs {teams[1]}")


if __name__ == "__main__":
    main()

