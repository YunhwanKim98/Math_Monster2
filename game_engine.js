let scene, camera, renderer, monsterGroup, coreMesh, auraLight;
let monsterState = "IDLE";

let playerMaxHP = 100, playerHP = 100;
let monsterMaxHP = 300, monsterHP = 300;
let comboCount = 0;
let lastPatternId = null;

let currentDB = [];
let currentQuestion = null;

// 1. 세련되고 액티브한 3D 몬스터 연출 (Monster Hunter Rise 스타일)
function init3D() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // 몬스터 피규어 그룹 생성
    monsterGroup = new THREE.Group();

    // [바깥 외피] 입체 가시 구조체
    const outerGeo = new THREE.IcosahedronGeometry(2.2, 1);
    const outerMat = new THREE.MeshPhongMaterial({ 
        color: 0x220044, 
        emissive: 0x5500aa,
        specular: 0x00ffff,
        shininess: 100,
        wireframe: false,
        flatShading: true
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    monsterGroup.add(outerMesh);

    // [바깥 와이어 가시 이펙트]
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true });
    const wireMesh = new THREE.Mesh(outerGeo, wireMat);
    wireMesh.scale.set(1.05, 1.05, 1.05);
    monsterGroup.add(wireMesh);

    // [내부 핵] 붉게 타오르는 붉은 코어
    const coreGeo = new THREE.OctahedronGeometry(1.2, 2);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
    coreMesh = new THREE.Mesh(coreGeo, coreMat);
    monsterGroup.add(coreMesh);

    scene.add(monsterGroup);

    // 화려한 몬스터 헌터풍 조명 시스템
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

function animate() {
    requestAnimationFrame(animate);
    const time = Date.now() * 0.003;

    if (monsterGroup) {
        if (monsterState === "IDLE") {
            // 위아래로 호흡하듯 위협적으로 움직임
            monsterGroup.position.y = Math.sin(time * 2) * 0.25;
            monsterGroup.rotation.y += 0.01;
            monsterGroup.rotation.x = Math.sin(time) * 0.1;
            coreMesh.rotation.y -= 0.03;
        } else if (monsterState === "HIT") {
            // 정답 시 뒤로 밀리며 발광하는 피격 모션
            monsterGroup.position.z = -1.5;
            monsterGroup.rotation.z = Math.sin(time * 30) * 0.3;
        } else if (monsterState === "ATTACK") {
            // 오답 시 카메라 정면으로 돌진하는 모션
            monsterGroup.position.z = 2.5;
            monsterGroup.rotation.x = 0.5;
        }
    }

    renderer.render(scene, camera);
}

// 2. 외부 JSON 문제 불러오기
async function loadDatabase(unitKey) {
    const fileName = `${unitKey}.json`;
    try {
        const response = await fetch(`./db/${fileName}`);
        currentDB = await response.json();
        nextQuestion();
    } catch (error) {
        console.warn(`${fileName} 로드 실패. 기본 middle1_3.json으로 대체합니다.`, error);
        if (unitKey !== 'middle1_3') {
            loadDatabase('middle1_3');
        }
    }
}

// 3. 무작위 문제 생성
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

// 4. 답안 제출 및 판정
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