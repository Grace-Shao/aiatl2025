from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from app.modules.models import Play, PlayCriticalityResponse
from app.modules.scoring import (
    calculate_play_criticality_score, 
    categorize_criticality, 
    is_key_play
)
from app.modules.key_moment_detector import process_streams_for_key_moments
import json
import asyncio

app = FastAPI(
    title="HypeZone's API",
    description="Backend Documentation"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to your needs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




@app.get("/", summary="Root Endpoint")
def read_root():
    """
    Root endpoint to verify the API is running.
    """
    return {"message": f"Welcome to HypeZone API!"}



@app.post("/score-play", response_model=PlayCriticalityResponse)
def score_play(play: Play):
    score, play_category, breakdown = calculate_play_criticality_score(play)
    category = categorize_criticality(score)
    key_play = is_key_play(score, category)
    
    return PlayCriticalityResponse(
        score=score,
        category=category,
        play_category=play_category,
        is_key_play=key_play,
        play=play,
        scoring_breakdown=breakdown
    )


@app.get("/getkeymoments")
async def get_key_moments_realtime(
    speed: float = 50.0,
    audio_weight: float = 0.2,
    play_weight: float = 0.8,
    key_moment_threshold: float = 45.0,
    context_segments: int = 3
):
    """
    Stream key moments in real-time as they are detected from synchronized audio and event streams.
    
    Returns Server-Sent Events (SSE) with key moments as soon as they're detected.
    """
    async def generate_key_moments():
        # Import here to avoid circular imports
        from app.modules.key_moment_detector import KeyMomentDetector
        from app.modules.stream import listen_to_audio_stream, listen_to_events_stream
        
        detector = KeyMomentDetector(
            play_weight=play_weight,
            audio_weight=audio_weight,
            key_moment_threshold=key_moment_threshold,
            context_segments=context_segments
        )
        
        # Track progress
        audio_chunk_count = 0
        audio_buffer = bytearray()
        stream_start_time = None
        
        def extract_wav_files(buffer: bytearray) -> list[bytes]:
            """Extract complete WAV files from buffer."""
            wav_files = []
            
            while True:
                riff_idx = buffer.find(b'RIFF')
                if riff_idx == -1:
                    break
                
                if riff_idx > 0:
                    buffer[:] = buffer[riff_idx:]
                
                if len(buffer) < 8:
                    break
                
                chunk_size = int.from_bytes(buffer[4:8], 'little')
                total_size = chunk_size + 8
                
                if len(buffer) < total_size:
                    break
                
                wav_data = bytes(buffer[:total_size])
                wav_files.append(wav_data)
                buffer[:] = buffer[total_size:]
            
            return wav_files
        
        def process_audio_chunk(chunk: bytes):
            nonlocal audio_chunk_count, audio_buffer, stream_start_time
            
            if stream_start_time is None:
                import time
                stream_start_time = time.time()
            
            audio_chunk_count += 1
            audio_buffer.extend(chunk)
            
            # Extract WAV files and add to detector
            wav_files = extract_wav_files(audio_buffer)
            for wav_data in wav_files:
                estimated_timestamp = detector.segment_count * 1.0
                detector.add_audio_segment(wav_data, estimated_timestamp)
        
        async def process_event(event: dict):
            # Process play event and check if it's a key moment
            moment = detector.process_play_event(event)
            
            if moment.is_key_moment:
                # Stream this key moment immediately!
                moment_data = {
                    'timestamp': moment.timestamp,
                    'combined_score': round(moment.combined_score, 2),
                    'play_score': round(moment.play_score, 2),
                    'audio_score': round(moment.audio_score, 2),
                    'play_category': moment.play_category,
                    'description': moment.play_data.get('Description', 'N/A'),
                    'play_type': moment.play_data.get('Type', 'N/A'),
                    'quarter': moment.play_data.get('quarter'),
                    'down': moment.play_data.get('Down'),
                    'distance': moment.play_data.get('Distance'),
                    'yard_line': moment.play_data.get('YardLine'),
                    'detected_at': len(detector.detected_moments)
                }
                
                # Yield as Server-Sent Event
                yield f"data: {json.dumps(moment_data)}\n\n"
            
            detector.detected_moments.append(moment)
        
        # Send initial connection message
        yield f"data: {json.dumps({'status': 'connected', 'message': 'Starting key moment detection...'})}\n\n"
        
        try:
            # Process both streams concurrently
            await asyncio.gather(
                listen_to_audio_stream(chunk_callback=process_audio_chunk, speed=speed),
                listen_to_events_stream(event_callback=process_event, speed=speed)
            )
            
            # Send completion message
            total_key_moments = sum(1 for m in detector.detected_moments if m.is_key_moment)
            completion_data = {
                'status': 'completed',
                'total_moments_analyzed': len(detector.detected_moments),
                'key_moments_detected': total_key_moments,
                'message': f'Analysis complete! Detected {total_key_moments} key moments.'
            }
            yield f"data: {json.dumps(completion_data)}\n\n"
            
        except Exception as e:
            error_data = {'status': 'error', 'message': str(e)}
            yield f"data: {json.dumps(error_data)}\n\n"
    
    return StreamingResponse(
        generate_key_moments(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
        }
    )


@app.post("/key-moments")
def get_key_moments(plays: list[Play]):
    """
    Given a list of plays, return the key moments based on criticality scores.
    """
    key_moments = []
    for play in plays:
        score, play_category, _ = calculate_play_criticality_score(play)
        category = categorize_criticality(score)
        if is_key_play(score, category):
            key_moments.append({
                "play": play,
                "score": score,
                "category": category,
                "play_category": play_category
            })
    
    return {"key_moments": key_moments}



@app.get("/start-stream-listeners")
def start_stream_listeners():
    import asyncio
    from app.modules.stream import example_both_streams
    asyncio.create_task(example_both_streams())


