/**
 * THE MASHACRE - Setup & Configuration
 */

// --- Audio System ---
class SoundFX {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.25;
        this.masterGain.connect(this.ctx.destination);
    }

    playTone(freq, type, duration, slideFreq = null, vol = 0.5) {
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
    }

    playShoot() { this.playTone(200, 'square', 0.1, 50, 0.2); }
    playHit() { this.playTone(100, 'sawtooth', 0.1, null, 0.3); }
    playSplat() { this.playTone(80, 'sawtooth', 0.2, 20, 0.2); }
    playGem() { this.playTone(800 + Math.random() * 200, 'sine', 0.1, null, 0.1); }
    playLightning() {
        this.playTone(500, 'sawtooth', 0.1, 100, 0.2);
        setTimeout(() => this.playTone(100, 'square', 0.3, 50, 0.2), 50);
    }
    playSplash() { this.playTone(150, 'triangle', 0.3, 50, 0.2); }
    playKnife() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        // Generate short noise burst
        const duration = 0.2;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        // Bandpass filter to create "Whoosh"
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = 1; // Width of band
        filter.frequency.setValueAtTime(800, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start();
    }
    playBossSpawn() {
        this.playTone(100, 'sawtooth', 1.0, 50, 0.8);
        setTimeout(() => this.playTone(80, 'square', 1.0, 40, 0.8), 200);
    }
    // UI Sounds
    playHover() { this.playTone(800, 'sine', 0.05, null, 0.1); }
    playHeal() {
        this.playTone(400, 'sine', 0.1, 600, 0.3);
        setTimeout(() => this.playTone(600, 'sine', 0.2, 800, 0.3), 100);
    }
    playMagnet() { this.playTone(200, 'sawtooth', 0.5, 800, 0.3); }
    playNuke() { this.playTone(100, 'sawtooth', 0.5, 10, 0.8); }
    playPop() {
        // Light explosion: Fast decay noise or low tone
        this.playTone(150, 'square', 0.1, 50, 0.5);
        setTimeout(() => this.playTone(100, 'sawtooth', 0.1, 20, 0.3), 50);
    }

    // Casino Level Up Jingle
    playEvolve() {
        const now = this.ctx.currentTime;
        [440, 554, 659, 880, 1108].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, now + i * 0.1);
            gain.gain.setValueAtTime(0.1, now + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.3);
        });
        setTimeout(() => {
            this.playTone(440, 'triangle', 1.0, null, 0.2);
            this.playTone(554, 'triangle', 1.0, null, 0.2);
            this.playTone(880, 'triangle', 1.0, null, 0.2);
        }, 500);
    }
    playLaser() {
        this.playTone(800, 'sine', 0.1, 200, 0.2); // Light Pew (Sine sweep)
    }
}

// --- Constants ---
const CONSTANTS = {
    PLAYER_SPEED: 5.0,
    PLAYER_HP: 150,
    ENEMY_SPAWN_RATE: 40, // FAST SPAWNS (Was 60)
    PICKUP_RANGE: 120,
    GRID_SIZE: 128,
    MAX_WEAPON_LEVEL: 5
};

// --- Weapon Data (With Icons) ---
const WEAPONS_DB = {
    spud_gun: {
        name: "Spud Gun",
        icon: "🔫", // Reverted
        maxName: "FRYER CANNON",
        desc: "Fires at nearest enemy.",
        evolveDesc: "Evolved: Explosive rounds (AOE Damage).",
        type: 'weapon'
    },
    peeler: {
        name: "The Peeler",
        icon: "⚔️", // Kept as Blades
        maxName: "PLASMA CUTTER",
        desc: "Orbital shield that damages enemies.",
        evolveDesc: "Evolved: Massive range, high speed, blue plasma burn.",
        type: 'weapon'
    },
    masher: {
        name: "Potato Masher",
        icon: "🔨",
        maxName: "HEAVY SMASHER",
        desc: "Thrown in a high arc. Hits above/below.",
        evolveDesc: "Evolved: Throws huge hammers that pass through everything.",
        type: 'weapon'
    },
    oil: {
        name: "Hot Oil",
        icon: "🍾",
        maxName: "HOLY NAPALM",
        desc: "Throws oil bottles that shatter into puddles.",
        evolveDesc: "Evolved: Puddles grow and deal blue flame damage.",
        type: 'weapon'
    },
    storm: {
        name: "Fryer Storm",
        icon: "⚡", // Reverted
        maxName: "THUNDER FRY",
        desc: "Strikes random enemies with lightning.",
        evolveDesc: "Evolved: Strikes twice as fast, double damage.",
        type: 'weapon'
    },
    garlic: {
        name: "Garlic Butter",
        icon: "🧄",
        maxName: "VAMPIRE BANE",
        desc: "Damaging aura.",
        evolveDesc: "Evolved: Pulsates, knocks enemies back.",
        type: 'weapon'
    },
    gravy: {
        name: "Gravy Press",
        icon: "🥫", // Giant Can!
        maxName: "GRAVY TSUNAMI",
        desc: "High AOE Damage + Squashes & Slows enemies.",
        evolveDesc: "Evolved: Double size. Causes a massive earthquake shockwave.",
        type: 'weapon'
    },
    ketchup: {
        name: "Ketchup Laser",
        icon: "🍅", // Tomato
        maxName: "SRIRACHA BEAM",
        desc: "Piercing beam strikes nearest enemy.",
        evolveDesc: "Evolved: Wider beam, massive damage.",
        type: 'weapon'
    },
    tots: {
        name: "Tater Tots",
        icon: "🥔", // Small potato?? Or 📦 (Box)? Let's use 🥔 for now or 🌑 (Nugget). 🥔 is fine.
        maxName: "HASHBROWN BUNKER",
        desc: "Drops explosive mines at your feet.",
        evolveDesc: "Evolved: Cluster mines.",
        type: 'weapon'
    },
    grater: {
        name: "Cheese Grater",
        icon: "🧀",
        maxName: "THE SHREDDER",
        desc: "Shotgun blast of cheese shards.",
        evolveDesc: "Evolved: Continuous stream of destruction.",
        type: 'weapon'
    }
};

const PASSIVE_DB = [
    { id: 'dmg', name: 'Deep Fry', icon: '💪', desc: 'Global Damage +15%' }, // Reverted
    { id: 'hp', name: 'Carbo Load', icon: '❤️', desc: 'Max HP +25, +1 HP/sec' }, // Reverted
    { id: 'spd', name: 'Grease Wheels', icon: '👟', desc: 'Move Speed +10%' }, // Reverted
    { id: 'pickup', name: 'Magnetism', icon: '🧲', desc: 'Pickup Range +30%' }
];
