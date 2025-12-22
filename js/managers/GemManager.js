/**
 * GemManager.js
 * Handles optimization for large numbers of gems.
 * - Sleep System: Distant gems are just data points (no physics).
 * - Wake Queue: Gems wait in line to be instantiated to prevent lag spikes.
 * - Stream System: Unified system for both proximity wake and magnet wake.
 */

class GemManager {
    constructor() {
        this.sleepingGems = []; // Lightweight data: {x, y, val, type}
        this.activeGems = [];   // Real Gem objects

        // Settings
        this.WAKE_DISTANCE = 600; // Radius to wake gems
        this.SLEEP_DISTANCE = 750; // Radius to put gems back to sleep

        // Wake Queue System (The Speed Limit)
        this.wakeQueue = []; // Unified queue for gems waiting to spawn
        this.GEMS_PER_FRAME = 20; // Maximum number of physics bodies to create per frame
    }

    /**
     * Spawns a new gem (starts asleep)
     */
    spawn(x, y, val, type) {
        // Just push data, don't create object yet
        this.sleepingGems.push({ x, y, val, type });
    }

    /**
     * Activates the magnet stream
     */
    triggerMagnet() {
        // move ALL sleeping gems to the waiting line
        // We tag them so they spawn in 'magnetized' mode
        for (let i = this.sleepingGems.length - 1; i >= 0; i--) {
            const g = this.sleepingGems[i];
            g.forceMagnet = true; // Add flag to data
            this.wakeQueue.push(g);
        }
        this.sleepingGems = []; // All transferred

        // Also force-magnetize all CURRENT active gems
        this.activeGems.forEach(g => g.magnetized = true);
    }

    update() {
        if (!player) return;
        
        const px = player.x;
        const py = player.y;
        const wakeDistSq = this.WAKE_DISTANCE * this.WAKE_DISTANCE;
        const sleepDistSq = this.SLEEP_DISTANCE * this.SLEEP_DISTANCE;

        // 1. Proximity Check (Add to Waiting Line)
        // We can do this aggressively because pushing to array is fast.
        // Creating the objects is what we throttle.
        for (let i = this.sleepingGems.length - 1; i >= 0; i--) {
            const g = this.sleepingGems[i];
            const dx = g.x - px;
            const dy = g.y - py;
            const distSq = dx * dx + dy * dy;

            if (distSq < wakeDistSq) {
                // Move from Sleeping -> Wake Queue
                this.wakeQueue.push(g);
                this.sleepingGems.splice(i, 1);
            }
        }

        // 2. Process Waiting Line (The Speed Limit)
        // Only let a few people in the club at a time
        let spawnedThisFrame = 0;
        while (this.wakeQueue.length > 0 && spawnedThisFrame < this.GEMS_PER_FRAME) {
            const data = this.wakeQueue.shift(); // Get next in line

            const gem = new Gem(data.x, data.y, data.val, data.type);

            // If it was forced by magnet, set the flag
            if (data.forceMagnet) gem.magnetized = true;

            this.activeGems.push(gem);
            spawnedThisFrame++;
        }

        // 3. Update Active Gems
        for (let i = this.activeGems.length - 1; i >= 0; i--) {
            const gem = this.activeGems[i];
            const active = gem.update(); // Returns false if collected

            if (!active) {
                this.activeGems.splice(i, 1);
                continue;
            }

            // Sleep Logic (Only if not magnetized)
            if (!gem.magnetized) {
                const dx = gem.x - px;
                const dy = gem.y - py;
                const distSq = dx * dx + dy * dy;
                if (distSq > sleepDistSq) {
                    // Go back to sleep
                    // We remove 'forceMagnet' flag if it had one, so it sleeps normally
                    this.sleepingGems.push({ x: gem.x, y: gem.y, val: gem.val, type: gem.type });
                    this.activeGems.splice(i, 1);
                }
            }
        }
    }

    draw(ctx) {
        // 1. Draw Active Gems (High Quality: Shadows + Diamond Shape)
        this.activeGems.forEach(g => g.draw(ctx));

        // 2. Draw Sleeping & Queued Gems (Low Quality: Flat Color + Simple Rect)
        // Optimization: Batch Draw Calls by Color
        const margin = 50;
        const camL = camera.x - window.innerWidth / 2 - margin;
        const camR = camera.x + window.innerWidth / 2 + margin;
        const camT = camera.y - window.innerHeight / 2 - margin;
        const camB = camera.y + window.innerHeight / 2 + margin;

        // Group by type for batching
        const greens = [];
        const purples = [];

        // Collect visible sleeping gems
        for (const g of this.sleepingGems) {
            if (g.x < camL || g.x > camR || g.y < camT || g.y > camB) continue;
            if (g.type === 'purple') purples.push(g);
            else greens.push(g);
        }
        // Collect visible queue gems
        for (const g of this.wakeQueue) {
            if (g.x < camL || g.x > camR || g.y < camT || g.y > camB) continue;
            if (g.type === 'purple') purples.push(g);
            else greens.push(g);
        }

        // BATCH 1: Green Gems
        if (greens.length > 0) {
            ctx.fillStyle = '#00ff00';
            ctx.beginPath();
            for (const g of greens) {
                // Draw 8x8 Rect at center (x-4, y-4)
                ctx.rect(g.x - 4, g.y - 4, 8, 8);
            }
            ctx.fill(); // Single draw call for all green gems!
        }

        // BATCH 2: Purple Gems
        if (purples.length > 0) {
            ctx.fillStyle = '#aa00ff';
            ctx.beginPath();
            for (const g of purples) {
                ctx.rect(g.x - 4, g.y - 4, 8, 8);
            }
            ctx.fill(); // Single draw call for all purple gems!
        }
    }
}
