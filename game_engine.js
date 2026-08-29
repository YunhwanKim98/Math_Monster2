let playerMaxHP = 100, playerHP = 100;
let monsterMaxHP = 300, monsterHP = 300;
let monsterLevel = 1;

let comboCount = 0;
let currentQuestion = null;

// 몬스터 도감
const MONSTER_ROSTER = [
    { name: "MEWTWO", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png" },
    { name: "CHARIZARD", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png" },
    { name: "GENGAR", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png" },
    { name: "RAYQUAZA", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/384.png" },
    { name: "LUGIA", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/249.png" },
    { name: "LUCARIO", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png" }
];

// 범위 내 정수 배열 생성 유틸리티
function range(start, end, step = 1) {
    let list = [];
    for (let i = start; i <= end; i += step) list.push(i);
    return list;
}

// -------------------------------------------------------------
// [단원별 100가지 이상 동적 문제 생성 데이터베이스]
// -------------------------------------------------------------
const QUESTION_GENERATORS = {
    "middle1_3": [
        // === [EASY / LV.1] ===
        {
            level: 1, type: "SHORT", unit: "3단원 문자와 식",
            template: "x = {a}일 때, {b}x + {c}의 값을 구하시오.",
            param_rules: { "a": range(2, 9), "b": range(2, 9), "c": range(1, 15) },
            eval_script: "(b * a) + c",
            explanation: "x에 {a}를 대입하면 {b} × {a} + {c} = {ans}입니다."
        },
        {
            level: 1, type: "SHORT", unit: "3단원 일차방정식",
            template: "x + {a} = {b} 일 때, x의 값을 구하시오.",
            param_rules: { "a": range(3, 20), "b": range(25, 50) },
            eval_script: "b - a",
            explanation: "x = {b} - {a} = {ans}입니다."
        },
        {
            level: 1, type: "SHORT", unit: "3단원 일차방정식",
            template: "방정식 {a}x = {b}의 해 x를 구하시오.",
            param_rules: { "a": range(2, 9), "mult": range(2, 12) },
            dynamic_params: (p) => { p.b = p.a * p.mult; }, // 정수 해 보장
            eval_script: "b / a",
            explanation: "양변을 {a}로 나누면 x = {ans}입니다."
        },
        {
            level: 1, type: "CHOICE", unit: "3단원 문자와 식",
            template: "한 개에 {a}원하는 빵 {b}개와 {c}원하는 음료수 1개의 총 가격을 문자로 바르게 나타낸 것은?",
            param_rules: { "a": [500, 800, 1000, 1200, 1500], "b": ["x", "y"], "c": [700, 1000, 1500] },
            options: ["{a}{b} + {c}", "{a} + {b} + {c}", "{a}{b} - {c}", "{c}{b} + {a}"],
            eval_script: "'{a}{b} + {c}'",
            explanation: "빵 가격 {a}{b}원에 음료수 {c}원을 더하므로 {a}{b} + {c}원입니다."
        },

        // === [NORMAL / LV.2] ===
        {
            level: 2, type: "SHORT", unit: "3단원 일차방정식",
            template: "일차방정식 {a}x - {b} = {c} 의 해 x를 구하시오.",
            param_rules: { "a": range(2, 6), "b": range(2, 15), "mult": range(3, 10) },
            dynamic_params: (p) => { p.c = (p.a * p.mult) - p.b; },
            eval_script: "(c + b) / a",
            explanation: "{a}x = {c} + {b} 이므로 {a}x = {c_plus_b}입니다. x = {ans}입니다."
        },
        {
            level: 2, type: "SHORT", unit: "3단원 문자와 식",
            template: "x = {a}, y = {b}일 때, {c}x - {d}y의 값을 구하시오.",
            param_rules: { "a": range(2, 5), "b": range(1, 4), "c": range(3, 7), "d": range(2, 5) },
            eval_script: "(c * a) - (d * b)",
            explanation: "{c} × {a} - {d} × {b} = {ans}입니다."
        },
        {
            level: 2, type: "CHOICE", unit: "3단원 일차방정식",
            template: "방정식 {a}(x + {b}) = {c}의 해 x는?",
            param_rules: { "a": range(2, 5), "b": range(1, 6), "mult": range(4, 10) },
            dynamic_params: (p) => { p.c = p.a * (p.mult + p.b); },
            options: ["{mult}", "{mult} + 1", "{mult} - 1", "{mult} + 2"],
            eval_script: "mult",
            explanation: "괄호를 풀면 {a}x + {a*b} = {c} 이므로 x = {ans}입니다."
        },

        // === [HARD / LV.3] ===
        {
            level: 3, type: "SHORT", unit: "3단원 일차방정식의 활용",
            template: "어떤 수 x에 {a}를 더한 후 {b}배를 한 값은 {c}이다. x의 값을 구하시오.",
            param_rules: { "a": range(2, 9), "b": range(2, 4), "x_ans": range(3, 12) },
            dynamic_params: (p) => { p.c = p.b * (p.x_ans + p.a); },
            eval_script: "x_ans",
            explanation: "식: {b}(x + {a}) = {c} → x + {a} = {c/b} → x = {ans}입니다."
        },
        {
            level: 3, type: "SHORT", unit: "3단원 일차방정식",
            template: "방정식 \\frac{{a}x + {b}}{{c}} = {d} 의 해 x를 구하시오.",
            param_rules: { "c": range(2, 4), "d": range(5, 12), "a": range(2, 5), "b": range(1, 7) },
            dynamic_params: (p) => { 
                // 정수 해가 떨어지도록 튜닝
                let target = p.c * p.d;
                p.x_ans = range(2, 10).find(x => (target - p.b) % p.a === 0) || 3;
                p.b = target - (p.a * p.x_ans);
            },
            eval_script: "x_ans",
            explanation: "양변에 {c}를 곱하면 {a}x + {b} = {c*d} 가 되므로 x = {ans}입니다."
        },
        {
            level: 3, type: "OX", unit: "3단원 문자와 식",
            template: "명제: '가로의 길이가 x, 세로의 길이가 {a}인 직사각형의 둘레는 {b}x + {c}이다.' 이 설명은 참(O)일까요, 거짓(X)일까요?",
            param_rules: { "a": range(3, 8), "is_correct": [true, false] },
            dynamic_params: (p) => {
                p.b = 2;
                p.c = p.is_correct ? p.a * 2 : p.a;
            },
            options: ["O", "X"],
            eval_script: "is_correct ? 'O' : 'X'",
            explanation: "직사각형의 둘레는 2(가로 + 세로) = 2(x + {a}) = 2x + {a*2} 입니다."
        }
    ]
};

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

function nextQuestion() {
    const pool = QUESTION_GENERATORS["middle1_3"];
    if (!pool) return;

    // COMBO 난이도 제어
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

    let levelPool = pool.filter(q => q.level === targetLevel);
    if (levelPool.length === 0) levelPool = pool;

    const rawPattern = levelPool[Math.floor(Math.random() * levelPool.length)];
    let evalScope = {};

    // 1. 기본 난수 대입
    for (const [varName, list] of Object.entries(rawPattern.param_rules)) {
        evalScope[varName] = list[Math.floor(Math.random() * list.length)];
    }

    // 2. 동적 의존성 변수 연산
    if (rawPattern.dynamic_params) {
        rawPattern.dynamic_params(evalScope);
    }

    // 3. 텍스트 바인딩
    let formattedText = rawPattern.template;
    for (const [varName, val] of Object.entries(evalScope)) {
        formattedText = formattedText.replace(new RegExp(`{${varName}}`, 'g'), val);
    }

    // 4. 정답 및 해설 연산
    let calcScript = rawPattern.eval_script;
    for (const [varName, val] of Object.entries(evalScope)) {
        calcScript = calcScript.replace(new RegExp(`\\b${varName}\\b`, 'g'), typeof val === 'string' ? `'${val}'` : val);
    }
    
    const correctAnswer = Function(`"use strict"; return (${calcScript});`)();

    let expText = rawPattern.explanation || "해설이 없습니다.";
    expText = expText.replace(/{ans}/g, correctAnswer);
    expText = expText.replace(/{c_plus_b}/g, (evalScope['c'] || 0) + (evalScope['b'] || 0));
    expText = expText.replace(/{c\/b}/g, (evalScope['c'] || 0) / (evalScope['b'] || 1));
    expText = expText.replace(/{c\*d}/g, (evalScope['c'] || 0) * (evalScope['d'] || 0));
    expText = expText.replace(/{a\*b}/g, (evalScope['a'] || 0) * (evalScope['b'] || 0));
    expText = expText.replace(/{a\*2}/g, (evalScope['a'] || 0) * 2);

    for (const [varName, val] of Object.entries(evalScope)) {
        expText = expText.replace(new RegExp(`{${varName}}`, 'g'), val);
    }

    // 5. 보기 생성 (객관식)
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
        level: rawPattern.level,
        type: rawPattern.type,
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
    document.getElementById("explanation-modal").classList.hidden = true;
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
    nextQuestion();
}

window.onload = () => {
    updateMonsterAppearance();
    nextQuestion();
};
