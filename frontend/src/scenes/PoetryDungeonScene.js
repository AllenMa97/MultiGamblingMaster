import Phaser from 'phaser';

export default class PoetryDungeonScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PoetryDungeonScene' });
        this.sessionId = null;
        this.websocket = null;
        this.topic = null;
        this.opponentAnswer = '';
        this.judgeComment = '';
        this.gameResult = null;
    }

    create() {
        const { width, height } = this.scale;

        // 背景色
        this.cameras.main.setBackgroundColor('#1a1a2e');

        // 标题
        this.add.text(width / 2, 40, '吟诗作对', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '36px',
            color: '#ffd700',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 题目显示区（顶部）
        this.topicContainer = this.add.container(width / 2, 100);
        
        this.topicTitle = this.add.text(0, 0, '正在获取题目...', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.topicContainer.add(this.topicTitle);

        // 对手答卷区（中间左侧）
        this.add.text(width * 0.25, 160, '对手答卷', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '20px',
            color: '#ff6b6b',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.opponentText = this.add.text(width * 0.25, 200, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            color: '#cccccc',
            align: 'center',
            wordWrap: { width: width * 0.4 }
        }).setOrigin(0.5, 0);

        // 玩家答卷区（中间右侧）- 使用 HTML textarea
        this.add.text(width * 0.75, 160, '你的答卷', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '20px',
            color: '#4ecdc4',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 创建 DOM 输入框
        this.createPlayerInput(width * 0.75, 200, width * 0.4, 200);

        // 状态提示
        this.statusText = this.add.text(width / 2, height - 120, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            color: '#ffd700'
        }).setOrigin(0.5);

        // 评判显示区
        this.judgeText = this.add.text(width / 2, height - 80, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            color: '#aaaaaa',
            align: 'center',
            wordWrap: { width: width * 0.8 }
        }).setOrigin(0.5);

        // 提交按钮
        this.submitButton = this.createButton(width / 2, height - 40, '提交答案', () => {
            this.submitAnswer();
        });
        this.submitButton.setVisible(false);

        // 返回地图按钮（初始隐藏）
        this.backButton = this.createButton(width / 2, height - 40, '返回地图', () => {
            this.scene.start('MapScene');
        });
        this.backButton.setVisible(false);

        // 开始游戏流程
        this.startGame();
    }

    createPlayerInput(x, y, width, height) {
        // 创建 textarea 元素
        const element = document.createElement('textarea');
        element.style.width = width + 'px';
        element.style.height = height + 'px';
        element.style.padding = '10px';
        element.style.fontSize = '16px';
        element.style.fontFamily = 'Arial, sans-serif';
        element.style.backgroundColor = '#2d2d44';
        element.style.color = '#ffffff';
        element.style.border = '2px solid #4ecdc4';
        element.style.borderRadius = '8px';
        element.style.resize = 'none';
        element.style.outline = 'none';
        element.placeholder = '等待对手完成...';
        element.disabled = true;

        this.playerInput = this.add.dom(x, y + height / 2).createFromElement(element);
        this.playerInput.setOrigin(0.5);
    }

    createButton(x, y, text, callback) {
        const buttonBg = this.add.rectangle(x, y, 140, 40, 0x4ecdc4)
            .setInteractive({ useHandCursor: true });
        
        const buttonText = this.add.text(x, y, text, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            color: '#1a1a2e',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(0x5ddddd);
        });

        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(0x4ecdc4);
        });

        buttonBg.on('pointerdown', () => {
            buttonBg.setFillStyle(0x3dbdbd);
        });

        buttonBg.on('pointerup', () => {
            buttonBg.setFillStyle(0x4ecdc4);
            callback();
        });

        const container = this.add.container(0, 0, [buttonBg, buttonText]);
        return container;
    }

    async startGame() {
        try {
            // 调用 /start 获取题目
            const response = await fetch('/api/dungeon/poetry/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            this.sessionId = data.session_id;
            this.topic = data.topic;

            // 显示题目
            this.topicTitle.setText(`主题：${this.topic.theme}    要求：${this.topic.constraint}`);
            
            // 建立 WebSocket 连接
            this.connectWebSocket();

        } catch (error) {
            console.error('Failed to start game:', error);
            this.topicTitle.setText('获取题目失败，请重试');
        }
    }

    connectWebSocket() {
        const wsUrl = `ws://${window.location.host}/ws/dungeon/poetry/${this.sessionId}`;
        this.websocket = new WebSocket(wsUrl);

        this.websocket.onopen = () => {
            console.log('WebSocket connected');
            this.statusText.setText('对手正在创作中...');
        };

        this.websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
        };

        this.websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.statusText.setText('连接出错，请重试');
        };

        this.websocket.onclose = () => {
            console.log('WebSocket closed');
        };
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'opponent_answer':
                if (data.content) {
                    this.opponentAnswer += data.content;
                    this.opponentText.setText(this.opponentAnswer);
                }
                if (data.done) {
                    this.statusText.setText('请开始创作你的诗词');
                    this.opponentAnswer = data.full_content || this.opponentAnswer;
                    this.opponentText.setText(this.opponentAnswer);
                    
                    // 激活玩家输入框
                    const textarea = this.playerInput.getChildByName('textarea') || this.playerInput.node;
                    if (textarea) {
                        textarea.disabled = false;
                        textarea.placeholder = '在此输入你的诗词...';
                        textarea.style.backgroundColor = '#3d3d5c';
                    }
                    
                    // 显示提交按钮
                    this.submitButton.setVisible(true);
                }
                break;

            case 'judge_verdict':
                if (data.content) {
                    this.judgeComment += data.content;
                    this.judgeText.setText(this.judgeComment);
                }
                if (data.done) {
                    this.judgeComment = data.full_content || this.judgeComment;
                    this.judgeText.setText(this.judgeComment);
                }
                break;

            case 'result':
                this.gameResult = data.result;
                this.statusText.setText(data.message);
                this.statusText.setColor(data.result === 'win' ? '#4ecdc4' : '#ff6b6b');
                
                // 隐藏提交按钮，显示返回按钮
                this.submitButton.setVisible(false);
                this.backButton.setVisible(true);
                
                // 禁用输入框
                const textarea = this.playerInput.getChildByName('textarea') || this.playerInput.node;
                if (textarea) {
                    textarea.disabled = true;
                }
                break;

            case 'error':
                console.error('Server error:', data.content);
                this.statusText.setText('出错了：' + data.content);
                break;
        }
    }

    submitAnswer() {
        const textarea = this.playerInput.getChildByName('textarea') || this.playerInput.node;
        if (!textarea) return;

        const answer = textarea.value.trim();
        if (!answer) {
            this.statusText.setText('请输入你的诗词后再提交');
            return;
        }

        // 禁用输入框和提交按钮
        textarea.disabled = true;
        this.submitButton.setVisible(false);
        this.statusText.setText('裁判正在评判中...');

        // 发送答案到服务器
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({
                type: 'player_answer',
                content: answer
            }));
        }
    }

    shutdown() {
        // 清理 WebSocket
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
    }
}
