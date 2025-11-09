"""
Test audio sentiment analysis with real WAV data from stream.
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "app"))

from app.modules.stream import listen_to_audio_stream
from app.modules.audio_sentiment import score_clip


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


async def test_audio_sentiment():
    """Test audio sentiment analysis with stream data."""
    print("="*60)
    print("AUDIO SENTIMENT TEST")
    print("="*60)
    
    audio_buffer = bytearray()
    tested_count = 0
    max_tests = 3  # Test first 3 WAV files
    
    def process_chunk(chunk: bytes):
        nonlocal audio_buffer, tested_count
        
        if tested_count >= max_tests:
            return  # Stop processing
        
        audio_buffer.extend(chunk)
        wav_files = extract_wav_files(audio_buffer)
        
        for wav_data in wav_files:
            if tested_count >= max_tests:
                break
                
            tested_count += 1
            print(f"\n🎵 Testing WAV #{tested_count} ({len(wav_data)} bytes)")
            
            try:
                # Test the sentiment analysis
                result = score_clip(wav_data)
                
                print(f"Sentiment Analysis Results:")
                print(f"   Happy: {result.get('happy', 0.0):.3f}")
                print(f"   Angry: {result.get('angry', 0.0):.3f}")
                print(f"   Neutral: {result.get('neutral', 0.0):.3f}")
                print(f"   Sad: {result.get('sad', 0.0):.3f}")
                print(f"   Excited: {result.get('excited_audio', 0.0):.3f}")
                print(f"   Energy: {result.get('energy', 0.0):.3f}")
                
                # Calculate final score like in key moment detector
                excitement = result.get('excited_audio', 0.0)
                energy = result.get('energy', 0.0)
                final_score = (excitement * 50.0) + (energy * 50.0)
                print(f"   Final Score: {final_score:.2f}")
                
            except Exception as e:
                print(f"Error analyzing WAV #{tested_count}: {e}")
                import traceback
                traceback.print_exc()
    
    try:
        await listen_to_audio_stream(
            chunk_callback=process_chunk,
            speed=100.0,
            timeout=30.0
        )
    except Exception as e:
        print(f"Stream error: {e}")
    
    print("\n" + "="*60)
    print(f"AUDIO SENTIMENT TEST COMPLETE")
    print(f"Tested {tested_count} WAV files")
    print("="*60)


if __name__ == "__main__":
    asyncio.run(test_audio_sentiment())