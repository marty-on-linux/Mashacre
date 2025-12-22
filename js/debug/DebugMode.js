/**
 * DebugMode.js
 * Adds a developer menu to test game features.
 * Toggle with '~' (Tilde/Backquote)
 */

(function () {
    // 1. Create UI Elements
    const debugDiv = document.createElement('div');
    debugDiv.id = 'debug-menu';
    debugDiv.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: lime;
        padding: 15px;
        border: 2px solid lime;
        border-radius: 5px;
        font-family: monospace;
        z-index: 10000;
        display: none;
        width: 200px;
    `;

    debugDiv.innerHTML = `
        <h3 style="margin: 0 0 10px 0; border-bottom: 1px solid lime;">DEBUG MENU</h3>
        <button id="dbg-god" style="width:100%; margin:2px 0;">God Mode: OFF</button>
        <button id="dbg-boss" style="width:100%; margin:2px 0;">Spawn Boss</button>
        <button id="dbg-levelup" style="width:100%; margin:2px 0;">+1 Level</button>
        <button id="dbg-max" style="width:100%; margin:2px 0; color:cyan; border-color:cyan;">MAX UPGRADES</button>
    `;

    document.body.appendChild(debugDiv);

    // 2. Logic & State
    let isGodMode = false;
    let isVisible = false;

    // Toggle Menu
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Backquote') {
            isVisible = !isVisible;
            debugDiv.style.display = isVisible ? 'block' : 'none';
        }
    });

    // 3. Button Bindings
    document.getElementById('dbg-god').onclick = function () {
        isGodMode = !isGodMode;
        this.innerText = `God Mode: ${isGodMode ? 'ON' : 'OFF'} `;
        this.style.color = isGodMode ? 'red' : 'black';
        this.style.background = isGodMode ? 'yellow' : '#eee';

        // Hook Player Damage
        if (typeof player !== 'undefined') {
            player.debugInvincible = isGodMode;
            // We need to support this in Player.js takeDamage or wrap it here
            // Wrapper approach (Safe, no core file rewrite)
            if (!player._originalTakeDamage) {
                player._originalTakeDamage = player.takeDamage;
                player.takeDamage = function (amount) {
                    if (this.debugInvincible) return; // Ignore damage
                    this._originalTakeDamage.call(this, amount);
                }
            }
        }
    };



    document.getElementById('dbg-boss').onclick = function () {
        if (typeof spawnBoss === 'function') spawnBoss();
    };

    document.getElementById('dbg-levelup').onclick = function () {
        if (typeof player !== 'undefined') {
            player.gainXp(player.xpToNext - player.xp);
        }
    };

    document.getElementById('dbg-max').onclick = function () {
        if (typeof player !== 'undefined') {
            player.level = 100;
            const maxLevel = (typeof CONSTANTS !== 'undefined' && CONSTANTS.MAX_WEAPON_LEVEL) ? CONSTANTS.MAX_WEAPON_LEVEL + 1 : 9;

            for (let key in player.weapons) {
                player.weapons[key].level = maxLevel;
            }

            // Stats buff
            player.stats.dmgMult = 5.0;
            player.stats.speedMult = 1.5;
            player.maxHp = 9999;
            player.hp = 9999;

            if (typeof updateUI === 'function') updateUI();
            console.log("Debug: MAXED OUT!");
        }
    };

    document.getElementById('dbg-killall').onclick = function () {
        if (typeof enemies !== 'undefined') {
            // Kill all except boss? Or all?
            [...enemies].forEach(e => e.die(true)); // Silent death
        }
    };

    /* Boss Kills removed by user request */

    /* Weapon Cycle/Evolve moved to DebugWeaponTools.js */

    // Update Input value if opened
    // (Optional: sync UI with game state periodically)

})();
