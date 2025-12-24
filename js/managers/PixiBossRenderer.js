// PixiBossRenderer.js
// Renders boss visuals using PixiJS Graphics, matching the main potato theme.
// Non-invasive: overlays only, no input capture.

(function() {
    if (typeof window === 'undefined') return;
    const hasPixi = typeof PIXI !== 'undefined' && window.PIXI_OVERLAY && window.PIXI_OVERLAY.app;
    if (!hasPixi) {
        console.warn('[PixiBossRenderer] PIXI overlay not available. Boss overlay disabled.');
        return;
    }

    const app = window.PIXI_OVERLAY.app;
    const stage = app.stage;
    const bossMap = new Map(); // entity -> {container, graphics}

    function worldToScreen(x, y) {
        const canvas = document.getElementById('gameCanvas');
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const cam = window.camera || { x: 0, y: 0 };
        const sx = Math.floor(cx - cam.x + x);
        const sy = Math.floor(cy - cam.y + y);
        return { x: sx, y: sy };
    }

    function makePotatoGraphic(isKing, size) {
        const s = Math.max(10, size || 80);
        const container = new PIXI.Container();
        container.sortableChildren = true;

        // Shadow ellipse
        const shadow = new PIXI.Graphics();
        shadow.beginFill(0x000000, 0.25);
        shadow.drawEllipse(0, s * 0.85, s * 0.95, s * 0.28);
        shadow.endFill();
        shadow.zIndex = 0;
        container.addChild(shadow);

        // Body mask path (organic potato)
        const mask = new PIXI.Graphics();
        const strokeColor = isKing ? 0x5a3a10 : 0xaa6666;
        mask.lineStyle(4, strokeColor, 1);
        mask.beginFill(0xffffff);
        if (isKing) {
            mask.moveTo(0, -s);
            mask.bezierCurveTo(s * 0.7, -s * 0.95, s * 1.05, -s * 0.4, s * 0.95, 0);
            mask.bezierCurveTo(s * 1.1, s * 0.5, s * 0.85, s * 0.9, s * 0.5, s * 0.95);
            mask.bezierCurveTo(s * 0.2, s * 1.05, -s * 0.2, s * 1.05, -s * 0.5, s * 0.95);
            mask.bezierCurveTo(-s * 0.85, s * 0.9, -s * 1.1, s * 0.5, -s * 0.95, 0);
            mask.bezierCurveTo(-s * 1.05, -s * 0.4, -s * 0.7, -s * 0.95, 0, -s);
        } else {
            mask.moveTo(0, -s * 0.9);
            mask.bezierCurveTo(s * 0.6, -s * 0.85, s * 0.95, -s * 0.35, s * 0.9, s * 0.1);
            mask.bezierCurveTo(s * 0.95, s * 0.55, s * 0.7, s * 0.9, s * 0.35, s * 0.95);
            mask.bezierCurveTo(s * 0.1, s, -s * 0.1, s, -s * 0.35, s * 0.95);
            mask.bezierCurveTo(-s * 0.7, s * 0.9, -s * 0.95, s * 0.55, -s * 0.9, s * 0.1);
            mask.bezierCurveTo(-s * 0.95, -s * 0.35, -s * 0.6, -s * 0.85, 0, -s * 0.9);
        }
        mask.endFill();

        // Textured body via tiling sprite masked by the path
        const type = isKing ? 'king' : 'chef';
        let body;
        if (window.PIXI_TEXTURES && typeof window.PIXI_TEXTURES.makeTilingBody === 'function') {
            body = window.PIXI_TEXTURES.makeTilingBody(type, s);
        } else {
            // Fallback solid fill if texture factory missing
            const g = new PIXI.Graphics();
            const bodyColor = isKing ? 0x8b5a30 : 0xffcccc;
            g.beginFill(bodyColor);
            g.drawCircle(0, 0, s);
            g.endFill();
            body = g;
        }
        body.mask = mask;
        body.zIndex = 1;
        container.addChild(body);
        container.addChild(mask);

        // Highlight sheen
        const highlight = new PIXI.Graphics();
        highlight.beginFill(0xFFFFFF, isKing ? 0.10 : 0.15);
        highlight.drawEllipse(-s * 0.3, -s * 0.4, s * 0.35, s * 0.25);
        highlight.endFill();
        highlight.zIndex = 2;
        container.addChild(highlight);

        // Face
        const faceY = -s * 0.15;
        const face = new PIXI.Graphics();
        face.lineStyle(2, 0x333333, 1);
        face.beginFill(0xFFFFFF);
        face.drawEllipse(-s * 0.28, faceY, s * 0.12, s * 0.14);
        face.drawEllipse( s * 0.28, faceY, s * 0.12, s * 0.14);
        face.endFill();
        face.beginFill(0x222222);
        face.drawCircle(-s * 0.28, faceY + 2, s * 0.06);
        face.drawCircle( s * 0.28, faceY + 2, s * 0.06);
        face.endFill();
        face.lineStyle(5, isKing ? 0x3a2510 : 0x663333, 1);
        face.moveTo(-s * 0.45, faceY - s * 0.12); face.lineTo(-s * 0.15, faceY - s * 0.06);
        face.moveTo( s * 0.45, faceY - s * 0.12); face.lineTo( s * 0.15, faceY - s * 0.06);
        face.lineStyle(3, isKing ? 0x3a2510 : 0x663333, 1);
        face.moveTo(-s * 0.2, faceY + s * 0.35);
        face.quadraticCurveTo(0, faceY + s * 0.22, s * 0.2, faceY + s * 0.35);
        face.zIndex = 3;
        container.addChild(face);

        // Crown or chef hat
        if (isKing) {
            // Crown base
            const cy = -s + 30;
            const crown = new PIXI.Graphics();
            crown.lineStyle(3, 0xb8860b, 1);
            crown.beginFill(0xffd700);
            crown.moveTo(-s * 0.5, cy + 30);
            crown.bezierCurveTo(-s * 0.55, cy + 20, -s * 0.45, cy - 20, -s * 0.35, cy - 35);
            crown.bezierCurveTo(-s * 0.3,  cy - 10, -s * 0.2,  cy + 5,  -s * 0.15, cy - 5);
            crown.bezierCurveTo(-s * 0.08, cy - 25, 0,       cy - 50, 0,       cy - 50);
            crown.bezierCurveTo(0,        cy - 50, s * 0.08, cy - 25, s * 0.15, cy - 5);
            crown.bezierCurveTo(s * 0.2,  cy + 5,  s * 0.3,  cy - 10, s * 0.35, cy - 35);
            crown.bezierCurveTo(s * 0.45, cy - 20, s * 0.55, cy + 20, s * 0.5,  cy + 30);
            crown.endFill();
            crown.beginFill(0xff3333); crown.drawCircle(0, cy - 35, 8); crown.endFill();
            crown.beginFill(0x3366ff); crown.drawCircle(-s * 0.25, cy + 5, 5); crown.endFill();
            crown.beginFill(0x3366ff); crown.drawCircle( s * 0.25, cy + 5, 5); crown.endFill();
            crown.zIndex = 4;
            container.addChild(crown);
        } else {
            const hatY = -s - 10;
            const hat = new PIXI.Graphics();
            hat.lineStyle(2, 0xe0e0e0, 1);
            hat.beginFill(0xf5f5f5);
            hat.moveTo(-s * 0.55, hatY + 40);
            hat.bezierCurveTo(-s * 0.6, hatY + 30, -s * 0.55, hatY + 20, -s * 0.5, hatY + 15);
            hat.lineTo(s * 0.5, hatY + 15);
            hat.bezierCurveTo(s * 0.55, hatY + 20, s * 0.6, hatY + 30, s * 0.55, hatY + 40);
            hat.endFill();
            hat.beginFill(0xFFFFFF);
            hat.moveTo(-s * 0.5, hatY + 20);
            hat.bezierCurveTo(-s * 0.7, hatY + 10, -s * 0.65, hatY - 20, -s * 0.4, hatY - 25);
            hat.bezierCurveTo(-s * 0.35, hatY - 45, -s * 0.15, hatY - 50, 0, hatY - 45);
            hat.bezierCurveTo(s * 0.15, hatY - 50, s * 0.35, hatY - 45, s * 0.4, hatY - 25);
            hat.bezierCurveTo(s * 0.65, hatY - 20, s * 0.7, hatY + 10, s * 0.5, hatY + 20);
            hat.endFill();
            hat.zIndex = 4;
            container.addChild(hat);
        }
        return container;
    }

    function attach(entity) {
        if (!entity || bossMap.has(entity)) return;
        const isKing = !!entity.isKing;
        const size = entity.size || 80;
        const container = new PIXI.Container();
        container.sortableChildren = false;
        const g = makePotatoGraphic(isKing, size);
        container.addChild(g);
        stage.addChild(container);
        bossMap.set(entity, { container, graphics: g });
        entity.__pixiBoss = container; // weak association
    }

    function detach(entity) {
        const entry = bossMap.get(entity);
        if (!entry) return;
        stage.removeChild(entry.container);
        entry.container.destroy({ children: true });
        bossMap.delete(entity);
        delete entity.__pixiBoss;
    }

    function updateAll() {
        if (bossMap.size === 0) return;
        bossMap.forEach((entry, entity) => {
            // Update position to screen coords
            const { x, y } = worldToScreen(entity.x, entity.y);
            entry.container.x = x;
            entry.container.y = y;
            // Optional breathing for king
            if (entity.isKing) {
                const s = 1 + Math.sin(performance.now() * 0.003) * 0.01;
                entry.container.scale.set(s);
            }
            // Visibility culling (simple): hide if far offscreen
            const canvas = document.getElementById('gameCanvas');
            const w = canvas.width, h = canvas.height;
            entry.container.visible = (x >= -400 && x <= w + 400 && y >= -400 && y <= h + 400);
        });
    }

    function clearAll() {
        Array.from(bossMap.keys()).forEach(detach);
    }

    // Expose API
    window.PIXI_BOSSES = {
        attach,
        detach,
        updateAll,
        clearAll,
    };
})();
