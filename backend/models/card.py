from typing import Optional, List
from pydantic import BaseModel, Field


class Card(BaseModel):
    """扑克牌模型"""
    suit: str = Field(..., description="花色: hearts/diamonds/clubs/spades")
    rank: str = Field(..., description="点数: A, 2-10, J, Q, K")
    value: int = Field(..., description="点数数值: A=14, K=13, Q=12, J=11, 2-10=对应数值")

    def get_suit_symbol(self) -> str:
        """获取花色 Unicode 符号"""
        suit_symbols = {
            "spades": "♠",
            "hearts": "♥",
            "diamonds": "♦",
            "clubs": "♣"
        }
        return suit_symbols.get(self.suit, "?")

    def get_suit_color(self) -> str:
        """获取花色颜色"""
        return "red" if self.suit in ["hearts", "diamonds"] else "black"

    def __str__(self) -> str:
        return f"{self.get_suit_symbol()}{self.rank}"


class CardRound(BaseModel):
    """单轮对决记录"""
    round_num: int = Field(..., description="轮次编号(1-3)")
    player_card: Card = Field(..., description="玩家的牌")
    opponent_card: Card = Field(..., description="对手的牌")
    result: str = Field(..., description="结果: win/lose/draw")
    reason: str = Field(..., description="胜负原因说明")


class CardDungeonState(BaseModel):
    """扑克牌副本状态(三局两胜制)"""
    session_id: str = Field(..., description="会话ID")
    game_mode: str = Field("compare", description="游戏模式: compare(比大小)")
    max_rounds: int = Field(3, description="最大轮数")
    win_target: int = Field(2, description="获胜所需胜场数")
    rounds: List[CardRound] = Field(default_factory=list, description="已进行的轮次记录")
    player_wins: int = Field(0, description="玩家获胜次数")
    opponent_wins: int = Field(0, description="对手获胜次数")
    current_round: int = Field(0, description="当前轮次(0表示未开始)")
    status: str = Field("playing", description="状态: playing/finished")
    final_result: Optional[str] = Field(None, description="最终结果: win/lose/draw")
    magic_command: Optional[str] = Field(None, description="当前魔法指令")


class CardDungeonRequest(BaseModel):
    """开始副本请求"""
    game_mode: str = Field("compare", description="游戏模式: compare(比大小)")


class CardMagicRequest(BaseModel):
    """魔法指令请求"""
    session_id: str = Field(..., description="会话ID")
    command: str = Field("", description="魔法指令")


class CardRoundRequest(BaseModel):
    """进行一轮请求"""
    session_id: str = Field(..., description="会话 ID")
    magic_command: Optional[str] = Field(None, description="魔法指令（可选）")
