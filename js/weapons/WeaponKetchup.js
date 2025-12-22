class WeaponKetchup {
    constructor(player) {
        this.player = player;
        this.level = 0;
        this.timer = 1000; // Start instantly
        this.beamActive = false;
        this.beamDuration = 0;
        this.targetAngle = 0;
    }

    update() {
        if (this.level <= 0) return;
        const isEvo = this.level > CONSTANTS.MAX_WEAPON_LEVEL;
        const cooldown = Math.max(60, 120 - (this.level * 10));

        if (!this.beamActive) {
            this.timer++;
            if (this.timer >= cooldown) {
                // Aim at Mouse
                if (typeof mouse !== 'undefined') {
                    this.targetAngle = Math.atan2(mouse.wy - this.player.y, mouse.wx - this.player.x);
                } else {
                    // Fallback
                    this.targetAngle = (this.player.facing > 0) ? 0 : Math.PI;
                }

                this.fireBeam(isEvo);
                this.timer = 0;
            }
        } else {
            this.beamDuration--;
            if (this.beamDuration <= 0) {
                this.beamActive = false;
            }
        }
    }

    fireBeam(isEvo) {
        this.beamActive = true;
        this.beamDuration = 20;
        sfx.playLaser();

        const length = 900;
        // Collision Width: Increased to match visual glow/pulse (Red Sides)
        // Standard: Base 40 + Glow ~30 = 70
        // Evo: Base 80 + Glow ~50 = 130
        const width = isEvo ? 130 : 70;

        const p1 = { x: this.player.x, y: this.player.y };
        const p2 = {
            x: this.player.x + Math.cos(this.targetAngle) * length,
            y: this.player.y + Math.sin(this.targetAngle) * length
        };

        let dmg = 20 * Math.pow(1.5, this.level);
        // Slight nerf at max level (pre-evo)
        if (!isEvo && this.level === CONSTANTS.MAX_WEAPON_LEVEL) {
            dmg *= 0.88; // ~12% reduction
        }
        if (isEvo) dmg *= 2;
        dmg *= this.player.stats.dmgMult;

        // Visual: Muzzle Flash
        particles.push(new Particle(this.player.x + Math.cos(this.targetAngle) * 20, this.player.y + Math.sin(this.targetAngle) * 20, isEvo ? 'orange' : 'red', 10, 'blast', isEvo ? 30 : 20));
        camera.shake += isEvo ? 8 : 4; // Add Kick

        enemies.forEach(e => {
            const d = this.distToSegment(e, p1, p2);
            if (d < width / 2 + e.size) {
                // Gameplay: Knockback
                e.hit(dmg, isEvo ? 12 : 6);
                if (typeof sfx !== 'undefined' && sfx.playHit) sfx.playHit('laser'); // Explicit source for AudioOptimizer
                // Visual Sync: Flash duration matches beam duration (20 frames)
                e.visualFlashTimer = 20;

                // Visual: Impact Blast per hit (reduced particle count for performance)
                particles.push(new Particle(e.x, e.y, isEvo ? 'orange' : 'red', 15, 'circle', 4));

                if (isEvo) {
                    particles.push(new Particle(e.x, e.y, 'orange', 5));
                }
            }
        });
    }

    distToSegment(p, v, w) {
        const l2 = Math.hypot(v.x - w.x, v.y - w.y) ** 2;
        if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        const proj = { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
        return Math.hypot(p.x - proj.x, p.y - proj.y);
    }

    draw(ctx) {
        if (!this.beamActive) return;
        const isEvo = this.level > CONSTANTS.MAX_WEAPON_LEVEL;
        const length = 900;
        // Visual: Pulsing Beam
        const pulse = Math.random() * (isEvo ? 20 : 10);
        const width = (isEvo ? 80 : 40) + pulse;

        ctx.save();
        ctx.rotate(this.targetAngle);

        // Additive blending so we don't hide enemies flashing white underneath
        ctx.globalCompositeOperation = 'lighter';

        ctx.shadowBlur = isEvo ? 60 : 40;
        ctx.shadowColor = isEvo ? 'orange' : '#ff0000';

        ctx.fillStyle = isEvo ? '#ff4500' : '#ff0000';
        ctx.fillRect(0, -width / 2, length, width);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(0, -width / 4, length, width / 2);

        ctx.restore();
    }
}
