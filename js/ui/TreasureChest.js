
// --- Treasure Chest ---

class TreasureChest {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.width = 40; this.height = 30;
        this.state = 'IDLE'; // IDLE, OPENING, OPENED
        this.timer = 0;
        this.bob = 0;
    }

    update() {
        if (this.state === 'IDLE') {
            this.bob += 0.1;
            // Collision with Player
            if (this.isColliding(player)) {
                this.startOpening();
            }
        } else if (this.state === 'OPENING') {
            this.timer++;
            // Spawn Particles
            if (this.timer === 1) {
                sfx.playGem(); // Or shiny sound
                // Spawn 3 Card Particles
                particles.push(new CardParticle(this.x, this.y, 0));
                particles.push(new CardParticle(this.x, this.y, 1));
                particles.push(new CardParticle(this.x, this.y, 2));
            }

            // Wait for animation (~1s = 60 frames)
            if (this.timer > 80) {
                this.state = 'OPENED';
                // Trigger Menu
                // Chest gives 3 items automatically
                triggerLevelUp(3, true, true);
                // Remove chest
                // Remove chest - SAFEGUARD
                const idx = pickups.indexOf(this);
                if (idx > -1 && pickups[idx] === this) {
                    pickups.splice(idx, 1);
                }
                return false; // Remove from updates
            }
        }
        return true; // Keep active
    }

    isColliding(p) {
        return Math.hypot(p.x - this.x, p.y - this.y) < p.radius + 30;
    }

    startOpening() {
        this.state = 'OPENING';
        sfx.playHeal(); // Placeholder sound
        // Freeze player? Or just let them move while cards fly
    }

    draw(ctx) {
        if (this.state === 'OPENED') return;

        ctx.save();
        ctx.translate(this.x, this.y + (this.state === 'IDLE' ? Math.sin(this.bob) * 5 : 0));

        // Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'gold';

        // Chest Body
        ctx.fillStyle = '#DAA520'; // GoldenRod
        ctx.fillRect(-20, -15, 40, 30);

        ctx.fillStyle = '#8B0000'; // Dark Red Trim
        ctx.fillRect(-20, -5, 40, 5);
        ctx.fillRect(-5, -15, 10, 30); // Vert Lock

        // Lid
        if (this.state === 'OPENING') {
            ctx.translate(0, -15);
            ctx.rotate(-0.5); // Open slightly
            ctx.translate(0, 15);
        }

        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 3;
        ctx.strokeRect(-20, -15, 40, 30);

        ctx.restore();
    }
}

class CardParticle {
    constructor(startX, startY, index) {
        this.x = startX; this.y = startY;
        this.index = index;

        // Target: Center of Screen (Relative to Camera)
        // We need check Loop or Draw for camera pos, 
        // usually camera x/y is top-left. 
        // We'll approximate target as Player position for now, or fixed screen center offset
        // Since we don't have direct access to canvas width/height here easily without passing it,
        // we'll fly Up and Out relative to player.

        this.life = 0;
        this.maxLife = 80;

        // Spread Mechanics
        const angle = -Math.PI / 2 + (index - 1) * 0.5; // Up, Left, Right
        this.vx = Math.cos(angle) * 2;
        this.vy = Math.sin(angle) * 2;
    }

    update() {
        this.life++;
        this.x += this.vx;
        this.y += this.vy;

        // Accelerate up
        this.vy -= 0.1;

        return this.life < this.maxLife;
    }

    draw(ctx) {
        // Lerp Scale
        const scale = Math.min(1.5, this.life / 20);

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(scale, scale);

        // Card Shape
        ctx.fillStyle = 'white';
        ctx.fillRect(-15, -20, 30, 40);
        ctx.strokeStyle = 'gold';
        ctx.lineWidth = 2;
        ctx.strokeRect(-15, -20, 30, 40);

        // Icon (Generic Question Mark or Index)
        ctx.fillStyle = 'black';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("?", 0, 0);

        ctx.restore();
    }
}
