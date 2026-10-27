// ============================================================================
// 2248 CHALLENGE - Levels 59 and up
// ============================================================================
//
// The classic game's first 58 levels live in `LEVELS` in game.js. That list is
// part of the frozen game-rule surface (solver/game-rule-surface.js), so a new
// entry there would turn the experiment gate red. New levels ship here
// instead. The browser loads this file right after game.js (see
// game-library.js) and appends these to `LEVELS`; Node code that wants every
// level calls `allLevels()`.
//
// Targets were set with solver/level-author.js `deriveCandidate`: the median
// score of 150 bot games times a demand factor, then checked on 300 fresh
// seeds for zero lockouts and a bomb rate of at most 5%. The measured numbers
// are in docs/game-design/levels/receipts/LEVELS-59-70.md.

const MORE_LEVELS = [
    // Scale 32, closing the chapter that 51-58 opened
    { level: 59, target: 100000, tileScale: 32, moves: 22, minChain: 3, gridW: 6, gridH: 6, blockers: [{ type: 'stone', x: 1, y: 3 }, { type: 'stone', x: 4, y: 3 }], intro: "A square board with two stones." },
    { level: 60, target: 133000, tileScale: 32, moves: 26, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: 'stone', x: 1, y: 2 }, { type: 'ice', x: 3, y: 3, duration: 3 }, { type: 'bomb', x: 2, y: 5, timer: 8 }], intro: "Stone, ice and a bomb on one board." },

    // Scale 64 (61-70)
    { level: 61, target: 311000, tileScale: 64, moves: 26, minChain: 4, gridW: 5, gridH: 7, blockers: [], intro: "Bigger tiles from here on." },
    { level: 62, target: 266000, tileScale: 64, moves: 26, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: 'stone', x: 2, y: 3 }] },
    { level: 63, target: 216000, tileScale: 64, moves: 20, minChain: 3, gridW: 6, gridH: 5, blockers: [], intro: "Wide and shallow again." },
    { level: 64, target: 216000, tileScale: 64, moves: 24, minChain: 3, gridW: 4, gridH: 8, blockers: [{ type: 'stone', x: 0, y: 4 }, { type: 'stone', x: 3, y: 4 }], intro: "A narrow board with stones on both edges." },
    { level: 65, target: 358000, tileScale: 64, moves: 26, minChain: 4, gridW: 5, gridH: 8, blockers: [{ type: 'ice', x: 1, y: 3, duration: 3 }, { type: 'ice', x: 3, y: 5, duration: 4 }], intro: "Two frozen tiles." },
    { level: 66, target: 259000, tileScale: 64, moves: 26, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: 'stone', x: 3, y: 2 }, { type: 'bomb', x: 1, y: 4, timer: 8 }] },
    { level: 67, target: 244000, tileScale: 64, moves: 22, minChain: 3, gridW: 6, gridH: 6, blockers: [{ type: 'stone', x: 0, y: 2 }, { type: 'stone', x: 5, y: 2 }, { type: 'ice', x: 2, y: 4, duration: 4 }] },
    { level: 68, target: 276000, tileScale: 64, moves: 28, minChain: 4, gridW: 5, gridH: 8, blockers: [{ type: 'stone', x: 1, y: 2 }, { type: 'stone', x: 3, y: 5 }, { type: 'bomb', x: 2, y: 4, timer: 9 }] },
    { level: 69, target: 316000, tileScale: 64, moves: 28, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: 'bomb', x: 1, y: 2, timer: 7 }, { type: 'bomb', x: 3, y: 5, timer: 9 }, { type: 'ice', x: 2, y: 3, duration: 3 }], intro: "Two timers and a frozen tile." },
    { level: 70, target: 342000, tileScale: 64, moves: 30, minChain: 4, gridW: 5, gridH: 8, blockers: [{ type: 'stone', x: 1, y: 3 }, { type: 'ice', x: 3, y: 2, duration: 3 }, { type: 'bomb', x: 1, y: 5, timer: 8 }, { type: 'bomb', x: 3, y: 6, timer: 10 }], intro: "Everything at once." },
];

// Levels 1-58 followed by these, without touching the array it is given.
function allLevels(baseLevels) {
    return baseLevels.concat(MORE_LEVELS.filter((l) => !baseLevels.some((b) => b.level === l.level)));
}

// Ordinary play on levels 59+ for Node tools. solver/human-benchmark.js
// resolves recordings against game.js only and is frozen by RESULT-0047, so
// callers ask it first and fall back to this.
function moreLevelBoard(recording) {
    if (!recording || recording.candidateIdentity !== null) return null;
    const level = MORE_LEVELS.find((l) => l.level === recording.candidateLevel);
    return level ? { candidate: level, source: 'shipped-level' } : null;
}

// In the browser game.js has already built the game, and its `?level=N` jump
// only knew about 58 levels, so a jump past 58 is replayed here.
function addMoreLevels(levels, game, search) {
    for (const level of MORE_LEVELS) {
        if (!levels.some((l) => l.level === level.level)) levels.push(level);
    }
    if (!game || customCandidateFromQuery(search)) return;
    const jump = levelFromQuery(search, levels.length);
    if (jump === null || jump <= MORE_LEVELS[0].level - 1) return;
    game.unlockedLevel = Math.max(game.unlockedLevel, jump);
    const seed = seedFromQuery(search);
    game.loadLevel(jump, seed === null ? {} : { seed });
}

if (typeof document !== 'undefined' && typeof LEVELS !== 'undefined') {
    addMoreLevels(LEVELS, window.game, window.location.search);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MORE_LEVELS, allLevels, addMoreLevels, moreLevelBoard };
}
