let scene, camera, renderer, monsterMesh;
let monsterState = "IDLE";

let playerMaxHP = 100, playerHP = 100;
let monsterMaxHP = 300, monsterHP = 300;
let comboCount = 0;
let lastPatternId = null;

let currentDB = [];
let currentQuestion = null;

// 1. 3D 몬스터 그래픽 (Three.js)
function init3D() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // 몬스터 헌터 스타일의 입체 야수형 메쉬
    const geometry = new THREE.IcosahedronGeometry(2.5, 1);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x6600cc, 
        roughness: 0.2, 
        wireframe: true 
    });
    monsterMesh = new THREE.Mesh(geometry, material);
    scene.add(monsterMesh);

    // 푸른 도깨비불 이펙트 조명
    const light = new THREE.PointLight(0x00ffff, 2, 50);
    light.position.set(0, 3, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x222233));

    camera.position.z = 7;
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    const time = Date.now() * 0.003;

    if (monsterState === "IDLE") {
        monsterMesh.position.y = Math.sin(time) * 0.3;
        monsterMesh.rotation.y += 0.01;
    } else if (monsterState === "HIT") {
        monsterMesh.position.z = -1;
        monsterMesh.rotation.x = Math.sin(time * 20) * 0.3;
    } else if (monsterState === "ATTACK") {
        monsterMesh.position.z = 2;
    }

    renderer.render(scene, camera);
}

// 2. 외부 JSON 문제 데이터베이스 로드
async function loadDatabase(fileName) {
    try {
        const response = await fetch(`./db/${fileName}`);
        currentDB = await response.json();
        console.log(`${fileName} 로드 완료 (${currentDB.length}개 유형)`);
        nextQuestion();
    } catch (error) {
        console.error("DB 파일을 불러오는 데 실패했습니다. 폴더 경로와 파일명을 확인해 주세요:", error);
        document.getElementById("question-text").innerText = "db/middle1_3.json 파일을 찾을 수 없습니다.";
    }
}

// 3. 무작위 문제 추출 및 변수 생성 로직
function nextQuestion() {
    if (currentDB.length === 0) return;

    // DB 내 무작위 문제 유형 선택
    const rawPattern = currentDB[Math.floor(Math.random() * currentDB.length)];
    
    // 변수 범위 내 무작위 숫자 생성
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

    // eval_script 수식을 바탕으로 정답 계산
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

    // UI 업데이트
    document.getElementById("current-unit").innerText = currentQuestion.unit;
    document.getElementById("question-text").innerText = currentQuestion.text;
    document.getElementById("user-answer").value = "";
}

// 4. 답안 제출 및 콤보/데미지 판정
function submitAnswer() {
    if (!currentQuestion) return;

    const userAns = parseFloat(document.getElementById("user-answer").value);
    const comboBanner = document.getElementById("combo-banner");

    // 소수점 오차 방지 (정답과의 차이가 0.01 미만이면 정답 처리)
    if (Math.abs(userAns - currentQuestion.answer) < 0.01) {
        let damage = 50;

        // 동일 유형 문제 연달아 맞췄는지 판정 (콤보 시스템)
        if (lastPatternId === currentQuestion.id) {
            comboCount++;
        } else {
            comboCount = 1;
            lastPatternId = currentQuestion.id;
        }

        // 2회 이상 연속 정답 시 콤보 크리티컬 데미지 발동
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
        // 오답일 경우 콤보 리셋 및 플레이어 피격
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

// 학년 모드 변경 시 호출
function changeGradeMode(mode) {
    comboCount = 0;
    lastPatternId = null;
    document.getElementById("combo-banner").classList.add("hidden");

    if (mode === "M1") {
        loadDatabase("middle1_3.json");
    } else {
        // 다른 모드 선택 시 기본 파일 연결 예시
        loadDatabase("middle1_3.json");
    }
}

// 페이지 로드 시 초기화 및 middle1_3.json 로드
window.onload = () => {
    init3D();
    loadDatabase("middle1_3.json");
};