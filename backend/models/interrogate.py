from pydantic import BaseModel
from typing import Optional, List


class InterrogateMessage(BaseModel):
    speaker: str  # "detective"/"player"/"opponent"
    content: str


class InterrogateDungeonState(BaseModel):
    session_id: str
    scenario: str = ""          # 场景背景（如"银行抢劫案"）
    player_story: str = ""      # 玩家编的故事
    opponent_story: str = ""    # AI对手编的故事
    messages: List[InterrogateMessage] = []
    max_questions: int = 6      # 侦探总共问6个问题（每人3个）
    current_question: int = 0
    player_holes: int = 0       # 玩家故事漏洞数
    opponent_holes: int = 0     # 对手故事漏洞数
    result: Optional[str] = None
    status: str = "scenario"    # scenario/story_writing/interrogating/verdict/finished
