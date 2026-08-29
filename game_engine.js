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
            const response = await gapi.client.request({ path: `./db/${filename}` }) || await fetch(`./db/${filename}`);
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
        const levelKey = `level_${this.currentLevel}`;
        const levelData = this.currentUnitData.levels[levelKey];

        if (!levelData || !levelData.types || levelData.types.length === 0) {
            this.showFeedback("해당 레벨의 문제를 찾을 수 없습니다.", "incorrect");
            return;
        }

        // 무작위 문제 유형 선택
        const types = levelData.types;
        const randomIndex = Math.floor(Math.random() * types.length);
        this.currentQuestion = types[randomIndex];

        this.renderQuestion();
        this.updateUI();
    }

    renderQuestion() {
        const questionEl = document.getElementById('question-text') || document.querySelector('.question-text');
        const optionsEl = document.getElementById('options-container') || document.querySelector('.options-container');

        if (questionEl) {
            questionEl.innerText = this.currentQuestion.question;
        }

        if (optionsEl) {
            optionsEl.innerHTML = '';
            // 보기 섞기
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
            
            if (this.consecutiveCorrects >= 2) {
                this.comboCount = this.consecutiveCorrects;
                const maxLevel = Object.keys(this.currentUnitData.levels).length;
                
                if (this.consecutiveCorrects % 2 === 0 && this.currentLevel < maxLevel) {
                    this.currentLevel++;
                }
            }

            this.monsterHp = Math.max(0, this.monsterHp - 1);
            this.showFeedback(`정답입니다! 몬스터 체력 -1 (${this.consecutiveCorrects}연속 정답)`, "correct");

            if (this.monsterHp <= 0) {
                this.showFeedback("🎉 몬스터를 토벌했습니다! 퀘스트 성공!", "correct");
                document.getElementById('options-container').innerHTML = '';
                this.updateUI();
                return;
            }

        } else {
            this.consecutiveCorrects = 0;
            this.comboCount = 0;
            this.playerHp = Math.max(0, this.playerHp - 5);
            
            // 💡 오답 시 정답과 해설이 확실히 출력되도록 조합
            const currentQ = this.currentQuestion;
            const correctAns = currentQ ? currentQ.answer : "알 수 없음";
            const explanationText = (currentQ && currentQ.explanation) 
                ? currentQ.explanation 
                : "해설 정보가 제공되지 않은 문제입니다.";

            const feedbackString = `❌ 오답! [정답: ${correctAns}] 해설: ${explanationText}`;
            this.showFeedback(feedbackString, "incorrect");

            if (this.playerHp <= 0) {
                this.showFeedback("💀 체력이 0이 되었습니다. 퀘스트 실패!", "incorrect");
                document.getElementById('options-container').innerHTML = '';
                this.updateUI();
                return;
            }
        }

        this.updateUI();
        this.nextTurn();
    }

    showFeedback(message, type) {
        let feedbackEl = document.getElementById('feedback') || document.querySelector('.feedback-message');
        
        if (!feedbackEl) {
            // 피드백 영역이 HTML에 없다면 동적으로 생성하여 추가
            feedbackEl = document.createElement('div');
            feedbackEl.id = 'feedback';
            document.body.appendChild(feedbackEl);
        }

        feedbackEl.innerText = message;
        feedbackEl.className = `feedback ${type}`;
        feedbackEl.style.display = 'block';
    }

    updateUI() {
        // UI 업데이트 로직 (체력바, 콤보 표시 등)
    }
}
