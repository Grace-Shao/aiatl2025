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
    speed: float = 100.0,
    audio_weight: float = 0.3,
    play_weight: float = 0.7,
    key_moment_threshold: float = 50.0,
    context_segments: int = 2
):
    """
    Stream key moments in real-time as they are detected.
    """
    async def stream_key_moments():
        import asyncio
        import queue
        
        # Create a queue to receive real-time key moments
        moment_queue = asyncio.Queue()
        
        def key_moment_callback(moment):
            """Called immediately when a key moment is detected"""
            asyncio.create_task(moment_queue.put(moment))
        
        yield f"data: {json.dumps({'status': 'connected', 'message': 'Starting key moment detection...'})}\n\n"
        
        # Start the detection process with real-time callback
        detection_task = asyncio.create_task(
            process_streams_for_key_moments(
                speed=speed,
                audio_weight=audio_weight,
                play_weight=play_weight,
                key_moment_threshold=key_moment_threshold,
                context_segments=context_segments,
                key_moment_callback=key_moment_callback
            )
        )
        
        key_moment_count = 0
        
        try:
            while not detection_task.done():
                try:
                    # Wait for either a key moment or timeout
                    moment = await asyncio.wait_for(moment_queue.get(), timeout=1.0)
                    
                    # Stream this key moment immediately!
                    key_moment_count += 1
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
                        'detected_at': key_moment_count
                    }
                    yield f"data: {json.dumps(moment_data)}\n\n"
                    
                except asyncio.TimeoutError:
                    # No key moment in the last second, continue waiting
                    pass
            
            # Process completed - get final results
            all_moments = await detection_task
            
            # Send any remaining key moments that might have been missed
            while not moment_queue.empty():
                moment = await moment_queue.get()
                key_moment_count += 1
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
                    'detected_at': key_moment_count
                }
                yield f"data: {json.dumps(moment_data)}\n\n"
            
            # Send completion message
            completion_data = {
                'status': 'completed',
                'total_moments_analyzed': len(all_moments),
                'key_moments_detected': key_moment_count,
                'message': f'Analysis complete! Streamed {key_moment_count} key moments in real-time.'
            }
            yield f"data: {json.dumps(completion_data)}\n\n"
            
        except Exception as e:
            error_data = {'status': 'error', 'message': str(e)}
            yield f"data: {json.dumps(error_data)}\n\n"
    
    return StreamingResponse(
        stream_key_moments(),
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


