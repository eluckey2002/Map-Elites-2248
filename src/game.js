// ============================================================================
// 2248 CHALLENGE - Core Game Engine
// ============================================================================

// Tile colors based on value
const TILE_COLORS = {
    2: '#EEE4DA',
    4: '#EDE0C8',
    8: '#F2B179',
    16: '#F59563',
    32: '#F67C5F',
    64: '#F65E3B',
    128: '#EDCF72',
    256: '#EDCC61',
    512: '#EDC850',
    1024: '#EDC53F',
    2048: '#EDC22E',
    4096: '#3C3A32',
    8192: '#3C3A32'
};

const BLOCKER_TYPES = {
    STONE: 'stone',
    ICE: 'ice',
    BOMB: 'bomb',
    LOCK: 'lock'
};

// ============================================================================
// LEVEL DEFINITIONS
// ============================================================================

const LEVELS = [
    // Tutorial levels (1-10) - Min chain 2
    { level: 1, target: 500, moves: 25, minChain: 2, gridW: 5, gridH: 8, blockers: [], intro: "Connect matching numbers!" },
    { level: 2, target: 800, moves: 25, minChain: 2, gridW: 5, gridH: 8, blockers: [] },
    { level: 3, target: 1200, moves: 25, minChain: 2, gridW: 5, gridH: 8, blockers: [] },
    { level: 4, target: 1500, moves: 25, minChain: 2, gridW: 5, gridH: 8, blockers: [] },
    { level: 5, target: 2000, moves: 25, minChain: 2, gridW: 5, gridH: 8, blockers: [], intro: "Longer chains = more points!" },
    { level: 6, target: 2500, moves: 24, minChain: 2, gridW: 5, gridH: 8, blockers: [] },
    { level: 7, target: 3000, moves: 24, minChain: 2, gridW: 5, gridH: 8, blockers: [] },
    { level: 8, target: 3500, moves: 23, minChain: 2, gridW: 5, gridH: 8, blockers: [] },
    { level: 9, target: 4000, moves: 23, minChain: 2, gridW: 5, gridH: 8, blockers: [] },
    { level: 10, target: 4500, moves: 22, minChain: 2, gridW: 5, gridH: 8, blockers: [] },

    // Min chain 3 levels (11-25)
    { level: 11, target: 5000, moves: 28, minChain: 3, gridW: 5, gridH: 8, blockers: [], intro: "Now you need chains of 3+!" },
    { level: 12, target: 5500, moves: 27, minChain: 3, gridW: 5, gridH: 8, blockers: [] },
    { level: 13, target: 6000, moves: 27, minChain: 3, gridW: 5, gridH: 8, blockers: [] },
    { level: 14, target: 6500, moves: 26, minChain: 3, gridW: 5, gridH: 8, blockers: [] },
    { level: 15, target: 7000, moves: 28, minChain: 3, gridW: 5, gridH: 8, blockers: [{ type: BLOCKER_TYPES.STONE, x: 2, y: 3 }], intro: "Stone blocks the way!" },
    { level: 16, target: 7500, moves: 27, minChain: 3, gridW: 5, gridH: 8, blockers: [{ type: BLOCKER_TYPES.STONE, x: 1, y: 4 }] },
    { level: 17, target: 8000, moves: 27, minChain: 3, gridW: 5, gridH: 8, blockers: [{ type: BLOCKER_TYPES.STONE, x: 3, y: 2 }] },
    { level: 18, target: 8500, moves: 26, minChain: 3, gridW: 5, gridH: 8, blockers: [{ type: BLOCKER_TYPES.STONE, x: 2, y: 4 }, { type: BLOCKER_TYPES.STONE, x: 2, y: 5 }] },
    { level: 19, target: 9000, moves: 26, minChain: 3, gridW: 5, gridH: 8, blockers: [{ type: BLOCKER_TYPES.STONE, x: 1, y: 3 }, { type: BLOCKER_TYPES.STONE, x: 3, y: 5 }] },
    { level: 20, target: 9500, moves: 25, minChain: 3, gridW: 5, gridH: 8, blockers: [{ type: BLOCKER_TYPES.STONE, x: 0, y: 4 }, { type: BLOCKER_TYPES.STONE, x: 4, y: 4 }] },
    { level: 21, target: 10000, moves: 28, minChain: 3, gridW: 5, gridH: 8, blockers: [{ type: BLOCKER_TYPES.STONE, x: 2, y: 2 }] },
    { level: 22, target: 10500, moves: 27, minChain: 3, gridW: 5, gridH: 8, blockers: [{ type: BLOCKER_TYPES.STONE, x: 1, y: 3 }] },
    { level: 23, target: 11000, moves: 27, minChain: 3, gridW: 5, gridH: 8, blockers: [{ type: BLOCKER_TYPES.STONE, x: 2, y: 4 }] },
    { level: 24, target: 11500, moves: 26, minChain: 3, gridW: 5, gridH: 8, blockers: [{ type: BLOCKER_TYPES.STONE, x: 1, y: 2 }, { type: BLOCKER_TYPES.STONE, x: 3, y: 5 }] },
    { level: 25, target: 12000, moves: 26, minChain: 3, gridW: 5, gridH: 8, blockers: [{ type: BLOCKER_TYPES.ICE, x: 2, y: 3, duration: 3 }], intro: "Ice thaws after 3 moves!" },

    // Min chain 4 levels (26-50)
    { level: 26, target: 13000, moves: 32, minChain: 4, gridW: 5, gridH: 8, blockers: [], intro: "Chains of 4+ required now!" },
    { level: 27, target: 13500, moves: 31, minChain: 4, gridW: 5, gridH: 8, blockers: [] },
    { level: 28, target: 14000, moves: 31, minChain: 4, gridW: 5, gridH: 8, blockers: [{ type: BLOCKER_TYPES.STONE, x: 2, y: 4 }] },
    { level: 29, target: 14500, moves: 30, minChain: 4, gridW: 5, gridH: 8, blockers: [{ type: BLOCKER_TYPES.STONE, x: 1, y: 3 }] },
    { level: 30, target: 15000, moves: 30, minChain: 4, gridW: 5, gridH: 8, blockers: [{ type: BLOCKER_TYPES.STONE, x: 2, y: 3 }, { type: BLOCKER_TYPES.ICE, x: 2, y: 5, duration: 4 }] },

    // Grid compression starts (31+)
    { level: 31, target: 15000, moves: 30, minChain: 4, gridW: 5, gridH: 7, blockers: [], intro: "The grid is smaller now!" },
    { level: 32, target: 15500, moves: 30, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 2, y: 3 }] },
    { level: 33, target: 16000, moves: 29, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 1, y: 2 }] },
    { level: 34, target: 16500, moves: 29, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 2, y: 4 }, { type: BLOCKER_TYPES.ICE, x: 3, y: 2, duration: 3 }] },
    { level: 35, target: 17000, moves: 28, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 1, y: 3 }, { type: BLOCKER_TYPES.STONE, x: 3, y: 4 }] },
    { level: 36, target: 17500, moves: 28, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 0, y: 3 }, { type: BLOCKER_TYPES.ICE, x: 4, y: 3, duration: 4 }] },
    { level: 37, target: 18000, moves: 27, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 2, y: 2 }, { type: BLOCKER_TYPES.STONE, x: 2, y: 4 }] },
    { level: 38, target: 18500, moves: 27, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 1, y: 3 }, { type: BLOCKER_TYPES.ICE, x: 3, y: 3, duration: 3 }] },
    { level: 39, target: 19000, moves: 26, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 2, y: 3 }, { type: BLOCKER_TYPES.STONE, x: 2, y: 5 }] },
    { level: 40, target: 20000, moves: 30, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.BOMB, x: 2, y: 3, timer: 8 }], intro: "Bombs explode! Merge them fast!" },

    // More challenging levels with bombs
    { level: 41, target: 20500, moves: 29, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 1, y: 2 }, { type: BLOCKER_TYPES.BOMB, x: 3, y: 4, timer: 7 }] },
    { level: 42, target: 21000, moves: 29, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.BOMB, x: 2, y: 3, timer: 8 }] },
    { level: 43, target: 21500, moves: 28, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 2, y: 2 }, { type: BLOCKER_TYPES.BOMB, x: 2, y: 5, timer: 7 }] },
    { level: 44, target: 22000, moves: 28, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.ICE, x: 1, y: 3, duration: 3 }, { type: BLOCKER_TYPES.BOMB, x: 3, y: 3, timer: 6 }] },
    { level: 45, target: 22500, moves: 27, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 0, y: 3 }, { type: BLOCKER_TYPES.STONE, x: 4, y: 3 }, { type: BLOCKER_TYPES.BOMB, x: 2, y: 4, timer: 8 }] },
    { level: 46, target: 23000, moves: 27, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 2, y: 2 }, { type: BLOCKER_TYPES.ICE, x: 2, y: 5, duration: 4 }] },
    { level: 47, target: 23500, moves: 26, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 1, y: 3 }, { type: BLOCKER_TYPES.BOMB, x: 3, y: 4, timer: 6 }] },
    { level: 48, target: 24000, moves: 26, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 2, y: 3 }, { type: BLOCKER_TYPES.STONE, x: 2, y: 4 }, { type: BLOCKER_TYPES.ICE, x: 1, y: 5, duration: 3 }] },
    { level: 49, target: 24500, moves: 25, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 1, y: 2 }, { type: BLOCKER_TYPES.STONE, x: 3, y: 5 }, { type: BLOCKER_TYPES.BOMB, x: 2, y: 3, timer: 7 }] },
    { level: 50, target: 25000, moves: 28, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 0, y: 3 }, { type: BLOCKER_TYPES.STONE, x: 4, y: 3 }, { type: BLOCKER_TYPES.BOMB, x: 2, y: 2, timer: 6 }, { type: BLOCKER_TYPES.BOMB, x: 2, y: 5, timer: 8 }] },
];

// ============================================================================
// TILE CLASS
// ============================================================================

class Tile {
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.selected = false;
        this.merging = false;
        this.spawning = true;
        this.spawnProgress = 0;

        // Blocker properties
        this.blocker = null;
        this.blockerDuration = 0;
        this.bombTimer = 0;
    }

    setBlocker(type, duration = 0, timer = 0) {
        this.blocker = type;
        this.blockerDuration = duration;
        this.bombTimer = timer;
    }

    isBlocked() {
        return this.blocker === BLOCKER_TYPES.STONE ||
               this.blocker === BLOCKER_TYPES.ICE ||
               this.blocker === BLOCKER_TYPES.LOCK;
    }

    isBomb() {
        return this.blocker === BLOCKER_TYPES.BOMB;
    }

    tickBlocker() {
        if (this.blocker === BLOCKER_TYPES.ICE) {
            this.blockerDuration--;
            if (this.blockerDuration <= 0) {
                this.blocker = null;
            }
        }
        if (this.blocker === BLOCKER_TYPES.BOMB) {
            this.bombTimer--;
        }
    }
}

// ============================================================================
// GAME CLASS
// ============================================================================

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Grid dimensions
        this.gridWidth = 5;
        this.gridHeight = 8;
        this.tileSize = 70;
        this.tilePadding = 6;

        // Game state
        this.grid = [];
        this.chain = [];
        this.score = 0;
        this.moves = 0;
        this.maxMoves = 25;
        this.targetScore = 1000;
        this.minChain = 2;
        this.currentLevel = 1;
        this.bestChain = 0;
        this.gameOver = false;
        this.levelComplete = false;

        // History for undo
        this.history = [];
        this.maxHistory = 10;

        // Animation
        this.animating = false;
        this.animations = [];

        // Touch/mouse state
        this.isDragging = false;
        this.lastTouchPos = null;

        // Unlocked levels
        this.unlockedLevel = parseInt(localStorage.getItem('unlockedLevel')) || 1;

        this.setupCanvas();
        this.setupEventListeners();
        this.loadLevel(this.currentLevel);
        this.gameLoop();
    }

    setupCanvas() {
        const updateSize = () => {
            const maxWidth = Math.min(400, window.innerWidth - 40);
            this.tileSize = Math.floor((maxWidth - this.tilePadding * (this.gridWidth + 1)) / this.gridWidth);
            this.canvas.width = this.gridWidth * this.tileSize + this.tilePadding * (this.gridWidth + 1);
            this.canvas.height = this.gridHeight * this.tileSize + this.tilePadding * (this.gridHeight + 1);
            this.render();
        };

        updateSize();
        window.addEventListener('resize', updateSize);
    }

    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleStart(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleEnd());
        this.canvas.addEventListener('mouseleave', () => this.handleEnd());

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleStart(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleMove(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', () => this.handleEnd());
        this.canvas.addEventListener('touchcancel', () => this.handleEnd());

        // Button events
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('restartBtn').addEventListener('click', () => this.loadLevel(this.currentLevel));
        document.getElementById('menuBtn').addEventListener('click', () => this.showLevelSelect());
        document.getElementById('nextLevelBtn').addEventListener('click', () => this.nextLevel());
        document.getElementById('retryBtn').addEventListener('click', () => this.loadLevel(this.currentLevel));
        document.getElementById('gameOverMenuBtn').addEventListener('click', () => {
            this.hideModal('gameOverModal');
            this.showLevelSelect();
        });
        document.getElementById('closeLevelSelect').addEventListener('click', () => this.hideModal('levelSelectModal'));
    }

    getGridPos(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        const col = Math.floor((x - this.tilePadding) / (this.tileSize + this.tilePadding));
        const row = Math.floor((y - this.tilePadding) / (this.tileSize + this.tilePadding));

        if (col >= 0 && col < this.gridWidth && row >= 0 && row < this.gridHeight) {
            return { col, row };
        }
        return null;
    }

    handleStart(e) {
        if (this.animating || this.gameOver || this.levelComplete) return;

        const pos = this.getGridPos(e.clientX, e.clientY);
        if (!pos) return;

        const tile = this.grid[pos.row][pos.col];
        if (!tile || tile.isBlocked()) return;

        this.isDragging = true;
        this.chain = [tile];
        tile.selected = true;
        this.updateChainIndicator();
        this.render();
    }

    handleMove(e) {
        if (!this.isDragging || this.animating) return;

        const pos = this.getGridPos(e.clientX, e.clientY);
        if (!pos) return;

        const tile = this.grid[pos.row][pos.col];
        if (!tile || tile.isBlocked()) return;

        // Check if already in chain
        const existingIndex = this.chain.findIndex(t => t === tile);
        if (existingIndex !== -1) {
            // Backtrack if going back
            if (existingIndex === this.chain.length - 2) {
                const removed = this.chain.pop();
                removed.selected = false;
                this.updateChainIndicator();
                this.render();
            }
            return;
        }

        // Check if adjacent to last tile in chain
        const lastTile = this.chain[this.chain.length - 1];
        if (!this.isAdjacent(lastTile, tile)) return;

        // Check if valid chain extension
        if (this.canExtendChain(tile)) {
            this.chain.push(tile);
            tile.selected = true;
            this.updateChainIndicator();
            this.render();
        }
    }

    handleEnd() {
        if (!this.isDragging) return;
        this.isDragging = false;

        // Validate and execute chain
        if (this.isValidChain()) {
            this.executeChain();
        } else {
            // Clear selection
            this.chain.forEach(t => t.selected = false);
            this.chain = [];
            this.updateChainIndicator();
            this.render();
        }
    }

    isAdjacent(tile1, tile2) {
        const dx = Math.abs(tile1.x - tile2.x);
        const dy = Math.abs(tile1.y - tile2.y);
        return dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0);
    }

    canExtendChain(newTile) {
        if (this.chain.length === 0) return true;

        const lastTile = this.chain[this.chain.length - 1];

        // First extension must be same value
        if (this.chain.length === 1) {
            return newTile.value === lastTile.value;
        }

        // Subsequent extensions can be same or double
        return newTile.value === lastTile.value || newTile.value === lastTile.value * 2;
    }

    isValidChain() {
        if (this.chain.length < this.minChain) return false;

        // Must start with two matching numbers
        if (this.chain.length >= 2 && this.chain[0].value !== this.chain[1].value) {
            return false;
        }

        return true;
    }

    calculateChainValue() {
        let sum = 0;
        this.chain.forEach(tile => {
            sum += tile.value;
        });
        return sum;
    }

    getChainMultiplier() {
        const len = this.chain.length;
        if (len >= 9) return 5;
        if (len >= 7) return 3;
        if (len >= 5) return 2;
        if (len >= 3) return 1.5;
        return 1;
    }

    executeChain() {
        // Save state for undo
        this.saveState();

        const chainValue = this.calculateChainValue();
        const multiplier = this.getChainMultiplier();
        const points = Math.floor(chainValue * multiplier);

        // Track best chain
        if (this.chain.length > this.bestChain) {
            this.bestChain = this.chain.length;
        }

        // Get final tile position (where merged tile will appear)
        const finalTile = this.chain[this.chain.length - 1];
        const finalX = finalTile.x;
        const finalY = finalTile.y;

        // Show multiplier popup if > 1
        if (multiplier > 1) {
            this.showMultiplierPopup(finalX, finalY, multiplier);
        }

        // Remove all tiles in chain except the last
        this.chain.forEach((tile, index) => {
            tile.selected = false;
            if (index < this.chain.length - 1) {
                this.grid[tile.y][tile.x] = null;
            }
        });

        // Update final tile with new value
        finalTile.value = chainValue;
        finalTile.merging = true;

        // Defuse bomb if final tile was a bomb
        if (finalTile.isBomb()) {
            finalTile.blocker = null;
            finalTile.bombTimer = 0;
        }

        // Update score and moves
        this.score += points;
        this.moves++;

        // Clear chain
        this.chain = [];
        this.updateChainIndicator();

        // Animate and then handle gravity + spawning
        this.animating = true;
        setTimeout(() => {
            finalTile.merging = false;
            this.applyGravity();
            this.spawnNewTiles();
            this.tickBlockers();
            this.checkBombs();
            this.animating = false;
            this.updateUI();
            this.checkWinLose();
            this.render();
        }, 200);

        this.updateUI();
        this.render();
    }

    applyGravity() {
        for (let col = 0; col < this.gridWidth; col++) {
            let writeRow = this.gridHeight - 1;

            for (let row = this.gridHeight - 1; row >= 0; row--) {
                const tile = this.grid[row][col];
                if (tile && tile.blocker !== BLOCKER_TYPES.STONE) {
                    if (row !== writeRow) {
                        this.grid[writeRow][col] = tile;
                        this.grid[row][col] = null;
                        tile.y = writeRow;
                    }
                    writeRow--;
                } else if (tile && tile.blocker === BLOCKER_TYPES.STONE) {
                    // Stone blocks gravity above it
                    writeRow = row - 1;
                }
            }
        }
    }

    spawnNewTiles() {
        for (let col = 0; col < this.gridWidth; col++) {
            for (let row = 0; row < this.gridHeight; row++) {
                if (!this.grid[row][col]) {
                    // Spawn new tile (weighted towards lower values)
                    const rand = Math.random();
                    let value;
                    if (rand < 0.6) value = 2;
                    else if (rand < 0.9) value = 4;
                    else value = 8;

                    const tile = new Tile(col, row, value);
                    this.grid[row][col] = tile;
                }
            }
        }
    }

    tickBlockers() {
        for (let row = 0; row < this.gridHeight; row++) {
            for (let col = 0; col < this.gridWidth; col++) {
                const tile = this.grid[row][col];
                if (tile) {
                    tile.tickBlocker();
                }
            }
        }
    }

    checkBombs() {
        for (let row = 0; row < this.gridHeight; row++) {
            for (let col = 0; col < this.gridWidth; col++) {
                const tile = this.grid[row][col];
                if (tile && tile.isBomb() && tile.bombTimer <= 0) {
                    // Bomb explodes! Game over
                    this.gameOver = true;
                    this.showGameOver('Bomb exploded!');
                    return;
                }
            }
        }
    }

    checkWinLose() {
        // Check win
        if (this.score >= this.targetScore) {
            this.levelComplete = true;
            this.showLevelComplete();
            return;
        }

        // Check lose (out of moves)
        if (this.moves >= this.maxMoves) {
            this.gameOver = true;
            this.showGameOver('Out of moves!');
            return;
        }

        // Check if any valid moves exist
        if (!this.hasValidMoves()) {
            this.gameOver = true;
            this.showGameOver('No valid moves!');
        }
    }

    hasValidMoves() {
        // Check if any chain of minChain length is possible
        for (let row = 0; row < this.gridHeight; row++) {
            for (let col = 0; col < this.gridWidth; col++) {
                const tile = this.grid[row][col];
                if (tile && !tile.isBlocked()) {
                    if (this.canFormValidChain(tile, [tile], this.minChain)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    canFormValidChain(startTile, currentChain, requiredLength) {
        if (currentChain.length >= requiredLength) return true;

        const lastTile = currentChain[currentChain.length - 1];

        // Check all adjacent tiles
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;

                const nx = lastTile.x + dx;
                const ny = lastTile.y + dy;

                if (nx < 0 || nx >= this.gridWidth || ny < 0 || ny >= this.gridHeight) continue;

                const neighbor = this.grid[ny][nx];
                if (!neighbor || neighbor.isBlocked()) continue;
                if (currentChain.includes(neighbor)) continue;

                // Check if can extend
                let canExtend = false;
                if (currentChain.length === 1) {
                    canExtend = neighbor.value === startTile.value;
                } else {
                    canExtend = neighbor.value === lastTile.value || neighbor.value === lastTile.value * 2;
                }

                if (canExtend) {
                    currentChain.push(neighbor);
                    if (this.canFormValidChain(startTile, currentChain, requiredLength)) {
                        currentChain.pop();
                        return true;
                    }
                    currentChain.pop();
                }
            }
        }

        return false;
    }

    // ========================================================================
    // LEVEL MANAGEMENT
    // ========================================================================

    loadLevel(levelNum) {
        const levelData = LEVELS.find(l => l.level === levelNum) || LEVELS[0];

        this.currentLevel = levelData.level;
        this.gridWidth = levelData.gridW;
        this.gridHeight = levelData.gridH;
        this.targetScore = levelData.target;
        this.maxMoves = levelData.moves;
        this.minChain = levelData.minChain;

        this.score = 0;
        this.moves = 0;
        this.bestChain = 0;
        this.chain = [];
        this.history = [];
        this.gameOver = false;
        this.levelComplete = false;
        this.animating = false;

        // Update canvas size for grid
        this.setupCanvas();

        // Initialize grid
        this.grid = [];
        for (let row = 0; row < this.gridHeight; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridWidth; col++) {
                const rand = Math.random();
                let value;
                if (rand < 0.5) value = 2;
                else if (rand < 0.8) value = 4;
                else if (rand < 0.95) value = 8;
                else value = 16;

                this.grid[row][col] = new Tile(col, row, value);
            }
        }

        // Place blockers
        levelData.blockers.forEach(b => {
            const tile = this.grid[b.y][b.x];
            if (tile) {
                if (b.type === BLOCKER_TYPES.STONE) {
                    tile.value = 0;
                    tile.setBlocker(BLOCKER_TYPES.STONE);
                } else if (b.type === BLOCKER_TYPES.ICE) {
                    tile.setBlocker(BLOCKER_TYPES.ICE, b.duration);
                } else if (b.type === BLOCKER_TYPES.BOMB) {
                    tile.setBlocker(BLOCKER_TYPES.BOMB, 0, b.timer);
                }
            }
        });

        // Hide modals
        this.hideModal('completeModal');
        this.hideModal('gameOverModal');
        this.hideModal('levelSelectModal');

        // Disable undo button (history is empty)
        document.getElementById('undoBtn').disabled = true;

        // Show intro if present
        if (levelData.intro) {
            // Could show a toast/notification here
            console.log('Level intro:', levelData.intro);
        }

        this.updateUI();
        this.render();
    }

    nextLevel() {
        const nextLevelNum = this.currentLevel + 1;
        if (nextLevelNum <= LEVELS.length) {
            if (nextLevelNum > this.unlockedLevel) {
                this.unlockedLevel = nextLevelNum;
                localStorage.setItem('unlockedLevel', this.unlockedLevel);
            }
            this.loadLevel(nextLevelNum);
        } else {
            // All levels complete!
            alert('Congratulations! You completed all levels!');
            this.loadLevel(1);
        }
    }

    // ========================================================================
    // UNDO SYSTEM
    // ========================================================================

    saveState() {
        const state = {
            grid: this.grid.map(row => row.map(tile => {
                if (!tile) return null;
                return {
                    x: tile.x,
                    y: tile.y,
                    value: tile.value,
                    blocker: tile.blocker,
                    blockerDuration: tile.blockerDuration,
                    bombTimer: tile.bombTimer
                };
            })),
            score: this.score,
            moves: this.moves,
            bestChain: this.bestChain
        };

        this.history.push(JSON.stringify(state));
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }

        document.getElementById('undoBtn').disabled = false;
    }

    undo() {
        if (this.history.length === 0 || this.animating) return;

        const state = JSON.parse(this.history.pop());

        this.grid = state.grid.map(row => row.map(tileData => {
            if (!tileData) return null;
            const tile = new Tile(tileData.x, tileData.y, tileData.value);
            tile.blocker = tileData.blocker;
            tile.blockerDuration = tileData.blockerDuration;
            tile.bombTimer = tileData.bombTimer;
            return tile;
        }));

        this.score = state.score;
        this.moves = state.moves;
        this.bestChain = state.bestChain;
        this.gameOver = false;
        this.levelComplete = false;

        // Clear any active chain selection
        this.chain = [];
        this.updateChainIndicator();

        // Hide all game-ending modals
        this.hideModal('gameOverModal');
        this.hideModal('completeModal');

        document.getElementById('undoBtn').disabled = this.history.length === 0;

        this.updateUI();
        this.render();
    }

    // ========================================================================
    // UI UPDATES
    // ========================================================================

    updateUI() {
        document.getElementById('levelNum').textContent = this.currentLevel;
        document.getElementById('score').textContent = this.score.toLocaleString();
        document.getElementById('movesLeft').textContent = this.maxMoves - this.moves;
        document.getElementById('movesTotal').textContent = this.maxMoves;
        document.getElementById('targetScore').textContent = this.targetScore.toLocaleString();
        document.getElementById('minChain').textContent = this.minChain;

        const progress = Math.min(100, (this.score / this.targetScore) * 100);
        document.getElementById('progressFill').style.width = progress + '%';

        // Highlight min chain if > 2
        const minChainDisplay = document.getElementById('minChainDisplay');
        if (this.minChain > 2) {
            minChainDisplay.classList.add('min-chain-warning');
        } else {
            minChainDisplay.classList.remove('min-chain-warning');
        }
    }

    updateChainIndicator() {
        const indicator = document.getElementById('chainIndicator');
        const text = document.getElementById('chainText');

        if (this.chain.length === 0) {
            indicator.style.display = 'none';
            return;
        }

        indicator.style.display = 'block';
        const sum = this.calculateChainValue();
        const multiplier = this.getChainMultiplier();
        const isValid = this.isValidChain();

        if (isValid) {
            text.className = 'chain-valid';
            text.textContent = `${this.chain.length} tiles → ${sum} × ${multiplier} = ${Math.floor(sum * multiplier)}`;
        } else {
            text.className = 'chain-invalid';
            if (this.chain.length < this.minChain) {
                text.textContent = `Need ${this.minChain - this.chain.length} more tiles`;
            } else {
                text.textContent = 'Invalid chain';
            }
        }
    }

    showMultiplierPopup(x, y, multiplier) {
        const popup = document.createElement('div');
        popup.className = 'multiplier-popup';
        popup.textContent = `${multiplier}×!`;

        const rect = this.canvas.getBoundingClientRect();
        const tileX = this.tilePadding + x * (this.tileSize + this.tilePadding) + this.tileSize / 2;
        const tileY = this.tilePadding + y * (this.tileSize + this.tilePadding) + this.tileSize / 2;

        popup.style.left = (rect.left + tileX) + 'px';
        popup.style.top = (rect.top + tileY) + 'px';

        document.body.appendChild(popup);

        setTimeout(() => popup.remove(), 800);
    }

    showLevelComplete() {
        const stars = this.calculateStars();

        document.getElementById('finalScore').textContent = this.score.toLocaleString();
        document.getElementById('movesUsed').textContent = this.moves;
        document.getElementById('bestChain').textContent = this.bestChain;

        const starsDisplay = document.getElementById('starsDisplay');
        starsDisplay.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const star = document.createElement('span');
            star.className = 'star' + (i < stars ? ' earned' : '');
            star.textContent = '★';
            starsDisplay.appendChild(star);
        }

        this.showModal('completeModal');
    }

    calculateStars() {
        const efficiency = (this.maxMoves - this.moves) / this.maxMoves;
        if (efficiency >= 0.4) return 3;  // Used 60% or less of moves
        if (efficiency >= 0.2) return 2;  // Used 80% or less of moves
        return 1;
    }

    showGameOver(reason) {
        document.getElementById('gameOverReason').textContent = reason;
        document.getElementById('gameOverScore').textContent = this.score.toLocaleString();
        document.getElementById('gameOverTarget').textContent = this.targetScore.toLocaleString();
        this.showModal('gameOverModal');
    }

    showLevelSelect() {
        const container = document.getElementById('levelSelect');
        container.innerHTML = '';

        for (let i = 1; i <= LEVELS.length; i++) {
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            btn.textContent = i;

            if (i === this.currentLevel) {
                btn.classList.add('current');
            }

            if (i > this.unlockedLevel) {
                btn.classList.add('locked');
                btn.textContent = '🔒';
            } else {
                btn.addEventListener('click', () => {
                    this.loadLevel(i);
                });
            }

            container.appendChild(btn);
        }

        this.showModal('levelSelectModal');
    }

    showModal(id) {
        document.getElementById(id).classList.add('active');
    }

    hideModal(id) {
        document.getElementById(id).classList.remove('active');
    }

    // ========================================================================
    // RENDERING
    // ========================================================================

    render() {
        const ctx = this.ctx;

        // Clear canvas
        ctx.fillStyle = '#0f0f23';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        for (let row = 0; row < this.gridHeight; row++) {
            for (let col = 0; col < this.gridWidth; col++) {
                const x = this.tilePadding + col * (this.tileSize + this.tilePadding);
                const y = this.tilePadding + row * (this.tileSize + this.tilePadding);
                this.roundRect(ctx, x, y, this.tileSize, this.tileSize, 8);
                ctx.fill();
            }
        }

        // Draw tiles
        for (let row = 0; row < this.gridHeight; row++) {
            if (!this.grid[row]) continue;
            for (let col = 0; col < this.gridWidth; col++) {
                const tile = this.grid[row][col];
                if (tile) {
                    this.drawTile(tile);
                }
            }
        }

        // Draw chain lines
        if (this.chain.length > 1) {
            ctx.strokeStyle = this.isValidChain() ? '#4ade80' : '#f67c5f';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();

            for (let i = 0; i < this.chain.length; i++) {
                const tile = this.chain[i];
                const x = this.tilePadding + tile.x * (this.tileSize + this.tilePadding) + this.tileSize / 2;
                const y = this.tilePadding + tile.y * (this.tileSize + this.tilePadding) + this.tileSize / 2;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }

            ctx.stroke();
        }
    }

    drawTile(tile) {
        const ctx = this.ctx;
        const x = this.tilePadding + tile.x * (this.tileSize + this.tilePadding);
        const y = this.tilePadding + tile.y * (this.tileSize + this.tilePadding);

        // Tile background
        if (tile.blocker === BLOCKER_TYPES.STONE) {
            ctx.fillStyle = '#4a4a5a';
        } else {
            ctx.fillStyle = TILE_COLORS[tile.value] || '#3C3A32';
        }

        // Selection highlight
        if (tile.selected) {
            ctx.shadowColor = this.isValidChain() ? '#4ade80' : '#f67c5f';
            ctx.shadowBlur = 15;
        }

        // Merging animation
        let scale = 1;
        if (tile.merging) {
            scale = 1.1;
        }

        const scaledSize = this.tileSize * scale;
        const offset = (scaledSize - this.tileSize) / 2;

        this.roundRect(ctx, x - offset, y - offset, scaledSize, scaledSize, 8);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Blocker overlays
        if (tile.blocker === BLOCKER_TYPES.ICE) {
            ctx.fillStyle = 'rgba(100, 200, 255, 0.4)';
            this.roundRect(ctx, x, y, this.tileSize, this.tileSize, 8);
            ctx.fill();

            // Ice duration indicator
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(tile.blockerDuration.toString(), x + this.tileSize - 5, y + 18);
        }

        if (tile.blocker === BLOCKER_TYPES.BOMB) {
            ctx.fillStyle = tile.bombTimer <= 3 ? 'rgba(255, 100, 100, 0.5)' : 'rgba(255, 150, 100, 0.3)';
            this.roundRect(ctx, x, y, this.tileSize, this.tileSize, 8);
            ctx.fill();

            // Bomb timer
            ctx.fillStyle = tile.bombTimer <= 3 ? '#ff4444' : '#fff';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('💣' + tile.bombTimer, x + this.tileSize - 5, y + 20);
        }

        // Tile value text (not for stone)
        if (tile.blocker !== BLOCKER_TYPES.STONE) {
            const textColor = tile.value >= 8 ? '#fff' : '#776e65';
            ctx.fillStyle = textColor;

            let fontSize = this.tileSize * 0.4;
            if (tile.value >= 1000) fontSize = this.tileSize * 0.28;
            else if (tile.value >= 100) fontSize = this.tileSize * 0.32;

            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            let displayValue = tile.value.toString();
            if (tile.value >= 1000000) {
                displayValue = (tile.value / 1000000).toFixed(1) + 'M';
            } else if (tile.value >= 1000) {
                displayValue = (tile.value / 1000).toFixed(tile.value >= 10000 ? 0 : 1) + 'K';
            }

            ctx.fillText(displayValue, x + this.tileSize / 2, y + this.tileSize / 2);
        }
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    gameLoop() {
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// ============================================================================
// INITIALIZE GAME
// ============================================================================

if (typeof document !== 'undefined') {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LEVELS, BLOCKER_TYPES };
}
