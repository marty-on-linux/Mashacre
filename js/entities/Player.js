
// --- Player Class ---

class Player {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.radius = 20;
        this.color = '#d2b48c';
        this.speed = CONSTANTS.PLAYER_SPEED;
        this.maxHp = CONSTANTS.PLAYER_HP;
        this.hp = this.maxHp;
        this.level = 1;
        this.xp = 0;
        this.xpToNext = 50; // Increased Base XP req (was 30)
        this.wobble = 0;
        this.facing = 1;
        this.invuln = 0;

        // Stats - BUFFED STARTERS
        // 50% Base Damage Boost, 10% Base Magnetism. Regen added.
        this.stats = { dmgMult: 1.5, pickupMult: 1.1, speedMult: 1, regen: 0 };
        this.regenTimer = 0;

        // Inventory
        this.weapons = {
            spud_gun: { level: 1, timer: 0 },
            peeler: { level: 0, timer: 0 },
            masher: { level: 0, timer: 0 },
            oil: { level: 0, timer: 0 },
            storm: { level: 0, timer: 0 },
            garlic: { level: 0, timer: 0 },
            gravy: { level: 0, timer: 0 },
            ketchup: { level: 0, timer: 0 },
            tots: { level: 0, timer: 0 },
            grater: { level: 0, timer: 0 }
        };

        // Delegate to Weapon Class
        this.peelerWeapon = new Peeler(this);
        this.gravyWeapon = new WeaponSquash(this);
        this.ketchupWeapon = new WeaponKetchup(this);
        this.totsWeapon = new WeaponTots(this);
        this.graterWeapon = new WeaponGrater(this);
    }

    update() {
        let dx = 0; let dy = 0;
        if (keys.w || keys.ArrowUp) dy = -1;
        if (keys.s || keys.ArrowDown) dy = 1;
        if (keys.a || keys.ArrowLeft) dx = -1;
        if (keys.d || keys.ArrowRight) dx = 1;

        if (dx !== 0 || dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length; dy /= length;
            this.wobble += 0.3;
            if (dx !== 0) this.facing = Math.sign(dx);
        } else {
            this.wobble = 0;
        }

        this.x += dx * (this.speed * this.stats.speedMult);
        this.y += dy * (this.speed * this.stats.speedMult);

        if (this.invuln > 0) this.invuln--;

        // Regen Logic
        if (this.hp < this.maxHp && this.stats.regen > 0) {
            this.regenTimer++;
            if (this.regenTimer >= 60) {
                this.hp = Math.min(this.hp + this.stats.regen, this.maxHp);
                this.regenTimer = 0;
            }
        }

        // --- Weapon Logic ---

        // 1. Peeler (Delegated)
        if (this.weapons.peeler.level > 0) {
            this.peelerWeapon.update(this.weapons.peeler.level);
        }

        // 2. Spud Gun (Wand)
        if (this.weapons.spud_gun.level > 0) {
            this.weapons.spud_gun.timer++;
            const level = this.weapons.spud_gun.level;
            const isEvo = level > CONSTANTS.MAX_WEAPON_LEVEL;

            // Fire Rate
            const rate = Math.max(5, 50 - (level * 5));

            if (this.weapons.spud_gun.timer >= rate) {
                this.fireSpudGun(level, isEvo);
                this.weapons.spud_gun.timer = 0;
            }
        }

        // 3. Masher (Axe)
        if (this.weapons.masher.level > 0) {
            this.weapons.masher.timer++;
            const level = this.weapons.masher.level;
            const isEvo = level > CONSTANTS.MAX_WEAPON_LEVEL;

            const rate = isEvo ? 30 : Math.max(20, 70 - (level * 5));

            if (this.weapons.masher.timer >= rate) {
                // Projectile Count Scaling: 1 -> 2 -> 3... Evo: 10
                const count = isEvo ? 10 : (1 + Math.floor(level / 2));

                let baseDmg = 30 * Math.pow(1.3, level);
                if (isEvo) baseDmg *= 2;
                const dmg = baseDmg * this.stats.dmgMult;

                sfx.playShoot();
                // SCALING: Throw Faster/Further + More Spread
                // Base vy = -14. Level 5 -> -16.5. Evo -> -20.
                const speedMod = level * 0.5 + (isEvo ? 4 : 0);

                for (let i = 0; i < count; i++) {
                    const spread = 10 + (level * 2);
                    const vx = (Math.random() - 0.5) * spread;
                    const vy = -14 - speedMod;
                    projectiles.push(new ArcProjectile(this.x, this.y, vx, vy, dmg, isEvo));
                }
                this.weapons.masher.timer = 0;
            }
        }

        // 4. Hot Oil (Holy Water)
        if (this.weapons.oil.level > 0) {
            this.weapons.oil.timer++;
            const level = this.weapons.oil.level;
            const isEvo = level > CONSTANTS.MAX_WEAPON_LEVEL;

            const rate = Math.max(30, 140 - (level * 15));

            if (this.weapons.oil.timer >= rate) {
                const count = isEvo ? 3 : 1;
                let baseDmg = 6 * Math.pow(1.3, level);
                if (isEvo) baseDmg *= 3; // Massive DoT boost
                const dmg = baseDmg * this.stats.dmgMult;

                for (let i = 0; i < count; i++) {
                    let targetX, targetY;

                    // TARGETING: Find enemies within throw range
                    const throwRange = 350 + (level * 20); // Approx range
                    const throwRangeSq = throwRange * throwRange; // Cache squared distance
                    let targets = [];
                    const maxTargets = 20; // Limit search for performance
                    for (let j = 0; j < enemies.length && targets.length < maxTargets; j++) {
                        const e = enemies[j];
                        const dx = e.x - this.x;
                        const dy = e.y - this.y;
                        if (dx * dx + dy * dy < throwRangeSq) targets.push(e);
                    }

                    if (targets.length > 0) {
                        // Pick random target
                        const t = targets[Math.floor(Math.random() * targets.length)];
                        targetX = t.x;
                        targetY = t.y;
                    } else {
                        // Fallback to random throw
                        const angle = Math.random() * Math.PI * 2;
                        const dist = 100 + Math.random() * 200;
                        targetX = this.x + Math.cos(angle) * dist;
                        targetY = this.y + Math.sin(angle) * dist;
                    }

                    // TUNING: Area Radius increases with Level
                    // Base 60. Level 5 -> 85. Evo -> 150.
                    const radius = 60 + (level * 5) + (isEvo ? 50 : 0);

                    projectiles.push(new ThrownOil(this.x, this.y, targetX, targetY, dmg, isEvo, radius));
                }
                this.weapons.oil.timer = 0;
            }
        }

        // 5. Fryer Storm (Lightning)
        if (this.weapons.storm.level > 0) {
            this.weapons.storm.timer++;
            const level = this.weapons.storm.level;
            const isEvo = level > CONSTANTS.MAX_WEAPON_LEVEL;

            const rate = isEvo ? 30 : Math.max(40, 90 - (level * 5));

            if (this.weapons.storm.timer >= rate) {
                let baseDmg = 40 * Math.pow(1.4, level);
                if (isEvo) baseDmg *= 2.5;
                const dmg = baseDmg * this.stats.dmgMult;

                // SCALING: Count equals Level (Evo = 10)
                const count = isEvo ? 10 : level;

                // Hit random enemies
                // Hit random enemies ON SCREEN (approx 900px dist)
                let targets = enemies.filter(e => Math.hypot(e.x - this.x, e.y - this.y) < 900);

                for (let i = 0; i < count; i++) {
                    if (targets.length > 0) {
                        const target = targets[Math.floor(Math.random() * targets.length)];
                        target.hit(dmg, 0);
                        particles.push(new LightningBolt(target.x, target.y, isEvo));
                        sfx.playLightning();
                    }
                }
                this.weapons.storm.timer = 0;
            }
        }

        // 6. Garlic
        if (this.weapons.garlic.level > 0) {
            if (frameCount % 15 === 0) {
                const level = this.weapons.garlic.level;
                const isEvo = level > CONSTANTS.MAX_WEAPON_LEVEL;

                // Nerfed Start: Base 100 (was 160). Scales faster (30 vs 25).
                const radius = (100 + level * 30) + (isEvo ? 100 : 0);
                const radiusSq = radius * radius;
                // Nerfed Start: Base 3 (was 5).
                let baseDmg = 3 * Math.pow(1.3, level);
                if (isEvo) baseDmg *= 2;
                const dmg = baseDmg * this.stats.dmgMult;
                const kb = isEvo ? 5 : 1;

                for (let i = 0; i < enemies.length; i++) {
                    const e = enemies[i];
                    const dx = e.x - this.x;
                    const dy = e.y - this.y;
                    if (dx * dx + dy * dy < radiusSq) {
                        e.hit(dmg, kb); // Further Reduced Knockback
                        e.applySlow(40); // Reduced slow duration
                    }
                }
            }
        }

        // 7. Gravy Press
        if (this.weapons.gravy.level > 0) {
            this.gravyWeapon.level = this.weapons.gravy.level;
            this.gravyWeapon.update();
        }

        // 8. Ketchup Laser
        if (this.weapons.ketchup.level > 0) {
            this.ketchupWeapon.level = this.weapons.ketchup.level;
            this.ketchupWeapon.update();
        }

        // 9. Tater Tots
        if (this.weapons.tots.level > 0) {
            this.totsWeapon.level = this.weapons.tots.level;
            this.totsWeapon.update();
        }

        // 10. Cheese Grater
        if (this.weapons.grater.level > 0) {
            this.graterWeapon.level = this.weapons.grater.level;
            this.graterWeapon.update();
        }
    }

    fireSpudGun(level, isEvo) {
        // Find nearest enemies (multi-target) - optimized sorting
        let targets = [];
        const count = isEvo ? 10 : level;
        const range = 600 + (level * 50) + (isEvo ? 300 : 0);
        const rangeSq = range * range;

        // Build target list with cached distances for sorting
        const candidates = [];
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            const dx = e.x - this.x;
            const dy = e.y - this.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < rangeSq) {
                candidates.push({ enemy: e, distSq: distSq });
            }
        }

        // Only sort if we have candidates, and only sort what we need
        if (candidates.length > 0) {
            candidates.sort((a, b) => a.distSq - b.distSq);
            
            for (let i = 0; i < Math.min(count, candidates.length); i++) {
                targets.push(candidates[i].enemy);
            }
        }

        if (targets.length > 0) {
            sfx.playShoot();
            let baseDmg = 15 * Math.pow(1.3, level);
            if (isEvo) baseDmg *= 2;
            const dmg = baseDmg * this.stats.dmgMult;

            // Fire all projectiles immediately (no setTimeout - prevents memory leaks)
            targets.forEach((target, i) => {
                // Small spread angle for staggered visual effect instead of setTimeout
                const spread = i * 0.02;
                projectiles.push(new Projectile(this.x, this.y, target, dmg, isEvo, spread));
            });
        }
    }

    gainXp(amount) {
        sfx.playGem();
        if (this.level >= 100) return; // Level Cap at 100

        this.xp += amount;
        if (this.xp >= this.xpToNext) {
            this.xp -= this.xpToNext;
            this.level++;
            // Trigger UI
            if (typeof triggerLevelUp === 'function') triggerLevelUp();

            // Full Heal on Level Up
            this.hp = this.maxHp;
            damageNumbers.push(new FloatingText(this.x, this.y - 30, "FULL HEAL!", "#00ff00"));

            // Smoother XP Curve
            // Smoother XP Curve: Much steeper to slow down early game
            this.xpToNext = Math.ceil(this.xpToNext * 1.3 + 20);
            updateUI();
            triggerLevelUp();
        }
        updateUI();
    }

    takeDamage(amount) {
        if (this.invuln > 0) return;

        this.hp -= amount;
        this.invuln = 10; // Reduced from 30 (0.16s I-Frames)
        camera.shake = 10;
        sfx.playHit();
        if (this.hp <= 0) gameOver();
        updateUI();
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // I-Frame Flash
        if (this.invuln > 0 && Math.floor(frameCount / 4) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Garlic Aura
        if (this.weapons.garlic.level > 0) {
            const level = this.weapons.garlic.level;
            const isEvo = level > CONSTANTS.MAX_WEAPON_LEVEL;
            const radius = (100 + level * 30) + (isEvo ? 100 : 0);

            // VISUAL UPDATE: Clean "Breathing" Aura
            const breathe = 0.5 + Math.sin(frameCount * 0.05) * 0.1; // 0.4 to 0.6 range

            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);

            // Soft Fill
            ctx.fillStyle = isEvo ? `rgba(255, 0, 0, 0.1)` : `rgba(255, 255, 200, 0.08)`;
            ctx.fill();

            // Breathing Stroke
            ctx.lineWidth = 2 + Math.sin(frameCount * 0.1);
            ctx.strokeStyle = isEvo ? `rgba(255, 0, 0, ${breathe})` : `rgba(255, 255, 180, ${breathe})`;
            ctx.stroke();
        }

        // Player Sprite - Main Potato Hero
        const tilt = (this.wobble > 0) ? Math.sin(this.wobble) * 0.1 : 0;
        ctx.rotate(tilt);

        // Legs (stubby potato legs)
        const legOffset = Math.sin(this.wobble) * 5;
        ctx.fillStyle = '#8b5a2b';
        ctx.strokeStyle = '#6b3a1b'; ctx.lineWidth = 2;
        // Left leg
        ctx.beginPath();
        ctx.ellipse(-10, 22 + legOffset, 6, 10, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        // Right leg
        ctx.beginPath();
        ctx.ellipse(10, 22 - legOffset, 6, 10, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        // Body - lumpy potato shape
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#9a7856';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -28);
        ctx.bezierCurveTo(22, -26, 28, -8, 24, 8);
        ctx.bezierCurveTo(22, 22, 8, 26, 0, 26);
        ctx.bezierCurveTo(-10, 26, -22, 20, -24, 8);
        ctx.bezierCurveTo(-28, -10, -22, -26, 0, -28);
        ctx.fill(); ctx.stroke();

        // Potato skin spots
        ctx.fillStyle = '#b89868';
        ctx.beginPath(); ctx.arc(-12, 5, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(8, 12, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(15, -5, 2.5, 0, Math.PI * 2); ctx.fill();

        // Face
        ctx.scale(this.facing, 1);
        
        // Eyes - big expressive potato eyes
        ctx.fillStyle = 'white';
        ctx.beginPath(); ctx.ellipse(-4, -8, 7, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(10, -8, 7, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#886644'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(-4, -8, 7, 8, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(10, -8, 7, 8, 0, 0, Math.PI * 2); ctx.stroke();

        // Pupils
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.arc(-3, -7, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(11, -7, 3, 0, Math.PI * 2); ctx.fill();

        // Eye shine
        ctx.fillStyle = 'white';
        ctx.beginPath(); ctx.arc(-1, -9, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(13, -9, 1.5, 0, Math.PI * 2); ctx.fill();

        ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 2;

        // VISUAL UPGRADE: Scared Face if HP < 20%
        if (this.hp < this.maxHp * 0.2) {
            // Worried mouth
            ctx.beginPath();
            ctx.arc(3, 5, 6, 0.2 * Math.PI, 0.8 * Math.PI);
            ctx.stroke();
            // Sweat drops
            ctx.fillStyle = '#88ccff';
            ctx.beginPath();
            ctx.moveTo(18, -18);
            ctx.quadraticCurveTo(20, -14, 18, -10);
            ctx.quadraticCurveTo(16, -14, 18, -18);
            ctx.fill();
        } else {
            // Happy determined smile
            ctx.beginPath();
            ctx.arc(3, 2, 8, 0.1 * Math.PI, 0.9 * Math.PI);
            ctx.stroke();
        }

        ctx.scale(1 / this.facing, 1);
        ctx.rotate(-tilt);

        // Peeler Drawing (Delegated)
        if (this.weapons.peeler.level > 0) {
            this.peelerWeapon.draw(ctx, this.weapons.peeler.level);
        }

        // 7. Gravy Press
        if (this.weapons.gravy.level > 0) {
            this.gravyWeapon.draw(ctx);
        }

        // 8. Ketchup Laser
        if (this.weapons.ketchup.level > 0) {
            this.ketchupWeapon.draw(ctx);
        }


        ctx.restore();
    }
}
