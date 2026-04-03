from pydantic import BaseModel
from typing import Optional


class AbsurdDungeonState(BaseModel):
    session_id: str
    topic: str = ""              # 正经题目
    opponent_answer: str = ""    # AI对手的胡说回答
    player_answer: str = ""      # 玩家的胡说回答
    judge_comment: str = ""      # 裁判评语
    result: Optional[str] = None
    status: str = "topic"        # topic/answering/judging/finished
