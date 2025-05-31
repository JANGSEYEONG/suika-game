// pixi.js + matter.js 기반 완전 리팩토링 버전
// 1. 데이터 정의
const FRUITS = [
    { name: '체리', color: 0xff4b4b, radius: 18, score: 1 },
    { name: '딸기', color: 0xff7f50, radius: 22, score: 2 },
    { name: '포도', color: 0xa259e6, radius: 26, score: 4 },
    { name: '귤', color: 0xffb347, radius: 30, score: 8 },
    { name: '사과', color: 0xffec47, radius: 36, score: 16 },
    { name: '배', color: 0xbfff47, radius: 44, score: 32 },
    { name: '복숭아', color: 0xffb6b9, radius: 54, score: 64 },
    { name: '멜론', color: 0x47ffd1, radius: 66, score: 128 },
    { name: '수박', color: 0x47ff47, radius: 80, score: 256 }
];

// 2. PIXI 앱 생성
const GAME_WIDTH = 400;
const GAME_HEIGHT = window.innerHeight;
const TOP_LINE_Y = 100; // 상한선 y좌표
const app = new PIXI.Application({ width: GAME_WIDTH, height: GAME_HEIGHT, backgroundColor: 0x222222 });
document.getElementById('pixi-canvas').appendChild(app.view);

// 상한선 시각화
const topLine = new PIXI.Graphics();
topLine.lineStyle(3, 0xff4b4b, 0.7);
topLine.moveTo(0, TOP_LINE_Y);
topLine.lineTo(GAME_WIDTH, TOP_LINE_Y);
app.stage.addChild(topLine);

// 리사이즈 대응
window.addEventListener('resize', () => {
    app.renderer.resize(GAME_WIDTH, window.innerHeight);
});

// 3. matter.js 엔진 생성
const { Engine, Runner, World, Bodies, Events } = Matter;
const engine = Engine.create();
const world = engine.world;

// 4. 게임 상태 변수
let fruits = [];
let score = 0;
let gameOver = false;
let nextFruitType = getRandomFruitType();

// 5. 과일 단계 UI
function renderFruitStages() {
    const container = document.getElementById('fruit-stages');
    container.innerHTML = '';
    FRUITS.forEach((f, idx) => {
        const el = document.createElement('div');
        el.style.marginBottom = '16px';
        el.innerHTML = `<svg width=\"40\" height=\"40\"><circle cx=\"20\" cy=\"20\" r=\"${f.radius}\" fill=\"${PIXI.utils.hex2string(f.color)}\" stroke=\"#fff\" stroke-width=\"2\"/></svg>
        <div style=\"font-size:12px;color:#fff;\">${f.name}<br><span style=\"color:#47ff47;\">${f.score}</span></div>`;
        container.appendChild(el);
    });
}

// 6. 다음 과일 미리보기 UI
function renderNextFruit() {
    const container = document.getElementById('next-fruit');
    container.innerHTML = '';
    const f = FRUITS[nextFruitType];
    container.innerHTML = `<div style=\"color:#fff;font-size:13px;\">다음 과일</div>
    <svg width=\"60\" height=\"60\"><circle cx=\"30\" cy=\"30\" r=\"${f.radius}\" fill=\"${PIXI.utils.hex2string(f.color)}\" stroke=\"#fff\" stroke-width=\"2\"/></svg>
    <div style=\"color:#fff;font-size:14px;\">${f.name}</div>`;
}

// 7. 점수, 랭킹, 게임오버 등 기존 함수 유지
const scoreDiv = document.getElementById('score');
const rankingList = document.getElementById('ranking-list');
function updateScore(add) {
    score += add;
    scoreDiv.textContent = `점수: ${score}`;
}
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

// 8. matter.js: 바닥, 벽
World.add(world, [
    Bodies.rectangle(200, 600, 400, 40, { isStatic: true }),
    Bodies.rectangle(0, 300, 40, 600, { isStatic: true }),
    Bodies.rectangle(400, 300, 40, 600, { isStatic: true })
]);

// 9. pixi.js로 과일 렌더링, matter.js로 물리엔진 동작
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

// 10. pixi.js에서 matter.js 바디를 렌더링
const fruitSprites = new Map();
app.ticker.add(() => {
    fruitSprites.forEach((sprite, body) => {
        sprite.x = body.position.x;
        sprite.y = body.position.y;
        sprite.rotation = body.angle;
    });
});
let lastTimestamp = Date.now();
Events.on(engine, 'afterUpdate', function() {
    // 바디-스프라이트 동기화
    fruits.forEach(fruit => {
        if (!fruitSprites.has(fruit)) {
            const g = new PIXI.Graphics();
            g.beginFill(FRUITS[fruit.fruitType].color);
            g.lineStyle(2, 0xffffff);
            g.drawCircle(0, 0, FRUITS[fruit.fruitType].radius);
            g.endFill();
            app.stage.addChild(g);
            fruitSprites.set(fruit, g);
        }
    });
    // 게임 오버 체크 (상한선 기준, 시간 누적)
    const now = Date.now();
    const delta = Math.min((now - lastTimestamp), 100); // ms, 프레임 간격 보정
    lastTimestamp = now;
    if (!gameOver) {
        if (fruits.length > 1) {
            for (let fruit of fruits) {
                // 상한선 위에 있고, 속도가 느린 경우 누적 타이머 증가
                if (fruit.speed < 0.2 && (fruit.position.y - FRUITS[fruit.fruitType].radius < TOP_LINE_Y)) {
                    fruit.overTopLineTime = (fruit.overTopLineTime || 0) + delta;
                    if (fruit.overTopLineTime > 500) {
                        handleGameOver();
                        break;
                    }
                } else {
                    fruit.overTopLineTime = 0;
                }
            }
        }
    }
});

// 11. 합치기 로직 (충돌 감지)
Events.on(engine, 'collisionStart', function(event) {
    const pairs = event.pairs;
    for (let pair of pairs) {
        const a = pair.bodyA, b = pair.bodyB;
        if (a.isFruit && b.isFruit && a.fruitType === b.fruitType && !gameOver) {
            const newType = a.fruitType + 1;
            if (newType < FRUITS.length) {
                const x = (a.position.x + b.position.x) / 2;
                const y = (a.position.y + b.position.y) / 2;
                World.remove(world, a);
                World.remove(world, b);
                fruits = fruits.filter(f => f !== a && f !== b);
                app.stage.removeChild(fruitSprites.get(a));
                app.stage.removeChild(fruitSprites.get(b));
                fruitSprites.delete(a);
                fruitSprites.delete(b);
                spawnFruit(newType, x, y - FRUITS[newType].radius);
                updateScore(FRUITS[newType].score);
            }
        }
    }
});

// 12. 마우스 클릭 시 다음 과일 떨어뜨리기
app.view.addEventListener('click', (e) => {
    if (gameOver) return;
    const rect = app.view.getBoundingClientRect();
    const x = e.clientX - rect.left;
    spawnFruit(nextFruitType, x, 40);
    // 다음에 떨어질 과일을 미리 정해서 보여주기
    nextFruitType = getRandomFruitType();
    renderNextFruit();
});

document.getElementById('restart').addEventListener('click', () => {
    Matter.Composite.allBodies(world).forEach(b => {
        if (b.isFruit) World.remove(world, b);
    });
    fruits = [];
    fruitSprites.forEach(sprite => app.stage.removeChild(sprite));
    fruitSprites.clear();
    score = 0;
    gameOver = false;
    updateScore(0);
});

function getRandomFruitType() {
    return Math.floor(Math.random() * 5);
}

// 13. 초기화
renderFruitStages();
renderNextFruit();
updateScore(0);
updateRankingBoard();

// 14. matter.js 루프 실행
const runner = Runner.create();
Runner.run(runner, engine);
