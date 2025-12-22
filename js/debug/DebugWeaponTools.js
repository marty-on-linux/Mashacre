/**
 * DebugWeaponTools.js
 * Extension for DebugMode to handle Weapon Cycling and Evolution.
 * Strict Project Rule: New Feature = New File.
 */

(function () {
    // Wait for the main debug menu to exist
    // Since scripts are loaded sequentially at end of body, it should be there.
    const debugMenu = document.getElementById('debug-menu');
    if (!debugMenu) {
        console.warn('DebugWeaponTools: #debug-menu not found. ensure DebugMode.js is loaded first.');
        return;
    }

    // Create Container for new tools
    const toolsDiv = document.createElement('div');
    toolsDiv.style.marginTop = '10px';
    toolsDiv.style.borderTop = '1px solid lime';
    toolsDiv.style.paddingTop = '5px';

    toolsDiv.innerHTML = `
        <button id="dbg-cycle" style="width:100%; margin:2px 0;">Cycle Weapon</button>
        <button id="dbg-evolve" style="width:100%; margin:2px 0; color:orange; border-color:orange;">FORCE EVOLVE</button>
    `;

    // Insert before the "Boss Kills" section if possible, or just append
    // DebugMode.js structure: H3, Buttons..., Div(BossKills)
    // We'll just append to the end for safety.
    debugMenu.appendChild(toolsDiv);


    // --- Logic ---
    let weaponIndex = -1;

    // Cycle Weapon
    document.getElementById('dbg-cycle').onclick = function () {
        if (typeof player === 'undefined' || typeof WEAPONS_DB === 'undefined') {
            console.log("Debug: Player or Weapons DB not ready.");
            return;
        }

        const keys = Object.keys(WEAPONS_DB);

        // Advance Index
        weaponIndex = (weaponIndex + 1) % keys.length;
        const newKey = keys[weaponIndex];
        const weaponData = WEAPONS_DB[newKey];

        // 1. Reset ALL weapons to Level 0
        for (let k in player.weapons) {
            player.weapons[k].level = 0;
            // Also reset timers? Maybe good to reset timers to 0
            if (player.weapons[k].timer !== undefined) player.weapons[k].timer = 0;
        }

        // 2. Enable NEW weapon
        if (player.weapons[newKey]) {
            player.weapons[newKey].level = 1;
            // Set timer to fire almost immediately
            if (player.weapons[newKey].timer !== undefined) {
                // Set to max-1 so it fires next frame usually, or just 0 to start fresh
                // Logic in Player.js checks if timer >= rate.
                // We want instant feedback.
                player.weapons[newKey].timer = 9999;
            }
        }

        // 3. UI Feedback
        this.innerText = `Cycle: ${weaponData.name}`;
        console.log(`Debug: Cycled to ${weaponData.name}`);

        // 4. Update Game UI
        if (typeof updateUI === 'function') updateUI();
    };

    // Force Evolve
    document.getElementById('dbg-evolve').onclick = function () {
        if (typeof player === 'undefined' || typeof CONSTANTS === 'undefined') {
            return;
        }

        const evoLevel = CONSTANTS.MAX_WEAPON_LEVEL + 1;
        let count = 0;

        for (let k in player.weapons) {
            // Only evolve currently active weapons
            if (player.weapons[k].level > 0 && player.weapons[k].level < evoLevel) {
                player.weapons[k].level = evoLevel;
                count++;
            }
        }

        if (count > 0) {
            console.log(`Debug: Evolved ${count} weapons.`);
            // Optional: Play Sound
            if (typeof sfx !== 'undefined') sfx.playEvolve();
            if (typeof updateUI === 'function') updateUI();
        } else {
            console.log("Debug: No eligible weapons to evolve.");
        }
    };

})();
