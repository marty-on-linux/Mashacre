/**
 * Hotfixes.js
 * Fixes critical bugs in Core Files without rewriting them.
 */

(function () {
    console.log("Applying Hotfixes...");

    // FIX 1: Missing sfx.playBoss() in main.js
    // main.js calls sfx.playBoss() when spawning Mash King, but SoundFX only has playBossSpawn()
    if (typeof SoundFX !== 'undefined') {
        SoundFX.prototype.playBoss = function () {
            // console.log("Hotfix: playBoss redirected to playBossSpawn");
            if (this.playBossSpawn) this.playBossSpawn();
        };
    }

    // FIX 2: Incorrect ID 'boss-name' in main.js
    // main.js tries to set innerText of 'boss-name', but the HTML element ID is 'boss-text'.
    // We create a dummy 'boss-name' element and mirror its changes to 'boss-text'.

    if (!document.getElementById('boss-name')) {
        const dummy = document.createElement('div');
        dummy.id = 'boss-name';
        dummy.style.display = 'none';
        document.body.appendChild(dummy);

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                const target = document.getElementById('boss-text');
                if (target) {
                    target.innerText = dummy.innerText;
                }
            });
        });

        observer.observe(dummy, {
            childList: true,
            characterData: true,
            subtree: true
        });

        // Proxy property setters just in case MutationObserver is too slow for some frames? 
        // MutationObserver is microtask, should be fine.
    }


    // FIX 3: Dynamic Lightning Volume (User Request)
    if (typeof SoundFX !== 'undefined') {
        SoundFX.prototype.playLightning = function () {
            let isEvo = false;
            // Check if player exists and has the storm weapon to determine volume
            if (typeof player !== 'undefined' && player.weapons && player.weapons.storm && typeof CONSTANTS !== 'undefined') {
                isEvo = player.weapons.storm.level > CONSTANTS.MAX_WEAPON_LEVEL;
            }

            if (isEvo) {
                // EVOLVED: Very Quiet (Triggered frequently)
                this.playTone(500, 'sawtooth', 0.1, 100, 0.005);
                setTimeout(() => this.playTone(100, 'square', 0.3, 50, 0.005), 50);
            } else {
                // BASE: Louder (Triggered less frequently)
                this.playTone(500, 'sawtooth', 0.1, 100, 0.1);
                setTimeout(() => this.playTone(100, 'square', 0.3, 50, 0.1), 50);
            }
        };
    }

})();
