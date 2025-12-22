
// --- Weapons & Projectiles ---

// 1. Peeler (Orbital) - Refactored to Class
class Peeler {
    constructor(player) {
        this.player = player;
        this.angle = 0;
    }

    update(level) {
        if (level <= 0) return;

        const isEvo = level > CONSTANTS.MAX_WEAPON_LEVEL;

        // Speed Scaling (Slower start, builds up)
        const speed = 0.02 + (level * 0.012) + (isEvo ? 0.2 : 0);
        this.angle += speed;

        // Range Scaling
        const range = (130 + level * 30) + (isEvo ? 100 : 0);

        // Damage Scaling
        let baseDmg = 8 * Math.pow(1.3, level);
        if (isEvo) baseDmg *= 3;
        const dmg = baseDmg * this.player.stats.dmgMult;

        // Count: 1 per level. Evo = 12 (Full Circle)
        const count = isEvo ? 12 : level;
        const angleStep = (Math.PI * 2) / count;
        const hitDist = isEvo ? 40 : 25;
        const hitDistSq = hitDist * hitDist;

        for (let i = 0; i < count; i++) {
            const theta = this.angle + (i * angleStep);
            const orbX = this.player.x + Math.cos(theta) * range;
            const orbY = this.player.y + Math.sin(theta) * range;

            for (let j = 0; j < enemies.length; j++) {
                const e = enemies[j];
                const dx = e.x - orbX;
                const dy = e.y - orbY;
                const distSq = dx * dx + dy * dy;
                const totalDist = e.size + hitDist;
                if (distSq < totalDist * totalDist) {
                    e.hit(dmg, isEvo ? 3 : 1);
                    e.applySlow(30);
                }
            }
        }
    }

    draw(ctx, level) {
        if (level <= 0) return;

        const isEvo = level > CONSTANTS.MAX_WEAPON_LEVEL;
        const range = (130 + level * 30) + (isEvo ? 100 : 0);
        const count = isEvo ? 12 : level;

        ctx.save();
        // Center rotation on Body, not Feet (corrects "weird path" illusion)
        ctx.translate(0, -25);

        for (let i = 0; i < count; i++) {
            ctx.save();
            const theta = this.angle + (i * (Math.PI * 2 / count));

            // Translate to Player first (context already translated to player in Player.draw? 
            // WAIT. Player.draw calls this.ctx.translate(this.x, this.y).
            // So we are ALREADY at 0,0 relative to player logic?
            // Let's check Player.js line 323: 
            // ctx.translate(this.x, this.y); ... this.peelerWeapon.draw(ctx, ...);
            // YES. We are at 0,0 relative to player.

            ctx.rotate(theta);
            ctx.translate(range, 0);

            // VISUAL UPGRADE: Curved Metallic Blade
            ctx.shadowBlur = isEvo ? 20 : 10;
            ctx.shadowColor = isEvo ? '#00ffff' : 'silver';

            ctx.fillStyle = isEvo ? '#e0ffff' : '#cccccc'; // silver/blue
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.quadraticCurveTo(isEvo ? 15 : 10, 0, 0, 15);
            ctx.quadraticCurveTo(isEvo ? -10 : -5, 0, 0, -15);
            ctx.fill();
            ctx.stroke();

            ctx.restore(); // Pop rotation for next blade
        }
        ctx.restore(); // Pop parent save
    }
}

// Standard (Straight shot)
class Projectile {
    constructor(x, y, target, damage, isEvo, spread) {
        this.x = x; this.y = y;
        this.damage = damage;
        this.isEvo = isEvo;
        this.active = true;
        const angle = Math.atan2(target.y - y, target.x - x) + spread;
        this.vx = Math.cos(angle) * (isEvo ? 15 : 10);
        this.vy = Math.sin(angle) * (isEvo ? 15 : 10);
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        const hitRadiusSq = (10 + 10) * (10 + 10); // projectile radius + enemy base radius
        
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            const dx = e.x - this.x;
            const dy = e.y - this.y;
            const hitDist = e.size + 10;
            if (dx * dx + dy * dy < hitDist * hitDist) {
                if (this.isEvo) {
                    sfx.playHit();
                    const aoeDist = 100;
                    const aoeDistSq = aoeDist * aoeDist;
                    for (let j = 0; j < enemies.length; j++) {
                        const subE = enemies[j];
                        const sdx = subE.x - this.x;
                        const sdy = subE.y - this.y;
                        if (sdx * sdx + sdy * sdy < aoeDistSq) {
                            subE.hit(this.damage, 6);
                        }
                    }
                    particles.push(new Particle(this.x, this.y, 'orange', 10));
                } else {
                    e.hit(this.damage, 1);
                }
                this.active = false;
                return;
            }
        }
        // Deactivate if too far from player
        const px = this.x - player.x;
        const py = this.y - player.y;
        if (px * px + py * py > 1000000) this.active = false; // 1000^2
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // VISUAL: Potato Piece vs Flaming Fry
        if (this.isEvo) {
            // EXPLOSIVE ROUND (Flaming Fry)
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'orange';
            ctx.fillStyle = '#ff4400';
            ctx.rotate(Math.atan2(this.vy, this.vx)); // Rotate to direction
            ctx.fillRect(-10, -3, 20, 6); // Long Fry Shape
        } else {
            // RAW POTATO CHUNK
            ctx.fillStyle = '#ebc27b'; // Potato Skin Color
            ctx.beginPath();
            // Irregular chunk
            ctx.moveTo(-5, -3);
            ctx.lineTo(5, -4);
            ctx.lineTo(6, 3);
            ctx.lineTo(-4, 4);
            ctx.closePath();
            ctx.fill();
            // Spots
            ctx.fillStyle = '#bfa'; // Slight greenish tint or dark spot
            ctx.beginPath(); ctx.arc(2, 0, 1, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }
}

// Arc Projectile (Axe / Masher)
class ArcProjectile {
    constructor(x, y, vx, vy, damage, isEvo) {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.damage = damage;
        this.isEvo = isEvo;
        this.active = true;
        this.gravity = 0.5;
        this.angle = 0;
        // Infinite pierce for base and evo, but track hits
        this.pierce = 999;
        this.hitList = [];
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.angle += 0.2;

        const hitRadius = 15;
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            // Check collision with squared distance
            const dx = e.x - this.x;
            const dy = e.y - this.y;
            const hitDist = e.size + hitRadius;
            if (dx * dx + dy * dy < hitDist * hitDist) {
                // Prevent multi-hitting the same enemy per throw
                if (!this.hitList.includes(e)) {
                    e.hit(this.damage, 1);
                    this.hitList.push(e);

                    if (this.pierce > 0) {
                        this.pierce--;
                        if (this.pierce <= 0) {
                            this.active = false;
                            return;
                        }
                    }
                }
            }
        }

        if (player && this.y > player.y + 500) this.active = false;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const sizeScale = this.isEvo ? 2.0 : 1.3; // Increased base size from 1.0 to 1.3
        ctx.scale(sizeScale, sizeScale);

        if (this.isEvo) {
            // EVO: Glowing Heavy Smasher
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#0088ff';

            // Handle (Metal/Blue)
            ctx.fillStyle = '#004488';
            ctx.fillRect(-4, 10, 8, 25);

            // Head (Energy Block)
            ctx.fillStyle = '#ccffff';
            ctx.fillRect(-12, -15, 24, 25);

            // Energy Arcs
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-12, -5); ctx.lineTo(12, -5);
            ctx.moveTo(-12, 5); ctx.lineTo(12, 5);
            ctx.stroke();

        } else {
            // NORMAL: Standard Potato Masher (Enhanced)

            // Handle (Wood) - Thicker
            ctx.fillStyle = '#654321';
            ctx.fillRect(-4, 10, 8, 22); // Was -3, 6w

            // Shaft (Silver) - Thicker
            ctx.fillStyle = '#999';
            ctx.fillRect(-3, 0, 6, 12); // Was -2, 4w

            // Head (Wavy/Grid Wire) - Thicker & bolder
            ctx.strokeStyle = '#aaa';
            ctx.lineWidth = 4; // Was 2
            ctx.beginPath();
            // Outer Wave
            ctx.moveTo(-12, 0); // Wider
            ctx.lineTo(-12, -12); // Taller & Wider
            ctx.lineTo(12, -12);
            ctx.lineTo(12, 0);
            // Grid lines
            ctx.moveTo(-6, 0); ctx.lineTo(-6, -12);
            ctx.moveTo(0, 0); ctx.lineTo(0, -12);
            ctx.moveTo(6, 0); ctx.lineTo(6, -12);
            ctx.moveTo(-12, -6); ctx.lineTo(12, -6);
            ctx.stroke();
        }

        ctx.restore();
    }
}

class LightningBolt {
    constructor(x, y, isEvo) {
        this.x = x; this.y = y; this.life = 10;
        this.isEvo = isEvo;
    }
    update() { this.life--; return this.life > 0; }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y - 100);
        ctx.strokeStyle = this.isEvo ? '#ff00ff' : '#00ffff';
        ctx.lineWidth = 4;

        // Visual: Glow
        ctx.shadowBlur = this.isEvo ? 30 : 20;
        ctx.shadowColor = 'white';

        ctx.beginPath();
        ctx.moveTo(0, -300);
        ctx.lineTo(10, -150);
        ctx.lineTo(-10, -50);
        ctx.lineTo(0, 100);
        ctx.stroke();
        ctx.fillStyle = 'white';
        ctx.beginPath(); ctx.arc(0, 100, 20, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}
