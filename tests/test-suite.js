// ============================================================================
// 2248 CHALLENGE - BROWSER CONSOLE TEST SUITE
// ============================================================================
// Copy-paste this entire script into the browser console to run all tests
// ============================================================================

(function() {
    console.log('🧪 Starting 2248 Challenge Test Suite...\n');

    let testsPassed = 0;
    let testsFailed = 0;

    // Helper function to run a test
    function test(name, fn) {
        try {
            fn();
            console.log(`✅ PASS: ${name}`);
            testsPassed++;
        } catch (error) {
            console.error(`❌ FAIL: ${name}`);
            console.error(`   Error: ${error.message}`);
            testsFailed++;
        }
    }

    // Helper function to assert equality
    function assertEqual(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`Expected ${expected}, got ${actual}. ${message}`);
        }
    }

    // Helper function to assert truthy
    function assertTrue(value, message = '') {
        if (!value) {
            throw new Error(`Expected truthy value, got ${value}. ${message}`);
        }
    }

    // Helper function to assert falsy
    function assertFalse(value, message = '') {
        if (value) {
            throw new Error(`Expected falsy value, got ${value}. ${message}`);
        }
    }

    // ========================================================================
    // TEST SUITE 1: CHAIN CREATION AND VALIDATION
    // ========================================================================
    console.log('\n📊 TEST SUITE 1: Chain Creation and Validation');
    console.log('━'.repeat(60));

    test('Valid chain with 2 matching tiles', () => {
        // Create two tiles with same value
        const tile1 = new Tile(0, 0, 4);
        const tile2 = new Tile(1, 0, 4);

        game.chain = [tile1, tile2];
        game.minChain = 2;

        assertTrue(game.isValidChain(), 'Chain of 2 matching tiles should be valid');
    });

    test('Valid chain with 3 matching tiles', () => {
        const tile1 = new Tile(0, 0, 2);
        const tile2 = new Tile(1, 0, 2);
        const tile3 = new Tile(2, 0, 2);

        game.chain = [tile1, tile2, tile3];
        game.minChain = 2;

        assertTrue(game.isValidChain(), 'Chain of 3 matching tiles should be valid');
    });

    test('Valid chain with doubling progression (2,2,4,8)', () => {
        const tile1 = new Tile(0, 0, 2);
        const tile2 = new Tile(1, 0, 2);
        const tile3 = new Tile(2, 0, 4);
        const tile4 = new Tile(3, 0, 8);

        game.chain = [tile1, tile2, tile3, tile4];
        game.minChain = 2;

        assertTrue(game.isValidChain(), 'Chain with doubling progression should be valid');
    });

    test('Invalid chain: only 1 tile when minChain is 2', () => {
        const tile1 = new Tile(0, 0, 2);

        game.chain = [tile1];
        game.minChain = 2;

        assertFalse(game.isValidChain(), 'Single tile should be invalid when minChain is 2');
    });

    test('Invalid chain: 2 tiles when minChain is 3', () => {
        const tile1 = new Tile(0, 0, 4);
        const tile2 = new Tile(1, 0, 4);

        game.chain = [tile1, tile2];
        game.minChain = 3;

        assertFalse(game.isValidChain(), 'Chain of 2 should be invalid when minChain is 3');
    });

    test('Invalid chain: first two tiles do not match', () => {
        const tile1 = new Tile(0, 0, 2);
        const tile2 = new Tile(1, 0, 4);

        game.chain = [tile1, tile2];
        game.minChain = 2;

        assertFalse(game.isValidChain(), 'Chain must start with two matching tiles');
    });

    test('Calculate chain value: sum of all tiles', () => {
        const tile1 = new Tile(0, 0, 2);
        const tile2 = new Tile(1, 0, 2);
        const tile3 = new Tile(2, 0, 4);

        game.chain = [tile1, tile2, tile3];

        const sum = game.calculateChainValue();
        assertEqual(sum, 8, 'Chain value should be 2 + 2 + 4 = 8');
    });

    test('Calculate chain value: larger values', () => {
        const tile1 = new Tile(0, 0, 8);
        const tile2 = new Tile(1, 0, 8);
        const tile3 = new Tile(2, 0, 16);
        const tile4 = new Tile(3, 0, 32);

        game.chain = [tile1, tile2, tile3, tile4];

        const sum = game.calculateChainValue();
        assertEqual(sum, 64, 'Chain value should be 8 + 8 + 16 + 32 = 64');
    });

    // ========================================================================
    // TEST SUITE 2: SCORING SYSTEM
    // ========================================================================
    console.log('\n📊 TEST SUITE 2: Scoring System');
    console.log('━'.repeat(60));

    test('Chain multiplier: length 2 = 1x', () => {
        game.chain = [new Tile(0, 0, 2), new Tile(1, 0, 2)];
        const multiplier = game.getChainMultiplier();
        assertEqual(multiplier, 1, 'Chain of 2 should have 1x multiplier');
    });

    test('Chain multiplier: length 3 = 1.5x', () => {
        game.chain = [new Tile(0, 0, 2), new Tile(1, 0, 2), new Tile(2, 0, 2)];
        const multiplier = game.getChainMultiplier();
        assertEqual(multiplier, 1.5, 'Chain of 3 should have 1.5x multiplier');
    });

    test('Chain multiplier: length 4 = 1.5x', () => {
        const tiles = [
            new Tile(0, 0, 2),
            new Tile(1, 0, 2),
            new Tile(2, 0, 2),
            new Tile(3, 0, 2)
        ];
        game.chain = tiles;
        const multiplier = game.getChainMultiplier();
        assertEqual(multiplier, 1.5, 'Chain of 4 should have 1.5x multiplier');
    });

    test('Chain multiplier: length 5 = 2x', () => {
        const tiles = [];
        for (let i = 0; i < 5; i++) {
            tiles.push(new Tile(i, 0, 2));
        }
        game.chain = tiles;
        const multiplier = game.getChainMultiplier();
        assertEqual(multiplier, 2, 'Chain of 5 should have 2x multiplier');
    });

    test('Chain multiplier: length 7 = 3x', () => {
        const tiles = [];
        for (let i = 0; i < 7; i++) {
            tiles.push(new Tile(i, 0, 2));
        }
        game.chain = tiles;
        const multiplier = game.getChainMultiplier();
        assertEqual(multiplier, 3, 'Chain of 7 should have 3x multiplier');
    });

    test('Chain multiplier: length 9 = 5x', () => {
        const tiles = [];
        for (let i = 0; i < 9; i++) {
            tiles.push(new Tile(i % 5, Math.floor(i / 5), 2));
        }
        game.chain = tiles;
        const multiplier = game.getChainMultiplier();
        assertEqual(multiplier, 5, 'Chain of 9 should have 5x multiplier');
    });

    test('Chain multiplier: length 10+ = 5x', () => {
        const tiles = [];
        for (let i = 0; i < 12; i++) {
            tiles.push(new Tile(i % 5, Math.floor(i / 5), 2));
        }
        game.chain = tiles;
        const multiplier = game.getChainMultiplier();
        assertEqual(multiplier, 5, 'Chain of 12 should have 5x multiplier');
    });

    test('Score calculation: chain of 3 tiles (2+2+4) with 1.5x multiplier', () => {
        game.chain = [
            new Tile(0, 0, 2),
            new Tile(1, 0, 2),
            new Tile(2, 0, 4)
        ];
        const chainValue = game.calculateChainValue(); // 8
        const multiplier = game.getChainMultiplier(); // 1.5
        const expectedScore = Math.floor(8 * 1.5); // 12

        assertEqual(chainValue, 8, 'Chain value should be 8');
        assertEqual(multiplier, 1.5, 'Multiplier should be 1.5');
        assertEqual(expectedScore, 12, 'Final score should be 12');
    });

    // ========================================================================
    // TEST SUITE 3: BLOCKER BEHAVIOR
    // ========================================================================
    console.log('\n📊 TEST SUITE 3: Blocker Behavior');
    console.log('━'.repeat(60));

    test('Stone blocker: isBlocked() returns true', () => {
        const tile = new Tile(0, 0, 0);
        tile.setBlocker(BLOCKER_TYPES.STONE);

        assertTrue(tile.isBlocked(), 'Tile with STONE blocker should be blocked');
    });

    test('Stone blocker: isBomb() returns false', () => {
        const tile = new Tile(0, 0, 0);
        tile.setBlocker(BLOCKER_TYPES.STONE);

        assertFalse(tile.isBomb(), 'STONE blocker should not be a bomb');
    });

    test('Ice blocker: isBlocked() returns true', () => {
        const tile = new Tile(0, 0, 4);
        tile.setBlocker(BLOCKER_TYPES.ICE, 3);

        assertTrue(tile.isBlocked(), 'Tile with ICE blocker should be blocked');
    });

    test('Ice blocker: isBomb() returns false', () => {
        const tile = new Tile(0, 0, 4);
        tile.setBlocker(BLOCKER_TYPES.ICE, 3);

        assertFalse(tile.isBomb(), 'ICE blocker should not be a bomb');
    });

    test('Ice blocker: duration decreases when ticked', () => {
        const tile = new Tile(0, 0, 4);
        tile.setBlocker(BLOCKER_TYPES.ICE, 3);

        assertEqual(tile.blockerDuration, 3, 'Initial duration should be 3');

        tile.tickBlocker();
        assertEqual(tile.blockerDuration, 2, 'Duration should decrease to 2');

        tile.tickBlocker();
        assertEqual(tile.blockerDuration, 1, 'Duration should decrease to 1');
    });

    test('Ice blocker: removed when duration reaches 0', () => {
        const tile = new Tile(0, 0, 4);
        tile.setBlocker(BLOCKER_TYPES.ICE, 1);

        assertTrue(tile.isBlocked(), 'Should be blocked initially');

        tile.tickBlocker();
        assertFalse(tile.isBlocked(), 'Should not be blocked after duration expires');
        assertEqual(tile.blocker, null, 'Blocker should be removed');
    });

    test('Bomb blocker: isBomb() returns true', () => {
        const tile = new Tile(0, 0, 4);
        tile.setBlocker(BLOCKER_TYPES.BOMB, 0, 8);

        assertTrue(tile.isBomb(), 'Tile with BOMB blocker should return true for isBomb()');
    });

    test('Bomb blocker: isBlocked() returns false', () => {
        const tile = new Tile(0, 0, 4);
        tile.setBlocker(BLOCKER_TYPES.BOMB, 0, 8);

        assertFalse(tile.isBlocked(), 'BOMB blocker should not block (can be selected)');
    });

    test('Bomb blocker: timer decreases when ticked', () => {
        const tile = new Tile(0, 0, 4);
        tile.setBlocker(BLOCKER_TYPES.BOMB, 0, 5);

        assertEqual(tile.bombTimer, 5, 'Initial timer should be 5');

        tile.tickBlocker();
        assertEqual(tile.bombTimer, 4, 'Timer should decrease to 4');

        tile.tickBlocker();
        assertEqual(tile.bombTimer, 3, 'Timer should decrease to 3');
    });

    test('Lock blocker: isBlocked() returns true', () => {
        const tile = new Tile(0, 0, 4);
        tile.setBlocker(BLOCKER_TYPES.LOCK);

        assertTrue(tile.isBlocked(), 'Tile with LOCK blocker should be blocked');
    });

    test('Lock blocker: isBomb() returns false', () => {
        const tile = new Tile(0, 0, 4);
        tile.setBlocker(BLOCKER_TYPES.LOCK);

        assertFalse(tile.isBomb(), 'LOCK blocker should not be a bomb');
    });

    test('No blocker: isBlocked() returns false', () => {
        const tile = new Tile(0, 0, 4);

        assertFalse(tile.isBlocked(), 'Tile without blocker should not be blocked');
    });

    test('No blocker: isBomb() returns false', () => {
        const tile = new Tile(0, 0, 4);

        assertFalse(tile.isBomb(), 'Tile without blocker should not be a bomb');
    });

    // ========================================================================
    // TEST SUITE 4: LEVEL LOADING
    // ========================================================================
    console.log('\n📊 TEST SUITE 4: Level Loading');
    console.log('━'.repeat(60));

    test('loadLevel() resets score to 0', () => {
        game.score = 5000;
        game.loadLevel(1);

        assertEqual(game.score, 0, 'Score should be reset to 0 after loading level');
    });

    test('loadLevel() resets moves to 0', () => {
        game.moves = 15;
        game.loadLevel(1);

        assertEqual(game.moves, 0, 'Moves should be reset to 0 after loading level');
    });

    test('loadLevel() clears history array', () => {
        game.history = ['state1', 'state2', 'state3'];
        game.loadLevel(1);

        assertEqual(game.history.length, 0, 'History should be empty after loading level');
    });

    test('loadLevel() sets gameOver to false', () => {
        game.gameOver = true;
        game.loadLevel(1);

        assertFalse(game.gameOver, 'gameOver should be false after loading level');
    });

    test('loadLevel() sets levelComplete to false', () => {
        game.levelComplete = true;
        game.loadLevel(1);

        assertFalse(game.levelComplete, 'levelComplete should be false after loading level');
    });

    test('loadLevel() disables undo button (empty history)', () => {
        const undoBtn = document.getElementById('undoBtn');
        undoBtn.disabled = false;

        game.loadLevel(1);

        assertTrue(undoBtn.disabled, 'Undo button should be disabled after loading level');
    });

    test('loadLevel() sets correct level properties', () => {
        game.loadLevel(5);

        assertEqual(game.currentLevel, 5, 'Current level should be 5');
        assertEqual(game.targetScore, 2000, 'Target score should match level 5');
        assertEqual(game.maxMoves, 25, 'Max moves should match level 5');
        assertEqual(game.minChain, 2, 'Min chain should match level 5');
    });

    test('loadLevel() creates correct grid dimensions', () => {
        game.loadLevel(1);

        assertEqual(game.gridHeight, 8, 'Grid height should be 8');
        assertEqual(game.gridWidth, 5, 'Grid width should be 5');
        assertEqual(game.grid.length, 8, 'Grid should have 8 rows');
        assertEqual(game.grid[0].length, 5, 'Grid row should have 5 columns');
    });

    test('loadLevel() initializes all grid positions with tiles', () => {
        game.loadLevel(1);

        for (let row = 0; row < game.gridHeight; row++) {
            for (let col = 0; col < game.gridWidth; col++) {
                assertTrue(game.grid[row][col] !== null,
                    `Grid position (${row}, ${col}) should have a tile`);
                assertTrue(game.grid[row][col] instanceof Tile,
                    `Grid position (${row}, ${col}) should contain a Tile instance`);
            }
        }
    });

    test('loadLevel() with smaller grid (level 31)', () => {
        game.loadLevel(31);

        assertEqual(game.gridHeight, 7, 'Grid height should be 7 for level 31');
        assertEqual(game.gridWidth, 5, 'Grid width should be 5 for level 31');
    });

    test('loadLevel() places blockers correctly', () => {
        // Level 15 has one stone blocker at (2, 3)
        game.loadLevel(15);

        const blockerTile = game.grid[3][2];
        assertTrue(blockerTile.isBlocked(), 'Tile at (2, 3) should be blocked');
        assertEqual(blockerTile.blocker, BLOCKER_TYPES.STONE,
            'Blocker should be STONE type');
    });

    // ========================================================================
    // TEST SUITE 5: ADJACENCY AND CHAIN EXTENSION
    // ========================================================================
    console.log('\n📊 TEST SUITE 5: Adjacency and Chain Extension');
    console.log('━'.repeat(60));

    test('isAdjacent: horizontally adjacent tiles', () => {
        const tile1 = new Tile(0, 0, 2);
        const tile2 = new Tile(1, 0, 2);

        assertTrue(game.isAdjacent(tile1, tile2),
            'Horizontally adjacent tiles should be adjacent');
    });

    test('isAdjacent: vertically adjacent tiles', () => {
        const tile1 = new Tile(0, 0, 2);
        const tile2 = new Tile(0, 1, 2);

        assertTrue(game.isAdjacent(tile1, tile2),
            'Vertically adjacent tiles should be adjacent');
    });

    test('isAdjacent: diagonally adjacent tiles', () => {
        const tile1 = new Tile(0, 0, 2);
        const tile2 = new Tile(1, 1, 2);

        assertTrue(game.isAdjacent(tile1, tile2),
            'Diagonally adjacent tiles should be adjacent');
    });

    test('isAdjacent: non-adjacent tiles', () => {
        const tile1 = new Tile(0, 0, 2);
        const tile2 = new Tile(3, 3, 2);

        assertFalse(game.isAdjacent(tile1, tile2),
            'Non-adjacent tiles should not be adjacent');
    });

    test('isAdjacent: same tile', () => {
        const tile1 = new Tile(0, 0, 2);

        assertFalse(game.isAdjacent(tile1, tile1),
            'Same tile should not be adjacent to itself');
    });

    test('canExtendChain: first extension must match', () => {
        const tile1 = new Tile(0, 0, 2);
        const tile2 = new Tile(1, 0, 2);

        game.chain = [tile1];

        assertTrue(game.canExtendChain(tile2),
            'First extension with same value should be allowed');
    });

    test('canExtendChain: first extension must match (different value fails)', () => {
        const tile1 = new Tile(0, 0, 2);
        const tile2 = new Tile(1, 0, 4);

        game.chain = [tile1];

        assertFalse(game.canExtendChain(tile2),
            'First extension with different value should fail');
    });

    test('canExtendChain: subsequent can be same value', () => {
        const tile1 = new Tile(0, 0, 2);
        const tile2 = new Tile(1, 0, 2);
        const tile3 = new Tile(2, 0, 2);

        game.chain = [tile1, tile2];

        assertTrue(game.canExtendChain(tile3),
            'Subsequent extension with same value should be allowed');
    });

    test('canExtendChain: subsequent can be double value', () => {
        const tile1 = new Tile(0, 0, 2);
        const tile2 = new Tile(1, 0, 2);
        const tile3 = new Tile(2, 0, 4);

        game.chain = [tile1, tile2];

        assertTrue(game.canExtendChain(tile3),
            'Subsequent extension with double value should be allowed');
    });

    test('canExtendChain: subsequent with invalid value fails', () => {
        const tile1 = new Tile(0, 0, 2);
        const tile2 = new Tile(1, 0, 2);
        const tile3 = new Tile(2, 0, 8);

        game.chain = [tile1, tile2];

        assertFalse(game.canExtendChain(tile3),
            'Subsequent extension with value that is not same or double should fail');
    });

    // ========================================================================
    // TEST RESULTS SUMMARY
    // ========================================================================
    console.log('\n' + '═'.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('═'.repeat(60));
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log(`📈 Total Tests: ${testsPassed + testsFailed}`);
    console.log(`🎯 Pass Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
    console.log('═'.repeat(60));

    if (testsFailed === 0) {
        console.log('🎉 All tests passed! The game is working correctly.');
    } else {
        console.warn('⚠️ Some tests failed. Please review the errors above.');
    }

})();
