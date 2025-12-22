// --- Pickups ---

class Pickup {
    constructor(x, y, type) {
        this.x = x; this.y = y; this.type = type;
        this.bob = 0;
        this.symbol = type === 'health' ? '❤️' : (type === 'magnet' ? '🧲' : '🌶️');
    }
    update() {
        if (!player) return true;
        
        this.bob += 0.1;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distSq = dx * dx + dy * dy;
        const collectDist = player.radius + 30;
        const magnetDist = 100;

        if (distSq < collectDist * collectDist || (this.type === 'magnet' && distSq < magnetDist * magnetDist)) {
            // Apply effect
            if (this.type === 'health') {
                player.hp = Math.min(player.hp + 30, player.maxHp);
                if (sfx && sfx.playHeal) sfx.playHeal();
                damageNumbers.push(new FloatingText(player.x, player.y - 20, "+30 HP", '#00ff00'));
            }
            if (this.type === 'magnet') {
                if (typeof gemManager !== 'undefined') {
                    gemManager.triggerMagnet();
                } else {
                    gems.forEach(g => g.magnetized = true); // Fallback
                }
                if (sfx && sfx.playMagnet) sfx.playMagnet();
            }
            if (this.type === 'nuke') {
                // FIXED: Use copy of array to safely iterate and kill
                const targets = [...enemies];
                for (let i = 0; i < targets.length; i++) {
                    const e = targets[i];
                    if (e.type !== 'boss') {
                        // Silent kill (prevent lag spike)
                        e.die(true);
                    }
                }
                if (sfx && sfx.playNuke) sfx.playNuke();
                camera.shake = 20;
                particles.push(new Particle(camera.x, camera.y, 'white', 10));
                if (typeof updateUI === 'function') updateUI(); // One update for score
            }
            return false; // consumed
        }
        return true;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y + Math.sin(this.bob) * 5);
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Halo
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.type === 'health' ? 'red' : (this.type === 'magnet' ? 'cyan' : 'orange');

        ctx.fillText(this.symbol, 0, 0);
        ctx.restore();
    }
}

// --- Pre-rendered Assets for Gems (Performance) ---
const GEM_ASSETS = {
    green: null,
    purple: null
};

function createGemAsset(color) {
    const c = document.createElement('canvas');
    c.width = 24; c.height = 24; // 12px radius + margin
    const x = c.getContext('2d');

    x.translate(12, 12);
    x.fillStyle = color;
    x.shadowColor = color;
    x.shadowBlur = 8; // Bake the shadow!

    x.beginPath();
    x.moveTo(0, -6); x.lineTo(6, 0); x.lineTo(0, 6); x.lineTo(-6, 0);
    x.fill();

    return c;
}

class Gem {
    constructor(x, y, val, type = 'green') {
        this.x = x; this.y = y; this.val = val;
        this.type = type;
        this.magnetized = false;
    }
    update() {
        if (!player) return true;
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distSq = dx * dx + dy * dy;
        const pickupRange = CONSTANTS.PICKUP_RANGE * player.stats.pickupMult;
        
        if (distSq < pickupRange * pickupRange) this.magnetized = true;
        if (this.magnetized) {
            const dist = Math.sqrt(distSq);
            if (dist > 0) {
                const moveSpeed = 12;
                this.x += (dx / dist) * moveSpeed;
                this.y += (dy / dist) * moveSpeed;
            }
            const collectDist = player.radius + 10;
            if (distSq < collectDist * collectDist) { 
                player.gainXp(this.val); 
                return false; 
            }
        }
        return true;
    }
    draw(ctx) {
        // Initialize assets once
        if (!GEM_ASSETS.green) {
            GEM_ASSETS.green = createGemAsset('#00ff00');
            GEM_ASSETS.purple = createGemAsset('#aa00ff');
        }

        const asset = this.type === 'purple' ? GEM_ASSETS.purple : GEM_ASSETS.green;
        // Draw Image is 100x faster than Path+Shadow
        ctx.drawImage(asset, Math.floor(this.x - 12), Math.floor(this.y - 12));
    }
}

class GoldenSpatula {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.bob = 0;
        this.angle = 0;
    }
    update() {
        if (!player) return true;
        
        this.bob += 0.05;
        this.angle += 0.02;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const collectDist = player.radius + 40;
        if (dx * dx + dy * dy < collectDist * collectDist) {
            // Interact
            if (sfx && sfx.playEvolve) sfx.playEvolve(); // Divine sound
            // Grants 5 items automatically (Auto-Collect Mode)
            if (typeof triggerLevelUp === 'function') triggerLevelUp(5, true, true);
            return false; // Remove
        }
        return true;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y + Math.sin(this.bob) * 10);

        // Glow
        ctx.shadowBlur = 40 + Math.sin(this.bob * 2) * 20;
        ctx.shadowColor = '#FFD700';

        // Spatula Visual
        ctx.rotate(this.angle);
        ctx.fillStyle = '#FFD700'; // Gold
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 3;

        // Handle
        ctx.fillRect(-5, 0, 10, 40);
        ctx.strokeRect(-5, 0, 10, 40);

        // Blade
        ctx.beginPath();
        ctx.rect(-15, -40, 30, 40);
        // Slits
        ctx.rect(-8, -35, 4, 30);
        ctx.rect(4, -35, 4, 30);
        ctx.fill(); ctx.stroke();

        // Sparkle
        if (Math.random() < 0.1) {
            particles.push(new Particle(this.x + (Math.random() - 0.5) * 40, this.y + (Math.random() - 0.5) * 40, 'gold', 20));
        }

        ctx.restore();
    }
}
