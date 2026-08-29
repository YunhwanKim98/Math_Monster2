// 몬스터 헌터 라이즈 몬스터 비주얼 (SVG 벡터 그래픽)
const MONSTER_SPECIES = [
    { name: "원형의 아오아시라", hp: 100, color: "#2e86de", svg: `<svg viewBox="0 0 100 100"><path d="M20,80 Q50,10 80,80 Q50,60 20,80 Z" fill="#2e86de"/><circle cx="35" cy="45" r="5" fill="#fff"/><circle cx="65" cy="45" r="5" fill="#fff"/><polygon points="50,55 40,70 60,70" fill="#ff4757"/><path d="M15,40 L35,20 L30,45 Z" fill="#ffd32a"/><path d="M85,40 L65,20 L70,45 Z" fill="#ffd32a"/></svg>` },
    { name: "원망 누린 마가이마가도", hp: 180, color: "#8e44ad", svg: `<svg viewBox="0 0 100 100"><path d="M10,90 L30,30 L50,80 L70,30 L90,90 Z" fill="#5f27cd"/><circle cx="35" cy="45" r="6" fill="#ff0055"/><circle cx="65" cy="45" r="6" fill="#ff0055"/><path d="M50,40 L40,65 L60,65 Z" fill="#222"/><path d="M5,20 L25,35 L10,55 Z" fill="#ff9f43"/><path d="M95,20 L75,35 L90,55 Z" fill="#ff9f43"/></svg>` },
    { name: "멜-제나 (은색의 룡)", hp: 300, color: "#ff0055", svg: `<svg viewBox="0 0 100 100"><path d="M50,5 L80,40 L65,95 L35,95 L20,40 Z" fill="#c8d6e5"/><path d="M50,15 L70,45 L30,45 Z" fill="#ff0055"/><circle cx="40" cy="35" r="4" fill="#000"/><circle cx="60" cy="35" r="4" fill="#000"/><path d="M0,30 L30,50 L10,80 Z" fill="#ff0055"/><path d="M100,30 L70,50 L90,80 Z" fill="#ff0055"/></svg>` }
];

class HunterMathEngine {
    constructor() {
        this.playerHp = 100;
        this.maxPlayerHp = 100;
        this.currentMonsterIdx = 0;
        this.monsterHp = MONSTER_SPECIES[0].hp;
        this.maxMonsterHp = MONSTER_SPECIES[0].hp;
        
        this.currentLevel = 1;
        this.comboCount = 0;
        this.lastTypeHandled = null;
        this.currentUnitData = null;
        this.currentQuestion = null;
    }

    async loadUnit(unitFileName) {
        try {
            const res = await fetch(`./db/${unitFileName}`);
            this.currentUnitData = await res.json();
            return true;
        } catch(e) {
            console.error("DB 불러오기 실패:", e);
            return false;
        }
    }

    getQuestion() {
        if (!this.currentUnitData) return null;
        const levelKey = `level_${this.currentLevel}`;
        const types = this.currentUnitData.levels[levelKey]?.types;
        
        if (!types || types.length === 0) return null;
        
        const selectedType = types[Math.floor(Math.random() * types.length)];
        this.currentQuestion = selectedType;
        return selectedType;
    }

    processAnswer(selectedOption) {
        const isCorrect = selectedOption === this.currentQuestion.answer;
        const typeId = this.currentQuestion.type_id;
        
        let damageDealt = 0;
        let isCombo = false;
        let levelUpOccurred = false;

        if (isCorrect) {
            // 연쇄 콤보 로직 (동일 유형 연속 정답 시 콤보)
            if (this.lastTypeHandled === typeId) {
                this.comboCount++;
            } else {
                this.comboCount = 1;
                this.lastTypeHandled = typeId;
            }

            // 데미지 계산 (기본 20 + 콤보 보너스)
            damageDealt = 20 + (this.comboCount > 1 ? (this.comboCount * 15) : 0);
            this.monsterHp = Math.max(0, this.monsterHp - damageDealt);

            // 동일 유형 2회 정답 시 레벨 업 조건 충족
            if (this.comboCount >= 2) {
                isCombo = true;
                if (this.currentLevel < 10) {
                    this.currentLevel++;
                    levelUpOccurred = true;
                }
                this.comboCount = 0; // 레벨업 후 콤보 리셋
            }
        } else {
            // 틀릴 경우 플레이어가 피해를 받음 & 콤보 리셋
            this.comboCount = 0;
            this.lastTypeHandled = null;
            const playerDamage = 15 + (this.currentLevel * 2);
            this.playerHp = Math.max(0, this.playerHp - playerDamage);
        }

        return { isCorrect, damageDealt, isCombo, levelUpOccurred };
    }
}

const engine = new HunterMathEngine();

// UI 연동 함수
async function startBattle() {
    const file = document.getElementById('unit-select').value;
    const ok = await engine.loadUnit(file);
    if (ok) {
        updateUI();
        nextTurn();
    }
}

function nextTurn() {
    const q = engine.getQuestion();
    const container = document.getElementById('question-area');
    
    if (!q) {
        container.innerHTML = `<p>모든 토벌 완료 혹은 문제를 찾을 수 없습니다.</p>`;
        return;
    }

    const options = q.options.map(opt => 
        `<button class="option-btn" onclick="handleChoice('${opt}')">${opt}</button>`
    ).join('');

    container.innerHTML = `
        <div class="question-card">
            <span class="badge-level">LEVEL ${engine.currentLevel} | ${q.type_name}</span>
            <div class="question-text">${q.question}</div>
            <div class="options-grid">${options}</div>
        </div>
    `;
}

function handleChoice(option) {
    const monsterEl = document.getElementById('monster-avatar');
    const result = engine.processAnswer(option);

    if (result.isCorrect) {
        // 몬스터 피격 피드백
        monsterEl.classList.remove('hit-animation');
        void monsterEl.offsetWidth; // trigger reflow
        monsterEl.classList.add('hit-animation');
        showFloatingText(`-${result.damageDealt}` + (result.isCombo ? " COMBO!" : ""), "#ff0055");
    } else {
        // 몬스터 공격 피드백
        monsterEl.classList.remove('attack-animation');
        void monsterEl.offsetWidth;
        monsterEl.classList.add('attack-animation');
        showFloatingText(`-PLAYER HIT!`, "#ff4757");
    }

    updateUI();

    // 몬스터 처치 체크 후 다음 단계
    if (engine.monsterHp <= 0) {
        setTimeout(() => {
            alert(`🎉 ${MONSTER_SPECIES[engine.currentMonsterIdx].name} 토벌 성공! 다음 대형 몬스터가 출현합니다.`);
            engine.currentMonsterIdx = (engine.currentMonsterIdx + 1) % MONSTER_SPECIES.length;
            const nextMon = MONSTER_SPECIES[engine.currentMonsterIdx];
            engine.monsterHp = nextMon.hp;
            engine.maxMonsterHp = nextMon.hp;
            updateUI();
            nextTurn();
        }, 500);
    } else if (engine.playerHp <= 0) {
        alert("💀 수레에 타버렸습니다 (게임 오버). 다시 도전하세요!");
        engine.playerHp = engine.maxPlayerHp;
        engine.currentLevel = 1;
        updateUI();
        nextTurn();
    } else {
        setTimeout(nextTurn, 600);
    }
}

function showFloatingText(text, color) {
    const battleField = document.getElementById('battle-field');
    const floatEl = document.createElement('div');
    floatEl.className = 'floating-damage';
    floatEl.style.color = color;
    floatEl.style.right = '25%';
    floatEl.innerText = text;
    battleField.appendChild(floatEl);

    setTimeout(() => floatEl.remove(), 800);
}

function updateUI() {
    // 체력 게이지 업데이트
    const pPercent = (engine.playerHp / engine.maxPlayerHp) * 100;
    const mPercent = (engine.monsterHp / engine.maxMonsterHp) * 100;
    
    document.getElementById('player-hp-fill').style.width = `${pPercent}%`;
    document.getElementById('monster-hp-fill').style.width = `${mPercent}%`;
    document.getElementById('combo-display').innerText = `${engine.comboCount} COMBO`;

    // 몬스터 아이콘 및 정보
    const currentMon = MONSTER_SPECIES[engine.currentMonsterIdx];
    document.getElementById('monster-name').innerText = currentMon.name;
    document.getElementById('monster-avatar').innerHTML = currentMon.svg;
}
