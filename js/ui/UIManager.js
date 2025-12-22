// --- UI Manager ---

// Cache frequently-used DOM elements to reduce query costs on level-up
const UI_CACHE = {
    modal: null,
    cards: null,
    title: null,
    basket: null
};

// Reusable card pool to avoid DOM recreation each level-up
const CARD_POOL = [];

function getUIRefs() {
    if (!UI_CACHE.modal) UI_CACHE.modal = document.getElementById('level-up-modal');
    if (!UI_CACHE.cards) UI_CACHE.cards = document.getElementById('upgrade-cards');
    if (!UI_CACHE.title && UI_CACHE.modal) UI_CACHE.title = UI_CACHE.modal.querySelector('h1');
    if (!UI_CACHE.basket) UI_CACHE.basket = document.getElementById('fryer-basket');
    return UI_CACHE;
}

function startGame() {
    document.getElementById('start-overlay').style.display = 'none';

    // Add BG potatoes to start screen
    const bg = document.getElementById('bg-particles');
    bg.innerHTML = ''; // Clear previous
    for (let i = 0; i < 10; i++) {
        const p = document.createElement('div');
        p.className = 'bg-potato';
        p.innerText = '🥔';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDuration = (8 + Math.random() * 10) + 's';
        p.style.animationDelay = (Math.random() * 5) + 's';
        bg.appendChild(p);
    }

    if (!window.sfx) sfx = new SoundFX();
    init();
}

// Throttled UI Update: Prevents DOM thrashing on mass events (Nuke/Magnet)
function updateUI() {
    window.uiDirty = true;
}

function renderUI() {
    if (!player) return;

    // Cache DOM element references for performance (only query once)
    const killCountEl = document.getElementById('kill-count');
    const levelNumEl = document.getElementById('level-num');
    const hpTextEl = document.getElementById('hp-text');
    const xpFillEl = document.getElementById('xp-fill');
    const hpFillEl = document.getElementById('hp-fill');
    const dangerOverlay = document.getElementById('danger-overlay');
    const timerEl = document.getElementById('timer');
    
    if (killCountEl) killCountEl.innerText = score;
    if (levelNumEl) levelNumEl.innerText = player.level;
    if (hpTextEl) hpTextEl.innerText = `${Math.ceil(player.hp)}/${player.maxHp}`;

    const xpPct = Math.min((player.xp / player.xpToNext) * 100, 100);
    if (xpFillEl) xpFillEl.style.width = `${xpPct}%`;

    const hpPct = Math.max(0, (player.hp / player.maxHp) * 100);
    if (hpFillEl) {
        hpFillEl.style.width = `${hpPct}%`;

        // Potato-tone gradient shifts with health
        const low = { r: 122, g: 74, b: 46 };    // #7a4a2e
        const high = { r: 226, g: 193, b: 135 }; // #e2c187
        const t = hpPct / 100;
        const mix = (a, b) => Math.round(a + (b - a) * t);
        const c1 = `rgb(${mix(low.r, high.r)}, ${mix(low.g, high.g)}, ${mix(low.b, high.b)})`;
        const c2 = `rgb(${mix(low.r - 20, high.r)}, ${mix(low.g - 10, high.g)}, ${mix(low.b - 10, high.b)})`;
        hpFillEl.style.background = `linear-gradient(90deg, ${c1}, ${c2})`;
        hpFillEl.style.boxShadow = `0 0 12px rgba(${mix(low.r, high.r)}, ${mix(low.g, high.g)}, ${mix(low.b, high.b)}, 0.7)`;
    }

    // Low HP vignette
    if (dangerOverlay) {
        const dangerT = hpPct < 35 ? (1 - hpPct / 35) : 0;
        dangerOverlay.style.opacity = (0.45 * dangerT).toFixed(2);
    }

    // Boss Bar Update
    if (activeBoss) {
        const bossFillEl = document.getElementById('boss-fill');
        if (bossFillEl) {
            const bossPct = Math.max(0, (activeBoss.hp / activeBoss.maxHp) * 100);
            bossFillEl.style.width = `${bossPct}%`;
        }
    }

    if (timerEl) {
        const totalSeconds = Math.floor(gameTime);
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        timerEl.innerText = `${m}:${s}`;
    }
}

function togglePause() {
    if (isGameOver || !player) return;
    isPaused = !isPaused;
    const menu = document.getElementById('pause-menu');
    menu.style.display = isPaused ? 'flex' : 'none';
    if (!isPaused) {
        lastTime = performance.now();
        loop(lastTime);
    }
}

function gameOver() {
    isGameOver = true;
    isPaused = true;
    document.getElementById('game-over-screen').style.display = 'flex';
    document.getElementById('final-stats').innerText = `You survived ${document.getElementById('timer').innerText}`;
}

function gameWin() {
    isGameOver = true;
    isPaused = true;
    document.getElementById('win-screen').style.display = 'flex';
    document.getElementById('win-stats').innerText = `Survived: ${document.getElementById('timer').innerText} | Level: ${player.level}`;
}

function resumeGame() {
    document.getElementById('level-up-modal').style.display = 'none';
    isPaused = false;
    lastTime = performance.now();
    loop(lastTime);
}

function triggerLevelUp(numChoices = 3, isChest = false, autoCollect = false) {
    // Legacy support check
    if (typeof numChoices === 'boolean') {
        isChest = numChoices;
        numChoices = 3;
    }

    isPaused = true;
    sfx.playEvolve();
    const { modal, cards: container, title: titleHeader, basket } = getUIRefs();

    // Safety: ensure elements exist
    if (!modal || !container || !titleHeader || !basket) return;

    // Clear cards efficiently
    container.replaceChildren();

    // Set Title (unchanged visually)
    if (autoCollect) {
        titleHeader.innerText = "TREASURE FOUND!";
        titleHeader.style.color = "gold";
    } else {
        titleHeader.innerText = "LEVEL UP!";
        titleHeader.style.color = "white";
    }

    // Show basket (same animation, but avoid duplicate layouts)
    basket.style.animation = 'none';
    // Force reflow once
    void basket.offsetWidth;
    basket.style.animation = 'basket-drop 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';

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
                // Normal Upgrade Description
                const lvl = currentLvl + 1;
                switch (key) {
                    case 'spud_gun': desc = `Lvl ${lvl}: Dmg +30%, +1 Projectile, Faster Fire.`; break;
                    case 'peeler': desc = `Lvl ${lvl}: Dmg +30%, Range +20%, Faster Spin.`; break;
                    case 'masher': desc = `Lvl ${lvl}: Dmg +30%, Throw Speed +15%, Faster Fire.`; break;
                    case 'oil': desc = `Lvl ${lvl}: Dmg +30%, Area +10%, Throw Rate +10%.`; break;
                    case 'storm': desc = `Lvl ${lvl}: Dmg +40%, +1 Target, Faster Strike.`; break;
                    case 'garlic': desc = `Lvl ${lvl}: Dmg +30%, Area +30%.`; break;
                    case 'gravy': desc = `Lvl ${lvl}: Dmg +50%, Cooldown -10%, Larger Area.`; break;
                    case 'ketchup': desc = `Lvl ${lvl}: Dmg +50%, Cooldown -15%.`; break;
                    case 'tots': desc = `Lvl ${lvl}: Dmg +40%, Cooldown -20%.`; break;
                    case 'grater': desc = `Lvl ${lvl}: Dmg +30%, +3 Shards.`; break;
                    default: desc = `Level ${lvl}: Increases power significantly.`; break;
                }
            }

            // RARITY CHECK: Throttle High Level Weapons early
            let skip = false;
            // CHEST BYPASS: Chests ignore rarity gating!
            if (!isChest && currentLvl >= 3 && player.level < 20) {
                if (Math.random() < 0.8) skip = true;
            }

            if (!skip) {
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
    }

    // Passive Upgrades
    PASSIVE_DB.forEach(p => {
        pool.push({
            key: p.id,
            title: p.name,
            desc: p.desc,
            type: "Passive",
            icon: p.icon,
            action: () => {
                if (p.id === 'dmg') player.stats.dmgMult += 0.15;
                if (p.id === 'hp') {
                    player.maxHp += 25;
                    player.stats.regen += 1;
                }
                if (p.id === 'spd') player.stats.speedMult += 0.1;
                if (p.id === 'pickup') player.stats.pickupMult += 0.3;
            }
        });
    });

    // Randomize Pool
    pool.sort(() => Math.random() - 0.5);

    let choices = pool.slice(0, numChoices);

    if (isChest) {
        const evos = pool.filter(p => p.isEvo);
        if (evos.length > 0) {
            // Ensure at least one Evo if available
            // For Chest (3 items), we might want multiple? 
            // Standard: Ensure 1st slot is Evo
            if (!choices.some(c => c.isEvo)) {
                choices[0] = evos[0];
            }
        }
    }

    // Failsafe: Ensure at least one weapon if possible (unless autoCollect where we want variety)
    const hasWeapon = choices.some(c => c.type !== 'Passive');
    if (!hasWeapon) {
        const availableWeapons = pool.filter(p => p.type !== 'Passive');
        if (availableWeapons.length > 0) {
            choices[choices.length - 1] = availableWeapons[0];
        }
    }

    // Ensure pool has enough card elements
    while (CARD_POOL.length < choices.length) {
        const card = document.createElement('div');
        card.className = 'upgrade-card';

        const top = document.createElement('div');
        const type = document.createElement('div');
        type.className = 'card-type';
        const title = document.createElement('div');
        title.className = 'card-title';
        top.appendChild(type);
        top.appendChild(title);

        const icon = document.createElement('div');
        icon.className = 'upgrade-icon';

        const desc = document.createElement('div');
        desc.className = 'card-desc';

        card.appendChild(top);
        card.appendChild(icon);
        card.appendChild(desc);

        CARD_POOL.push({ card, top, type, title, icon, desc });
    }

    // Render Cards with a fragment to minimize layout thrash
    const frag = document.createDocumentFragment();

    for (let i = 0; i < choices.length; i++) {
        const opt = choices[i];
        if (autoCollect) opt.action();

        const pooled = CARD_POOL[i];
        const { card, type, title, icon, desc } = pooled;

        card.className = `upgrade-card ${opt.isEvo ? 'evolved' : ''}`;

        if (autoCollect) {
            card.style.pointerEvents = 'none';
            card.style.transform = 'scale(1)';
        } else {
            card.style.pointerEvents = '';
            card.style.transform = '';
        }

        type.textContent = opt.type;
        title.textContent = opt.title;
        icon.textContent = opt.icon || '❓';
        desc.textContent = opt.desc;

        if (!autoCollect) {
            card.onclick = () => {
                opt.action();
                resumeGame();
            };
            card.onmouseenter = () => { if (sfx) sfx.playHover(); };
        } else {
            card.onclick = null;
            card.onmouseenter = null;
        }

        frag.appendChild(card);
    }

    container.appendChild(frag);

    // If Auto-Collect, add a "COLLECT ALL" button
    if (autoCollect) {
        const btn = document.createElement('button');
        btn.innerText = "COLLECT LOOT";
        btn.className = "restart-btn"; // Reuse style
        btn.style.marginTop = "20px";
        btn.style.fontSize = "1.5rem";
        btn.onclick = () => {
            resumeGame();
        };
        container.appendChild(btn);
    }

    modal.style.display = 'flex';
}

function drawSpatulaArrow(ctx) {
    if (activeBoss && activeBoss.isDead) return;
    pickups.forEach(p => {
        // Spatula (Gold) or Treasure Chest (Brown)
        const isSpatula = p instanceof GoldenSpatula;
        const isChest = p instanceof TreasureChest;

        if (isSpatula || isChest) {
            const dx = p.x - (mouse.wx || player.x);
            const pdx = p.x - player.x;
            const pdy = p.y - player.y;

            // Only draw if far away off screen (radius 600 approx)
            if (Math.hypot(pdx, pdy) > 600) {
                const angle = Math.atan2(pdy, pdx);
                const cx = canvas.width / 2;
                const cy = canvas.height / 2;
                const dist = Math.min(canvas.width, canvas.height) / 2 - 60;

                const ax = cx + Math.cos(angle) * dist;
                const ay = cy + Math.sin(angle) * dist;

                ctx.save();
                ctx.translate(ax, ay);
                ctx.rotate(angle);

                const scale = 1.3 + Math.sin(frameCount * 0.1) * 0.3;
                ctx.scale(scale, scale);

                if (isSpatula) {
                    ctx.fillStyle = '#FFD700'; // Gold
                    ctx.strokeStyle = 'white';
                    ctx.shadowColor = 'orange';
                } else {
                    ctx.fillStyle = '#8B4513'; // Brown (Wood)
                    ctx.strokeStyle = '#DAA520'; // Gold Trim
                    ctx.shadowColor = 'black';
                }

                ctx.lineWidth = 2;
                ctx.shadowBlur = 10;

                ctx.beginPath();
                ctx.moveTo(15, 0);
                ctx.lineTo(-15, 15);
                ctx.lineTo(-15, -15);
                ctx.closePath();
                ctx.fill(); ctx.stroke();

                // Icon Inside?
                if (isChest) {
                    ctx.fillStyle = 'gold';
                    ctx.font = '15px Arial';
                    ctx.textAlign = 'center';
                    ctx.rotate(-Math.PI / 2); // Upright
                    ctx.fillText("📦", -5, 0);
                } else if (isSpatula) {
                    // Mini Spatula
                    ctx.fillStyle = '#FFD700';
                    ctx.font = '15px Arial';
                    ctx.textAlign = 'center';
                    ctx.rotate(-Math.PI / 2); // Upright
                    ctx.fillText("🍳", -5, 0);
                }

                ctx.restore();
            }
        }
    });
}
