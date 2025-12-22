/**
 * ChestUI.js
 * Handles the "Vampire Survivors" style Jackpot UI for Treasure Chests.
 * Features 3 Phases: Anticipation, Roulette, Reveal.
 */

// --- 1. Audio Extension for Synthesizer ---
if (typeof SoundFX !== 'undefined') {
    SoundFX.prototype.playTone = function (freq, type, duration, slideFreq = null, vol = 0.5) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (slideFreq) osc.frequency.exponentialRampToValueAtTime(slideFreq, this.ctx.currentTime + duration);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    };

    // Phase A: Rising Whine
    SoundFX.prototype.playChargeUp = function () {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 2.5); // Rise over 2.5s

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.4, now + 2.5);
        gain.gain.linearRampToValueAtTime(0, now + 2.6);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 2.6);
    };

    // Phase B: Slot Machine / Roulette clicks
    SoundFX.prototype.playSlotRoll = function () {
        this.playTone(600, 'square', 0.05, null, 0.15);
    };

    // Phase C: Jackpot Climax
    SoundFX.prototype.playJackpotClimax = function () {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const now = this.ctx.currentTime;

        // Orchestral Hit approximation (Noise + Low Saw)
        // 1. Bass Impact
        this.playTone(80, 'sawtooth', 1.5, 40, 0.8);

        // 2. High Sparkle arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 'triangle', 0.8, null, 0.2);
            }, i * 50);
        });

        // 3. Firework explosions sound
        for (let i = 0; i < 5; i++) {
            setTimeout(() => this.playTone(100 + Math.random() * 100, 'square', 0.3, 50, 0.3), 500 + i * 300);
        }
    };
}

// --- 2. UI Manager for Chests ---
const ChestUI = {
    isOpen: false,
    lootItems: [],
    timer: null,

    init: function () {
        if (!document.getElementById('chest-modal')) {
            const div = document.createElement('div');
            div.id = 'chest-modal';
            div.innerHTML = `
                <div id="chest-flash-overlay"></div>
                <div id="chest-bg-lights"></div>
                
                <!-- Phase A: Single Chest -->
                <div id="chest-center-icon">📦</div>

                <div id="chest-display-container" style="display:none;">
                    <div id="chest-title">JACKPOT!</div>
                    <div id="chest-loot-row"></div>
                    <button id="chest-claim-btn" class="visible">CLAIM LOOT</button>
                </div>
            `;
            document.body.appendChild(div);

            document.getElementById('chest-claim-btn').onclick = () => this.close();
        }
    },

    open: function () {
        this.init();
        isPaused = true;
        this.isOpen = true;

        // Reset State
        const modal = document.getElementById('chest-modal');
        const centerIcon = document.getElementById('chest-center-icon');
        const container = document.getElementById('chest-display-container');
        const title = document.getElementById('chest-title');
        const lootRow = document.getElementById('chest-loot-row');
        const btn = document.getElementById('chest-claim-btn');
        const flash = document.getElementById('chest-flash-overlay');

        modal.style.display = 'flex';
        centerIcon.style.display = 'block';
        centerIcon.className = ''; // Reset anims
        container.style.display = 'none';
        title.className = '';
        title.style.opacity = '0';
        lootRow.innerHTML = '';
        btn.classList.remove('visible');
        flash.classList.remove('flash-bang');

        // Generate Loot
        this.lootItems = this.generateLoot();

        // === PHASE A: ANTICIPATION (0s - 2.5s) ===
        if (sfx) sfx.playChargeUp();

        // Start violent shake
        centerIcon.classList.add('shake-violent');

        // Schedule Phase B
        setTimeout(() => this.startPhaseB(), 2500);
    },

    startPhaseB: function () {
        // === PHASE B: ROULETTE (2.5s - ~5s) ===
        const centerIcon = document.getElementById('chest-center-icon');
        const container = document.getElementById('chest-display-container');
        const lootRow = document.getElementById('chest-loot-row');

        // Hide Chest, Show Row
        centerIcon.style.display = 'none';
        container.style.display = 'flex';

        // Prepare Cards (Hidden/Scaling)
        this.lootItems.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = `casino-card ${item.isEvo ? 'legendary' : 'rare'}`;
            // Placeholder content for spinning
            card.innerHTML = `
                <div class="icon">❓</div>
                <div class="title">...</div>
            `;
            lootRow.appendChild(card);

            // Pop in
            setTimeout(() => {
                card.classList.add('active');
            }, index * 100);
        });

        // Start Roulette Cycling
        let cycleCount = 0;
        const maxCycles = 25; // How many spins

        // Icons pool for effect
        const icons = ['⚔️', '🛡️', '❤️', '👟', '🍗', '💣', '🔥', '⚡', '🧀'];

        this.timer = setInterval(() => {
            cycleCount++;
            if (sfx) sfx.playSlotRoll();

            // Spawn Confetti Burst
            this.spawnConfetti(2);

            // Update cards with random data
            Array.from(lootRow.children).forEach(card => {
                const iconDiv = card.querySelector('.icon');
                iconDiv.innerText = icons[Math.floor(Math.random() * icons.length)];
                // Random nudge
                card.style.transform = `scale(${0.9 + Math.random() * 0.2})`;
            });

            if (cycleCount >= maxCycles) {
                clearInterval(this.timer);
                this.startPhaseC();
            }

        }, 100); // Fast ticks
    },

    startPhaseC: function () {
        // === PHASE C: REVEAL (The Climax) ===
        const lootRow = document.getElementById('chest-loot-row');
        const flash = document.getElementById('chest-flash-overlay');
        const title = document.getElementById('chest-title');
        const btn = document.getElementById('chest-claim-btn');

        // 1. Flash
        flash.classList.add('flash-bang');

        // 2. Sound
        if (sfx) sfx.playJackpotClimax();

        // 3. Reveal Actual Items
        Array.from(lootRow.children).forEach((card, index) => {
            const item = this.lootItems[index];
            card.innerHTML = `
                <div class="type">${item.type}</div>
                <div class="icon">${item.icon}</div>
                <div class="title">${item.title}</div>
                <div class="desc">${item.desc}</div>
            `;
            card.style.transform = 'scale(1.2)'; // Zoom In Big
            card.classList.add('revealed');

            // Apply Logic (Grant Items)
            item.action();
        });

        // 4. Text Slam
        let titleText = "JACKPOT!";
        if (this.lootItems.some(i => i.isEvo)) titleText = "EVOLUTION!";
        if (this.lootItems.length >= 5) titleText = "PENTA CHEST!"; // If we ever scale up

        title.innerText = titleText;
        title.classList.add('slam');

        // 5. Fireworks
        this.spawnFireworks();

        // 6. Show Button (Delayed)
        setTimeout(() => {
            btn.classList.add('visible');
        }, 1500);
    },

    close: function () {
        const modal = document.getElementById('chest-modal');
        modal.style.display = 'none';
        this.isOpen = false;
        resumeGame();
    },

    spawnConfetti: function (amount) {
        const colors = ['#f00', '#0f0', '#00f', '#ff0', '#0ff', '#f0f', 'gold'];
        for (let i = 0; i < amount; i++) {
            const c = document.createElement('div');
            c.className = 'confetti';
            c.style.left = (20 + Math.random() * 60) + 'vw'; // Center-ish
            c.style.top = '30%';
            c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            // Random direction fall
            const rot = Math.random() * 360;
            c.style.transform = `rotate(${rot}deg)`;
            document.getElementById('chest-modal').appendChild(c);
            setTimeout(() => c.remove(), 2500);
        }
    },

    spawnFireworks: function () {
        const container = document.getElementById('chest-modal');
        const colors = ['#ff0044', '#00ff44', '#4400ff', '#ffff00'];

        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const cx = 20 + Math.random() * 60; // Percent
                const cy = 20 + Math.random() * 60;

                // Create explosion cluster
                for (let p = 0; p < 20; p++) {
                    const f = document.createElement('div');
                    f.className = 'firework';
                    f.style.left = cx + 'vw';
                    f.style.top = cy + 'vh';
                    f.style.color = colors[Math.floor(Math.random() * colors.length)];

                    // Velocity vars for CSS
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 100 + Math.random() * 200;
                    const tx = Math.cos(angle) * dist + 'px';
                    const ty = Math.sin(angle) * dist + 'px';

                    f.style.setProperty('--tx', tx);
                    f.style.setProperty('--ty', ty);

                    container.appendChild(f);
                    setTimeout(() => f.remove(), 1000);
                }
            }, i * 150);
        }
    },

    generateLoot: function () {
        let pool = [];

        // Weapon Upgrades
        for (const [key, data] of Object.entries(WEAPONS_DB)) {
            const currentLvl = player.weapons[key].level;
            if (currentLvl < CONSTANTS.MAX_WEAPON_LEVEL + 1) {
                let title = data.name;
                let desc = "";
                let type = "Upgrade";
                let isEvo = false;

                if (currentLvl === 0) {
                    desc = "New! " + data.desc;
                    type = "New!";
                } else if (currentLvl === CONSTANTS.MAX_WEAPON_LEVEL) {
                    title = data.maxName;
                    desc = data.evolveDesc;
                    type = "EVOLUTION";
                    isEvo = true;
                } else {
                    const lvl = currentLvl + 1;
                    desc = `Level ${lvl}`;
                }

                pool.push({
                    key: key,
                    title: title,
                    desc: desc,
                    type: type,
                    icon: data.icon,
                    isEvo: isEvo,
                    action: () => { player.weapons[key].level++; }
                });
            }
        }

        // Passives
        PASSIVE_DB.forEach(p => {
            pool.push({
                key: p.id,
                title: p.name,
                desc: p.desc,
                type: "Passive",
                icon: p.icon,
                isEvo: false,
                action: () => {
                    if (p.id === 'dmg') player.stats.dmgMult += 0.15;
                    if (p.id === 'hp') { player.maxHp += 25; player.stats.regen += 1; }
                    if (p.id === 'spd') player.stats.speedMult += 0.1;
                    if (p.id === 'pickup') player.stats.pickupMult += 0.3;
                }
            });
        });

        let choices = [];
        // Prioritize Evos
        let evos = pool.filter(p => p.isEvo);
        if (evos.length > 0) choices.push(evos[Math.floor(Math.random() * evos.length)]);

        while (choices.length < 3) {
            let available = pool.filter(p => !choices.includes(p));
            if (available.length === 0) break;
            choices.push(available[Math.floor(Math.random() * available.length)]);
        }

        if (choices.length === 0) {
            choices.push({ title: "Gold", desc: "Money!", type: "Bonus", icon: "💰", isEvo: false, action: () => { } });
        }

        return choices;
    }
};

// --- 3. Monkeypatch TreasureChest ---
if (typeof TreasureChest !== 'undefined') {
    TreasureChest.prototype.update = function () {
        if (this.state === 'IDLE') {
            this.bob += 0.1;
            if (this.isColliding(player)) {
                this.state = 'OPENING';
                this.timer = 0;
            }
        } else if (this.state === 'OPENING') {
            this.timer++;
            // Instant trigger now, we handle animation in UI
            if (this.timer > 1) {
                this.state = 'OPENED';

                // Remove from pickups
                if (window.pickups) {
                    const idx = pickups.indexOf(this);
                    if (idx > -1) pickups.splice(idx, 1);
                }

                // TRIGGER NEW CHEST UI
                ChestUI.open();
                return false;
            }
        }
        return true;
    };
}
