class MathGameEngine {
    constructor() {
        this.currentUnitData = null;
        this.currentLevel = 1;
        this.currentQuestion = null;
        this.score = 0;
    }

    // 단원 JSON 데이터 불러오기
    async loadUnit(unitFileName) {
        try {
            const response = await fetch(`./db/${unitFileName}`);
            if (!response.ok) throw new Error("네트워크 응답 오류");
            this.currentUnitData = await response.json();
            return true;
        } catch (error) {
            console.error("데이터 로드 실패:", error);
            return false;
        }
    }

    // 특정 레벨의 랜덤 문제 가져오기
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

    // 정답 제출 및 채점
    submitAnswer(userAnswer) {
        if (!this.currentQuestion) return false;

        const isCorrect = userAnswer === this.currentQuestion.answer;
        if (isCorrect) {
            this.score += 10;
        }
        return {
            isCorrect,
            correctAnswer: this.currentQuestion.answer,
            explanation: this.currentQuestion.explanation
        };
    }
}

const game = new MathGameEngine();

// UI 컨트롤러 함수
async function selectUnitAndLevel() {
    const unitSelect = document.getElementById('unit-select');
    const levelSelect = document.getElementById('level-select');
    
    const selectedUnitFile = unitSelect.value;
    const selectedLevel = parseInt(levelSelect.value);

    const loaded = await game.loadUnit(selectedUnitFile);
    if (loaded) {
        renderQuestion(selectedLevel);
    } else {
        alert("단원 데이터를 불러오는데 실패했습니다.");
    }
}

function renderQuestion(level) {
    const qData = game.getQuestion(level);
    const container = document.getElementById('game-container');

    if (!qData) {
        container.innerHTML = "<p>해당 레벨의 문제가 존재하지 않습니다.</p>";
        return;
    }

    let optionsHtml = qData.options.map(opt => 
        `<button class="option-btn" onclick="checkAnswer('${opt}')">${opt}</button>`
    ).join(' ');

    container.innerHTML = `
        <div class="question-card">
            <h3>[레벨 ${level}] ${qData.type_name}</h3>
            <p class="question-text">${qData.question}</p>
            <div class="options-group">${optionsHtml}</div>
            <div id="result-message"></div>
        </div>
    `;
}

function checkAnswer(selectedOption) {
    const result = game.submitAnswer(selectedOption);
    const resultDiv = document.getElementById('result-message');

    if (result.isCorrect) {
        resultDiv.innerHTML = `<p style="color: green; font-weight: bold;">정답입니다! 🎉</p>`;
    } else {
        resultDiv.innerHTML = `
            <p style="color: red; font-weight: bold;">오답입니다. ❌</p>
            <p>정답: ${result.correctAnswer}</p>
            <p>해설: ${result.explanation}</p>
        `;
    }
}
