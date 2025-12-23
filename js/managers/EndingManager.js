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

        // Create animated background particles
        const particleBg = document.createElement('div');
        particleBg.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            overflow: hidden;
        `;
        overlay.appendChild(particleBg);

        // Victory potato SVG - EXACT match to Player.js but scaled up
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 200 280');
        svg.setAttribute('width', '300');
        svg.setAttribute('height', '420');
        svg.style.cssText = 'margin-bottom: 20px; filter: drop-shadow(0 15px 40px rgba(0,0,0,0.4));';
        svg.id = 'victory-potato';

        // Defs for gradients, patterns, and filters
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        
        // Felt texture pattern for fedora
        const feltPattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
        feltPattern.setAttribute('id', 'feltTexture');
        feltPattern.setAttribute('patternUnits', 'userSpaceOnUse');
        feltPattern.setAttribute('width', '4');
        feltPattern.setAttribute('height', '4');
        feltPattern.innerHTML = `
            <rect width="4" height="4" fill="#2d2d2d"/>
            <circle cx="1" cy="1" r="0.5" fill="#252525"/>
            <circle cx="3" cy="3" r="0.5" fill="#353535"/>
            <circle cx="1" cy="3" r="0.3" fill="#282828"/>
            <circle cx="3" cy="1" r="0.3" fill="#323232"/>
        `;
        defs.appendChild(feltPattern);

        // Fedora gradient with felt overlay
        const fedoraGrad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        fedoraGrad.setAttribute('id', 'fedoraGrad');
        fedoraGrad.setAttribute('x1', '0%');
        fedoraGrad.setAttribute('y1', '0%');
        fedoraGrad.setAttribute('x2', '100%');
        fedoraGrad.setAttribute('y2', '100%');
        fedoraGrad.innerHTML = `
            <stop offset="0%" stop-color="#3d3d3d"/>
            <stop offset="30%" stop-color="#2a2a2a"/>
            <stop offset="70%" stop-color="#1f1f1f"/>
            <stop offset="100%" stop-color="#151515"/>
        `;
        defs.appendChild(fedoraGrad);

        // Ribbon/band gradient (silk look)
        const ribbonGrad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        ribbonGrad.setAttribute('id', 'ribbonGrad');
        ribbonGrad.setAttribute('x1', '0%');
        ribbonGrad.setAttribute('y1', '0%');
        ribbonGrad.setAttribute('x2', '0%');
        ribbonGrad.setAttribute('y2', '100%');
        ribbonGrad.innerHTML = `
            <stop offset="0%" stop-color="#8B4513"/>
            <stop offset="20%" stop-color="#A0522D"/>
            <stop offset="50%" stop-color="#6B3510"/>
            <stop offset="80%" stop-color="#A0522D"/>
            <stop offset="100%" stop-color="#8B4513"/>
        `;
        defs.appendChild(ribbonGrad);

        svg.appendChild(defs);

        // Center the potato at (100, 150) - scaled version of player
        const cx = 100;
        const cy = 150;
        const scale = 4; // Player is ~50px, we want ~200px

        // Shadow under potato
        const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        shadow.setAttribute('cx', cx);
        shadow.setAttribute('cy', cy + 35 * scale);
        shadow.setAttribute('rx', 25 * scale);
        shadow.setAttribute('ry', 8 * scale);
        shadow.setAttribute('fill', 'rgba(0,0,0,0.25)');
        svg.appendChild(shadow);

        // Legs - exact match to Player.js
        const legs = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        legs.innerHTML = `
            <line x1="${cx - 10 * scale}" y1="${cy + 15 * scale}" x2="${cx - 10 * scale}" y2="${cy + 25 * scale}" 
                  stroke="#8b4513" stroke-width="${4 * scale}" stroke-linecap="round"/>
            <line x1="${cx + 10 * scale}" y1="${cy + 15 * scale}" x2="${cx + 10 * scale}" y2="${cy + 25 * scale}" 
                  stroke="#8b4513" stroke-width="${4 * scale}" stroke-linecap="round"/>
        `;
        svg.appendChild(legs);

        // Body - EXACT bezier curves from Player.js, scaled up
        // Original: moveTo(0, -25), bezierCurveTo(25, -25, 30, 0, 20, 20), 
        //           bezierCurveTo(10, 30, -10, 30, -20, 20), bezierCurveTo(-30, 0, -25, -25, 0, -25)
        const potato = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        potato.setAttribute('d', `
            M ${cx + 0 * scale} ${cy + -25 * scale}
            C ${cx + 25 * scale} ${cy + -25 * scale}, ${cx + 30 * scale} ${cy + 0 * scale}, ${cx + 20 * scale} ${cy + 20 * scale}
            C ${cx + 10 * scale} ${cy + 30 * scale}, ${cx + -10 * scale} ${cy + 30 * scale}, ${cx + -20 * scale} ${cy + 20 * scale}
            C ${cx + -30 * scale} ${cy + 0 * scale}, ${cx + -25 * scale} ${cy + -25 * scale}, ${cx + 0 * scale} ${cy + -25 * scale}
            Z
        `);
        potato.setAttribute('fill', '#d2b48c');
        potato.setAttribute('stroke', '#aa8866');
        potato.setAttribute('stroke-width', 2 * scale);
        svg.appendChild(potato);

        // Eyes - exact match to Player.js (white circles with black pupils)
        // Original: arc(8, -5, 5) and arc(-2, -5, 5) for whites
        //           arc(9, -5, 2) and arc(-1, -5, 2) for pupils
        const eyeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Left eye white
        const leftEyeWhite = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        leftEyeWhite.setAttribute('cx', cx + -2 * scale);
        leftEyeWhite.setAttribute('cy', cy + -5 * scale);
        leftEyeWhite.setAttribute('r', 5 * scale);
        leftEyeWhite.setAttribute('fill', 'white');
        eyeGroup.appendChild(leftEyeWhite);
        
        // Right eye white
        const rightEyeWhite = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        rightEyeWhite.setAttribute('cx', cx + 8 * scale);
        rightEyeWhite.setAttribute('cy', cy + -5 * scale);
        rightEyeWhite.setAttribute('r', 5 * scale);
        rightEyeWhite.setAttribute('fill', 'white');
        eyeGroup.appendChild(rightEyeWhite);

        // Left pupil
        const leftPupil = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        leftPupil.setAttribute('cx', cx + -1 * scale);
        leftPupil.setAttribute('cy', cy + -5 * scale);
        leftPupil.setAttribute('r', 2 * scale);
        leftPupil.setAttribute('fill', 'black');
        eyeGroup.appendChild(leftPupil);
        
        // Right pupil
        const rightPupil = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        rightPupil.setAttribute('cx', cx + 9 * scale);
        rightPupil.setAttribute('cy', cy + -5 * scale);
        rightPupil.setAttribute('r', 2 * scale);
        rightPupil.setAttribute('fill', 'black');
        eyeGroup.appendChild(rightPupil);

        // Eye shines
        const leftShine = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        leftShine.setAttribute('cx', cx + -3 * scale);
        leftShine.setAttribute('cy', cy + -7 * scale);
        leftShine.setAttribute('r', 1.5 * scale);
        leftShine.setAttribute('fill', 'white');
        eyeGroup.appendChild(leftShine);

        const rightShine = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        rightShine.setAttribute('cx', cx + 7 * scale);
        rightShine.setAttribute('cy', cy + -7 * scale);
        rightShine.setAttribute('r', 1.5 * scale);
        rightShine.setAttribute('fill', 'white');
        eyeGroup.appendChild(rightShine);

        svg.appendChild(eyeGroup);

        // Expression lines - exact match to Player.js happy expression
        // Original: moveTo(4, -10), lineTo(12, -8), moveTo(-6, -10), lineTo(2, -8)
        const expression = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        expression.innerHTML = `
            <line x1="${cx + 4 * scale}" y1="${cy + -10 * scale}" x2="${cx + 12 * scale}" y2="${cy + -8 * scale}" 
                  stroke="black" stroke-width="${2 * scale}" stroke-linecap="round"/>
            <line x1="${cx + -6 * scale}" y1="${cy + -10 * scale}" x2="${cx + 2 * scale}" y2="${cy + -8 * scale}" 
                  stroke="black" stroke-width="${2 * scale}" stroke-linecap="round"/>
        `;
        svg.appendChild(expression);

        // Happy smile (victory!)
        const smile = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        smile.setAttribute('d', `M ${cx - 8 * scale} ${cy + 8 * scale} Q ${cx} ${cy + 16 * scale} ${cx + 8 * scale} ${cy + 8 * scale}`);
        smile.setAttribute('stroke', 'black');
        smile.setAttribute('stroke-width', 2 * scale);
        smile.setAttribute('fill', 'none');
        smile.setAttribute('stroke-linecap', 'round');
        svg.appendChild(smile);

        // Fedora with realistic felt texture - positioned on top of potato
        const fedoraGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        fedoraGroup.setAttribute('transform', `translate(${cx}, ${cy - 28 * scale}) rotate(-8)`);

        // Fedora main shape - trilby/fedora style
        const fedoraScale = scale * 1.8;
        
        // Brim (wide, curved)
        const brim = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        brim.setAttribute('d', `
            M ${-28 * fedoraScale} ${8 * fedoraScale}
            C ${-30 * fedoraScale} ${10 * fedoraScale}, ${-28 * fedoraScale} ${14 * fedoraScale}, ${-20 * fedoraScale} ${15 * fedoraScale}
            C ${-8 * fedoraScale} ${17 * fedoraScale}, ${8 * fedoraScale} ${17 * fedoraScale}, ${20 * fedoraScale} ${15 * fedoraScale}
            C ${28 * fedoraScale} ${14 * fedoraScale}, ${30 * fedoraScale} ${10 * fedoraScale}, ${28 * fedoraScale} ${8 * fedoraScale}
            C ${26 * fedoraScale} ${4 * fedoraScale}, ${18 * fedoraScale} ${2 * fedoraScale}, ${0} ${2 * fedoraScale}
            C ${-18 * fedoraScale} ${2 * fedoraScale}, ${-26 * fedoraScale} ${4 * fedoraScale}, ${-28 * fedoraScale} ${8 * fedoraScale}
            Z
        `);
        brim.setAttribute('fill', 'url(#fedoraGrad)');
        brim.setAttribute('stroke', '#0a0a0a');
        brim.setAttribute('stroke-width', '1');
        fedoraGroup.appendChild(brim);

        // Brim texture overlay
        const brimTexture = brim.cloneNode();
        brimTexture.setAttribute('fill', 'url(#feltTexture)');
        brimTexture.setAttribute('opacity', '0.4');
        brimTexture.removeAttribute('stroke');
        fedoraGroup.appendChild(brimTexture);

        // Crown (top dome part)
        const crown = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        crown.setAttribute('d', `
            M ${-16 * fedoraScale} ${4 * fedoraScale}
            C ${-18 * fedoraScale} ${2 * fedoraScale}, ${-20 * fedoraScale} ${-8 * fedoraScale}, ${-16 * fedoraScale} ${-14 * fedoraScale}
            C ${-12 * fedoraScale} ${-20 * fedoraScale}, ${-6 * fedoraScale} ${-22 * fedoraScale}, ${0} ${-22 * fedoraScale}
            C ${6 * fedoraScale} ${-22 * fedoraScale}, ${12 * fedoraScale} ${-20 * fedoraScale}, ${16 * fedoraScale} ${-14 * fedoraScale}
            C ${20 * fedoraScale} ${-8 * fedoraScale}, ${18 * fedoraScale} ${2 * fedoraScale}, ${16 * fedoraScale} ${4 * fedoraScale}
            C ${10 * fedoraScale} ${3 * fedoraScale}, ${-10 * fedoraScale} ${3 * fedoraScale}, ${-16 * fedoraScale} ${4 * fedoraScale}
            Z
        `);
        crown.setAttribute('fill', 'url(#fedoraGrad)');
        crown.setAttribute('stroke', '#0a0a0a');
        crown.setAttribute('stroke-width', '1');
        fedoraGroup.appendChild(crown);

        // Crown texture overlay
        const crownTexture = crown.cloneNode();
        crownTexture.setAttribute('fill', 'url(#feltTexture)');
        crownTexture.setAttribute('opacity', '0.4');
        crownTexture.removeAttribute('stroke');
        fedoraGroup.appendChild(crownTexture);

        // Center crease/pinch on crown
        const crease = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        crease.setAttribute('d', `
            M ${-10 * fedoraScale} ${-16 * fedoraScale}
            Q ${0} ${-20 * fedoraScale}, ${10 * fedoraScale} ${-16 * fedoraScale}
        `);
        crease.setAttribute('stroke', '#0a0a0a');
        crease.setAttribute('stroke-width', '2');
        crease.setAttribute('fill', 'none');
        fedoraGroup.appendChild(crease);

        // Side pinches
        const leftPinch = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        leftPinch.setAttribute('d', `M ${-14 * fedoraScale} ${-10 * fedoraScale} Q ${-12 * fedoraScale} ${-14 * fedoraScale} ${-10 * fedoraScale} ${-16 * fedoraScale}`);
        leftPinch.setAttribute('stroke', '#0a0a0a');
        leftPinch.setAttribute('stroke-width', '1.5');
        leftPinch.setAttribute('fill', 'none');
        fedoraGroup.appendChild(leftPinch);

        const rightPinch = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        rightPinch.setAttribute('d', `M ${14 * fedoraScale} ${-10 * fedoraScale} Q ${12 * fedoraScale} ${-14 * fedoraScale} ${10 * fedoraScale} ${-16 * fedoraScale}`);
        rightPinch.setAttribute('stroke', '#0a0a0a');
        rightPinch.setAttribute('stroke-width', '1.5');
        rightPinch.setAttribute('fill', 'none');
        fedoraGroup.appendChild(rightPinch);

        // Hat band (silk ribbon)
        const band = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        band.setAttribute('d', `
            M ${-16 * fedoraScale} ${2 * fedoraScale}
            C ${-16 * fedoraScale} ${-2 * fedoraScale}, ${-10 * fedoraScale} ${-4 * fedoraScale}, ${0} ${-4 * fedoraScale}
            C ${10 * fedoraScale} ${-4 * fedoraScale}, ${16 * fedoraScale} ${-2 * fedoraScale}, ${16 * fedoraScale} ${2 * fedoraScale}
            C ${16 * fedoraScale} ${5 * fedoraScale}, ${10 * fedoraScale} ${6 * fedoraScale}, ${0} ${6 * fedoraScale}
            C ${-10 * fedoraScale} ${6 * fedoraScale}, ${-16 * fedoraScale} ${5 * fedoraScale}, ${-16 * fedoraScale} ${2 * fedoraScale}
            Z
        `);
        band.setAttribute('fill', 'url(#ribbonGrad)');
        band.setAttribute('stroke', '#5a3010');
        band.setAttribute('stroke-width', '0.5');
        fedoraGroup.appendChild(band);

        // Band highlight
        const bandHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        bandHighlight.setAttribute('d', `
            M ${-12 * fedoraScale} ${0}
            C ${-8 * fedoraScale} ${-1 * fedoraScale}, ${8 * fedoraScale} ${-1 * fedoraScale}, ${12 * fedoraScale} ${0}
        `);
        bandHighlight.setAttribute('stroke', 'rgba(255,255,255,0.2)');
        bandHighlight.setAttribute('stroke-width', '1.5');
        bandHighlight.setAttribute('fill', 'none');
        fedoraGroup.appendChild(bandHighlight);

        // Hat highlight (top shine)
        const hatHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        hatHighlight.setAttribute('cx', -4 * fedoraScale);
        hatHighlight.setAttribute('cy', -12 * fedoraScale);
        hatHighlight.setAttribute('rx', 6 * fedoraScale);
        hatHighlight.setAttribute('ry', 3 * fedoraScale);
        hatHighlight.setAttribute('fill', 'rgba(255,255,255,0.08)');
        hatHighlight.setAttribute('transform', 'rotate(-15)');
        fedoraGroup.appendChild(hatHighlight);

        svg.appendChild(fedoraGroup);

        overlay.appendChild(svg);

        // Text - NO EMOJIS
        const titleDiv = document.createElement('div');
        titleDiv.style.cssText = `
            font-size: 68px;
            font-weight: 900;
            color: #fff;
            text-shadow: 
                4px 4px 0px #8b4513,
                6px 6px 0px rgba(0,0,0,0.4),
                0 0 30px rgba(255,215,0,0.6);
            margin-bottom: 15px;
            animation: pulse-text 1s ease-in-out, glow-pulse 2s ease-in-out infinite;
            letter-spacing: 4px;
        `;
        titleDiv.innerText = 'VICTORY!';
        overlay.appendChild(titleDiv);

        const subDiv = document.createElement('div');
        subDiv.style.cssText = `
            font-size: 32px;
            color: #fff8e0;
            text-shadow: 2px 2px 0px rgba(0,0,0,0.5);
            margin-bottom: 15px;
            font-weight: 600;
        `;
        subDiv.innerText = 'You\'ve Mastered the Mashacre!';
        overlay.appendChild(subDiv);

        const scoreDiv = document.createElement('div');
        scoreDiv.style.cssText = `
            font-size: 26px;
            color: #ffd700;
            text-shadow: 2px 2px 0px rgba(0,0,0,0.5);
            font-weight: bold;
            padding: 10px 30px;
            background: rgba(0,0,0,0.3);
            border-radius: 10px;
            border: 2px solid rgba(255,215,0,0.5);
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
            @keyframes glow-pulse {
                0%, 100% { text-shadow: 4px 4px 0px #8b4513, 6px 6px 0px rgba(0,0,0,0.4), 0 0 30px rgba(255,215,0,0.6); }
                50% { text-shadow: 4px 4px 0px #8b4513, 6px 6px 0px rgba(0,0,0,0.4), 0 0 50px rgba(255,215,0,0.9); }
            }
            @keyframes confetti-fall {
                to {
                    transform: translateY(100vh) rotate(720deg);
                    opacity: 0;
                }
            }
            @keyframes float-potato {
                0%, 100% { transform: translateY(0) rotate(-2deg); }
                50% { transform: translateY(-15px) rotate(2deg); }
            }
            #victory-potato {
                animation: float-potato 3s ease-in-out infinite;
            }
        `;
        document.head.appendChild(style);

        // Fade in
        setTimeout(() => overlay.style.opacity = '1', 100);

        // Enhanced confetti effect
        this.createConfetti();
    }

    static createConfetti() {
        const colors = ['#ffd700', '#d2b48c', '#c9a961', '#8b6f47', '#ff6b6b', '#4ecdc4', '#fff'];
        const shapes = ['circle', 'square', 'star'];
        
        for (let i = 0; i < 80; i++) {
            const confetti = document.createElement('div');
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            const size = 8 + Math.random() * 12;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const startX = Math.random() * 100;
            const drift = (Math.random() - 0.5) * 200;
            
            let shapeStyle = '';
            if (shape === 'circle') {
                shapeStyle = 'border-radius: 50%;';
            } else if (shape === 'star') {
                shapeStyle = `
                    clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
                `;
            }
            
            confetti.style.cssText = `
                position: fixed;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                ${shapeStyle}
                left: ${startX}%;
                top: -30px;
                z-index: 25;
                animation: confetti-fall-${i % 3} ${4 + Math.random() * 3}s linear forwards;
                animation-delay: ${Math.random() * 2}s;
                opacity: 0.9;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            `;
            document.body.appendChild(confetti);
            
            // Clean up after animation
            setTimeout(() => confetti.remove(), 8000);
        }
        
        // Add varied fall animations
        const confettiStyle = document.createElement('style');
        confettiStyle.innerText = `
            @keyframes confetti-fall-0 {
                0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
                100% { transform: translateY(100vh) translateX(100px) rotate(720deg); opacity: 0; }
            }
            @keyframes confetti-fall-1 {
                0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
                100% { transform: translateY(100vh) translateX(-80px) rotate(-540deg); opacity: 0; }
            }
            @keyframes confetti-fall-2 {
                0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
                50% { transform: translateY(50vh) translateX(50px) rotate(360deg); }
                100% { transform: translateY(100vh) translateX(-30px) rotate(900deg); opacity: 0; }
            }
        `;
        document.head.appendChild(confettiStyle);
    }

    static createDeskOverlay() { /* removed */ }
    static playDialogue() { /* removed */ }
    static typewrite() { /* removed */ }
    static showSubscribeButton() { /* removed */ }
}
