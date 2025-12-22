/**
 * SpatulaUI.js
 * Handles the "Divine Ascension" UI for the Golden Spatula.
 * Phases: Ascension, Bestowal, Glory.
 */

// --- 1. Audio Extension ---
if (typeof SoundFX !== 'undefined') {
    SoundFX.prototype.playDivineImpact = function () {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const now = this.ctx.currentTime;
        // Deep Thud + Bell
        this.playTone(60, 'sawtooth', 0.5, 20, 0.8);
        this.playTone(800, 'sine', 0.8, null, 0.2);
    };

    SoundFX.prototype.playEpicAscensionTheme = function () {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const now = this.ctx.currentTime;

        // Helper to play multiple notes (Chord)
        const playChord = (notes, time, duration, vol = 0.1) => {
            notes.forEach(freq => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth'; // Brass-like
                osc.frequency.setValueAtTime(freq, time);
                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(vol, time + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(time);
                osc.stop(time + duration);
            });
        };

        // Epic Fanfare Progression: C -> F -> G -> C (Majestic)
        // C Major
        playChord([261.63, 329.63, 392.00, 523.25], now, 3.0);
        // F Major (0.6s later)
        playChord([349.23, 440.00, 523.25, 698.46], now + 0.6, 2.5);
        // G Major (1.2s later)
        playChord([392.00, 493.88, 587.33, 783.99], now + 1.2, 2.5);
        // C Major (Climax 2.0s)
        playChord([261.63, 329.63, 392.00, 523.25, 1046.50], now + 2.0, 6.0, 0.2);

        // Bass Drum Roll
        for (let i = 0; i < 10; i++) {
            this.playTone(50, 'square', 0.1, null, 0.5 * (i / 10));
        }
    };

    // Keep legacy choir for fallback/flavor if needed, or remove? 
    // Keeping it doesn't hurt.
    SoundFX.prototype.playDivineChoir = function () {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const now = this.ctx.currentTime;
        [261.63, 329.63, 392.00, 493.88, 587.33].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = i % 2 === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.15, now + 1.0);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 6.0);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 6.0);
        });
    };
}

// --- 2. Spatula UI Manager ---
const SpatulaUI = {
    rewards: [],

    init: function () {
        if (!document.getElementById('spatula-modal')) {
            const div = document.createElement('div');
            div.id = 'spatula-modal';
            div.innerHTML = `
                <div id="spatula-flash-overlay"></div>
                <div id="spatula-god-rays"></div>
                <!-- Phase A: Ascension -->
                <div id="spatula-visual">
                    <div class="spatula-handle"></div>
                    <div class="spatula-blade">
                        <div class="spatula-slit slit-left"></div>
                        <div class="spatula-slit slit-center"></div>
                        <div class="spatula-slit slit-right"></div>
                    </div>
                </div>
                <div id="spatula-title">GOLDEN SPATULA ACQUIRED</div>

                <div id="spatula-container" style="display:none;">
                    <div id="spatula-card-row"></div>
                    <button id="spatula-claim-btn">CLAIM LOOT</button>
                </div>
            `;
            document.body.appendChild(div);

            document.getElementById('spatula-claim-btn').onclick = () => this.claim();
        }
    },

    open: function () {
        this.init();
        isPaused = true;

        const modal = document.getElementById('spatula-modal');
        const visual = document.getElementById('spatula-visual');
        const title = document.getElementById('spatula-title');
        const container = document.getElementById('spatula-container');
        const row = document.getElementById('spatula-card-row');
        const btn = document.getElementById('spatula-claim-btn');
        const flash = document.getElementById('spatula-flash-overlay');

        // Reset State
        modal.style.display = 'flex';
        container.style.display = 'none';
        visual.style.display = 'block';
        title.style.display = 'block';
        title.classList.remove('text-reveal');
        btn.style.opacity = '0';
        btn.classList.remove('pulse-violent');
        flash.classList.remove('white-flash');
        row.innerHTML = '';

        // === PHASE A: ASCENSION (0s - 3.0s) ===
        if (sfx) sfx.playEpicAscensionTheme();

        // Trigger Text Reveal
        void title.offsetWidth; // Force Reflow
        title.classList.add('text-reveal');

        // Prepare Rewards
        this.rewards = this.generateRewards();

        // Start Phase B Timer (3.0s to sync with music climax)
        setTimeout(() => this.startPhaseB(), 3000);
    },

    startPhaseB: function () {
        // === PHASE B: THE BESTOWAL (The Drops) ===
        const visual = document.getElementById('spatula-visual');
        const container = document.getElementById('spatula-container');
        const row = document.getElementById('spatula-card-row');

        // Transition: Hide big icon
        visual.style.display = 'none';
        container.style.display = 'flex';

        // Drop 5 cards one by one
        this.rewards.forEach((item, index) => {
            setTimeout(() => {
                const card = document.createElement('div');
                card.className = 'divine-card drop-from-sky';
                card.innerHTML = `
                    <div class="icon">${item.icon}</div>
                    <div class="title">${item.title}</div>
                    <div class="type">${item.type}</div>
                    <div class="desc">${item.desc}</div>
                `;

                // Add Impact Listener (Animation End is safest logic)
                card.addEventListener('animationend', () => {
                    this.triggerImpact(card);
                });

                row.appendChild(card);
            }, index * 400); // 400ms gap
        });

        // Start Phase C after all drops
        const totalDuration = (this.rewards.length - 1) * 400 + 400 + 500; // Drops + Wait
        setTimeout(() => this.startPhaseC(), totalDuration);
    },

    triggerImpact: function (cardElement) {
        // 1. Shake the Screen (The Container)
        const row = document.getElementById('spatula-card-row');
        row.classList.remove('impact-shake');
        void row.offsetWidth;
        row.classList.add('impact-shake');

        // 2. Spawn Dust Ring
        const rect = cardElement.getBoundingClientRect();
        const modal = document.getElementById('spatula-modal');
        const dust = document.createElement('div');
        dust.className = 'dust-ring';
        dust.style.left = (rect.left + rect.width / 2 - 100) + 'px'; // Center 200px dust
        dust.style.top = (rect.bottom - 25) + 'px'; // At bottom

        modal.appendChild(dust);
        setTimeout(() => dust.remove(), 1000);

        // 3. Sound
        if (sfx) sfx.playDivineImpact();
    },

    startPhaseC: function () {
        // === PHASE C: GLORY ===
        const flash = document.getElementById('spatula-flash-overlay');
        const btn = document.getElementById('spatula-claim-btn');

        // 1. Flash
        flash.classList.add('white-flash');

        // 2. Button Reveal
        btn.style.opacity = '1';
        btn.style.transform = 'scale(1.0)';
        btn.classList.add('pulse-violent');

        // 3. Big Sound?
        if (sfx) sfx.playDivineImpact();
    },

    claim: function () {
        this.rewards.forEach(r => r.action());
        document.getElementById('spatula-modal').style.display = 'none';
        resumeGame();
    },

    generateRewards: function () {
        // Logic same as previous iterations: 5 items.
        // Copying concise version
        let pool = [];
        for (const [key, data] of Object.entries(WEAPONS_DB)) {
            const currentLvl = player.weapons[key].level;
            if (currentLvl < CONSTANTS.MAX_WEAPON_LEVEL + 1) {
                let text = currentLvl === 0 ? "New!" : (currentLvl === CONSTANTS.MAX_WEAPON_LEVEL ? "EVOLUTION" : `Level ${currentLvl + 1}`);
                pool.push({
                    title: data.name, desc: text, type: "DIVINE POWER", icon: data.icon,
                    action: () => { player.weapons[key].level++; }
                });
            }
        }
        PASSIVE_DB.forEach(p => {
            pool.push({
                title: p.name, desc: p.desc, type: "BLESSING", icon: p.icon,
                action: () => {
                    if (p.id === 'dmg') player.stats.dmgMult += 0.15;
                    if (p.id === 'hp') { player.maxHp += 25; player.stats.regen += 1; }
                    if (p.id === 'spd') player.stats.speedMult += 0.1;
                    if (p.id === 'pickup') player.stats.pickupMult += 0.3;
                }
            });
        });
        pool.sort(() => Math.random() - 0.5);
        let choices = pool.slice(0, 5);
        while (choices.length < 5) choices.push({ title: "GOLD", desc: "Wealth", type: "BOUNTY", icon: "💰", action: () => { } });
        return choices;
    }
};

if (typeof GoldenSpatula !== 'undefined') {
    GoldenSpatula.prototype.update = function () {
        this.bob += 0.05; this.angle += 0.02;
        if (Math.hypot(player.x - this.x, player.y - this.y) < player.radius + 40) {
            const idx = pickups.indexOf(this);
            if (idx > -1) pickups.splice(idx, 1);
            SpatulaUI.open();
            return false;
        }
        return true;
    };
}
