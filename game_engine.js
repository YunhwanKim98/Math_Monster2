// A플랜: 고화질 몬스터 이미지 자원 정의 (로컬 파일 경로 또는 이미지 URL)
const MONSTER_SPECIES = [
    {
        name: "원망 누린 마가이마가도",
        hp: 150,
        idleImg: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=60", // 예시 고화질 이미지 URL (실제 이미지 파일로 대체 가능)
        hitImg: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=500&auto=format&fit=crop&q=60"
    },
    {
        name: "은작룡 멜-제나",
        hp: 250,
        idleImg: "https://images.unsplash.com/photo-1563089145-599997674d42?w=500&auto=format&fit=crop&q=60",
        hitImg: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=500&auto=format&fit=crop&q=60"
    }
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
        this.lastQuestionId = null; // 문제 중복 방지용 ID 변수
        this.currentUnitData = null;
        this.currentQuestion = null;
    }

    async loadUnit(unitFileName) {
        try {
            const res = await fetch(`./db/${unitFileName}`);
            if (!res.ok) throw new Error("파일 없음");
            this.currentUnitData = await res.json();
            return true;
        } catch(e) {
            console.error("DB 로드 실패:", e);
            alert(`db/${unitFileName} 파일을 불러올 수 없습니다.`);
            return false;
        }
    }

    getQuestion() {
        if (!this.currentUnitData) return null;
        const levelKey = `level_${this.currentLevel}`;
        const types = this.currentUnitData.levels[levelKey]?.types;
        
        if (!types || types.length === 0) return null;
        
        // 문제 중복 방지 로직 (유형이 2개 이상이면 이전 문제 제외)
        let availableTypes = types;
        if (types.length > 1 && this.lastQuestionId) {
            availableTypes = types.filter(t => t.type_id !== this.lastQuestionId);
        }

        const selectedType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        this.lastQuestionId = selectedType.type_id;
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
            // 동일 유형 연속 정답 시 콤보 체크
            if (this.lastTypeHandled === typeId) {
                this.comboCount++;
            } else {
                this.comboCount = 1;
                this.lastTypeHandled = typeId;
            }

            damageDealt = 20 + (this.comboCount > 1 ? (this.comboCount * 15) : 0);
            this.monsterHp = Math.max(0, this.monsterHp - damageDealt);

            // 동일 유형 2회 정답 시 레벨 업 조건
            if (this.comboCount >= 2) {
                isCombo = true;
                if (this.currentLevel < 10) {
                    this.currentLevel++;
                    levelUpOccurred = true;
                }
                this.comboCount = 0; // 레벨업 후 콤보 리셋
            }
        } else {
            this.comboCount = 0;
            this.lastTypeHandled = null;
            const playerDamage = 15 + (this.currentLevel * 2);
            this.playerHp = Math.max(0, this.playerHp - playerDamage);
        }

        return { isCorrect, damageDealt, isCombo, levelUpOccurred };
    }
}

const engine = new HunterMathEngine();

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
        container.innerHTML = `<p class="start-message">해당 레벨의 문제 데이터가 없습니다.</p>`;
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
    const monsterImgEl = document.getElementById('monster-img');
    const result = engine.processAnswer(option);
    const currentMon = MONSTER_SPECIES[engine.currentMonsterIdx];

    if (result.isCorrect) {
        // 정답시: 피격 애니메이션 및 이미지 교체 연출
        monsterImgEl.src = currentMon.hitImg;
        monsterImgEl.classList.remove('hit-animation');
        void monsterImgEl.offsetWidth;
        monsterImgEl.classList.add('hit-animation');
        
        showFloatingText(`-${result.damageDealt}` + (result.isCombo ? " COMBO!" : ""), "#ff0055");

        setTimeout(() => { monsterImgEl.src = currentMon.idleImg; }, 400);
    } else {
        // 오답시: 공격 애니메이션
        monsterImgEl.classList.remove('attack-animation');
        void monsterImgEl.offsetWidth;
        monsterImgEl.classList.add('attack-animation');
        
        showFloatingText(`-PLAYER HIT!`, "#ff4757");
    }

    updateUI();

    if (engine.monsterHp <= 0) {
        setTimeout(() => {
            alert(`🎉 ${currentMon.name} 토벌 완료!`);
            engine.currentMonsterIdx = (engine.currentMonsterIdx + 1) % MONSTER_SPECIES.length;
            const nextMon = MONSTER_SPECIES[engine.currentMonsterIdx];
            engine.monsterHp = nextMon.hp;
            engine.maxMonsterHp = nextMon.hp;
            updateUI();
            nextTurn();
        }, 500);
    } else if (engine.playerHp <= 0) {
        alert("💀 수레에 타버렸습니다. (게임 오버)");
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
    floatEl.innerText = text;
    battleField.appendChild(floatEl);

    setTimeout(() => floatEl.remove(), 800);
}

function updateUI() {
    const pPercent = (engine.playerHp / engine.maxPlayerHp) * 100;
    const mPercent = (engine.monsterHp / engine.maxMonsterHp) * 100;
    
    document.getElementById('player-hp-fill').style.width = `${pPercent}%`;
    document.getElementById('monster-hp-fill').style.width = `${mPercent}%`;
    document.getElementById('combo-display').innerText = `${engine.comboCount} COMBO`;

    const currentMon = MONSTER_SPECIES[engine.currentMonsterIdx];
    document.getElementById('monster-name').innerText = currentMon.name;
    
    const monsterImgEl = document.getElementById('monster-img');
    if (!monsterImgEl.src || monsterImgEl.src !== currentMon.idleImg) {
        monsterImgEl.src = currentMon.idleImg;
    }
}
