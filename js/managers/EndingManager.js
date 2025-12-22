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
        isPaused = true; // Global from main.js

        // 2. Play Fanfare
        if (sfx && sfx.playVictory) sfx.playVictory(); // Custom Victory Music

        // 3. Visuals - Zoom and CRT
        const canvas = document.getElementById('gameCanvas');
        canvas.classList.add('game-finished');

        // 4. Create DOM Elements
        this.createDeskOverlay();

        // 5. Start Dialogue
        setTimeout(() => this.playDialogue(), 1500); // Wait for zoom
    }

    static createDeskOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'desk-overlay';

        // Main Potato Character with Fedora (cartoony)
        const potatoDev = document.createElement('div');
        potatoDev.id = 'potato-dev';
        potatoDev.innerHTML = `
            <div class="dev-head">🥔</div>
            <div class="dev-fedora">🎩</div>
            <div class="dev-body">👕</div>
        `;

        // Coffee
        const coffee = document.createElement('div');
        coffee.id = 'dev-coffee';
        coffee.innerText = '☕';

        // Keyboard
        const keyboard = document.createElement('div');
        keyboard.id = 'dev-keyboard';
        keyboard.innerText = '⌨️'; // Simple emoji for now

        // Dialogue Box
        const dialogBox = document.createElement('div');
        dialogBox.id = 'ending-dialogue';

        overlay.appendChild(potatoDev);
        overlay.appendChild(coffee);
        overlay.appendChild(keyboard);
        overlay.appendChild(dialogBox);

        document.body.appendChild(overlay);

        // Fade in
        setTimeout(() => overlay.style.opacity = '1', 100);
    }

    static async playDialogue() {
        const lines = [
            { text: "> BOSS_DEFEATED.LOG SAVED.", sender: "System", cls: "sys-text" },
            { text: "> ARCHIVING RUN DATA...", sender: "System", cls: "sys-text" },
            { text: "Alright, time to rest these mashers.", sender: "Potato", cls: "dev-text" }
        ];

        const box = document.getElementById('ending-dialogue');

        for (let line of lines) {
            box.innerHTML = `<span class="${line.cls}"><strong>${line.sender}:</strong> </span><span id="type-target"></span>`;
            await this.typewrite(line.text, document.getElementById('type-target'));
            await new Promise(r => setTimeout(r, 1000)); // Pause between lines
        }

        // End: No subscribe button anymore
    }

    static typewrite(text, element) {
        return new Promise(resolve => {
            let i = 0;
            const interval = setInterval(() => {
                element.innerText += text.charAt(i);
                // Fake typing sound?
                // if (sfx) sfx.playHover(); 
                i++;
                if (i >= text.length) {
                    clearInterval(interval);
                    resolve();
                }
            }, 50);
        });
    }

    static showSubscribeButton() { /* removed */ }
}
