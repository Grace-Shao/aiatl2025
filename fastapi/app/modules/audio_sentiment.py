import os
from glob import glob

import numpy as np
import pandas as pd
from tqdm import tqdm
import librosa
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from huggingface_hub import login

# Only login if token is available
hf_token = os.getenv("HUGGINGFACE_API_KEY")
if hf_token:
    login(token=hf_token)
else:
    print("Warning: HUGGINGFACE_API_KEY not found in environment variables")

from transformers import pipeline
import torch

# Check if running on Mac with MPS (Metal Performance Shaders)
device = "mps" if torch.backends.mps.is_available() else "cpu"

emotion_pipe = pipeline(
    "audio-classification",
    model="superb/hubert-base-superb-er"  # pre-trained emotion recognizer
)

SAMPLE_RATE = 16000

def score_clip(path_or_audio, sr=None):
    """
    Score audio clip from either file path or raw audio array.
    
    Args:
        path_or_audio: Either a file path (str) or audio array (numpy array or bytes)
        sr: Sample rate (required if passing raw audio)
    
    Returns:
        Dict with emotion scores and energy
    """
    # 1) Load audio at 16k mono
    if isinstance(path_or_audio, str):
        # Load from file
        audio, sr = librosa.load(path_or_audio, sr=SAMPLE_RATE, mono=True)
        path = path_or_audio
    elif isinstance(path_or_audio, (bytes, bytearray)):
        # Convert bytes to numpy array (assuming WAV format)
        import io
        import wave
        
        # Read WAV from bytes
        with wave.open(io.BytesIO(bytes(path_or_audio)), 'rb') as wav_file:
            sr = wav_file.getframerate()
            n_frames = wav_file.getnframes()
            audio_bytes = wav_file.readframes(n_frames)
            
            # Convert to numpy array
            if wav_file.getsampwidth() == 2:  # 16-bit
                audio = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
            elif wav_file.getsampwidth() == 4:  # 32-bit
                audio = np.frombuffer(audio_bytes, dtype=np.int32).astype(np.float32) / 2147483648.0
            else:
                audio = np.frombuffer(audio_bytes, dtype=np.uint8).astype(np.float32) / 128.0 - 1.0
            
            # Convert stereo to mono if needed
            if wav_file.getnchannels() == 2:
                audio = audio.reshape(-1, 2).mean(axis=1)
        
        # Resample if needed
        if sr != SAMPLE_RATE:
            audio = librosa.resample(audio, orig_sr=sr, target_sr=SAMPLE_RATE)
        path = "stream_audio"
    else:
        # Assume numpy array
        audio = np.array(path_or_audio)
        if len(audio.shape) > 1:
            audio = np.mean(audio, axis=1)  # Convert to mono
        # Resample if needed
        if sr and sr != SAMPLE_RATE:
            audio = librosa.resample(audio, orig_sr=sr, target_sr=SAMPLE_RATE)
        path = "raw_audio"
    
    inp = {"array": audio, "sampling_rate": SAMPLE_RATE}

    # 2) Audio → emotion
    emo_preds = emotion_pipe(inp, top_k=None)
    emo_scores = {p["label"]: p["score"] for p in emo_preds}

    happy = emo_scores.get("hap", 0.0)
    angry = emo_scores.get("ang", 0.0)
    neutral = emo_scores.get("neu", 0.0)
    sad = emo_scores.get("sad", 0.0)

    excited_audio = happy + angry   # high-arousal emotions
    calm_audio = neutral + sad

    # 3) Loudness (RMS energy)
    energy = float(np.sqrt(np.mean(audio**2)) + 1e-9)

    return {
        "path": path,
        "filename": os.path.basename(path),
        "happy": happy,
        "angry": angry,
        "neutral": neutral,
        "sad": sad,
        "excited_audio": excited_audio,
        "calm_audio": calm_audio,
        "energy": energy,
    }
