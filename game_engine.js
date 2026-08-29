class GameEngine {
    constructor() {
        this.currentUnitData = null;
        this.currentLevel = 1;
        this.comboCount = 0;
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
    }

    bindEvents() {
        // [퀘스트 수주] 버튼 클릭 이벤트 연결
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
            this.playerHp = 100;
            this.monsterHp = 100;
            this.updateUI();
            this.nextTurn();
        }
    }

    async loadUnitData(fileName) {
        try {
            // db 폴더 내부 파일 경로 지정
            const response = await fetch(`./db/${fileName}`);
            if (!response.ok) throw new Error("JSON 로드 실패");
            
            this.currentUnitData = await response.json();
            return true;
        } catch (error) {
            console.error("데이터를 가져오는 중 오류 발생:", error);
            alert("퀘스트 데이터를 불러오지 못했습니다. Live Server 등 로컬 서버 환경에서 실행 중인지 확인해주세요.");
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
            this.comboCount++;
            this.monsterHp = Math.max(0, this.monsterHp - 25);
            alert("정답입니다! 몬스터에게 데미지를 입혔습니다.");

            if (this.monsterHp <= 0) {
                alert("몬스터를 토벌했습니다! 퀘스트 성공!");
                return;
            }

            // 정답 시 다음 레벨로 진행 (또는 다음 문제)
            if (this.currentLevel < 10) this.currentLevel++;
        } else {
            this.comboCount = 0;
            this.playerHp = Math.max(0, this.playerHp - 20);
            alert(`오답입니다! 정답: ${this.currentQuestion.answer}\n해설: ${this.currentQuestion.explanation}`);

            if (this.playerHp <= 0) {
                alert("플레이어 체력이 0이 되었습니다. 퀘스트 실패!");
                return;
            }
        }

        this.updateUI();
        this.nextTurn();
    }

    updateUI() {
        if (this.comboDisplay) this.comboDisplay.textContent = this.comboCount;
        if (this.monsterHpBar) this.monsterHpBar.style.width = `${this.monsterHp}%`;
        if (this.playerHpBar) this.playerHpBar.style.width = `${this.playerHp}%`;
        if (this.monsterName && this.currentUnitData) {
            this.monsterName.textContent = `${this.currentUnitData.unit_name} 몬스터 (LV.${this.currentLevel})`;
        }
    }
}

// DOM 로드 후 게임 엔진 인스턴스 생성
document.addEventListener('DOMContentLoaded', () => {
    window.gameEngine = new GameEngine();
});
