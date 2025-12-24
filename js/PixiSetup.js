// PixiSetup.js
// Lightweight PixiJS bootstrap that renders an overlay without interfering with input.
// If PIXI is not available, this file does nothing.

(function() {
    if (typeof PIXI === 'undefined') {
        console.warn('[PixiSetup] PIXI not found; skipping Pixi initialization.');
        return;
    }

    // Create app sized to the game canvas or window
    const container = document.getElementById('pixi-container');
    const gameCanvas = document.getElementById('gameCanvas');

    // Determine size based on gameCanvas computed size
    const getSize = () => {
        const rect = gameCanvas.getBoundingClientRect();
        // Fallback if not laid out yet
        const width = Math.max(1, Math.floor(rect.width || window.innerWidth));
        const height = Math.max(1, Math.floor(rect.height || window.innerHeight));
        return { width, height };
    };

    const { width, height } = getSize();
    const app = new PIXI.Application({
        width,
        height,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        backgroundAlpha: 0, // Transparent to overlay existing canvas
    });

    // Mount Pixi canvas
    container.appendChild(app.view);

    // Ensure the Pixi canvas matches container bounds
    const resize = () => {
        const size = getSize();
        app.renderer.resize(size.width, size.height);
        app.view.style.width = size.width + 'px';
        app.view.style.height = size.height + 'px';
    };
    window.addEventListener('resize', resize);
    // Some UIs change canvas size dynamically; observe
    const ro = new ResizeObserver(resize);
    if (gameCanvas) ro.observe(gameCanvas);

    // No default demo graphic; stage is ready for game overlays

    // Public handle to toggle visibility if needed
    window.PIXI_OVERLAY = {
        show: () => { container.style.display = 'block'; },
        hide: () => { container.style.display = 'none'; },
        app,
        resize,
    };

    // Initial visibility on
    container.style.display = 'block';
})();
