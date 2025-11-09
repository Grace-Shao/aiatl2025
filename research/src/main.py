from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import Play, PlayCriticalityResponse
from scoring import (
    calculate_play_criticality_score, 
    categorize_criticality, 
    is_key_play
)

app = FastAPI(
    title="Play Criticality API",
    description="Identify key plays from play-by-play data with separate scoring for offensive and defensive plays"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {
        "message": "Play Criticality Scoring API",
        "version": "2.0",
        "features": [
            "Separate scoring for offensive and defensive plays",
            "Special handling for punts on 4th down",
            "Context-aware scoring (time, score differential, field position)",
            "Key play identification"
        ]
    }


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


@app.get("/health")
def health_check():
    return {"status": "healthy"}
