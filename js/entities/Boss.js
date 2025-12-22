
// --- Boss Class ---

// Depends on Enemy class existing (loaded in entities.js)

class Boss extends Enemy {
    constructor(x, y, isKing = false) {
        super(x, y);
        this.isKing = isKing;

        // BOSS SCALING: +25% HP Per Boss Kill
        let scaling = 1 + (bossKills * 0.25);
        this.hp = (isKing ? 15000 : 3000 + (player.level * 200)) * scaling;

        this.maxHp = this.hp;
        this.name = isKing ? "THE MASH KING" : "The Chef";
        this.size = isKing ? 100 : 75;
        this.speed = isKing ? 2.0 : 2.5;
        this.type = 'boss';
        this.attackTimer = 0;
        this.isElite = false;

        // Boss resists knockback heavily but not immune
        this.slowTimer = 0;
    }

    update() {
        // Safety check
        if (!player) return;
        
        // Boss moves towards player but is resistent to slow
        const angle = Math.atan2(player.y - this.y, player.x - this.x);

        // Slight knockback recovery
        this.x += this.knockbackX; this.y += this.knockbackY;
        this.knockbackX *= 0.8; this.knockbackY *= 0.8;

        // Apply Speed
        let currentSpeed = this.speed;
        if (this.slowTimer > 0) {
            // Boss has 50% slow resistance (moves at 0.65x instead of 0.3x)
            currentSpeed *= 0.65;
            this.slowTimer--;
        }

        this.x += Math.cos(angle) * currentSpeed;
        this.y += Math.sin(angle) * currentSpeed;

        this.attackTimer++;
        // King Attacks Faster
        const attackRate = this.isKing ? 50 : 80;

        if (this.attackTimer > attackRate) {
            if (sfx && sfx.playKnife) sfx.playKnife();
            const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
            if (this.isKing) {
                // King shoots 5 knives in spread
                for (let i = -2; i <= 2; i++) {
                    enemyProjectiles.push(new ButcherKnife(this.x, this.y, angleToPlayer + (i * 0.15)));
                }
            } else {
                enemyProjectiles.push(new ButcherKnife(this.x, this.y, angleToPlayer));
            }
            this.attackTimer = 0;
        }

        // Use squared distance for collision check
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const collisionDist = this.size + player.radius;
        if (dx * dx + dy * dy < collisionDist * collisionDist) {
            player.takeDamage(20);
        }

        if (this.visualFlashTimer > 0) this.visualFlashTimer--;
        if (this.invulnTimer > 0) this.invulnTimer--;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Body
        ctx.fillStyle = this.isKing ? '#8b4513' : '#ffcccc'; // King is a giant potato
        ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = '#aa6666'; ctx.stroke();

        // Face
        // 3rd Chef (bossKills >= 2) gets Red Eyes
        const isSuperAngry = (bossKills >= 2);

        ctx.fillStyle = isSuperAngry ? '#cc0000' : 'black';
        ctx.beginPath(); ctx.arc(-20, -10, 8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(20, -10, 8, 0, Math.PI * 2); ctx.fill();

        // VISUAL UPDATE: Angrier Face
        if (bossKills > 0) {
            // 2nd Chef = 0.2 (Moderate)
            // 3rd Chef = 0.6 (Steep)
            const baseAnger = 0.2;
            const angerOffset = (bossKills >= 2) ? 0.4 : 0;
            const anger = baseAnger + angerOffset;

            ctx.lineWidth = 3;
            ctx.strokeStyle = 'black'; // Ensure eyebrows are black
            ctx.beginPath();
            // Left Brow
            ctx.moveTo(-28, -20); ctx.lineTo(-12, -20 + (15 * Math.sin(anger)));
            // Right Brow
            ctx.moveTo(28, -20); ctx.lineTo(12, -20 + (15 * Math.sin(anger)));
            ctx.stroke();
        }

        // Mouth (Only for Super Angry 3rd Chef)
        if (isSuperAngry) {
            ctx.beginPath();
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'black';
            // Frown: Arc from PI to 0 (top half)? No, that's a sad mouth/frown usually looks like / \ or an arc concave down.
            // Arc: x, y, radius, startAngle, endAngle.
            // Frown: Center (0, 15), Radius 15, Start PI + 0.5, End 2PI - 0.5?
            ctx.arc(0, 25, 15, Math.PI + 0.5, 2 * Math.PI - 0.5);
            ctx.stroke();
        }

        // Crown for King
        if (this.isKing) {
            ctx.fillStyle = 'gold';
            ctx.beginPath();
            ctx.moveTo(-40, -this.size + 20);
            ctx.lineTo(-20, -this.size - 40);
            ctx.lineTo(0, -this.size + 10);
            ctx.lineTo(20, -this.size - 40);
            ctx.lineTo(40, -this.size + 20);
            ctx.fill();
        } else {
            // Chef Hat
            ctx.fillStyle = 'white';
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = 3;
            ctx.fillRect(-40, -this.size - 40, 80, 60);
            ctx.strokeRect(-40, -this.size - 40, 80, 60);
            ctx.beginPath();
            ctx.arc(-40, -this.size - 40, 20, Math.PI, 1.5 * Math.PI);
            ctx.arc(0, -this.size - 60, 25, Math.PI, 2 * Math.PI);
            ctx.arc(40, -this.size - 40, 20, 1.5 * Math.PI, 0);
            ctx.fill(); ctx.stroke();
        }

        // Visual Flash Overlay (Fixes glitchy hat removal)
        if (this.visualFlashTimer > 0) {
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = 'white';
            ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }

        ctx.restore();
    }

    die() {
        if (this.isKing) {
            gameWin();
            return;
        }

        // Drops
        for (let i = 0; i < 30; i++) gems.push(new Gem(this.x + (Math.random() - 0.5) * 100, this.y + (Math.random() - 0.5) * 100, 10, 'green'));
        // Boss Drops Purple Gems too
        for (let i = 0; i < 5; i++) gems.push(new Gem(this.x + (Math.random() - 0.5) * 100, this.y + (Math.random() - 0.5) * 100, 50, 'purple'));

        pickups.push(new Pickup(this.x + (Math.random() - 0.5) * 80, this.y + (Math.random() - 0.5) * 80, 'nuke'));
        pickups.push(new TreasureChest(this.x + (Math.random() - 0.5) * 80, this.y + (Math.random() - 0.5) * 80)); // Chest Drop

        activeBoss = null;
        bossKills++;
        super.die();
        document.getElementById('boss-bar-container').style.display = 'none';

        // PACING UPDATE: Next boss in 3 mins OR 10 levels, whichever comes FIRST
        // But actually, "whichever comes first" implies the EARLIER of the two triggers.
        // So we wait until Time > limit OR Level > limit?
        // No, if user request "at least 3 minutes or 10 levels", it implies a DELAY.
        // "At least X" usually means "Don't spawn before X".
        // But in game design, "whichever comes first" usually means:
        // Spawn Condition = (TimeElapsed >= 3min) OR (LevelsGained >= 10).
        // I will implement exactly that.

        // We need to export/update global vars for next spawn
        // Since Boss class is separate, we effectively need a way to callback to main.js logic.
        // Or we can rely on main.js 'loop' checking global vars.
        // Use global 'setNextBossPacing' function if possible, or direct global access?
        // main.js has 'nextBossTime'. Let's assume we can write to it or add a helper in main.js
        // Ideally we shouldn't modify globals directly from class like this, but 'bossKills' is already global here.

        if (typeof updateBossPacing === 'function') {
            updateBossPacing(player.level);
        } else {
            // Fallback (direct access if function missing during hot reload)
            // nextBossTime variable is likely in main.js scope but Boss.js is loaded before?
            // Actually, in browser JS, global scope is window. We can rely on window.nextBossTime?
            // Better: Add 'updateBossPacing' to window or just assume main.js handles the 'check'.
            // Wait, Boss.die() is executed. main.js loop checks 'gameTime > nextBossTime'.
            // The loop currently doesn't check level.
            // I should update main.js loop first to add the Level check.
            // And here in Boss.die, I just need to trigger the DELAY.
            // "Way more time... like at least 3 minutes".
            // So we need to ADD time to nextBossTime.
        }

        // Heal Player on Boss Kill
        player.hp = player.maxHp;
        damageNumbers.push(new FloatingText(player.x, player.y - 50, "BOSS DEFEATED!", "Gold"));
    }
}

class ButcherKnife {
    constructor(x, y, angle) {
        this.x = x; this.y = y;
        this.angle = angle;
        this.speed = 12;
        this.size = 20;
        this.rotation = 0;
        this.active = true;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += 0.5;

        // Hit Player
        if (Math.hypot(this.x - player.x, this.y - player.y) < this.size + player.radius) {
            player.takeDamage(20);
            this.active = false;
        }

        // Despawn distance
        if (Math.hypot(this.x - player.x, this.y - player.y) > 1200) this.active = false;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // VISUAL UPDATE: Red Glow (Intense)
        ctx.shadowBlur = 40;
        ctx.shadowColor = 'red';

        // Draw Knife
        ctx.fillStyle = '#ccc'; // Blade
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(25, -5);
        ctx.lineTo(30, 0);
        ctx.lineTo(25, 10);
        ctx.lineTo(0, 10);
        ctx.fill();

        ctx.fillStyle = '#533'; // Handle
        ctx.fillRect(-15, 0, 15, 8);

        ctx.restore();
    }
}
