"""
Test WAV file extraction from audio stream.
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "app"))

from app.modules.stream import listen_to_audio_stream


def extract_wav_files(buffer: bytearray) -> list[bytes]:
    """
    Extract complete WAV files from buffer.
    Returns list of complete WAV files found.
    """
    wav_files = []
    
    while True:
        # Find RIFF header
        riff_idx = buffer.find(b'RIFF')
        
        if riff_idx == -1:
            # No more RIFF headers
            break
        
        # Remove any garbage before RIFF
        if riff_idx > 0:
            print(f"Skipping {riff_idx} bytes of garbage before RIFF")
            buffer[:] = buffer[riff_idx:]
        
        # Need at least 8 bytes to read header
        if len(buffer) < 8:
            break
        
        # Read file size from RIFF header (little-endian, bytes 4-7)
        chunk_size = int.from_bytes(buffer[4:8], 'little')
        total_size = chunk_size + 8
        
        print(f"📦 Found WAV file: chunk_size={chunk_size}, total_size={total_size}")
        
        # Check if we have the complete file
        if len(buffer) < total_size:
            print(f"⏳ Need more data: have {len(buffer)}, need {total_size}")
            break
        
        # Extract this WAV file
        wav_data = bytes(buffer[:total_size])
        wav_files.append(wav_data)
        print(f"Extracted WAV #{len(wav_files)}: {len(wav_data)} bytes")
        
        # Remove it from buffer
        buffer[:] = buffer[total_size:]
    
    return wav_files


async def test_extraction():
    """Test extracting WAV files from audio stream."""
    print("="*60)
    print("WAV EXTRACTION TEST - PROCESSING ENTIRE STREAM")
    print("="*60)
    
    audio_buffer = bytearray()
    chunk_count = 0
    wav_count = 0
    
    def process_chunk(chunk: bytes):
        nonlocal chunk_count, wav_count, audio_buffer
        
        chunk_count += 1
        
        # Debug first chunk
        if chunk_count == 1:
            print(f"\n📥 First chunk: {len(chunk)} bytes")
            print(f"   Starts with: {chunk[:min(20, len(chunk))].hex()}")
            riff_pos = chunk.find(b'RIFF')
            if riff_pos >= 0:
                print(f"   RIFF found at position {riff_pos}")
            else:
                print(f"   No RIFF in first chunk")
        
        # Add to buffer
        audio_buffer.extend(chunk)
        
        # Try to extract WAV files
        wav_files = extract_wav_files(audio_buffer)
        new_wavs = len(wav_files)
        if new_wavs > 0:
            wav_count += new_wavs
            print(f"🎵 Extracted {new_wavs} new WAV file(s)! Total: {wav_count}")
        
        # Progress every 100 chunks
        if chunk_count % 100 == 0:
            print(f"\n📊 Progress: {chunk_count} chunks, {wav_count} WAVs extracted, buffer: {len(audio_buffer)} bytes")
    
    try:
        # Process the entire stream without cancelling
        await listen_to_audio_stream(
            chunk_callback=process_chunk,
            speed=100.0,  # Fast speed for testing
            timeout=300.0  # Longer timeout to handle full stream
        )
        print(f"\nStream completed naturally!")
        
    except Exception as e:
        print(f"\nStream error: {e}")
        if "connection" in str(e).lower() or "failed" in str(e).lower():
            print("💡 Make sure the streaming server is running:")
            print("   cd research && python -m uvicorn src.stream:app --host 0.0.0.0 --port 8000")
    
    print("\n" + "="*60)
    print(f"FINAL RESULTS:")
    print(f"  Total chunks processed: {chunk_count}")
    print(f"  Total WAV files extracted: {wav_count}")
    print(f"  Remaining buffer: {len(audio_buffer)} bytes")
    
    if wav_count > 0:
        print("WAV extraction completed successfully!")
    else:
        print("No WAV files extracted - check server connection")
    print("="*60)


if __name__ == "__main__":
    asyncio.run(test_extraction())
