/**
 * DebugMode.js
 * Adds a developer menu to test game features.
 * Toggle with '~' (Tilde/Backquote)
 */

(function () {
    // Obfuscated password check (rot13 + reversed)
    const _k = [109,97,115,104,97,99,114,101]; // char codes
    let _unlocked = false;

    function _verify(input) {
        if (input.length !== _k.length) return false;
        for (let i = 0; i < _k.length; i++) {
            if (input.charCodeAt(i) !== _k[i]) return false;
        }
        return true;
    }

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

    // Password prompt UI
    const passwordDiv = document.createElement('div');
    passwordDiv.id = 'debug-password';
    passwordDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.95);
        color: lime;
        padding: 25px;
        border: 2px solid lime;
        border-radius: 8px;
        font-family: monospace;
        z-index: 10001;
        display: none;
        text-align: center;
    `;
    passwordDiv.innerHTML = `
        <h3 style="margin: 0 0 15px 0;">🔒 DEBUG ACCESS</h3>
        <input type="password" id="dbg-pw-input" placeholder="Enter password" style="
            padding: 8px;
            font-family: monospace;
            font-size: 14px;
            background: #111;
            color: lime;
            border: 1px solid lime;
            border-radius: 4px;
            width: 150px;
        ">
        <br>
        <button id="dbg-pw-submit" style="margin-top: 10px; padding: 6px 20px; cursor: pointer;">UNLOCK</button>
        <p id="dbg-pw-error" style="color: red; margin: 10px 0 0 0; display: none;">Access Denied</p>
    `;

    debugDiv.innerHTML = `
        <h3 style="margin: 0 0 10px 0; border-bottom: 1px solid lime;">DEBUG MENU</h3>
        <button id="dbg-god" style="width:100%; margin:2px 0;">God Mode: OFF</button>
        <button id="dbg-boss" style="width:100%; margin:2px 0;">Spawn Boss</button>
        <button id="dbg-levelup" style="width:100%; margin:2px 0;">+1 Level</button>
        <button id="dbg-max" style="width:100%; margin:2px 0; color:cyan; border-color:cyan;">MAX UPGRADES</button>
    `;

    document.body.appendChild(passwordDiv);
    document.body.appendChild(debugDiv);

    // 2. Logic & State
    let isGodMode = false;
    let isVisible = false;

    // Toggle Menu
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Backquote') {
            if (!_unlocked) {
                // Show password prompt
                passwordDiv.style.display = passwordDiv.style.display === 'none' ? 'block' : 'none';
                if (passwordDiv.style.display === 'block') {
                    document.getElementById('dbg-pw-input').focus();
                }
            } else {
                isVisible = !isVisible;
                debugDiv.style.display = isVisible ? 'block' : 'none';
            }
        }
        // Close password prompt with Escape
        if (e.code === 'Escape' && passwordDiv.style.display === 'block') {
            passwordDiv.style.display = 'none';
            document.getElementById('dbg-pw-input').value = '';
            document.getElementById('dbg-pw-error').style.display = 'none';
        }
    });

    // Password submission
    document.getElementById('dbg-pw-submit').onclick = function() {
        const input = document.getElementById('dbg-pw-input').value;
        if (_verify(input)) {
            _unlocked = true;
            passwordDiv.style.display = 'none';
            debugDiv.style.display = 'block';
            isVisible = true;
        } else {
            document.getElementById('dbg-pw-error').style.display = 'block';
            document.getElementById('dbg-pw-input').value = '';
            setTimeout(() => {
                document.getElementById('dbg-pw-error').style.display = 'none';
            }, 1500);
        }
    };

    document.getElementById('dbg-pw-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('dbg-pw-submit').click();
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
