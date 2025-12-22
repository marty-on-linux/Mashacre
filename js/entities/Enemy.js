// --- Enemy Class ---
class Enemy {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.isElite = Math.random() < 0.02;

        // PROGRESSION: New enemies after boss kills
        // 0 Bosses: Rotten/Fry
        // 2 Bosses: Hot Potatoes appear (Elite Rate)
        this.type = Math.random() > 0.5 ? 'rotten' : 'fry';


        // TUNING: Drastically reduce Fry HP (Mini Fries)
        // Rotten: Medium, Fry: Weak, Wedge: Strong
        // Base HP scaled by player level
        let baseHP = 20 + (player.level * 5);

        if (this.type === 'fry') {
            baseHP = 5 + (player.level * 2); // One-shot range
            this.speed = (CONSTANTS.PLAYER_SPEED * 0.6) + Math.random();
        } else if (this.type === 'hot_potato') {
            // Stats handled in HotPotatoDelegate.init, but set base HP here for safety
            baseHP *= 1.5;
            // Speed set in delegate
        } else {
            // Rotten
            this.speed = (CONSTANTS.PLAYER_SPEED * 0.45);
        }

        this.hp = baseHP * (this.isElite ? 5 : 1);
        this.size = this.isElite ? 25 : (this.type === 'fry' ? 16 : 15); // Increased Fry size (was 12)

        this.flashTime = 0;
        this.knockbackX = 0;
        this.knockbackY = 0;
        this.slowTimer = 0; // Physics: Slow Support
        this.isSquashed = false;
        this.squashTimer = 0;
        this.currentAngle = 0; // Physics: Smooth turning

        // Hit Feedback
        this.invulnTimer = 0; // I-Frames (Mechanic)
        this.visualFlashTimer = 0; // White Flash (Visual)
    }

    applySlow(frames) {
        this.slowTimer = Math.max(this.slowTimer, frames);
    }

    knockback(angle, force) {
        let k = force;
        if (this.type === 'boss' || this.isElite) k *= 0.3; // Resistance

        this.knockbackX = Math.cos(angle) * k;
        this.knockbackY = Math.sin(angle) * k;

        // Jitter
        this.knockbackX += (Math.random() - 0.5);
        this.knockbackY += (Math.random() - 0.5);
    }


    update() {
        this.x += this.knockbackX; this.y += this.knockbackY;
        this.knockbackX *= 0.9; this.knockbackY *= 0.9; // Physics: Increased decay

        // Safety check for player
        if (!player) return;

        // Physics: Smooth Turning (Kiteable)
        const targetAngle = Math.atan2(player.y - this.y, player.x - this.x);

        // Initialize angle if 0
        if (this.currentAngle === 0) this.currentAngle = targetAngle;

        // Angle Lerp (0.05 = Slow turn, 0.1 = Medium)
        let diff = targetAngle - this.currentAngle;
        // Normalize angle to -PI to PI
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.currentAngle += diff * 0.08;

        // Physics: Slow Logic
        let currentSpeed = this.speed;
        if (this.slowTimer > 0) {
            currentSpeed *= 0.3; // 70% Slow
            this.slowTimer--;
        }

        let vx = Math.cos(this.currentAngle) * currentSpeed;
        let vy = Math.sin(this.currentAngle) * currentSpeed;

        let sepX = 0; let sepY = 0;

        // Physics Optimization: Use Spatial Grid
        const neighbors = (typeof spatialGrid !== 'undefined') ? spatialGrid.getNearby(this) : enemies;

        // Optimization: Cap neighbor checks to prevent O(N^2) lag
        let checkCount = 0;
        const maxChecks = 15;
        const len = neighbors.length;

        for (let i = 0; i < len && checkCount < maxChecks; i++) {
            const other = neighbors[i];
            if (other === this || other.type === 'boss') continue;

            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const distSq = dx * dx + dy * dy;
            // Increased separation radius slightly for "Swarm" feel
            const minDist = this.size + other.size;
            const minDistSq = minDist * minDist;
            if (distSq < minDistSq && distSq > 0) {
                const dist = Math.sqrt(distSq);
                const push = (minDist - dist) / minDist;
                sepX -= (other.x - this.x) * push;
                sepY -= (other.y - this.y) * push;
            }
            checkCount++;
        }

        // Stronger separation force
        this.x += vx + sepX * 0.8;
        this.y += vy + sepY * 0.8;

        // Use squared distance for collision check
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const collisionDist = this.size + player.radius;
        if (dx * dx + dy * dy < collisionDist * collisionDist) {
            player.takeDamage(this.isElite ? 15 : 5);
        }
        if (this.invulnTimer > 0) this.invulnTimer--;
        if (this.visualFlashTimer > 0) this.visualFlashTimer--;
    }

    hit(dmg, knockbackForce = 0) {
        if (this.invulnTimer > 0) return;
        this.hp -= dmg;
        this.invulnTimer = 5;
        this.visualFlashTimer = 10;
        damageNumbers.push(new FloatingText(this.x, this.y - 20, Math.floor(dmg), 'white'));

        if (knockbackForce > 0) {
            let k = knockbackForce;
            if (this.type === 'boss' || this.isElite) k *= 0.3;
            const angle = Math.atan2(this.y - player.y, this.x - player.x);
            this.knockbackX = Math.cos(angle) * k;
            this.knockbackY = Math.sin(angle) * k;

            // Physics: Jitter to prevent stacking
            this.knockbackX += (Math.random() - 0.5);
            this.knockbackY += (Math.random() - 0.5);
        }

        if (this.hp <= 0) this.die();
    }

    die(silent = false) {
        // OVERHAUL: Gem Logic
        // Purple Gems = 5x Experience (Val 10 vs 2)
        // Spawn Rule: Purple Gems only from Elites if Level >= 15
        // After Level 20, 10% chance from ANY enemy

        let gemType = 'green';
        let gemVal = 5; // Base XP Buff (was 2)

        // Safety check for player
        const playerLevel = player ? player.level : 1;

        if (this.isElite) {
            if (playerLevel >= 15) {
                gemType = 'purple';
                gemVal = 50;
            } else {
                gemVal = 20; // Good xp but not purple yet
            }
        } else {
            // Normal enemy
            if (playerLevel >= 20 && Math.random() < 0.1) {
                gemType = 'purple';
                gemVal = 50;
            }
        }

        if (typeof gemManager !== 'undefined') {
            gemManager.spawn(this.x, this.y, gemVal, gemType);
        } else if (typeof Gem !== 'undefined') {
            // Fallback for safety or if scripts haven't loaded yet
            gems.push(new Gem(this.x, this.y, gemVal, gemType));
        }

        // RARE DROPS
        const roll = Math.random();
        if (roll < 0.005) pickups.push(new Pickup(this.x, this.y, 'health')); // 0.5%
        else if (roll < 0.007) pickups.push(new Pickup(this.x, this.y, 'magnet')); // 0.2%
        else if (roll < 0.008) pickups.push(new Pickup(this.x, this.y, 'nuke')); // 0.1%

        score++;

        // Silent Mode (Nuke): Skip particles/sfx/ui for performance
        if (!silent) {
            if (typeof Splat !== 'undefined') splats.push(new Splat(this.x, this.y));
            if (sfx && sfx.playSplat) sfx.playSplat();
            if (typeof updateUI === 'function') updateUI();
        }

        // Safe removal from array
        const index = enemies.indexOf(this);
        if (index > -1) enemies.splice(index, 1);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Visual Squash Effect
        if (this.isSquashed) {
            ctx.scale(1.3, 0.5); // Wider and flatter
            // Waddle (Optimized)
            ctx.rotate(Math.sin(frameCount * 0.2) * 0.2);

            this.squashTimer--;
            if (this.squashTimer <= 0) this.isSquashed = false;
        }

        if (this.visualFlashTimer > 0) {
            ctx.fillStyle = 'white';
            ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
        } else {
            if (this.type === 'rotten') {
                ctx.fillStyle = this.isElite ? '#4a3b52' : '#556b2f';
                ctx.strokeStyle = this.isElite ? '#222' : '#3a4a20';
                ctx.lineWidth = 2;
                ctx.beginPath();
                const s = this.size;
                ctx.moveTo(0, -s);
                ctx.bezierCurveTo(s, -s, s + 5, 0, s, s);
                ctx.bezierCurveTo(0, s + 5, -s, s, -s, s);
                ctx.bezierCurveTo(-s - 5, 0, -s, -s, 0, -s);
                ctx.fill(); ctx.stroke();
                ctx.fillStyle = this.isElite ? '#ff00ff' : 'red';
                ctx.beginPath(); ctx.arc(-5, -3, 3, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(5, -3, 3, 0, Math.PI * 2); ctx.fill();
            } else if (this.type === 'fry') {
                ctx.rotate(Math.atan2(player.y - this.y, player.x - this.x));

                // VISUAL UPDATE: Bigger, Menacing Fry
                // Draw uneven fry body
                ctx.fillStyle = this.isElite ? '#cc5500' : '#ffda44'; // Gold/Crispy
                ctx.strokeStyle = '#d4aa00';
                ctx.lineWidth = 1;

                // Random-ish Fry Shape
                ctx.beginPath();
                const len = this.size * 1.5;
                const wid = this.size * 0.6;
                ctx.rect(-wid, -len / 2, wid * 2, len);
                ctx.fill(); ctx.stroke();

                // Salt Grains
                ctx.fillStyle = 'white';
                ctx.fillRect(-2, -5, 2, 2);
                ctx.fillRect(3, 2, 2, 2);

                // Face (Menacing)
                // Eyes
                ctx.fillStyle = 'red';
                ctx.beginPath(); ctx.arc(-4, -4, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(4, -4, 2, 0, Math.PI * 2); ctx.fill();

                // Brows
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(-7, -7); ctx.lineTo(-2, -5); // Angled down
                ctx.moveTo(7, -7); ctx.lineTo(2, -5);
                ctx.stroke();

                // Mouth
                ctx.beginPath(); ctx.moveTo(-3, 2); ctx.lineTo(3, 2); ctx.stroke();
            }
        }
        ctx.restore();
    }
}
