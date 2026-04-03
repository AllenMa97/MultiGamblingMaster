import Phaser from 'phaser';
import { get, post, put } from '../utils/api.js';
import { createDice } from '../components/Dice.js';

/**
 * 地图场景
 * 显示棋盘地图，玩家移动，骰子交互
 */
export default class MapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MapScene' });
  }

  init(data) {
    // 从其他场景返回时接收的数据
    this.saveId = data?.saveId || null;
    this.completedNodes = data?.completedNodes || [];
    this.currentPosition = data?.currentPosition || 0;
    this.mapId = data?.mapId || 'map_01';  // 地图ID
    
    // 处理从副本返回的结果
    this.dungeonResult = data?.dungeonResult || null;
    this.dungeonCompleted = data?.completed || false;
    this.returnNodeId = data?.nodeId || null;
    
    // 地图数据
    this.mapNodes = [];
    this.nodeObjects = new Map(); // 存储格子对象
    this.pathLines = [];
    
    // 玩家棋子
    this.playerToken = null;
    this.isMoving = false;
    
    // UI 元素
    this.dice = null;
    this.choicePanel = null;
    this.messageText = null;
  }

  async create() {
    // 创建背景
    this.createBackground();
    
    // 创建地图容器（用于摄像机拖动）
    this.mapContainer = this.add.container(0, 0);
    
    // 加载游戏状态（如果有存档ID）
    if (this.saveId) {
      await this.loadGameState();
    }
    
    // 处理从副本返回的结果
    await this.handleDungeonReturn();
    
    // 加载地图数据
    await this.loadMapData();
    
    // 渲染地图
    this.renderMap();
    
    // 创建玩家棋子
    this.createPlayerToken();
    
    // 创建骰子
    this.createDice();
    
    // 创建消息提示
    this.createMessageText();
    
    // 设置摄像机
    this.setupCamera();
    
    // 创建返回主菜单按钮
    this.createBackToMenuButton();
    
    // 显示当前位置提示
    this.showMessage('点击骰子开始移动');
    
    // 淡入效果
    this.cameras.main.fadeIn(300);
  }

  async loadGameState() {
    try {
      const response = await get(`/game/load/${this.saveId}`);
      if (response) {
        this.currentPosition = response.current_position || 0;
        this.completedNodes = response.completed_nodes || [];
      }
    } catch (error) {
      console.error('加载游戏状态失败:', error);
      this.showMessage('加载存档失败');
    }
  }

  async handleDungeonReturn() {
    // 如果有从副本返回的结果，更新游戏状态
    if (this.returnNodeId !== null && this.dungeonResult !== null) {
      const won = this.dungeonResult === 'win';
      
      try {
        // 更新后端游戏状态
        const response = await put(`/game/update-position/${this.saveId}`, {
          position: won ? this.returnNodeId : this.currentPosition,
          won: won,
          node_id: this.returnNodeId,
        });
        
        // 更新本地状态
        if (won) {
          this.currentPosition = this.returnNodeId;
          if (!this.completedNodes.includes(this.returnNodeId)) {
            this.completedNodes.push(this.returnNodeId);
          }
          this.showMessage('副本挑战成功！');
        } else {
          this.showMessage('副本挑战失败，请再接再厉');
        }
      } catch (error) {
        console.error('更新游戏状态失败:', error);
      }
      
      // 清空副本结果
      this.dungeonResult = null;
      this.dungeonCompleted = false;
      this.returnNodeId = null;
    }
  }

  createBackToMenuButton() {
    const { width } = this.scale;
    
    // 返回主菜单按钮
    const button = this.add.text(80, 30, '< 主菜单', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#a0aec0',
    }).setInteractive({ useHandCursor: true });
    
    button.on('pointerover', () => button.setColor('#ffffff'));
    button.on('pointerout', () => button.setColor('#a0aec0'));
    button.on('pointerdown', () => {
      this.cameras.main.fadeOut(300);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MainMenuScene');
      });
    });
  }

  createBackground() {
    // 深色背景
    const graphics = this.add.graphics();
    graphics.fillStyle(0x1a1a2e, 1);
    graphics.fillRect(0, 0, this.scale.width, this.scale.height);
    
    // 添加网格纹理效果
    const gridGraphics = this.add.graphics();
    gridGraphics.lineStyle(1, 0x2d3748, 0.5);
    for (let i = 0; i < this.scale.width; i += 50) {
      gridGraphics.moveTo(i, 0);
      gridGraphics.lineTo(i, this.scale.height);
    }
    for (let i = 0; i < this.scale.height; i += 50) {
      gridGraphics.moveTo(0, i);
      gridGraphics.lineTo(this.scale.width, i);
    }
    gridGraphics.strokePath();
  }

  async loadMapData() {
    try {
      const response = await get(`/map/data/${this.mapId}`);
      this.mapNodes = response.nodes || [];
    } catch (error) {
      console.error('加载地图数据失败:', error);
      this.showMessage('加载地图失败，请刷新重试');
    }
  }

  renderMap() {
    if (!this.mapNodes.length) return;

    // 使用节点自带的坐标
    const nodePositions = this.getNodePositions();
    
    // 绘制连接线
    this.drawConnections(nodePositions);
    
    // 绘制格子
    this.mapNodes.forEach((node) => {
      const pos = nodePositions.get(node.id);
      if (pos) {
        this.createNode(node, pos.x, pos.y);
      }
    });
  }

  getNodePositions() {
    // 直接使用节点自带的 x, y 坐标
    const positions = new Map();
    this.mapNodes.forEach((node) => {
      positions.set(node.id, { x: node.x, y: node.y });
    });
    return positions;
  }

  drawConnections(nodePositions) {
    const graphics = this.add.graphics();
    graphics.lineStyle(3, 0x4a5568, 0.8);
    
    this.mapNodes.forEach((node) => {
      const fromPos = nodePositions.get(node.id);
      if (!fromPos) return;
      
      node.next.forEach((nextId) => {
        const toPos = nodePositions.get(nextId);
        if (toPos) {
          graphics.moveTo(fromPos.x, fromPos.y);
          graphics.lineTo(toPos.x, toPos.y);
        }
      });
    });
    
    graphics.strokePath();
    this.mapContainer.add(graphics);
  }

  createNode(node, x, y) {
    const container = this.add.container(x, y);
    
    // 格子颜色配置
    const colors = {
      start: 0x4CAF50,
      end: 0xFFD700,
      card: 0x2196F3,
      action: 0xFF9800,
      ai: 0x9C27B0,
      empty: 0x607D8B,
    };
    
    // 格子类型图标
    const icons = {
      start: '起',
      end: '终',
      card: '♠',
      action: '⚡',
      ai: '🤖',
      empty: '·',
    };
    
    const color = colors[node.type] || 0x607D8B;
    const icon = icons[node.type] || '?';
    
    // 格子背景（圆角矩形）
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-40, -40, 80, 80, 12);
    bg.lineStyle(2, 0xffffff, 0.5);
    bg.strokeRoundedRect(-40, -40, 80, 80, 12);
    
    // 编号文字
    const idText = this.add.text(0, -15, node.id.toString(), {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    
    // 类型图标
    const iconText = this.add.text(0, 15, icon, {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);
    
    container.add([bg, idText, iconText]);
    
    // 如果是已通关的格子，添加对勾标记
    if (this.completedNodes.includes(node.id)) {
      const checkMark = this.add.text(25, -25, '✓', {
        fontSize: '20px',
        fontFamily: 'Arial, sans-serif',
        color: '#4ade80',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(checkMark);
    }
    
    // 存储格子对象
    this.nodeObjects.set(node.id, {
      container,
      bg,
      node,
      x,
      y,
    });
    
    // 如果是当前位置，添加高亮
    if (node.id === this.currentPosition) {
      this.highlightCurrentNode(node.id);
    }
    
    this.mapContainer.add(container);
  }

  highlightCurrentNode(nodeId) {
    const nodeObj = this.nodeObjects.get(nodeId);
    if (!nodeObj) return;
    
    // 创建发光边框动画
    const glowGraphics = this.add.graphics();
    glowGraphics.lineStyle(4, 0xfacc15, 1);
    glowGraphics.strokeRoundedRect(-45, -45, 90, 90, 15);
    
    const glowContainer = this.add.container(nodeObj.x, nodeObj.y);
    glowContainer.add(glowGraphics);
    this.mapContainer.add(glowContainer);
    
    // 脉冲动画
    this.tweens.add({
      targets: glowContainer,
      scale: { from: 1, to: 1.1 },
      alpha: { from: 1, to: 0.5 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    // 存储引用以便后续清除
    this.currentGlow = glowContainer;
  }

  clearHighlight() {
    if (this.currentGlow) {
      this.currentGlow.destroy();
      this.currentGlow = null;
    }
  }

  createPlayerToken() {
    const nodeObj = this.nodeObjects.get(this.currentPosition);
    if (!nodeObj) return;
    
    // 创建玩家棋子（红色圆形带白色边框）
    const graphics = this.add.graphics();
    graphics.fillStyle(0xF44336, 1);
    graphics.fillCircle(0, 0, 20);
    graphics.lineStyle(3, 0xffffff, 1);
    graphics.strokeCircle(0, 0, 20);
    
    this.playerToken = this.add.container(nodeObj.x, nodeObj.y);
    this.playerToken.add(graphics);
    this.mapContainer.add(this.playerToken);
    
    // 添加入场动画
    this.tweens.add({
      targets: this.playerToken,
      scale: { from: 0, to: 1 },
      duration: 300,
      ease: 'Back.out',
    });
  }

  createDice() {
    const { width, height } = this.scale;
    
    // 在右下角创建骰子
    this.dice = createDice(this, width - 80, height - 80, () => {
      this.onDiceClick();
    });
    
    // 添加骰子标签
    this.add.text(width - 80, height - 130, '点击掷骰', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#aaaaaa',
    }).setOrigin(0.5);
  }

  createMessageText() {
    const { width } = this.scale;
    
    this.messageText = this.add.text(width / 2, 30, '', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      backgroundColor: '#00000080',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5);
  }

  setupCamera() {
    // 启用拖动
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let cameraStartX = 0;
    let cameraStartY = 0;
    
    this.input.on('pointerdown', (pointer) => {
      // 如果点击在骰子上，不触发拖动
      if (this.dice && this.dice.container) {
        const bounds = this.dice.container.getBounds();
        if (bounds.contains(pointer.x, pointer.y)) {
          return;
        }
      }
      
      isDragging = true;
      dragStartX = pointer.x;
      dragStartY = pointer.y;
      cameraStartX = this.cameras.main.scrollX;
      cameraStartY = this.cameras.main.scrollY;
    });
    
    this.input.on('pointermove', (pointer) => {
      if (isDragging) {
        const dx = dragStartX - pointer.x;
        const dy = dragStartY - pointer.y;
        this.cameras.main.scrollX = cameraStartX + dx;
        this.cameras.main.scrollY = cameraStartY + dy;
      }
    });
    
    this.input.on('pointerup', () => {
      isDragging = false;
    });
  }

  async onDiceClick() {
    if (this.isMoving) return;
    
    this.dice.disable();
    
    try {
      // 调用掷骰子 API
      const response = await post('/map/roll-dice', {
        current_position: this.currentPosition,
      });
      
      // 显示骰子结果
      this.dice.showResult(response.value);
      
      // 检查是否需要选择路径
      if (response.need_choice && response.choices) {
        this.showChoicePanel(response);
      } else {
        // 直接移动
        await this.movePlayerAlongPath(response.path);
        // 处理到达格子
        this.handleArrival(response.new_position);
      }
    } catch (error) {
      console.error('掷骰子失败:', error);
      this.showMessage('掷骰子失败，请重试');
      this.dice.enable();
    }
  }

  showChoicePanel(response) {
    const { width, height } = this.scale;
    
    // 创建选择面板
    this.choicePanel = this.add.container(width / 2, height / 2);
    
    // 背景遮罩
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(-width / 2, -height / 2, width, height);
    
    // 面板背景
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x2d3748, 1);
    panelBg.fillRoundedRect(-200, -150, 400, 300, 16);
    panelBg.lineStyle(2, 0x4a5568, 1);
    panelBg.strokeRoundedRect(-200, -150, 400, 300, 16);
    
    // 标题
    const title = this.add.text(0, -100, '选择路径', {
      fontSize: '32px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    
    this.choicePanel.add([overlay, panelBg, title]);
    
    // 创建选择按钮
    const choices = response.choices || [];
    const buttonSpacing = 80;
    const startY = -20;
    
    choices.forEach((choice, index) => {
      const buttonY = startY + index * buttonSpacing;
      
      // 获取下一格信息
      const nextNode = this.mapNodes.find(n => n.id === choice.next_node);
      const nodeTypeText = nextNode ? this.getNodeTypeText(nextNode.type) : '未知';
      
      const button = this.createChoiceButton(
        0,
        buttonY,
        `路径 ${index + 1}: ${nodeTypeText}`,
        () => this.onPathChosen(response, choice)
      );
      
      this.choicePanel.add(button);
    });
  }

  getNodeTypeText(type) {
    const typeTexts = {
      start: '起点',
      end: '终点',
      card: '扑克牌关卡',
      action: '行动关卡',
      ai: 'AI关卡',
      empty: '安全区域',
    };
    return typeTexts[type] || type;
  }

  createChoiceButton(x, y, text, onClick) {
    const container = this.add.container(x, y);
    
    // 按钮背景
    const bg = this.add.graphics();
    bg.fillStyle(0x3b82f6, 1);
    bg.fillRoundedRect(-150, -30, 300, 60, 10);
    
    // 按钮文字
    const buttonText = this.add.text(0, 0, text, {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);
    
    container.add([bg, buttonText]);
    
    // 设置交互
    const hitArea = new Phaser.Geom.Rectangle(-150, -30, 300, 60);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    container.setInteractive({ useHandCursor: true });
    
    // 悬停效果
    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x2563eb, 1);
      bg.fillRoundedRect(-150, -30, 300, 60, 10);
      container.setScale(1.05);
    });
    
    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x3b82f6, 1);
      bg.fillRoundedRect(-150, -30, 300, 60, 10);
      container.setScale(1);
    });
    
    // 点击事件
    container.on('pointerdown', () => {
      onClick();
    });
    
    return container;
  }

  async onPathChosen(response, choice) {
    // 隐藏选择面板
    if (this.choicePanel) {
      this.choicePanel.destroy();
      this.choicePanel = null;
    }
    
    try {
      // 调用选择路径 API，使用 remaining_steps 作为剩余步数
      const result = await post('/map/choose-path', {
        current_position: response.current_position,
        steps: response.remaining_steps,
        choice: choice,
      });
      
      // 移动玩家
      await this.movePlayerAlongPath(result.path);
      // 处理到达格子
      this.handleArrival(result.new_position);
    } catch (error) {
      console.error('选择路径失败:', error);
      this.showMessage('选择路径失败，请重试');
      this.dice.enable();
    }
  }

  async movePlayerAlongPath(path) {
    if (!path || path.length < 2) return;
    
    this.isMoving = true;
    this.showMessage('移动中...');
    
    // 清除当前高亮
    this.clearHighlight();
    
    // 沿路径逐格移动
    for (let i = 1; i < path.length; i++) {
      const nodeId = path[i];
      const nodeObj = this.nodeObjects.get(nodeId);
      
      if (nodeObj) {
        // 摄像机跟随
        this.cameras.main.pan(nodeObj.x, nodeObj.y, 500, 'Power2');
        
        // 移动动画
        await new Promise((resolve) => {
          this.tweens.add({
            targets: this.playerToken,
            x: nodeObj.x,
            y: nodeObj.y,
            duration: 500,
            ease: 'Power2',
            onComplete: resolve,
          });
        });
        
        // 更新当前位置
        this.currentPosition = nodeId;
      }
    }
    
    // 高亮新位置
    this.highlightCurrentNode(this.currentPosition);
    
    this.isMoving = false;
  }

  handleArrival(nodeId) {
    const node = this.mapNodes.find(n => n.id === nodeId);
    if (!node) {
      this.dice.enable();
      return;
    }
    
    // 根据格子类型处理
    switch (node.type) {
      case 'card':
        this.showMessage('进入扑克牌对决！');
        this.time.delayedCall(1000, () => {
          this.cameras.main.fadeOut(300);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('CardDungeonScene', {
              nodeId: nodeId,
              saveId: this.saveId,
            });
          });
        });
        break;
        
      case 'action':
        this.showMessage('进入动作指令挑战！');
        this.time.delayedCall(1000, () => {
          this.cameras.main.fadeOut(300);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('ActionDungeonScene', {
              nodeId: nodeId,
              saveId: this.saveId,
            });
          });
        });
        break;
        
      case 'ai':
        this.showMessage('进入AI对话关卡！');
        this.time.delayedCall(1000, () => {
          this.cameras.main.fadeOut(300);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('AIDungeonScene', {
              nodeId: nodeId,
              saveId: this.saveId,
            });
          });
        });
        break;
        
      case 'empty':
        this.showMessage('安全区域，休息一下');
        this.time.delayedCall(2000, () => {
          this.dice.enable();
        });
        break;
        
      case 'end':
        this.showMessage('恭喜通关！');
        this.showVictoryScreen();
        break;
        
      default:
        this.dice.enable();
    }
  }

  showVictoryScreen() {
    const { width, height } = this.scale;
    
    // 胜利画面
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(0, 0, width, height);
    
    const victoryText = this.add.text(width / 2, height / 2 - 50, '恭喜通关！', {
      fontSize: '64px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);
    
    const subText = this.add.text(width / 2, height / 2 + 50, '你已完成所有挑战', {
      fontSize: '28px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);
    
    // 动画
    this.tweens.add({
      targets: victoryText,
      scale: { from: 0.5, to: 1 },
      duration: 500,
      ease: 'Back.out',
    });
  }

  showMessage(text) {
    if (this.messageText) {
      this.messageText.setText(text);
      
      // 淡入动画
      this.messageText.setAlpha(0);
      this.tweens.add({
        targets: this.messageText,
        alpha: 1,
        duration: 200,
      });
      
      // 3秒后淡出（如果不是重要消息）
      if (!text.includes('进入') && !text.includes('恭喜')) {
        this.time.delayedCall(3000, () => {
          this.tweens.add({
            targets: this.messageText,
            alpha: 0,
            duration: 500,
          });
        });
      }
    }
  }
}
