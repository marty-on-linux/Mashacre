
// --- Mash King (Final Boss) ---

class MashKing extends Boss {
    constructor(x, y) {
        super(x, y, true); // isKing = true

        // Ensure stats are set if super didn't fully cover custom king logic
        this.name = "THE MASH KING";
        this.hp = 60000;
        this.maxHp = this.hp;
        this.size = 120; // Massive
        this.speed = 2.0;

        this.beamTimer = 0;
        this.isBeaming = false;
        this.beamWarmup = 0;
    }


    update() {
        if (this.isDead) { // Meta Death State
            return;
        }

        if (!this.isBeaming) {
            super.update(); // Move and Knife Attack

            // Beam Logic
            this.beamTimer++;
            if (this.beamTimer > 300) { // Every 5 seconds
                this.startBeam();
            }
        } else {
            // Beaming State
            this.beamWarmup++;
            if (this.beamWarmup > 60) {
                // Fire Beam
                this.fireBeam();
                this.isBeaming = false;
                this.beamTimer = 0;
            }
        }
    }

    startBeam() {
        this.isBeaming = true;
        this.beamWarmup = 0;
        if (typeof sfx !== 'undefined') sfx.playLightning(); // Warning sound
    }

    fireBeam() {
        if (typeof sfx !== 'undefined') sfx.playNuke(); // Big boom
        camera.shake = 30;

        // Hit Player if vertically aligned (Wide horizontal beam)
        const beamY = this.y;
        const beamHeight = 100;

        // Visual Effect
        particles.push(new MegaBeamParticle(this.y, beamHeight));

        // Collision
        if (player.y > beamY - beamHeight / 2 && player.y < beamY + beamHeight / 2) {
            player.takeDamage(75);
        }
    }

    takeDamage(amount) {
        if (this.isDead) return;
        super.takeDamage(amount);
        // Check health manually if super.takeDamage doesn't trigger a custom die hook we can rely on
        // But wait, Enemy.takeDamage usually calls this.die() if hp <= 0.
        // So we override die() instead.
    }

    // Override die to prevent despawn
    die() {
        if (this.isDead) return;
        this.isDead = true;

        // 1. Visual Death
        // (Handled in draw)

        // 2. Stop Spawning
        WaveManager.stopSpawning();

        // 3. Spawn Crown Pickup
        // 3. Spawn Crown Pickup (Offset to be visible below corpse)
        pickups.push(new CrownPickup(this.x, this.y + 300));

        // 4. Update UI (Hide Boss Bar)
        // Do NOT set activeBoss = null, so main.js spawn loop is blocked.
        document.getElementById('boss-bar-container').style.display = 'none';

        // 5. Sound
        if (typeof sfx !== 'undefined') sfx.playBossSpawn(); // Or some death sound
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.isDead) {
            // CORPSE VISUALS
            ctx.rotate(Math.PI / 2); // 90 degrees (Tipped over)

            // Potato Body (Darker/Dead)
            ctx.fillStyle = '#8B4513';
            ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
            ctx.lineWidth = 5; ctx.strokeStyle = '#5c2e0e'; ctx.stroke();

            // Dead Face (X Eyes)
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'black';

            // Left Eye X
            ctx.beginPath();
            ctx.moveTo(-30, -15); ctx.lineTo(-10, 5);
            ctx.moveTo(-10, -15); ctx.lineTo(-30, 5);
            ctx.stroke();

            // Right Eye X
            ctx.beginPath();
            ctx.moveTo(10, -15); ctx.lineTo(30, 5);
            ctx.moveTo(30, -15); ctx.lineTo(10, 5);
            ctx.stroke();

            // Tongue sticking out?
            ctx.fillStyle = 'pink';
            ctx.beginPath(); ctx.arc(0, 20, 10, 0, Math.PI); ctx.fill();

            // NO CROWN (It dropped)

        } else {
            // ALIVE VISUALS
            if (this.isBeaming) {
                // Warning Flash
                if (Math.floor(frameCount / 4) % 2 === 0) {
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
                    ctx.fillRect(player.x - 1000, -50, 2000, 100); // Relative to boss pos? No, translate is on.
                    // Actually fillRect is affected by translate.
                    // We want to draw world coords or local? 
                    // Original code used player.x - 1000 with this.y - 50.
                    // But we are translated to this.x, this.y.
                    // So we must untranslate or draw relative.
                    // Original code: ctx.fillRect(player.x - 1000, this.y - 50, ...)
                    // Wait, original code draw() did translate!
                    // Original: ctx.translate(this.x, this.y); then fillRect(player.x - 1000...). 
                    // That would draw it offset by Boss Pos + Player Pos. That's a BUG in original code if it meant world coords.
                    // But let's stick to what works or fix it. 
                    // To draw a beam across screen at Boss Y:
                    // Since we are at 0,0 (Boss Center):
                    ctx.save();
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
                    // Draw massive bar across X
                    ctx.fillRect(-2000, -50, 4000, 100);
                    ctx.restore();
                }
            }

            if (this.flashTime > 0) {
                ctx.fillStyle = 'white';
                ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
            } else {
                // Red Cape (Behind)
                ctx.fillStyle = '#8B0000';
                ctx.beginPath();
                ctx.moveTo(-this.size, 0);
                ctx.lineTo(this.size, 0);
                ctx.lineTo(this.size * 0.8, this.size * 1.5);
                ctx.lineTo(0, this.size * 1.2);
                ctx.lineTo(-this.size * 0.8, this.size * 1.5);
                ctx.fill();

                // Potato Body
                ctx.fillStyle = '#CD853F'; // Peru
                ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
                ctx.lineWidth = 5; ctx.strokeStyle = '#8B4513'; ctx.stroke();

                // Face (Angry King)
                ctx.fillStyle = 'black';
                ctx.beginPath(); ctx.arc(-30, -10, 10, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(30, -10, 10, 0, Math.PI * 2); ctx.fill();

                // Brows
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.moveTo(-45, -25); ctx.lineTo(-15, -15);
                ctx.moveTo(45, -25); ctx.lineTo(15, -15);
                ctx.stroke();

                // Crown
                ctx.fillStyle = 'gold';
                ctx.beginPath();
                ctx.moveTo(-50, -this.size + 40);
                ctx.lineTo(-25, -this.size - 20);
                ctx.lineTo(0, -this.size + 20);
                ctx.lineTo(25, -this.size - 20);
                ctx.lineTo(50, -this.size + 40);
                ctx.fill();
                ctx.strokeStyle = '#DAA520'; ctx.lineWidth = 3; ctx.stroke();

                // Jewels
                ctx.fillStyle = 'red';
                ctx.beginPath(); ctx.arc(0, -this.size + 20, 5, 0, Math.PI * 2); ctx.fill();
            }
        }
        ctx.restore();
    }
}

class MegaBeamParticle {
    constructor(y, height) {
        this.y = y; this.height = height;
        this.life = 20;
    }
    update() { this.life--; return this.life > 0; }
    draw(ctx) {
        // Draw in World Coordinates (Not relative to Boss)
        // Because particles are drawn in main loop without boss translation

        ctx.fillStyle = `rgba(255, 0, 0, ${this.life / 20})`;
        ctx.fillRect(player.x - 1000, this.y - this.height / 2, 2000, this.height);

        ctx.fillStyle = 'white';
        ctx.fillRect(player.x - 1000, this.y - 5, 2000, 10); // Core
    }
}

