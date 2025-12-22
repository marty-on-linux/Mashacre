// --- Particles & Visuals ---

class Splat {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.scale = 0.35 + Math.random() * 0.4; // Smaller to reduce visual clutter
        this.rotation = Math.random() * Math.PI * 2;
        this.points = [];
        this.life = 900; // ~15s at 60fps
        this.maxLife = this.life;

        // Warm potato palette (skin + mashed tones)
        const palette = ['#c99c5a', '#b47b3d', '#d3b070'];
        this.baseColor = palette[Math.floor(Math.random() * palette.length)];
        for (let i = 0; i < 8; i++) this.points.push(8 + Math.random() * 10);
    }

    update() {
        this.life--;
        return this.life > 0;
    }

    draw(ctx) {
        const t = this.life / this.maxLife;
        const alpha = 0.15 + t * 0.45; // Fades out smoothly

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);
        ctx.globalAlpha = alpha;

        // Soft potato splat
        ctx.fillStyle = this.baseColor;
        ctx.beginPath();
        ctx.moveTo(this.points[0], 0);
        for (let i = 1; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            ctx.lineTo(Math.cos(angle) * this.points[i], Math.sin(angle) * this.points[i]);
        }
        ctx.fill();

        // Skin speckles for texture
        ctx.fillStyle = '#8a5a2d';
        for (let i = 0; i < 4; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = 4 + Math.random() * 6;
            ctx.beginPath();
            ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

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
