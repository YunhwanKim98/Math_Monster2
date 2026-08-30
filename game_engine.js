class GameEngine {
    constructor() {
        this.currentUnitData = null;
        this.currentLevel = 1;
        this.currentQuestion = null;
        this.playerHp = 100;
        this.monsterHp = 100;
        this.consecutiveCorrects = 0;
        this.comboCount = 0;
    }

    async loadUnit(filename) {
        try {
            const response = await fetch(`./db/\${filename}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: \${response.status}`);
            }

            this.currentUnitData = await response.json();
            this.resetGame();
        } catch (error) {
            console.error("단원 데이터를 불러오는 데 실패했습니다:", error);
            this.showFeedback("단원 데이터를 불러오지 못했습니다.", "incorrect");
        }
    }

    resetGame() {
        this.currentLevel = 1;
        this.playerHp = 100;
        this.monsterHp = 100;
        this.consecutiveCorrects = 0;
        this.comboCount = 0;
        this.updateUI("퀘스트 시작!");
        this.nextTurn();
    }

    nextTurn() {
        const feedbackEl = document.getElementById('feedback');
        if (feedbackEl) {
            feedbackEl.style.display = 'none';
        }

        if (!this.currentUnitData || !this.currentUnitData.levels) {
            this.showFeedback("단원 데이터 구조가 올바르지 않습니다.", "incorrect");
            return;
        }

        const levelKey = `level_\${this.currentLevel}`;
        const levelData = this.currentUnitData.levels[levelKey];

        if (!levelData || !levelData.types || levelData.types.length === 0) {
            this.showFeedback("해당 레벨의 문제를 찾을 수 없습니다.", "incorrect");
            return;
        }

        const types = levelData.types;
        const randomIndex = Math.floor(Math.random() * types.length);
        this.currentQuestion = types[randomIndex];

        this.renderQuestion();
        this.updateUI("문제를 풀어 보세요!");
    }

    renderQuestion() {
        const questionEl = document.getElementById('question-text');
        const optionsEl = document.getElementById('options-container');

        if (questionEl) {
            questionEl.innerText = this.currentQuestion?.question || "문제가 없습니다.";
        }

        if (optionsEl) {
            optionsEl.innerHTML = '';

            const shuffledOptions = [...(this.currentQuestion?.options || [])]
                .sort(() => Math.random() - 0.5);

            shuffledOptions.forEach(option => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.innerText = option;
                btn.onclick = () => this.handleAnswer(option);
                optionsEl.appendChild(btn);
            });
        }
    }

    handleAnswer(selectedOption) {
        if (!this.currentQuestion) return;

        const isCorrect = selectedOption === this.currentQuestion.answer;
        const optionsEl = document.getElementById('options-container');

        if (optionsEl) {
            const buttons = optionsEl.querySelectorAll('button');
            buttons.forEach(btn => btn.disabled = true);
        }

        if (isCorrect) {
            this.consecutiveCorrects++;
            this.comboCount = this.consecutiveCorrects;
            this.monsterHp = Math.max(0, this.monsterHp - 1);

            this.showFeedback(`✅ 정답입니다!<br>몬스터 체력 -1`, "correct");
            this.updateUI("공격 성공!");

            if (this.monsterHp <= 0) {
                this.showFeedback("🎉 몬스터를 토벌했습니다! 퀘스트 성공!", "correct");
                if (optionsEl) optionsEl.innerHTML = '';
                return;
            }

            setTimeout(() => {
                this.nextTurn();
            }, 1500);

        } else {
            this.consecutiveCorrects = 0;
            this.comboCount = 0;
            this.playerHp = Math.max(0, this.playerHp - 5);

            const correctAns = this.currentQuestion.answer || "";
            const explanationText =
                this.currentQuestion.explanation &&
                String(this.currentQuestion.explanation).trim()
                    ? this.currentQuestion.explanation
                    : "해설 정보가 없습니다.";

            const feedbackString = `
                ❌ 오답입니다!<br>
                <strong>정답:</strong> \${correctAns}<br>
                <strong>해설:</strong> \${explanationText}
            `;

            this.showFeedback(feedbackString, "incorrect");
            this.updateUI("오답! 해설을 확인하세요.");

            if (this.playerHp <= 0) {
                this.showFeedback("💀 체력이 0이 되었습니다. 퀘스트 실패!", "incorrect");
                if (optionsEl) optionsEl.innerHTML = '';
                return;
            }

            setTimeout(() => {
                this.nextTurn();
            }, 3000);
        }

        this.updateUI();
    }

    showFeedback(message, type) {
        let feedbackEl = document.getElementById('feedback');

        if (!feedbackEl) {
            feedbackEl = document.createElement('div');
            feedbackEl.id = 'feedback';
            document.body.appendChild(feedbackEl);
        }

        feedbackEl.innerHTML = message;
        feedbackEl.className = `feedback \${type}`;
        feedbackEl.style.display = 'block';

        feedbackEl.style.position = 'fixed';
        feedbackEl.style.left = '50%';
        feedbackEl.style.bottom = '30px';
        feedbackEl.style.transform = 'translateX(-50%)';
        feedbackEl.style.zIndex = '9999';
        feedbackEl.style.maxWidth = '640px';
        feedbackEl.style.width = 'calc(100% - 40px)';
        feedbackEl.style.padding = '16px 20px';
        feedbackEl.style.borderRadius = '12px';
        feedbackEl.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
        feedbackEl.style.fontSize = '16px';
        feedbackEl.style.lineHeight = '1.6';
        feedbackEl.style.textAlign = 'left';
        feedbackEl.style.background = type === 'correct' ? '#e8fff0' : '#fff4f4';
        feedbackEl.style.color = '#222';
        feedbackEl.style.border = type === 'correct'
            ? '2px solid #22aa55'
            : '2px solid #dd4444';
    }

    updateUI(statusText = "대기 중...") {
        const comboEl = document.getElementById('combo-count');
        const statusEl = document.getElementById('status-text');
        const playerHpEl = document.getElementById('player-hp');
        const monsterHpEl = document.getElementById('monster-hp');

        if (comboEl) comboEl.innerText = this.comboCount;
        if (statusEl) statusEl.innerText = statusText;
        if (playerHpEl) playerHpEl.innerText = this.playerHp;
        if (monsterHpEl) monsterHpEl.innerText = this.monsterHp;
    }
}
