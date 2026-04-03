import Phaser from 'phaser';
import { post } from '../utils/api.js';

export default class SpyDungeonScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SpyDungeonScene' });
  }

  init(data) {
    this.nodeData = data || {};
    this.saveId = data?.saveId || null;
    this.nodeId = data?.nodeId || null;
    this.sessionId = null;
    this.ws = null;
    
    // 游戏状态
    this.players = [];
    this.yourWord = '';
    this.yourRole = '';
    this.currentRound = 1;
    this.status = 'describing';
    
    // UI元素
    this.playerAvatars = {};
    this.bubbles = [];
    this.inputContainer = null;
    this.voteContainer = null;
    this.statusText = null;
    
    // 当前选择
    this.selectedVoteTarget = null;
  }

  async create() {
    const { width, height } = this.scale;

    // 深色背景
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    // 顶部标题
    this.add.text(width / 2, 40, '谁是卧底', {
      fontSize: '48px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.roundText = this.add.text(width / 2, 90, '第 1 轮', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#fbbf24',
    }).setOrigin(0.5);

    // 开始游戏
    await this.startGame();
  }

  async startGame() {
    try {
      // 调用REST API开始游戏
      const response = await post('/dungeon/spy/start', { player_name: '玩家' });
      
      this.sessionId = response.session_id;
      this.yourWord = response.your_word;
      this.yourRole = response.your_role;
      this.players = response.players;
      
      // 创建UI
      this.createIdentityCard();
      this.createPlayerAvatars();
      this.createStatusBar();
      
      // 连接WebSocket
      this.connectWebSocket();
      
    } catch (error) {
      console.error('开始游戏失败:', error);
      this.showError('连接失败，请重试');
    }
  }

  createIdentityCard() {
    const { width } = this.scale;
    
    // 身份卡背景
    const cardBg = this.add.graphics();
    cardBg.fillStyle(this.yourRole === 'spy' ? 0x7f1d1d : 0x1e3a5f, 1);
    cardBg.fillRoundedRect(20, 130, 140, 100, 10);
    cardBg.lineStyle(2, this.yourRole === 'spy' ? 0xef4444 : 0x3b82f6, 1);
    cardBg.strokeRoundedRect(20, 130, 140, 100, 10);
    
    // 身份标签
    this.add.text(90, 150, this.yourRole === 'spy' ? '卧 底' : '平 民', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: this.yourRole === 'spy' ? '#ef4444' : '#3b82f6',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    
    // 词
    this.add.text(90, 185, `词: ${this.yourWord}`, {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff',
    }).setOrigin(0.5);
    
    // 卧底警告
    if (this.yourRole === 'spy') {
      this.add.text(90, 210, '小心隐藏!', {
        fontSize: '12px',
        fontFamily: 'Arial',
        color: '#f87171',
      }).setOrigin(0.5);
    }
  }

  createPlayerAvatars() {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2 + 20;
    const radius = 180;
    
    // 8个玩家环形排列
    const totalPlayers = 8;
    const angleStep = (Math.PI * 2) / totalPlayers;
    
    this.players.forEach((player, index) => {
      // 计算位置（从顶部开始）
      const angle = -Math.PI / 2 + index * angleStep;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      // 创建头像容器
      const container = this.add.container(x, y);
      
      // 头像圆形背景
      const avatarBg = this.add.graphics();
      const colors = [0xef4444, 0xf97316, 0xf59e0b, 0x84cc16, 0x10b981, 0x06b6d4, 0x3b82f6, 0x8b5cf6];
      avatarBg.fillStyle(colors[index % colors.length], 1);
      avatarBg.fillCircle(0, 0, 35);
      
      // 名字首字
      const firstChar = player.name.charAt(0);
      const nameText = this.add.text(0, 0, firstChar, {
        fontSize: '28px',
        fontFamily: 'Arial',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      
      // 名字标签
      const labelBg = this.add.graphics();
      labelBg.fillStyle(0x000000, 0.7);
      labelBg.fillRoundedRect(-35, 45, 70, 22, 4);
      
      const labelText = this.add.text(0, 56, player.name, {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#ffffff',
      }).setOrigin(0.5);
      
      container.add([avatarBg, nameText, labelBg, labelText]);
      
      // 保存引用
      this.playerAvatars[player.id] = {
        container,
        avatarBg,
        nameText,
        labelText,
        data: player,
        x,
        y
      };
      
      // 如果是玩家自己，标记一下
      if (player.id === 'player') {
        const selfMark = this.add.text(0, -50, '你', {
          fontSize: '12px',
          fontFamily: 'Arial',
          color: '#fbbf24',
          fontStyle: 'bold',
        }).setOrigin(0.5);
        container.add(selfMark);
      }
    });
  }

  createStatusBar() {
    const { width, height } = this.scale;
    
    // 状态栏背景
    const statusBg = this.add.graphics();
    statusBg.fillStyle(0x000000, 0.5);
    statusBg.fillRect(0, height - 80, width, 80);
    
    // 状态文字
    this.statusText = this.add.text(width / 2, height - 50, '等待游戏开始...', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff',
    }).setOrigin(0.5);
  }

  connectWebSocket() {
    const wsUrl = `ws://${window.location.host}/ws/dungeon/spy/${this.sessionId}`;
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('WebSocket连接成功');
    };
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleWebSocketMessage(data);
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket错误:', error);
      this.showError('连接出错');
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket连接关闭');
    };
  }

  handleWebSocketMessage(data) {
    switch (data.type) {
      case 'game_info':
        this.statusText.setText('游戏开始！请仔细听其他人的描述');
        break;
        
      case 'description':
        this.showDescription(data.player_id, data.name, data.content);
        break;
        
      case 'player_turn':
        this.statusText.setText('轮到你了！请输入描述');
        this.showDescriptionInput();
        break;
        
      case 'description_received':
        this.hideDescriptionInput();
        break;
        
      case 'description_phase_end':
        this.clearBubbles();
        break;
        
      case 'vote_start':
        this.statusText.setText('投票阶段：点击选择要淘汰的人');
        this.showVoteInterface(data.alive_players);
        break;
        
      case 'vote_received':
        this.hideVoteInterface();
        break;
        
      case 'vote_result':
        this.showVoteResult(data);
        break;
        
      case 'next_round':
        this.currentRound = data.round;
        this.roundText.setText(`第 ${this.currentRound} 轮`);
        this.clearBubbles();
        break;
        
      case 'game_end':
        this.showGameEnd(data.result, data.message);
        break;
        
      case 'error':
        this.showError(data.message);
        break;
    }
  }

  showDescription(playerId, name, content) {
    const avatar = this.playerAvatars[playerId];
    if (!avatar) return;
    
    // 高亮头像
    avatar.avatarBg.clear();
    avatar.avatarBg.fillStyle(0xfbbf24, 1);
    avatar.avatarBg.fillCircle(0, 0, 35);
    
    // 创建气泡
    const bubbleX = avatar.x;
    const bubbleY = avatar.y - 80;
    
    const bubble = this.add.container(bubbleX, bubbleY);
    
    // 气泡背景
    const padding = 10;
    const textWidth = Math.min(content.length * 16 + padding * 2, 200);
    const textHeight = 40;
    
    const bubbleBg = this.add.graphics();
    bubbleBg.fillStyle(0xffffff, 1);
    bubbleBg.fillRoundedRect(-textWidth/2, -textHeight/2, textWidth, textHeight, 8);
    
    // 气泡文字
    const bubbleText = this.add.text(0, 0, content, {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#000000',
      wordWrap: { width: textWidth - padding * 2 }
    }).setOrigin(0.5);
    
    bubble.add([bubbleBg, bubbleText]);
    this.bubbles.push(bubble);
    
    // 动画
    bubble.setAlpha(0);
    bubble.setScale(0.8);
    this.tweens.add({
      targets: bubble,
      alpha: 1,
      scale: 1,
      duration: 200,
      ease: 'Back.out'
    });
    
    // 2秒后恢复头像
    this.time.delayedCall(2000, () => {
      const player = avatar.data;
      const colors = [0xef4444, 0xf97316, 0xf59e0b, 0x84cc16, 0x10b981, 0x06b6d4, 0x3b82f6, 0x8b5cf6];
      const index = this.players.findIndex(p => p.id === playerId);
      avatar.avatarBg.clear();
      avatar.avatarBg.fillStyle(colors[index % colors.length], 1);
      avatar.avatarBg.fillCircle(0, 0, 35);
    });
  }

  showDescriptionInput() {
    const { width, height } = this.scale;
    
    // 创建输入容器
    this.inputContainer = this.add.container(width / 2, height - 150);
    
    // 输入框背景
    const inputBg = this.add.graphics();
    inputBg.fillStyle(0x374151, 1);
    inputBg.fillRoundedRect(-200, -30, 400, 60, 8);
    inputBg.lineStyle(2, 0x3b82f6, 1);
    inputBg.strokeRoundedRect(-200, -30, 400, 60, 8);
    
    // 使用 DOM 元素创建输入框
    const inputElement = document.createElement('input');
    inputElement.type = 'text';
    inputElement.placeholder = '输入你的描述（15 字以内）...';
    inputElement.style.width = '360px';
    inputElement.style.height = '40px';
    inputElement.style.fontSize = '16px';
    inputElement.style.padding = '0 10px';
    inputElement.style.border = 'none';
    inputElement.style.borderRadius = '4px';
    inputElement.style.backgroundColor = '#374151';
    inputElement.style.color = '#ffffff';
    inputElement.style.outline = 'none';
    inputElement.style.zIndex = '9999';
    inputElement.maxLength = 20;
        
    const domElement = this.add.dom(0, 0, inputElement);
        
    // 确保输入框在最上层并聚焦
    setTimeout(() => {
      inputElement.style.zIndex = '9999';
      inputElement.focus();
    }, 50);
    
    // 提交按钮
    const submitBtn = this.add.container(260, 0);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x3b82f6, 1);
    btnBg.fillRoundedRect(-50, -25, 100, 50, 8);
    
    const btnText = this.add.text(0, 0, '提交', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    
    submitBtn.add([btnBg, btnText]);
    submitBtn.setInteractive(new Phaser.Geom.Rectangle(-50, -25, 100, 50), Phaser.Geom.Rectangle.Contains);
    
    submitBtn.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(0x2563eb, 1);
      btnBg.fillRoundedRect(-50, -25, 100, 50, 8);
      submitBtn.setScale(1.05);
    });
    
    submitBtn.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(0x3b82f6, 1);
      btnBg.fillRoundedRect(-50, -25, 100, 50, 8);
      submitBtn.setScale(1);
    });
    
    submitBtn.on('pointerdown', () => {
      const content = inputElement.value.trim();
      if (content) {
        this.ws.send(JSON.stringify({
          type: 'player_description',
          content: content
        }));
      }
    });
    
    this.inputContainer.add([inputBg, domElement, submitBtn]);
  }

  hideDescriptionInput() {
    if (this.inputContainer) {
      this.inputContainer.destroy();
      this.inputContainer = null;
    }
  }

  showVoteInterface(alivePlayers) {
    const { width, height } = this.scale;
    
    this.selectedVoteTarget = null;
    this.voteContainer = this.add.container(width / 2, height - 150);
    
    // 提示文字
    const hintText = this.add.text(0, -60, '点击头像投票淘汰', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#fbbf24',
    }).setOrigin(0.5);
    
    this.voteContainer.add(hintText);
    
    // 为每个活着的NPC添加点击交互
    alivePlayers.forEach(player => {
      const avatar = this.playerAvatars[player.id];
      if (avatar) {
        avatar.container.setInteractive(new Phaser.Geom.Circle(0, 0, 35), Phaser.Geom.Circle.Contains);
        
        avatar.container.on('pointerover', () => {
          if (this.selectedVoteTarget !== player.id) {
            avatar.container.setScale(1.1);
          }
        });
        
        avatar.container.on('pointerout', () => {
          if (this.selectedVoteTarget !== player.id) {
            avatar.container.setScale(1);
          }
        });
        
        avatar.container.on('pointerdown', () => {
          this.selectVoteTarget(player.id);
        });
      }
    });
    
    // 确认投票按钮
    this.confirmBtn = this.add.container(0, 60);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x6b7280, 1);
    btnBg.fillRoundedRect(-60, -25, 120, 50, 8);
    
    const btnText = this.add.text(0, 0, '确认投票', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#9ca3af',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    
    this.confirmBtn.add([btnBg, btnText]);
    this.voteContainer.add(this.confirmBtn);
  }

  selectVoteTarget(targetId) {
    // 恢复之前选中的
    if (this.selectedVoteTarget) {
      const prevAvatar = this.playerAvatars[this.selectedVoteTarget];
      if (prevAvatar) {
        prevAvatar.container.setScale(1);
      }
    }
    
    // 选中新目标
    this.selectedVoteTarget = targetId;
    const avatar = this.playerAvatars[targetId];
    if (avatar) {
      avatar.container.setScale(1.15);
      
      // 添加选中效果
      avatar.avatarBg.clear();
      avatar.avatarBg.fillStyle(0xfbbf24, 1);
      avatar.avatarBg.fillCircle(0, 0, 38);
      const colors = [0xef4444, 0xf97316, 0xf59e0b, 0x84cc16, 0x10b981, 0x06b6d4, 0x3b82f6, 0x8b5cf6];
      const index = this.players.findIndex(p => p.id === targetId);
      avatar.avatarBg.fillStyle(colors[index % colors.length], 1);
      avatar.avatarBg.fillCircle(0, 0, 35);
    }
    
    // 启用确认按钮
    if (this.confirmBtn) {
      this.confirmBtn.removeAll(true);
      const btnBg = this.add.graphics();
      btnBg.fillStyle(0xef4444, 1);
      btnBg.fillRoundedRect(-60, -25, 120, 50, 8);
      
      const btnText = this.add.text(0, 0, '确认投票', {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      
      this.confirmBtn.add([btnBg, btnText]);
      this.confirmBtn.setInteractive(new Phaser.Geom.Rectangle(-60, -25, 120, 50), Phaser.Geom.Rectangle.Contains);
      
      this.confirmBtn.on('pointerover', () => {
        btnBg.clear();
        btnBg.fillStyle(0xdc2626, 1);
        btnBg.fillRoundedRect(-60, -25, 120, 50, 8);
        this.confirmBtn.setScale(1.05);
      });
      
      this.confirmBtn.on('pointerout', () => {
        btnBg.clear();
        btnBg.fillStyle(0xef4444, 1);
        btnBg.fillRoundedRect(-60, -25, 120, 50, 8);
        this.confirmBtn.setScale(1);
      });
      
      this.confirmBtn.on('pointerdown', () => {
        if (this.selectedVoteTarget) {
          this.ws.send(JSON.stringify({
            type: 'player_vote',
            target: this.selectedVoteTarget
          }));
        }
      });
    }
  }

  hideVoteInterface() {
    // 移除所有头像的交互
    this.players.forEach(player => {
      const avatar = this.playerAvatars[player.id];
      if (avatar) {
        avatar.container.disableInteractive();
        avatar.container.setScale(1);
      }
    });
    
    if (this.voteContainer) {
      this.voteContainer.destroy();
      this.voteContainer = null;
    }
    this.selectedVoteTarget = null;
  }

  showVoteResult(data) {
    const { width, height } = this.scale;
    
    // 显示投票详情
    let voteText = '投票结果:\n';
    data.votes.forEach(vote => {
      voteText += `${vote.voter} → ${vote.target}\n`;
    });
    
    this.statusText.setText(voteText);
    
    // 标记被淘汰的人
    if (data.eliminated) {
      const avatar = this.playerAvatars[data.eliminated];
      if (avatar) {
        // 头像变灰
        avatar.avatarBg.clear();
        avatar.avatarBg.fillStyle(0x4b5563, 1);
        avatar.avatarBg.fillCircle(0, 0, 35);
        
        // 添加叉号
        const cross = this.add.text(0, 0, '✕', {
          fontSize: '40px',
          fontFamily: 'Arial',
          color: '#ef4444',
          fontStyle: 'bold',
        }).setOrigin(0.5);
        avatar.container.add(cross);
        
        // 显示身份
        const roleText = this.add.text(0, -50, data.eliminated_role === 'spy' ? '卧底!' : '平民', {
          fontSize: '14px',
          fontFamily: 'Arial',
          color: data.eliminated_role === 'spy' ? '#ef4444' : '#3b82f6',
          fontStyle: 'bold',
        }).setOrigin(0.5);
        avatar.container.add(roleText);
        
        // 飘出"淘汰"文字
        const eliminatedFloat = this.add.text(avatar.x, avatar.y - 60, '淘 汰', {
          fontSize: '24px',
          fontFamily: 'Arial',
          color: '#ef4444',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 3,
        }).setOrigin(0.5);
        
        this.tweens.add({
          targets: eliminatedFloat,
          y: avatar.y - 120,
          alpha: 0,
          duration: 1500,
          ease: 'Power2',
          onComplete: () => eliminatedFloat.destroy()
        });
      }
    }
  }

  clearBubbles() {
    this.bubbles.forEach(bubble => bubble.destroy());
    this.bubbles = [];
  }

  showGameEnd(result, message) {
    const { width, height } = this.scale;
    
    // 半透明遮罩
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    
    // 结果文字
    const isWin = result === 'win';
    const resultText = this.add.text(width / 2, height / 2 - 50, isWin ? '胜 利' : '失 败', {
      fontSize: '72px',
      fontFamily: 'Arial',
      color: isWin ? '#4ade80' : '#ef4444',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);
    
    // 消息
    const msgText = this.add.text(width / 2, height / 2 + 30, message, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
    }).setOrigin(0.5);
    
    // 返回地图按钮
    const backBtn = this.add.container(width / 2, height / 2 + 120);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x3b82f6, 1);
    btnBg.fillRoundedRect(-100, -30, 200, 60, 10);
    
    const btnText = this.add.text(0, 0, '返回地图', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    
    backBtn.add([btnBg, btnText]);
    backBtn.setInteractive(new Phaser.Geom.Rectangle(-100, -30, 200, 60), Phaser.Geom.Rectangle.Contains);
    
    backBtn.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(0x2563eb, 1);
      btnBg.fillRoundedRect(-100, -30, 200, 60, 10);
      backBtn.setScale(1.05);
    });
    
    backBtn.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(0x3b82f6, 1);
      btnBg.fillRoundedRect(-100, -30, 200, 60, 10);
      backBtn.setScale(1);
    });
    
    backBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MapScene', {
          saveId: this.saveId,
          nodeId: this.nodeId,
          dungeonResult: result,
          mapId: this.mapId,
        });
      });
    });
    
    // 动画
    resultText.setScale(0);
    this.tweens.add({
      targets: resultText,
      scale: 1,
      duration: 500,
      ease: 'Back.out'
    });
  }

  showError(message) {
    const { width, height } = this.scale;
    
    this.add.text(width / 2, height / 2, message, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ef4444',
    }).setOrigin(0.5);
  }

  shutdown() {
    // 清理WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    // 清理DOM元素
    this.hideDescriptionInput();
  }
}
