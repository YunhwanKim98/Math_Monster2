class MathGameEngine {
    constructor() {
        this.currentUnitData = null;
        this.currentLevel = 1;
        this.currentQuestion = null;
        this.score = 0;
        this.hp = 3;
    }

    async loadUnit(unitFileName) {
        try {
            const response = await fetch(`./db/${unitFileName}`);
            if (!response.ok) {
                throw new Error(`파일을 찾을 수 없습니다: ./db/${unitFileName}`);
            }
            this.currentUnitData = await response.json();
            return true;
        } catch (error) {
            console.error("데이터 로드 실패:", error);
            alert(`데이터 로드 실패!\nLive Server로 실행 중인지, ./db/${unitFileName} 파일이 존재하는지 확인해주세요.`);
            return false;
        }
    }

    getQuestion(level) {
        this.currentLevel = level;
        const levelKey = `level_${level}`;
        
        if (!this.currentUnitData || !this.currentUnitData.levels[levelKey]) {
            return null;
        }

        const types = this.currentUnitData.levels[levelKey].types;
        const randomIndex = Math.floor(Math.random() * types.length);
        this.currentQuestion = types[randomIndex];
        return this.currentQuestion;
    }

    submitAnswer(userAnswer) {
        if (!this.currentQuestion) return false;

        const isCorrect = userAnswer === this.currentQuestion.answer;
        if (isCorrect) {
            this.score += 10;
        } else {
            this.hp = Math.max(0, this.hp - 1);
        }
        return {
            isCorrect,
            correctAnswer: this.currentQuestion.answer,
            explanation: this.currentQuestion.explanation
        };
    }
}

const game = new MathGameEngine();

async function selectUnitAndLevel() {
    const unitSelect = document.getElementById('unit-select');
    const levelSelect = document.getElementById('level-select');
    
    const selectedUnitFile = unitSelect.value;
    const selectedLevel = parseInt(levelSelect.value);

    const loaded = await game.loadUnit(selectedUnitFile);
    if (loaded) {
        updateStatusDisplay();
        renderQuestion(selectedLevel);
    }
}

function updateStatusDisplay() {
    document.getElementById('current-score').innerText = game.score;
    document.getElementById('hp-display').innerText = '❤️'.repeat(game.hp) || '💀';
}

function renderQuestion(level) {
    const qData = game.getQuestion(level);
    const container = document.getElementById('game-container');

    if (!qData) {
        container.innerHTML = "<p class='start-message'>해당 레벨의 문제가 준비되지 않았습니다.</p>";
        return;
    }

    let optionsHtml = qData.options.map(opt => 
        `<button class="option-btn" onclick="checkAnswer('${opt}')">${opt}</button>`
    ).join('');

    container.innerHTML = `
        <div class="question-card">
            <span class="question-badge">LEVEL ${level} - ${qData.type_name}</span>
            <div class="question-text">${qData.question}</div>
            <div class="options-grid">${optionsHtml}</div>
            <div id="result-message"></div>
        </div>
    `;
}

function checkAnswer(selectedOption) {
    const result = game.submitAnswer(selectedOption);
    const resultDiv = document.getElementById('result-message');
    updateStatusDisplay();

    if (result.isCorrect) {
        resultDiv.innerHTML = `
            <div class="result-box" style="border-left: 4px solid #00ff88;">
                <p style="color: #00ff88; font-weight: bold; margin: 0;">정답입니다! 🎉 (+10점)</p>
            </div>`;
    } else {
        resultDiv.innerHTML = `
            <div class="result-box" style="border-left: 4px solid #ff4757;">
                <p style="color: #ff4757; font-weight: bold; margin: 0 0 5px 0;">오답입니다! ❌</p>
                <p style="margin: 0 0 5px 0; font-size: 0.9rem;">정답: <strong>${result.correctAnswer}</strong></p>
                <p style="margin: 0; font-size: 0.85rem; color: var(--text-sub);">${result.explanation}</p>
            </div>`;
    }
}
