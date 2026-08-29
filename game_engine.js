let playerMaxHP = 100, playerHP = 100;
let monsterMaxHP = 300, monsterHP = 300;
let monsterLevel = 1;

let comboCount = 0;
let currentQuestion = null;
let currentUnitKey = "middle1_1"; // 기본 선택 단원

// JSON 문제 데이터베이스 수신 객체
let QUESTION_DATABASE = {};

// 몬스터 도감
const MONSTER_ROSTER = [
    { name: "MEWTWO", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png" },
    { name: "CHARIZARD", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png" },
    { name: "GENGAR", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png" },
    { name: "RAYQUAZA", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/384.png" },
    { name: "LUGIA", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/249.png" },
    { name: "LUCARIO", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png" }
];

// -------------------------------------------------------------
// [JSON 문제 파일 비동기 로드]
// -------------------------------------------------------------
async function loadQuestionDatabase() {
    try {
        const response = await fetch('math_questions.json');
        if (!response.ok) throw new Error("JSON 로드 실패");
        QUESTION_DATABASE = await response.json();
        console.log("문제 데이터베이스 로드 완료:", QUESTION_DATABASE);
        
        // 데이터 로드 완료 후 첫 문제 출제
        nextQuestion();
    } catch (error) {
        console.error("문제 파일(math_questions.json)을 로드하는 중 오류가 발생했습니다:", error);
    }
}

function updateMonsterAppearance() {
    const monsterData = MONSTER_ROSTER[(monsterLevel - 1) % MONSTER_ROSTER.length];
    const imgElem = document.getElementById("monster-img");
    const nameElem = document.getElementById("monster-name");
    if (imgElem) imgElem.src = monsterData.img;
    if (nameElem) nameElem.innerText = `${monsterData.name} (LV.${monsterLevel})`;
}

function triggerMonsterAnim(animClass) {
    const img = document.getElementById("monster-img");
    if (!img) return;
    img.classList.remove("monster-hit", "monster-attack");
    void img.offsetWidth;
    img.classList.add(animClass);
    setTimeout(() => img.classList.remove(animClass), 400);
}

// -------------------------------------------------------------
// [JSON 기반 1~10단계 문제 출제 엔진]
// -------------------------------------------------------------
function nextQuestion() {
    if (!QUESTION_DATABASE[currentUnitKey]) return;

    const unitData = QUESTION_DATABASE[currentUnitKey];
    const pool = unitData.questions;

    // 몬스터 레벨 및 콤보 기반 목표 난이도 계산 (LV.1 ~ LV.10)
    let targetLevel = Math.min(10, Math.max(1, Math.floor((monsterLevel - 1) / 2) + 1 + Math.floor(comboCount / 2)));

    // 난이도 태그 표시 업데이트
    const diffTagElem = document.getElementById("difficulty-tag");
    if (diffTagElem) {
        diffTagElem.innerText = `LV.${targetLevel}`;
        let hue = Math.max(0, 180 - (targetLevel - 1) * 18);
        diffTagElem.style.color = `hsl(${hue}, 100%, 50%)`;
    }

    // Target Level에 맞는 문제 추출
    let levelPool = pool.filter(q => q.level === targetLevel);
    if (levelPool.length === 0) {
        let sorted = [...pool].sort((a, b) => Math.abs(a.level - targetLevel) - Math.abs(b.level - targetLevel));
        levelPool = [sorted[0]];
    }

    // 무작위 패턴 채택
    const rawPattern = levelPool[Math.floor(Math.random() * levelPool.length)];
    let evalScope = {};

    // 1. 파라미터 랜덤 바인딩
    if (rawPattern.param_rules) {
        for (const [varName, list] of Object.entries(rawPattern.param_rules)) {
            evalScope[varName] = list[Math.floor(Math.random() * list.length)];
        }
    }

    // 2. 동적 연산 실행 (JSON 내부 dynamic_func 해석)
    if (rawPattern.dynamic_func) {
        try {
            const dynamicFn = new Function('p', rawPattern.dynamic_func);
            dynamicFn(evalScope);
        } catch (e) {
            console.error("Dynamic calculation error:", e);
        }
    }

    // 3. 템플릿 치환
    const bindTemplate = (str) => {
        if (!str) return "";
        let res = String(str);
        for (const [varName, val] of Object.entries(evalScope)) {
            res = res.replace(new RegExp(`{${varName}}`, 'g'), val);
        }
        return res;
    };

    let formattedText = bindTemplate(rawPattern.template);

    // 4. 정답 계산
    let calcScript = rawPattern.eval_script;
    for (const [varName, val] of Object.entries(evalScope)) {
        calcScript = calcScript.replace(new RegExp(`\\b${varName}\\b`, 'g'), typeof val === 'string' ? `'${val}'` : val);
    }
    
    let correctAnswer;
    try {
        correctAnswer = Function(`"use strict"; return (${calcScript});`)();
    } catch(e) {
        correctAnswer = evalScope[calcScript] || 0;
    }

    // 5. 해설 및 보기 완성
    let expText = bindTemplate(rawPattern.explanation).replace(/{ans}/g, correctAnswer);
    let renderedOptions = rawPattern.options ? rawPattern.options.map(opt => bindTemplate(opt)) : [];

    currentQuestion = {
        level: rawPattern.level,
        type: rawPattern.type,
        unit: unitData.unit_name,
        text: formattedText,
        answer: correctAnswer,
        options: renderedOptions,
        explanation: expText
    };

    // UI 동기화
    const unitElem = document.getElementById("current-unit");
    const qTextElem = document.getElementById("question-text");
    if (unitElem) unitElem.innerText = currentQuestion.unit;
    if (qTextElem) qTextElem.innerText = currentQuestion.text;

    renderAnswerUI();
}

function renderAnswerUI() {
    const container = document.getElementById("answer-area");
    if (!container) return;
    container.innerHTML = "";

    if (currentQuestion.type === "SHORT") {
        const input = document.createElement("input");
        input.type = "text";
        input.id = "user-answer";
        input.placeholder = "답을 입력하세요";
        input.autocomplete = "off";

        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") submitAnswer();
        });

        const btn = document.createElement("button");
        btn.innerText = "공격하기";
        btn.onclick = () => submitAnswer();

        container.appendChild(input);
        container.appendChild(btn);

        setTimeout(() => input.focus(), 50);

    } else if (currentQuestion.type === "CHOICE" || currentQuestion.type === "OX") {
        const btnGroup = document.createElement("div");
        btnGroup.className = "choice-group";
        currentQuestion.options.forEach((opt) => {
            const btn = document.createElement("button");
            btn.className = "choice-btn";
            btn.innerText = opt;
            btn.onclick = () => submitAnswer(opt);
            btnGroup.appendChild(btn);
        });
        container.appendChild(btnGroup);
    }
}

function submitAnswer(selectedValue = null) {
    if (!currentQuestion) return;

    let userAns = selectedValue;
    if (userAns === null) {
        const inputElem = document.getElementById("user-answer");
        if (inputElem) userAns = inputElem.value.trim();
    }

    const comboBanner = document.getElementById("combo-banner");
    let isCorrect = (typeof currentQuestion.answer === "number")
        ? Math.abs(parseFloat(userAns) - currentQuestion.answer) < 0.01
        : String(userAns).toUpperCase() === String(currentQuestion.answer).toUpperCase();

    if (isCorrect) {
        comboCount++;
        let damage = 60;

        if (comboCount >= 2) {
            damage *= 1.5 * comboCount;
            if (comboBanner) {
                comboBanner.innerText = `${comboCount} COMBO! CRITICAL HIT!`;
                comboBanner.classList.remove("hidden");
            }
        } else {
            if (comboBanner) comboBanner.classList.add("hidden");
        }

        monsterHP = Math.max(0, monsterHP - damage);
        triggerMonsterAnim("monster-hit");
        updateUI();

        if (monsterHP <= 0) {
            setTimeout(() => {
                alert(`🎉 LV.${monsterLevel} 몬스터 처치 성공! 다음 상대를 불러옵니다.`);
                monsterLevel++;
                monsterMaxHP += 100;
                monsterHP = monsterMaxHP;
                updateMonsterAppearance();
                updateUI();
                nextQuestion();
            }, 300);
            return;
        }
        nextQuestion();

    } else {
        comboCount = 0;
        if (comboBanner) comboBanner.classList.add("hidden");

        playerHP = Math.max(0, playerHP - 20);
        triggerMonsterAnim("monster-attack");
        document.body.classList.add("shake");
        setTimeout(() => document.body.classList.remove("shake"), 400);

        updateUI();

        if (playerHP <= 0) {
            setTimeout(() => {
                alert("💀 Game Over!");
                playerHP = playerMaxHP;
                monsterHP = monsterMaxHP;
                comboCount = 0;
                updateUI();
                nextQuestion();
            }, 300);
            return;
        }
        showExplanationModal();
    }
}

function showExplanationModal() {
    const modalText = document.getElementById("modal-explanation-text");
    const modal = document.getElementById("explanation-modal");
    if (modalText) modalText.innerText = currentQuestion.explanation;
    if (modal) modal.classList.remove("hidden");
}

function closeExplanation() {
    const modal = document.getElementById("explanation-modal");
    if (modal) modal.classList.add("hidden");
    nextQuestion();
}

function updateUI() {
    const pHP = document.getElementById("player-hp");
    const mHP = document.getElementById("monster-hp");
    if (pHP) pHP.style.width = `${(playerHP / playerMaxHP) * 100}%`;
    if (mHP) mHP.style.width = `${(monsterHP / monsterMaxHP) * 100}%`;
}

function changeUnitMode(unitKey) {
    currentUnitKey = unitKey;
    comboCount = 0;
    const comboBanner = document.getElementById("combo-banner");
    if (comboBanner) comboBanner.classList.add("hidden");
    nextQuestion();
}

window.onload = () => {
    const selectElem = document.getElementById("unit-select");
    if (selectElem) {
        currentUnitKey = selectElem.value;
    }
    updateMonsterAppearance();
    loadQuestionDatabase(); // JSON 파일 로드
};
