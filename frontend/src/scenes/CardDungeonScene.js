import Phaser from 'phaser';
import { post } from '../utils/api.js';
import { createCard, flipCard, CARD_WIDTH, CARD_HEIGHT } from '../components/CardHand.js';

export default class CardDungeonScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CardDungeonScene' });
  }

  init(data) {
    // 接收从地图场景传来的数据
    this.nodeData = data || {};
    this.saveId = data?.saveId || null;
    this.nodeId = data?.nodeId || null;
    this.playerName = data?.playerName || '玩家';
    
    // 游戏状态
    this.sessionId = null;
    this.gameState = null;
    this.isProcessing = false;
    
    // 新增：初始牌和最终牌
    this.initialCards = null;
    this.finalCards = null;
    
    // UI 元素引用
    this.uiElements = {};
  }

  async create() {
    const { width, height } = this.scale;

    // 背景
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    // 创建标题和规则
    this.createHeader();
    
    // 创建比分板
    this.createScoreBoard();
    
    // 开始副本
    await this.startDungeon();
  }

  createHeader() {
    const { width } = this.scale;

    // 场景标题
    this.add.text(width / 2, 50, '扑克牌对决 - 比大小', {
      fontSize: '42px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 规则说明
    this.add.text(width / 2, 100, '三局两胜 | 初始发牌 → 使用魔法 → 牌面变化 → 比大小', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#a0aec0',
    }).setOrigin(0.5);
  }

  createScoreBoard() {
    const { width } = this.scale;

    // 比分板背景
    const boardY = 160;
    const boardBg = this.add.graphics();
    boardBg.fillStyle(0x2d3748, 1);
    boardBg.fillRoundedRect(width / 2 - 200, boardY - 30, 400, 60, 10);
    boardBg.lineStyle(2, 0x4a5568, 1);
    boardBg.strokeRoundedRect(width / 2 - 200, boardY - 30, 400, 60, 10);

    // 玩家名
    this.uiElements.playerNameText = this.add.text(width / 2 - 150, boardY, this.playerName, {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#4ade80',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 比分
    this.uiElements.scoreText = this.add.text(width / 2, boardY, '0 : 0', {
      fontSize: '32px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 对手名
    this.uiElements.opponentNameText = this.add.text(width / 2 + 150, boardY, '对手', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#f87171',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 当前局数
    this.uiElements.roundText = this.add.text(width / 2, boardY + 50, '第1局 / 共3局', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#a0aec0',
    }).setOrigin(0.5);
  }

  updateScoreBoard() {
    if (!this.gameState) return;

    const { player_wins, opponent_wins, current_round, max_rounds, status } = this.gameState;

    // 更新比分
    this.uiElements.scoreText.setText(`${player_wins} : ${opponent_wins}`);

    // 更新局数
    if (status === 'finished') {
      this.uiElements.roundText.setText('比赛结束');
    } else {
      this.uiElements.roundText.setText(`第${current_round + 1}局 / 共${max_rounds}局`);
    }
  }

  async startDungeon() {
    try {
      // 调用后端 API 开始副本
      const response = await post('/dungeon/card/start', { game_mode: 'compare' });

      this.sessionId = response.session_id;
      this.gameState = response;

      // 显示游戏区域
      this.createGameArea();
      
    } catch (error) {
      console.error('开始副本失败:', error);
      this.showError('连接失败，请重试');
    }
  }

  createGameArea() {
    const { width, height } = this.scale;

    // 玩家区域标签
    this.add.text(width / 2 - 200, 240, '你的牌', {
      fontSize: '22px',
      fontFamily: 'Arial, sans-serif',
      color: '#4ade80',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 对手区域标签
    this.add.text(width / 2 + 200, 240, '对手的牌', {
      fontSize: '22px',
      fontFamily: 'Arial, sans-serif',
      color: '#f87171',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 创建牌的位置（初始为空）
    this.uiElements.playerCardArea = this.add.container(width / 2 - 200, 360);
    this.uiElements.opponentCardArea = this.add.container(width / 2 + 200, 360);

    // 创建魔法指令输入区域
    this.createMagicInputArea();
  }

  createMagicInputArea() {
    const { width, height } = this.scale;

    // 魔法指令区域背景
    const magicAreaY = 520;
    
    // 背景框
    const bgGraphics = this.add.graphics();
    bgGraphics.fillStyle(0x2d3748, 0.5);
    bgGraphics.fillRoundedRect(width / 2 - 280, magicAreaY - 40, 560, 120, 10);
    bgGraphics.lineStyle(2, 0x4a5568, 1);
    bgGraphics.strokeRoundedRect(width / 2 - 280, magicAreaY - 40, 560, 120, 10);
    
    // 标签
    this.add.text(width / 2 - 200, magicAreaY, '魔法指令:', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#fbbf24',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 创建 DOM 输入框
    const inputElement = document.createElement('input');
    inputElement.type = 'text';
    inputElement.placeholder = '例：大、小、黑桃、红心、换、炸...';
    inputElement.style.cssText = `
      width: 220px;
      height: 40px;
      font-size: 16px;
      padding: 0 12px;
      border: 2px solid #fbbf24;
      border-radius: 8px;
      background-color: #1a1a2e;
      color: #ffffff;
      outline: none;
      font-family: Arial, sans-serif;
      z-index: 9999;
    `;

    this.uiElements.magicInput = this.add.dom(width / 2 + 30, magicAreaY, inputElement);
    
    // 确保输入框在最上层
    setTimeout(() => {
      inputElement.style.zIndex = '9999';
    }, 50);
    
    // 提示文字
    this.add.text(width / 2, magicAreaY + 50, '提示：输入魔法指令可以影响牌面变化，对手也会使用魔法哦！', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#9ca3af',
    }).setOrigin(0.5);

    // 出牌按钮
    this.uiElements.playButton = this.createPlayButton(width / 2, magicAreaY + 100);
  }

  createPlayButton(x, y) {
    const buttonWidth = 140;
    const buttonHeight = 50;

    const container = this.add.container(x, y);

    // 按钮背景
    const bg = this.add.graphics();
    bg.fillStyle(0x3b82f6, 1);
    bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);

    // 按钮文字
    const buttonText = this.add.text(0, 0, '出牌', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([bg, buttonText]);

    // 设置交互
    const hitArea = new Phaser.Geom.Rectangle(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    container.setInteractive({ useHandCursor: true });

    // 悬停效果
    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x2563eb, 1);
      bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
      container.setScale(1.05);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x3b82f6, 1);
      bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
      container.setScale(1);
    });

    // 点击事件
    container.on('pointerdown', () => {
      if (!this.isProcessing && this.gameState?.status !== 'finished') {
        this.onPlayRound();
      }
    });

    return container;
  }

  async onPlayRound() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    // 禁用按钮
    this.uiElements.playButton.disableInteractive();
    this.uiElements.playButton.setAlpha(0.5);

    try {
      // 获取魔法指令
      const magicInput = this.uiElements.magicInput?.node;
      const magicCommand = magicInput?.value?.trim() || '';

      // 清除之前的牌
      this.clearCardAreas();

      // 调用 /round 进行一轮（包含 LLM 干预）
      const response = await post('/dungeon/card/round', {
        session_id: this.sessionId,
        magic_command: magicCommand
      });

      this.gameState = response;

      // 获取当前轮次数据
      const currentRound = response.rounds[response.rounds.length - 1];

      // 动画显示双方牌面（直接显示最终结果）
      await this.showRoundCards(currentRound);

      // 显示胜负原因
      this.showRoundResult(currentRound);

      // 更新比分板
      this.updateScoreBoard();

      // 检查是否结束
      if (response.status === 'finished') {
        this.time.delayedCall(2000, () => {
          this.showFinalResult(response.final_result);
        });
      } else {
        // 重新启用按钮
        this.uiElements.playButton.setInteractive();
        this.uiElements.playButton.setAlpha(1);
        this.isProcessing = false;
      }

    } catch (error) {
      console.error('出牌失败:', error);
      this.showError('出牌失败，请重试');
      this.uiElements.playButton.setInteractive();
      this.uiElements.playButton.setAlpha(1);
      this.isProcessing = false;
    }
  }

  clearCardAreas() {
    // 清除玩家牌区域
    this.uiElements.playerCardArea.removeAll(true);
    
    // 清除对手牌区域
    this.uiElements.opponentCardArea.removeAll(true);

    // 清除之前的结果文字
    if (this.uiElements.resultText) {
      this.uiElements.resultText.destroy();
      this.uiElements.resultText = null;
    }
  }

  async showRoundCards(roundData) {
    const { player_card, opponent_card } = roundData;

    // 创建玩家的牌（正面朝上）
    const playerCardObj = createCard(this, 0, 0, player_card, true);
    this.uiElements.playerCardArea.add(playerCardObj);
    playerCardObj.setScale(0);

    // 创建对手的牌（背面朝上）
    const opponentCardObj = createCard(this, 0, 0, opponent_card, false);
    this.uiElements.opponentCardArea.add(opponentCardObj);
    opponentCardObj.setScale(0);

    // 动画：双方牌同时出现
    return new Promise((resolve) => {
      this.tweens.add({
        targets: [playerCardObj, opponentCardObj],
        scale: 1,
        duration: 300,
        ease: 'Back.out',
        onComplete: async () => {
          // 延迟一下再翻对手的牌
          await new Promise(r => setTimeout(r, 400));
          await flipCard(this, opponentCardObj, opponent_card, 400);
          resolve();
        }
      });
    });
  }

  showRoundResult(roundData) {
    const { width } = this.scale;

    // 显示胜负原因
    this.uiElements.resultText = this.add.text(width / 2, 460, roundData.reason, {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#e2e8f0',
      backgroundColor: '#00000080',
      padding: { x: 15, y: 8 },
    }).setOrigin(0.5);

    // 动画
    this.uiElements.resultText.setAlpha(0);
    this.uiElements.resultText.setY(470);
    this.tweens.add({
      targets: this.uiElements.resultText,
      alpha: 1,
      y: 460,
      duration: 300,
      ease: 'Power2',
    });
  }

  showFinalResult(finalResult) {
    const { width, height } = this.scale;

    // 隐藏出牌按钮和魔法输入
    this.uiElements.playButton.setVisible(false);
    if (this.uiElements.magicInput) {
      this.uiElements.magicInput.destroy();
      this.uiElements.magicInput = null;
    }

    // 创建结果面板
    const panelWidth = 500;
    const panelHeight = 300;

    const panel = this.add.container(width / 2, height / 2);

    // 半透明遮罩
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(-width / 2, -height / 2, width, height);

    // 面板背景
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x1a1a2e, 1);
    panelBg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 16);
    panelBg.lineStyle(3, 0x4a5568, 1);
    panelBg.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 16);

    // 结果标题
    let resultTitle = '';
    let resultColor = '';
    let resultText = '';

    switch (finalResult) {
      case 'win':
        resultTitle = '胜利！';
        resultColor = '#4ade80';
        resultText = '恭喜你赢得了比赛！';
        break;
      case 'lose':
        resultTitle = '失败！';
        resultColor = '#f87171';
        resultText = '很遗憾，你输掉了比赛。';
        break;
      case 'draw':
        resultTitle = '平局！';
        resultColor = '#fbbf24';
        resultText = '双方势均力敌！';
        break;
      default:
        resultTitle = '结束';
        resultColor = '#9ca3af';
        resultText = '比赛结束';
    }

    const titleText = this.add.text(0, -80, resultTitle, {
      fontSize: '56px',
      fontFamily: 'Arial, sans-serif',
      color: resultColor,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    const descText = this.add.text(0, -10, resultText, {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#e2e8f0',
    }).setOrigin(0.5);

    // 显示比分
    const finalScore = this.add.text(0, 50, `最终比分：${this.gameState.player_wins} : ${this.gameState.opponent_wins}`, {
      fontSize: '28px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    
    // 下一把按钮和返回地图按钮
    const nextRoundButton = this.createNextRoundButton(-100, 120);
    const backButton = this.createBackButton(100, 120);
        
    // 10 秒倒计时自动开始下一把
    this.startCountdown(nextRoundButton);

    panel.add([overlay, panelBg, titleText, descText, finalScore, nextRoundButton, backButton]);

    // 入场动画
    panel.setScale(0.8);
    panel.setAlpha(0);
    this.tweens.add({
      targets: panel,
      scale: 1,
      alpha: 1,
      duration: 400,
      ease: 'Back.out',
    });
  }

  createNextRoundButton(x, y) {
    const buttonWidth = 140;
    const buttonHeight = 50;

    const container = this.add.container(x, y);

    // 按钮背景
    const bg = this.add.graphics();
    bg.fillStyle(0x3b82f6, 1);
    bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);

    // 按钮文字
    const buttonText = this.add.text(0, 0, '下一把', {
      fontSize: '22px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([bg, buttonText]);

    // 设置交互
    const hitArea = new Phaser.Geom.Rectangle(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    container.setInteractive({ useHandCursor: true });

    // 悬停效果
    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x2563eb, 1);
      bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
      container.setScale(1.05);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x3b82f6, 1);
      bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
      container.setScale(1);
    });

    // 点击事件 - 开始新一轮
    container.on('pointerdown', () => {
      if (this.countdownTimer) {
        this.countdownTimer.destroy();
        this.countdownTimer = null;
      }
      this.startNewRound();
    });

    return container;
  }
  
  startCountdown(nextRoundButton) {
    let countdown = 10;
    const { width, height } = this.scale;
    
    // 创建倒计时文本
    this.countdownText = this.add.text(width / 2, height / 2 + 160, ``, {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#fbbf24',
    }).setOrigin(0.5);
    
    // 更新倒计时显示
    this.countdownText.setText(`${countdown}秒后自动开始下一把...`);
    
    // 倒计时定时器
    this.countdownTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        countdown--;
        if (countdown > 0) {
          this.countdownText.setText(`${countdown}秒后自动开始下一把...`);
        } else {
          // 时间到，自动开始下一把
          if (this.countdownTimer) {
            this.countdownTimer.destroy();
            this.countdownTimer = null;
          }
          this.startNewRound();
        }
      },
      repeat: 9,
    });
  }
  
  startNewRound() {
    // 清除倒计时
    if (this.countdownTimer) {
      this.countdownTimer.destroy();
      this.countdownTimer = null;
    }
    if (this.countdownText) {
      this.countdownText.destroy();
      this.countdownText = null;
    }
    
    // 重新开始副本
    this.scene.restart({
      saveId: this.saveId,
      nodeId: this.nodeId,
      playerName: this.playerName,
    });
  }

  createBackButton(x, y) {
    const buttonWidth = 160;
    const buttonHeight = 50;

    const container = this.add.container(x, y);

    // 按钮背景
    const bg = this.add.graphics();
    bg.fillStyle(0x10b981, 1);
    bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);

    // 按钮文字
    const buttonText = this.add.text(0, 0, '返回地图', {
      fontSize: '22px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([bg, buttonText]);

    // 设置交互
    const hitArea = new Phaser.Geom.Rectangle(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    container.setInteractive({ useHandCursor: true });

    // 悬停效果
    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x059669, 1);
      bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
      container.setScale(1.05);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x10b981, 1);
      bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
      container.setScale(1);
    });

    // 点击事件
    container.on('pointerdown', () => {
      this.cameras.main.fadeOut(300);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MapScene', {
          saveId: this.saveId,
          nodeId: this.nodeId,
          dungeonResult: this.gameState?.final_result,
          playerName: this.playerName,
          mapId: this.mapId,  // 传递地图 ID
        });
      });
    });

    return container;
  }

  showError(message) {
    const { width, height } = this.scale;

    const errorText = this.add.text(width / 2, height / 2, message, {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#f87171',
      backgroundColor: '#00000080',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5);

    // 3 秒后消失
    this.time.delayedCall(3000, () => {
      errorText.destroy();
    });
  }
  
  shutdown() {
    // 清理 DOM 输入框
    if (this.uiElements.magicInput) {
      this.uiElements.magicInput.destroy();
      this.uiElements.magicInput = null;
    }
    
    // 清理倒计时
    if (this.countdownTimer) {
      this.countdownTimer.destroy();
      this.countdownTimer = null;
    }
    if (this.countdownText) {
      this.countdownText.destroy();
      this.countdownText = null;
    }
  }
}
