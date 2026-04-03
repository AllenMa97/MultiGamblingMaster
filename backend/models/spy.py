from pydantic import BaseModel
from typing import Optional, List, Dict


class SpyPlayer(BaseModel):
    id: str          # "player" 或 "npc1"-"npc7"
    name: str
    word: str        # 分配到的词
    is_spy: bool     # 是否卧底
    is_alive: bool = True
    descriptions: List[str] = []  # 每轮的描述


class VoteRecord(BaseModel):
    voter: str       # 投票者id
    target: str      # 被投票者id


class SpyRound(BaseModel):
    round_num: int
    descriptions: Dict[str, str]  # player_id -> 描述
    votes: List[VoteRecord]
    eliminated: Optional[str] = None  # 被淘汰的人


class SpyDungeonState(BaseModel):
    session_id: str
    player_name: str = "玩家"
    word_civilian: str      # 平民词
    word_spy: str           # 卧底词
    players: List[SpyPlayer] = []
    rounds: List[SpyRound] = []
    current_round: int = 0
    status: str = "describing"  # describing/voting/eliminated/finished
    result: Optional[str] = None  # "win"/"lose"
    player_is_spy: bool = False
