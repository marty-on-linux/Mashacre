// --- Input Handling ---

const keys = { w: false, a: false, s: false, d: false };
const mouse = { x: 0, y: 0, wx: 0, wy: 0 }; // Screen x/y, World x/y

function initInput() {
    window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });

    window.addEventListener('keydown', e => {
        if (e.code === 'KeyW' || e.key === 'ArrowUp') keys.w = true;
        if (e.code === 'KeyA' || e.key === 'ArrowLeft') keys.a = true;
        if (e.code === 'KeyS' || e.key === 'ArrowDown') keys.s = true;
        if (e.code === 'KeyD' || e.key === 'ArrowRight') keys.d = true;

        if (e.key === 'ArrowUp') keys.ArrowUp = true;
        if (e.key === 'ArrowLeft') keys.ArrowLeft = true;
        if (e.key === 'ArrowDown') keys.ArrowDown = true;
        if (e.key === 'ArrowRight') keys.ArrowRight = true;

        if (e.code === 'Escape') togglePause();
    });

    window.addEventListener('keyup', e => {
        if (e.code === 'KeyW' || e.key === 'ArrowUp') keys.w = false;
        if (e.code === 'KeyA' || e.key === 'ArrowLeft') keys.a = false;
        if (e.code === 'KeyS' || e.key === 'ArrowDown') keys.s = false;
        if (e.code === 'KeyD' || e.key === 'ArrowRight') keys.d = false;

        if (e.key === 'ArrowUp') keys.ArrowUp = false;
        if (e.key === 'ArrowLeft') keys.ArrowLeft = false;
        if (e.key === 'ArrowDown') keys.ArrowDown = false;
        if (e.key === 'ArrowRight') keys.ArrowRight = false;
    });

    window.addEventListener('mousemove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    // --- CHEAT CODES (Debug) ---
    window.addEventListener('keydown', e => {
        if (!e.shiftKey) return;

        // U: Upgrade All Weapons +1
        if (e.code === 'KeyU') {
            Object.values(player.weapons).forEach(w => {
                if (w.level < CONSTANTS.MAX_WEAPON_LEVEL + 1) w.level++;
            });
            damageNumbers.push(new FloatingText(player.x, player.y - 50, "ALL WEAPONS UPGRADED!", "cyan"));
            sfx.playLevelUp();
        }

        // L: Level Up (+1 Level)
        if (e.code === 'KeyL') {
            player.gainXp(player.xpToNext - player.xp);
        }

        // A: MAX OUT (Level 50 + All Weapons Max)
        if (e.code === 'KeyA') {
            player.level = 50;
            Object.values(player.weapons).forEach(w => w.level = CONSTANTS.MAX_WEAPON_LEVEL + 1);
            damageNumbers.push(new FloatingText(player.x, player.y - 50, "MAX POWER!!!", "gold"));
            sfx.playLevelUp();
            updateUI();
        }

        // H: Heal
        if (e.code === 'KeyH') {
            player.hp = player.maxHp;
            damageNumbers.push(new FloatingText(player.x, player.y - 50, "FULL HEAL", "green"));
            sfx.playHeal();
        }

        // I: Toggle Invincibility
        if (e.code === 'KeyI') {
            player.invincible = !player.invincible;
            const status = player.invincible ? "GOD MODE ON" : "GOD MODE OFF";
            damageNumbers.push(new FloatingText(player.x, player.y - 50, status, "white"));
        }

        // K: Nuke (Kill All Enemies)
        if (e.code === 'KeyK') {
            [...enemies].forEach(en => { if (en.type !== 'boss') en.die(); });
            camera.shake = 20;
            sfx.playNuke ? sfx.playNuke() : sfx.playBossSpawn();
        }

        // T: Spawn Tater Tot (at Mouse)
        if (e.code === 'KeyT') {
            mines.push(new TaterTot(mouse.wx, mouse.wy, player.weapons.tots.level || 1, false, player));
            damageNumbers.push(new FloatingText(mouse.wx, mouse.wy, "FREE TATER TOT", "orange"));
        }

        // P: Gravy Press (at Mouse)
        if (e.code === 'KeyP') {
            if (!player.weapons.squash.pressActive) {
                player.weapons.squash.pressX = mouse.wx;
                player.weapons.squash.pressY = mouse.wy;
                player.weapons.squash.triggerPress(player.weapons.squash.level > 8);
            }
        }

        // C: Spawn Treasure Chest
        if (e.code === 'KeyC') {
            const chest = new TreasureChest(mouse.wx, mouse.wy);
            pickups.push(chest);
        }

        // B: Spawn Boss (Chef)
        if (e.code === 'KeyB') {
            spawnBoss(false);
            damageNumbers.push(new FloatingText(player.x, player.y - 100, "CHEF SPAWNED", "red"));
        }

        // M: Spawn Mash King
        if (e.code === 'KeyM') {
            spawnBoss(true); // isKing = true
            damageNumbers.push(new FloatingText(player.x, player.y - 100, "KING SPAWNED", "purple"));
        }



        // 1: Spawn Stampede
        if (e.code === 'Digit1') {
            spawnStampede();
            damageNumbers.push(new FloatingText(player.x, player.y - 100, "STAMPEDE!", "orange"));
        }

        // 2: Spawn Onion Ring
        if (e.code === 'Digit2') {
            spawnOnionRing();
            damageNumbers.push(new FloatingText(player.x, player.y - 100, "ONION RING!", "purple"));
        }
    });
}
