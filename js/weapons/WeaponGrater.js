class WeaponGrater {
    constructor(player) {
        this.player = player;
        this.level = 0;
        this.timer = 0;
    }

    update() {
        if (this.level <= 0) return;
        const isEvo = this.level > CONSTANTS.MAX_WEAPON_LEVEL;
        this.timer++;

        const rate = isEvo ? 10 : Math.max(30, 90 - (this.level * 10));

        if (this.timer >= rate) {
            this.fire(isEvo);
            this.timer = 0;
        }
    }

    fire(isEvo) {
        if (sfx && sfx.playShoot) sfx.playShoot();

        // Auto-Aim: Nearest Enemy (use squared distance)
        let targetAngle = 0;
        let nearest = null;
        let minDstSq = 9999 * 9999;
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            const dx = e.x - this.player.x;
            const dy = e.y - this.player.y;
            const dSq = dx * dx + dy * dy;
            if (dSq < minDstSq) { minDstSq = dSq; nearest = e; }
        }

        if (nearest) {
            targetAngle = Math.atan2(nearest.y - this.player.y, nearest.x - this.player.x);
        } else {
            // Spin if no enemies
            targetAngle = frameCount * 0.1;
        }

        const count = isEvo ? 2 : 5 + this.level;
        const spreadArc = Math.PI / 4;

        let baseDmg = 12 * Math.pow(1.2, this.level);
        if (isEvo) baseDmg *= 2.25; // Buffed from 1.5 (+50% more)
        const dmg = baseDmg * this.player.stats.dmgMult;

        for (let i = 0; i < count; i++) {
            const offset = (Math.random() - 0.5) * spreadArc;
            const angle = targetAngle + offset;
            projectiles.push(new CheeseShard(this.player.x, this.player.y, angle, dmg, isEvo));
        }
    }

    draw(ctx) { }
}

class CheeseShard {
    constructor(x, y, angle, damage, isEvo) {
        this.x = x; this.y = y;
        this.angle = angle;
        this.damage = damage;
        this.isEvo = isEvo;
        this.speed = 10 + Math.random() * 5;
        this.life = isEvo ? 40 : 20; // Double Range for Evo
        this.active = true;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        if (this.life <= 0) this.active = false;

        const hitRadius = 20;
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            const dx = e.x - this.x;
            const dy = e.y - this.y;
            const hitDist = e.size + hitRadius;
            if (dx * dx + dy * dy < hitDist * hitDist) {
                e.hit(this.damage);
                this.active = false;
                return;
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.fillStyle = this.isEvo ? '#C0C0C0' : '#FFD700';
        ctx.strokeStyle = this.isEvo ? '#888' : '#DAA520';
        ctx.lineWidth = 2;

        const size = this.isEvo ? 18 : 12;

        ctx.beginPath();
        ctx.moveTo(size, 0);
        ctx.lineTo(-size, -size / 1.5);
        ctx.lineTo(-size, size / 1.5);
        ctx.closePath();

        ctx.fill();
        ctx.stroke();

        if (!this.isEvo) {
            ctx.fillStyle = '#DAA520';
            ctx.beginPath(); ctx.arc(-size / 2, 0, 2, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();
    }
}
