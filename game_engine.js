// ==========================================
// Math Monster Hunter 3D - Game Engine (Final)
// ==========================================

let scene, camera, renderer, monsterGroup, coreMesh, auraLight;
let monsterState = "IDLE"; // IDLE, HIT, ATTACK

// 플레이어 및 몬스터 상태 관리 변수
let playerMaxHP = 100, playerHP = 100;
let monsterMaxHP = 300, monsterHP = 300;
let monsterLevel = 1;

let comboCount = 0;
let lastPatternId = null;

let currentDB = [];
let currentQuestion = null;

// ------------------------------------------
// 1. Three.js 3D 그래픽 씬 초기화
// ------------------------------------------
function init3D() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    monsterGroup = new THREE.Group();

    // 몬스터 외피 (Icosahedron)
    const outerGeo = new THREE.IcosahedronGeometry(2.2, 1);
    const outerMat = new THREE.MeshPhongMaterial({ 
        color: 0x220044, 
        emissive: 0x5500aa, 
        specular: 0x00ffff, 
        shininess: 100, 
        flatShading: true
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    monsterGroup.add(outerMesh);

    // 네온 와이어프레임
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true });
    const wireMesh = new THREE.Mesh(outerGeo, wireMat);
    wireMesh.scale.set(1.05, 1.05, 1.05);
    monsterGroup.add(wireMesh);

    // 내부 코어
    const coreGeo = new THREE.OctahedronGeometry(1.2, 2);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
    coreMesh = new THREE.Mesh(coreGeo, coreMat);
    monsterGroup.add(coreMesh);

    scene.add(monsterGroup);

    // 조명 설정
    auraLight = new THREE.PointLight(0x00ffff, 4, 50);
    auraLight.position.set(0, 2, 5);
    scene.add(auraLight);

    const redLight = new THREE.PointLight(0xff0055, 3, 30);
    redLight.position.set(-3, -2, 3);
    scene.add(redLight);

    scene.add(new THREE.AmbientLight(0x111122));

    camera.position.z = 6.5;
    animate();
}

// ------------------------------------------
// 2. 3D 애니메이션 루프
// ------------------------------------------
function animate() {
    requestAnimationFrame(animate);
    const time = Date.now() * 0.003;

    if (monsterGroup) {
        if (monsterState === "IDLE") {
            monsterGroup.position.y = Math.sin(time * 2) * 0.25;
            monsterGroup.rotation.y += 0.01;
            coreMesh.rotation.y -= 0.03;
        } else if (monsterState === "HIT") {
            monsterGroup.position.z = -1.5;
            monsterGroup.rotation.z = Math.sin(time * 30) * 0.3;
        } else if (monsterState === "ATTACK") {
            monsterGroup.position.z = 2.5;
            monsterGroup.rotation.x = 0.5;
        }
    }

    renderer.render(scene, camera);
}

// ------------------------------------------
// 3. 문제 데이터베이스 로드 (CORS & GitHub Pages 대응)
// ------------------------------------------
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

    // 파일 로드 실패 시 내장 백업 데이터 작동
    if (!loaded) {
        console.warn("JSON 로드 실패, 내장 데이터 세트를 활성화합니다.");
        currentDB = [
            { 
                id: "M1_3_001", 
                level: 1, 
                type: "CHOICE", 
                unit: "3단원 문자와 식", 
                template: "x = {a}일 때, 다항식 {b}x + {c}의 값으로 옳은 것을 고르시오.", 
                param_rules: { "a": [2, 3, 4], "b": [3, 4, 5], "c": [1, 2, 5] }, 
                options: ["({b} * {a}) + {c}", "({b} * {a}) - {c}", "({b} + {a}) + {c}", "({b} * {a}) + {c} + 2"], 
                eval_script: "(b * a) + c", 
                explanation: "x = {a}를 식 {b}x + {c}에 대입하면 {b} × {a} + {c} = {ans}가 됩니다." 
            },
            { 
                id: "M1_3_002", 
                level: 1, 
                type: "SHORT", 
                unit: "3단원 일차방정식", 
                template: "일차방정식 {a}x + {b} = {c} 의 해 x를 구하시오.", 
                param_rules: { "a": [2, 3, 4], "b": [3, 5, 7], "c": [15, 17, 19] }, 
                eval_script: "(c - b) / a", 
                explanation: "{a}x = {c} - {b} 이므로 {a}x = {c_minus_b}입니다. 양변을 {a}로 나누면 x = {ans}가 됩니다." 
            }
        ];
        nextQuestion();
    }
}

// ------------------------------------------
// 4. 문제 무작위 추첨 및 난이도 조절
// ------------------------------------------
function nextQuestion() {
    if (!currentDB || currentDB.length === 0) return;

    // Combo에 따른 난이도(level) 필터링
    let targetLevel = 1;
    if (comboCount === 2) targetLevel = 2;
    else if (comboCount >= 3) targetLevel = 3;

    let targetPool = currentDB.filter(q => q.level === targetLevel);
    if (targetPool.length === 0) targetPool = currentDB; // 백업용 전체 시드

    const rawPattern = targetPool[Math.floor(Math.random() * targetPool.length)];
    let formattedText = rawPattern.template;
    let evalScope = {};

    // 문제 파라미터 무작위 대입
    for (const [varName, range] of Object.entries(rawPattern.param_rules)) {
        let val = range[Math.floor(Math.random() * range.length)];
        evalScope[varName] = val;
        formattedText = formattedText.replace(new RegExp(`{${varName}}`, 'g'), val);
    }

    // 정답 실시간 계산
    let calcScript = rawPattern.eval_script;
    for (const [varName, val] of Object.entries(evalScope)) {
        calcScript = calcScript.replace(new RegExp(`\\b${varName}\\b`, 'g'), val);
    }
    const correctAnswer = Function(`"use strict"; return (${calcScript});`)();

    // 해설 문구 동적 대입
    let expText = rawPattern.explanation || "해설이 제공되지 않는 문제입니다.";
    expText = expText.replace(/{ans}/g, correctAnswer);
    for (const [varName, val] of Object.entries(evalScope)) {
        expText = expText.replace(new RegExp(`{${varName}}`, 'g'), val);
    }
    if (evalScope['a'] && evalScope['b']) {
        expText = expText.replace(/{a\*b}/g, evalScope['a'] * evalScope['b']);
        expText = expText.replace(/{2b}/g, 2 * evalScope['b']);
    }
    if (evalScope['c'] && evalScope['b']) expText = expText.replace(/{c_minus_b}/g, evalScope['c'] - evalScope['b']);
    if (evalScope['sum_val']) expText = expText.replace(/{mid}/g, evalScope['sum_val'] / 3);

    // 객관식/OX 보기 연산 및 치환
    let renderedOptions = [];
    if (rawPattern.options) {
        renderedOptions = rawPattern.options.map(opt => {
            let script = String(opt);
            for (const [varName, val] of Object.entries(evalScope)) {
                script = script.replace(new RegExp(`\\b${varName}\\b`, 'g'), val);
            }
            try { return Function(`"use strict"; return (${script});`)(); } catch(e) { return opt; }
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

// ------------------------------------------
// 5. 문제 유형별 UI 동적 렌더링
// ------------------------------------------
function renderAnswerUI() {
    const container = document.getElementById("answer-area");
    container.innerHTML = "";

    if (currentQuestion.type === "SHORT") {
        container.innerHTML = `
            <input type="text" id="user-answer" placeholder="답을 입력하세요" onkeyup="if(window.event.keyCode==13){submitAnswer()}">
            <button onclick="submitAnswer()">공격하기</button>
        `;
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

// ------------------------------------------
// 6. 답안 판정 및 전투 시스템
// ------------------------------------------
function submitAnswer(selectedValue = null) {
    if (!currentQuestion) return;

    let userAns = selectedValue;
    if (userAns === null) {
        const inputElem = document.getElementById("user-answer");
        if (inputElem) userAns = inputElem.value.trim();
    }

    const comboBanner = document.getElementById("combo-banner");
    let isCorrect = false;

    if (typeof currentQuestion.answer === "number") {
        isCorrect = Math.abs(parseFloat(userAns) - currentQuestion.answer) < 0.01;
    } else {
        isCorrect = String(userAns).toUpperCase() === String(currentQuestion.answer).toUpperCase();
    }

    // 정답 처리
    if (isCorrect) {
        comboCount++;
        let damage = 60;

        if (comboCount >= 2) {
            damage *= 2;
            comboBanner.innerText = `${comboCount} COMBO! CRITICAL HIT!`;
            comboBanner.classList.remove("hidden");
            document.body.classList.add("shake");
            setTimeout(() => document.body.classList.remove("shake"), 400);
        } else {
            comboBanner.classList.add("hidden");
        }

        monsterHP = Math.max(0, monsterHP - damage);
        monsterState = "HIT";
        setTimeout(() => monsterState = "IDLE", 500);
        updateUI();

        // 몬스터 처치 완료 시 (레벨업)
        if (monsterHP <= 0) {
            setTimeout(() => {
                alert(`🎉 MAGAIMAGADO (LV.${monsterLevel}) 처치 완료!\n다음 레벨 몬스터가 등장합니다!`);
                
                monsterLevel++;
                monsterMaxHP += 100;
                monsterHP = monsterMaxHP;
                
                document.getElementById("monster-name").innerText = `MAGAIMAGADO (LV.${monsterLevel})`;
                updateUI();
                nextQuestion();
            }, 300);
            return;
        }

        nextQuestion();

    } else {
        // 오답 처리
        comboCount = 0;
        lastPatternId = null;
        comboBanner.classList.add("hidden");

        playerHP = Math.max(0, playerHP - 20);
        monsterState = "ATTACK";
        document.body.classList.add("shake");
        setTimeout(() => {
            monsterState = "IDLE";
            document.body.classList.remove("shake");
        }, 500);

        updateUI();

        // Game Over 처리
        if (playerHP <= 0) {
            setTimeout(() => {
                alert("💀 Game Over! 플레이어의 HP가 0이 되었습니다.");
                playerHP = playerMaxHP;
                monsterHP = monsterMaxHP;
                comboCount = 0;
                updateUI();
                nextQuestion();
            }, 300);
            return;
        }

        // 해설 모달 창 띄우기
        showExplanationModal();
    }
}

// ------------------------------------------
// 7. 모달창 및 UI 제어
// ------------------------------------------
function showExplanationModal() {
    document.getElementById("modal-explanation-text").innerText = currentQuestion.explanation;
    document.getElementById("explanation-modal").classList.remove("hidden");
}

function closeExplanation() {
    document.getElementById("explanation-modal").classList.add("hidden");
    nextQuestion(); // 사용자가 [다음 문제로] 버튼을 직접 눌러야 넘어감
}

function updateUI() {
    document.getElementById("player-hp").style.width = `${(playerHP / playerMaxHP) * 100}%`;
    document.getElementById("monster-hp").style.width = `${(monsterHP / monsterMaxHP) * 100}%`;
}

function changeUnitMode(unitKey) {
    comboCount = 0;
    lastPatternId = null;
    document.getElementById("combo-banner").classList.add("hidden");
    loadDatabase(unitKey);
}

// 초기화 시작
window.onload = () => {
    init3D();
    loadDatabase("middle1_3");
};