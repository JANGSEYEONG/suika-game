// 랭킹보드 기능 추가
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDiv = document.getElementById('score');
const restartBtn = document.getElementById('restart');
const rankingList = document.getElementById('ranking-list');

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
    // 0~4(체리~사과) 중 랜덤
    return Math.floor(Math.random() * 5);
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
    fallingFruit.radius = FRUITS[fallingFruit.type].radius;
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
            // 바닥에 닿았을 때 좌우로 빈 공간이 있으면 굴러가게
            let leftSpace = fallingFruit.x - fallingFruit.radius;
            let rightSpace = canvas.width - (fallingFruit.x + fallingFruit.radius);
            if (leftSpace > 10 && rightSpace > 10) {
                // 양쪽 다 여유가 있으면 랜덤하게 좌우로 굴림
                fallingFruit.vx = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 2 + 1);
            } else if (leftSpace > 10) {
                fallingFruit.vx = -1 * (Math.random() * 2 + 1);
            } else if (rightSpace > 10) {
                fallingFruit.vx = (Math.random() * 2 + 1);
            } else {
                fallingFruit.vx = 0;
            }
            // 마찰 효과로 점점 멈추게
            fallingFruit.vy *= 0.5;
            if (Math.abs(fallingFruit.vx) > 0.2) {
                // 아직 충분히 굴러갈 힘이 있으면 멈추지 않고 계속 update
                fallingFruit.y += 1; // 살짝 더 아래로
                return;
            }
            fruits.push(fallingFruit);
            fallingFruit = null;
            setTimeout(checkMerge, 10);
            setTimeout(spawnFruit, 20);
        } else {
            for (const fruit of fruits) {
                const dx = fruit.x - fallingFruit.x;
                const dy = fruit.y - fallingFruit.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < (FRUITS[fruit.type].radius + FRUITS[fallingFruit.type].radius) * 0.9) {
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
    // UI 즉시 갱신
    draw();
    let merged = false;
    let toRemove = new Set();
    let toAdd = [];
    for (let i = 0; i < fruits.length; i++) {
        for (let j = i + 1; j < fruits.length; j++) {
            if (toRemove.has(i) || toRemove.has(j)) continue;
            if (fruits[i].type === fruits[j].type) {
                const dx = fruits[i].x - fruits[j].x;
                const dy = fruits[i].y - fruits[j].y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < (FRUITS[fruits[i].type].radius + FRUITS[fruits[j].type].radius) * 0.9) {
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
    if (toRemove.size > 0) {
        fruits = fruits.filter((_, idx) => !toRemove.has(idx));
        fruits = fruits.concat(toAdd);
        draw(); // 합쳐진 직후 UI 갱신
    }
    if (merged) setTimeout(checkMerge, 10);
    for (const fruit of fruits) {
        if (fruit.y - FRUITS[fruit.type].radius < 0) {
            gameOver = true;
            setTimeout(() => { 
                handleGameOver();
            }, 100);
            break;
        }
    }
}

function handleGameOver() {
    let name = prompt('게임 오버!\n이름을 입력하세요 (최대 8자):', '익명');
    if (!name) name = '익명';
    name = name.slice(0, 8);
    saveRanking(name, score);
    updateRankingBoard();
    alert('점수: ' + score);
}

function saveRanking(name, score) {
    let rankings = JSON.parse(localStorage.getItem('suika-rankings') || '[]');
    rankings.push({ name, score });
    rankings.sort((a, b) => b.score - a.score);
    rankings = rankings.slice(0, 10); // 상위 10개만
    localStorage.setItem('suika-rankings', JSON.stringify(rankings));
}

function updateRankingBoard() {
    let rankings = JSON.parse(localStorage.getItem('suika-rankings') || '[]');
    rankingList.innerHTML = '';
    rankings.forEach((r, i) => {
        const li = document.createElement('li');
        li.textContent = `${i + 1}. ${r.name} - ${r.score}`;
        rankingList.appendChild(li);
    });
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
    updateRankingBoard();
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
updateRankingBoard();
gameLoop();
