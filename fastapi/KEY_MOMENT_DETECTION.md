# Key Moment Detection System

## Overview
Real-time key moment detection combining:
1. **Play-by-play criticality scoring** - Analyzes game situation, down/distance, score differential
2. **Audio sentiment analysis** - Detects excitement and energy in audio commentary

## Architecture

```
Streaming Server (research/src/stream.py)
    ├── /stream/events → Play-by-play events (SSE)
    └── /stream/audio → Audio segments (WAV)
                ↓
    Synchronized at same speed (1x-100x)
                ↓
Key Moment Detector (fastapi/app/modules/key_moment_detector.py)
    ├── Play Events → scoring.py → Play Score (0-100)
    ├── Audio Clips → audio_sentiment.py → Audio Score (0-100)
    └── Combined Score = (Play × 0.7) + (Audio × 0.3)
                ↓
    Key Moment if: Combined Score ≥ 60 OR Play Category = CRITICAL/HIGH
```

## Key Components

### 1. `key_moment_detector.py`
**Classes:**
- `KeyMomentDetector`: Main detection engine
  - Combines play and audio scores with configurable weights
  - Maintains temporal buffers for audio-play matching
  - Tracks all detected key moments

**Key Methods:**
- `process_play_event()`: Analyzes a play with optional audio
- `calculate_combined_score()`: Weighted combination of scores
- `get_top_moments()`: Returns highest-scoring moments
- `export_moments_summary()`: Exports results to JSON

### 2. Scoring System

#### Play Criticality (`scoring.py`)
Factors considered:
- **Touchdowns**: +50 points
- **4th down attempts**: +30 points
- **Turnovers** (INT/Fumble): +40-45 points
- **3rd down conversions**: +15 points
- **Red zone plays**: +15 points
- **Big gains** (25+ yards): +20 points
- **Close game + Q4**: +15 points
- **Final 2 minutes**: +15 points

#### Audio Sentiment (`audio_sentiment.py`)
Uses HuggingFace `superb/hubert-base-superb-er` model:
- **Excitement**: happy + angry emotions (high arousal)
- **Energy**: RMS audio energy
- Combined: `excitement × 0.6 + energy × 0.4`

### 3. Combined Scoring
```python
combined_score = (play_score × 0.7) + (audio_score × 0.3)
```

**Default weights:**
- Play weight: 0.7 (game situation is primary)
- Audio weight: 0.3 (crowd/announcer excitement confirms)

## Usage

### Run Detection
```bash
cd fastapi
python run_key_moment_detection.py
```

### Customize Parameters
```python
key_moments = await process_streams_for_key_moments(
    speed=100.0,              # Playback speed (1.0 = real-time)
    audio_weight=0.3,         # Weight for audio sentiment
    play_weight=0.7,          # Weight for play criticality
    key_moment_threshold=60.0 # Minimum score for key moment
)
```

### Output
- **Console**: Real-time key moment alerts
- **File**: `key_moments_detected.json` with full analysis

## Example Output

```json
[
  {
    "timestamp": 1650.5,
    "play_score": 85.0,
    "play_category": "CRITICAL",
    "audio_excitement": 72.3,
    "audio_energy": 65.8,
    "combined_score": 81.2,
    "description": "L.Jackson pass deep right to Z.Flowers for 45 yards, TOUCHDOWN",
    "quarter": 3,
    "breakdown": {
      "touchdown": 50,
      "big_gain_25plus": 20,
      "third_down_conversion": 15
    }
  }
]
```

## Tuning the System

### To catch more moments:
- Lower `key_moment_threshold` (e.g., 50.0)
- Increase `audio_weight` (e.g., 0.4)

### To be more selective:
- Raise `key_moment_threshold` (e.g., 70.0)
- Increase `play_weight` (e.g., 0.8)

### For audio-heavy detection:
- Set `audio_weight=0.5`, `play_weight=0.5`

## Next Steps

1. **Real-time Processing**: Process audio clips on-the-fly as they're streamed
2. **Temporal Smoothing**: Average scores over sliding windows
3. **Machine Learning**: Train a model on labeled key moments
4. **Multi-modal Fusion**: Add visual features (player tracking, replays)
5. **Personalization**: Learn user preferences for key moment types
