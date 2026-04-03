import Phaser from 'phaser';
import { post, createWebSocket } from '../utils/api.js';

/**
 * AI泡妞副本场景
 * 玩家与AI情敌竞争追求三位女友
 */
export default class DatingDungeonScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DatingDungeonScene' });
  }

  init(data) {
    this.nodeId = data.nodeId || null;
    this.saveId = data.saveId || null;
    this.sessionId = null;
    this.girlfriends = [];
    this.currentRound = 1;
    this.maxRounds = 5;
    this.actionsRemaining = 2;
    this.maxActions = 2;
    this.selectedGfId = null;
    this.ws = null;
    this.chatHistory = {};  // gf_id -> messages[]
    this.rivalLogs = [];
  }

  async create() {
    const { width, height } = this.scale;

    // 添加背景
    this.add.rectangle(width / 2, height / 2, width, height, 0x2d1b2e);

    // 开始副本
    await this.startDungeon();
  }

  /**
   * 开始泡妞副本
   */
  async startDungeon() {
    try {
      const response = await post('/dungeon/dating/start', { player_name: '玩家' });
      this.sessionId = response.session_id;
      this.girlfriends = response.girlfriends || [];
      this.currentRound = response.current_round || 1;
      this.maxRounds = response.max_rounds || 5;
      this.actionsRemaining = response.max_actions_per_round || 2;
      this.maxActions = response.max_actions_per_round || 2;

      // 初始化聊天历史
      this.girlfriends.forEach(gf => {
        this.chatHistory[gf.id] = [];
      });

      // 创建UI
      this.createUI();

      // 连接WebSocket
      this.connectWebSocket();

    } catch (error) {
      console.error('开始副本失败:', error);
      this.showError('开始副本失败，请重试');
    }
  }

  /**
   * 创建UI元素
   */
  createUI() {
    const { width, height } = this.scale;

    // 顶部标题
    this.add.text(width / 2, 30, 'AI泡妞大作战', {
      fontSize: '32px',
      fontFamily: 'Arial, sans-serif',
      color: '#ff69b4',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 轮次信息
    this.roundText = this.add.text(width / 2, 70, `第${this.currentRound}/${this.maxRounds}轮`, {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 剩余行动次数
    this.actionText = this.add.text(width / 2, 95, `剩余行动: ${this.actionsRemaining}/${this.maxActions}`, {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // 创建女友卡片
    this.createGirlfriendCards();

    // 创建对话区域
    this.createChatArea();

    // 创建情敌动态区域
    this.createRivalArea();

    // 创建输入区域
    this.createInputArea();

    // 返回按钮
    const backButton = this.add.text(80, height - 30, '< 返回地图', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#aaaaaa',
    }).setInteractive({ useHandCursor: true });

    backButton.on('pointerover', () => backButton.setColor('#ffffff'));
    backButton.on('pointerout', () => backButton.setColor('#aaaaaa'));
    backButton.on('pointerdown', () => this.returnToMap());
  }

  /**
   * 创建女友卡片
   */
  createGirlfriendCards() {
    const cardWidth = 200;
    const cardHeight = 180;
    const startX = 130;
    const y = 200;
    const gap = 220;

    this.gfCards = {};

    this.girlfriends.forEach((gf, index) => {
      const x = startX + index * gap;
      
      // 卡片容器
      const cardContainer = this.add.container(x, y);
      
      // 卡片背景
      const bg = this.add.graphics();
      bg.fillStyle(0x3d2b3e, 0.9);
      bg.fillRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 10);
      bg.lineStyle(2, 0xff69b4, 1);
      bg.strokeRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 10);
      cardContainer.add(bg);

      // 女友名字
      const nameText = this.add.text(0, -cardHeight/2 + 25, gf.name, {
        fontSize: '22px',
        fontFamily: 'Arial, sans-serif',
        color: '#ff69b4',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      cardContainer.add(nameText);

      // 性格标签
      const personalityText = this.add.text(0, -cardHeight/2 + 50, gf.personality.substring(0, 10) + '...', {
        fontSize: '12px',
        fontFamily: 'Arial, sans-serif',
        color: '#cccccc',
      }).setOrigin(0.5);
      cardContainer.add(personalityText);

      // 好感度条背景
      const barBg = this.add.graphics();
      barBg.fillStyle(0x222222, 1);
      barBg.fillRoundedRect(-80, 20, 160, 40, 5);
      cardContainer.add(barBg);

      // 玩家好感度条（蓝色）
      const playerBar = this.add.graphics();
      playerBar.fillStyle(0x4FC3F7, 1);
      const playerWidth = (gf.affection_player / 100) * 75;
      playerBar.fillRoundedRect(-75, 25, playerWidth, 12, 3);
      cardContainer.add(playerBar);

      // 情敌好感度条（红色）
      const rivalBar = this.add.graphics();
      rivalBar.fillStyle(0xFF6B6B, 1);
      const rivalWidth = (gf.affection_rival / 100) * 75;
      rivalBar.fillRoundedRect(-75, 42, rivalWidth, 12, 3);
      cardContainer.add(rivalBar);

      // 好感度标签
      const playerLabel = this.add.text(-85, 31, '你', {
        fontSize: '10px',
        fontFamily: 'Arial, sans-serif',
        color: '#4FC3F7',
      }).setOrigin(1, 0.5);
      cardContainer.add(playerLabel);

      const rivalLabel = this.add.text(-85, 48, '敌', {
        fontSize: '10px',
        fontFamily: 'Arial, sans-serif',
        color: '#FF6B6B',
      }).setOrigin(1, 0.5);
      cardContainer.add(rivalLabel);

      // 好感度数值
      const playerValue = this.add.text(85, 31, gf.affection_player.toString(), {
        fontSize: '10px',
        fontFamily: 'Arial, sans-serif',
        color: '#4FC3F7',
      }).setOrigin(0, 0.5);
      cardContainer.add(playerValue);

      const rivalValue = this.add.text(85, 48, gf.affection_rival.toString(), {
        fontSize: '10px',
        fontFamily: 'Arial, sans-serif',
        color: '#FF6B6B',
      }).setOrigin(0, 0.5);
      cardContainer.add(rivalValue);

      // 选中标记
      const selectMarker = this.add.graphics();
      selectMarker.lineStyle(3, 0x00ff00, 1);
      selectMarker.strokeRoundedRect(-cardWidth/2 - 5, -cardHeight/2 - 5, cardWidth + 10, cardHeight + 10, 12);
      selectMarker.visible = false;
      cardContainer.add(selectMarker);

      // 点击事件
      const hitArea = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });
      cardContainer.add(hitArea);

      hitArea.on('pointerdown', () => {
        this.selectGirlfriend(gf.id);
      });

      // 保存引用
      this.gfCards[gf.id] = {
        container: cardContainer,
        bg: bg,
        playerBar: playerBar,
        rivalBar: rivalBar,
        playerValue: playerValue,
        rivalValue: rivalValue,
        selectMarker: selectMarker,
        data: gf
      };
    });

    // 默认选中第一个
    if (this.girlfriends.length > 0) {
      this.selectGirlfriend(this.girlfriends[0].id);
    }
  }

  /**
   * 选中女友
   */
  selectGirlfriend(gfId) {
    this.selectedGfId = gfId;
    
    // 更新选中标记
    Object.keys(this.gfCards).forEach(id => {
      this.gfCards[id].selectMarker.visible = (id === gfId);
    });

    // 更新对话区域
    this.updateChatArea();
  }

  /**
   * 更新女友卡片好感度
   */
  updateGirlfriendCard(gfId, affectionPlayer, affectionRival) {
    const card = this.gfCards[gfId];
    if (!card) return;

    // 更新数据
    card.data.affection_player = affectionPlayer;
    card.data.affection_rival = affectionRival;

    // 重绘好感度条
    card.playerBar.clear();
    card.playerBar.fillStyle(0x4FC3F7, 1);
    const playerWidth = (affectionPlayer / 100) * 75;
    card.playerBar.fillRoundedRect(-75, 25, playerWidth, 12, 3);

    card.rivalBar.clear();
    card.rivalBar.fillStyle(0xFF6B6B, 1);
    const rivalWidth = (affectionRival / 100) * 75;
    card.rivalBar.fillRoundedRect(-75, 42, rivalWidth, 12, 3);

    // 更新数值
    card.playerValue.setText(affectionPlayer.toString());
    card.rivalValue.setText(affectionRival.toString());
  }

  /**
   * 创建对话区域
   */
  createChatArea() {
    const { width, height } = this.scale;
    const chatX = width / 2 - 100;
    const chatY = 420;
    const chatWidth = 500;
    const chatHeight = 180;

    // 对话区域背景
    this.chatBg = this.add.graphics();
    this.chatBg.fillStyle(0x1a1a2e, 0.9);
    this.chatBg.fillRoundedRect(chatX - chatWidth/2, chatY - chatHeight/2, chatWidth, chatHeight, 10);
    this.chatBg.lineStyle(2, 0x444444, 1);
    this.chatBg.strokeRoundedRect(chatX - chatWidth/2, chatY - chatHeight/2, chatWidth, chatHeight, 10);

    // 对话标题
    this.chatTitle = this.add.text(chatX - chatWidth/2 + 15, chatY - chatHeight/2 + 10, '选择一位女友开始对话', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    });

    // 对话内容容器
    this.chatContentContainer = this.add.container(chatX - chatWidth/2 + 15, chatY - chatHeight/2 + 35);
    this.chatMessages = [];
  }

  /**
   * 更新对话区域
   */
  updateChatArea() {
    const gf = this.gfCards[this.selectedGfId];
    if (!gf) return;

    // 更新标题
    this.chatTitle.setText(`与 ${gf.data.name} 的对话`);

    // 清空现有消息
    this.chatContentContainer.removeAll(true);
    this.chatMessages = [];

    // 显示该女友的聊天记录
    const messages = this.chatHistory[this.selectedGfId] || [];
    let y = 0;

    messages.forEach(msg => {
      const isPlayer = msg.speaker === 'player';
      const color = isPlayer ? '#4FC3F7' : '#ff69b4';
      const label = isPlayer ? '你' : gf.data.name;

      const text = this.add.text(0, y, `${label}: ${msg.content}`, {
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        color: color,
        wordWrap: { width: 460 }
      });

      this.chatContentContainer.add(text);
      y += text.height + 8;
    });

    // 滚动到最底部
    if (y > 120) {
      this.chatContentContainer.y = 385 - y;
    }
  }

  /**
   * 添加对话消息
   */
  addChatMessage(gfId, speaker, content) {
    if (!this.chatHistory[gfId]) {
      this.chatHistory[gfId] = [];
    }

    this.chatHistory[gfId].push({ speaker, content });

    // 如果当前选中的就是这位女友，更新显示
    if (this.selectedGfId === gfId) {
      this.updateChatArea();
    }
  }

  /**
   * 创建情敌动态区域
   */
  createRivalArea() {
    const { width, height } = this.scale;
    const rivalX = width - 110;
    const rivalY = 420;
    const rivalWidth = 180;
    const rivalHeight = 180;

    // 背景
    this.rivalBg = this.add.graphics();
    this.rivalBg.fillStyle(0x2e1a1a, 0.9);
    this.rivalBg.fillRoundedRect(rivalX - rivalWidth/2, rivalY - rivalHeight/2, rivalWidth, rivalHeight, 10);
    this.rivalBg.lineStyle(2, 0xFF6B6B, 1);
    this.rivalBg.strokeRoundedRect(rivalX - rivalWidth/2, rivalY - rivalHeight/2, rivalWidth, rivalHeight, 10);

    // 标题
    this.add.text(rivalX, rivalY - rivalHeight/2 + 15, '情敌动态', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#FF6B6B',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 动态内容容器
    this.rivalContent = this.add.container(rivalX - rivalWidth/2 + 10, rivalY - rivalHeight/2 + 35);
    this.rivalTexts = [];
  }

  /**
   * 添加情敌动态
   */
  addRivalLog(gfName, content) {
    const log = { gfName, content, time: Date.now() };
    this.rivalLogs.push(log);

    // 只保留最近3条
    if (this.rivalLogs.length > 3) {
      this.rivalLogs.shift();
    }

    // 更新显示
    this.rivalContent.removeAll(true);
    this.rivalTexts = [];

    let y = 0;
    this.rivalLogs.forEach(log => {
      const text = this.add.text(0, y, `→${log.gfName}: ${log.content.substring(0, 20)}...`, {
        fontSize: '12px',
        fontFamily: 'Arial, sans-serif',
        color: '#cccccc',
        wordWrap: { width: 160 }
      });

      this.rivalContent.add(text);
      y += text.height + 5;
    });
  }

  /**
   * 创建输入区域
   */
  createInputArea() {
    const { width, height } = this.scale;
    const inputY = height - 60;

    // 创建 DOM 输入框
    const inputElement = document.createElement('input');
    inputElement.type = 'text';
    inputElement.placeholder = '输入你想说的话...';
    inputElement.style.cssText = `
      width: 400px;
      height: 40px;
      background-color: #3d2b3e;
      color: #ffffff;
      border: 2px solid #ff69b4;
      border-radius: 8px;
      padding: 0 15px;
      font-size: 14px;
      font-family: Arial, sans-serif;
      outline: none;
      z-index: 9999;
    `;
    
    // 发送按钮
    const sendButton = document.createElement('button');
    sendButton.textContent = '发送';
    sendButton.style.cssText = `
      width: 80px;
      height: 44px;
      margin-left: 10px;
      background-color: #ff69b4;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      transition: background-color 0.2s;
      z-index: 9999;
    `;

    // 结束本轮按钮
    const endRoundButton = document.createElement('button');
    endRoundButton.textContent = '结束本轮';
    endRoundButton.style.cssText = `
      width: 100px;
      height: 44px;
      margin-left: 10px;
      background-color: #ffd700;
      color: #2d1b2e;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      transition: background-color 0.2s;
    `;

    // 容器
    const containerElement = document.createElement('div');
    containerElement.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    containerElement.appendChild(inputElement);
    containerElement.appendChild(sendButton);
    containerElement.appendChild(endRoundButton);

    // 添加到Phaser
    this.inputDom = this.add.dom(width / 2 - 50, inputY, containerElement);
    this.inputDom.setOrigin(0.5);

    // 发送处理
    const handleSend = () => {
      const text = inputElement.value.trim();
      if (text && this.selectedGfId) {
        this.sendChatMessage(text);
        inputElement.value = '';
      }
    };

    inputElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSend();
    });
    sendButton.addEventListener('click', handleSend);

    // 结束本轮
    endRoundButton.addEventListener('click', () => {
      this.endRound();
    });

    this.inputElement = inputElement;
    this.sendButton = sendButton;
    this.endRoundButton = endRoundButton;
  }

  /**
   * 连接WebSocket
   */
  connectWebSocket() {
    if (!this.sessionId) return;

    const wsUrl = `ws://${window.location.host}/ws/dungeon/dating/${this.sessionId}`;
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
      this.showError('连接错误');
    };

    this.ws.onclose = () => {
      console.log('WebSocket连接关闭');
    };
  }

  /**
   * 处理WebSocket消息
   */
  handleWebSocketMessage(data) {
    switch (data.type) {
      case 'gf_reply':
        this.handleGfReply(data);
        break;
      case 'rival_action':
        this.handleRivalAction(data);
        break;
      case 'round_info':
        this.handleRoundInfo(data);
        break;
      case 'action_update':
        this.handleActionUpdate(data);
        break;
      case 'judge':
        this.handleJudge(data);
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
   * 处理女友回复
   */
  handleGfReply(data) {
    // 添加对话消息
    this.addChatMessage(data.speaker, data.speaker, data.content);
    this.addChatMessage(data.speaker, 'player', '(你刚才说的话)');

    // 更新好感度
    this.updateGirlfriendCard(data.speaker, data.affection, this.gfCards[data.speaker].data.affection_rival);

    // 显示好感度变化提示
    if (data.affection_change !== 0) {
      const sign = data.affection_change > 0 ? '+' : '';
      this.showFloatingText(`${data.speaker_name}好感${sign}${data.affection_change}!`, data.affection_change > 0 ? '#00ff00' : '#ff0000');
    }
  }

  /**
   * 处理情敌行动
   */
  handleRivalAction(data) {
    if (data.messages) {
      data.messages.forEach(msg => {
        // 更新情敌好感度
        this.updateGirlfriendCard(msg.gf_id, this.gfCards[msg.gf_id].data.affection_player, msg.affection_rival);
        
        // 添加情敌动态
        this.addRivalLog(msg.gf_name, msg.rival_content);
      });
    }
  }

  /**
   * 处理轮次信息
   */
  handleRoundInfo(data) {
    this.currentRound = data.round;
    this.maxRounds = data.max_rounds;
    this.actionsRemaining = data.actions_remaining !== undefined ? data.actions_remaining : this.maxActions;

    this.roundText.setText(`第${this.currentRound}/${this.maxRounds}轮`);
    this.actionText.setText(`剩余行动: ${this.actionsRemaining}/${this.maxActions}`);

    if (data.status === 'judging') {
      this.showJudgingModal();
    }
  }

  /**
   * 处理行动更新
   */
  handleActionUpdate(data) {
    this.actionsRemaining = data.actions_remaining;
    this.actionText.setText(`剩余行动: ${this.actionsRemaining}/${data.max_actions}`);
  }

  /**
   * 处理裁判评判
   */
  handleJudge(data) {
    if (!this.judgeText) {
      // 创建评判显示区域
      const { width, height } = this.scale;
      this.judgeOverlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.8);
      
      this.judgeTitle = this.add.text(width/2, 100, '💕 最终裁决 💕', {
        fontSize: '32px',
        fontFamily: 'Arial, sans-serif',
        color: '#ff69b4',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      this.judgeText = this.add.text(width/2, height/2, '', {
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        wordWrap: { width: width - 100 },
        align: 'center'
      }).setOrigin(0.5);
    }

    if (data.content) {
      this.judgeText.text += data.content;
    }
  }

  /**
   * 处理最终结果
   */
  handleResult(data) {
    const isWin = data.result === 'win';
    this.dungeonResult = isWin ? 'win' : 'lose';

    // 禁用输入
    if (this.inputElement) {
      this.inputElement.disabled = true;
    }
    if (this.sendButton) {
      this.sendButton.disabled = true;
    }
    if (this.endRoundButton) {
      this.endRoundButton.disabled = true;
    }

    // 显示结果
    this.time.delayedCall(2000, () => {
      this.showFinalResult(isWin, data.girlfriends);
    });
  }

  /**
   * 发送聊天消息
   */
  sendChatMessage(text) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.showError('连接已断开');
      return;
    }

    if (this.actionsRemaining <= 0) {
      this.showError('本轮行动次数已用完');
      return;
    }

    if (!this.selectedGfId) {
      this.showError('请先选择一位女友');
      return;
    }

    // 添加到本地聊天记录
    this.addChatMessage(this.selectedGfId, 'player', text);

    // 发送到服务器
    this.ws.send(JSON.stringify({
      type: 'chat',
      target: this.selectedGfId,
      content: text
    }));
  }

  /**
   * 结束本轮
   */
  endRound() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.showError('连接已断开');
      return;
    }

    this.ws.send(JSON.stringify({
      type: 'end_round'
    }));
  }

  /**
   * 显示评判中弹窗
   */
  showJudgingModal() {
    const { width, height } = this.scale;

    this.judgingOverlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7);
    
    this.judgingText = this.add.text(width/2, height/2, '正在评判中...', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffd700',
    }).setOrigin(0.5);
  }

  /**
   * 显示最终结果
   */
  showFinalResult(isWin, girlfriends) {
    const { width, height } = this.scale;

    // 清除之前的评判显示
    if (this.judgeOverlay) this.judgeOverlay.destroy();
    if (this.judgeTitle) this.judgeTitle.destroy();
    if (this.judgeText) this.judgeText.destroy();
    if (this.judgingOverlay) this.judgingOverlay.destroy();
    if (this.judgingText) this.judgingText.destroy();

    // 结果弹窗
    const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.9);

    const resultText = this.add.text(width/2, 100, isWin ? '💕 你赢了! 💕' : '💔 你输了...', {
      fontSize: '48px',
      fontFamily: 'Arial, sans-serif',
      color: isWin ? '#ff69b4' : '#888888',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 显示各女友最终好感度
    let y = 180;
    girlfriends.forEach(gf => {
      const winner = gf.affection_player > gf.affection_rival ? '你' : '情敌';
      const color = gf.affection_player > gf.affection_rival ? '#4FC3F7' : '#FF6B6B';
      
      const text = this.add.text(width/2, y, `${gf.name}: 选择了${winner} (你:${gf.affection_player} vs 敌:${gf.affection_rival})`, {
        fontSize: '18px',
        fontFamily: 'Arial, sans-serif',
        color: color,
      }).setOrigin(0.5);
      
      y += 35;
    });

    // 返回按钮
    const backButton = this.add.text(width/2, y + 50, '返回地图', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#2d1b2e',
      backgroundColor: '#ff69b4',
      padding: { x: 30, y: 15 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backButton.on('pointerover', () => {
      backButton.setStyle({ backgroundColor: '#ff8dc7' });
    });
    backButton.on('pointerout', () => {
      backButton.setStyle({ backgroundColor: '#ff69b4' });
    });
    backButton.on('pointerdown', () => {
      this.returnToMap();
    });

    // 动画
    this.tweens.add({
      targets: [resultText, backButton],
      scale: { from: 0.5, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 500,
      ease: 'Back.out',
    });
  }

  /**
   * 显示浮动文字
   */
  showFloatingText(text, color) {
    const { width, height } = this.scale;
    
    const floatingText = this.add.text(width/2, height/2, text, {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: color,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: floatingText,
      y: height/2 - 50,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        floatingText.destroy();
      }
    });
  }

  /**
   * 显示错误信息
   */
  showError(message) {
    const { width, height } = this.scale;

    const errorText = this.add.text(width/2, height/2, message, {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#ff6b6b',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5);

    this.time.delayedCall(3000, () => {
      errorText.destroy();
    });
  }

  /**
   * 返回地图
   */
  returnToMap() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

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
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
