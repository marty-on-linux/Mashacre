// --- Enemy Formations & Events ---

let formationTimer = 0;
let hasTriggeredFirstStampede = false;

// Stampede Sequence State
let stampedeActive = false;
let stampedeWave = 0;
let stampedeDelay = 0;

class StampedeKnife extends Enemy {
    constructor(x, y, direction) {
        super(x, y);
        this.type = 'stampede';
        this.direction = direction; // 'right' or 'down'

        // TUNING: 2x Normal Enemy Speed -> 3.5
        this.speed = 3.5;

        // TUNING: Large Hitbox for "Wall" feel
        this.size = 20;
        this.hp = 10 + (player.level * 3);
    }

    update() {
        // OVERRIDE MOVEMENT: Directional
        if (this.direction === 'right') {
            this.x += this.speed;
        } else if (this.direction === 'down') {
            this.y += this.speed;
        }

        // Cleanup if off screen
        if (this.x > player.x + 2000 || this.y > player.y + 2000) {
            this.hp = 0;
            this.die(true);
        }

        // Damage Player
        const dToPlayer = Math.hypot(this.x - player.x, this.y - player.y);
        if (dToPlayer < this.size + player.radius) {
            player.takeDamage(40);
        }

        if (this.flashTime > 0) this.flashTime--;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Rotate based on direction
        // Default drawing points RIGHT. 
        if (this.direction === 'down') {
            ctx.rotate(Math.PI / 2);
        }

        // Visuals: Flying Butcher Knife

        // Blade (Silver)
        ctx.fillStyle = '#C0C0C0';
        ctx.strokeStyle = '#808080';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(-10, -10);
        ctx.lineTo(30, -10); // Top edge
        ctx.lineTo(40, 0);   // Point
        ctx.lineTo(30, 20);  // Curve down
        ctx.lineTo(-10, 20); // Bottom edge near handle
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Shine on Blade
        ctx.fillStyle = 'white';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, -5); ctx.lineTo(25, -5); ctx.lineTo(28, 0); ctx.lineTo(0, 0);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Handle (Black/Brown)
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(-25, -5, 15, 20);

        // Rivets
        ctx.fillStyle = '#d7ccc8';
        ctx.beginPath(); ctx.arc(-20, 0, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-20, 10, 2, 0, Math.PI * 2); ctx.fill();

        if (this.flashTime > 0) {
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(-30, -30, 80, 80);
        }

        ctx.restore();
    }

    die(silent = false) {
        if (silent) {
            const index = enemies.indexOf(this);
            if (index > -1) enemies.splice(index, 1);
            return;
        }
        super.die();
    }
}

function spawnStampedeWave(waveNum) {
    // Wave 1, 3, 5: LEFT -> RIGHT ?? No, user said:
    // Wave 1, 3, 5: Horizontal line at TOP moving DOWN.
    // Wave 2, 4: Vertical line at LEFT moving RIGHT.

    const isTopDown = (waveNum % 2 !== 0); // 1, 3, 5 are Top-Down

    if (isTopDown) {
        // Horizontal Line at Top
        const startY = player.y - 600; // Above screen
        const startX = player.x - 800; // Start far left to cover width
        const gap = 60; // Tighter spacing for "Wall"
        const count = 30; // Cover wide area

        for (let i = 0; i < count; i++) {
            enemies.push(new StampedeKnife(startX + (i * gap), startY, 'down'));
        }
        damageNumbers.push(new FloatingText(player.x, player.y - 200, `WAVE ${waveNum}: KNIVES FROM ABOVE!`, "red"));

    } else {
        // Vertical Line at Left
        const startX = player.x - 900; // Left of screen
        const startY = player.y - 600;
        const gap = 60;
        const count = 20;

        for (let i = 0; i < count; i++) {
            enemies.push(new StampedeKnife(startX, startY + (i * gap), 'right'));
        }
        damageNumbers.push(new FloatingText(player.x, player.y - 200, `WAVE ${waveNum}: KNIVES FROM LEFT!`, "red"));
    }

    sfx.playBossSpawn(); // Warning sound
}

function spawnOnionRing() {
    const radius = 400;
    const count = 12;
    const angleStep = (Math.PI * 2) / count;

    for (let i = 0; i < count; i++) {
        const angle = i * angleStep;
        const x = player.x + Math.cos(angle) * radius;
        const y = player.y + Math.sin(angle) * radius;

        const e = new Enemy(x, y);
        e.speed *= 0.5;
        e.hp *= 2;
        e.type = 'rotten';
        enemies.push(e);
    }
}

function startStampedeSequence() {
    stampedeActive = true;
    stampedeWave = 1;
    stampedeDelay = 60; // 1 second prep before Wave 1

    const warning = new FloatingText(player.x, player.y - 120, "⚠️ KNIFE HORDE INCOMING! ⚠️", "red");
    warning.life = 180;
    damageNumbers.push(warning);
    sfx.playBossSpawn();
}

function checkFormationEvents() {
    // 1. Immediate Trigger on 1st Boss Kill
    if (bossKills >= 1 && !hasTriggeredFirstStampede) {
        hasTriggeredFirstStampede = true;
        startStampedeSequence();
    }

    // 2. Stampede Sequence Logic
    if (stampedeActive) {
        stampedeDelay--;
        if (stampedeDelay <= 0) {
            spawnStampedeWave(stampedeWave);
            stampedeWave++;

            if (stampedeWave > 5) {
                stampedeActive = false; // Sequence Done
            } else {
                stampedeDelay = 180; // 3 Seconds between waves
            }
        }
    }

    // 3. Random Periodic Events (Only if not in sequence)
    if (!stampedeActive && bossKills >= 1) {
        formationTimer++;
        if (formationTimer >= 9000) { // 2.5 mins
            formationTimer = 0;
            // Randomly trigger either Ring or Full Stampede Sequence
            if (Math.random() > 0.5) {
                startStampedeSequence(); // Trigger full 5-wave event
            } else {
                spawnOnionRing();
                damageNumbers.push(new FloatingText(player.x, player.y - 150, "ONION RING TRAP!", "purple"));
            }
        }
    }
}
