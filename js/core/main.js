
/**
 * THE MASHACRE - Main Game Loop & Logic
 */

// --- Game State ---
// sfx is now global from UIManager/SettingsMenu
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let isPaused = false;
let isGameOver = false;
let frameCount = 0;
let score = 0;
let gameTime = 0;
let lastTime = 0;
let nextBossTime = 180; // First boss at 3 minutes
let nextBossLevel = 999; // Level requirement for first boss (Time only initially)
let bossKills = 0; // Track progress
let spatulaTimer = 0; // Timer for Golden Spatula
let spatulaInitialDelay = 0; // Delay before first spawn

// Helper to set pacing
window.updateBossPacing = function (currentLevel) {
    if (bossKills >= 3) {
        // IMMEDIATE KING SPAWN
        nextBossTime = gameTime;
        nextBossLevel = currentLevel; // Unlock level req immediately too
    } else {
        nextBossTime = gameTime + 180;
        nextBossLevel = currentLevel + 10;
    }
};

// --- Spatial Grid (Optimization) ---
class SpatialGrid {
    constructor(width, height, cellSize) {
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        this.buckets = new Map();
    }
    clear() {
        this.buckets.clear();
    }
    getKey(x, y) {
        // Handle negative coordinates safely by offsetting? 
        // Or hash key string "col,row"
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        return `${col},${row}`;
    }
    insert(entity) {
        const key = this.getKey(entity.x, entity.y);
        if (!this.buckets.has(key)) this.buckets.set(key, []);
        this.buckets.get(key).push(entity);
    }
    getNearby(entity) {
        const col = Math.floor(entity.x / this.cellSize);
        const row = Math.floor(entity.y / this.cellSize);
        const nearby = [];

        // Check 3x3 neighbors
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const key = `${col + i},${row + j}`;
                if (this.buckets.has(key)) {
                    const bucket = this.buckets.get(key);
                    for (let other of bucket) nearby.push(other);
                }
            }
        }
        return nearby;
    }
}
const spatialGrid = new SpatialGrid(100000, 100000, 100); // Conceptually large, keys handle it
// Note: Canvas size is viewport, world is infinite? Game logic spawns relative to player.
// Since keys can be negative, standard array grid fails. Hashed Map works.


const camera = { x: 0, y: 0, shake: 0 };
// Keys and Mouse moved to Input.js

// Entities
let player;
let enemies = [];
let gems = [];
let projectiles = [];
let enemyProjectiles = [];
let damageNumbers = [];
let particles = [];
let splats = [];
let mines = [];
let pickups = [];
let activeBoss = null;

// --- Logic ---

// startGame moved to UIManager.js

function spawnEnemy() {
    if (enemies.length >= 300) return; // Lag Prevention Cap
    let angle;

    // Check Movement for Bias
    let dx = 0, dy = 0;
    if (keys.w || keys.ArrowUp) dy = -1;
    if (keys.s || keys.ArrowDown) dy = 1;
    if (keys.a || keys.ArrowLeft) dx = -1;
    if (keys.d || keys.ArrowRight) dx = 1;

    // Swarm Bias: Spawn behind existing groups (60% chance if swarm exists)
    let swarmTarget = false;
    if (enemies.length > 20 && Math.random() < 0.6) {
        // Calculate Center of Mass (Sampled)
        let sx = 0, sy = 0, count = 0;
        const step = Math.max(1, Math.floor(enemies.length / 20));
        for (let i = 0; i < enemies.length; i += step) {
            sx += enemies[i].x;
            sy += enemies[i].y;
            count++;
        }
        if (count > 0) {
            const cx = sx / count;
            const cy = sy / count;
            // Angle from Player to Center
            const swarmAngle = Math.atan2(cy - player.y, cx - player.x);
            // Add spread
            angle = swarmAngle + (Math.random() - 0.5) * 0.8;
            swarmTarget = true;
        }
    }

    // Input Bias (Fallback if no swarm target or failed roll)
    if (!swarmTarget) {
        // If moving, 90% chance to spawn BEHIND
        if ((dx !== 0 || dy !== 0) && Math.random() < 0.9) {
            const moveAngle = Math.atan2(dy, dx);
            const rearAngle = moveAngle + Math.PI; // 180 deg (behind)
            // Add random spread (+/- 60 degrees = PI/3)
            angle = rearAngle + (Math.random() - 0.5) * (Math.PI / 1.5);
        } else {
            // Random spawn
            angle = Math.random() * Math.PI * 2;
        }
    }

    const dist = (Math.max(canvas.width, canvas.height) / 2) + 150;
    const x = player.x + Math.cos(angle) * dist;
    const y = player.y + Math.sin(angle) * dist;
    enemies.push(new Enemy(x, y));
}

function spawnBoss(isKing = false) {
    const angle = Math.random() * Math.PI * 2;
    const dist = (Math.max(canvas.width, canvas.height) / 2) + 200;
    const x = player.x + Math.cos(angle) * dist;
    const y = player.y + Math.sin(angle) * dist;
    const boss = new Boss(x, y, isKing);
    enemies.push(boss);
    activeBoss = boss;

    document.getElementById('boss-text').innerText = boss.name;
    document.getElementById('boss-bar-container').style.display = 'block';

    sfx.playBossSpawn();
    camera.shake = isKing ? 50 : 30;
}

// gameWin, gameOver, updateUI, togglePause, triggerLevelUp, resumeGame moved to UIManager.js

function drawBackground(ctx) {
    const gs = CONSTANTS.GRID_SIZE;

    // Safety Bounds
    if (!isFinite(camera.x) || !isFinite(camera.y)) { camera.x = 0; camera.y = 0; }

    const halfW = canvas.width / 2;
    const halfH = canvas.height / 2;
    const startX = Math.floor((camera.x - halfW) / gs) * gs;
    const endX = Math.ceil((camera.x + halfW) / gs) * gs;
    const startY = Math.floor((camera.y - halfH) / gs) * gs;
    const endY = Math.ceil((camera.y + halfH) / gs) * gs;

    // Batch all lines into a single path for better performance
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let x = startX - gs; x <= endX + gs; x += gs) {
        ctx.moveTo(x, startY - gs);
        ctx.lineTo(x, endY + gs);
    }
    for (let y = startY - gs; y <= endY + gs; y += gs) {
        ctx.moveTo(startX - gs, y);
        ctx.lineTo(endX + gs, y);
    }
    ctx.stroke();
}

function loop(timestamp) {
    if (isPaused) return;
    if (!player) {
        requestAnimationFrame(loop);
        return;
    }

    // Delta time for consistent game speed regardless of frame rate
    const deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1); // Cap at 100ms to prevent spiral of death
    lastTime = timestamp;
    gameTime += deltaTime;
    frameCount++;

    // Boss Spawn Logic
    if (!activeBoss && (gameTime > nextBossTime || player.level >= nextBossLevel)) {
        if (bossKills >= 3) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 1200;
            const bx = player.x + Math.cos(angle) * dist;
            const by = player.y + Math.sin(angle) * dist;
            activeBoss = new MashKing(bx, by);
            enemies.push(activeBoss);

            sfx.playBoss();
            document.getElementById('boss-bar-container').style.display = 'block';
            document.getElementById('boss-name').innerText = "THE MASH KING";
        } else {
            spawnBoss(false);
            nextBossTime = gameTime + 120;
        }
    }

    // Spawning logic
    checkFormationEvents();

    if (!activeBoss || frameCount % 3 === 0) {
        let spawnRate = Math.max(10, CONSTANTS.ENEMY_SPAWN_RATE - (player.level * 2));
        if (frameCount % Math.floor(spawnRate) === 0) {
            const count = 1 + Math.floor(player.level / 2.5);

            // Calculate Player Movement Direction
            let dx = 0; let dy = 0;
            if (keys.w || keys.ArrowUp) dy = -1;
            if (keys.s || keys.ArrowDown) dy = 1;
            if (keys.a || keys.ArrowLeft) dx = -1;
            if (keys.d || keys.ArrowRight) dx = 1;

            let baseAngle = Math.random() * Math.PI * 2;
            // If moving, bias spawn to the REAR (Back of swarm)
            if (dx !== 0 || dy !== 0) {
                const moveAngle = Math.atan2(dy, dx);
                // Spawn arc: Behind player (+PI) with +/- 100 degree spread
                baseAngle = moveAngle + Math.PI + (Math.random() - 0.5) * 3.5;
            }

            for (let i = 0; i < count; i++) {
                // Slight variation per enemy in batch
                const angle = baseAngle + (Math.random() - 0.5) * 1.0;
                const dist = 1100 + Math.random() * 300;
                const ex = player.x + Math.cos(angle) * dist;
                const ey = Math.sin(angle) * dist + player.y;

                if (player.level > 5 && Math.random() < 0.1) {
                    enemies.push(new BakedPotato(ex, ey));
                } else {
                    enemies.push(new Enemy(ex, ey));
                }
            }
        }
    }

    // --- Performance Caps (using length assignment is faster than splice) ---
    if (particles.length > 200) particles.length = 200;
    if (splats.length > 250) splats.length = 250; // Lower cap for a cleaner playfield
    if (damageNumbers.length > 60) damageNumbers.length = 60;

    // Update Mouse World Position (Logic maintained but using global mouse from Input.js)
    if (mouse) {
        mouse.wx = mouse.x - canvas.width / 2 + camera.x;
        mouse.wy = mouse.y - canvas.height / 2 + camera.y;
    }

    player.update();

    camera.x += (player.x - camera.x) * 0.1;
    camera.y += (player.y - camera.y) * 0.1;

    if (camera.shake > 0) camera.shake *= 0.9;
    if (camera.shake < 0.5) camera.shake = 0;

    // Use reverse iteration to safely remove items during update
    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].update();
        if (!projectiles[i].active) projectiles.splice(i, 1);
    }

    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        enemyProjectiles[i].update();
        if (!enemyProjectiles[i].active) enemyProjectiles.splice(i, 1);
    }

    for (let i = mines.length - 1; i >= 0; i--) {
        mines[i].update();
        if (mines[i].life <= 0) mines.splice(i, 1);
    }

    for (let i = splats.length - 1; i >= 0; i--) {
        if (!splats[i].update()) splats.splice(i, 1);
    }

    // --- Physics Optimization step ---
    spatialGrid.clear();
    enemies.forEach(e => spatialGrid.insert(e));

    pickups = pickups.filter(p => p.update());
    enemies.forEach(e => e.update());

    if (activeBoss) window.uiDirty = true;

    // Throttled UI Render (Once per frame max)
    if (window.uiDirty) {
        renderUI();
        window.uiDirty = false;
    }

    if (typeof gemManager !== 'undefined') {
        gemManager.update();
    } else {
        gems = gems.filter(g => g.update());
    }
    particles = particles.filter(p => p.update());
    damageNumbers = damageNumbers.filter(d => d.update());

    // --- Render ---
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const sx = (Math.random() - 0.5) * camera.shake;
    const sy = (Math.random() - 0.5) * camera.shake;

    ctx.translate(Math.floor(cx - camera.x + sx), Math.floor(cy - camera.y + sy));

    drawBackground(ctx);

    splats.forEach(s => s.draw(ctx));
    mines.forEach(m => m.draw(ctx));
    if (typeof gemManager !== 'undefined') {
        gemManager.draw(ctx);
    } else {
        gems.forEach(g => g.draw(ctx));
    }
    pickups.forEach(p => p.draw(ctx));
    projectiles.forEach(p => p.draw(ctx));
    enemyProjectiles.forEach(p => p.draw(ctx));
    player.draw(ctx);

    enemies.sort((a, b) => (a.type === 'boss' ? 1 : -1));
    enemies.forEach(e => e.draw(ctx));
    particles.forEach(p => p.draw(ctx));
    damageNumbers.forEach(d => d.draw(ctx));

    ctx.restore();

    // --- UI Layer ---

    // Spatula Logic
    if (bossKills >= 1) {
        // Delayed First Spawn (10s wait)
        if (!window.hasSpawnedFirstSpatula) {
            spatulaInitialDelay++;
            if (spatulaInitialDelay > 1200) { // 20 seconds
                window.hasSpawnedFirstSpatula = true;
                // Spawn Spatula (10,000px)
                const angle = Math.random() * Math.PI * 2;
                const dist = 10000;
                pickups.push(new GoldenSpatula(player.x + Math.cos(angle) * dist, player.y + Math.sin(angle) * dist));

                // QUEST NOTIFICATION
                damageNumbers.push(new FloatingText(player.x, player.y - 150, "QUEST UNLOCKED!", "gold", 240, 40));
                damageNumbers.push(new FloatingText(player.x, player.y - 100, "FOLLOW THE ARROW FOR REWARD!", "white", 240, 24));

                spatulaTimer = 0; // Reset timer
                if (sfx && sfx.playBossSpawn) sfx.playBossSpawn();
            }
        } else {
            // Periodic Spawn logic only runs after first spawn
            spatulaTimer++;
            if (spatulaTimer > 18000) {
                spatulaTimer = 0;
                const angle = Math.random() * Math.PI * 2;
                const dist = 10000;
                pickups.push(new GoldenSpatula(player.x + Math.cos(angle) * dist, player.y + Math.sin(angle) * dist));

                // QUEST NOTIFICATION (Periodic)
                damageNumbers.push(new FloatingText(player.x, player.y - 150, "QUEST ACTIVE!", "gold", 180, 40));
                damageNumbers.push(new FloatingText(player.x, player.y - 100, "FOLLOW THE ARROW!", "white", 180, 24));

                if (sfx && sfx.playBossSpawn) sfx.playBossSpawn();
            }
        }
    }



    drawSpatulaArrow(ctx); // Function from UIManager.js

    requestAnimationFrame(loop);
}

function init() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    player = new Player();
    if (typeof GemManager !== 'undefined') window.gemManager = new GemManager();
    initInput(); // from Input.js
    lastTime = performance.now();
    updateUI(); // from UIManager.js
    loop(lastTime);
}
