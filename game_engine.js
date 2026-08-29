let playerMaxHP = 100, playerHP = 100;
let monsterMaxHP = 300, monsterHP = 300;
let monsterLevel = 1;

let comboCount = 0;
let currentDB = [];
let currentQuestion = null;

// 몬스터 목록 데이터베이스 (다양한 2D 몬스터 로스터)
const MONSTER_ROSTER = [
    { name: "MEWTWO", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png" },
    { name: "CHARIZARD", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png" },
    { name: "GENGAR", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png" },
    { name: "RAYQUAZA", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/384.png" },
    { name: "LUGIA", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/249.png" },
    { name: "LUCARIO", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png" }
];

function updateMonsterAppearance() {
    const monsterData = MONSTER_ROSTER[(monsterLevel - 1) % MONSTER_ROSTER.length];
    document.getElementById("monster-img").src = monsterData.img;
    document.getElementById("monster-name").innerText = `${monsterData.name} (LV.${monsterLevel})`;
}

function triggerMonsterAnim(animClass) {
    const img = document.getElementById("monster-img");
    if (!img) return;
    img.classList.remove("monster-hit", "monster-attack");
    void img.offsetWidth;
    img.classList.add(animClass);
    setTimeout(() => img.classList.remove(animClass), 400);
}

async function loadDatabase(unitKey) {
    const fileName = `${unitKey}.json`;
    const pathsToTry = [`db/${fileName}`, `./db/${fileName}`];
    let loaded = false;

    for (const path of pathsToTry) {
        try {
            const response = await fetch(path);
            if (response.ok) {
                currentDB = await response.json();
                loaded = true;
                nextQuestion();
                break;
            }
        } catch (e) {}
    }

    // 파일 로드 실패 시 확충된 다양 유형 질문 데이터 세트 적용
    if (!loaded) {
        currentDB = [
            // LEVEL 1 (EASY)
            { 
                id: "M1_3_101", level: 1, type: "SHORT", unit: "3단원 일차방정식", 
                template: "x + {a} = {b} 일 때, x의 값을 구하시오.", 
                param_rules: { "a": [2, 3, 5, 7], "b": [10, 12, 15] }, 
                eval_script: "b - a", 
                explanation: "x + {a} = {b}에서 {a}를 이항하면 x = {b} - {a} = {ans}입니다." 
            },
            { 
                id: "M1_3_102", level: 1, type: "CHOICE", unit: "3단원 문자와 식", 
                template: "a = {a}일 때, {b}a 의 값으로 옳은 것은?", 
                param_rules: { "a": [3, 4, 5], "b": [2, 6, 7] }, 
                options: ["({b} * {a})", "({b} + {a})", "({b} - {a})", "({b} * {a}) + 1"], 
                eval_script: "b * a", 
                explanation: "{b}a는 {b} × a를 의미하므로 {b} × {a} = {ans}입니다." 
            },

            // LEVEL 2 (NORMAL - 2 COMBO 달성 시 출제)
            { 
                id: "M1_3_201", level: 2, type: "SHORT", unit: "3단원 일차방정식", 
                template: "일차방정식 {a}x - {b} = {c} 의 해 x를 구하시오.", 
                param_rules: { "a": [2, 3, 4], "b": [4, 6, 8], "c": [10, 12, 14] }, 
                eval_script: "(c + b) / a", 
                explanation: "{a}x = {c} + {b} 이므로 {a}x = {c_plus_b}입니다. 따라서 x = {ans}입니다." 
            },
            { 
                id: "M1_3_202", level: 2, type: "CHOICE", unit: "3단원 문자와 식", 
                template: "x = {a}, y = {b}일 때, {c}x + {d}y의 값은?", 
                param_rules: { "a": [2, 3], "b": [1, 4], "c": [3, 5], "d": [2, 3] }, 
                options: ["({c} * {a}) + ({d} * {b})", "({c} + {a}) + ({d} + {b})", "({c} * {a}) - ({d} * {b})", "({c} * {a}) * ({d} * {b})"], 
                eval_script: "(c * a) + (d * b)", 
                explanation: "{c}×{a} + {d}×{b} = {ans}가 됩니다." 
            },

            // LEVEL 3 (HARD - 3+ COMBO 달성 시 출제)
            { 
                id: "M1_3_301", level: 3, type: "SHORT", unit: "3단원 일차방정식의 활용", 
                template: "어떤 수 x에 {a}를 더한 후 {b}배를 하였더니 {c}가 되었다. x를 구하시오.", 
                param_rules: { "a": [2, 3, 5], "b": [2, 3], "c": [16, 18, 24] }, 
                eval_script: "(c / b) - a", 
                explanation: "{b}(x + {a}) = {c} 이므로 x + {a} = {c_div_b}가 됩니다. 따라서 x = {ans}입니다." 
            },
            { 
                id: "M1_3_302", level: 3, type: "OX", unit: "3단원 문자와 식", 
                template: "문장: '한 자루에 {a}원하는 연필 x자루의 가격은 {a}x원이다.' 이 문장은 맞을까요?", 
                param_rules: { "a": [500, 700, 1000] }, 
                options: ["O", "X"], 
                eval_script: "'O'", 
                explanation: "단가 × 개수이므로 {a}x원이 맞습니다." 
            }
        ];
        nextQuestion();
    }
}

function nextQuestion() {
    if (!currentDB || currentDB.length === 0) return;

    // COMBO에 따른 난이도(Level) 자동 상향 시스템
    let targetLevel = 1;
    let diffTagText = "EASY";
    let diffColor = "#00ffff";

    if (comboCount >= 3) {
        targetLevel = 3;
        diffTagText = "HARD 🔥";
        diffColor = "#ff0055";
    } else if (comboCount >= 2) {
        targetLevel = 2;
        diffTagText = "NORMAL ⚡";
        diffColor = "#ffea00";
    }

    const diffTagElem = document.getElementById("difficulty-tag");
    if (diffTagElem) {
        diffTagElem.innerText = diffTagText;
        diffTagElem.style.color = diffColor;
    }

    let targetPool = currentDB.filter(q => q.level === targetLevel);
    if (targetPool.length === 0) targetPool = currentDB;

    const rawPattern = targetPool[Math.floor(Math.random() * targetPool.length)];
    let formattedText = rawPattern.template;
    let evalScope = {};

    for (const [varName, range] of Object.entries(rawPattern.param_rules)) {
        let val = range[Math.floor(Math.random() * range.length)];
        evalScope[varName] = val;
        formattedText = formattedText.replace(new RegExp(`{${varName}}`, 'g'), val);
    }

    let calcScript = rawPattern.eval_script;
    if (rawPattern.type !== "OX" && !calcScript.includes("'")) {
        for (const [varName, val] of Object.entries(evalScope)) {
            calcScript = calcScript.replace(new RegExp(`\\b${varName}\\b`, 'g'), val);
        }
    }
    
    const correctAnswer = Function(`"use strict"; return (${calcScript});`)();

    let expText = rawPattern.explanation || "해설이 제공되지 않는 문제입니다.";
    expText = expText.replace(/{ans}/g, correctAnswer);
    for (const [varName, val] of Object.entries(evalScope)) {
        expText = expText.replace(new RegExp(`{${varName}}`, 'g'), val);
    }
    if (evalScope['c'] && evalScope['b']) {
        expText = expText.replace(/{c_plus_b}/g, evalScope['c'] + evalScope['b']);
        expText = expText.replace(/{c_div_b}/g, evalScope['c'] / evalScope['b']);
    }

    let renderedOptions = [];
    if (rawPattern.options) {
        renderedOptions = rawPattern.options.map(opt => {
            let script = String(opt);
            for (const [varName, val] of Object.entries(evalScope)) {
                script = script.replace(new RegExp(`{${varName}}`, 'g'), val);
            }
            try { return Function(`"use strict"; return (${script});`)(); } catch(e) { return script; }
        });
    }

    currentQuestion = {
        id: rawPattern.id,
        level: rawPattern.level || 1,
        type: rawPattern.type || "SHORT",
        unit: rawPattern.unit,
        text: formattedText,
        answer: correctAnswer,
        options: renderedOptions,
        explanation: expText
    };

    document.getElementById("current-unit").innerText = currentQuestion.unit;
    document.getElementById("question-text").innerText = currentQuestion.text;
    renderAnswerUI();
}

function renderAnswerUI() {
    const container = document.getElementById("answer-area");
    container.innerHTML = "";

    if (currentQuestion.type === "SHORT") {
        const input = document.createElement("input");
        input.type = "text";
        input.id = "user-answer";
        input.placeholder = "답을 입력하세요";
        input.autocomplete = "off";

        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                submitAnswer();
            }
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
            comboBanner.innerText = `${comboCount} COMBO! CRITICAL HIT!`;
            comboBanner.classList.remove("hidden");
        } else {
            comboBanner.classList.add("hidden");
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
        comboBanner.classList.add("hidden");

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
    document.getElementById("modal-explanation-text").innerText = currentQuestion.explanation;
    document.getElementById("explanation-modal").classList.remove("hidden");
}

function closeExplanation() {
    document.getElementById("explanation-modal").classList.add("hidden");
    nextQuestion();
}

function updateUI() {
    document.getElementById("player-hp").style.width = `${(playerHP / playerMaxHP) * 100}%`;
    document.getElementById("monster-hp").style.width = `${(monsterHP / monsterMaxHP) * 100}%`;
}

function changeUnitMode(unitKey) {
    comboCount = 0;
    document.getElementById("combo-banner").classList.add("hidden");
    loadDatabase(unitKey);
}

window.onload = () => {
    updateMonsterAppearance();
    loadDatabase("middle1_3");
};
