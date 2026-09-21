// PROTOTYPE: an alchemical material layer over the unchanged 2248 mechanics.
// Three playable family openings, switchable via ?family-board=, share this existing route.
(() => {
    const params = new URLSearchParams(window.location.search);
    const materialStudy = params.get('materials') === '1';
    const familyStudy = materialStudy && params.get('families') === '1';
    const boardShowcase = params.get('showcase') === '1';
    const familyBoardKey = params.get('family-board');
    const familyBoardStudy = ['control', 'interference', 'opportunity'].includes(familyBoardKey);
    const visualStudy = materialStudy || boardShowcase;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = { col: -1, row: -1, active: false };
    const images = {};
    const progressionStudyTiles = new Map([
        ['0:1', 2], ['0:2', 4], ['0:3', 8],
        ['2:1', 16], ['2:2', 32], ['2:3', 64],
        ['4:1', 128], ['4:2', 256], ['4:3', 512],
        ['6:1', 1024], ['6:3', 2048],
    ]);
    const familyStudyTiles = new Map();
    [2, 16, 128, 1024].forEach((value, index) => {
        const row = index * 2;
        for (let col = 0; col < 5; col++) familyStudyTiles.set(`${row}:${col}`, value);
    });
    const boardShowcaseTiles = new Map([
        ['0:0', 2], ['0:1', 24], ['0:2', 320], ['0:3', 3584], ['0:4', 9],
        ['1:0', 40], ['1:1', 448], ['1:2', 4608], ['1:3', 4], ['1:4', 6],
        ['2:0', 896], ['2:1', 18], ['2:2', 1024], ['2:3', 384], ['2:4', 10],
        ['3:0', 576], ['3:1', 128], ['3:2', 48], ['3:3', 2560], ['3:4', 14],
        ['4:0', 32], ['4:1', 1536], ['4:2', 640], ['4:3', 56], ['4:4', 72],
        ['5:0', 3072], ['5:1', 80], ['5:2', 7168], ['5:3', 144], ['5:4', 256],
        ['6:0', 5120], ['6:1', 112], ['6:2', 1152], ['6:3', 2048], ['6:4', 3],
        ['7:0', 7], ['7:1', 9216], ['7:2', 16], ['7:3', 192], ['7:4', 5],
    ]);

    const familyBoards = {
        control: {
            name: 'Single family',
            shortName: 'Control',
            question: 'How does the familiar build-and-harvest opening feel when every tile can contribute to one family?',
            pressure: 'One broad Verdigris field. The main choice is where to place the survivor.',
            values: [
                [2, 2, 4, 4, 8],
                [2, 4, 4, 8, 8],
                [4, 4, 8, 8, 16],
                [2, 2, 4, 8, 16],
                [2, 4, 4, 8, 8],
                [4, 4, 8, 8, 16],
                [2, 2, 4, 4, 8],
                [2, 4, 8, 8, 16],
            ],
        },
        interference: {
            name: 'Cross-contamination',
            shortName: 'Pressure',
            question: 'Does a second family make position and survivor placement matter before either family is harvested?',
            pressure: 'Verdigris and Cinnabar each have legal chains, but the central Cinnabar seam interrupts the broad Verdigris route.',
            values: [
                [2, 2, 10, 10, 20],
                [2, 10, 10, 4, 20],
                [4, 4, 20, 8, 40],
                [2, 2, 10, 8, 40],
                [5, 4, 10, 20, 20],
                [10, 4, 8, 20, 40],
                [5, 5, 4, 4, 20],
                [5, 10, 8, 8, 40],
            ],
        },
        opportunity: {
            name: 'Competing reactions',
            shortName: 'Opportunity',
            question: 'Will a compact, higher-value family pull attention away from the longest available chain?',
            pressure: 'A long Verdigris build competes with smaller Cinnabar and Lapis reactions whose placement can improve after gravity.',
            values: [
                [2, 2, 4, 10, 10],
                [2, 4, 4, 10, 20],
                [4, 4, 8, 20, 20],
                [2, 2, 8, 18, 18],
                [2, 4, 10, 18, 36],
                [4, 10, 20, 36, 36],
                [5, 5, 20, 9, 9],
                [5, 10, 20, 18, 36],
            ],
        },
    };
    const studyTiles = boardShowcase
        ? boardShowcaseTiles
        : familyStudy
            ? familyStudyTiles
            : progressionStudyTiles;

    // Renderer-only families. Their hue is independent of material stage so a
    // family stays recognizable as granules become compound, crystal, and essence.
    const familyPalettes = [
        { root: 2, name: 'Verdigris', hue: 174, saturation: 1.7 },
        { root: 3, name: 'Amber', hue: 38, saturation: 1.9 },
        { root: 5, name: 'Cinnabar', hue: 8, saturation: 1.85 },
        { root: 7, name: 'Amethyst', hue: 286, saturation: 1.75 },
        { root: 9, name: 'Lapis', hue: 220, saturation: 1.9 },
    ];
    const neutralFamily = { root: null, name: 'Uncatalogued', hue: 48, saturation: 0.35 };

    const imageSources = {
        elements: 'assets/keeper-material-elements-v5.png',
        compound: 'assets/keeper-material-compound-v4.png',
        crystal: 'assets/keeper-material-crystal-v6.png',
        essence: 'assets/keeper-material-essence-v5.png',
        transmutation: 'assets/keeper-material-4096-v3.png',
        perfected: 'assets/keeper-material-8192-v3.png',
    };

    const loadImages = () => Promise.all(Object.entries(imageSources).map(([key, src]) => new Promise((resolve) => {
        const image = new Image();
        image.onload = () => {
            images[key] = image;
            resolve();
        };
        image.src = src;
    })));

    const hash = (x, y) => {
        const value = Math.sin((x + 1) * 91.17 + (y + 1) * 37.91) * 43758.5453;
        return value - Math.floor(value);
    };

    const materialImage = (stage) => [
        images.elements,
        images.compound,
        images.crystal,
        images.essence,
        images.transmutation,
        images.perfected,
    ][stage];

    const familyRoot = (value) => {
        let root = Math.abs(Math.trunc(value));
        while (root > 1 && root % 2 === 0) root /= 2;
        return root === 1 ? 2 : root;
    };

    // Every family shares one visual progression. Material changes are based
    // on doublings from that family's root, never on its absolute value.
    const progressionIndex = (value) => {
        let quotient = Math.abs(Math.trunc(value)) / familyRoot(value);
        let index = 0;
        while (quotient > 1 && quotient % 2 === 0) {
            quotient /= 2;
            index++;
        }
        return index;
    };

    const materialStage = (value) => {
        const index = progressionIndex(value);
        if (index >= 12) return 5;
        if (index >= 11) return 4;
        if (index >= 9) return 3;
        if (index >= 6) return 2;
        if (index >= 3) return 1;
        return 0;
    };

    const familyPalette = (tile) => {
        const root = familyStudy && Number.isInteger(tile.keeperFamily)
            ? tile.keeperFamily
            : familyRoot(tile.value);
        return familyPalettes.find((palette) => palette.root === root) || neutralFamily;
    };

    const materialFilter = (stage, palette) => {
        if (stage >= 4) return 'none';
        const saturationByStage = [0.72, 1, 1.08, 1.12][stage];
        const brightnessByStage = [0.92, 0.88, 1.04, 0.94][stage];
        return `grayscale(1) sepia(1) saturate(${palette.saturation * saturationByStage}) hue-rotate(${palette.hue - 38}deg) brightness(${brightnessByStage})`;
    };

    const cellCenter = (game, tile) => ({
        x: game.tilePadding + tile.x * (game.tileSize + game.tilePadding) + game.tileSize / 2,
        y: game.tilePadding + tile.y * (game.tileSize + game.tilePadding) + game.tileSize / 2,
    });

    const pieceCenter = (game, tile, stage) => {
        const center = cellCenter(game, tile);
        const liftByStage = [0.15, 0.15, 0.16, 0.17, 0.15, 0.15];
        return { x: center.x, y: center.y - game.tileSize * liftByStage[stage] };
    };

    const showInStudy = (tile) => !visualStudy || studyTiles.has(`${tile.y}:${tile.x}`);

    const drawSpark = (ctx, x, y, radius, alpha, hue) => {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = `hsl(${hue} 48% 90%)`;
        ctx.shadowColor = `hsl(${hue} 64% 78%)`;
        ctx.shadowBlur = 3;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x - radius, y);
        ctx.lineTo(x + radius, y);
        ctx.moveTo(x, y - radius);
        ctx.lineTo(x, y + radius);
        ctx.stroke();
        ctx.restore();
    };

    const drawMaterialMotion = (game, stage, palette, center, size, seed, time) => {
        if (reducedMotion.matches) return;
        const ctx = game.ctx;

        if (stage === 0) {
            // A raw reagent barely stirs: one small wisp and, occasionally, two flecks.
            const breath = time / 2400 + seed * 5;
            ctx.save();
            ctx.globalAlpha = 0.2 + (Math.sin(breath) + 1) * 0.05;
            ctx.strokeStyle = `hsl(${palette.hue} 30% 82%)`;
            ctx.shadowColor = `hsla(${palette.hue}, 45%, 75%, 0.35)`;
            ctx.shadowBlur = 2;
            ctx.lineWidth = 1.15;
            ctx.beginPath();
            ctx.moveTo(center.x + size * 0.02, center.y - size * 0.12);
            ctx.bezierCurveTo(
                center.x + Math.sin(breath) * size * 0.035,
                center.y - size * 0.19,
                center.x - Math.sin(breath * 0.7) * size * 0.045,
                center.y - size * 0.24,
                center.x + Math.sin(breath * 0.55) * size * 0.025,
                center.y - size * 0.3,
            );
            ctx.stroke();
            ctx.restore();

            for (let fleck = 0; fleck < 2; fleck++) {
                const fleckSeed = hash(seed * 19 + fleck, seed * 31 - fleck);
                const cycle = 4.6 + fleckSeed * 1.8;
                const phase = (time / 1000 + fleckSeed * cycle) % cycle;
                if (phase > 1.25) continue;
                const alpha = Math.sin((phase / 1.25) * Math.PI) * 0.66;
                drawSpark(
                    ctx,
                    center.x + (fleckSeed - 0.5) * size * 0.42,
                    center.y - size * (0.02 + fleck * 0.09),
                    1.8 + fleckSeed * 1.3,
                    alpha * 1.08,
                    palette.hue,
                );
            }
            return;
        }

        if (stage === 1) {
            // A narrow highlight catches the polished edge only once per slow cycle.
            const cycle = 4;
            const phase = (time / 1000 + seed * cycle) % cycle;
            if (phase > 1.15) return;
            const progress = phase / 1.15;
            const x = center.x + size * (-0.25 + progress * 0.5);
            const y = center.y - size * (0.11 + Math.sin(progress * Math.PI) * 0.07);
            ctx.save();
            ctx.globalAlpha = Math.sin(progress * Math.PI) * 0.58;
            ctx.strokeStyle = `hsl(${palette.hue} 42% 92%)`;
            ctx.shadowColor = `hsl(${palette.hue} 58% 82%)`;
            ctx.shadowBlur = 4;
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x - size * 0.085, y + size * 0.022);
            ctx.lineTo(x + size * 0.085, y - size * 0.022);
            ctx.stroke();
            ctx.restore();
            return;
        }

        if (stage === 2) {
            // The crystal gets one distant magical tell, not a constant aura.
            const cycle = 5.2;
            const phase = (time / 1000 + seed * cycle) % cycle;
            if (phase > 1.4) return;
            const progress = phase / 1.4;
            drawSpark(
                ctx,
                center.x + size * 0.17,
                center.y - size * (0.22 + progress * 0.035),
                2.1 + Math.sin(progress * Math.PI) * 1.7,
                Math.sin(progress * Math.PI) * 0.62,
                palette.hue,
            );
            return;
        }

        if (stage === 3) {
            // A short meniscus line gives the essence a slow liquid movement.
            const wave = time / 1800 + seed * Math.PI * 2;
            ctx.save();
            ctx.globalAlpha = 0.48;
            ctx.strokeStyle = `hsl(${palette.hue} 52% 88%)`;
            ctx.shadowColor = `hsla(${palette.hue}, 64%, 76%, 0.5)`;
            ctx.shadowBlur = 2;
            ctx.lineWidth = 1.1;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(center.x - size * 0.14, center.y + size * 0.09 + Math.sin(wave) * 1.2);
            ctx.quadraticCurveTo(
                center.x,
                center.y + size * 0.09 + Math.sin(wave + Math.PI / 2) * 2.1,
                center.x + size * 0.14,
                center.y + size * 0.09 - Math.sin(wave) * 1.2,
            );
            ctx.stroke();
            ctx.restore();
        }
    };

    const drawDeposit = (game, tile, time) => {
        const ctx = game.ctx;
        const stage = materialStage(tile.value);
        const image = materialImage(stage);
        if (!image) return;
        const palette = familyPalette(tile);

        const center = pieceCenter(game, tile, stage);
        const seed = hash(tile.x, tile.y);
        const shape = hash(tile.y + 11, tile.x + 7);
        const hovered = pointer.active && pointer.col === tile.x && pointer.row === tile.y;
        const selected = tile.selected;
        const baseScale = [0.88, 0.92, 0.96, 1.04, 0.9, 0.88][stage];
        const interactionScale = selected ? 0.95 : hovered ? 1.035 : 1;
        const size = game.tileSize * baseScale * interactionScale * (0.96 + seed * 0.07);
        const angle = (seed - 0.5) * (stage < 2 ? 0.12 : 0.045);
        const alpha = [0.8, 0.85, 0.9, 0.92, 0.94, 0.96][stage] + (selected ? 0.04 : hovered ? 0.02 : 0);

        ctx.save();
        ctx.translate(center.x, center.y);
        ctx.rotate(angle);
        ctx.scale(0.98 + seed * 0.04, 0.98 + shape * 0.04);
        ctx.globalAlpha = Math.min(0.98, alpha);
        ctx.globalCompositeOperation = 'source-over';
        ctx.filter = materialFilter(stage, palette);
        if (selected || hovered) {
            ctx.shadowColor = selected
                ? `hsla(${palette.hue}, 62%, 82%, 0.62)`
                : `hsla(${palette.hue}, 52%, 62%, 0.34)`;
            ctx.shadowBlur = selected ? 14 : 6;
        }
        ctx.drawImage(image, -size / 2, -size / 2, size, size);
        ctx.restore();
        drawMaterialMotion(game, stage, palette, center, size, seed, time);
    };

    const drawNumber = (game, tile) => {
        if (tile.blocker === BLOCKER_TYPES.STONE) return;
        const ctx = game.ctx;
        const center = cellCenter(game, tile);
        let displayValue = tile.value.toString();
        if (tile.value >= 1000000 && !visualStudy) {
            displayValue = `${Number((tile.value / 1000000).toFixed(1))}m`;
        } else if (tile.value >= 1000 && tile.value < 1000000) {
            displayValue = `${Number((tile.value / 1000).toFixed(1))}k`;
        }

        let fontSize = game.tileSize * 0.29;
        const maxWidth = game.tileSize * 0.76;
        const fontFamily = '"Iowan Old Style", Georgia, serif';

        ctx.save();
        ctx.font = `700 ${fontSize}px ${fontFamily}`;
        const measuredWidth = ctx.measureText(displayValue).width;
        let horizontalScale = Math.min(1, maxWidth / measuredWidth);
        if (horizontalScale < 0.8) {
            fontSize *= horizontalScale / 0.8;
            ctx.font = `700 ${fontSize}px ${fontFamily}`;
            horizontalScale = 0.8;
        }
        ctx.globalAlpha = 0.96;
        ctx.fillStyle = '#f0e3c2';
        ctx.strokeStyle = 'rgba(3, 7, 8, 0.94)';
        ctx.lineWidth = 1.8;
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.42)';
        ctx.shadowBlur = 1.5;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const baseline = center.y + game.tileSize * 0.3;
        ctx.translate(center.x, baseline);
        ctx.scale(horizontalScale, 1);
        ctx.strokeText(displayValue, 0, 0);
        ctx.fillText(displayValue, 0, 0);
        ctx.restore();
    };

    const drawBlockerOverlay = (game, tile) => {
        if (!tile.blocker) return;
        const ctx = game.ctx;
        const center = cellCenter(game, tile);
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `700 ${Math.round(game.tileSize * 0.16)}px ui-sans-serif, system-ui, sans-serif`;
        ctx.fillStyle = '#f1dfb8';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 5;
        if (tile.blocker === BLOCKER_TYPES.STONE) ctx.fillText('STONE', center.x, center.y);
        if (tile.blocker === BLOCKER_TYPES.ICE) ctx.fillText(`ICE ${tile.blockerDuration}`, center.x, center.y - game.tileSize * 0.27);
        if (tile.blocker === BLOCKER_TYPES.BOMB) ctx.fillText(`${tile.bombTimer}`, center.x, center.y - game.tileSize * 0.27);
        ctx.restore();
    };

    const drawChain = (game) => {
        if (game.chain.length < 2) return;
        const ctx = game.ctx;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        game.chain.forEach((tile, index) => {
            const center = cellCenter(game, tile);
            if (index === 0) ctx.moveTo(center.x, center.y);
            else ctx.lineTo(center.x, center.y);
        });
        const valid = game.isValidChain();
        ctx.strokeStyle = valid ? 'rgba(78, 188, 190, 0.24)' : 'rgba(196, 83, 69, 0.3)';
        ctx.lineWidth = 8;
        ctx.shadowColor = valid ? '#87d7d4' : '#d37d69';
        ctx.shadowBlur = 13;
        ctx.stroke();
        ctx.strokeStyle = valid ? 'rgba(218, 247, 235, 0.82)' : 'rgba(244, 170, 144, 0.82)';
        ctx.lineWidth = 1.7;
        ctx.shadowBlur = 4;
        ctx.stroke();
        ctx.restore();
    };

    const renderKeeper = (game) => {
        const ctx = game.ctx;
        const time = performance.now();
        ctx.clearRect(0, 0, game.canvas.width, game.canvas.height);
        for (let row = 0; row < game.gridHeight; row++) {
            if (!game.grid[row]) continue;
            for (let col = 0; col < game.gridWidth; col++) {
                const tile = game.grid[row][col];
                if (tile && showInStudy(tile) && tile.blocker !== BLOCKER_TYPES.STONE) drawDeposit(game, tile, time);
            }
        }
        drawChain(game);
        for (let row = 0; row < game.gridHeight; row++) {
            if (!game.grid[row]) continue;
            for (let col = 0; col < game.gridWidth; col++) {
                const tile = game.grid[row][col];
                if (!tile || !showInStudy(tile)) continue;
                drawNumber(game, tile);
                drawBlockerOverlay(game, tile);
            }
        }
    };

    const updatePointer = (game, clientX, clientY) => {
        const position = game.getGridPos(clientX, clientY);
        pointer.active = Boolean(position);
        pointer.col = position ? position.col : -1;
        pointer.row = position ? position.row : -1;
    };

    const arrangeVisualStudy = (game) => {
        for (let row = 0; row < game.gridHeight; row++) {
            for (let col = 0; col < game.gridWidth; col++) {
                const tile = game.grid[row]?.[col];
                const value = studyTiles.get(`${row}:${col}`);
                if (!tile || value === undefined || tile.blocker === BLOCKER_TYPES.STONE) continue;
                tile.value = value;
                tile.keeperFamily = familyStudy
                    ? familyPalettes[col].root
                    : boardShowcase
                        ? familyRoot(value)
                        : 2;
            }
        }
        document.querySelector('.keeper-subtitle').textContent = boardShowcase
            ? 'Full Material Board'
            : familyStudy
                ? 'Family Palette Study'
                : 'Material Progression Study';
        document.querySelector('.level-info').textContent = boardShowcase
            ? 'Material board'
            : familyStudy
                ? 'Family palettes'
                : 'Material progression';

        if (materialStudy) {
            const labels = document.createElement('aside');
            labels.className = 'material-study-labels';
            labels.setAttribute('aria-label', 'Material era labels');
            labels.innerHTML = `
                <span>Raw elements <small>2–8</small></span>
                <span>Reacted compound <small>16–64</small></span>
                <span>Crystalline product <small>128–512</small></span>
                <span>Potent essence <small>1024–2048</small></span>
            `;
            document.querySelector('.game-container').appendChild(labels);
        }

        if (familyStudy) {
            const familyLabels = document.createElement('aside');
            familyLabels.className = 'family-study-labels';
            familyLabels.setAttribute('aria-label', 'Alchemy family palette labels');
            familyLabels.innerHTML = familyPalettes.map((palette) => (
                `<span style="--family-hue: ${palette.hue}"><strong>${palette.root}</strong><small>${palette.name}</small></span>`
            )).join('');
            document.querySelector('.game-container').appendChild(familyLabels);
        }
    };

    const renderFamilyBoardSwitcher = (board) => {
        if (document.querySelector('.family-board-switcher')) return;

        const keys = Object.keys(familyBoards);
        const currentIndex = keys.indexOf(familyBoardKey);
        const switchTo = (offset) => {
            const nextKey = keys[(currentIndex + offset + keys.length) % keys.length];
            const nextUrl = new URL(window.location.href);
            nextUrl.searchParams.delete('showcase');
            nextUrl.searchParams.delete('materials');
            nextUrl.searchParams.delete('families');
            nextUrl.searchParams.set('level', '1');
            nextUrl.searchParams.set('seed', '1234');
            nextUrl.searchParams.set('family-board', nextKey);
            window.location.assign(nextUrl);
        };

        const note = document.createElement('aside');
        note.className = 'family-board-note';
        note.innerHTML = `
            <span class="family-board-kicker">Opening ${currentIndex + 1} of ${keys.length}</span>
            <strong>${board.name}</strong>
            <p>${board.question}</p>
            <small>${board.pressure}</small>
        `;
        document.body.appendChild(note);

        const switcher = document.createElement('nav');
        switcher.className = 'family-board-switcher';
        switcher.setAttribute('aria-label', 'Family opening variants');
        switcher.innerHTML = `
            <button type="button" aria-label="Previous opening">&#8592;</button>
            <span><small>Family opening</small>${currentIndex + 1} — ${board.shortName}</span>
            <button type="button" aria-label="Next opening">&#8594;</button>
        `;
        const buttons = switcher.querySelectorAll('button');
        buttons[0].addEventListener('click', () => switchTo(-1));
        buttons[1].addEventListener('click', () => switchTo(1));
        document.body.appendChild(switcher);

        document.addEventListener('keydown', (event) => {
            if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
            if (event.target.matches('input, textarea, [contenteditable]')) return;
            switchTo(event.key === 'ArrowLeft' ? -1 : 1);
        });
    };

    const arrangeFamilyBoard = (game) => {
        const board = familyBoards[familyBoardKey];
        if (!board) return;

        for (let row = 0; row < game.gridHeight; row++) {
            for (let col = 0; col < game.gridWidth; col++) {
                const tile = game.grid[row]?.[col];
                if (!tile || tile.blocker === BLOCKER_TYPES.STONE) continue;
                tile.value = board.values[row][col];
                delete tile.keeperFamily;
                tile.selected = false;
            }
        }

        game.score = 0;
        game.moves = 0;
        game.bestChain = 0;
        game.maxMoves = 100;
        game.targetScore = 1000000;
        game.minChain = 2;
        game.chain = [];
        game.history = [];
        game.gameOver = false;
        game.levelComplete = false;
        game.animating = false;
        // Prototype plays are intentionally excluded from ordinary level evidence.
        game.authoringCapture = null;
        document.getElementById('undoBtn').disabled = true;
        document.querySelector('.keeper-subtitle').textContent = 'Family Opening Study';
        const seedEl = document.getElementById('seedValue');
        if (seedEl) seedEl.textContent = 'fixed';
        const menuButton = document.getElementById('menuBtn');
        if (menuButton) menuButton.style.display = 'none';
        game.updateUI();
        document.querySelector('.level-info').innerHTML = `
            <span class="family-board-title">${board.name}</span>
            <span id="levelNum" hidden>${game.currentLevel}</span>
        `;
        game.render();
        renderFamilyBoardSwitcher(board);
    };

    const start = async () => {
        await loadImages();
        const game = window.game;
        if (!game) return;
        if (visualStudy) arrangeVisualStudy(game);
        if (familyBoardStudy) {
            const reloadLevel = game.reloadCurrentLevel.bind(game);
            game.reloadCurrentLevel = () => {
                reloadLevel();
                arrangeFamilyBoard(game);
            };
            arrangeFamilyBoard(game);
        }
        game.getGridPos = (clientX, clientY) => {
            const rect = game.canvas.getBoundingClientRect();
            const scaleX = game.canvas.width / rect.width;
            const scaleY = game.canvas.height / rect.height;
            const x = (clientX - rect.left) * scaleX;
            const y = (clientY - rect.top) * scaleY;
            const col = Math.floor((x - game.tilePadding) / (game.tileSize + game.tilePadding));
            const row = Math.floor((y - game.tilePadding) / (game.tileSize + game.tilePadding));
            if (col < 0 || col >= game.gridWidth || row < 0 || row >= game.gridHeight) return null;
            return { col, row };
        };
        game.canvas.addEventListener('pointermove', (event) => updatePointer(game, event.clientX, event.clientY));
        game.canvas.addEventListener('pointerleave', () => {
            pointer.active = false;
        });
        game.render = () => renderKeeper(game);
        game.render();
    };

    start().catch((error) => console.error('Keeper alchemy prototype failed:', error));
})();
