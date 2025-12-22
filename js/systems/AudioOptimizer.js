/**
 * AudioOptimizer.js
 * Throttles sound effects to prevent audio distortion/clipping during mass events (AoE).
 * Applied as a runtime patch to window.sfx
 */

(function () {
    function applyAudioThrottle() {
        if (!window.sfx) {
            console.warn("AudioOptimizer: sfx not found, retrying...");
            setTimeout(applyAudioThrottle, 500);
            return;
        }

        console.log("AudioOptimizer: Applying sound caps.");

        const originalHit = window.sfx.playHit.bind(window.sfx);
        const originalSplat = window.sfx.playSplat.bind(window.sfx);
        const originalGem = window.sfx.playGem.bind(window.sfx);

        // Helper for Burst Limiting
        // Allows 'max' calls within 'windowMs'
        function createLimiter(windowMs, max) {
            let count = 0;
            let windowStart = 0;

            return function () {
                const now = performance.now();
                if (now - windowStart > windowMs) {
                    // Reset window
                    windowStart = now;
                    count = 0;
                }

                if (count < max) {
                    count++;
                    return true; // Allowed
                }
                return false; // Blocked
            };
        }

        // Configuration:
        // Hit: Allow 10 overlapping sounds every 50ms. (ULTRA Crunchy!)
        // Splat: Allow 10 overlapping sounds every 50ms.
        // Gem: Tighter limit (gems are sharp), 2 per 50ms.

        // Global Limiter to prevent total mix distortion
        const globalLimiter = createLimiter(50, 8); // Tightened from 12 to 8 (Prevents screeching)

        // Configuration: Burst Limits
        // Default: 4 (Standard Crunch)
        // Laser: 4 (Requested Limit)
        // Press: 8 (Requested Heavier Crunch)

        const limiters = {
            default: createLimiter(50, 4),
            laser: createLimiter(50, 4),
            press: createLimiter(50, 8),
            splat: createLimiter(50, 10), // Keep high for mass death satisfaction
            gem: createLimiter(50, 20)    // Gems Uncapped (20 per frame is effectively infinite)
        };

        // Sound Profiles
        // Default: Standard Impact (100Hz)
        // Laser: High Pitch "Sizzle" (300Hz, Short)
        // Press: Low Pitch "Thud" (50Hz, Long)

        const soundProfiles = {
            default: { freq: 100, type: 'sawtooth', dur: 0.1, vol: 0.4, slide: null }, // Reduced from 0.8
            laser: { freq: 150, type: 'sawtooth', dur: 0.1, vol: 0.2, slide: null }, // 150Hz, Low Volume
            press: { freq: 50, type: 'sawtooth', dur: 0.2, vol: 0.8, slide: null }, // Heavy, Loud (Kept High)
            splat: { freq: 80, type: 'sawtooth', dur: 0.2, vol: 0.3, slide: 20 }    // Reduced from 0.4
        };

        // Overwrites
        window.sfx.playHit = function (source = 'default') {
            const limiter = limiters[source] || limiters.default;
            const profile = soundProfiles[source] || soundProfiles.default;

            // Must pass Source Limit AND Global Limit
            if (limiter() && globalLimiter()) {
                // Play specific tone for this source
                this.playTone(profile.freq, profile.type, profile.dur, profile.slide, profile.vol);
            }
        };

        window.sfx.playSplat = function () {
            // Use local profile instead of originalSplat to control volume
            if (limiters.splat() && globalLimiter()) {
                const p = soundProfiles.splat;
                this.playTone(p.freq, p.type, p.dur, p.slide, p.vol);
            }
        };

        window.sfx.playGem = function () {
            if (limiters.gem()) originalGem(); // Gems don't use global limit (soft sound)
        };

        // NEW: Victory Music (Extended Composition)
        window.sfx.playVictory = function () {
            if (this.victoryInterval) return;

            const ctx = this.ctx;
            const songDuration = 18.0; // Seconds

            const playSong = () => {
                const now = ctx.currentTime;

                // PART 1: The Fanfare (0.0s - 3.0s)
                // C5, D5, E5, G5, E5, C6
                const fanfare = [
                    { f: 523.25, d: 0.2, t: 0.0, vol: 0.3 }, // C5
                    { f: 587.33, d: 0.2, t: 0.2, vol: 0.3 }, // D5
                    { f: 659.25, d: 0.2, t: 0.4, vol: 0.3 }, // E5
                    { f: 783.99, d: 0.4, t: 0.6, vol: 0.3 }, // G5
                    { f: 659.25, d: 0.2, t: 1.0, vol: 0.3 }, // E5
                    { f: 1046.5, d: 2.0, t: 1.2, vol: 0.4 }  // C6 (High C)
                ];

                // PART 2: The "Thank You" Melody (3.5s - 10.0s)
                // Gentle swaying arpeggios (F Major -> G Major)
                const melody = [
                    // F Major (F-A-C-E)
                    { f: 349.23, d: 0.4, t: 3.5, vol: 0.2 }, // F4
                    { f: 440.00, d: 0.4, t: 3.9, vol: 0.2 }, // A4
                    { f: 523.25, d: 0.4, t: 4.3, vol: 0.2 }, // C5
                    { f: 659.25, d: 0.8, t: 4.7, vol: 0.2 }, // E5

                    // G Major (G-B-D-F#)
                    { f: 392.00, d: 0.4, t: 6.0, vol: 0.2 }, // G4
                    { f: 493.88, d: 0.4, t: 6.4, vol: 0.2 }, // B4
                    { f: 587.33, d: 0.4, t: 6.8, vol: 0.2 }, // D5
                    { f: 739.99, d: 0.8, t: 7.2, vol: 0.2 }, // F#5
                ];

                // PART 3: Resolution (10.0s - 18.0s)
                // Descending C Major scale with delay
                const resolution = [
                    { f: 1046.5, d: 0.4, t: 9.0, vol: 0.3 }, // C6
                    { f: 987.77, d: 0.4, t: 9.4, vol: 0.2 }, // B5
                    { f: 880.00, d: 0.4, t: 9.8, vol: 0.2 }, // A5
                    { f: 783.99, d: 0.4, t: 10.2, vol: 0.2 },// G5
                    { f: 659.25, d: 0.4, t: 12.0, vol: 0.2 }, // E5
                    { f: 587.33, d: 0.4, t: 12.5, vol: 0.2 }, // D5
                    { f: 523.25, d: 4.0, t: 13.0, vol: 0.3 }  // C5 (Final Chord Root)
                ];

                const notes = [...fanfare, ...melody, ...resolution];

                notes.forEach(n => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();

                    osc.type = 'triangle'; // Flute-like
                    osc.frequency.value = n.f;

                    // Envelope
                    gain.gain.setValueAtTime(0, now + n.t);
                    gain.gain.linearRampToValueAtTime(n.vol, now + n.t + 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + n.t + n.d);

                    osc.connect(gain);
                    gain.connect(this.masterGain);

                    osc.start(now + n.t);
                    osc.stop(now + n.t + n.d);
                });
            };

            playSong();
            this.victoryInterval = setInterval(playSong, songDuration * 1000);
        };

        window.sfx.stopVictory = function () {
            if (this.victoryInterval) {
                clearInterval(this.victoryInterval);
                this.victoryInterval = null;
            }
        };
    }

    // Init after load to ensure sfx exists
    window.addEventListener('load', () => {
        setTimeout(applyAudioThrottle, 200); // 200ms after load
    });
})();
