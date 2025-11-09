import asyncio
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from collections import deque
import numpy as np

from .scoring import calculate_play_criticality_score, categorize_criticality, is_key_play
from .audio_sentiment import score_clip


@dataclass
class KeyMoment:
    """Represents a detected key moment with combined scores."""
    timestamp: float
    play_score: float
    play_category: str
    audio_excitement: float
    audio_energy: float
    combined_score: float
    is_key_moment: bool
    play_data: dict
    audio_data: Optional[dict] = None
    breakdown: Optional[dict] = None


class KeyMomentDetector:
    """
    Real-time key moment detection by combining play-by-play criticality
    and audio sentiment analysis.
    """
    
    def __init__(
        self,
        audio_weight: float = 0.3,
        play_weight: float = 0.7,
        key_moment_threshold: float = 60.0,
        temporal_window: float = 5.0  # seconds
    ):
        """
        Args:
            audio_weight: Weight for audio sentiment score (0-1)
            play_weight: Weight for play criticality score (0-1)
            key_moment_threshold: Combined score threshold for key moments
            temporal_window: Time window for audio-play matching (seconds)
        """
        self.audio_weight = audio_weight
        self.play_weight = play_weight
        self.key_moment_threshold = key_moment_threshold
        self.temporal_window = temporal_window
        
        # Buffers for temporal matching
        self.audio_buffer = deque(maxlen=100)
        self.play_buffer = deque(maxlen=100)
        self.detected_moments = []
    
    def normalize_audio_score(self, audio_data: dict) -> Tuple[float, float]:
        """
        Normalize audio sentiment to 0-100 scale.
        
        Returns:
            (excitement_score, energy_score)
        """
        # Excitement from emotion detection (0-1)
        excitement = audio_data.get('excited_audio', 0.0)
        # Energy from RMS (typically 0.0-0.1 range, normalize to 0-1)
        energy_raw = audio_data.get('energy', 0.0)
        energy = min(energy_raw * 10, 1.0)  # Scale up and cap at 1.0
        
        # Convert to 0-100 scale
        excitement_score = excitement * 100
        energy_score = energy * 100
        
        # Combined audio score
        audio_score = (excitement_score * 0.6 + energy_score * 0.4)
        
        return audio_score, energy_score
    
    def calculate_combined_score(
        self,
        play_score: float,
        audio_score: float
    ) -> float:
        """
        Combine play criticality and audio sentiment into single score.
        """
        combined = (
            play_score * self.play_weight +
            audio_score * self.audio_weight
        )
        return combined
    
    def find_matching_audio(self, play_timestamp: float) -> Optional[dict]:
        """
        Find audio data within temporal window of play timestamp.
        """
        for audio_data in self.audio_buffer:
            audio_ts = audio_data.get('timestamp', 0.0)
            if abs(audio_ts - play_timestamp) <= self.temporal_window:
                return audio_data
        return None
    
    def process_play_event(
        self,
        play_event: dict,
        audio_clip_path: Optional[str] = None
    ) -> KeyMoment:
        """
        Process a play event and optionally its audio to detect key moments.
        
        Args:
            play_event: Play-by-play event data
            audio_clip_path: Optional path to audio clip for this play
            
        Returns:
            KeyMoment object with combined analysis
        """
        timestamp = play_event.get('absoluteAudioTimestamp', 0.0)
        
        # Calculate play criticality score
        play_score, play_category_raw, breakdown = calculate_play_criticality_score(play_event)
        play_category_label = categorize_criticality(play_score)
        
        # Process audio if available
        audio_score = 0.0
        audio_energy = 0.0
        audio_data = None
        
        if audio_clip_path:
            try:
                audio_data = score_clip(audio_clip_path)
                audio_score, audio_energy = self.normalize_audio_score(audio_data)
                audio_data['timestamp'] = timestamp
                self.audio_buffer.append(audio_data)
            except Exception as e:
                print(f"Error processing audio: {e}")
        else:
            # Try to find matching audio from buffer
            audio_match = self.find_matching_audio(timestamp)
            if audio_match:
                audio_data = audio_match
                audio_score, audio_energy = self.normalize_audio_score(audio_data)
        
        # Calculate combined score
        combined_score = self.calculate_combined_score(play_score, audio_score)
        
        # Determine if this is a key moment
        is_key = combined_score >= self.key_moment_threshold or is_key_play(play_score, play_category_label)
        
        # Create KeyMoment object
        moment = KeyMoment(
            timestamp=timestamp,
            play_score=play_score,
            play_category=play_category_label,
            audio_excitement=audio_score,
            audio_energy=audio_energy,
            combined_score=combined_score,
            is_key_moment=is_key,
            play_data=play_event,
            audio_data=audio_data,
            breakdown=breakdown
        )
        
        # Store key moments
        if is_key:
            self.detected_moments.append(moment)
        
        return moment
    
    def add_audio_event(self, audio_clip_path: str, timestamp: float):
        """
        Add audio data to buffer for temporal matching.
        """
        try:
            audio_data = score_clip(audio_clip_path)
            audio_data['timestamp'] = timestamp
            self.audio_buffer.append(audio_data)
        except Exception as e:
            print(f"Error adding audio event: {e}")
    
    def get_key_moments(self, min_score: Optional[float] = None) -> List[KeyMoment]:
        """
        Get all detected key moments, optionally filtered by minimum score.
        """
        if min_score is not None:
            return [m for m in self.detected_moments if m.combined_score >= min_score]
        return self.detected_moments
    
    def get_top_moments(self, n: int = 10) -> List[KeyMoment]:
        """
        Get top N key moments by combined score.
        """
        sorted_moments = sorted(
            self.detected_moments,
            key=lambda m: m.combined_score,
            reverse=True
        )
        return sorted_moments[:n]
    
    def export_moments_summary(self) -> List[dict]:
        """
        Export key moments as a list of dictionaries for serialization.
        """
        return [
            {
                'timestamp': m.timestamp,
                'play_score': round(m.play_score, 2),
                'play_category': m.play_category,
                'audio_excitement': round(m.audio_excitement, 2),
                'audio_energy': round(m.audio_energy, 2),
                'combined_score': round(m.combined_score, 2),
                'description': m.play_data.get('Description', 'N/A'),
                'quarter': m.play_data.get('quarter', 'N/A'),
                'breakdown': m.breakdown
            }
            for m in self.detected_moments
        ]


async def process_streams_for_key_moments(
    base_url: str = "http://localhost:8000",
    speed: float = 1.0,
    audio_weight: float = 0.3,
    play_weight: float = 0.7,
    key_moment_threshold: float = 60.0
) -> List[KeyMoment]:
    """
    Process both audio and event streams simultaneously to detect key moments.
    
    Args:
        base_url: Base URL of streaming API
        speed: Playback speed
        audio_weight: Weight for audio sentiment
        play_weight: Weight for play criticality
        key_moment_threshold: Threshold for key moment detection
        
    Returns:
        List of detected KeyMoment objects
    """
    from .stream import listen_to_events_stream
    
    detector = KeyMomentDetector(
        audio_weight=audio_weight,
        play_weight=play_weight,
        key_moment_threshold=key_moment_threshold
    )
    
    def process_event(event: dict):
        """Callback to process each play event."""
        moment = detector.process_play_event(event)
        
        if moment.is_key_moment:
            print(f"\n{'='*60}")
            print(f"🔥 KEY MOMENT DETECTED! 🔥")
            print(f"{'='*60}")
            print(f"Time: {moment.timestamp:.1f}s | Quarter: {moment.play_data.get('quarter')}")
            print(f"Combined Score: {moment.combined_score:.1f}")
            print(f"  - Play Score: {moment.play_score:.1f} ({moment.play_category})")
            print(f"  - Audio Excitement: {moment.audio_excitement:.1f}")
            print(f"Description: {moment.play_data.get('Description', 'N/A')}")
            print(f"{'='*60}\n")
    
    # Process events stream with callback
    await listen_to_events_stream(
        base_url=base_url,
        event_callback=process_event,
        speed=speed
    )
    
    return detector.get_key_moments()
