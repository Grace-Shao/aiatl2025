import yt_dlp
import os
import subprocess
import re

def download_youtube_audio(youtube_url, output_path="downloads"):
    """Download audio from YouTube video"""
    os.makedirs(output_path, exist_ok=True)
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'wav',
            'preferredquality': '192',
        }],
        'outtmpl': os.path.join(output_path, '%(title)s.%(ext)s'),
        'quiet': False,
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(youtube_url, download=True)
        filename = ydl.prepare_filename(info)
        audio_file = os.path.splitext(filename)[0] + '.wav'
    
    return audio_file

def parse_timestamp(timestamp_str):
    """Convert timestamp string (HH:MM:SS.mmm) to seconds"""
    parts = timestamp_str.split(':')
    hours = int(parts[0])
    minutes = int(parts[1])
    seconds = float(parts[2])
    
    total_seconds = hours * 3600 + minutes * 60 + seconds
    return total_seconds

def parse_transcript_file(transcript_path):
    """Parse transcript file and extract timestamp segments"""
    segments = []
    
    with open(transcript_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    current_start = None
    current_text = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check if line starts with timestamp (format: HH:MM:SS.mmm)
        timestamp_match = re.match(r'^(\d{2}:\d{2}:\d{2}\.\d{3})', line)
        
        if timestamp_match:
            # Save previous segment if exists
            if current_start is not None and current_text:
                segments.append({
                    'start': current_start,
                    'text': ' '.join(current_text)
                })
            
            # Start new segment
            current_start = timestamp_match.group(1)
            current_text = [line[len(current_start):].strip()]
        elif current_start is not None:
            # Continue current segment text
            current_text.append(line)
    
    # Add last segment
    if current_start is not None and current_text:
        segments.append({
            'start': current_start,
            'text': ' '.join(current_text)
        })
    
    return segments

def segment_audio(audio_path, transcript_path, output_dir="audio_segments"):
    """Segment audio file based on transcript timestamps using ffmpeg"""
    os.makedirs(output_dir, exist_ok=True)
    
    # Parse transcript
    print("Parsing transcript...")
    segments = parse_transcript_file(transcript_path)
    
    # Create audio segments using ffmpeg
    print(f"Creating {len(segments)} audio segments...")
    
    for i, segment in enumerate(segments):
        start_time = parse_timestamp(segment['start'])
        
        # Determine duration (time to next segment or end)
        if i < len(segments) - 1:
            end_time = parse_timestamp(segments[i + 1]['start'])
            duration = end_time - start_time
        else:
            duration = None  # Let ffmpeg handle rest of file
        
        # Clean text for filename (remove special chars, limit length)
        text_preview = segment['text'][:50].replace('/', '-').replace('\\', '-')
        text_preview = re.sub(r'[^\w\s-]', '', text_preview)
        filename = f"{i:04d}_{segment['start'].replace(':', '-')}_{text_preview}.wav"
        filepath = os.path.join(output_dir, filename)
        
        # Build ffmpeg command
        cmd = [
            'ffmpeg',
            '-i', audio_path,
            '-ss', str(start_time),
            '-y',  # Overwrite output files
            '-loglevel', 'error'  # Only show errors
        ]
        
        if duration is not None:
            cmd.extend(['-t', str(duration)])
        
        cmd.extend([
            '-acodec', 'pcm_s16le',  # WAV codec
            filepath
        ])
        
        # Execute ffmpeg
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            print(f"✓ Saved segment {i+1}/{len(segments)}: {segment['start']} - {text_preview[:30]}...")
        except subprocess.CalledProcessError as e:
            print(f"✗ Error creating segment {i+1}: {e.stderr.decode()}")
    
    print(f"\n✓ Created {len(segments)} audio segments in '{output_dir}'")
    return output_dir

# Example usage
if __name__ == "__main__":
    audio_file = "/Users/dheerajthota/Documents/AIATL/downloads/RavensNFL 2024 Season.wav"
    transcript_file = "/Users/dheerajthota/Documents/AIATL/tactiq-free-transcript-FT8IxVV8vFM.txt"
    
    segment_audio(audio_file, transcript_file)