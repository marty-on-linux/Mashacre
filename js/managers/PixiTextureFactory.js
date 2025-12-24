// PixiTextureFactory.js
// Generates procedural textures for bosses, matching the main potato theme.

(function() {
    if (typeof window === 'undefined') return;
    const hasPixi = typeof PIXI !== 'undefined' && window.PIXI_OVERLAY && window.PIXI_OVERLAY.app;
    if (!hasPixi) {
        console.warn('[PixiTextureFactory] PIXI overlay not available.');
        return;
    }

    function makeCanvas(w, h) {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        return c;
    }

    function randLcg(seed) {
        let s = seed >>> 0;
        return () => {
            s = (s * 1664525 + 1013904223) >>> 0;
            return (s & 0xffffff) / 0x1000000;
        };
    }

    function drawSpeckledTexture(ctx, w, h, baseStops, speckleColor, speckleCount, seed) {
        // Radial gradient base
        const g = ctx.createRadialGradient(w * 0.5, h * 0.45, 8, w * 0.5, h * 0.5, Math.max(w, h) * 0.6);
        baseStops.forEach(([stop, color]) => g.addColorStop(stop, color));
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

        const rnd = randLcg(seed || 12345);
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = speckleColor;
        for (let i = 0; i < speckleCount; i++) {
            const x = rnd() * w;
            const y = rnd() * h;
            const r = (rnd() * 2.0) + 0.6;
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }

    function createPotatoTexture(type) {
        // Small tile texture; will be used in a TilingSprite
        const w = 256, h = 256;
        const canvas = makeCanvas(w, h);
        const ctx = canvas.getContext('2d');

        if (type === 'king') {
            // Rich brown potato with golden sheen and deeper freckles
            drawSpeckledTexture(ctx, w, h,
                [ [0, '#b07a43'], [0.6, '#9a6a3a'], [1, '#6e4929'] ],
                '#3e2614', 900, 98765
            );
            // Subtle diagonal sheen
            const sheen = ctx.createLinearGradient(0, 0, w, h);
            sheen.addColorStop(0.0, 'rgba(255,255,255,0.08)');
            sheen.addColorStop(0.3, 'rgba(255,255,255,0.02)');
            sheen.addColorStop(0.7, 'rgba(255,255,255,0.00)');
            ctx.fillStyle = sheen; ctx.fillRect(0, 0, w, h);
        } else {
            // Chef: pinkish, ham-like undertones but still potato-style
            drawSpeckledTexture(ctx, w, h,
                [ [0, '#f5c7c7'], [0.6, '#e6a5a5'], [1, '#c98181'] ],
                '#7a4a4a', 800, 54321
            );
            const sheen = ctx.createLinearGradient(0, 0, w, h);
            sheen.addColorStop(0.0, 'rgba(255,255,255,0.10)');
            sheen.addColorStop(0.4, 'rgba(255,255,255,0.03)');
            sheen.addColorStop(0.8, 'rgba(255,255,255,0.00)');
            ctx.fillStyle = sheen; ctx.fillRect(0, 0, w, h);
        }

        // Convert to PIXI texture
        const base = PIXI.Texture.from(canvas);
        base.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
        return base;
    }

    function makeTilingBody(type, size) {
        const tex = createPotatoTexture(type);
        const tileSize = Math.max(128, Math.floor(size * 2));
        const tiler = new PIXI.TilingSprite(tex, tileSize, tileSize);
        tiler.anchor.set(0.5);
        tiler.tileScale.set(0.8);
        return tiler;
    }

    window.PIXI_TEXTURES = {
        createPotatoTexture,
        makeTilingBody,
    };
})();
