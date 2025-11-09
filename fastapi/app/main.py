from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.modules.models import Play, PlayCriticalityResponse
from app.modules.scoring import (
    calculate_play_criticality_score, 
    categorize_criticality, 
    is_key_play
)

app = FastAPI(
    title="HypeZone's API",
    description="Backend Documentation"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to your needs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




@app.get("/", summary="Root Endpoint")
def read_root():
    """
    Root endpoint to verify the API is running.
    """
    return {"message": f"Welcome to HypeZone API!"}



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