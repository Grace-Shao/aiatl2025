from pydantic import BaseModel
from typing import Optional
from enum import Enum


class PlayCategory(str, Enum):
    OFFENSIVE = "offensive"
    DEFENSIVE = "defensive"
    SPECIAL_TEAMS = "special_teams"


class Play(BaseModel):
    Quarter: Optional[int] = None
    Time: Optional[str] = None
    Down: Optional[int] = None
    Distance: Optional[int] = None
    YardLine: Optional[str] = None
    YardsGained: Optional[int] = None
    PlayType: Optional[str] = None
    Description: Optional[str] = None
    ScoreHome: Optional[int] = None
    ScoreAway: Optional[int] = None
    PossessionTeam: Optional[str] = None


class PlayCriticalityResponse(BaseModel):
    score: float
    category: str
    play_category: str
    is_key_play: bool
    play: Play
    scoring_breakdown: dict

