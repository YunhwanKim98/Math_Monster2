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
            const response = await fetch(`./db/${filename}`);
            this.currentUnitData = await response.json();
            this.resetGame();
        } catch (error) {
            console.error("단원 데이터를 불러오는 데 실패했습니다:", error);
        }
    }

    resetGame() {
        this.currentLevel = 1;
        this.playerHp = 100;
        this.monsterHp = 100;
        this.consecutiveCorrects = 0;
        this.comboCount = 0;
        this.nextTurn();
    }

    nextTurn() {
        // 다음 문제로 넘어갈 때 이전 피드백 숨기기
        const feedbackEl = document.getElementById('feedback');
        if (feedbackEl) {
            feedbackEl.style.display = 'none';
        }

        const levelKey = `level_${this.currentLevel}`;
        const levelData = this.currentUnitData.levels[levelKey];

        if (!levelData || !levelData.types || levelData.types.length === 0) {
            this.showFeedback("해당 레벨의 문제를 찾을 수 없습니다.", "incorrect");
            return;
        }

        const types = levelData.types;
        const randomIndex = Math.floor(Math.random() * types.length);
        this.currentQuestion = types[randomIndex];

        this.renderQuestion();
        this.updateUI();
    }

    renderQuestion() {
        const questionEl = document.getElementById('question-text');
        const optionsEl = document.getElementById('options-container');

        if (questionEl) {
            questionEl.innerText = this.currentQuestion.question;
        }

        if (optionsEl) {
            optionsEl.innerHTML = '';
            const shuffledOptions = [...this.currentQuestion.options].sort(() => Math.random() - 0.5);
            
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
        const isCorrect = selectedOption === this.currentQuestion.answer;

        if (isCorrect) {
            this.consecutiveCorrects++;
            this.monsterHp = Math.max(0, this.monsterHp - 1);
            
            this.showFeedback(`정답입니다! 몬스터 체력 -1`, "correct");

            if (this.monsterHp <= 0) {
                this.showFeedback("🎉 몬스터를 토벌했습니다! 퀘스트 성공!", "correct");
                document.getElementById('options-container').innerHTML = '';
                return;
            }

            // 정답인 경우 잠시 후 다음 문제로 자동 진행
            setTimeout(() => {
                this.nextTurn();
            }, 1500);

        } else {
            this.consecutiveCorrects = 0;
            this.comboCount = 0;
            this.playerHp = Math.max(0, this.playerHp - 5);
            
            // 💡 오답 시 정답과 JSON의 해설을 조합하여 화면에 출력
            const correctAns = this.currentQuestion.answer;
            const explanationText = this.currentQuestion.explanation || "해설 정보가 없습니다.";

            const feedbackString = `❌ 오답입니다!<br><strong>정답:</strong> ${correctAns}<br><strong>해설:</strong> ${explanationText}`;
            this.showFeedback(feedbackString, "incorrect");

            if (this.playerHp <= 0) {
                this.showFeedback("💀 체력이 0이 되었습니다. 퀘스트 실패!", "incorrect");
                document.getElementById('options-container').innerHTML = '';
                return;
            }

            // 오답인 경우 플레이어가 해설을 읽을 수 있도록 버튼을 잠시 비활성화하거나 대기 후 진행 가능하게 처리
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
        feedbackEl.className = `feedback ${type}`;
        feedbackEl.style.display = 'block';
    }

    updateUI() {
        // UI 업데이트 로직
    }
}
