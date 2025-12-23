// --- Particles & Visuals ---

class Splat {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.scale = 0.3 + Math.random() * 0.35;
        this.rotation = Math.random() * Math.PI * 2;
        this.points = [];
        this.life = 720; // ~12s at 60fps
        this.maxLife = this.life;

        // Warm mashed potato palette
        const palette = ['#c9985a', '#b08040', '#d4b070', '#c4a060'];
        this.baseColor = palette[Math.floor(Math.random() * palette.length)];
        // More organic splat shape
        for (let i = 0; i < 10; i++) this.points.push(6 + Math.random() * 12);
    }

    update() {
        this.life--;
        return this.life > 0;
    }

    draw(ctx) {
        const t = this.life / this.maxLife;
        const alpha = 0.12 + t * 0.38;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);
        ctx.globalAlpha = alpha;

        // Main splat body
        ctx.fillStyle = this.baseColor;
        ctx.beginPath();
        ctx.moveTo(this.points[0], 0);
        for (let i = 1; i < this.points.length; i++) {
            const angle = (i / this.points.length) * Math.PI * 2;
            const r = this.points[i];
            const nextAngle = ((i + 1) / this.points.length) * Math.PI * 2;
            const nextR = this.points[(i + 1) % this.points.length];
            const cx = Math.cos((angle + nextAngle) / 2) * (r + nextR) / 2 * 0.8;
            const cy = Math.sin((angle + nextAngle) / 2) * (r + nextR) / 2 * 0.8;
            ctx.quadraticCurveTo(cx, cy, Math.cos(nextAngle) * nextR, Math.sin(nextAngle) * nextR);
        }
        ctx.fill();

        // Inner lighter spot (mashed potato center)
        ctx.fillStyle = '#e0c890';
        ctx.globalAlpha = alpha * 0.6;
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        ctx.globalAlpha = 1;
    }
}

class FloatingText {
    constructor(x, y, text, color, life = 40, size = 20) {
        this.x = x; this.y = y; this.text = text; this.color = color;
        this.life = life; this.maxLife = life; this.vY = -1.5;
        this.size = size;
    }
    update() { this.y += this.vY; this.life--; return this.life > 0; }
    draw(ctx) {
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.font = `bold ${this.size}px Arial`;
        ctx.fillText(this.text, this.x, this.y);
        ctx.globalAlpha = 1;
    }
}

class Particle {
    constructor(x, y, color, life = 20, type = 'circle', size = 3) {
        this.x = x; this.y = y; this.color = color;
        const a = Math.random() * 6.28; const s = Math.random() * 4;
        this.vx = Math.cos(a) * s; this.vy = Math.sin(a) * s;
        this.life = life; this.maxLife = life;
        this.type = type;
        this.size = size;
        if (this.type === 'ring' || this.type === 'blast') { this.vx = 0; this.vy = 0; }
    }
    update() { this.x += this.vx; this.y += this.vy; this.life--; return this.life > 0; }
    draw(ctx) {
        ctx.globalAlpha = this.life / this.maxLife;

        if (this.type === 'ring') {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 5;
            const progress = 1 - (this.life / this.maxLife);
            const r = this.size * progress;
            ctx.beginPath(); ctx.arc(this.x, this.y, r, 0, Math.PI * 2); ctx.stroke();
        } else if (this.type === 'blast') {
            ctx.fillStyle = this.color;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}
