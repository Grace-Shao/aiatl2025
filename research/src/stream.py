from fastapi import FastAPI, Response
from fastapi.responses import StreamingResponse, FileResponse
from pathlib import Path
import json
import asyncio
from datetime import datetime
from typing import List, Dict

app = FastAPI(title="Media Streaming API")

DATA_DIR = Path(__file__).parent.parent / "data"
AUDIO_FILE = DATA_DIR / "RavensNFL_2024_Season.wav"
PLAY_BY_PLAY_FILE = DATA_DIR / "game_18684_play_by_play.json"


def process_plays_with_audio_sync(intervals: List[float]):
    """
    Process play-by-play data and sync with audio timestamps.
    
    intervals: [q1_start, q1_end, q2_start, q2_end, q3_start, q3_end, q4_start, q4_end]
    """
    with open(PLAY_BY_PLAY_FILE, 'r') as f:
        data = json.load(f)
    
    plays = data.get('Plays', [])
    
    quarter_intervals = [
        (1, intervals[0], intervals[1]),
        (2, intervals[2], intervals[3]),
        (3, intervals[4], intervals[5]),
        (4, intervals[6], intervals[7])
    ]
    
    all_processed_plays = []
    
    for quarter_num, audio_start, audio_end in quarter_intervals:
        quarter_plays = [p for p in plays if p.get('QuarterName') == str(quarter_num)]
        
        if not quarter_plays:
            continue
        
        audio_duration = audio_end - audio_start
        
        first_play_time = datetime.fromisoformat(quarter_plays[0]['PlayTime'])
        last_play_time = datetime.fromisoformat(quarter_plays[-1]['PlayTime'])
        playbyplay_duration = (last_play_time - first_play_time).total_seconds()
        
        processed_plays = []
        timeout_accumulated = 0.0
        
        for i, play in enumerate(quarter_plays):
            play_time = datetime.fromisoformat(play['PlayTime'])
            
            if play.get('Type', '').lower() == 'timeout':
                if i + 1 < len(quarter_plays):
                    next_play_time = datetime.fromisoformat(quarter_plays[i + 1]['PlayTime'])
                    timeout_duration = (next_play_time - play_time).total_seconds()
                    timeout_accumulated += timeout_duration
                continue
            
            relative_time = (play_time - first_play_time).total_seconds()
            adjusted_time = relative_time - timeout_accumulated
            
            processed_plays.append({
                'play': play,
                'relative_time': adjusted_time
            })
        
        adjusted_duration = playbyplay_duration - timeout_accumulated
        
        if adjusted_duration > 0:
            scaling_factor = audio_duration / adjusted_duration
        else:
            scaling_factor = 1.0
        
        for processed_play in processed_plays:
            scaled_time = processed_play['relative_time'] * scaling_factor
            
            play_data = processed_play['play'].copy()
            play_data['secondsSinceQuarterStarted'] = round(scaled_time, 2)
            play_data['absoluteAudioTimestamp'] = round(audio_start + scaled_time, 2)
            play_data['quarter'] = quarter_num
            
            all_processed_plays.append(play_data)
    
    return all_processed_plays


def parse_timestamp_from_filename(filename: str) -> float:
    """
    Parse timestamp from filename format: 0001_00-00-05.279_description
    Returns timestamp in seconds.
    """
    parts = filename.split('-')
    if len(parts) < 3:
        return 0.0
    
    # Get 6 characters after the second "-"
    time_part = parts[2][:6]  # "05.279"
    
    # Parse hours, minutes, seconds from the full timestamp
    hours = int(parts[0].split('_')[-1])  # Get "00" from "0001_00"
    minutes = int(parts[1])  # "00"
    seconds = float(time_part)  # "05.279"
    
    # Convert to total seconds
    total_seconds = hours * 3600 + minutes * 60 + seconds
    return total_seconds


@app.get("/stream/audio")
async def stream_audio():
    AUDIO_SEGMENTS_DIR = DATA_DIR / "audio_segments"
    
    if not AUDIO_SEGMENTS_DIR.exists():
        return Response(content="Audio segments directory not found", status_code=404)
    
    # Get all audio files and parse their timestamps
    files_list = []
    for file_path in AUDIO_SEGMENTS_DIR.iterdir():
        if file_path.is_file():
            timestamp = parse_timestamp_from_filename(file_path.name)
            files_list.append({
                'path': file_path,
                'timestamp': timestamp,
                'name': file_path.name
            })
    
    # Sort by timestamp
    files_list.sort(key=lambda x: x['timestamp'])
    
    if not files_list:
        return Response(content="No audio files found in segments directory", status_code=404)
    
    async def iterfile():
        start_time = asyncio.get_event_loop().time()
        
        for i, file_info in enumerate(files_list):
            # Wait until it's time to load this file
            if i > 0:
                target_time = file_info['timestamp']
                elapsed = asyncio.get_event_loop().time() - start_time
                wait_time = target_time - elapsed
                
                if wait_time > 0:
                    await asyncio.sleep(wait_time)
            
            # Stream the audio file
            with open(file_info['path'], mode="rb") as file_like:
                chunk_size = 8192
                while chunk := file_like.read(chunk_size):
                    yield chunk
    
    return StreamingResponse(
        iterfile(),
        media_type="audio/wav",
        headers={
            "Content-Disposition": "inline; filename=streamed_audio.wav",
            "Accept-Ranges": "bytes"
        }
    )


@app.get("/stream/events")
async def stream_events(
    q1_start: float = 365,
    q1_end: float = 1670,
    q2_start: float = 1739,
    q2_end: float = 3785,
    q3_start: float = 3830,
    q3_end: float = 5381,
    q4_start: float = 5391,
    q4_end: float = 7251,
    speed: float = 1.0
):
    """
    Stream play-by-play events synchronized with audio timestamps.
    
    speed: Playback speed multiplier (1.0 = real-time, 2.0 = 2x speed, etc.)
    """
    if not PLAY_BY_PLAY_FILE.exists():
        return Response(content="Play-by-play file not found", status_code=404)
    
    intervals = [q1_start, q1_end, q2_start, q2_end, q3_start, q3_end, q4_start, q4_end]
    
    async def event_generator():
        try:
            processed_plays = process_plays_with_audio_sync(intervals)
            
            last_timestamp = 0.0
            
            for play in processed_plays:
                current_timestamp = play['absoluteAudioTimestamp']
                delay = (current_timestamp - last_timestamp) / speed
                
                if delay > 0:
                    await asyncio.sleep(delay)
                
                event_data = json.dumps(play) + "\n"
                yield f"data: {event_data}\n\n"
                
                last_timestamp = current_timestamp
                
        except Exception as e:
            error_data = json.dumps({"error": str(e)}) + "\n"
            yield f"data: {error_data}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@app.get("/events/processed")
async def get_processed_events(
    q1_start: float = 365,
    q1_end: float = 1670,
    q2_start: float = 1739,
    q2_end: float = 3785,
    q3_start: float = 3830,
    q3_end: float = 5381,
    q4_start: float = 5391,
    q4_end: float = 7251
):
    """
    Get all processed events with timing information (non-streaming).
    Useful for debugging and seeing the full event schedule.
    """
    if not PLAY_BY_PLAY_FILE.exists():
        return Response(content="Play-by-play file not found", status_code=404)
    
    intervals = [q1_start, q1_end, q2_start, q2_end, q3_start, q3_end, q4_start, q4_end]
    
    try:
        processed_plays = process_plays_with_audio_sync(intervals)
        return {
            "total_events": len(processed_plays),
            "events": processed_plays
        }
    except Exception as e:
        return Response(content=f"Error processing events: {str(e)}", status_code=500)


@app.get("/download/audio")
async def download_audio():
    if not AUDIO_FILE.exists():
        return Response(content="Audio file not found", status_code=404)
    
    return FileResponse(
        path=AUDIO_FILE,
        media_type="audio/wav",
        filename=AUDIO_FILE.name
    )


@app.get("/")
def root():
    return {
        "message": "Media Streaming API",
        "endpoints": {
            "streaming": {
                "audio": "/stream/audio",
                "events": "/stream/events (Server-Sent Events)"
            },
            "data": {
                "processed_events": "/events/processed"
            },
            "download": {
                "audio": "/download/audio"
            }
        },
        "default_intervals": {
            "q1": [365, 1670],
            "q2": [1739, 3785],
            "q3": [3830, 5381],
            "q4": [5391, 7251]
        }
    }
