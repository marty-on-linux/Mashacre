// --- Oil Effects ---

class ThrownOil {
    constructor(x, y, targetX, targetY, damage, isEvo, radius) {
        this.x = x; this.y = y;
        this.targetX = targetX; this.targetY = targetY;
        this.damage = damage; this.isEvo = isEvo;
        this.radius = radius || (isEvo ? 100 : 60);
        this.active = true;
        this.progress = 0;
        this.startX = x; this.startY = y;
    }
    update() {
        this.progress += 0.05;
        if (this.progress >= 1) {
            // Landed
            if (sfx && sfx.playSplash) sfx.playSplash();
            mines.push(new OilPool(this.targetX, this.targetY, this.damage, this.isEvo, this.radius));
            this.active = false;
        } else {
            // Lerp with arc
            this.x = this.startX + (this.targetX - this.startX) * this.progress;
            this.y = this.startY + (this.targetY - this.startY) * this.progress;
            // Arc height
            this.y -= Math.sin(this.progress * Math.PI) * 100;
        }
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.progress * 10);

        // VISUAL: Glass Bottle with Oil
        ctx.fillStyle = '#ffaa00'; // Oil color
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;

        // Bottle Shape
        ctx.beginPath();
        ctx.rect(-6, -8, 12, 16); // Body
        ctx.rect(-3, -14, 6, 6); // Neck
        ctx.fill(); ctx.stroke();

        // Label
        ctx.fillStyle = 'red';
        ctx.fillRect(-6, -4, 12, 8);

        ctx.restore();
    }
}

class OilPool {
    constructor(x, y, damage, isEvo, radius) {
        this.x = x; this.y = y;
        this.damage = damage;
        this.isEvo = isEvo;
        this.life = isEvo ? 400 : 180; // Extended Duration
        this.radius = radius || (isEvo ? 100 : 60); // Use passed radius
        this.radiusSq = this.radius * this.radius; // Cache squared radius
    }
    update() {
        this.life--;
        if (frameCount % 10 === 0) {
            const slow = this.isEvo ? 20 : 0;
            for (let i = 0; i < enemies.length; i++) {
                const e = enemies[i];
                const dx = e.x - this.x;
                const dy = e.y - this.y;
                if (dx * dx + dy * dy < this.radiusSq) {
                    e.hit(this.damage, 0);
                    if (this.isEvo) e.applySlow(slow); // Blue Fire slows
                }
            }
        }
        return this.life > 0;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.8, this.life / 60);
        ctx.translate(this.x, this.y);

        // Base Pool
        ctx.fillStyle = this.isEvo ? '#004488' : '#8B4513'; // Darker Brown
        ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill();

        // Surface Bubbles/Glistening
        const tick = Date.now() / 200;
        ctx.fillStyle = this.isEvo ? '#00ffff' : '#ffaa00';

        for (let i = 0; i < 3; i++) {
            const offset = i * 2;
            const bx = Math.sin(tick + offset) * (this.radius * 0.5);
            const by = Math.cos(tick + i) * (this.radius * 0.5);
            const size = (Math.sin(tick * 2 + i) + 2) * 5;
            ctx.beginPath(); ctx.arc(bx, by, size, 0, Math.PI * 2); ctx.fill();
        }

        // Heat Haze Edge
        ctx.strokeStyle = this.isEvo ? 'white' : 'orange';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, this.radius - 2, 0, Math.PI * 2); ctx.stroke();

        ctx.restore();
    }
}
