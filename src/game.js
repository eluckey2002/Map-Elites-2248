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
    { level: 1, target: 520, tileScale: 1, moves: 25, minChain: 2, gridW: 5, gridH: 8, blockers: [], intro: "Connect matching numbers!" },
    { level: 2, target: 970, tileScale: 1, moves: 25, minChain: 2, gridW: 5, gridH: 8, blockers: [] },
    { level: 3, target: 1400, tileScale: 1, moves: 25, minChain: 2, gridW: 5, gridH: 8, blockers: [] },
    { level: 4, target: 1850, tileScale: 1, moves: 25, minChain: 2, gridW: 5, gridH: 8, blockers: [] },
    { level: 5, target: 2300, tileScale: 1, moves: 25, minChain: 2, gridW: 5, gridH: 8, blockers: [], intro: "Longer chains = more points!" },
    { level: 6, target: 2650, tileScale: 1, moves: 24, minChain: 2, gridW: 5, gridH: 8, blockers: [] },
    { level: 7, target: 3050, tileScale: 1, moves: 24, minChain: 2, gridW: 5, gridH: 8, blockers: [] },
    { level: 8, target: 3350, tileScale: 1, moves: 23, minChain: 2, gridW: 5, gridH: 8, blockers: [] },
    { level: 9, target: 3750, tileScale: 1, moves: 23, minChain: 2, gridW: 5, gridH: 8, blockers: [] },
    { level: 10, target: 4000, tileScale: 1, moves: 22, minChain: 2, gridW: 5, gridH: 8, blockers: [] },

    // Min chain 3 levels (11-25)
    { level: 11, target: 7500, tileScale: 2, moves: 28, minChain: 3, gridW: 5, gridH: 8, blockers: [], intro: "Now you need chains of 3+!" },
    { level: 12, target: 7700, tileScale: 2, moves: 27, minChain: 3, gridW: 5, gridH: 8, blockers: [] },
    { level: 13, target: 8150, tileScale: 2, moves: 27, minChain: 3, gridW: 5, gridH: 8, blockers: [] },
    { level: 14, target: 8250, tileScale: 2, moves: 26, minChain: 3, gridW: 5, gridH: 8, blockers: [] },
    { level: 15, target: 8100, tileScale: 2, moves: 28, minChain: 3, gridW: 5, gridH: 8, blockers: [{ type: BLOCKER_TYPES.STONE, x: 2, y: 3 }], intro: "Stone blocks the way!" },
    { level: 16, target: 8300, tileScale: 2, moves: 27, minChain: 3, gridW: 5, gridH: 8, blockers: [{ type: BLOCKER_TYPES.STONE, x: 1, y: 4 }] },
    { level: 17, target: 8800, tileScale: 2, moves: 27, minChain: 3, gridW: 5, gridH: 8, blockers: [{ type: BLOCKER_TYPES.STONE, x: 3, y: 2 }] },
    { level: 18, target: 8050, tileScale: 2, moves: 26, minChain: 3, gridW: 5, gridH: 8, blockers: [{ type: BLOCKER_TYPES.STONE, x: 2, y: 4 }, { type: BLOCKER_TYPES.STONE, x: 2, y: 5 }] },
    { level: 19, target: 7750, tileScale: 2, moves: 26, minChain: 3, gridW: 5, gridH: 8, blockers: [{ type: BLOCKER_TYPES.STONE, x: 1, y: 3 }, { type: BLOCKER_TYPES.STONE, x: 3, y: 5 }] },
    { level: 20, target: 9150, tileScale: 2, moves: 25, minChain: 3, gridW: 5, gridH: 8, blockers: [{ type: BLOCKER_TYPES.STONE, x: 0, y: 4 }, { type: BLOCKER_TYPES.STONE, x: 4, y: 4 }] },
    { level: 21, target: 13600, tileScale: 4, moves: 28, minChain: 3, gridW: 5, gridH: 8, blockers: [{ type: BLOCKER_TYPES.STONE, x: 2, y: 2 }] },
    { level: 22, target: 13500, tileScale: 4, moves: 27, minChain: 3, gridW: 5, gridH: 8, blockers: [{ type: BLOCKER_TYPES.STONE, x: 1, y: 3 }] },
    { level: 23, target: 14800, tileScale: 4, moves: 27, minChain: 3, gridW: 5, gridH: 8, blockers: [{ type: BLOCKER_TYPES.STONE, x: 2, y: 4 }] },
    { level: 24, target: 13600, tileScale: 4, moves: 26, minChain: 3, gridW: 5, gridH: 8, blockers: [{ type: BLOCKER_TYPES.STONE, x: 1, y: 2 }, { type: BLOCKER_TYPES.STONE, x: 3, y: 5 }] },
    { level: 25, target: 18300, tileScale: 4, moves: 26, minChain: 3, gridW: 5, gridH: 8, blockers: [{ type: BLOCKER_TYPES.ICE, x: 2, y: 3, duration: 3 }], intro: "Ice thaws after 3 moves!" },

    // Min chain 4 levels (26-50)
    { level: 26, target: 23700, tileScale: 4, moves: 32, minChain: 4, gridW: 5, gridH: 8, blockers: [], intro: "Chains of 4+ required now!" },
    { level: 27, target: 23800, tileScale: 4, moves: 31, minChain: 4, gridW: 5, gridH: 8, blockers: [] },
    { level: 28, target: 21000, tileScale: 4, moves: 31, minChain: 4, gridW: 5, gridH: 8, blockers: [{ type: BLOCKER_TYPES.STONE, x: 2, y: 4 }] },
    { level: 29, target: 21600, tileScale: 4, moves: 30, minChain: 4, gridW: 5, gridH: 8, blockers: [{ type: BLOCKER_TYPES.STONE, x: 1, y: 3 }] },
    { level: 30, target: 22300, tileScale: 4, moves: 30, minChain: 4, gridW: 5, gridH: 8, blockers: [{ type: BLOCKER_TYPES.STONE, x: 2, y: 3 }, { type: BLOCKER_TYPES.ICE, x: 2, y: 5, duration: 4 }] },

    // Grid compression starts (31+)
    { level: 31, target: 33700, tileScale: 8, moves: 30, minChain: 4, gridW: 5, gridH: 7, blockers: [], intro: "The grid is smaller now!" },
    { level: 32, target: 29400, tileScale: 8, moves: 30, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 2, y: 3 }] },
    { level: 33, target: 29900, tileScale: 8, moves: 29, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 1, y: 2 }] },
    { level: 34, target: 32700, tileScale: 8, moves: 29, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 2, y: 4 }, { type: BLOCKER_TYPES.ICE, x: 3, y: 2, duration: 3 }] },
    { level: 35, target: 26700, tileScale: 8, moves: 28, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 1, y: 3 }, { type: BLOCKER_TYPES.STONE, x: 3, y: 4 }] },
    { level: 36, target: 37200, tileScale: 8, moves: 28, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 0, y: 3 }, { type: BLOCKER_TYPES.ICE, x: 4, y: 3, duration: 4 }] },
    { level: 37, target: 29900, tileScale: 8, moves: 27, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 2, y: 2 }, { type: BLOCKER_TYPES.STONE, x: 2, y: 4 }] },
    { level: 38, target: 34500, tileScale: 8, moves: 27, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 1, y: 3 }, { type: BLOCKER_TYPES.ICE, x: 3, y: 3, duration: 3 }] },
    { level: 39, target: 32500, tileScale: 8, moves: 26, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 2, y: 3 }, { type: BLOCKER_TYPES.STONE, x: 2, y: 5 }] },
    { level: 40, target: 47200, tileScale: 8, moves: 30, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.BOMB, x: 2, y: 3, timer: 8 }], intro: "Bombs explode! Merge them fast!" },

    // More challenging levels with bombs
    { level: 41, target: 53000, tileScale: 16, moves: 29, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 1, y: 2 }, { type: BLOCKER_TYPES.BOMB, x: 3, y: 4, timer: 7 }] },
    { level: 42, target: 67300, tileScale: 16, moves: 29, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.BOMB, x: 2, y: 3, timer: 8 }] },
    { level: 43, target: 60100, tileScale: 16, moves: 28, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 2, y: 2 }, { type: BLOCKER_TYPES.BOMB, x: 2, y: 5, timer: 7 }] },
    { level: 44, target: 74000, tileScale: 16, moves: 28, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.ICE, x: 1, y: 3, duration: 3 }, { type: BLOCKER_TYPES.BOMB, x: 3, y: 3, timer: 6 }] },
    { level: 45, target: 63900, tileScale: 16, moves: 27, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 0, y: 3 }, { type: BLOCKER_TYPES.STONE, x: 4, y: 3 }, { type: BLOCKER_TYPES.BOMB, x: 2, y: 4, timer: 8 }] },
    { level: 46, target: 71500, tileScale: 16, moves: 27, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 2, y: 2 }, { type: BLOCKER_TYPES.ICE, x: 2, y: 5, duration: 4 }] },
    { level: 47, target: 67800, tileScale: 16, moves: 26, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 1, y: 3 }, { type: BLOCKER_TYPES.BOMB, x: 3, y: 4, timer: 6 }] },
    { level: 48, target: 66400, tileScale: 16, moves: 26, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 2, y: 3 }, { type: BLOCKER_TYPES.STONE, x: 2, y: 4 }, { type: BLOCKER_TYPES.ICE, x: 1, y: 5, duration: 3 }] },
    { level: 49, target: 63100, tileScale: 16, moves: 25, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 1, y: 2 }, { type: BLOCKER_TYPES.STONE, x: 3, y: 5 }, { type: BLOCKER_TYPES.BOMB, x: 2, y: 3, timer: 7 }] },
    { level: 50, target: 75900, tileScale: 16, moves: 28, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 0, y: 3 }, { type: BLOCKER_TYPES.STONE, x: 4, y: 3 }, { type: BLOCKER_TYPES.BOMB, x: 2, y: 2, timer: 6 }, { type: BLOCKER_TYPES.BOMB, x: 2, y: 5, timer: 8 }] },

    // Level 51 ("split-channel"): the first level admitted through the
    // authoring tracer (BL-0004) rather than hand-set. Target is 70% of the
    // measured achievable score (300-seed holdout: 297 wins, 0 lockouts, 0
    // bombs) instead of a guess. Owner-approved after playing the same seed
    // three times: two different winning strategies (12 moves/127,040 and
    // 14 moves/130,496), which is the signal that made it worth shipping
    // over just being winnable.
    { level: 51, target: 124000, tileScale: 32, moves: 24, minChain: 4, gridW: 5, gridH: 7, blockers: [] },

    // Level 52 ("stone-gate"): Level 51's shape with a single stone at (2,3),
    // splitting the board's middle. Target is 70% of the measured achievable
    // score (300-seed holdout: 290 wins, 0 lockouts, 0 bombs), same derivation
    // as 51. The owner played and won it -- 124,864 in 15 moves, replay
    // verified.
    //
    // Its target was derived under the bot as it stood before RESULT-0011, so
    // it is held at the value it was admitted and playtested with rather than
    // re-derived against the stronger bot. See RESULT-0012.
    { level: 52, target: 102000, tileScale: 32, moves: 24, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: BLOCKER_TYPES.STONE, x: 2, y: 3 }] },

    // Level 53 ("gen-0014-wide-sprint"): the first board wider than five
    // columns -- 6x5 -- and the shortest, 16 moves against a shipped minimum
    // of 22 everywhere else. Target 101000 is the bot's measured median
    // (107,200) times a 0.95 demand, rounded down -- receipt 043ca53f, which
    // verifies against the current bot. That demand is recorded as a
    // provisional proposal and sits well above the 70% that set 51 and 52.
    // Holdout of 300 seeds: 191 wins, 0 lockouts, 0 bombs.
    //
    // The owner played it three times and won three times, replay verified:
    // 101,120 in 13 moves (seed 2), 110,208 in 13 (seed 10), 105,216 in 12
    // (seed 10) -- never using more than 13 of the 16.
    //
    // minChain is 3: the first time the chain requirement steps back down
    // since level 11 raised it. Shipped exactly as authored.
    { level: 53, target: 101000, tileScale: 32, moves: 16, minChain: 3, gridW: 6, gridH: 5, blockers: [] },
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

function makeSeededRng(seed) {
    let state = seed >>> 0;
    const rng = function () {
        state |= 0;
        state = (state + 0x6d2b79f5) | 0;
        let value = Math.imul(state ^ (state >>> 15), 1 | state);
        value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
    rng.getState = () => state >>> 0;
    rng.setState = (nextState) => {
        state = nextState >>> 0;
    };
    return rng;
}

// A level that names a seed is ONE FIXED BOARD - the same board for every
// player and every attempt. A level without one draws a fresh board each time,
// which is how every level shipped before this and what the unseeded levels
// still do.
//
// This is what makes "this level is hard" a statement about the level rather
// than about the draw. Measured on the generated candidates: for one fixed
// shape, the number of distinct opening moves ranged from 124 to 1363 across
// seeds, while two genuinely different shapes sat at 536 and 467. The board
// mattered about ten times more than the design, so anything tuned across
// random draws was tuning against noise.
//
// The tradeoff is real and deliberate: a fixed board cannot be re-rolled by
// losing and retrying, so a player who is stuck stays stuck on that board.
function rngForLevel(levelData) {
    return Number.isInteger(levelData.seed) ? makeSeededRng(levelData.seed) : Math.random;
}

function requirePlayableInteger(value, name, minimum, maximum) {
    if (!Number.isInteger(value) || value < minimum || value > maximum) {
        throw new Error(`${name} must be an integer from ${minimum} to ${maximum}`);
    }
}

function playableTileScale(levelData) {
    return Object.hasOwn(levelData, 'tileScale') ? levelData.tileScale : 1;
}

function validatePlayableLevel(levelData) {
    if (!levelData || typeof levelData !== 'object' || Array.isArray(levelData)) {
        throw new Error('level must be an object');
    }
    requirePlayableInteger(levelData.level, 'level', 1, 9999);
    requirePlayableInteger(levelData.target, 'target', 1, Number.MAX_SAFE_INTEGER);
    requirePlayableInteger(playableTileScale(levelData), 'tileScale', 1, Number.MAX_SAFE_INTEGER);
    requirePlayableInteger(levelData.moves, 'moves', 1, 999);
    requirePlayableInteger(levelData.minChain, 'minChain', 2, 20);
    requirePlayableInteger(levelData.gridW, 'gridW', 2, 12);
    requirePlayableInteger(levelData.gridH, 'gridH', 2, 12);
    // Optional: a level without a seed draws a fresh board each attempt, which
    // is what every level did before fixed boards existed.
    if (Object.hasOwn(levelData, 'seed')) requirePlayableInteger(levelData.seed, 'seed', 0, 0xffffffff);
    if (!Array.isArray(levelData.blockers)) throw new Error('blockers must be an array');
    levelData.blockers.forEach((blocker) => {
        if (!blocker || !Object.values(BLOCKER_TYPES).includes(blocker.type)) throw new Error('blocker type is invalid');
        requirePlayableInteger(blocker.x, 'blocker x', 0, levelData.gridW - 1);
        requirePlayableInteger(blocker.y, 'blocker y', 0, levelData.gridH - 1);
        if (blocker.type === BLOCKER_TYPES.ICE) requirePlayableInteger(blocker.duration, 'ice duration', 1, 100);
        if (blocker.type === BLOCKER_TYPES.BOMB) requirePlayableInteger(blocker.timer, 'bomb timer', 1, 100);
    });
    return levelData;
}

function createInitialGrid(levelData, rng) {
    validatePlayableLevel(levelData);
    const tileScale = playableTileScale(levelData);
    const grid = [];
    for (let row = 0; row < levelData.gridH; row++) {
        grid[row] = [];
        for (let col = 0; col < levelData.gridW; col++) {
            const rand = rng();
            let value;
            if (rand < 0.5) value = 2;
            else if (rand < 0.8) value = 4;
            else if (rand < 0.95) value = 8;
            else value = 16;
            grid[row][col] = new Tile(col, row, value * tileScale);
        }
    }
    levelData.blockers.forEach((blocker) => {
        const tile = grid[blocker.y][blocker.x];
        if (blocker.type === BLOCKER_TYPES.STONE) {
            tile.value = 0;
            tile.setBlocker(BLOCKER_TYPES.STONE);
        } else if (blocker.type === BLOCKER_TYPES.ICE) {
            tile.setBlocker(BLOCKER_TYPES.ICE, blocker.duration);
        } else if (blocker.type === BLOCKER_TYPES.BOMB) {
            tile.setBlocker(BLOCKER_TYPES.BOMB, 0, blocker.timer);
        }
    });
    return grid;
}

function chainMultiplierForLength(length) {
    if (length >= 9) return 5;
    if (length >= 7) return 3;
    if (length >= 5) return 2;
    if (length >= 3) return 1.5;
    return 1;
}

function describeChainFeedback(values, minChain, tileScale = 1) {
    const selected = values.map(Number);
    const resultTile = selected.reduce((sum, value) => sum + value, 0);
    const multiplier = chainMultiplierForLength(selected.length);
    const legalValues = selected.length < 2 || (
        selected[0] === selected[1] &&
        selected.slice(2).every((value, index) => {
            const previous = selected[index + 1];
            return value === previous || value === previous * 2;
        })
    );
    const scaleRatio = resultTile / tileScale;
    const isPowerOfTwo = Number.isInteger(scaleRatio) && scaleRatio > 0 &&
        (scaleRatio & (scaleRatio - 1)) === 0;

    return {
        values: selected,
        resultTile,
        multiplier,
        projectedPoints: Math.floor(resultTile * multiplier),
        ready: legalValues && selected.length >= minChain,
        futureMatchability: isPowerOfTwo ? 'matchable' : 'off-lattice',
    };
}

class AuthoringCapture {
    constructor({ candidateIdentity, candidateLevel, seed, submit = () => {} }) {
        this.candidateIdentity = candidateIdentity;
        this.candidateLevel = candidateLevel;
        this.seed = seed;
        this.submit = submit;
        this.chains = [];
        this.finished = false;
    }

    recordChain(tiles, points) {
        this.chains.push({
            tiles: tiles.map(({ x, y, value }) => ({ x, y, value })),
            points,
        });
    }

    finish({ outcome, reason, score, movesUsed }) {
        if (this.finished) return false;
        this.finished = true;
        this.submit({
            schemaVersion: 1,
            candidateIdentity: this.candidateIdentity,
            candidateLevel: this.candidateLevel,
            seed: this.seed,
            outcome,
            reason,
            score,
            movesUsed,
            chains: this.chains,
        });
        return true;
    }
}

const PLAYER_STUDY_STORAGE_KEY = '2248.playerStudy.v1';

function cloneStudyData(value) {
    return JSON.parse(JSON.stringify(value));
}

function snapshotBoard(grid) {
    return grid.map((row) => row.map((tile) => {
        if (!tile) return null;
        return {
            x: tile.x,
            y: tile.y,
            value: tile.value,
            blocker: tile.blocker,
            blockerDuration: tile.blockerDuration,
            bombTimer: tile.bombTimer,
        };
    }));
}

class PlayerStudy {
    constructor({ storage, now = Date.now, storageKey = PLAYER_STUDY_STORAGE_KEY } = {}) {
        this.storage = storage;
        this.now = now;
        this.storageKey = storageKey;
        this.recording = false;
        this.study = this.load();
    }

    load() {
        if (!this.storage) return { schemaVersion: 1, moves: [] };
        try {
            const parsed = JSON.parse(this.storage.getItem(this.storageKey) || 'null');
            if (parsed && parsed.schemaVersion === 1 && Array.isArray(parsed.moves)) {
                return cloneStudyData(parsed);
            }
        } catch (_error) {
            // A malformed local value is ignored; recording remains off.
        }
        return { schemaVersion: 1, moves: [] };
    }

    persist() {
        if (this.storage) this.storage.setItem(this.storageKey, JSON.stringify(this.study));
    }

    start() {
        this.recording = true;
    }

    stop() {
        this.recording = false;
    }

    isRecording() {
        return this.recording;
    }

    recordMove({ chain, boardBefore, boardAfter, context }) {
        if (!this.recording) return false;
        this.study.moves.push(cloneStudyData({
            ordinal: this.study.moves.length + 1,
            recordedAt: new Date(this.now()).toISOString(),
            chain: chain.map(({ x, y, value }) => ({ x, y, value })),
            boardBefore,
            boardAfter,
            context,
        }));
        this.persist();
        return true;
    }

    truncate(moveCount) {
        this.study.moves.length = Math.max(0, Math.min(moveCount, this.study.moves.length));
        if (this.study.moves.length === 0) {
            if (this.storage) this.storage.removeItem(this.storageKey);
        } else {
            this.persist();
        }
    }

    getStudy() {
        return cloneStudyData(this.study);
    }

    exportJson() {
        return `${JSON.stringify(this.study, null, 2)}\n`;
    }

    clear() {
        this.recording = false;
        this.study = { schemaVersion: 1, moves: [] };
        if (this.storage) this.storage.removeItem(this.storageKey);
    }
}

// ============================================================================
// GAME CLASS
// ============================================================================

class Game {
    constructor(canvas, options = {}) {
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
        this.random = Math.random;
        this.authoringCapture = null;
        this.customSession = null;
        this.playerStudy = new PlayerStudy({ storage: localStorage });

        // History for undo
        this.history = [];
        this.maxHistory = 10;

        // Animation
        this.animating = false;
        this.animations = [];

        // Unlocked levels
        this.unlockedLevel = parseInt(localStorage.getItem('unlockedLevel')) || 1;

        this.setupCanvas();
        this.setupEventListeners();
        if (options.customSession) this.startCustomLevel(options.customSession);
        else this.loadLevel(this.currentLevel);
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
        // Click (or tap) a tile to add it to the chain
        this.canvas.addEventListener('click', (e) => this.handleTileClick(e.clientX, e.clientY));
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleTileClick(touch.clientX, touch.clientY);
        });

        // Enter submits the chain, Escape clears it
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.submitChain();
            } else if (e.key === 'Escape') {
                this.clearChain();
            }
        });

        // Button events
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('restartBtn').addEventListener('click', () => this.reloadCurrentLevel());
        document.getElementById('menuBtn').addEventListener('click', () => this.showLevelSelect());
        document.getElementById('submitBtn').addEventListener('click', () => this.submitChain());
        document.getElementById('nextLevelBtn').addEventListener('click', () => this.nextLevel());
        document.getElementById('retryBtn').addEventListener('click', () => this.reloadCurrentLevel());
        document.getElementById('gameOverMenuBtn').addEventListener('click', () => {
            this.hideModal('gameOverModal');
            this.showLevelSelect();
        });
        document.getElementById('closeLevelSelect').addEventListener('click', () => this.hideModal('levelSelectModal'));
        document.getElementById('recordToggleBtn').addEventListener('click', () => this.togglePlayerRecording());
        document.getElementById('reviewStudyBtn').addEventListener('click', () => this.showPlayerStudy());
        document.getElementById('exportStudyBtn').addEventListener('click', () => this.exportPlayerStudy());
        document.getElementById('clearStudyBtn').addEventListener('click', () => this.clearPlayerStudy());
        document.getElementById('closeStudyBtn').addEventListener('click', () => this.hideModal('playReviewModal'));
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

    handleTileClick(clientX, clientY) {
        if (this.animating || this.gameOver || this.levelComplete) return;

        const pos = this.getGridPos(clientX, clientY);
        if (!pos) return;

        const tile = this.grid[pos.row][pos.col];
        if (!tile || tile.isBlocked()) return;

        // Tapping the tile just before the last one steps the chain back,
        // so a misclick can be corrected with one more click instead of
        // clearing the whole chain.
        const existingIndex = this.chain.findIndex(t => t === tile);
        if (existingIndex !== -1) {
            if (existingIndex === this.chain.length - 2) {
                const removed = this.chain.pop();
                removed.selected = false;
                this.updateChainIndicator();
                this.render();
            }
            return;
        }

        if (this.chain.length === 0) {
            this.chain = [tile];
            tile.selected = true;
            this.updateChainIndicator();
            this.render();
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

    submitChain() {
        if (this.animating || this.gameOver || this.levelComplete) return;
        if (this.chain.length === 0) return;

        if (this.isValidChain()) {
            this.executeChain();
        } else {
            this.clearChain();
        }
    }

    clearChain() {
        this.chain.forEach(t => t.selected = false);
        this.chain = [];
        this.updateChainIndicator();
        this.render();
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
        return chainMultiplierForLength(this.chain.length);
    }

    executeChain() {
        const feedback = describeChainFeedback(
            this.chain.map((tile) => tile.value),
            this.minChain,
            this.tileScale,
        );
        const playerMove = this.playerStudy.isRecording() ? {
            chain: this.chain.map(({ x, y, value }) => ({ x, y, value })),
            boardBefore: snapshotBoard(this.grid),
            context: {
                level: this.currentLevel,
                targetScore: this.targetScore,
                minChain: this.minChain,
                moveNumber: this.moves + 1,
                moveBudget: this.maxMoves,
                scoreBefore: this.score,
                scoreAfter: this.score + feedback.projectedPoints,
                resultTile: feedback.resultTile,
                multiplier: feedback.multiplier,
                projectedPoints: feedback.projectedPoints,
                futureMatchability: feedback.futureMatchability,
            },
        } : null;

        // Save state for undo
        this.saveState();

        const chainValue = this.calculateChainValue();
        const multiplier = this.getChainMultiplier();
        const points = Math.floor(chainValue * multiplier);

        if (this.authoringCapture) this.authoringCapture.recordChain(this.chain, points);

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
            if (playerMove) {
                this.playerStudy.recordMove({ ...playerMove, boardAfter: snapshotBoard(this.grid) });
                this.updatePlayerStudyUI();
            }
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
                    const rand = this.random();
                    let value;
                    if (rand < 0.6) value = 2;
                    else if (rand < 0.9) value = 4;
                    else value = 8;

                    const tile = new Tile(col, row, value * this.tileScale);
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
                    this.finishAuthoring('lose', 'bomb exploded');
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
            this.finishAuthoring('win', 'target reached');
            this.showLevelComplete();
            return;
        }

        // Check lose (out of moves)
        if (this.moves >= this.maxMoves) {
            this.gameOver = true;
            this.finishAuthoring('lose', 'out of moves');
            this.showGameOver('Out of moves!');
            return;
        }

        // Check if any valid moves exist
        if (!this.hasValidMoves()) {
            this.gameOver = true;
            this.finishAuthoring('lose', 'no valid moves');
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

    initializeLevel(levelData, rng, authoringCapture = null) {
        validatePlayableLevel(levelData);

        this.currentLevel = levelData.level;
        this.gridWidth = levelData.gridW;
        this.gridHeight = levelData.gridH;
        this.targetScore = levelData.target;
        this.maxMoves = levelData.moves;
        this.minChain = levelData.minChain;
        // Every tile value on this level is multiplied by this. Chains match on
        // equal-or-double and merges sum, so a uniform scale plays identically
        // and multiplies every score by the same factor - it is what lets later
        // chapters deal 16/32/64 and carry targets that keep climbing.
        this.tileScale = playableTileScale(levelData);
        this.random = rng;
        this.authoringCapture = authoringCapture;

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

        this.grid = createInitialGrid(levelData, rng);

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

    loadLevel(levelNum) {
        this.customSession = null;
        const levelData = LEVELS.find(l => l.level === levelNum) || LEVELS[0];
        this.initializeLevel(levelData, rngForLevel(levelData));
    }

    startCustomLevel(session) {
        this.customSession = session;
        const capture = new AuthoringCapture({
            candidateIdentity: session.candidateIdentity,
            candidateLevel: session.levelData.level,
            seed: session.seed,
            submit: (payload) => this.submitRecording(payload),
        });
        this.initializeLevel(session.levelData, makeSeededRng(session.seed), capture);
        this.updateAuthoringStatus(`Candidate ${session.levelData.level} · seed ${session.seed} · ready`);
    }

    reloadCurrentLevel() {
        if (this.customSession) this.startCustomLevel(this.customSession);
        else this.loadLevel(this.currentLevel);
    }

    finishAuthoring(outcome, reason) {
        if (!this.authoringCapture) return;
        this.authoringCapture.finish({ outcome, reason, score: this.score, movesUsed: this.moves });
    }

    async submitRecording(payload) {
        this.updateAuthoringStatus('Saving playthrough…');
        try {
            const response = await fetch('/api/recordings', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
            this.updateAuthoringStatus(`Recording ${result.status}: ${result.recordingIdentity.slice(0, 12)}`);
        } catch (error) {
            this.updateAuthoringStatus(`Recording failed: ${error.message}`);
        }
    }

    updateAuthoringStatus(message) {
        const status = document.getElementById('authoringStatus');
        if (status) status.textContent = message;
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
            bestChain: this.bestChain,
            authoringCaptureLength: this.authoringCapture ? this.authoringCapture.chains.length : null,
            playerStudyMoveCount: this.playerStudy ? this.playerStudy.getStudy().moves.length : null,
            randomState: typeof this.random.getState === 'function' ? this.random.getState() : null
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
        if (this.authoringCapture && Number.isInteger(state.authoringCaptureLength)) {
            this.authoringCapture.chains.length = state.authoringCaptureLength;
        }
        if (this.playerStudy && Number.isInteger(state.playerStudyMoveCount)) {
            this.playerStudy.truncate(state.playerStudyMoveCount);
        }
        if (state.randomState !== null && typeof this.random.setState === 'function') {
            this.random.setState(state.randomState);
        }
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

    togglePlayerRecording() {
        if (this.playerStudy.isRecording()) this.playerStudy.stop();
        else this.playerStudy.start();
        this.updatePlayerStudyUI();
    }

    updatePlayerStudyUI() {
        const button = document.getElementById('recordToggleBtn');
        const status = document.getElementById('recordingStatus');
        if (!button || !status) return;
        const moveCount = this.playerStudy.getStudy().moves.length;
        const active = this.playerStudy.isRecording();
        button.textContent = active ? 'Stop recording' : 'Start recording';
        button.setAttribute('aria-pressed', String(active));
        button.classList.toggle('recording-active', active);
        status.textContent = `${active ? 'Recording' : 'Off'} · ${moveCount} move${moveCount === 1 ? '' : 's'} saved locally`;
    }

    showPlayerStudy() {
        const review = document.getElementById('studyReviewContent');
        const moves = this.playerStudy.getStudy().moves;
        review.textContent = moves.length === 0
            ? 'No recorded moves yet.'
            : `${moves.length} recorded move${moves.length === 1 ? '' : 's'} ready to export.`;
        this.showModal('playReviewModal');
    }

    exportPlayerStudy() {
        const blob = new Blob([this.playerStudy.exportJson()], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = '2248-player-study.json';
        link.click();
        URL.revokeObjectURL(url);
    }

    clearPlayerStudy() {
        if (!window.confirm('Clear every locally recorded move?')) return;
        this.playerStudy.clear();
        this.updatePlayerStudyUI();
        this.showPlayerStudy();
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
        this.updatePlayerStudyUI();
    }

    updateChainIndicator() {
        const indicator = document.getElementById('chainIndicator');
        const text = document.getElementById('chainText');

        if (this.chain.length === 0) {
            indicator.style.display = 'none';
            return;
        }

        indicator.style.display = 'block';
        const feedback = describeChainFeedback(
            this.chain.map((tile) => tile.value),
            this.minChain,
            this.tileScale,
        );
        const readiness = feedback.ready
            ? 'Ready'
            : `Building (${Math.max(0, this.minChain - this.chain.length)} more)`;
        text.className = feedback.ready ? 'chain-valid' : 'chain-invalid';
        text.textContent = [
            `Selected ${feedback.values.join(' + ')}`,
            `Result tile ${feedback.resultTile}`,
            `Multiplier ×${feedback.multiplier}`,
            `Projected ${feedback.projectedPoints} points`,
            readiness,
            `Future ${feedback.futureMatchability}`,
        ].join(' · ');
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

/**
 * Which level `?level=N` asks for, or null if it asks for nothing usable.
 *
 * Refuses rather than clamps. Dropping someone onto level 1 after they typed
 * `?level=51` would look exactly like the jump working, and they would spend
 * the next minute wondering why level 51 looks like a tutorial.
 */
function levelFromQuery(search, levelCount) {
    const raw = new URLSearchParams(search).get('level');
    if (raw === null || raw.trim() === '') return null;
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 1 || n > levelCount) return null;
    return n;
}

function customCandidateFromQuery(search) {
    const query = new URLSearchParams(search);
    const candidateRaw = query.get('candidate');
    const seedRaw = query.get('seed');
    if (candidateRaw === null || seedRaw === null || candidateRaw.trim() === '' || seedRaw.trim() === '') return null;
    const level = Number(candidateRaw);
    const seed = Number(seedRaw);
    if (!Number.isInteger(level) || level < 1 || level > 9999) return null;
    if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) return null;
    return { level, seed };
}

async function startBrowserGame() {
    const canvas = document.getElementById('gameCanvas');
    const custom = customCandidateFromQuery(window.location.search);
    let game;
    if (custom) {
        const response = await fetch(`/api/candidates/${custom.level}`);
        if (!response.ok) throw new Error(`Candidate ${custom.level} could not be loaded (HTTP ${response.status})`);
        const result = await response.json();
        validatePlayableLevel(result.candidate);
        if (result.candidate.level !== custom.level || !/^[a-f0-9]{64}$/.test(result.candidateIdentity || '')) {
            throw new Error('Candidate response identity is invalid');
        }
        game = new Game(canvas, {
            customSession: {
                levelData: result.candidate,
                candidateIdentity: result.candidateIdentity,
                seed: custom.seed,
            },
        });
    } else {
        game = new Game(canvas);
    }

    // The console and any recording tool need a handle on the running game.
    // Without this it is block-scoped and unreachable, which is why the debug
    // page's `typeof game` check has always reported "undefined".
    window.game = game;

    // `?level=26` opens a level directly, past the unlock gate. Unlocking up
    // to it as well, so the level picker agrees with where you actually are.
    const jump = custom ? null : levelFromQuery(window.location.search, LEVELS.length);
    if (jump !== null && jump !== game.currentLevel) {
        game.unlockedLevel = Math.max(game.unlockedLevel, jump);
        game.loadLevel(jump);
    }
}

if (typeof document !== 'undefined') {
    startBrowserGame().catch((error) => {
        const status = document.getElementById('authoringStatus');
        if (status) status.textContent = `Authoring failed: ${error.message}`;
        console.error(error);
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        LEVELS,
        BLOCKER_TYPES,
        AuthoringCapture,
        Game,
        PlayerStudy,
        describeChainFeedback,
        createInitialGrid,
        customCandidateFromQuery,
        levelFromQuery,
        makeSeededRng,
        rngForLevel,
        validatePlayableLevel,
    };
}
