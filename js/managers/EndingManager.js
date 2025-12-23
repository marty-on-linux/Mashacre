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

        // 4. Custom potato ending
        setTimeout(() => this.showPotatoEnding(), 1500);
    }

    static showPotatoEnding() {
        const overlay = document.createElement('div');
        overlay.id = 'ending-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #f5a623 0%, #d68910 50%, #8b4513 100%);
            z-index: 20;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 1s;
            font-family: Arial, sans-serif;
            overflow: hidden;
        `;

        // Victory potato SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 400 400');
        svg.setAttribute('width', '300');
        svg.setAttribute('height', '300');
        svg.style.cssText = 'margin-bottom: 30px; filter: drop-shadow(0 10px 30px rgba(0,0,0,0.3));';

        // Main potato body
        const potato = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        potato.setAttribute('cx', '200');
        potato.setAttribute('cy', '220');
        potato.setAttribute('rx', '120');
        potato.setAttribute('ry', '140');
        potato.setAttribute('fill', '#d2b48c');
        potato.setAttribute('stroke', '#8b6f47');
        potato.setAttribute('stroke-width', '3');
        svg.appendChild(potato);

        // Potato spots
        const spots = [
            {x: 140, y: 180, r: 12},
            {x: 260, y: 200, r: 10},
            {x: 200, y: 310, r: 8},
            {x: 270, y: 260, r: 9}
        ];
        spots.forEach(spot => {
            const s = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            s.setAttribute('cx', spot.x);
            s.setAttribute('cy', spot.y);
            s.setAttribute('r', spot.r);
            s.setAttribute('fill', '#a0826d');
            svg.appendChild(s);
        });

        // Eyes - happy
        [150, 250].forEach(x => {
            const eye = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            eye.setAttribute('cx', x);
            eye.setAttribute('cy', '180');
            eye.setAttribute('r', '18');
            eye.setAttribute('fill', 'white');
            svg.appendChild(eye);

            const pupil = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            pupil.setAttribute('cx', x);
            pupil.setAttribute('cy', '185');
            pupil.setAttribute('r', '10');
            pupil.setAttribute('fill', '#222');
            svg.appendChild(pupil);

            const shine = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            shine.setAttribute('cx', x + 5);
            shine.setAttribute('cy', '180');
            shine.setAttribute('r', '5');
            shine.setAttribute('fill', 'white');
            svg.appendChild(shine);
        });

        // Happy smile
        const smile = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        smile.setAttribute('d', 'M 170 240 Q 200 270 230 240');
        smile.setAttribute('stroke', '#222');
        smile.setAttribute('stroke-width', '4');
        smile.setAttribute('fill', 'none');
        smile.setAttribute('stroke-linecap', 'round');
        svg.appendChild(smile);

        // Crown on top
        const crown = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const crownBase = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        crownBase.setAttribute('d', 'M 120 80 L 140 40 L 160 60 L 200 20 L 240 60 L 260 40 L 280 80 Z');
        crownBase.setAttribute('fill', '#ffd700');
        crownBase.setAttribute('stroke', '#daa520');
        crownBase.setAttribute('stroke-width', '2');
        crown.appendChild(crownBase);
        // Crown jewels
        [160, 200, 240].forEach(x => {
            const jewel = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            jewel.setAttribute('cx', x);
            jewel.setAttribute('cy', x === 200 ? 25 : 50);
            jewel.setAttribute('r', '8');
            jewel.setAttribute('fill', x === 200 ? '#ff3333' : '#3366ff');
            crown.appendChild(jewel);
        });
        svg.appendChild(crown);

        overlay.appendChild(svg);

        // Text
        const titleDiv = document.createElement('div');
        titleDiv.style.cssText = `
            font-size: 72px;
            font-weight: bold;
            color: white;
            text-shadow: 4px 4px 0px rgba(0,0,0,0.5), -2px -2px 0px rgba(255,255,255,0.3);
            margin-bottom: 20px;
            animation: pulse-text 1s ease-in-out;
        `;
        titleDiv.innerText = '🎉 VICTORY! 🎉';
        overlay.appendChild(titleDiv);

        const subDiv = document.createElement('div');
        subDiv.style.cssText = `
            font-size: 36px;
            color: white;
            text-shadow: 2px 2px 0px rgba(0,0,0,0.4);
            margin-bottom: 10px;
        `;
        subDiv.innerText = 'You\'ve Mastered the Mashacre!';
        overlay.appendChild(subDiv);

        const scoreDiv = document.createElement('div');
        scoreDiv.style.cssText = `
            font-size: 24px;
            color: rgba(255,255,255,0.9);
            text-shadow: 2px 2px 0px rgba(0,0,0,0.3);
        `;
        scoreDiv.innerText = `Final Score: ${score}`;
        overlay.appendChild(scoreDiv);

        document.body.appendChild(overlay);

        // Add animation styles
        const style = document.createElement('style');
        style.innerText = `
            @keyframes pulse-text {
                0% { transform: scale(0.8); opacity: 0; }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); opacity: 1; }
            }
            @keyframes confetti-fall {
                to {
                    transform: translateY(100vh) rotate(360deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);

        // Fade in
        setTimeout(() => overlay.style.opacity = '1', 100);

        // Confetti effect
        this.createConfetti();
    }

    static createConfetti() {
        const colors = ['#ffd700', '#d2b48c', '#c9a961', '#8b6f47', '#ff6b6b', '#4ecdc4'];
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 12px;
                height: 12px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: -20px;
                z-index: 25;
                animation: confetti-fall ${3 + Math.random() * 2}s linear forwards;
                animation-delay: ${Math.random() * 0.5}s;
            `;
            document.body.appendChild(confetti);
        }
    }

    static createDeskOverlay() { /* removed */ }
    static playDialogue() { /* removed */ }
    static typewrite() { /* removed */ }
    static showSubscribeButton() { /* removed */ }
}
