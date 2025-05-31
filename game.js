// 간단한 수박 게임 (Suika Game) 구현
// 과일이 떨어져 쌓이고, 같은 과일이 합쳐지면 더 큰 과일로 변함

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
}

function drawFruit(fruit) {
    ctx.beginPath();
    ctx.arc(fruit.x, fruit.y, FRUITS[fruit.type].radius, 0, Math.PI * 2);
    ctx.fillStyle = FRUITS[fruit.type].color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.stroke();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const fruit of fruits) {
        drawFruit(fruit);
    }
    if (fallingFruit) drawFruit(fallingFruit);
}

function update() {
    if (fallingFruit) {
        fallingFruit.vy += 0.3; // 중력
        fallingFruit.x += fallingFruit.vx;
        fallingFruit.y += fallingFruit.vy;

        // 벽 충돌
        if (fallingFruit.x - FRUITS[fallingFruit.type].radius < 0) {
            fallingFruit.x = FRUITS[fallingFruit.type].radius;
            fallingFruit.vx *= -0.5;
        }
        if (fallingFruit.x + FRUITS[fallingFruit.type].radius > canvas.width) {
            fallingFruit.x = canvas.width - FRUITS[fallingFruit.type].radius;
            fallingFruit.vx *= -0.5;
        }

        // 바닥 충돌
        if (fallingFruit.y + FRUITS[fallingFruit.type].radius >= canvas.height) {
            fallingFruit.y = canvas.height - FRUITS[fallingFruit.type].radius;
            fruits.push(fallingFruit);
            fallingFruit = null;
            checkMerge();
            spawnFruit();
        } else {
            // 다른 과일과 충돌
            for (const fruit of fruits) {
                const dx = fruit.x - fallingFruit.x;
                const dy = fruit.y - fallingFruit.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < FRUITS[fruit.type].radius + FRUITS[fallingFruit.type].radius) {
                    // 충돌
                    fallingFruit.y = fruit.y - FRUITS[fruit.type].radius - FRUITS[fallingFruit.type].radius;
                    fruits.push(fallingFruit);
                    fallingFruit = null;
                    checkMerge();
                    spawnFruit();
                    break;
                }
            }
        }
    }
}

function checkMerge() {
    let merged = false;
    for (let i = 0; i < fruits.length; i++) {
        for (let j = i + 1; j < fruits.length; j++) {
            if (fruits[i].type === fruits[j].type) {
                const dx = fruits[i].x - fruits[j].x;
                const dy = fruits[i].y - fruits[j].y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < FRUITS[fruits[i].type].radius + FRUITS[fruits[j].type].radius - 2) {
                    // 합치기
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
                        fruits.splice(j, 1);
                        fruits.splice(i, 1);
                        fruits.push(newFruit);
                        score += FRUITS[newType].score;
                        scoreDiv.textContent = `점수: ${score}`;
                        merged = true;
                        break;
                    }
                }
            }
        }
        if (merged) break;
    }
    // 게임 오버 체크
    for (const fruit of fruits) {
        if (fruit.y - FRUITS[fruit.type].radius < 0) {
            gameOver = true;
            alert('게임 오버!\n점수: ' + score);
            break;
        }
    }
}

canvas.addEventListener('mousemove', (e) => {
    if (fallingFruit && !gameOver) {
        const rect = canvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        x = Math.max(FRUITS[fallingFruit.type].radius, Math.min(canvas.width - FRUITS[fallingFruit.type].radius, x));
        fallingFruit.x = x;
    }
});

canvas.addEventListener('click', (e) => {
    if (fallingFruit && fallingFruit.vy === 0 && !gameOver) {
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
