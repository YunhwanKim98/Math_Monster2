class GameEngine {
    constructor() {
        this.currentUnitData = null;
        this.currentLevel = 1;
        this.comboCount = 0;
        this.consecutiveCorrects = 0; // 연속 정답 횟수 추적
        this.playerHp = 100;
        this.monsterHp = 100;
        this.currentQuestion = null;
        this.lastQuestionId = null;

        this.initDOM();
        this.bindEvents();
    }

    initDOM() {
        this.unitSelect = document.getElementById('unit-select');
        this.startBtn = document.getElementById('start-btn');
        this.comboDisplay = document.getElementById('combo-count');
        this.monsterName = document.getElementById('monster-name');
        this.monsterHpBar = document.getElementById('monster-hp');
        this.playerHpBar = document.getElementById('player-hp');
        this.questionText = document.getElementById('question-text');
        this.optionsContainer = document.getElementById('options-container');
        this.feedbackMsg = document.getElementById('feedback-message');
    }

    bindEvents() {
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => this.startQuest());
        }
    }

    async startQuest() {
        const selectedFile = this.unitSelect.value;
        const success = await this.loadUnitData(selectedFile);
        
        if (success) {
            this.currentLevel = 1;
            this.comboCount = 0;
            this.consecutiveCorrects = 0;
            this.playerHp = 100;
            this.monsterHp = 100; // 몬스터 최대 체력 100
            this.showFeedback("", "");
            this.updateUI();
            this.nextTurn();
        }
    }

    async loadUnitData(fileName) {
        try {
            const response = await fetch(`./db/${fileName}`);
            if (!response.ok) throw new Error("JSON 로드 실패");
            
            this.currentUnitData = await response.json();
            return true;
        } catch (error) {
            console.error("데이터 로드 오류:", error);
            this.showFeedback("퀘스트 데이터를 불러오지 못했습니다.", "incorrect");
            return false;
        }
    }

    nextTurn() {
        const question = this.getQuestion();
        if (!question) {
            this.questionText.textContent = "해당 레벨의 문제를 찾을 수 없습니다.";
            return;
        }

        this.renderQuestion(question);
    }

    getQuestion() {
        if (!this.currentUnitData) return null;
        const levelKey = `level_${this.currentLevel}`;
        const types = this.currentUnitData.levels[levelKey]?.types;

        if (!types || types.length === 0) return null;

        let availableTypes = types.filter(t => t.type_id !== this.lastQuestionId);
        if (availableTypes.length === 0) availableTypes = types;

        const selected = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        this.lastQuestionId = selected.type_id;
        this.currentQuestion = selected;
        return selected;
    }

    renderQuestion(q) {
        this.questionText.textContent = `[LV.${this.currentLevel}] ${q.question}`;
        this.optionsContainer.innerHTML = '';

        q.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = opt;
            btn.addEventListener('click', () => this.handleAnswer(opt));
            this.optionsContainer.appendChild(btn);
        });
    }

    handleAnswer(selectedOption) {
        const isCorrect = selectedOption === this.currentQuestion.answer;

        if (isCorrect) {
            this.consecutiveCorrects++; // 연속 정답 증가
            
            // 2연속 정답 이상일 때 콤보 활성화 및 짝수 배수마다 레벨업
            if (this.consecutiveCorrects >= 2) {
                this.comboCount = this.consecutiveCorrects;
                
                if (this.consecutiveCorrects % 2 === 0 && this.currentLevel < 10) {
                    this.currentLevel++;
                }
            }

            // 문제당 1 데미지 (100번 맞춰야 토벌)
            this.monsterHp = Math.max(0, this.monsterHp - 1);
            
            this.showFeedback(`정답입니다! 몬스터 체력 -1 (${this.consecutiveCorrects}연속 정답)`, "correct");

            if (this.monsterHp <= 0) {
                this.showFeedback("🎉 몬스터를 토벌했습니다! 퀘스트 성공!", "correct");
                this.optionsContainer.innerHTML = '';
                this.updateUI();
                return;
            }

        } else {
            // 오답 시 콤보 및 연속 정답 초기화
            this.consecutiveCorrects = 0;
            this.comboCount = 0;
            
            // 장기전을 위해 플레이어 피격 데미지 5로 완화
            this.playerHp = Math.max(0, this.playerHp - 5);
            
            this.showFeedback(`오답입니다! 정답: ${this.currentQuestion.answer}`, "incorrect");

            if (this.playerHp <= 0) {
                this.showFeedback("💀 체력이 0이 되었습니다. 퀘스트 실패!", "incorrect");
                this.optionsContainer.innerHTML = '';
                this.updateUI();
                return;
            }
        }

        this.updateUI();
        this.nextTurn();
    }

    showFeedback(text, type) {
        if (!this.feedbackMsg) return;
        this.feedbackMsg.textContent = text;
        this.feedbackMsg.className = `feedback-box ${type}`;
    }

    updateUI() {
        if (this.comboDisplay) this.comboDisplay.textContent = this.comboCount;
        if (this.monsterHpBar) this.monsterHpBar.style.width = `${this.monsterHp}%`;
        if (this.playerHpBar) this.playerHpBar.style.width = `${this.playerHp}%`;
        if (this.monsterName && this.currentUnitData) {
            this.monsterName.textContent = `${this.currentUnitData.unit_name} (LV.${this.currentLevel})`;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.gameEngine = new GameEngine();
});
