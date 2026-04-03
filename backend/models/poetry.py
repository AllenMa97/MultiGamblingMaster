from pydantic import BaseModel
from typing import Optional, List


class PoetryTopic(BaseModel):
    theme: str          # 主题，如"月亮"
    constraint: str     # 限定条件，如"七言绝句"
    full_prompt: str    # 完整出题文本


class PoetryDungeonState(BaseModel):
    session_id: str
    topic: Optional[PoetryTopic] = None
    opponent_answer: Optional[str] = None
    player_answer: Optional[str] = None
    judge_comment: Optional[str] = None
    result: Optional[str] = None  # "win"/"lose"
    status: str = "topic"  # topic -> opponent_writing -> player_writing -> judging -> finished
