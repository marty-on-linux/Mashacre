/**
 * SettingsMenu.js
 * Handles Sound Settings UI and Logic
 * Injects HTML/CSS for the settings modal and hooks into the main menu.
 */

(function () {
    // --- Configuration ---
    const STORAGE_KEY_VOL = 'mashacre_volume';

    // --- State ---
    let volume = 50; // 0-100

    // --- UI HTML ---
    const settingsHTML = `
    <div id="settings-modal" class="modal" style="display: none; z-index: 2000;">
        <div style="background: rgba(0,0,0,0.95); padding: 40px; border: 2px solid #444; border-radius: 10px; width: 400px; text-align: center;">
            <h1 style="color: white; margin-bottom: 30px;">SETTINGS</h1>
            
            <div style="margin-bottom: 30px;">
                <label style="color: #ccc; display: block; margin-bottom: 10px; font-size: 1.2rem;">MASTER VOLUME</label>
                <input type="range" id="volume-slider" min="0" max="100" value="50" style="width: 100%; cursor: pointer;">
                <div id="volume-value" style="color: #ffaa00; margin-top: 5px;">50%</div>
            </div>

            <button class="menu-btn" onclick="SettingsMenu.close()" onmouseenter="sfx && sfx.playHover()">CLOSE</button>
        </div>
    </div>
    `;

    // --- UI CSS ---
    const settingsCSS = `
    #settings-modal {
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex; justify-content: center; align-items: center;
    }
    input[type=range] {
        -webkit-appearance: none;
        background: #333;
        height: 10px;
        border-radius: 5px;
        outline: none;
    }
    input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 20px; height: 20px;
        background: #ffaa00;
        border-radius: 50%;
        cursor: pointer;
    }
    `;

    // --- Logic ---
    window.SettingsMenu = {
        init: function () {
            // 1. Inject CSS
            const style = document.createElement('style');
            style.textContent = settingsCSS;
            document.head.appendChild(style);

            // 2. Inject HTML
            const container = document.createElement('div');
            container.innerHTML = settingsHTML;
            document.body.appendChild(container.firstElementChild);

            // 3. Load Saved Settings
            const savedVol = localStorage.getItem(STORAGE_KEY_VOL);
            if (savedVol !== null) {
                volume = parseInt(savedVol);
            }
            this.applyVolume(volume);

            // 4. Bind Events
            const slider = document.getElementById('volume-slider');
            const valDisplay = document.getElementById('volume-value');

            slider.value = volume;
            valDisplay.innerText = volume + '%';

            slider.addEventListener('input', (e) => {
                volume = e.target.value;
                valDisplay.innerText = volume + '%';
                this.applyVolume(volume);
                localStorage.setItem(STORAGE_KEY_VOL, volume);
            });

            // 5. Inject Buttons into Existing Menus
            this.injectButton('start-overlay', 'SETTINGS', () => this.open());
            this.injectButton('pause-menu', 'SETTINGS', () => this.open());

            // 6. Ensure SFX is initialized if missing (SafetyNet)
            if (!window.sfx && typeof SoundFX !== 'undefined') {
                window.sfx = new SoundFX();
                // Re-apply volume now that sfx exists
                this.applyVolume(volume);
            }
        },

        open: function () {
            document.getElementById('settings-modal').style.display = 'flex';
        },

        close: function () {
            document.getElementById('settings-modal').style.display = 'none';
        },

        applyVolume: function (volPercent) {
            if (window.sfx && window.sfx.masterGain) {
                // Base gain is 0.25 (from setup.js), so we scale that
                // stored val is 0-100
                const normalized = volPercent / 100;
                // Logarithmic-ish or linear? Web Audio gain is linear amplitude.
                // 0.25 is "100%" in current game.
                window.sfx.masterGain.gain.value = 0.25 * normalized;
            }
        },

        injectButton: function (parentId, text, onClick) {
            const parent = document.getElementById(parentId);
            if (!parent) return;

            // Find where to insert (before the last button usually? or at end?)
            // Start screen: has "ENTER THE FRYER"
            // Pause menu: RESUME, QUIT
            // specific placement: 
            // Pause: Between RESUME and QUIT
            // Start: Below ENTER THE FRYER

            const btn = document.createElement('button');
            btn.className = (parentId === 'pause-menu') ? 'menu-btn' : 'restart-btn';
            btn.innerText = text;
            btn.onclick = onClick;
            btn.onmouseenter = () => { if (window.sfx) window.sfx.playHover(); };

            // Style adjustment for start screen consistency
            if (parentId === 'start-overlay') {
                btn.style.marginTop = '25px'; // More space
                btn.style.backgroundColor = 'transparent'; // Subtle
                btn.style.border = '2px solid #555';
                btn.style.fontSize = '1rem'; // Smaller
                btn.style.padding = '8px 20px';
                btn.style.opacity = '0.8';

                // Add hover effect logic via JS since we can't easily inject CSS for this specific element without a class
                btn.onmouseover = function () { this.style.opacity = '1'; this.style.borderColor = '#888'; if (window.sfx) window.sfx.playHover(); };
                btn.onmouseout = function () { this.style.opacity = '0.8'; this.style.borderColor = '#555'; };
            } else if (parentId === 'pause-menu') {
                // Insert before Quit
                const quitBtn = parent.lastElementChild;
                parent.insertBefore(btn, quitBtn);
                return;
            }

            parent.appendChild(btn);
        }
    };

    // Auto-init on load
    window.addEventListener('load', () => {
        setTimeout(() => SettingsMenu.init(), 100); // Slight delay to ensure DOM is ready
    });

})();
