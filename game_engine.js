let playerMaxHP = 100, playerHP = 100;
let monsterMaxHP = 300, monsterHP = 300;
let monsterLevel = 1;

let comboCount = 0;
let currentQuestion = null;
let currentUnitKey = "middle1_3"; // 기본 선택 단원 (예: 3단원)

// 몬스터 도감
const MONSTER_ROSTER = [
    { name: "MEWTWO", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png" },
    { name: "CHARIZARD", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png" },
    { name: "GENGAR", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png" },
    { name: "RAYQUAZA", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/384.png" },
    { name: "LUGIA", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/249.png" },
    { name: "LUCARIO", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png" }
];

// 정수 범위 배열 유틸리티
function range(start, end, step = 1) {
    let list = [];
    for (let i = start; i <= end; i += step) list.push(i);
    return list;
}

// -------------------------------------------------------------
// [단원별 동적 문제 생성 데이터베이스]
// 각 단원 키마다 10~20개 이상의 무한 생성 패턴 수록
// -------------------------------------------------------------
const QUESTION_GENERATORS = {

    // ==========================================
    // 1단원: 자연수의 성질 (middle1_1)
    // ==========================================
    "middle1_1": [
        // LV.1
        {
            level: 1, type: "SHORT", unit: "1단원 자연수의 성질",
            template: "{a}의 약수의 개수를 구하시오.",
            param_rules: { "a": [12, 18, 20, 24, 30, 36, 45, 50] },
            dynamic_params: (p) => {
                let count = 0;
                for (let i = 1; i <= p.a; i++) { if (p.a % i === 0) count++; }
                p.ans_val = count;
            },
            eval_script: "ans_val",
            explanation: "{a}의 약수를 모두 구해보면 개수는 {ans}개입니다."
        },
        {
            level: 1, type: "CHOICE", unit: "1단원 자연수의 성질",
            template: "다음 중 소수가 아닌 것(합성수)은?",
            param_rules: { "prime_idx": [0, 1, 2] },
            dynamic_params: (p) => {
                const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];
                const composites = [4, 6, 8, 9, 10, 12, 14, 15, 16, 21, 25, 27];
                let selectedPrimes = primes.sort(() => 0.5 - Math.random()).slice(0, 3);
                let selectedComp = composites[Math.floor(Math.random() * composites.length)];
                
                p.opts = [...selectedPrimes, selectedComp].sort(() => 0.5 - Math.random());
                p.ans_val = selectedComp;
            },
            options: ["{opts[0]}", "{opts[1]}", "{opts[2]}", "{opts[3]}"],
            eval_script: "ans_val",
            explanation: "{ans}는 1과 자기 자신 이외의 약수를 가지므로 합성수입니다."
        },
        // LV.2
        {
            level: 2, type: "SHORT", unit: "1단원 자연수의 성질",
            template: "두 수 {a}와 {b}의 최대공약수를 구하시오.",
            param_rules: { "gcd_val": range(2, 8), "m1": range(2, 5), "m2": range(6, 9) },
            dynamic_params: (p) => {
                p.a = p.gcd_val * p.m1;
                p.b = p.gcd_val * p.m2;
            },
            eval_script: "gcd_val",
            explanation: "{a}와 {b}의 최대공약수는 {ans}입니다."
        },
        // LV.3
        {
            level: 3, type: "SHORT", unit: "1단원 자연수의 성질",
            template: "두 수 {a}와 {b}의 최소공배수를 구하시오.",
            param_rules: { "gcd_val": range(2, 6), "m1": [2, 3, 5], "m2": [7, 11, 13] },
            dynamic_params: (p) => {
                p.a = p.gcd_val * p.m1;
                p.b = p.gcd_val * p.m2;
                p.lcm_val = p.gcd_val * p.m1 * p.m2;
            },
            eval_script: "lcm_val",
            explanation: "최대공약수가 {gcd_val}이므로 최소공배수는 {gcd_val} × {m1} × {m2} = {ans}입니다."
        }
    ],

    // ==========================================
    // 2단원: 정수와 유리수 (middle1_2)
    // ==========================================
    "middle1_2": [
        // LV.1
        {
            level: 1, type: "SHORT", unit: "2단원 정수와 유리수",
            template: "다음 계산을 하시오: ({a}) + ({b})",
            param_rules: { "a": range(-15, -1), "b": range(1, 20) },
            eval_script: "a + b",
            explanation: "({a}) + ({b}) = {ans}입니다."
        },
        {
            level: 1, type: "SHORT", unit: "2단원 정수와 유리수",
            template: "절댓값이 {a}인 음수를 구하시오.",
            param_rules: { "a": range(3, 20) },
            eval_script: "-a",
            explanation: "절댓값이 {a}인 음수는 -{a}입니다."
        },
        // LV.2
        {
            level: 2, type: "SHORT", unit: "2단원 정수와 유리수",
            template: "다음 계산을 하시오: ({a}) × (-{b}) - ({c})",
            param_rules: { "a": range(2, 7), "b": range(2, 6), "c": range(-10, -1) },
            eval_script: "(a * -b) - c",
            explanation: "({a}) × (-{b}) = {a*-b} 이고, 거기서 ({c})를 빼면 {ans}가 됩니다."
        },
        // LV.3
        {
            level: 3, type: "SHORT", unit: "2단원 정수와 유리수",
            template: "다음 거듭제곱을 포함한 식을 계산하시오: (-{a})² ÷ {b} + ({c})",
            param_rules: { "a": range(2, 5), "b": [2, 4], "c": range(-10, 10) },
            dynamic_params: (p) => { p.a_sq = p.a * p.a; },
            eval_script: "(a_sq / b) + c",
            explanation: "(-{a})² = {a_sq} 이며, {a_sq} ÷ {b} = {a_sq/b} 입니다. 여기에 {c}를 더하면 {ans}입니다."
        }
    ],

    // ==========================================
    // 3단원: 문자와 식 & 일차방정식 (middle1_3)
    // ==========================================
    "middle1_3": [
        // LV.1
        {
            level: 1, type: "SHORT", unit: "3단원 문자와 식",
            template: "x = {a}일 때, {b}x + {c}의 값을 구하시오.",
            param_rules: { "a": range(2, 9), "b": range(2, 9), "c": range(1, 15) },
            eval_script: "(b * a) + c",
            explanation: "x에 {a}를 대입하면 {b} × {a} + {c} = {ans}입니다."
        },
        {
            level: 1, type: "SHORT", unit: "3단원 일차방정식",
            template: "방정식 x + {a} = {b} 의 해 x를 구하시오.",
            param_rules: { "a": range(3, 25), "b": range(30, 60) },
            eval_script: "b - a",
            explanation: "x = {b} - {a} = {ans}입니다."
        },
        {
            level: 1, type: "CHOICE", unit: "3단원 문자와 식",
            template: "한 개에 {a}원하는 빵 {b}개와 {c}원하는 음료수 1개의 총 가격을 문자로 바르게 나타낸 것은?",
            param_rules: { "a": [500, 800, 1000, 1200, 1500], "b": ["x", "y"], "c": [700, 1000, 1500] },
            options: ["{a}{b} + {c}", "{a} + {b} + {c}", "{a}{b} - {c}", "{c}{b} + {a}"],
            eval_script: "'{a}{b} + {c}'",
            explanation: "빵 가격 {a}{b}원에 음료수 {c}원을 더하므로 {a}{b} + {c}원입니다."
        },
        // LV.2
        {
            level: 2, type: "SHORT", unit: "3단원 일차방정식",
            template: "일차방정식 {a}x - {b} = {c} 의 해 x를 구하시오.",
            param_rules: { "a": range(2, 6), "b": range(2, 15), "mult": range(3, 10) },
            dynamic_params: (p) => { p.c = (p.a * p.mult) - p.b; },
            eval_script: "(c + b) / a",
            explanation: "{a}x = {c} + {b} 이므로 {a}x = {c_plus_b}입니다. x = {ans}입니다."
        },
        {
            level: 2, type: "SHORT", unit: "3단원 일차방정식",
            template: "이항 방정식: {a}x + {b} = {c}x + {d} 의 해 x를 구하시오.",
            param_rules: { "a": range(5, 9), "c": range(2, 4), "x_ans": range(2, 8) },
            dynamic_params: (p) => {
                p.b = range(1, 10)[0];
                p.d = (p.a * p.x_ans + p.b) - (p.c * p.x_ans);
            },
            eval_script: "x_ans",
            explanation: "x항은 좌변, 상수는 우변으로 이항하여 정리하면 x = {ans}입니다."
        },
        // LV.3
        {
            level: 3, type: "SHORT", unit: "3단원 일차방정식의 활용",
            template: "어떤 수 x에 {a}를 더한 후 {b}배를 한 값은 {c}이다. x의 값을 구하시오.",
            param_rules: { "a": range(2, 9), "b": range(2, 4), "x_ans": range(3, 12) },
            dynamic_params: (p) => { p.c = p.b * (p.x_ans + p.a); },
            eval_script: "x_ans",
            explanation: "식: {b}(x + {a}) = {c} → x + {a} = {c/b} → x = {ans}입니다."
        },
        {
            level: 3, type: "SHORT", unit: "3단원 일차방정식의 활용",
            template: "거속시 활용: 시속 {v}km로 x시간 동안 달린 거리가 {d}km일 때, 시간 x를 구하시오.",
            param_rules: { "v": [40, 50, 60, 80], "x_ans": range(2, 6) },
            dynamic_params: (p) => { p.d = p.v * p.x_ans; },
            eval_script: "x_ans",
            explanation: "거리 = 속력 × 시간이므로 {v}x = {d} 에서 x = {ans}시간입니다."
        }
    ]
};

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
// [핵심] 현재 선택된 단원(currentUnitKey) 기준으로 문제 생성
// -------------------------------------------------------------
function nextQuestion() {
    // 1. 현재 선택된 단원 목록 가져오기 (없으면 3단원으로 기본 설정)
    const pool = QUESTION_GENERATORS[currentUnitKey] || QUESTION_GENERATORS["middle1_3"];

    // 2. COMBO 연속 정답 수에 따른 난이도 설정
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

    // 3. 해당 난이도 문제만 추출 (없으면 전체에서 추출)
    let levelPool = pool.filter(q => q.level === targetLevel);
    if (levelPool.length === 0) levelPool = pool;

    const rawPattern = levelPool[Math.floor(Math.random() * levelPool.length)];
    let evalScope = {};

    // 4. 변수 랜덤 할당 및 계산
    for (const [varName, list] of Object.entries(rawPattern.param_rules)) {
        evalScope[varName] = list[Math.floor(Math.random() * list.length)];
    }

    if (rawPattern.dynamic_params) {
        rawPattern.dynamic_params(evalScope);
    }

    let formattedText = rawPattern.template;
    for (const [varName, val] of Object.entries(evalScope)) {
        formattedText = formattedText.replace(new RegExp(`{${varName}}`, 'g'), val);
    }

    let calcScript = rawPattern.eval_script;
    for (const [varName, val] of Object.entries(evalScope)) {
        calcScript = calcScript.replace(new RegExp(`\\b${varName}\\b`, 'g'), typeof val === 'string' ? `'${val}'` : val);
    }
    
    const correctAnswer = Function(`"use strict"; return (${calcScript});`)();

    let expText = rawPattern.explanation || "해설이 없습니다.";
    expText = expText.replace(/{ans}/g, correctAnswer);
    expText = expText.replace(/{c_plus_b}/g, (evalScope['c'] || 0) + (evalScope['b'] || 0));
    expText = expText.replace(/{c\/b}/g, (evalScope['c'] || 0) / (evalScope['b'] || 1));
    expText = expText.replace(/{a\*-b}/g, (evalScope['a'] || 0) * -(evalScope['b'] || 0));
    expText = expText.replace(/{a_sq}/g, (evalScope['a'] || 0) ** 2);
    expText = expText.replace(/{a_sq\/b}/g, ((evalScope['a'] || 0) ** 2) / (evalScope['b'] || 1));

    for (const [varName, val] of Object.entries(evalScope)) {
        expText = expText.replace(new RegExp(`{${varName}}`, 'g'), val);
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
        level: rawPattern.level,
        type: rawPattern.type,
        unit: rawPattern.unit,
        text: formattedText,
        answer: correctAnswer,
        options: renderedOptions,
        explanation: expText
    };

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

// -------------------------------------------------------------
// [단원 변경 함수] HTML 드롭다운/버튼의 onChange 등에서 호출
// 예: changeUnitMode('middle1_1')
// -------------------------------------------------------------
function changeUnitMode(unitKey) {
    currentUnitKey = unitKey;
    comboCount = 0;
    const comboBanner = document.getElementById("combo-banner");
    if (comboBanner) comboBanner.classList.add("hidden");
    nextQuestion();
}

window.onload = () => {
    updateMonsterAppearance();
    nextQuestion();
};
