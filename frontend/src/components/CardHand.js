/**
 * 扑克牌渲染组件
 * 提供创建扑克牌图形的方法
 */

// 花色符号映射
const SUIT_SYMBOLS = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

// 花色颜色映射
const SUIT_COLORS = {
  spades: '#1a1a1a',
  hearts: '#dc2626',
  diamonds: '#dc2626',
  clubs: '#1a1a1a',
};

// 牌尺寸 - 增大尺寸提升清晰度
const CARD_WIDTH = 160;
const CARD_HEIGHT = 240;
const CORNER_RADIUS = 12;

/**
 * 创建一张扑克牌
 * @param {Phaser.Scene} scene - Phaser 场景实例
 * @param {number} x - X 坐标
 * @param {number} y - Y 坐标
 * @param {Object} card - 牌数据对象 {suit, rank, value}
 * @param {boolean} faceUp - 是否正面朝上
 * @returns {Phaser.GameObjects.Container} 牌的容器对象
 */
export function createCard(scene, x, y, card, faceUp = true) {
  const container = scene.add.container(x, y);

  // 创建牌底（圆角矩形）
  const graphics = scene.add.graphics();

  if (faceUp) {
    // 正面：白色背景
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, CORNER_RADIUS);
    graphics.lineStyle(2, 0xcccccc, 1);
    graphics.strokeRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, CORNER_RADIUS);

    const suitSymbol = SUIT_SYMBOLS[card.suit] || '?';
    const suitColor = SUIT_COLORS[card.suit] || '#1a1a1a';
    const rank = card.rank;

    // 左上角点数和花色 - 增大字体
    const topLeftRank = scene.add.text(-CARD_WIDTH / 2 + 14, -CARD_HEIGHT / 2 + 12, rank, {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: suitColor,
      fontStyle: 'bold',
    }).setOrigin(0, 0);

    const topLeftSuit = scene.add.text(-CARD_WIDTH / 2 + 14, -CARD_HEIGHT / 2 + 44, suitSymbol, {
      fontSize: '30px',
      fontFamily: 'Arial',
      color: suitColor,
    }).setOrigin(0, 0);

    // 右下角点数和花色（倒置） - 增大字体
    const bottomRightRank = scene.add.text(CARD_WIDTH / 2 - 14, CARD_HEIGHT / 2 - 12, rank, {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: suitColor,
      fontStyle: 'bold',
    }).setOrigin(1, 1).setRotation(Math.PI);

    const bottomRightSuit = scene.add.text(CARD_WIDTH / 2 - 14, CARD_HEIGHT / 2 - 44, suitSymbol, {
      fontSize: '30px',
      fontFamily: 'Arial',
      color: suitColor,
    }).setOrigin(1, 1).setRotation(Math.PI);

    // 中央大花色 - 增大字体
    const centerSuit = scene.add.text(0, 0, suitSymbol, {
      fontSize: '88px',
      fontFamily: 'Arial',
      color: suitColor,
    }).setOrigin(0.5);

    container.add([graphics, topLeftRank, topLeftSuit, bottomRightRank, bottomRightSuit, centerSuit]);
  } else {
    // 背面：蓝色背景带图案
    graphics.fillStyle(0x1e40af, 1);
    graphics.fillRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, CORNER_RADIUS);
    graphics.lineStyle(3, 0xffffff, 0.3);
    graphics.strokeRoundedRect(-CARD_WIDTH / 2 + 5, -CARD_HEIGHT / 2 + 5, CARD_WIDTH - 10, CARD_HEIGHT - 10, CORNER_RADIUS - 2);

    // 背面中央问号 - 增大字体
    const questionMark = scene.add.text(0, 0, '?', {
      fontSize: '64px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 添加装饰性圆点 - 增加密度
    const dotGraphics = scene.add.graphics();
    dotGraphics.fillStyle(0xffffff, 0.2);
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 9; j++) {
        const dotX = -CARD_WIDTH / 2 + 22 + i * 22;
        const dotY = -CARD_HEIGHT / 2 + 28 + j * 22;
        dotGraphics.fillCircle(dotX, dotY, 4);
      }
    }

    container.add([graphics, dotGraphics, questionMark]);
  }

  // 添加交互区域
  const hitArea = new Phaser.Geom.Rectangle(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT);
  container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

  return container;
}

/**
 * 翻牌动画
 * @param {Phaser.Scene} scene - Phaser 场景实例
 * @param {Phaser.GameObjects.Container} cardContainer - 牌的容器
 * @param {Object} card - 牌数据
 * @param {number} duration - 动画持续时间（毫秒）
 * @returns {Promise<void>}
 */
export function flipCard(scene, cardContainer, card, duration = 400) {
  return new Promise((resolve) => {
    // 第一阶段：缩小到 0（翻转前半段）
    scene.tweens.add({
      targets: cardContainer,
      scaleX: 0,
      duration: duration / 2,
      ease: 'Power2',
      onComplete: () => {
        // 清除旧内容，创建新牌面（正面）
        cardContainer.removeAll(true);

        // 创建正面牌
        const graphics = scene.add.graphics();
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, CORNER_RADIUS);
        graphics.lineStyle(2, 0xcccccc, 1);
        graphics.strokeRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, CORNER_RADIUS);

        const suitSymbol = SUIT_SYMBOLS[card.suit] || '?';
        const suitColor = SUIT_COLORS[card.suit] || '#1a1a1a';
        const rank = card.rank;

        const topLeftRank = scene.add.text(-CARD_WIDTH / 2 + 14, -CARD_HEIGHT / 2 + 12, rank, {
          fontSize: '32px',
          fontFamily: 'Arial',
          color: suitColor,
          fontStyle: 'bold',
        }).setOrigin(0, 0);

        const topLeftSuit = scene.add.text(-CARD_WIDTH / 2 + 14, -CARD_HEIGHT / 2 + 44, suitSymbol, {
          fontSize: '30px',
          fontFamily: 'Arial',
          color: suitColor,
        }).setOrigin(0, 0);

        const bottomRightRank = scene.add.text(CARD_WIDTH / 2 - 14, CARD_HEIGHT / 2 - 12, rank, {
          fontSize: '32px',
          fontFamily: 'Arial',
          color: suitColor,
          fontStyle: 'bold',
        }).setOrigin(1, 1).setRotation(Math.PI);

        const bottomRightSuit = scene.add.text(CARD_WIDTH / 2 - 14, CARD_HEIGHT / 2 - 44, suitSymbol, {
          fontSize: '30px',
          fontFamily: 'Arial',
          color: suitColor,
        }).setOrigin(1, 1).setRotation(Math.PI);

        const centerSuit = scene.add.text(0, 0, suitSymbol, {
          fontSize: '88px',
          fontFamily: 'Arial',
          color: suitColor,
        }).setOrigin(0.5);

        cardContainer.add([graphics, topLeftRank, topLeftSuit, bottomRightRank, bottomRightSuit, centerSuit]);

        // 第二阶段：放大到 1（翻转后半段）
        scene.tweens.add({
          targets: cardContainer,
          scaleX: 1,
          duration: duration / 2,
          ease: 'Power2',
          onComplete: () => {
            resolve();
          },
        });
      },
    });
  });
}

export { CARD_WIDTH, CARD_HEIGHT };
