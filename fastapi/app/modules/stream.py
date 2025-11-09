import httpx
import asyncio
from typing import Callable, Optional
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


async def listen_to_audio_stream(
    base_url: str = None,
    chunk_callback: Optional[Callable[[bytes], None]] = None,
    speed: float = 1.0,
    timeout: float = 300.0
) -> None:
    """
    Listen to the audio stream from the streaming API.
    Streams audio segments sequentially with proper timing synchronization.
    
    Args:
        base_url: Base URL of the streaming API (defaults to STREAM_API_URI env var)
        chunk_callback: Optional callback function to process each audio chunk
        speed: Playback speed multiplier (1.0 = real-time, 2.0 = 2x speed, etc.)
        timeout: Timeout in seconds for the stream connection
    
    Example:
        async def save_chunk(chunk: bytes):
            with open("output.wav", "ab") as f:
                f.write(chunk)
        
        await listen_to_audio_stream(chunk_callback=save_chunk, speed=2.0)
    """
    if base_url is None:
        base_url = os.getenv("STREAM_API_URI", "http://localhost:8000")
    
    url = f"{base_url}/stream/audio"
    params = {"speed": speed}
    
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            async with client.stream("GET", url, params=params) as response:
                response.raise_for_status()
                
                print(f"Connected to audio stream: {response.status_code}")
                print(f"Playback speed: {speed}x")
                print("Receiving time-synchronized audio segments...")
                
                total_bytes = 0
                segment_count = 0
                start_time = asyncio.get_event_loop().time()
                
                async for chunk in response.aiter_bytes(chunk_size=8192):
                    if chunk:
                        total_bytes += len(chunk)
                        segment_count += 1
                        elapsed = asyncio.get_event_loop().time() - start_time
                        
                        if chunk_callback:
                            chunk_callback(chunk)
                        else:
                            # Default: print periodic updates (every 100 chunks)
                            if segment_count % 100 == 0:
                                print(f"[{elapsed:.1f}s] Segments: {segment_count} | "
                                      f"Total: {total_bytes / 1024:.1f} KB")
                
                elapsed = asyncio.get_event_loop().time() - start_time
                print(f"\n✓ Audio stream completed")
                print(f"  Duration: {elapsed:.1f}s")
                print(f"  Segments: {segment_count}")
                print(f"  Total: {total_bytes / 1024:.1f} KB ({total_bytes / (1024 * 1024):.2f} MB)")
                        
        except httpx.HTTPError as e:
            print(f"HTTP error occurred: {e}")
        except Exception as e:
            print(f"Error listening to audio stream: {e}")


async def listen_to_events_stream(
    base_url: str = None,
    event_callback: Optional[Callable[[dict], None]] = None,
    speed: float = 1.0,
    quarter_intervals: Optional[dict] = None,
    timeout: float = 300.0
) -> None:
    """
    Listen to the Server-Sent Events (SSE) stream from the streaming API.
    
    Args:
        base_url: Base URL of the streaming API (defaults to STREAM_API_URI env var)
        event_callback: Optional callback function to process each event
        speed: Playback speed multiplier (1.0 = real-time, 2.0 = 2x speed, etc.)
        quarter_intervals: Optional dict with custom quarter time intervals
        timeout: Timeout in seconds for the stream connection
    """
    if base_url is None:
        base_url = os.getenv("STREAM_API_URI", "http://localhost:8000")
    
    # Build query parameters
    params = {"speed": speed}
    
    if quarter_intervals:
        params.update(quarter_intervals)
    else:
        # Default intervals
        params.update({
            "q1_start": 365, "q1_end": 1670,
            "q2_start": 1739, "q2_end": 3785,
            "q3_start": 3830, "q3_end": 5381,
            "q4_start": 5391, "q4_end": 7251
        })
    
    url = f"{base_url}/stream/events"
    
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            async with client.stream("GET", url, params=params) as response:
                response.raise_for_status()
                
                print(f"Connected to events stream: {response.status_code}")
                print(f"Playback speed: {speed}x")
                
                buffer = ""
                async for chunk in response.aiter_text():
                    buffer += chunk
                    
                    # Split on newlines and process each line
                    lines = buffer.split('\n')
                    # Keep the last incomplete line in buffer
                    buffer = lines[-1]
                    
                    for line in lines[:-1]:
                        line = line.strip()
                        
                        # Skip empty lines
                        if not line:
                            continue
                        
                        # Parse SSE format (data: {...})
                        if line.startswith("data: "):
                            data_str = line[6:]  # Remove "data: " prefix
                            
                            try:
                                event_data = json.loads(data_str)
                                
                                if "error" in event_data:
                                    print(f"Error from stream: {event_data['error']}")
                                    continue
                                
                                if event_callback:
                                    event_callback(event_data)
                                else:
                                    # Default: print event info
                                    print(f"\nQuarter {event_data.get('quarter')} - "
                                          f"Time: {event_data.get('absoluteAudioTimestamp')}s")
                                    print(f"Play: {event_data.get('Type', 'N/A')}")
                                    
                            except json.JSONDecodeError as e:
                                print(f"Failed to parse event data: {e}")
                                print(f"Problematic data: {data_str}")
                                
        except httpx.HTTPError as e:
            print(f"HTTP error occurred: {e}")
        except Exception as e:
            print(f"Error listening to events stream: {e}")


async def example_both_streams():
    """Example: Listen to both audio and events simultaneously."""
    # Run both listeners concurrently at the same speed
    speed = 100.0
    await asyncio.gather(
        listen_to_audio_stream(speed=speed),
        listen_to_events_stream(speed=speed)
    )


# Run examples
if __name__ == "__main__":

    asyncio.run(example_both_streams())