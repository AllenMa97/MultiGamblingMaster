import Phaser from 'phaser';

export default class InterrogateDungeonScene extends Phaser.Scene {
    constructor() {
        super({ key: 'InterrogateDungeonScene' });
        this.sessionId = null;
        this.websocket = null;
        this.scenario = null;
        this.maxQuestions = 6;
        this.currentQuestion = 0;
        this.playerHoles = 0;
        this.opponentHoles = 0;
        this.messages = [];
        this.gameResult = null;
        this.gamePhase = 'waiting'; // waiting, story_writing, interrogating, finished
    }

    create() {
        const { width, height } = this.scale;

        // 背景色 - 深色审讯室风格
        this.cameras.main.setBackgroundColor('#0d1117');

        // 标题
        this.add.text(width / 2, 30, 'AI审讯室', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '36px',
            color: '#ff4444',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 副标题
        this.add.text(width / 2, 60, '编故事也是技术活', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            color: '#888888'
        }).setOrigin(0.5);

        // 场景描述区（顶部）
        this.scenarioContainer = this.add.container(width / 2, 95);
        
        // 场景背景 - 聚光灯效果（用渐变色模拟）
        const scenarioBg = this.add.rectangle(0, 0, width * 0.9, 50, 0x1a2332, 0.9);
        scenarioBg.setStrokeStyle(2, 0x444444);
        this.scenarioContainer.add(scenarioBg);
        
        // 聚光灯效果（中心亮边缘暗）
        const spotlight = this.add.rectangle(0, 0, width * 0.5, 46, 0x2a3342, 0.5);
        this.scenarioContainer.add(spotlight);
        
        this.scenarioText = this.add.text(0, 0, '正在加载场景...', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '15px',
            color: '#cccccc',
            align: 'center',
            wordWrap: { width: width * 0.85 }
        }).setOrigin(0.5);
        this.scenarioContainer.add(this.scenarioText);

        // 漏洞计数器
        this.holeContainer = this.add.container(width / 2, 145);
        
        const holeBg = this.add.rectangle(0, 0, width * 0.9, 35, 0x1a2332, 0.8);
        holeBg.setStrokeStyle(1, 0x444444);
        this.holeContainer.add(holeBg);
        
        this.holeText = this.add.text(0, 0, '漏洞统计：玩家 0 个 vs 对手 0 个', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            color: '#ffaa44'
        }).setOrigin(0.5);
        this.holeContainer.add(this.holeText);

        // 对话记录区标题
        this.add.text(20, 170, '审讯记录', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            color: '#888888'
        });

        // 对话区域背景
        this.add.rectangle(width / 2, 300, width * 0.95, 200, 0x161b22, 0.9);
        this.add.rectangle(width / 2, 300, width * 0.95, 200, 0x000000, 0).setStrokeStyle(1, 0x333333);

        // 对话文本区域
        this.dialogueText = this.add.text(width / 2, 205, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            color: '#bbbbbb',
            align: 'left',
            wordWrap: { width: width * 0.9 }
        }).setOrigin(0.5, 0);

        // 状态提示
        this.statusText = this.add.text(width / 2, 420, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            color: '#ffaa44',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 输入区域
        this.inputContainer = this.add.container(width / 2, 460);
        
        // 输入框背景
        const inputBg = this.add.rectangle(0, 0, width * 0.9, 70, 0x21262d, 0.9);
        inputBg.setStrokeStyle(1, 0x444444);
        this.inputContainer.add(inputBg);

        // 创建 DOM 输入框
        this.createPlayerInput(0, 0, width * 0.85, 60);

        // 提交按钮
        this.submitButton = this.createButton(width - 80, height - 30, '提交', () => {
            this.submitInput();
        });
        this.submitButton.setVisible(false);

        // 返回地图按钮（初始隐藏）
        this.backButton = this.createButton(width / 2, height - 30, '返回地图', () => {
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
        element.style.fontSize = '13px';
        element.style.fontFamily = 'Arial, sans-serif';
        element.style.backgroundColor = '#0d1117';
        element.style.color = '#c9d1d9';
        element.style.border = '1px solid #444444';
        element.style.borderRadius = '4px';
        element.style.resize = 'none';
        element.style.outline = 'none';
        element.placeholder = '等待游戏开始...';
        element.disabled = true;

        this.playerInput = this.add.dom(x, y + height / 2 - 5).createFromElement(element);
        this.playerInput.setOrigin(0.5);
        this.inputContainer.add(this.playerInput);
    }

    createButton(x, y, text, callback) {
        const buttonBg = this.add.rectangle(x, y, 100, 32, 0x444444)
            .setInteractive({ useHandCursor: true });
        
        const buttonText = this.add.text(x, y, text, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            color: '#ffffff'
        }).setOrigin(0.5);

        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(0x555555);
        });

        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(0x444444);
        });

        buttonBg.on('pointerdown', () => {
            buttonBg.setFillStyle(0x333333);
        });

        buttonBg.on('pointerup', () => {
            buttonBg.setFillStyle(0x444444);
            callback();
        });

        const container = this.add.container(0, 0, [buttonBg, buttonText]);
        return container;
    }

    async startGame() {
        try {
            // 调用 /start 获取场景
            const response = await fetch('/api/dungeon/interrogate/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            this.sessionId = data.session_id;
            this.scenario = data.scenario;
            this.maxQuestions = data.max_questions || 6;

            // 显示场景
            this.scenarioText.setText(`场景：${this.scenario}`);
            
            // 建立 WebSocket 连接
            this.connectWebSocket();

        } catch (error) {
            console.error('Failed to start game:', error);
            this.scenarioText.setText('获取场景失败，请重试');
        }
    }

    connectWebSocket() {
        const wsUrl = `ws://${window.location.host}/ws/dungeon/interrogate/${this.sessionId}`;
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
            this.statusText.setText('连接出错，请重试');
        };

        this.websocket.onclose = () => {
            console.log('WebSocket closed');
        };
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'game_info':
                this.scenario = data.scenario;
                this.maxQuestions = data.max_questions;
                this.scenarioText.setText(`场景：${this.scenario}`);
                break;

            case 'opponent_story':
                this.gamePhase = 'story_writing';
                if (data.content) {
                    this.statusText.setText('嫌疑人B正在编故事...');
                }
                if (data.done) {
                    const story = data.full_content || '';
                    this.addMessage('opponent', '嫌疑人B的故事：' + story);
                    
                    // 轮到玩家写故事
                    this.statusText.setText('轮到你了！请编写你的不在场证明');
                    this.statusText.setColor('#4ecdc4');
                    
                    const textarea = this.playerInput.getChildByName('textarea') || this.playerInput.node;
                    if (textarea) {
                        textarea.disabled = false;
                        textarea.placeholder = '编写你的故事（包含时间、地点、做了什么）...';
                        textarea.style.backgroundColor = '#1a2332';
                        textarea.value = '';
                    }
                    
                    this.submitButton.setVisible(true);
                    this.gamePhase = 'story_writing';
                }
                break;

            case 'detective_question':
                this.gamePhase = 'interrogating';
                if (data.content) {
                    this.statusText.setText(`侦探正在提问 (${data.question_num}/${this.maxQuestions})...`);
                }
                if (data.done) {
                    const question = data.full_content || '';
                    this.currentQuestion = data.question_num;
                    this.addMessage('detective', `侦探：${question}`);
                    
                    // 判断问谁
                    if (data.target === 'player') {
                        this.statusText.setText(`第 ${data.question_num} 个问题，请回答`);
                        this.statusText.setColor('#4ecdc4');
                        
                        const textarea = this.playerInput.getChildByName('textarea') || this.playerInput.node;
                        if (textarea) {
                            textarea.disabled = false;
                            textarea.placeholder = '回答侦探的问题...';
                            textarea.style.backgroundColor = '#1a2332';
                            textarea.value = '';
                        }
                        
                        this.submitButton.setVisible(true);
                    } else {
                        this.statusText.setText('等待嫌疑人B回答...');
                        this.submitButton.setVisible(false);
                    }
                }
                break;

            case 'detective_analysis':
                if (data.content) {
                    // 实时更新分析
                }
                if (data.done) {
                    const analysis = data.full_content || '';
                    this.addMessage('detective', analysis);
                    
                    // 显示漏洞特效
                    if (analysis.includes('漏洞')) {
                        this.showHoleEffect(data.speaker);
                    }
                }
                break;

            case 'hole_count':
                this.playerHoles = data.player_holes;
                this.opponentHoles = data.opponent_holes;
                this.currentQuestion = data.current_question;
                this.updateHoleDisplay();
                break;

            case 'final_verdict':
                if (data.content) {
                    this.statusText.setText('侦探正在做出最终判决...');
                }
                if (data.done) {
                    const verdict = data.full_content || '';
                    this.addMessage('detective', verdict);
                }
                break;

            case 'result':
                this.gameResult = data.result;
                this.playerHoles = data.player_holes;
                this.opponentHoles = data.opponent_holes;
                this.updateHoleDisplay();
                
                this.statusText.setText(data.message);
                this.statusText.setColor(data.result === 'win' ? '#4ecdc4' : '#ff6b6b');
                
                // 隐藏输入区，显示返回按钮
                this.inputContainer.setVisible(false);
                this.submitButton.setVisible(false);
                this.backButton.setVisible(true);
                
                this.gamePhase = 'finished';
                break;

            case 'error':
                console.error('Server error:', data.content);
                this.statusText.setText('出错了：' + data.content);
                this.statusText.setColor('#ff6b6b');
                break;
        }
    }

    addMessage(speaker, content) {
        let prefix = '';
        
        switch (speaker) {
            case 'detective':
                prefix = '【侦探】';
                break;
            case 'player':
                prefix = '【你】';
                break;
            case 'opponent':
                prefix = '【嫌疑人B】';
                break;
        }
        
        this.messages.push({ speaker, content: prefix + content });
        this.updateDialogueDisplay();
    }

    updateDialogueDisplay() {
        // 只显示最近的消息
        const recentMessages = this.messages.slice(-8);
        let displayText = '';
        
        recentMessages.forEach((msg) => {
            let color = '#bbbbbb';
            if (msg.speaker === 'detective') color = '#ffaa44';
            else if (msg.speaker === 'player') color = '#4ecdc4';
            else if (msg.speaker === 'opponent') color = '#ff9999';
            
            // 截断过长的消息
            let shortContent = msg.content;
            if (shortContent.length > 100) {
                shortContent = shortContent.substring(0, 100) + '...';
            }
            
            displayText += shortContent + '\n\n';
        });
        
        this.dialogueText.setText(displayText);
    }

    updateHoleDisplay() {
        this.holeText.setText(`漏洞统计：玩家 ${this.playerHoles} 个 vs 对手 ${this.opponentHoles} 个`);
    }

    showHoleEffect(who) {
        const { width, height } = this.scale;
        
        const text = who === 'player' ? '发现漏洞！' : '对手有漏洞！';
        const color = who === 'player' ? '#ff4444' : '#44ff44';
        
        const holeText = this.add.text(width / 2, height / 2, text, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '28px',
            color: color,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: holeText,
            scale: { from: 0.5, to: 1.3 },
            alpha: { from: 1, to: 0 },
            duration: 1200,
            onComplete: () => {
                holeText.destroy();
            }
        });
    }

    submitInput() {
        const textarea = this.playerInput.getChildByName('textarea') || this.playerInput.node;
        if (!textarea) return;

        const content = textarea.value.trim();
        if (!content) {
            this.statusText.setText('请输入内容后再提交');
            return;
        }

        // 禁用输入框和提交按钮
        textarea.disabled = true;
        this.submitButton.setVisible(false);

        // 根据当前阶段发送不同类型的消息
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            if (this.gamePhase === 'story_writing') {
                this.addMessage('player', '你的故事：' + content);
                this.websocket.send(JSON.stringify({
                    type: 'player_story',
                    content: content
                }));
                this.statusText.setText('故事已提交，等待审讯开始...');
            } else if (this.gamePhase === 'interrogating') {
                this.addMessage('player', '你回答：' + content);
                this.websocket.send(JSON.stringify({
                    type: 'player_answer',
                    content: content
                }));
                this.statusText.setText('等待侦探分析...');
            }
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
