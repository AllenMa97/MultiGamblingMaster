import Phaser from 'phaser';
import { post, createWebSocket } from '../utils/api.js';
import { createChatPanel, createInputBox, createRoundIndicator } from '../components/ChatPanel.js';

/**
 * AI 辩论副本场景
 * 玩家与 AI 对手进行扑克牌辩论
 */
export default class AIDungeonScene extends Phaser.Scene {
  constructor() {
    super({ key: 'AIDungeonScene' });
  }

  init(data) {
    // 接收节点 ID（用于返回地图）
    this.nodeId = data.nodeId || null;
    this.saveId = data.saveId || null;
    this.sessionId = null;
    this.playerCard = null;
    this.maxRounds = 3;
    this.currentRound = 0;
    this.ws = null;
    this.isWaitingForOpponent = false;
  }

  async create() {
    const { width, height } = this.scale;

    // 添加背景
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    // 添加标题
    this.add.text(width / 2, 30, 'AI 辩论副本', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 开始副本
    await this.startDungeon();
  }

  /**
   * 开始辩论副本
   */
  async startDungeon() {
    try {
      // 调用后端开始 API
      const response = await post('/dungeon/ai/start', {});
      this.sessionId = response.session_id;
      this.playerCard = response.player_card;
      this.maxRounds = response.max_rounds;
      this.currentRound = 0;

      // 创建 UI
      this.createUI();

      // 显示玩家手牌
      this.displayPlayerCard();

      // 连接 WebSocket
      this.connectWebSocket();

    } catch (error) {
      console.error('开始副本失败:', error);
      this.showError('开始副本失败，请重试');
    }
  }

  /**
   * 创建 UI 元素
   */
  createUI() {
    const { width, height } = this.scale;

    // 左侧：玩家手牌区域
    this.add.text(150, 80, '你的手牌', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#4FC3F7',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 回合指示器
    this.roundIndicator = createRoundIndicator(this, width / 2, 80);

    // 右侧：对话面板
    this.chatPanel = createChatPanel(this, width / 2 + 50, 120, 550, 400);

    // 底部：输入框
    this.inputBox = createInputBox(
      this,
      width / 2 + 50,
      height - 80,
      550,
      (text) => this.onPlayerSubmit(text)
    );

    // 禁用输入框（等待开场白）
    this.inputBox.disable();

    // 返回按钮
    const backButton = this.add.text(50, height - 40, '< 返回地图', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#aaaaaa',
    }).setInteractive({ useHandCursor: true });

    backButton.on('pointerover', () => backButton.setColor('#ffffff'));
    backButton.on('pointerout', () => backButton.setColor('#aaaaaa'));
    backButton.on('pointerdown', () => this.returnToMap());
  }

  /**
   * 显示玩家手牌
   */
  displayPlayerCard() {
    if (!this.playerCard) return;

    const x = 150;
    const y = 200;

    // 绘制扑克牌
    const cardGraphics = this.add.graphics();
    
    // 牌背景
    cardGraphics.fillStyle(0xffffff, 1);
    cardGraphics.fillRoundedRect(x - 50, y - 75, 100, 150, 8);
    cardGraphics.lineStyle(2, 0x000000, 1);
    cardGraphics.strokeRoundedRect(x - 50, y - 75, 100, 150, 8);

    // 根据花色决定颜色
    const isRed = this.playerCard.suit === '♥' || this.playerCard.suit === '♦';
    const color = isRed ? '#ff0000' : '#000000';

    // 牌面内容
    const suitText = this.add.text(x, y - 30, this.playerCard.suit, {
      fontSize: '48px',
      fontFamily: 'Arial',
      color: color,
    }).setOrigin(0.5);

    const rankText = this.add.text(x, y + 30, this.playerCard.rank, {
      fontSize: '36px',
      fontFamily: 'Arial',
      color: color,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 牌说明
    this.add.text(x, y + 120, this.playerCard.display, {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    // 提示文字
    this.add.text(x, y + 160, '说服裁判你的牌更大！', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#aaaaaa',
    }).setOrigin(0.5);
  }

  /**
   * 连接 WebSocket
   */
  connectWebSocket() {
    if (!this.sessionId) return;

    // 使用相对路径（通过 Vite proxy）
    const wsUrl = `ws://${window.location.host}/ws/dungeon/ai/${this.sessionId}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket 连接成功');
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleWebSocketMessage(data);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket 错误:', error);
      this.showError('连接错误');
    };

    this.ws.onclose = () => {
      console.log('WebSocket 连接关闭');
    };
  }

  /**
   * 处理 WebSocket 消息
   */
  handleWebSocketMessage(data) {
    switch (data.type) {
      case 'opponent_message':
        this.handleOpponentMessage(data);
        break;
      case 'player_message':
        this.handlePlayerMessage(data);
        break;
      case 'judge_message':
        this.handleJudgeMessage(data);
        break;
      case 'result':
        this.handleResult(data);
        break;
      case 'error':
        this.showError(data.content);
        break;
    }
  }

  /**
   * 处理对手消息
   */
  handleOpponentMessage(data) {
    if (!data.done) {
      // 流式接收中
      if (!this.currentOpponentMessage) {
        // 新消息开始
        this.currentOpponentMessage = this.chatPanel.addMessage('opponent', '');
        this.isWaitingForOpponent = true;
        this.inputBox.disable();
      }
      if (data.content) {
        this.chatPanel.appendToLast(data.content);
      }
    } else {
      // 消息结束
      this.currentOpponentMessage = null;
      this.isWaitingForOpponent = false;
      
      // 检查是否还在游戏中
      if (this.currentRound < this.maxRounds) {
        this.inputBox.enable();
      }
      
      // 更新回合数
      this.currentRound++;
      this.roundIndicator.setRound(Math.min(this.currentRound + 1, this.maxRounds), this.maxRounds);
    }
  }

  /**
   * 处理玩家消息确认
   */
  handlePlayerMessage(data) {
    this.chatPanel.addMessage('player', data.content);
    this.inputBox.disable();
  }

  /**
   * 处理裁判消息
   */
  handleJudgeMessage(data) {
    if (!data.done) {
      // 流式接收中
      if (!this.currentJudgeMessage) {
        // 新消息开始
        this.currentJudgeMessage = this.chatPanel.addMessage('judge', '');
      }
      if (data.content) {
        this.chatPanel.appendToLast(data.content);
      }
    } else {
      // 消息结束
      this.currentJudgeMessage = null;
    }
  }

  /**
   * 处理最终结果
   */
  handleResult(data) {
    const isWin = data.result === 'win';
    
    // 保存结果
    this.dungeonResult = isWin ? 'win' : 'lose';
    
    // 禁用输入框
    this.inputBox.disable();

    // 显示结果弹窗
    this.showResultModal(isWin);
  }

  /**
   * 玩家提交消息
   */
  onPlayerSubmit(text) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.showError('连接已断开');
      return;
    }

    if (this.isWaitingForOpponent) {
      return;
    }

    // 发送消息到服务器
    this.ws.send(JSON.stringify({
      type: 'player_message',
      content: text,
    }));
  }

  /**
   * 显示结果弹窗
   */
  showResultModal(isWin) {
    const { width, height } = this.scale;

    // 半透明遮罩
    const overlay = this.add.rectangle(
      width / 2, height / 2, width, height, 0x000000, 0.8
    );

    // 结果文字
    const resultText = this.add.text(width / 2, height / 2 - 50, isWin ? '胜利！' : '失败！', {
      fontSize: '64px',
      fontFamily: 'Arial',
      color: isWin ? '#4ade80' : '#f87171',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 结果描述
    const descText = this.add.text(width / 2, height / 2 + 30, 
      isWin ? '你成功说服了裁判！' : '裁判没有被你说服...', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    // 返回地图按钮
    const backButton = this.add.text(width / 2, height / 2 + 120, '返回地图', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#1a1a2e',
      backgroundColor: '#4FC3F7',
      padding: { x: 30, y: 15 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backButton.on('pointerover', () => {
      backButton.setStyle({ backgroundColor: '#6FD5F9' });
    });
    backButton.on('pointerout', () => {
      backButton.setStyle({ backgroundColor: '#4FC3F7' });
    });
    backButton.on('pointerdown', () => {
      this.returnToMap();
    });

    // 动画效果
    this.tweens.add({
      targets: [resultText, descText, backButton],
      scale: { from: 0.5, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 500,
      ease: 'Back.out',
    });
  }

  /**
   * 显示错误信息
   */
  showError(message) {
    const { width, height } = this.scale;

    const errorText = this.add.text(width / 2, height / 2, message, {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#f87171',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5);

    // 3秒后自动消失
    this.time.delayedCall(3000, () => {
      errorText.destroy();
    });
  }

  /**
   * 返回地图
   */
  returnToMap() {
    // 关闭 WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // 返回地图场景
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MapScene', {
        saveId: this.saveId,
        nodeId: this.nodeId,
        dungeonResult: this.dungeonResult || null,
        mapId: this.mapId,
      });
    });
  }

  shutdown() {
    // 清理资源
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
