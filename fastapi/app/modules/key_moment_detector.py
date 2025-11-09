"""
Key Moment Detection - Pure Streaming Approach

Uses ONLY the streaming endpoints - no access to preprocessed files.
"""

import asyncio
import logging
from typing import List, Optional
from dataclasses import dataclass
from collections import deque

from .scoring import calculate_play_criticality_score
from .audio_sentiment import score_clip
from .stream import listen_to_events_stream, listen_to_audio_stream

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class AudioSegment:
    """Audio segment received from stream."""
    index: int
    timestamp: float  # Time relative to stream start
    data: bytes  # Raw audio data
    audio_score: Optional[float] = None


@dataclass
class KeyMoment:
    """Detected key moment."""
    timestamp: float
    play_score: float
    play_category: str
    audio_score: float
    combined_score: float
    is_key_moment: bool
    play_data: dict
    audio_segments_used: List[int]


class KeyMomentDetector:
    """
    Real-time key moment detection using streaming data only.
    
    Process:
    1. Receive audio segments from /stream/audio
    2. Store in sliding window buffer
    3. When play event arrives, analyze nearby segments
    4. Combine play + audio scores for key moment detection
    """
    
    def __init__(
        self,
        play_weight: float = 0.7,
        audio_weight: float = 0.3,
        key_moment_threshold: float = 50.0,
        context_segments: int = 2,
        max_buffer_segments: int = 50
    ):
        self.play_weight = play_weight
        self.audio_weight = audio_weight
        self.key_moment_threshold = key_moment_threshold
        self.context_segments = context_segments
        
        # Sliding window of audio segments
        self.audio_segments: deque[AudioSegment] = deque(maxlen=max_buffer_segments)
        self.detected_moments: List[KeyMoment] = []
        
        self.segment_count = 0
        self.current_audio_time = 0.0
        
        logger.info(
            f"Detector initialized: play_weight={play_weight}, "
            f"audio_weight={audio_weight}, threshold={key_moment_threshold}"
        )
    
    def add_audio_segment(self, audio_data: bytes, timestamp: float):
        """Store audio segment from stream."""
        segment = AudioSegment(
            index=self.segment_count,
            timestamp=timestamp,
            data=audio_data
        )
        self.audio_segments.append(segment)
        self.segment_count += 1
        self.current_audio_time = timestamp
        
        # Log every 50 segments to track progress
        if self.segment_count % 50 == 0:
            logger.info(f"📈 Added segment #{self.segment_count-1} at {timestamp:.1f}s ({len(audio_data)} bytes)")
        elif self.segment_count <= 5:  # Log first few for debugging
            logger.info(f"🎵 Added segment #{self.segment_count-1} at {timestamp:.1f}s ({len(audio_data)} bytes)")
    
    
    def get_audio_score_for_play(self, play_timestamp: float) -> tuple[float, List[int]]:
        """
        Analyze audio segments near play timestamp.
        Returns: (average_score, segment_indices_used)
        """
        if not self.audio_segments:
            logger.warning("No audio segments available for analysis")
            return 0.0, []
        
        # Find segment closest to play timestamp
        closest_idx = None
        min_diff = float('inf')
        
        for i, seg in enumerate(self.audio_segments):
            diff = abs(seg.timestamp - play_timestamp)
            if diff < min_diff:
                min_diff = diff
                closest_idx = i
        
        if closest_idx is None:
            logger.warning("No closest segment found")
            return 0.0, []
        
        # Get ±context_segments around the closest one
        start_idx = max(0, closest_idx - self.context_segments)
        end_idx = min(len(self.audio_segments) - 1, closest_idx + self.context_segments)
        
        scores = []
        indices_used = []
        
        for i in range(start_idx, end_idx + 1):
            segment = list(self.audio_segments)[i]
            
            # Analyze audio if not yet scored
            if segment.audio_score is None:
                try:
                    result = score_clip(segment.data)
                    # Use excitement as the primary metric, scaled to 0-100
                    segment.audio_score = result.get('excited_audio', 0.0) * 100
                    
                    logger.debug(f"Segment {segment.index} scored: {segment.audio_score:.1f}")
                    
                except Exception as e:
                    logger.error(f"Error scoring segment {segment.index}: {e}")
                    segment.audio_score = 0.0
            
            scores.append(segment.audio_score)
            indices_used.append(segment.index)
        
        avg_score = sum(scores) / len(scores) if scores else 0.0
        return avg_score, indices_used
    
    def process_play_event(self, play_data: dict) -> KeyMoment:
        """Process incoming play event with nearby audio."""
        play_timestamp = play_data.get('absoluteAudioTimestamp', 0.0)
        
        # Normalize play data to match what scoring function expects
        normalized_play = {
            'Down': play_data.get('Down'),
            'Distance': play_data.get('Distance'),
            'Quarter': play_data.get('quarter'),  # lowercase in stream, uppercase in scoring
            'YardLine': play_data.get('YardLine'),
            'YardsGained': play_data.get('YardsGained', 0),
            'PlayType': play_data.get('Type', ''),  # 'Type' in stream, 'PlayType' in scoring
            'Description': play_data.get('Description', ''),
            'Time': play_data.get('PlayTime', ''),
            # Add any other fields that might be needed
            'ScoreHome': play_data.get('ScoreHome'),
            'ScoreAway': play_data.get('ScoreAway'),
        }
        
        # Calculate play criticality
        play_score, _, _ = calculate_play_criticality_score(normalized_play)
        
        # DEBUG: If play score is still 0, log more details
        if play_score == 0.0:
            logger.warning(
                f"Play score still 0! Normalized data: Down={normalized_play.get('Down')}, "
                f"Distance={normalized_play.get('Distance')}, Quarter={normalized_play.get('Quarter')}, "
                f"PlayType='{normalized_play.get('PlayType')}', Description='{normalized_play.get('Description')}'"
            )
        
        # Categorize
        if play_score >= 80:
            play_category = "CRITICAL"
        elif play_score >= 60:
            play_category = "HIGH"
        elif play_score >= 40:
            play_category = "MEDIUM"
        else:
            play_category = "LOW"
        
        # Get audio score from nearby segments
        audio_score, segments_used = self.get_audio_score_for_play(play_timestamp)
        
        # DEBUG: Print details about this play
        logger.info(
            f"Play #{len(self.detected_moments)+1} at {play_timestamp:.1f}s: "
            f"Play={play_score:.1f}, Audio={audio_score:.1f}, "
            f"Segments={len(self.audio_segments)}, Used={segments_used}"
        )
        
        # Combine scores
        combined_score = (
            play_score * self.play_weight +
            audio_score * self.audio_weight
        )
        
        is_key = combined_score >= self.key_moment_threshold
        
        moment = KeyMoment(
            timestamp=play_timestamp,
            play_score=play_score,
            play_category=play_category,
            audio_score=audio_score,
            combined_score=combined_score,
            is_key_moment=is_key,
            play_data=play_data,
            audio_segments_used=segments_used
        )
        
        if is_key:
            logger.info(
                f"🔥 KEY MOMENT at {play_timestamp:.1f}s: "
                f"Combined={combined_score:.1f} (Play={play_score:.1f}, Audio={audio_score:.1f})"
            )
        
        return moment
    
    def get_top_moments(self, n: int = 10) -> List[KeyMoment]:
        """Get top N moments by combined score."""
        return sorted(self.detected_moments, key=lambda m: m.combined_score, reverse=True)[:n]
    
    def export_moments_summary(self) -> List[dict]:
        """Export as JSON-serializable list."""
        return [
            {
                'timestamp': m.timestamp,
                'combined_score': round(m.combined_score, 2),
                'play_score': round(m.play_score, 2),
                'audio_score': round(m.audio_score, 2),
                'play_category': m.play_category,
                'is_key_moment': m.is_key_moment,
                'description': m.play_data.get('Description', 'N/A'),
                'quarter': m.play_data.get('quarter'),
                'segments_used': m.audio_segments_used
            }
            for m in self.detected_moments
        ]


async def process_streams_for_key_moments(
    speed: float = 1.0,
    audio_weight: float = 0.3,
    play_weight: float = 0.7,
    key_moment_threshold: float = 50.0,
    context_segments: int = 2,
    key_moment_callback=None,  # NEW: Callback for real-time key moments
    **kwargs  # Ignore unused params like audio_segments_dir
) -> List[KeyMoment]:
    """
    Process streams in real-time for key moment detection.
    
    Uses only the streaming endpoints - no file system access.
    """
    detector = KeyMomentDetector(
        play_weight=play_weight,
        audio_weight=audio_weight,
        key_moment_threshold=key_moment_threshold,
        context_segments=context_segments
    )
    
    logger.info(f"Starting real-time detection at {speed}x speed...")
    logger.info(f"Analyzing with ±{context_segments} audio segments per play")
    
    # Track progress
    play_count = 0
    audio_chunk_count = 0
    audio_buffer = bytearray()  # Buffer for accumulating stream data
    stream_start_time = None  # Track when stream started
    
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
                logger.debug(f"⚠️  Skipping {riff_idx} bytes of garbage before RIFF")
                buffer[:] = buffer[riff_idx:]
            
            # Need at least 8 bytes to read header
            if len(buffer) < 8:
                break
            
            # Read file size from RIFF header (little-endian, bytes 4-7)
            chunk_size = int.from_bytes(buffer[4:8], 'little')
            total_size = chunk_size + 8
            
            logger.debug(f"📦 Found WAV file: chunk_size={chunk_size}, total_size={total_size}")
            
            # Check if we have the complete file
            if len(buffer) < total_size:
                logger.debug(f"⏳ Need more data: have {len(buffer)}, need {total_size}")
                break
            
            # Extract this WAV file
            wav_data = bytes(buffer[:total_size])
            wav_files.append(wav_data)
            logger.debug(f"✅ Extracted WAV #{len(wav_files)}: {len(wav_data)} bytes")
            
            # Remove it from buffer
            buffer[:] = buffer[total_size:]
        
        return wav_files
    
    def process_audio_chunk(chunk: bytes):
        """Handle incoming audio chunks from stream."""
        nonlocal audio_chunk_count, audio_buffer, stream_start_time
        
        # Set start time on first chunk
        if stream_start_time is None:
            import time
            stream_start_time = time.time()
        
        audio_chunk_count += 1
        
        # Debug first chunk
        if audio_chunk_count == 1:
            logger.info(f"📥 First audio chunk: {len(chunk)} bytes")
            logger.info(f"   Starts with: {chunk[:min(20, len(chunk))].hex()}")
            riff_pos = chunk.find(b'RIFF')
            if riff_pos >= 0:
                logger.info(f"   🎯 RIFF found at position {riff_pos}")
            else:
                logger.info(f"   ❌ No RIFF in first chunk")
        
        # Add chunk to buffer
        audio_buffer.extend(chunk)
        
        # Try to extract complete WAV files
        wav_files = extract_wav_files(audio_buffer)
        
        # Store each extracted WAV file as a segment with better timestamp estimation
        for i, wav_data in enumerate(wav_files):
            # Better timestamp estimation: Use actual elapsed time since stream start
            import time
            elapsed_since_start = time.time() - stream_start_time
            # Each WAV segment is roughly 1 second, so estimate based on segment count
            estimated_timestamp = detector.segment_count * 1.0
            
            detector.add_audio_segment(wav_data, estimated_timestamp)
        
        # Progress logging
        if audio_chunk_count % 500 == 0:
            logger.info(
                f"📊 Audio progress: {audio_chunk_count} chunks, "
                f"{detector.segment_count} WAV segments extracted, "
                f"buffer: {len(audio_buffer)} bytes"
            )
        
        # Log WAV extraction progress
        if len(wav_files) > 0:
            logger.info(f"🎵 Extracted {len(wav_files)} new WAV file(s)! Total: {detector.segment_count}")
    
    
    
    def process_event(event: dict):
        """Handle incoming play events."""
        nonlocal play_count
        play_count += 1
        
        moment = detector.process_play_event(event)
        detector.detected_moments.append(moment)
        
        # Log key moments immediately
        if moment.is_key_moment:
            logger.info(
                f"🔥 KEY MOMENT #{play_count} at {moment.timestamp:.1f}s: "
                f"Score={moment.combined_score:.1f} ({moment.play_category})"
            )
            
            # Call the real-time callback if provided
            if key_moment_callback:
                key_moment_callback(moment)
        
        if play_count % 25 == 0:
            key_count = sum(1 for m in detector.detected_moments if m.is_key_moment)
            logger.info(
                f"📊 Event progress: {play_count} plays processed, "
                f"{key_count} key moments detected, "
                f"{detector.segment_count} audio segments available"
            )
    
    # Process both streams concurrently
    await asyncio.gather(
        listen_to_audio_stream(chunk_callback=process_audio_chunk, speed=speed),
        listen_to_events_stream(event_callback=process_event, speed=speed)
    )
    
    key_count = sum(1 for m in detector.detected_moments if m.is_key_moment)
    logger.info(f"✅ Finished! {play_count} plays, {key_count} key moments detected")
    
    return detector.detected_moments
