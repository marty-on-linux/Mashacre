class WaveManager {
    static stopSpawning() {
        console.log("WaveManager: Stopping Spawning");

        // 1. Stop future spawns
        CONSTANTS.ENEMY_SPAWN_RATE = Infinity;

        // Also ensure next boss doesn't spawn
        if (typeof nextBossTime !== 'undefined') nextBossTime = Infinity;
        if (typeof nextBossLevel !== 'undefined') nextBossLevel = Infinity;

        // 2. Clear existing enemies (Except Boss)
        // enemies is a global array from main.js
        if (typeof enemies !== 'undefined') {
            for (let i = enemies.length - 1; i >= 0; i--) {
                if (enemies[i].name !== "THE MASH KING") {
                    enemies.splice(i, 1);
                }
            }
        }

        // 3. Clear projectiles for visual clarity
        if (typeof enemyProjectiles !== 'undefined') enemyProjectiles.length = 0;
        if (typeof projectiles !== 'undefined') projectiles.length = 0;
        if (typeof mines !== 'undefined') mines.length = 0;

        // 4. Clear Clutter (Gems, Splats, Damage Numbers)
        if (typeof gems !== 'undefined') gems.length = 0;
        if (typeof splats !== 'undefined') splats.length = 0;
        if (typeof particles !== 'undefined') particles.length = 0;
        if (typeof damageNumbers !== 'undefined') damageNumbers.length = 0;

        // 5. Clear Pickups (EXCEPT Crown - Assuming Crown hasn't been added yet or we filter)
        // Since stopSpawning is called BEFORE spawning the crown in MashKing.js, we can just clear all pickups.
        if (typeof pickups !== 'undefined') pickups.length = 0;

        // 6. Silence Player Weapons
        if (typeof player !== 'undefined' && player.weapons) {
            // Safely disable weapons by setting level to 0
            for (const key in player.weapons) {
                if (player.weapons.hasOwnProperty(key)) {
                    player.weapons[key].level = 0;
                }
            }
        }

        console.log("WaveManager: Spawning Stopped. Minions cleared.");
    }
}
