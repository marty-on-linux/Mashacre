class WeaponSquash {
    constructor(player) {
        this.player = player;
        this.level = 0;
        this.timer = 500;
        this.pressActive = false;
        this.pressPhase = 0;
        this.pressX = 0;
        this.pressY = 0;

        // Evo: Screen Wipe
        this.evoTimer = 0;
    }

    update() {
        if (this.level <= 0) return;
        const isEvo = this.level > CONSTANTS.MAX_WEAPON_LEVEL;

        if (!this.pressActive) {
            this.timer++;
            const interval = Math.max(180, 480 - (this.level * 30));

            if (this.timer >= interval) {
                this.triggerPress(isEvo);
                this.timer = 0;
            }
        } else {
            this.pressPhase += 0.015;

            if (this.pressPhase >= 1) {
                this.applyImpact(isEvo);
                this.pressActive = false;
                this.pressPhase = 0;
            }
        }


    }

    triggerPress(isEvo) {
        this.pressActive = true;
        this.pressPhase = 0;

        // Use squared distance for performance
        const rangeSq = 450 * 450;
        const targets = [];
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            const dx = e.x - this.player.x;
            const dy = e.y - this.player.y;
            if (dx * dx + dy * dy < rangeSq) targets.push(e);
        }

        if (targets.length > 0) {
            const target = targets[Math.floor(Math.random() * targets.length)];
            this.pressX = target.x;
            this.pressY = target.y;
        } else {
            const angle = Math.random() * Math.PI * 2;
            const dist = 150 + Math.random() * 200;
            this.pressX = this.player.x + Math.cos(angle) * dist;
            this.pressY = this.player.y + Math.sin(angle) * dist;
        }
    }

    applyImpact(isEvo) {
        sfx.playSplat();
        camera.shake = isEvo ? 60 : 30; // Double shake for Evo

        // Radius: Standard ~350, Evo ~700 (Double size requested)
        let radius = 200 + (this.level * 30);
        if (isEvo) radius *= 2;

        // Visuals
        const particleCount = isEvo ? 50 : 20;
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * radius;
            const color = isEvo ? '#FFD700' : 'brown'; // Gold sparkles for Evo
            particles.push(new Particle(this.pressX + Math.cos(angle) * dist, this.pressY + Math.sin(angle) * dist, color, 10));
        }
        particles.push(new Particle(this.pressX, this.pressY, 'rgba(100,100,100,0.5)', isEvo ? 80 : 40));

        // Shockwave Visual (Evo)
        if (isEvo) {
            // We don't have a specific shockwave particle, but we can simulate ring with many particles
            for (let i = 0; i < 36; i++) {
                const ang = (i / 36) * Math.PI * 2;
                particles.push(new Particle(this.pressX + Math.cos(ang) * radius, this.pressY + Math.sin(ang) * radius, 'white', 15, 'circle', 5));
            }
            damageNumbers.push(new FloatingText(this.pressX, this.pressY - 100, "EARTHQUAKE!", "orange", 60, 40));
            sfx.playBossSpawn(); // Heavy thud
        }

        // Logic: Squish & Slow (Standard) -> Shockwave (Evo)
        // We use a wider logic for Evo
        const hitRadius = radius;
        const hitRadiusSq = hitRadius * hitRadius;
        const shockwaveRadius = isEvo ? radius * 1.5 : 0; // Shockwave extends beyond impact
        const shockwaveRadiusSq = shockwaveRadius * shockwaveRadius;

        const enemiesCopy = [...enemies];
        for (let i = 0; i < enemiesCopy.length; i++) {
            const e = enemiesCopy[i];
            if (e.type === 'boss') continue;
            const dx = e.x - this.pressX;
            const dy = e.y - this.pressY;
            const dSq = dx * dx + dy * dy;

            // Primary Impact (Squash)
            if (dSq < hitRadiusSq) {
                e.isSquashed = true;
                e.squashTimer = 180; // 3 Seconds
                e.applySlow(180);    // 3 Seconds

                let baseDmg = 50 * Math.pow(1.4, this.level);
                if (isEvo) baseDmg *= 2;
                const dmg = baseDmg * this.player.stats.dmgMult;

                e.hit(dmg, 0.5);
                if (typeof sfx !== 'undefined' && sfx.playHit) sfx.playHit('press'); // Explicit source for AudioOptimizer
            }
            // Secondary Shockwave (Evo only) - Knockback only
            else if (isEvo && dSq < shockwaveRadiusSq) {
                e.hit(10, 20); // Low dmg, massive knockback
                e.visualFlashTimer = 10;
            }
        }
    }



    draw(ctx) {
        if (!this.pressActive || this.level <= 0) return;

        ctx.save();
        ctx.translate(this.pressX - this.player.x, this.pressY - this.player.y);

        // Shadow (Target Indicator)
        // Option A: Golden Spotlight (Friendly/Gravy Theme)
        const shadowAlpha = Math.min(0.6, this.pressPhase * 0.8);
        const radius = 200 + (this.level * 30);

        ctx.shadowBlur = 30;
        ctx.shadowColor = 'orange';
        ctx.fillStyle = `rgba(255, 170, 0, ${shadowAlpha})`; // Golden Amber

        const shadowScale = 0.5 + (this.pressPhase * 0.5);
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * shadowScale, radius * shadowScale * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Reset Shadow for other elements (can)
        ctx.shadowBlur = 0;

        // Projectile: STRAIGHT DROP
        let drawY = -1200;

        if (this.pressPhase > 0.6) {
            const dropProg = (this.pressPhase - 0.6) / 0.4;
            drawY = -1000 * (1 - dropProg);
        }

        if (this.pressPhase > 0.6) {
            ctx.translate(0, drawY);

            // Visual: Giant Tin Can (Centered)
            const isEvo = this.level > CONSTANTS.MAX_WEAPON_LEVEL;
            let scale = 1;
            if (isEvo) scale = 2; // Double Size

            ctx.scale(scale, scale);

            const w = 120;
            const h = 150;

            // Evo: GOLD CAN
            ctx.fillStyle = isEvo ? '#FFD700' : '#C0C0C0'; // Gold vs Silver
            ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.fill();
            ctx.lineWidth = 2; ctx.strokeStyle = isEvo ? '#DAA520' : '#666'; ctx.stroke();

            ctx.fillStyle = isEvo ? '#DAA520' : '#8B4513'; // Dark Gold vs Brown label
            ctx.beginPath(); ctx.rect(-w / 2, -30, w, 60); ctx.fill();

            // Lid / Bottom
            ctx.fillStyle = isEvo ? '#F0E68C' : '#A9A9A9';
            ctx.beginPath(); ctx.ellipse(0, -h / 2, w / 2, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(0, h / 2, w / 2, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

            // Label Text
            if (isEvo) {
                ctx.fillStyle = 'white';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText("PREMIUM", 0, 5);
            }
        }

        ctx.restore();
    }
}
