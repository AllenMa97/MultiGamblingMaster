import Phaser from 'phaser';

export default class ReverseDungeonScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ReverseDungeonScene' });
        this.sessionId = null;
        this.websocket = null;
        this.absurdClaim = null;
        this.currentRound = 0;
        this.maxRounds = 3;
        this.messages = [];
        this.gameResult = null;
        this.isPlayerTurn = false;
    }

    create() {
        const { width, height } = this.scale;

        // 背景色 - 紫色神秘调
        this.cameras.main.setBackgroundColor('#1a0a2e');

        // 标题
        this.add.text(width / 2, 35, '反向说服', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '38px',
            color: '#e066ff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 副标题
        this.add.text(width / 2, 70, '让裁判相信不可能的事！', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            color: '#cc99ff'
        }).setOrigin(0.5);

        // 荒谬论点显示区（顶部，大字搞笑风格）
        this.claimContainer = this.add.container(width / 2, 115);
        
        // 论点背景
        const claimBg = this.add.rectangle(0, 0, width * 0.85, 55, 0x4a0080, 0.7);
        claimBg.setStrokeStyle(3, 0xe066ff);
        this.claimContainer.add(claimBg);
        
        this.claimText = this.add.text(0, 0, '正在生成荒谬论点...', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '20px',
            color: '#ffccff',
            align: 'center',
            fontStyle: 'bold',
            wordWrap: { width: width * 0.8 }
        }).setOrigin(0.5);
        this.claimContainer.add(this.claimText);

        // 轮次指示器
        this.roundText = this.add.text(width - 20, 20, '第 1/3 轮', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            color: '#cc99ff'
        }).setOrigin(1, 0);

        // 对话记录区
        this.add.text(width / 2, 160, '辩论记录', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // 对话区域背景
        this.add.rectangle(width / 2, 285, width * 0.9, 200, 0x2d1b4e, 0.6);
        this.add.rectangle(width / 2, 285, width * 0.9, 200, 0x000000, 0).setStrokeStyle(1, 0x9966cc);

        // 对话文本区域
        this.dialogueText = this.add.text(width / 2, 190, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '13px',
            color: '#dddddd',
            align: 'left',
            wordWrap: { width: width * 0.85 }
        }).setOrigin(0.5, 0);

        // 当前发言提示
        this.speakerText = this.add.text(width / 2, height - 145, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            color: '#ffaa00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 输入区域
        this.inputContainer = this.add.container(width / 2, height - 95);
        
        // 输入框背景
        const inputBg = this.add.rectangle(0, 0, width * 0.85, 70, 0x3d1a5c, 0.8);
        this.inputContainer.add(inputBg);

        // 创建 DOM 输入框
        this.createPlayerInput(0, 0, width * 0.8, 60);

        // 提交按钮
        this.submitButton = this.createButton(width / 2 + 120, height - 40, '提交', () => {
            this.submitArgument();
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
        element.style.padding = '8px';
        element.style.fontSize = '14px';
        element.style.fontFamily = 'Arial, sans-serif';
        element.style.backgroundColor = '#4a2a6c';
        element.style.color = '#ffffff';
        element.style.border = '2px solid #e066ff';
        element.style.borderRadius = '6px';
        element.style.resize = 'none';
        element.style.outline = 'none';
        element.placeholder = '等待对手发言...';
        element.disabled = true;

        this.playerInput = this.add.dom(x, y + height / 2 - 5).createFromElement(element);
        this.playerInput.setOrigin(0.5);
        this.inputContainer.add(this.playerInput);
    }

    createButton(x, y, text, callback) {
        const buttonBg = this.add.rectangle(x, y, 100, 36, 0xe066ff)
            .setInteractive({ useHandCursor: true });
        
        const buttonText = this.add.text(x, y, text, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            color: '#1a0a2e',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(0xff99ff);
        });

        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(0xe066ff);
        });

        buttonBg.on('pointerdown', () => {
            buttonBg.setFillStyle(0xcc55cc);
        });

        buttonBg.on('pointerup', () => {
            buttonBg.setFillStyle(0xe066ff);
            callback();
        });

        const container = this.add.container(0, 0, [buttonBg, buttonText]);
        return container;
    }

    async startGame() {
        try {
            // 调用 /start 获取荒谬论点
            const response = await fetch('/api/dungeon/reverse/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            this.sessionId = data.session_id;
            this.absurdClaim = data.absurd_claim;
            this.maxRounds = data.max_rounds || 3;

            // 显示论点
            this.claimText.setText(`论点：${this.absurdClaim}`);
            this.roundText.setText(`第 1/${this.maxRounds} 轮`);
            
            // 建立 WebSocket 连接
            this.connectWebSocket();

        } catch (error) {
            console.error('Failed to start game:', error);
            this.claimText.setText('获取论点失败，请重试');
        }
    }

    connectWebSocket() {
        const wsUrl = `ws://${window.location.host}/ws/dungeon/reverse/${this.sessionId}`;
        this.websocket = new WebSocket(wsUrl);

        this.websocket.onopen = () => {
            console.log('WebSocket connected');
        };

        this.websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
        };

        this.websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.speakerText.setText('连接出错，请重试');
        };

        this.websocket.onclose = () => {
            console.log('WebSocket closed');
        };
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'game_info':
                this.absurdClaim = data.absurd_claim;
                this.maxRounds = data.max_rounds;
                this.claimText.setText(`论点：${this.absurdClaim}`);
                break;

            case 'opponent_argument':
                this.isPlayerTurn = false;
                if (data.content) {
                    // 实时更新对手发言
                    if (!this.currentOpponentMsg) {
                        this.currentOpponentMsg = data.content;
                    } else {
                        this.currentOpponentMsg += data.content;
                    }
                    this.speakerText.setText('对手正在发言...');
                    this.speakerText.setColor('#ff6b6b');
                }
                if (data.done) {
                    this.currentRound = data.round;
                    this.roundText.setText(`第 ${this.currentRound}/${this.maxRounds} 轮`);
                    
                    // 保存完整消息
                    const fullMsg = data.full_content || this.currentOpponentMsg || '';
                    this.addMessage('opponent', fullMsg);
                    this.currentOpponentMsg = '';
                    
                    // 轮到玩家
                    this.speakerText.setText('轮到你了！请说服裁判');
                    this.speakerText.setColor('#4ecdc4');
                    
                    // 激活输入框
                    const textarea = this.playerInput.getChildByName('textarea') || this.playerInput.node;
                    if (textarea) {
                        textarea.disabled = false;
                        textarea.placeholder = '输入你的论点...';
                        textarea.style.backgroundColor = '#5a3a7c';
                        textarea.value = '';
                    }
                    
                    this.submitButton.setVisible(true);
                    this.isPlayerTurn = true;
                }
                break;

            case 'judge_response':
                if (data.content) {
                    if (!this.currentJudgeMsg) {
                        this.currentJudgeMsg = data.content;
                    } else {
                        this.currentJudgeMsg += data.content;
                    }
                    this.speakerText.setText('裁判正在思考...');
                    this.speakerText.setColor('#ffaa00');
                }
                if (data.done) {
                    const fullMsg = data.full_content || this.currentJudgeMsg || '';
                    this.addMessage('judge', fullMsg);
                    this.currentJudgeMsg = '';
                    
                    // 检查是否被说服
                    if (fullMsg.includes('好像有道理') || fullMsg.includes('有点道理')) {
                        this.showConvincedEffect();
                    }
                    
                    this.speakerText.setText('');
                }
                break;

            case 'result':
                this.gameResult = data.result;
                this.speakerText.setText(data.message);
                this.speakerText.setColor(data.result === 'win' ? '#4ecdc4' : '#ff6b6b');
                
                // 隐藏输入区，显示返回按钮
                this.inputContainer.setVisible(false);
                this.submitButton.setVisible(false);
                this.backButton.setVisible(true);
                break;

            case 'error':
                console.error('Server error:', data.content);
                this.speakerText.setText('出错了：' + data.content);
                this.speakerText.setColor('#ff6b6b');
                break;
        }
    }

    addMessage(speaker, content) {
        let prefix = '';
        let color = '';
        
        switch (speaker) {
            case 'opponent':
                prefix = '【对手】';
                color = '#ff9999';
                break;
            case 'player':
                prefix = '【你】';
                color = '#99ffcc';
                break;
            case 'judge':
                prefix = '【裁判】';
                color = '#ffdd99';
                break;
        }
        
        this.messages.push({ speaker, content: prefix + content });
        this.updateDialogueDisplay();
    }

    updateDialogueDisplay() {
        // 只显示最近的消息，避免超出区域
        const recentMessages = this.messages.slice(-6);
        let displayText = '';
        
        recentMessages.forEach((msg, index) => {
            let color = '#ffffff';
            if (msg.speaker === 'opponent') color = '#ff9999';
            else if (msg.speaker === 'player') color = '#99ffcc';
            else if (msg.speaker === 'judge') color = '#ffdd99';
            
            // 截断过长的消息
            let shortContent = msg.content;
            if (shortContent.length > 80) {
                shortContent = shortContent.substring(0, 80) + '...';
            }
            
            displayText += shortContent + '\n\n';
        });
        
        this.dialogueText.setText(displayText);
    }

    showConvincedEffect() {
        const { width, height } = this.scale;
        
        // 创建说服特效
        const flash = this.add.rectangle(width / 2, height / 2, width, height, 0xffffff, 0.3);
        
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                flash.destroy();
            }
        });
        
        // 显示"动摇了！"文字
        const convincedText = this.add.text(width / 2, height / 2, '裁判动摇了！', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '32px',
            color: '#ffff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: convincedText,
            scale: { from: 0.5, to: 1.2 },
            alpha: { from: 1, to: 0 },
            duration: 1500,
            onComplete: () => {
                convincedText.destroy();
            }
        });
    }

    submitArgument() {
        const textarea = this.playerInput.getChildByName('textarea') || this.playerInput.node;
        if (!textarea) return;

        const argument = textarea.value.trim();
        if (!argument) {
            this.speakerText.setText('请输入你的论点后再提交');
            return;
        }

        // 禁用输入框和提交按钮
        textarea.disabled = true;
        this.submitButton.setVisible(false);
        
        // 添加玩家消息到显示
        this.addMessage('player', argument);
        
        this.speakerText.setText('等待裁判回应...');
        this.speakerText.setColor('#ffaa00');

        // 发送答案到服务器
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({
                type: 'player_argument',
                content: argument
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
