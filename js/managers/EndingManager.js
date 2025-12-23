class CrownPickup {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 40;
        this.bobOffset = 0;
        this.active = true;
        this.type = 'pickup'; // Duck typing for main.js loops
    }

    update() {
        if (!this.active) return false;

        this.bobOffset += 0.1;

        // Collision with Player
        // Note: player.size might be undefined if player.radius is used. Check Player.js (radius=20)
        // Ensure lenient collision
        const dist = Math.hypot(player.x - this.x, player.y - this.y);

        // Debug
        // console.log("Crown Dist:", dist, "Req:", this.size + player.radius + 50);

        if (dist < this.size + player.radius + 50) { // Increased pickup range
            this.active = false;
            EndingManager.startSequence();
            return false;
        }
        return true;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y + Math.sin(this.bobOffset) * 10);

        // Glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'gold';

        // Crown Art
        ctx.fillStyle = 'gold';
        ctx.beginPath();
        ctx.moveTo(-20, 10);
        ctx.lineTo(-10, -10);
        ctx.lineTo(0, 10);
        ctx.lineTo(10, -10);
        ctx.lineTo(20, 10);
        ctx.lineTo(20, 20);
        ctx.lineTo(-20, 20);
        ctx.fill();

        // Jewels
        ctx.fillStyle = 'red';
        ctx.beginPath(); ctx.arc(0, 15, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'blue';
        ctx.beginPath(); ctx.arc(-10, 15, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'lime';
        ctx.beginPath(); ctx.arc(10, 15, 3, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
    }
}

class EndingManager {
    static startSequence() {
        console.log("EndingManager: Starting Sequence");

        // 1. Freeze Game
        isPaused = true;

        // 2. Play Fanfare
        if (sfx && sfx.playVictory) sfx.playVictory();

        // 3. Zoom out canvas
        const canvas = document.getElementById('gameCanvas');
        canvas.classList.add('game-finished');

        // 4. Simple congrats message
        setTimeout(() => this.showCongrats(), 1500);
    }

    static showCongrats() {
        const overlay = document.createElement('div');
        overlay.id = 'ending-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 20;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 1s;
        `;

        const congratsBox = document.createElement('div');
        congratsBox.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 50px 80px;
            border-radius: 20px;
            text-align: center;
            font-family: Arial, sans-serif;
            box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
        `;
        congratsBox.innerHTML = `
            <h1 style="margin: 0 0 20px 0; font-size: 72px; text-shadow: 2px 2px 10px rgba(0,0,0,0.5);">🎉 CONGRATULATIONS! 🎉</h1>
            <p style="margin: 0; font-size: 32px; opacity: 0.9;">You've conquered the Mashacre!</p>
        `;

        overlay.appendChild(congratsBox);
        document.body.appendChild(overlay);

        setTimeout(() => overlay.style.opacity = '1', 100);
    }

    static createDeskOverlay() { /* removed */ }
    static playDialogue() { /* removed */ }
    static typewrite() { /* removed */ }
    static showSubscribeButton() { /* removed */ }
}
