// matter.js 기반 완전 리팩토링 버전
const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const engine = Engine.create();
const world = engine.world;

const canvas = document.getElementById('gameCanvas');
const render = Render.create({
    canvas: canvas,
    engine: engine,
    options: {
        width: 400,
        height: 600,
        wireframes: false,
        background: "#222"
    }
});

Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

// 바닥, 벽 생성
World.add(world, [
    Bodies.rectangle(200, 600, 400, 40, { isStatic: true }), // 바닥
    Bodies.rectangle(0, 300, 40, 600, { isStatic: true }),   // 왼쪽 벽
    Bodies.rectangle(400, 300, 40, 600, { isStatic: true })  // 오른쪽 벽
]);

// 과일 데이터
const FRUITS = [
    { name: '체리', color: '#ff4b4b', radius: 18, score: 1 },
    { name: '딸기', color: '#ff7f50', radius: 22, score: 2 },
    { name: '포도', color: '#a259e6', radius: 26, score: 4 },
    { name: '귤', color: '#ffb347', radius: 30, score: 8 },
    { name: '사과', color: '#ffec47', radius: 36, score: 16 },
    { name: '배', color: '#bfff47', radius: 44, score: 32 },
    { name: '복숭아', color: '#ffb6b9', radius: 54, score: 64 },
    { name: '멜론', color: '#47ffd1', radius: 66, score: 128 },
    { name: '수박', color: '#47ff47', radius: 80, score: 256 }
];

let fruits = [];
let score = 0;
let gameOver = false;

function randomFruitType() {
    return Math.floor(Math.random() * 5); // 0~4
}

function spawnFruit(type, x = 200, y = 40) {
    const fruit = Bodies.circle(x, y, FRUITS[type].radius, {
        restitution: 0.3,
        render: { fillStyle: FRUITS[type].color }
    });
    fruit.fruitType = type;
    fruit.isFruit = true;
    World.add(world, fruit);
    fruits.push(fruit);
    return fruit;
}

// 점수 UI
const scoreDiv = document.getElementById('score');
function updateScore(add) {
    score += add;
    scoreDiv.textContent = `점수: ${score}`;
}

// 랭킹 보드
const rankingList = document.getElementById('ranking-list');
function saveRanking(name, score) {
    let rankings = JSON.parse(localStorage.getItem('suika-rankings') || '[]');
    rankings.push({ name, score });
    rankings.sort((a, b) => b.score - a.score);
    rankings = rankings.slice(0, 10);
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

// 게임 오버
function handleGameOver() {
    if (gameOver) return;
    gameOver = true;
    let name = prompt('게임 오버!\n이름을 입력하세요 (최대 8자):', '익명');
    if (!name) name = '익명';
    name = name.slice(0, 8);
    saveRanking(name, score);
    updateRankingBoard();
    alert('점수: ' + score);
}

// 마우스 클릭 시 과일 떨어뜨리기
canvas.addEventListener('click', (e) => {
    if (gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const type = randomFruitType();
    spawnFruit(type, x, 40);
});

document.getElementById('restart').addEventListener('click', () => {
    // 월드의 모든 바디 삭제 (벽, 바닥 제외)
    Matter.Composite.allBodies(world).forEach(b => {
        if (b.isFruit) World.remove(world, b);
    });
    fruits = [];
    score = 0;
    gameOver = false;
    updateScore(0);
});

// 합치기 로직 (충돌 감지)
Events.on(engine, 'collisionStart', function(event) {
    const pairs = event.pairs;
    for (let pair of pairs) {
        const a = pair.bodyA, b = pair.bodyB;
        if (a.isFruit && b.isFruit && a.fruitType === b.fruitType && !gameOver) {
            // 두 과일이 같은 타입이면 합치기
            const newType = a.fruitType + 1;
            if (newType < FRUITS.length) {
                const x = (a.position.x + b.position.x) / 2;
                const y = (a.position.y + b.position.y) / 2;
                World.remove(world, a);
                World.remove(world, b);
                fruits = fruits.filter(f => f !== a && f !== b);
                spawnFruit(newType, x, y - FRUITS[newType].radius); // 살짝 위에 생성
                updateScore(FRUITS[newType].score);
            }
        }
    }
});

// 게임 오버 체크 (과일이 화면 위로 올라가면)
Events.on(engine, 'afterUpdate', function() {
    if (gameOver) return;
    for (let fruit of fruits) {
        if (fruit.position.y - FRUITS[fruit.fruitType].radius < 0) {
            handleGameOver();
            break;
        }
    }
});

// 초기화
updateScore(0);
updateRankingBoard();
