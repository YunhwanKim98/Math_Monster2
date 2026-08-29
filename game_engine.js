let scene, camera, renderer, monsterMesh, monsterCore, auraLight;
let monsterState = "IDLE";

let playerMaxHP = 100, playerHP = 100;
let monsterMaxHP = 300, monsterHP = 300;
let comboCount = 0;
let lastPatternId = null;

let currentDB = [];
let currentQuestion = null;

// 1. 3D 몬스터 세련된 렌더링 (Monster Hunter Rise 마가이마가도 스타일)
function init3D() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // 몬스터 본체 (입체 가시 구조)
    const geometry = new THREE.IcosahedronGeometry(2.2, 1);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x440088, 
        roughness: 0.1, 
        metalness: 0.8,
        wireframe: true 
    });
    monsterMesh = new THREE.Mesh(geometry, material);
    
    // 몬스터 내부의 붉은 에너지 코어
    const coreGeo = new THREE.OctahedronGeometry(1.2, 2);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xff0055, wireframe: true });
    monsterCore = new THREE.Mesh(coreGeo, coreMat);
    monsterMesh.add(monsterCore);

    scene.add(monsterMesh);

    // 오라 조명 효과 (귀화 도깨비불)
    auraLight = new THREE.PointLight(0x00ffff, 3, 50);
    auraLight.position.set(0, 2, 4);
    scene.add(auraLight);
    scene.add(new THREE.AmbientLight(0x111122));

    camera.position.z = 6.5;
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    const time = Date.now() * 0.003;

    if (monsterState === "IDLE") {
        monsterMesh.position.y = Math.sin(time) * 0.2;
        monsterMesh.rotation.y += 0.01;
        monsterCore.rotation.x -= 0.02;
    } else if (monsterState === "HIT") {
        monsterMesh.position.z = -1;
        monsterMesh.rotation.x = Math.sin(time * 25) * 0.4;
    } else if (monsterState === "ATTACK") {
        monsterMesh.position.z = 2;
    }

    renderer.render(scene, camera);
}

// 2. 단원별 JSON 데이터 로드
async function loadDatabase(unitKey) {
    const fileName = `${unitKey}.json`;
    try {
        const response = await fetch(`./db/${fileName}`);
        currentDB = await response.json();
        nextQuestion();
    } catch (error) {
        console.error("DB 로딩 실패:", error);
        // 만약 해당 단원 json이 준비 안 되었으면 middle1_3.json으로 대체 실행
        if (unitKey !== 'middle1_3') {
            loadDatabase('middle1_3');
        }
    }
}

// 3. 문제 생성
function nextQuestion() {
    if (!currentDB || currentDB.length === 0) return;

    const rawPattern = currentDB[Math.floor(Math.random() * currentDB.length)];
    let formattedText = rawPattern.template;
    let evalScope = {};

    for (const [varName, range] of Object.entries(rawPattern.param_rules)) {
        let val;
        if (Array.isArray(range) && range.length === 2 && typeof range[0] === 'number') {
            val = Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
        } else if (Array.isArray(range)) {
            val = range[Math.floor(Math.random() * range.length)];
        }
        evalScope[varName] = val;
        formattedText = formattedText.replace(new RegExp(`{${varName}}`, 'g'), val);
    }

    let calcScript = rawPattern.eval_script;
    for (const [varName, val] of Object.entries(evalScope)) {
        calcScript = calcScript.replace(new RegExp(`\\b${varName}\\b`, 'g'), val);
    }
    const correctAnswer = Function(`"use strict"; return (${calcScript});`)();

    currentQuestion = {
        id: rawPattern.id,
        unit: rawPattern.unit,
        text: formattedText,
        answer: correctAnswer
    };

    document.getElementById("current-unit").innerText = currentQuestion.unit;
    document.getElementById("question-text").innerText = currentQuestion.text;
    document.getElementById("user-answer").value = "";
}

// 4. 정/오답 처리
function submitAnswer() {
    if (!currentQuestion) return;

    const userAns = parseFloat(document.getElementById("user-answer").value);
    const comboBanner = document.getElementById("combo-banner");

    if (Math.abs(userAns - currentQuestion.answer) < 0.01) {
        let damage = 50;

        if (lastPatternId === currentQuestion.id) {
            comboCount++;
        } else {
            comboCount = 1;
            lastPatternId = currentQuestion.id;
        }

        if (comboCount >= 2) {
            damage *= 2.5; 
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

    } else {
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
    }

    updateUI();
    nextQuestion();
}

function updateUI() {
    document.getElementById("player-hp").style.width = `${(playerHP / playerMaxHP) * 100}%`;
    document.getElementById("monster-hp").style.width = `${(monsterHP / monsterMaxHP) * 100}%`;
}

// 메뉴 단원 변경 함수
function changeUnitMode(unitKey) {
    comboCount = 0;
    lastPatternId = null;
    document.getElementById("combo-banner").classList.add("hidden");
    loadDatabase(unitKey);
}

window.onload = () => {
    init3D();
    loadDatabase("middle1_3");
};