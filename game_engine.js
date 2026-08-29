let scene, camera, renderer, monsterMesh, monsterMaterial;
let monsterState = "IDLE";

let playerMaxHP = 100, playerHP = 100;
let monsterMaxHP = 300, monsterHP = 300;
let comboCount = 0;
let lastPatternId = null;
let currentQuestion = null;
let currentMode = "ELEM";

// 초등 및 학년별 임시 내장 문제 데이터베이스
const sampleDB = {
    "ELEM": [
        { id: "E1", unit: "기초 연산", template: "{a} + {b} = ?", rule: () => { const a = rand(1,50), b = rand(1,50); return { text: `${a} + ${b} = ?`, ans: a + b }; } },
        { id: "E2", unit: "구구단", template: "{a} × {b} = ?", rule: () => { const a = rand(2,9), b = rand(1,9); return { text: `${a} × ${b} = ?`, ans: a * b }; } }
    ],
    "M1": [
        { id: "M1_1", unit: "소인수분해", template: "12의 약수의 개수는?", rule: () => ({ text: "12의 약수의 개수를 구하시오.", ans: 6 }) },
        { id: "M1_2", unit: "일차방정식", template: "x + a = b", rule: () => { const a = rand(1,10), b = rand(15,30); return { text: `방정식 x + ${a} = ${b} 의 해 x를 구하시오.`, ans: b - a }; } }
    ]
};

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// Three.js 3D 몬스터 그래픽 초기화
function init3D() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // 몬스터 체형 (마가이마가도풍 가시 가득한 형태)
    const geometry = new THREE.IcosahedronGeometry(2.5, 0);
    monsterMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x6600cc, 
        roughness: 0.2, 
        wireframe: true 
    });
    monsterMesh = new THREE.Mesh(geometry, monsterMaterial);
    scene.add(monsterMesh);

    // 조명
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

// 문제 출제
function nextQuestion() {
    const db = sampleDB[currentMode] || sampleDB["ELEM"];
    const qData = db[Math.floor(Math.random() * db.length)];
    currentQuestion = qData.rule();
    currentQuestion.id = qData.id;
    
    document.getElementById("current-unit").innerText = qData.unit;
    document.getElementById("question-text").innerText = currentQuestion.text;
    document.getElementById("user-answer").value = "";
}

// 답안 제출 및 판정
function submitAnswer() {
    const userAns = parseFloat(document.getElementById("user-answer").value);
    const comboBanner = document.getElementById("combo-banner");

    if (userAns === currentQuestion.ans) {
        // 정답 시
        let damage = 40;
        if (lastPatternId === currentQuestion.id) {
            comboCount++;
        } else {
            comboCount = 1;
            lastPatternId = currentQuestion.id;
        }

        if (comboCount >= 2) {
            damage *= 2; // 콤보 데미지
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
        // 오답 시
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

function changeGradeMode(mode) {
    currentMode = mode;
    comboCount = 0;
    lastPatternId = null;
    document.getElementById("combo-banner").classList.add("hidden");
    nextQuestion();
}

window.onload = () => {
    init3D();
    nextQuestion();
};