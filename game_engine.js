let playerMaxHP = 100, playerHP = 100;
let monsterMaxHP = 300, monsterHP = 300;
let monsterLevel = 1;

let comboCount = 0;
let currentDB = [];
let currentQuestion = null;

// 몬스터 2D 애니메이션 연출
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

    if (!loaded) {
        currentDB = [
            { 
                id: "M1_3_001", level: 1, type: "CHOICE", unit: "3단원 문자와 식", 
                template: "x = {a}일 때, 다항식 {b}x + {c}의 값으로 옳은 것을 고르시오.", 
                param_rules: { "a": [2, 3, 4], "b": [3, 4, 5], "c": [1, 2, 5] }, 
                options: ["({b} * {a}) + {c}", "({b} * {a}) - {c}", "({b} + {a}) + {c}", "({b} * {a}) + {c} + 2"], 
                eval_script: "(b * a) + c", 
                explanation: "x = {a}를 식 {b}x + {c}에 대입하면 {b} × {a} + {c} = {ans}가 됩니다." 
            },
            { 
                id: "M1_3_002", level: 1, type: "SHORT", unit: "3단원 일차방정식", 
                template: "일차방정식 {a}x + {b} = {c} 의 해 x를 구하시오.", 
                param_rules: { "a": [2, 3, 4], "b": [3, 5, 7], "c": [15, 17, 19] }, 
                eval_script: "(c - b) / a", 
                explanation: "{a}x = {c} - {b} 이므로 {a}x = {c_minus_b}입니다. 양변을 {a}로 나누면 x = {ans}가 됩니다." 
            }
        ];
        nextQuestion();
    }
}

function nextQuestion() {
    if (!currentDB || currentDB.length === 0) return;

    let targetLevel = comboCount >= 3 ? 3 : (comboCount === 2 ? 2 : 1);
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
    for (const [varName, val] of Object.entries(evalScope)) {
        calcScript = calcScript.replace(new RegExp(`\\b${varName}\\b`, 'g'), val);
    }
    const correctAnswer = Function(`"use strict"; return (${calcScript});`)();

    let expText = rawPattern.explanation || "해설이 제공되지 않는 문제입니다.";
    expText = expText.replace(/{ans}/g, correctAnswer);
    for (const [varName, val] of Object.entries(evalScope)) {
        expText = expText.replace(new RegExp(`{${varName}}`, 'g'), val);
    }
    if (evalScope['c'] && evalScope['b']) expText = expText.replace(/{c_minus_b}/g, evalScope['c'] - evalScope['b']);

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

        // UI 생성 후 자동 포커스 처리
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
            damage *= 2;
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
                alert(`🎉 몬스터 (LV.${monsterLevel}) 처치 완료!`);
                monsterLevel++;
                monsterMaxHP += 100;
                monsterHP = monsterMaxHP;
                document.getElementById("monster-name").innerText = `MEWTWO (LV.${monsterLevel})`;
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
    loadDatabase("middle1_3");
};
