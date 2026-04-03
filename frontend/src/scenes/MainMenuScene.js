import Phaser from 'phaser';
import { post, get } from '../utils/api.js';

/**
 * 主菜单场景
 * 提供开始新游戏、继续游戏、游戏说明等功能
 */
export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    const { width, height } = this.scale;

    // 创建背景
    this.createBackground();

    // 创建标题（带浮动动画）
    this.createTitle();

    // 创建按钮
    this.createMenuButtons();

    // 淡入效果
    this.cameras.main.fadeIn(300);
  }

  createBackground() {
    const { width, height } = this.scale;

    // 深色渐变背景
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x0f0f1e, 0x0f0f1e, 0x1a1a2e, 0x1a1a2e, 1);
    graphics.fillRect(0, 0, width, height);

    // 添加装饰性网格线
    const gridGraphics = this.add.graphics();
    gridGraphics.lineStyle(1, 0x2d3748, 0.3);
    for (let i = 0; i < width; i += 60) {
      gridGraphics.moveTo(i, 0);
      gridGraphics.lineTo(i, height);
    }
    for (let i = 0; i < height; i += 60) {
      gridGraphics.moveTo(0, i);
      gridGraphics.lineTo(width, i);
    }
    gridGraphics.strokePath();
  }

  createTitle() {
    const { width, height } = this.scale;

    // 主标题
    this.titleText = this.add.text(width / 2, height / 4, '多副本棋盘冒险', {
      fontSize: '56px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // 副标题
    this.add.text(width / 2, height / 4 + 50, '一场充满策略与欺骗的棋盘之旅', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#a0aec0',
    }).setOrigin(0.5);

    // 标题浮动动画
    this.tweens.add({
      targets: this.titleText,
      y: height / 4 - 10,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  createMenuButtons() {
    const { width, height } = this.scale;
    const buttonY = height / 2 - 30;
    const buttonSpacing = 80;

    // 开始新游戏按钮
    this.createButton(
      width / 2,
      buttonY,
      '开始新游戏',
      () => this.onStartNewGame()
    );

    // 继续游戏按钮
    this.createButton(
      width / 2,
      buttonY + buttonSpacing,
      '继续游戏',
      () => this.onContinueGame()
    );

    // 游戏说明按钮
    this.createButton(
      width / 2,
      buttonY + buttonSpacing * 2,
      '游戏说明',
      () => this.onShowInstructions()
    );
  }

  createButton(x, y, text, onClick) {
    const buttonWidth = 280;
    const buttonHeight = 60;

    const container = this.add.container(x, y);

    // 按钮背景
    const bg = this.add.graphics();
    bg.fillStyle(0x2d3748, 1);
    bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 12);
    bg.lineStyle(2, 0x4a5568, 1);
    bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 12);

    // 按钮文字
    const buttonText = this.add.text(0, 0, text, {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#e2e8f0',
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
      bg.fillStyle(0x4a5568, 1);
      bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 12);
      bg.lineStyle(2, 0x63b3ed, 1);
      bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 12);
      container.setScale(1.05);
      buttonText.setColor('#ffffff');
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x2d3748, 1);
      bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 12);
      bg.lineStyle(2, 0x4a5568, 1);
      bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 12);
      container.setScale(1);
      buttonText.setColor('#e2e8f0');
    });

    // 点击事件
    container.on('pointerdown', () => {
      onClick();
    });

    return container;
  }

  onStartNewGame() {
    // 显示玩家名输入弹窗
    this.showNameInputDialog();
  }

  showNameInputDialog() {
    const { width, height } = this.scale;
    
    // 清理可能存在的旧输入框
    this.closeNameInputDialog();

    // 创建遮罩层
    this.nameInputOverlay = this.add.graphics();
    this.nameInputOverlay.fillStyle(0x000000, 0.85);
    this.nameInputOverlay.fillRect(0, 0, width, height);

    // 创建输入面板容器
    const panelWidth = 450;
    const panelHeight = 280;
    const panelX = width / 2;
    const panelY = height / 2;
    this.nameInputPanel = this.add.container(panelX, panelY);

    // 面板背景
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x1a1a2e, 1);
    panelBg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 16);
    panelBg.lineStyle(2, 0x4a5568, 1);
    panelBg.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 16);

    // 面板标题
    const title = this.add.text(0, -panelHeight / 2 + 50, '请输入你的名字', {
      fontSize: '28px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.nameInputPanel.add([panelBg, title]);

    // 创建 DOM 输入框 - 直接添加到页面，使用绝对定位
    const inputElement = document.createElement('input');
    inputElement.type = 'text';
    inputElement.placeholder = '请输入你的名字';
    inputElement.id = 'name-input-' + Date.now();  // 唯一 ID
    inputElement.style.cssText = `
      position: fixed;
      left: ${panelX}px;
      top: ${panelY - 20}px;
      transform: translate(-50%, -50%);
      width: 320px;
      height: 50px;
      font-size: 20px;
      padding: 0 15px;
      border: 2px solid #4a5568;
      border-radius: 10px;
      background-color: #0f0f1e;
      color: #ffffff;
      outline: none;
      text-align: center;
      font-family: Arial, sans-serif;
      z-index: 10000;
    `;
    inputElement.maxLength = 12;

    // 直接添加到 DOM
    document.body.appendChild(inputElement);
    this.nameInputDom = inputElement;
    
    // 立即聚焦
    setTimeout(() => {
      inputElement.focus();
    }, 50);

    // 创建按钮容器
    const buttonContainer = this.add.container(0, 70);

    // 确认按钮
    const confirmBtn = this.createDialogButton(0, 0, '确认', 0x3b82f6, () => {
      const playerName = inputElement.value.trim() || '玩家';
      this.createNewGame(playerName);
    });

    // 取消按钮
    const cancelBtn = this.createDialogButton(130, 0, '取消', 0x4a5568, () => {
      this.closeNameInputDialog();
    });

    buttonContainer.add([confirmBtn, cancelBtn]);
    this.nameInputPanel.add(buttonContainer);

    // 聚焦输入框
    this.time.delayedCall(100, () => {
      if (inputElement && this.nameInputPanel) {
        inputElement.focus();
        inputElement.style.zIndex = '9999';
      }
    });

    // 回车键确认
    inputElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const playerName = inputElement.value.trim() || '玩家';
        this.createNewGame(playerName);
      }
    });
  }

  createDialogButton(x, y, text, color, onClick) {
    const buttonWidth = 100;
    const buttonHeight = 45;

    const container = this.add.container(x, y);

    // 按钮背景
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);

    // 按钮文字
    const buttonText = this.add.text(0, 0, text, {
      fontSize: '18px',
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
      container.setScale(1.05);
    });

    container.on('pointerout', () => {
      container.setScale(1);
    });

    // 点击事件
    container.on('pointerdown', () => {
      onClick();
    });

    return container;
  }

  closeNameInputDialog() {
    // 清理输入框
    if (this.nameInputDom) {
      // 从 DOM 中移除
      if (this.nameInputDom.parentNode) {
        this.nameInputDom.parentNode.removeChild(this.nameInputDom);
      }
      this.nameInputDom = null;
    }
    
    // 销毁面板
    if (this.nameInputPanel) {
      this.nameInputPanel.destroy();
      this.nameInputPanel = null;
    }
    
    // 销毁遮罩
    if (this.nameInputOverlay) {
      this.nameInputOverlay.destroy();
      this.nameInputOverlay = null;
    }
  }

  async createNewGame(playerName) {
    try {
      // 关闭输入弹窗
      this.closeNameInputDialog();

      // 显示加载提示
      this.showMessage('加载地图列表...');

      // 获取地图列表
      const maps = await get('/map/list');
      
      // 显示地图选择界面
      this.showMapSelectionDialog(playerName, maps);
    } catch (error) {
      console.error('加载地图列表失败:', error);
      this.showMessage('加载地图列表失败，请重试');
    }
  }

  showMapSelectionDialog(playerName, maps) {
    const { width, height } = this.scale;

    // 创建遮罩层
    this.mapSelectOverlay = this.add.graphics();
    this.mapSelectOverlay.fillStyle(0x000000, 0.9);
    this.mapSelectOverlay.fillRect(0, 0, width, height);

    // 创建选择面板容器
    this.mapSelectPanel = this.add.container(width / 2, height / 2);

    // 面板标题
    const title = this.add.text(0, -height / 2 + 80, '选择地图', {
      fontSize: '36px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.mapSelectPanel.add(title);

    // 创建地图卡片
    const cardWidth = 280;
    const cardHeight = 180;
    const cardSpacing = 40;
    const startX = -((maps.length - 1) * (cardWidth + cardSpacing)) / 2;

    maps.forEach((map, index) => {
      const x = startX + index * (cardWidth + cardSpacing);
      const y = 0;
      
      const card = this.createMapCard(x, y, cardWidth, cardHeight, map, () => {
        this.onMapSelected(playerName, map.map_id);
      });
      
      this.mapSelectPanel.add(card);
    });

    // 返回按钮
    const backBtn = this.createDialogButton(0, height / 2 - 80, '返回', 0x4a5568, () => {
      this.closeMapSelectionDialog();
    });
    this.mapSelectPanel.add(backBtn);
  }

  createMapCard(x, y, width, height, map, onClick) {
    const container = this.add.container(x, y);

    // 卡片背景
    const bg = this.add.graphics();
    bg.fillStyle(0x2d3748, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 16);
    bg.lineStyle(2, 0x4a5568, 1);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 16);

    // 地图名称
    const nameText = this.add.text(0, -height / 2 + 40, map.name, {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#63b3ed',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 地图描述
    const descText = this.add.text(0, -10, map.description, {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#a0aec0',
      align: 'center',
      wordWrap: { width: width - 40 }
    }).setOrigin(0.5);

    // 节点数
    const nodeText = this.add.text(0, height / 2 - 40, `${map.node_count} 个节点`, {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#4ade80',
    }).setOrigin(0.5);

    container.add([bg, nameText, descText, nodeText]);

    // 设置交互
    const hitArea = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    container.setInteractive({ useHandCursor: true });

    // 悬停效果
    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x3d4758, 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 16);
      bg.lineStyle(3, 0x63b3ed, 1);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 16);
      container.setScale(1.05);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x2d3748, 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 16);
      bg.lineStyle(2, 0x4a5568, 1);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 16);
      container.setScale(1);
    });

    // 点击事件
    container.on('pointerdown', () => {
      onClick();
    });

    return container;
  }

  closeMapSelectionDialog() {
    if (this.mapSelectOverlay) {
      this.mapSelectOverlay.destroy();
      this.mapSelectOverlay = null;
    }
    if (this.mapSelectPanel) {
      this.mapSelectPanel.destroy();
      this.mapSelectPanel = null;
    }
  }

  async onMapSelected(playerName, mapId) {
    try {
      // 关闭地图选择界面
      this.closeMapSelectionDialog();
      
      // 显示加载提示
      this.showMessage('创建新游戏中...');

      // 调用后端创建新游戏
      const response = await post('/game/new', { 
        player_name: playerName,
        map_id: mapId
      });
      const saveId = response.save_id;

      // 淡入淡出切换到地图场景，传递玩家名和地图ID
      this.cameras.main.fadeOut(300);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MapScene', { saveId, playerName, mapId });
      });
    } catch (error) {
      console.error('创建新游戏失败:', error);
      this.showMessage('创建新游戏失败，请重试');
    }
  }

  async onContinueGame() {
    try {
      // 显示加载提示
      this.showMessage('加载存档中...');

      // 获取存档列表
      const saves = await get('/game/saves');

      if (saves && saves.length > 0) {
        // 显示存档列表
        this.showSaveList(saves);
      } else {
        this.showMessage('暂无存档');
      }
    } catch (error) {
      console.error('获取存档失败:', error);
      this.showMessage('获取存档失败，请重试');
    }
  }

  showSaveList(saves) {
    const { width, height } = this.scale;

    // 创建遮罩层
    this.overlay = this.add.graphics();
    this.overlay.fillStyle(0x000000, 0.8);
    this.overlay.fillRect(0, 0, width, height);

    // 创建存档列表面板
    const panelWidth = 500;
    const panelHeight = Math.min(400, 100 + saves.length * 80);

    const panel = this.add.container(width / 2, height / 2);

    // 面板背景
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x2d3748, 1);
    panelBg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 16);
    panelBg.lineStyle(2, 0x4a5568, 1);
    panelBg.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 16);

    // 面板标题
    const title = this.add.text(0, -panelHeight / 2 + 40, '选择存档', {
      fontSize: '28px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    panel.add([panelBg, title]);

    // 创建存档条目
    saves.forEach((save, index) => {
      const y = -panelHeight / 2 + 100 + index * 80;
      const saveItem = this.createSaveItem(0, y, save, panelWidth - 60);
      panel.add(saveItem);
    });

    // 关闭按钮
    const closeButton = this.createButton(0, panelHeight / 2 - 50, '关闭', () => {
      this.overlay.destroy();
      panel.destroy();
    });
    panel.add(closeButton);

    this.saveListPanel = panel;
  }

  createSaveItem(x, y, save, width) {
    const container = this.add.container(x, y);
    const height = 70;

    // 背景
    const bg = this.add.graphics();
    bg.fillStyle(0x1a202c, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
    bg.lineStyle(1, 0x4a5568, 1);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);

    // 玩家名称
    const playerName = this.add.text(-width / 2 + 20, -10, save.player_name || '玩家', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    });

    // 进度信息
    const progressText = `位置: ${save.current_position || 0} | 胜利: ${save.wins || 0} | 失败: ${save.losses || 0}`;
    const progress = this.add.text(-width / 2 + 20, 15, progressText, {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#a0aec0',
    });

    // 时间
    const timeText = save.updated_at ? new Date(save.updated_at).toLocaleString('zh-CN') : '';
    const time = this.add.text(width / 2 - 20, 0, timeText, {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#718096',
    }).setOrigin(1, 0.5);

    container.add([bg, playerName, progress, time]);

    // 设置交互
    const hitArea = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    container.setInteractive({ useHandCursor: true });

    // 悬停效果
    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x2d3748, 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
      bg.lineStyle(2, 0x63b3ed, 1);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x1a202c, 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
      bg.lineStyle(1, 0x4a5568, 1);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
    });

    // 点击加载存档
    container.on('pointerdown', () => {
      this.loadSave(save.save_id);
    });

    return container;
  }

  loadSave(saveId) {
    // 清理存档列表UI
    if (this.overlay) this.overlay.destroy();
    if (this.saveListPanel) this.saveListPanel.destroy();

    // 淡入淡出切换到地图场景
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MapScene', { saveId });
    });
  }

  onShowInstructions() {
    const { width, height } = this.scale;

    // 创建遮罩层
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(0, 0, width, height);

    // 创建说明面板
    const panelWidth = 600;
    const panelHeight = 450;

    const panel = this.add.container(width / 2, height / 2);

    // 面板背景
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x2d3748, 1);
    panelBg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 16);
    panelBg.lineStyle(2, 0x4a5568, 1);
    panelBg.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 16);

    // 面板标题
    const title = this.add.text(0, -panelHeight / 2 + 40, '游戏说明', {
      fontSize: '32px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 说明内容
    const instructions = [
      { title: '♠ 扑克牌关卡', desc: '与AI进行扑克牌比大小对决，运气与策略并存' },
      { title: '⚡ 动作指令关卡', desc: '在限定时间内按正确顺序输入指令，考验反应速度' },
      { title: '🤖 AI辩论关卡', desc: '与AI对手进行辩论，说服裁判你的观点更有道理' },
    ];

    let currentY = -panelHeight / 2 + 100;

    instructions.forEach((inst) => {
      // 标题
      const titleText = this.add.text(-panelWidth / 2 + 40, currentY, inst.title, {
        fontSize: '22px',
        fontFamily: 'Arial, sans-serif',
        color: '#63b3ed',
        fontStyle: 'bold',
      });

      // 描述
      const descText = this.add.text(-panelWidth / 2 + 40, currentY + 30, inst.desc, {
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        color: '#e2e8f0',
      });

      panel.add([titleText, descText]);
      currentY += 80;
    });

    // 操作说明
    const controlText = this.add.text(0, currentY + 20, '操作说明：点击骰子掷点移动，到达不同格子触发对应关卡', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#a0aec0',
    }).setOrigin(0.5);

    panel.add([panelBg, title, controlText]);

    // 关闭按钮
    const closeButton = this.createButton(0, panelHeight / 2 - 50, '我知道了', () => {
      overlay.destroy();
      panel.destroy();
    });
    panel.add(closeButton);
  }

  showMessage(text) {
    const { width, height } = this.scale;

    // 清除之前的消息
    if (this.messageText) {
      this.messageText.destroy();
    }

    this.messageText = this.add.text(width / 2, height - 100, text, {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      backgroundColor: '#00000080',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5);

    // 3秒后自动消失
    this.time.delayedCall(3000, () => {
      if (this.messageText) {
        this.messageText.destroy();
        this.messageText = null;
      }
    });
  }
}
