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

def score_clip(path):
    # 1) Load audio at 16k mono
    audio, sr = librosa.load(path, sr=SAMPLE_RATE, mono=True)
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
