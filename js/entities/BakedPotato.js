
// --- Baked Potato Enemy ---

class BakedPotato extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.type = 'baked';

        // TANK STATS: ~2.5x of Rotten Potato
        this.hp = 50 + (player.level * 12);
        this.maxHp = this.hp;

        this.speed = 0.5; // Slow
        this.size = 35; // Large Oval

        this.steamTimer = 0;
    }

    update() {
        super.update();

        // Steam Particles
        this.steamTimer++;
        if (this.steamTimer > 10) {
            particles.push(new SteamParticle(this.x, this.y - 15));
            this.steamTimer = 0;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.visualFlashTimer > 0) {
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.ellipse(0, 0, this.size, this.size * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // 1. Draw Full Potato Background (Top Half Color)
            ctx.fillStyle = '#CD853F'; // Potato Skin
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(0, 0, this.size, this.size * 0.7, 0, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();

            // 2. Draw Foil (Bottom Half)
            ctx.fillStyle = '#99aa99'; // Darker Foil
            ctx.beginPath();
            // Start at left middle
            ctx.moveTo(-this.size, 0);
            // Jagged Foil Edge across middle
            for (let i = -this.size; i <= this.size; i += 10) {
                ctx.lineTo(i, (Math.random() - 0.5) * 5);
            }
            // Bottom curve matches ellipse
            ctx.ellipse(0, 0, this.size, this.size * 0.7, 0, 0, Math.PI, false);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // 3. Foil Crinkles (Lines on bottom)
            ctx.strokeStyle = '#666';
            ctx.beginPath();
            ctx.moveTo(-15, 10); ctx.lineTo(-5, 15);
            ctx.moveTo(5, 5); ctx.lineTo(15, 12);
            ctx.stroke();

            // 4. Face (Angry)
            ctx.fillStyle = '#800000'; // Dark Red Eyes
            ctx.beginPath(); ctx.arc(-10, -8, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(10, -8, 3, 0, Math.PI * 2); ctx.fill();

            // Eyebrows
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-15, -12); ctx.lineTo(-5, -6); // Left \
            ctx.moveTo(15, -12); ctx.lineTo(5, -6);   // Right /
            ctx.stroke();

            // Mouth (Grimace)
            ctx.beginPath();
            ctx.moveTo(-6, 2);
            ctx.lineTo(-2, 5);
            ctx.lineTo(2, 2);
            ctx.lineTo(6, 5);
            ctx.stroke();
        }

        ctx.restore();
    }
}

class SteamParticle {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = -1 - Math.random();
        this.life = 40;
        this.size = 5 + Math.random() * 5;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        this.size += 0.1;
        return this.life > 0;
    }
    draw(ctx) {
        ctx.globalAlpha = (this.life / 40) * 0.5;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}
