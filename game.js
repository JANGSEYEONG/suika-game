// 개선된 수박 게임 (Suika Game) - 합체 로직 강화
// 마우스 위치에 과일이 따라다니고, 클릭 시 실제로 떨어짐
// 바닥/과일 충돌 시 멈추고, 합쳐짐. 하단에 과일 단계 표시

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDiv = document.getElementById('score');
const restartBtn = document.getElementById('restart');

const FRUITS = [
    {name: '체리', color: '#ff4b4b', radius: 18, score: 1},
    {name: '딸기', color: '#ff7f50', radius: 22, score: 2},
    {name: '포도', color: '#a259e6', radius: 26, score: 4},
    {name: '귤', color: '#ffb347', radius: 30, score: 8},
    {name: '사과', color: '#ffec47', radius: 36, score: 16},
    {name: '배', color: '#bfff47', radius: 44, score: 32},
    {name: '복숭아', color: '#ffb6b9', radius: 54, score: 64},
    {name: '멜론', color: '#47ffd1', radius: 66, score: 128},
    {name: '수박', color: '#47ff47', radius: 80, score: 256}
];

let fruits = [];
let fallingFruit = null;
let isReadyToDrop = true;
let score = 0;
let gameOver = false;

function randomFruit() {
    return 0; // 항상 체리부터 시작
}

function spawnFruit() {
    fallingFruit = {
        type: randomFruit(),
        x: canvas.width / 2,
        y: 40,
        vx: 0,
        vy: 0,
        radius: FRUITS[0].radius,
        merged: false
    };
    isReadyToDrop = true;
}

function drawFruit(fruit) {
    ctx.beginPath();
    ctx.arc(fruit.x, fruit.y, FRUITS[fruit.type].radius, 0, Math.PI * 2);
    ctx.fillStyle = FRUITS[fruit.type].color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.stroke();
}

function drawStages() {
    const y = canvas.height - 30;
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#222';
    ctx.fillRect(0, y - 20, canvas.width, 40);
    ctx.globalAlpha = 1.0;
    const gap = 10;
    let x = gap;
    for (let i = 0; i < FRUITS.length; i++) {
        ctx.beginPath();
        ctx.arc(x + FRUITS[i].radius, y, FRUITS[i].radius, 0, Math.PI * 2);
        ctx.fillStyle = FRUITS[i].color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.stroke();
        ctx.fillStyle = '#222';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(FRUITS[i].name, x + FRUITS[i].radius, y + FRUITS[i].radius + 10);
        x += FRUITS[i].radius * 2 + gap;
    }
    ctx.restore();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const fruit of fruits) {
        drawFruit(fruit);
    }
    if (fallingFruit) drawFruit(fallingFruit);
    drawStages();
}

function update() {
    if (fallingFruit && !isReadyToDrop) {
        fallingFruit.vy += 0.3;
        fallingFruit.x += fallingFruit.vx;
        fallingFruit.y += fallingFruit.vy;

        if (fallingFruit.x - FRUITS[fallingFruit.type].radius < 0) {
            fallingFruit.x = FRUITS[fallingFruit.type].radius;
            fallingFruit.vx *= -0.5;
        }
        if (fallingFruit.x + FRUITS[fallingFruit.type].radius > canvas.width) {
            fallingFruit.x = canvas.width - FRUITS[fallingFruit.type].radius;
            fallingFruit.vx *= -0.5;
        }

        if (fallingFruit.y + FRUITS[fallingFruit.type].radius >= canvas.height - 40) {
            fallingFruit.y = canvas.height - 40 - FRUITS[fallingFruit.type].radius;
            fruits.push(fallingFruit);
            fallingFruit = null;
            setTimeout(checkMerge, 10);
            setTimeout(spawnFruit, 20);
        } else {
            for (const fruit of fruits) {
                const dx = fruit.x - fallingFruit.x;
                const dy = fruit.y - fallingFruit.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < FRUITS[fruit.type].radius + FRUITS[fallingFruit.type].radius) {
                    fallingFruit.y = fruit.y - FRUITS[fruit.type].radius - FRUITS[fallingFruit.type].radius;
                    fruits.push(fallingFruit);
                    fallingFruit = null;
                    setTimeout(checkMerge, 10);
                    setTimeout(spawnFruit, 20);
                    break;
                }
            }
        }
    }
}

function checkMerge() {
    let merged = false;
    let toRemove = new Set();
    let toAdd = [];
    // 모든 쌍을 체크하여 합칠 수 있으면 합치기
    for (let i = 0; i < fruits.length; i++) {
        for (let j = i + 1; j < fruits.length; j++) {
            if (toRemove.has(i) || toRemove.has(j)) continue;
            if (fruits[i].type === fruits[j].type) {
                const dx = fruits[i].x - fruits[j].x;
                const dy = fruits[i].y - fruits[j].y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < FRUITS[fruits[i].type].radius + FRUITS[fruits[j].type].radius - 2) {
                    const newType = fruits[i].type + 1;
                    if (newType < FRUITS.length) {
                        const newFruit = {
                            type: newType,
                            x: (fruits[i].x + fruits[j].x) / 2,
                            y: (fruits[i].y + fruits[j].y) / 2,
                            vx: 0,
                            vy: 0,
                            radius: FRUITS[newType].radius,
                            merged: false
                        };
                        toRemove.add(i);
                        toRemove.add(j);
                        toAdd.push(newFruit);
                        score += FRUITS[newType].score;
                        scoreDiv.textContent = `점수: ${score}`;
                        merged = true;
                    }
                }
            }
        }
    }
    // 실제로 합치기 적용
    if (toRemove.size > 0) {
        fruits = fruits.filter((_, idx) => !toRemove.has(idx));
        fruits = fruits.concat(toAdd);
    }
    // 연쇄 합체
    if (merged) setTimeout(checkMerge, 10);
    // 게임 오버 체크
    for (const fruit of fruits) {
        if (fruit.y - FRUITS[fruit.type].radius < 0) {
            gameOver = true;
            setTimeout(() => { alert('게임 오버!\n점수: ' + score); }, 100);
            break;
        }
    }
}

canvas.addEventListener('mousemove', (e) => {
    if (fallingFruit && isReadyToDrop && !gameOver) {
        const rect = canvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        x = Math.max(FRUITS[fallingFruit.type].radius, Math.min(canvas.width - FRUITS[fallingFruit.type].radius, x));
        fallingFruit.x = x;
    }
});

canvas.addEventListener('click', (e) => {
    if (fallingFruit && isReadyToDrop && !gameOver) {
        isReadyToDrop = false;
        fallingFruit.vy = 2;
    }
});

restartBtn.addEventListener('click', () => {
    fruits = [];
    score = 0;
    gameOver = false;
    scoreDiv.textContent = '점수: 0';
    spawnFruit();
});

function gameLoop() {
    if (!gameOver) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

// 게임 시작
spawnFruit();
gameLoop();
