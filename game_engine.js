let playerMaxHP = 100, playerHP = 100;
let monsterMaxHP = 300, monsterHP = 300;
let monsterLevel = 1;

let comboCount = 0;
let currentQuestion = null;
let currentUnitKey = "middle1_1"; // 기본 단원

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
// [단원별 동적 문제 생성 데이터베이스 (LV.1 ~ LV.10 난이도 체계)]
// -------------------------------------------------------------
const QUESTION_GENERATORS = {

    // ==========================================
    // 1단원: 자연수의 성질 (middle1_1)
    // ==========================================
    "middle1_1": [
        // LV.1 ~ LV.2: 소수, 합성수 구분 & 기본 약수
        {
            level: 1, type: "SHORT", unit: "1단원 자연수의 성질",
            template: "{a}의 약수의 개수를 구하시오.",
            param_rules: { "a": [6, 8, 10, 14, 15, 21, 22] },
            dynamic_params: (p) => {
                let count = 0;
                for (let i = 1; i <= p.a; i++) { if (p.a % i === 0) count++; }
                p.ans_val = count;
            },
            eval_script: "ans_val",
            explanation: "{a}의 약수를 구하면 개수는 {ans}개입니다."
        },
        {
            level: 2, type: "CHOICE", unit: "1단원 자연수의 성질",
            template: "다음 중 소수가 아닌 것(합성수)은?",
            param_rules: {},
            dynamic_params: (p) => {
                const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];
                const composites = [4, 6, 8, 9, 10, 12, 14, 15, 16, 21, 25, 27];
                let selectedPrimes = primes.sort(() => 0.5 - Math.random()).slice(0, 3);
                let selectedComp = composites[Math.floor(Math.random() * composites.length)];
                
                let optsList = [...selectedPrimes, selectedComp].sort(() => 0.5 - Math.random());
                p.opt0 = optsList[0];
                p.opt1 = optsList[1];
                p.opt2 = optsList[2];
                p.opt3 = optsList[3];
                p.ans_val = selectedComp;
            },
            options: ["{opt0}", "{opt1}", "{opt2}", "{opt3}"],
            eval_script: "ans_val",
            explanation: "{ans}는 1과 자기 자신 이외의 약수를 가지므로 합성수입니다."
        },

        // LV.3 ~ LV.4: 소인수분해 기초
        {
            level: 3, type: "SHORT", unit: "1단원 자연수의 성질",
            template: "{a}를 소인수분해 했을 때, 소인수들의 합을 구하시오.",
            param_rules: { "a": [12, 18, 20, 24, 28, 45, 50] },
            dynamic_params: (p) => {
                let num = p.a;
                let factors = new Set();
                for (let d = 2; d * d <= num; d++) {
                    while (num % d === 0) { factors.add(d); num /= d; }
                }
                if (num > 1) factors.add(num);
                p.ans_val = Array.from(factors).reduce((acc, v) => acc + v, 0);
            },
            eval_script: "ans_val",
            explanation: "{a}의 소인수는 약수 중 소수인 것들이며, 그 합은 {ans}입니다."
        },
        {
            level: 4, type: "SHORT", unit: "1단원 자연수의 성질",
            template: "2³ × 3^{a} 의 약수의 개수가 {b}개일 때, a의 값을 구하시오.",
            param_rules: { "a_ans": range(2, 5) },
            dynamic_params: (p) => {
                p.a = p.a_ans;
                p.b = (3 + 1) * (p.a + 1);
            },
            eval_script: "a_ans",
            explanation: "약수의 개수는 (지수+1)의 곱이므로 (3+1) × (a+1) = {b} 에서 a = {ans}입니다."
        },

        // LV.5 ~ LV.6: 최대공약수 / 최소공배수
        {
            level: 5, type: "SHORT", unit: "1단원 자연수의 성질",
            template: "두 수 {a}와 {b}의 최대공약수를 구하시오.",
            param_rules: { "gcd_val": range(3, 12), "m1": range(2, 5), "m2": range(6, 9) },
            dynamic_params: (p) => {
                p.a = p.gcd_val * p.m1;
                p.b = p.gcd_val * p.m2;
            },
            eval_script: "gcd_val",
            explanation: "{a}와 {b}의 공약수 중 가장 큰 수는 {ans}입니다."
        },
        {
            level: 6, type: "SHORT", unit: "1단원 자연수의 성질",
            template: "두 수 {a}와 {b}의 최소공배수를 구하시오.",
            param_rules: { "gcd_val": range(2, 6), "m1": [2, 3, 5], "m2": [7, 11, 13] },
            dynamic_params: (p) => {
                p.a = p.gcd_val * p.m1;
                p.b = p.gcd_val * p.m2;
                p.lcm_val = p.gcd_val * p.m1 * p.m2;
            },
            eval_script: "lcm_val",
            explanation: "최소공배수는 {ans}입니다."
        },

        // LV.7 ~ LV.8: 최대공약수/최소공배수 응용 (제곱수 만들기, 나머지 활용)
        {
            level: 7, type: "SHORT", unit: "1단원 자연수의 성질",
            template: "{a}에 가장 작은 자연수 x를 곱하여 어떤 자연수의 제곱이 되게 하려고 한다. x의 값을 구하시오.",
            param_rules: { "base": [2, 3, 5, 7], "square_part": [4, 9, 16] },
            dynamic_params: (p) => {
                p.a = p.base * p.square_part;
                p.ans_val = p.base;
            },
            eval_script: "ans_val",
            explanation: "지수가 홀수인 소인수의 지수를 짝수로 만들어야 하므로 곱해야 할 가장 작은 수는 {ans}입니다."
        },
        {
            level: 8, type: "SHORT", unit: "1단원 자연수의 성질",
            template: "어떤 자연수로 {a}를 나누면 {r1}가 남고, {b}를 나누면 {r2}가 남는다. 이러한 자연수 중 가장 큰 수를 구하시오.",
            param_rules: { "div": range(6, 12), "m1": range(3, 6), "m2": range(7, 10) },
            dynamic_params: (p) => {
                p.r1 = 2; p.r2 = 3;
                p.a = (p.div * p.m1) + p.r1;
                p.b = (p.div * p.m2) + p.r2;
                p.ans_val = p.div;
            },
            eval_script: "ans_val",
            explanation: "({a}-{r1})과 ({b}-{r2})의 최대공약수를 구하면 {ans}입니다."
        },

        // LV.9 ~ LV.10: 최고 난이도 심화 활용
        {
            level: 9, type: "SHORT", unit: "1단원 자연수의 성질",
            template: "세 분수 \\frac{{a}}{6}, \\frac{{b}}{8}, \\frac{{c}}{10} 중 어느 것에 곱해도 그 결과가 자연수가 되는 가장 작은 분수를 \\frac{B}{A}라 할 때, B - A 의 값을 구하시오.",
            param_rules: { "a": [5, 7], "b": [11, 13], "c": [17, 19] },
            dynamic_params: (p) => {
                p.A = 1; // 분모의 최대공약수(1)
                p.B = 120; // 분모 6, 8, 10의 최소공배수
                p.ans_val = p.B - p.A;
            },
            eval_script: "ans_val",
            explanation: "분모의 최소공배수는 120, 분자의 최대공약수는 1이므로 \\frac{120}{1}입니다. B-A = {ans}입니다."
        },
        {
            level: 10, type: "SHORT", unit: "1단원 자연수의 성질",
            template: "가로 {a}cm, 세로 {b}cm, 높이 {c}cm인 직육면체 모양의 블록을 쌓아 가장 작은 정육면체를 만들려고 한다. 필요한 블록의 개수를 구하시오.",
            param_rules: { "a": [4, 6], "b": [6, 8], "c": [10, 12] },
            dynamic_params: (p) => {
                // 최소공배수 계산
                const gcd = (x, y) => y === 0 ? x : gcd(y, x % y);
                const lcm = (x, y) => (x * y) / gcd(x, y);
                let L = lcm(lcm(p.a, p.b), p.c);
                p.ans_val = (L / p.a) * (L / p.b) * (L / p.c);
            },
            eval_script: "ans_val",
            explanation: "정육면체의 한 변의 길이는 모서리 길이들의 최소공배수입니다. 필요한 블록 개수는 {ans}개입니다."
        }
    ],

    // ==========================================
    // 2단원: 정수와 유리수 (middle1_2)
    // ==========================================
    "middle1_2": [
        {
            level: 1, type: "SHORT", unit: "2단원 정수와 유리수",
            template: "다음 계산을 하시오: ({a}) + ({b})",
            param_rules: { "a": range(-10, -1), "b": range(1, 15) },
            eval_script: "a + b",
            explanation: "({a}) + ({b}) = {ans}입니다."
        },
        {
            level: 5, type: "SHORT", unit: "2단원 정수와 유리수",
            template: "다음 계산을 하시오: ({a}) × (-{b}) - ({c})",
            param_rules: { "a": range(2, 7), "b": range(2, 6), "c": range(-10, -1) },
            eval_script: "(a * -b) - c",
            explanation: "({a}) × (-{b}) = {a*-b} 이며, 여기서 ({c})를 빼면 {ans}가 됩니다."
        },
        {
            level: 10, type: "SHORT", unit: "2단원 정수와 유리수",
            template: "거듭제곱 혼합 계산: -(-{a})² + {b} × (-{c})³ ÷ {d}",
            param_rules: { "a": [2, 3], "b": [2, 4], "c": [2], "d": [4, 8] },
            dynamic_params: (p) => {
                let term1 = -( (-p.a) ** 2 );
                let term2 = p.b * ( (-p.c) ** 3 ) / p.d;
                p.ans_val = term1 + term2;
            },
            eval_script: "ans_val",
            explanation: "거듭제곱을 먼저 계산한 후 곱셈/나눗셈, 덧셈 순서로 계산하면 {ans}입니다."
        }
    ],

    // ==========================================
    // 3단원: 문자와 식 & 일차방정식 (middle1_3)
    // ==========================================
    "middle1_3": [
        {
            level: 1, type: "SHORT", unit: "3단원 문자와 식",
            template: "x = {a}일 때, {b}x + {c}의 값을 구하시오.",
            param_rules: { "a": range(2, 9), "b": range(2, 9), "c": range(1, 15) },
            eval_script: "(b * a) + c",
            explanation: "x에 {a}를 대입하면 {b} × {a} + {c} = {ans}입니다."
        },
        {
            level: 5, type: "SHORT", unit: "3단원 일차방정식",
            template: "이항 방정식: {a}x + {b} = {c}x + {d} 의 해 x를 구하시오.",
            param_rules: { "a": range(5, 9), "c": range(2, 4), "x_ans": range(2, 8) },
            dynamic_params: (p) => {
                p.b = range(1, 10)[0];
                p.d = (p.a * p.x_ans + p.b) - (p.c * p.x_ans);
            },
            eval_script: "x_ans",
            explanation: "동류항끼리 이항하여 정리하면 x = {ans}입니다."
        },
        {
            level: 10, type: "SHORT", unit: "3단원 일차방정식의 활용",
            template: "{a}%의 소금물 {b}g에 물을 더 넣어 {c}%의 소금물을 만들려고 한다. 더 넣어야 하는 물의 양(g)을 구하시오.",
            param_rules: { "a": [12, 15, 20], "b": [200, 300], "c": [6, 8, 10] },
            dynamic_params: (p) => {
                let salt = (p.a / 100) * p.b;
                // salt / (b + x) = c / 100  =>  b + x = salt * 100 / c
                p.ans_val = (salt * 100 / p.c) - p.b;
            },
            eval_script: "ans_val",
            explanation: "소금의 양은 일정하므로 방정식을 세우면 더 넣어야 하는 물의 양은 {ans}g입니다."
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
// [핵심 1~10단계 난이도 연동 문제 출제 로직]
// -------------------------------------------------------------
function nextQuestion() {
    const pool = QUESTION_GENERATORS[currentUnitKey] || QUESTION_GENERATORS["middle1_1"];

    // 콤보 및 몬스터 레벨에 따른 1~10 난이도 자동 계산
    let targetLevel = Math.min(10, Math.max(1, Math.floor((monsterLevel - 1) / 2) + 1 + Math.floor(comboCount / 2)));

    const diffTagElem = document.getElementById("difficulty-tag");
    if (diffTagElem) {
        diffTagElem.innerText = `LV.${targetLevel}`;
        // 난이도별 색상 강조 (1: 청록, 5: 노랑, 10: 빨강)
        let hue = Math.max(0, 180 - (targetLevel - 1) * 18);
        diffTagElem.style.color = `hsl(${hue}, 100%, 50%)`;
    }

    // 해당 난이도와 가장 가까운 문제 검색
    let levelPool = pool.filter(q => q.level === targetLevel);
    if (levelPool.length === 0) {
        // 일치하는 level이 없으면 가장 가까운 level 문제 채택
        let sorted = [...pool].sort((a, b) => Math.abs(a.level - targetLevel) - Math.abs(b.level - targetLevel));
        levelPool = [sorted[0]];
    }

    const rawPattern = levelPool[Math.floor(Math.random() * levelPool.length)];
    let evalScope = {};

    // 1. 일반 변수 할당
    for (const [varName, list] of Object.entries(rawPattern.param_rules)) {
        evalScope[varName] = list[Math.floor(Math.random() * list.length)];
    }

    // 2. 동적 연산 변수 할당
    if (rawPattern.dynamic_params) {
        rawPattern.dynamic_params(evalScope);
    }

    // 3. 안전한 템플릿 치환 함수 (단일 변수 및 객체 변수 모두 지원)
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
    const correctAnswer = Function(`"use strict"; return (${calcScript});`)();

    // 5. 해설 바인딩
    let expText = bindTemplate(rawPattern.explanation);
    expText = expText.replace(/{ans}/g, correctAnswer);

    // 6. [오류 수정 핵심] 보기(Options) 바인딩
    let renderedOptions = [];
    if (rawPattern.options) {
        renderedOptions = rawPattern.options.map(opt => bindTemplate(opt));
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
