class WeaponTots {
    constructor(player) {
        this.player = player;
        this.level = 0;
        this.timer = 0;
    }

    update() {
        if (this.level <= 0) return;
        const isEvo = this.level > CONSTANTS.MAX_WEAPON_LEVEL;

        this.timer++;
        const rate = Math.max(120, 270 - (this.level * 30));

        if (this.timer >= rate) {
            mines.push(new TaterTot(this.player.x, this.player.y, this.level, isEvo, this.player, 180));
            this.timer = 0;
        }
    }

    draw(ctx) { }
}

class TaterTot {
    constructor(x, y, level, isEvo, playerRef, life = 180) {
        this.x = x; this.y = y;
        this.level = level;
        this.isEvo = isEvo;
        this.player = playerRef;
        this.active = true;
        this.life = life;
        this.maxLife = life;
        this.radius = 15;
        this.pulse = 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const urgency = 1 + (1 - this.life / this.maxLife) * 10;
        this.pulse += 0.1 * urgency;

        ctx.shadowBlur = 5;
        ctx.shadowColor = 'black';

        // Tot Shape
        ctx.fillStyle = this.isEvo ? '#CD853F' : '#DAA520';
        ctx.beginPath();
        ctx.roundRect(-10, -12, 20, 24, 5);
        ctx.fill();
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#B8860B';
        ctx.beginPath(); ctx.arc(-4, -5, 1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(4, 2, 1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-3, 6, 1, 0, Math.PI * 2); ctx.fill();

        const light = (Math.sin(this.pulse) > 0) ? '#ff0000' : '#550000';
        ctx.fillStyle = light;
        ctx.shadowBlur = (light === '#ff0000') ? 10 + urgency : 0;
        ctx.shadowColor = 'red';
        ctx.beginPath();
        ctx.arc(0, -6, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    update() {
        this.life--;
        if (this.life <= 0) {
            this.explode();
        }
    }

    explode() {
        this.active = false;
        if (sfx && sfx.playPop) sfx.playPop();

        // Range
        const range = this.isEvo ? 260 : 160;

        // Damage
        let dmg = 40 * Math.pow(1.4, this.level);
        if (this.isEvo) dmg *= 2;
        if (this.player && this.player.stats) {
            dmg *= this.player.stats.dmgMult;
        }

        // --- Visual Effects Enhancement ---

        // 1. Shockwave Ring (New)
        // Args: x, y, color, life, type, size
        particles.push(new Particle(this.x, this.y, this.isEvo ? 'orange' : 'gold', 20, 'ring', range));

        // 2. Core Explosion (Stationary 'blast')
        particles.push(new Particle(this.x, this.y, 'orange', 30, 'blast', range * 0.5));
        if (this.isEvo) particles.push(new Particle(this.x, this.y, 'red', 20, 'blast', range * 0.3));

        // 3. Debris Shower
        const debrisCount = this.isEvo ? 20 : 12;
        for (let i = 0; i < debrisCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 40;
            // Small debris
            particles.push(new Particle(this.x + Math.cos(angle) * dist, this.y + Math.sin(angle) * dist, '#DAA520', 20, 'circle', 5));
        }

        // --- Logic ---
        const rangeSq = range * range;
        const targets = [...enemies];
        for (let i = 0; i < targets.length; i++) {
            const e = targets[i];
            if (!e || e.hp <= 0) continue;
            const dx = e.x - this.x;
            const dy = e.y - this.y;
            if (dx * dx + dy * dy < rangeSq) {
                e.hit(dmg);
                const angle = Math.atan2(dy, dx);
                if (typeof e.knockback === 'function') {
                    e.knockback(angle, 25);
                }
            }
        }

        // Evo Cluster
        if (this.isEvo) {
            for (let i = 0; i < 4; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 60;
                const mt = new TaterTot(this.x + Math.cos(angle) * dist, this.y + Math.sin(angle) * dist, this.level, false, this.player, 30);
                mt.radius = 10;
                mines.push(mt);
            }
        }
    }
}
