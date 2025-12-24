
// --- Boss Class ---

// Depends on Enemy class existing (loaded in entities.js)

class Boss extends Enemy {
    constructor(x, y, isKing = false) {
        super(x, y);
        this.isKing = isKing;

        // BOSS SCALING: +25% HP Per Boss Kill
        let scaling = 1 + (bossKills * 0.25);
        this.hp = (isKing ? 15000 : 3000 + (player.level * 200)) * scaling;

        this.maxHp = this.hp;
        this.name = isKing ? "THE MASH KING" : "The Chef";
        this.size = isKing ? 100 : 75;
        this.speed = isKing ? 2.0 : 2.5;
        this.type = 'boss';
        this.attackTimer = 0;
        this.isElite = false;

        // Boss resists knockback heavily but not immune
        this.slowTimer = 0;
    }

    update() {
        // Safety check
        if (!player) return;
        
        // Boss moves towards player but is resistent to slow
        const angle = Math.atan2(player.y - this.y, player.x - this.x);

        // Slight knockback recovery
        this.x += this.knockbackX; this.y += this.knockbackY;
        this.knockbackX *= 0.8; this.knockbackY *= 0.8;

        // Apply Speed
        let currentSpeed = this.speed;
        if (this.slowTimer > 0) {
            // Boss has 50% slow resistance (moves at 0.65x instead of 0.3x)
            currentSpeed *= 0.65;
            this.slowTimer--;
        }

        this.x += Math.cos(angle) * currentSpeed;
        this.y += Math.sin(angle) * currentSpeed;

        this.attackTimer++;
        // King Attacks Faster
        const attackRate = this.isKing ? 50 : 80;

        if (this.attackTimer > attackRate) {
            if (sfx && sfx.playKnife) sfx.playKnife();
            const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
            if (this.isKing) {
                // King shoots 5 knives in spread
                for (let i = -2; i <= 2; i++) {
                    enemyProjectiles.push(new ButcherKnife(this.x, this.y, angleToPlayer + (i * 0.15)));
                }
            } else {
                enemyProjectiles.push(new ButcherKnife(this.x, this.y, angleToPlayer));
            }
            this.attackTimer = 0;
        }

        // Use squared distance for collision check
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const collisionDist = this.size + player.radius;
        if (dx * dx + dy * dy < collisionDist * collisionDist) {
            player.takeDamage(20);
        }

        if (this.visualFlashTimer > 0) this.visualFlashTimer--;
        if (this.invulnTimer > 0) this.invulnTimer--;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const s = this.size; // Size shorthand

        // Shadow under boss - organic ellipse
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(0, s * 0.85, s * 0.95, s * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body - organic potato shape with bezier curves (like Player)
        const bodyColor = this.isKing ? '#8b5a30' : '#ffcccc';
        const strokeColor = this.isKing ? '#5a3a10' : '#aa6666';
        
        ctx.fillStyle = bodyColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        
        // Organic lumpy potato body - different for King vs Chef
        if (this.isKing) {
            // Mash King - larger, more imposing lumpy potato
            ctx.moveTo(0, -s);
            ctx.bezierCurveTo(s * 0.7, -s * 0.95, s * 1.05, -s * 0.4, s * 0.95, 0);
            ctx.bezierCurveTo(s * 1.1, s * 0.5, s * 0.85, s * 0.9, s * 0.5, s * 0.95);
            ctx.bezierCurveTo(s * 0.2, s * 1.05, -s * 0.2, s * 1.05, -s * 0.5, s * 0.95);
            ctx.bezierCurveTo(-s * 0.85, s * 0.9, -s * 1.1, s * 0.5, -s * 0.95, 0);
            ctx.bezierCurveTo(-s * 1.05, -s * 0.4, -s * 0.7, -s * 0.95, 0, -s);
        } else {
            // Chef - rounder but still organic
            ctx.moveTo(0, -s * 0.9);
            ctx.bezierCurveTo(s * 0.6, -s * 0.85, s * 0.95, -s * 0.35, s * 0.9, s * 0.1);
            ctx.bezierCurveTo(s * 0.95, s * 0.55, s * 0.7, s * 0.9, s * 0.35, s * 0.95);
            ctx.bezierCurveTo(s * 0.1, s, -s * 0.1, s, -s * 0.35, s * 0.95);
            ctx.bezierCurveTo(-s * 0.7, s * 0.9, -s * 0.95, s * 0.55, -s * 0.9, s * 0.1);
            ctx.bezierCurveTo(-s * 0.95, -s * 0.35, -s * 0.6, -s * 0.85, 0, -s * 0.9);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Body highlight/sheen
        ctx.fillStyle = this.isKing ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.ellipse(-s * 0.3, -s * 0.4, s * 0.35, s * 0.25, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Potato texture spots - organic blob shapes
        if (this.isKing) {
            ctx.fillStyle = '#6a4520';
            // Spot 1
            ctx.beginPath();
            ctx.moveTo(-s * 0.35, s * 0.15);
            ctx.bezierCurveTo(-s * 0.25, s * 0.08, -s * 0.18, s * 0.15, -s * 0.22, s * 0.28);
            ctx.bezierCurveTo(-s * 0.28, s * 0.35, -s * 0.4, s * 0.28, -s * 0.35, s * 0.15);
            ctx.fill();
            // Spot 2
            ctx.beginPath();
            ctx.moveTo(s * 0.3, -s * 0.2);
            ctx.bezierCurveTo(s * 0.38, -s * 0.28, s * 0.45, -s * 0.18, s * 0.4, -s * 0.08);
            ctx.bezierCurveTo(s * 0.32, -s * 0.05, s * 0.25, -s * 0.12, s * 0.3, -s * 0.2);
            ctx.fill();
            // Spot 3
            ctx.beginPath();
            ctx.moveTo(s * 0.1, s * 0.45);
            ctx.bezierCurveTo(s * 0.18, s * 0.4, s * 0.22, s * 0.48, s * 0.18, s * 0.58);
            ctx.bezierCurveTo(s * 0.1, s * 0.62, s * 0.02, s * 0.55, s * 0.1, s * 0.45);
            ctx.fill();
        } else {
            // Chef spots - reddish undertones
            ctx.fillStyle = '#dd9999';
            ctx.beginPath();
            ctx.moveTo(-s * 0.4, s * 0.2);
            ctx.bezierCurveTo(-s * 0.32, s * 0.12, -s * 0.25, s * 0.18, -s * 0.3, s * 0.32);
            ctx.bezierCurveTo(-s * 0.38, s * 0.38, -s * 0.48, s * 0.3, -s * 0.4, s * 0.2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(s * 0.35, s * 0.35);
            ctx.bezierCurveTo(s * 0.42, s * 0.28, s * 0.5, s * 0.35, s * 0.45, s * 0.48);
            ctx.bezierCurveTo(s * 0.38, s * 0.52, s * 0.3, s * 0.45, s * 0.35, s * 0.35);
            ctx.fill();
        }

        // Face positioning
        const faceY = -s * 0.15;
        const isSuperAngry = (bossKills >= 2);

        // Eyes - expressive with highlights
        const eyeSpacing = s * 0.28;
        const eyeSize = s * 0.12;
        
        // Eye whites
        ctx.fillStyle = 'white';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(-eyeSpacing, faceY, eyeSize, eyeSize * 1.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(eyeSpacing, faceY, eyeSize, eyeSize * 1.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Pupils - angry red for super angry
        ctx.fillStyle = isSuperAngry ? '#cc0000' : '#222';
        const pupilSize = eyeSize * 0.6;
        ctx.beginPath();
        ctx.arc(-eyeSpacing, faceY + 2, pupilSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeSpacing, faceY + 2, pupilSize, 0, Math.PI * 2);
        ctx.fill();

        // Eye shine
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-eyeSpacing + 3, faceY - 2, pupilSize * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeSpacing + 3, faceY - 2, pupilSize * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Angry eyebrows - scaled to boss kills
        if (bossKills > 0 || this.isKing) {
            const angerLevel = this.isKing ? 0.6 : (bossKills >= 2 ? 0.5 : 0.25);
            ctx.lineWidth = 4;
            ctx.strokeStyle = this.isKing ? '#3a2510' : '#663333';
            ctx.lineCap = 'round';
            
            // Left brow - angled down toward center
            ctx.beginPath();
            ctx.moveTo(-eyeSpacing - eyeSize, faceY - eyeSize - 5);
            ctx.lineTo(-eyeSpacing + eyeSize * 0.5, faceY - eyeSize + (s * 0.15 * angerLevel));
            ctx.stroke();
            
            // Right brow - angled down toward center
            ctx.beginPath();
            ctx.moveTo(eyeSpacing + eyeSize, faceY - eyeSize - 5);
            ctx.lineTo(eyeSpacing - eyeSize * 0.5, faceY - eyeSize + (s * 0.15 * angerLevel));
            ctx.stroke();
        }

        // Mouth
        const mouthY = faceY + s * 0.35;
        ctx.lineWidth = 3;
        ctx.strokeStyle = this.isKing ? '#3a2510' : '#663333';
        ctx.lineCap = 'round';
        
        if (isSuperAngry || this.isKing) {
            // Angry grimace/frown
            ctx.beginPath();
            ctx.moveTo(-s * 0.2, mouthY + 5);
            ctx.quadraticCurveTo(0, mouthY - 10, s * 0.2, mouthY + 5);
            ctx.stroke();
            
            // Gritted teeth lines
            ctx.lineWidth = 2;
            for (let i = -2; i <= 2; i++) {
                ctx.beginPath();
                ctx.moveTo(i * s * 0.08, mouthY - 2);
                ctx.lineTo(i * s * 0.08, mouthY + 4);
                ctx.stroke();
            }
        } else {
            // Stern line mouth
            ctx.beginPath();
            ctx.moveTo(-s * 0.15, mouthY);
            ctx.lineTo(s * 0.15, mouthY);
            ctx.stroke();
        }

        // Crown for King - Premium golden crown with organic feel
        if (this.isKing) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'gold';
            
            // Crown base gradient effect
            const crownY = -s - 5;
            ctx.fillStyle = '#ffd700';
            ctx.strokeStyle = '#b8860b';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-s * 0.5, crownY + 30);
            ctx.bezierCurveTo(-s * 0.55, crownY + 20, -s * 0.45, crownY - 20, -s * 0.35, crownY - 35);
            ctx.bezierCurveTo(-s * 0.3, crownY - 10, -s * 0.2, crownY + 5, -s * 0.15, crownY - 5);
            ctx.bezierCurveTo(-s * 0.08, crownY - 25, 0, crownY - 50, 0, crownY - 50);
            ctx.bezierCurveTo(0, crownY - 50, s * 0.08, crownY - 25, s * 0.15, crownY - 5);
            ctx.bezierCurveTo(s * 0.2, crownY + 5, s * 0.3, crownY - 10, s * 0.35, crownY - 35);
            ctx.bezierCurveTo(s * 0.45, crownY - 20, s * 0.55, crownY + 20, s * 0.5, crownY + 30);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Crown highlight
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.ellipse(-s * 0.15, crownY, s * 0.12, s * 0.08, -0.2, 0, Math.PI * 2);
            ctx.fill();
            
            // Crown jewels
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'red';
            ctx.fillStyle = '#ff3333';
            ctx.beginPath();
            ctx.arc(0, crownY - 35, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowColor = 'blue';
            ctx.fillStyle = '#3366ff';
            ctx.beginPath();
            ctx.arc(-s * 0.25, crownY + 5, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(s * 0.25, crownY + 5, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        } else {
            // Chef Hat - fluffy and cartoony with organic puffs
            const hatY = -s - 10;
            
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 2;
            
            // Hat base band
            ctx.fillStyle = '#f5f5f5';
            ctx.beginPath();
            ctx.moveTo(-s * 0.55, hatY + 40);
            ctx.bezierCurveTo(-s * 0.6, hatY + 30, -s * 0.55, hatY + 20, -s * 0.5, hatY + 15);
            ctx.lineTo(s * 0.5, hatY + 15);
            ctx.bezierCurveTo(s * 0.55, hatY + 20, s * 0.6, hatY + 30, s * 0.55, hatY + 40);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Puffy top - multiple organic cloud-like puffs
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            // Left puff
            ctx.moveTo(-s * 0.5, hatY + 20);
            ctx.bezierCurveTo(-s * 0.7, hatY + 10, -s * 0.65, hatY - 20, -s * 0.4, hatY - 25);
            // Middle-left puff
            ctx.bezierCurveTo(-s * 0.35, hatY - 45, -s * 0.15, hatY - 50, 0, hatY - 45);
            // Middle-right puff
            ctx.bezierCurveTo(s * 0.15, hatY - 50, s * 0.35, hatY - 45, s * 0.4, hatY - 25);
            // Right puff
            ctx.bezierCurveTo(s * 0.65, hatY - 20, s * 0.7, hatY + 10, s * 0.5, hatY + 20);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Puff details/shadows
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(-s * 0.25, hatY - 15, s * 0.15, Math.PI * 0.8, Math.PI * 1.8);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(s * 0.2, hatY - 20, s * 0.12, Math.PI * 0.9, Math.PI * 1.7);
            ctx.stroke();
        }

        // Visual Flash Overlay (damage feedback)
        if (this.visualFlashTimer > 0) {
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = 'white';
            ctx.beginPath();
            if (this.isKing) {
                ctx.moveTo(0, -s);
                ctx.bezierCurveTo(s * 0.7, -s * 0.95, s * 1.05, -s * 0.4, s * 0.95, 0);
                ctx.bezierCurveTo(s * 1.1, s * 0.5, s * 0.85, s * 0.9, s * 0.5, s * 0.95);
                ctx.bezierCurveTo(s * 0.2, s * 1.05, -s * 0.2, s * 1.05, -s * 0.5, s * 0.95);
                ctx.bezierCurveTo(-s * 0.85, s * 0.9, -s * 1.1, s * 0.5, -s * 0.95, 0);
                ctx.bezierCurveTo(-s * 1.05, -s * 0.4, -s * 0.7, -s * 0.95, 0, -s);
            } else {
                ctx.moveTo(0, -s * 0.9);
                ctx.bezierCurveTo(s * 0.6, -s * 0.85, s * 0.95, -s * 0.35, s * 0.9, s * 0.1);
                ctx.bezierCurveTo(s * 0.95, s * 0.55, s * 0.7, s * 0.9, s * 0.35, s * 0.95);
                ctx.bezierCurveTo(s * 0.1, s, -s * 0.1, s, -s * 0.35, s * 0.95);
                ctx.bezierCurveTo(-s * 0.7, s * 0.9, -s * 0.95, s * 0.55, -s * 0.9, s * 0.1);
                ctx.bezierCurveTo(-s * 0.95, -s * 0.35, -s * 0.6, -s * 0.85, 0, -s * 0.9);
            }
            ctx.fill();
            ctx.restore();
        }

        ctx.restore();
    }

    die() {
        if (this.isKing) {
            gameWin();
            // Detach Pixi overlay for this boss
            if (window.PIXI_BOSSES && typeof window.PIXI_BOSSES.detach === 'function') {
                window.PIXI_BOSSES.detach(this);
            }
            return;
        }

        // Drops
        for (let i = 0; i < 30; i++) gems.push(new Gem(this.x + (Math.random() - 0.5) * 100, this.y + (Math.random() - 0.5) * 100, 10, 'green'));
        // Boss Drops Purple Gems too
        for (let i = 0; i < 5; i++) gems.push(new Gem(this.x + (Math.random() - 0.5) * 100, this.y + (Math.random() - 0.5) * 100, 50, 'purple'));

        pickups.push(new Pickup(this.x + (Math.random() - 0.5) * 80, this.y + (Math.random() - 0.5) * 80, 'nuke'));
        pickups.push(new TreasureChest(this.x + (Math.random() - 0.5) * 80, this.y + (Math.random() - 0.5) * 80)); // Chest Drop

        activeBoss = null;
        bossKills++;
        super.die();
        document.getElementById('boss-bar-container').style.display = 'none';

        // Detach Pixi overlay for this boss
        if (window.PIXI_BOSSES && typeof window.PIXI_BOSSES.detach === 'function') {
            window.PIXI_BOSSES.detach(this);
        }

        // PACING UPDATE: Next boss in 3 mins OR 10 levels, whichever comes FIRST
        // But actually, "whichever comes first" implies the EARLIER of the two triggers.
        // So we wait until Time > limit OR Level > limit?
        // No, if user request "at least 3 minutes or 10 levels", it implies a DELAY.
        // "At least X" usually means "Don't spawn before X".
        // But in game design, "whichever comes first" usually means:
        // Spawn Condition = (TimeElapsed >= 3min) OR (LevelsGained >= 10).
        // I will implement exactly that.

        // We need to export/update global vars for next spawn
        // Since Boss class is separate, we effectively need a way to callback to main.js logic.
        // Or we can rely on main.js 'loop' checking global vars.
        // Use global 'setNextBossPacing' function if possible, or direct global access?
        // main.js has 'nextBossTime'. Let's assume we can write to it or add a helper in main.js
        // Ideally we shouldn't modify globals directly from class like this, but 'bossKills' is already global here.

        if (typeof updateBossPacing === 'function') {
            updateBossPacing(player.level);
        } else {
            // Fallback (direct access if function missing during hot reload)
            // nextBossTime variable is likely in main.js scope but Boss.js is loaded before?
            // Actually, in browser JS, global scope is window. We can rely on window.nextBossTime?
            // Better: Add 'updateBossPacing' to window or just assume main.js handles the 'check'.
            // Wait, Boss.die() is executed. main.js loop checks 'gameTime > nextBossTime'.
            // The loop currently doesn't check level.
            // I should update main.js loop first to add the Level check.
            // And here in Boss.die, I just need to trigger the DELAY.
            // "Way more time... like at least 3 minutes".
            // So we need to ADD time to nextBossTime.
        }

        // Heal Player on Boss Kill
        player.hp = player.maxHp;
        damageNumbers.push(new FloatingText(player.x, player.y - 50, "BOSS DEFEATED!", "Gold"));
    }
}

class ButcherKnife {
    constructor(x, y, angle) {
        this.x = x; this.y = y;
        this.angle = angle;
        this.speed = 12;
        this.size = 20;
        this.rotation = 0;
        this.active = true;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += 0.5;

        // Hit Player
        if (Math.hypot(this.x - player.x, this.y - player.y) < this.size + player.radius) {
            player.takeDamage(20);
            this.active = false;
        }

        // Despawn distance
        if (Math.hypot(this.x - player.x, this.y - player.y) > 1200) this.active = false;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // VISUAL UPDATE: Red Glow (lighter for performance)
        ctx.shadowBlur = 12;
        ctx.shadowColor = 'red';

        // Draw Knife
        ctx.fillStyle = '#ccc'; // Blade
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(25, -5);
        ctx.lineTo(30, 0);
        ctx.lineTo(25, 10);
        ctx.lineTo(0, 10);
        ctx.fill();

        ctx.fillStyle = '#533'; // Handle
        ctx.fillRect(-15, 0, 15, 8);

        ctx.restore();
    }
}
