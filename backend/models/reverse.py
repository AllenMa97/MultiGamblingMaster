from pydantic import BaseModel
from typing import Optional, List


class ReverseMessage(BaseModel):
    speaker: str  # "player"/"opponent"/"judge"
    content: str


class ReverseDungeonState(BaseModel):
    session_id: str
    absurd_claim: str = ""       # 荒谬论点
    messages: List[ReverseMessage] = []
    max_rounds: int = 3
    current_round: int = 0
    player_convinced: bool = False
    opponent_convinced: bool = False
    result: Optional[str] = None
    status: str = "claim"  # claim/debating/finished
