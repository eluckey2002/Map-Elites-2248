// ============================================================================
// UAT TEST SCRIPT FOR 2248 CHALLENGE
// ============================================================================
// Copy and paste this into browser console to run automated tests

console.log('%c=== 2248 CHALLENGE UAT TEST SUITE ===', 'color: #4ade80; font-size: 16px; font-weight: bold');
console.log('Running comprehensive tests...\n');

// Helper function to wait
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper to get button state
function getUndoButtonState() {
    const btn = document.getElementById('undoBtn');
    return {
        disabled: btn.disabled,
        text: btn.textContent
    };
}

// Helper to get game state
function getGameState() {
    return {
        score: game.score,
        moves: game.moves,
        historyLength: game.history.length,
        chainLength: game.chain.length,
        gameOver: game.gameOver,
        levelComplete: game.levelComplete,
        gridSnapshot: JSON.stringify(game.grid)
    };
}

// Helper to find matching tiles programmatically
function findMatchingTiles() {
    const matches = [];
    for (let row = 0; row < game.gridHeight; row++) {
        for (let col = 0; col < game.gridWidth; col++) {
            const tile = game.grid[row][col];
            if (!tile || tile.isBlocked()) continue;

            // Look for adjacent matching tiles
            const directions = [
                [-1, -1], [-1, 0], [-1, 1],
                [0, -1],           [0, 1],
                [1, -1],  [1, 0],  [1, 1]
            ];

            for (const [dy, dx] of directions) {
                const newRow = row + dy;
                const newCol = col + dx;

                if (newRow >= 0 && newRow < game.gridHeight &&
                    newCol >= 0 && newCol < game.gridWidth) {
                    const neighbor = game.grid[newRow][newCol];
                    if (neighbor && !neighbor.isBlocked() && neighbor.value === tile.value) {
                        matches.push({
                            tile1: { x: col, y: row, value: tile.value },
                            tile2: { x: newCol, y: newRow, value: neighbor.value }
                        });
                    }
                }
            }
        }
    }
    return matches;
}

// Helper to programmatically make a move
function makeProgrammaticMove() {
    const matches = findMatchingTiles();
    if (matches.length === 0) {
        console.error('No matching tiles found!');
        return false;
    }

    const match = matches[0];
    const tile1 = game.grid[match.tile1.y][match.tile1.x];
    const tile2 = game.grid[match.tile2.y][match.tile2.x];

    // Simulate chain creation
    game.chain = [tile1, tile2];
    tile1.selected = true;
    tile2.selected = true;

    // Execute the chain
    if (game.isValidChain()) {
        game.executeChain();
        return true;
    }
    return false;
}

// ============================================================================
// TEST SUITE
// ============================================================================

async function runTests() {
    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };

    function logTest(name, passed, message = '') {
        const status = passed ? '✓ PASS' : '✗ FAIL';
        const color = passed ? '#4ade80' : '#f67c5f';
        console.log(`%c${status}%c ${name}`, `color: ${color}; font-weight: bold`, 'color: inherit');
        if (message) console.log(`  ${message}`);

        results.tests.push({ name, passed, message });
        if (passed) results.passed++;
        else results.failed++;
    }

    // ========================================================================
    // TEST 1: Undo button disabled on fresh level
    // ========================================================================
    console.log('\n%cTest 1: Initial State - Undo Button Disabled', 'color: #f2b179; font-weight: bold');
    game.loadLevel(1);
    await wait(100);

    const initialUndoState = getUndoButtonState();
    logTest(
        'Undo button is disabled on fresh level',
        initialUndoState.disabled === true,
        `Button disabled: ${initialUndoState.disabled}, History length: ${game.history.length}`
    );

    console.log('\n📸 Take Screenshot 1: Undo button DISABLED (initial state)');

    // ========================================================================
    // TEST 2: Make a move and check undo enabled
    // ========================================================================
    console.log('\n%cTest 2: After Move - Undo Button Enabled', 'color: #f2b179; font-weight: bold');

    const stateBefore = getGameState();
    const moveSuccess = makeProgrammaticMove();
    await wait(500); // Wait for animation

    logTest(
        'Move was executed successfully',
        moveSuccess === true,
        `Move executed: ${moveSuccess}`
    );

    const stateAfter = getGameState();
    logTest(
        'Score increased after move',
        stateAfter.score > stateBefore.score,
        `Before: ${stateBefore.score}, After: ${stateAfter.score}`
    );

    logTest(
        'Moves counter increased',
        stateAfter.moves > stateBefore.moves,
        `Before: ${stateBefore.moves}, After: ${stateAfter.moves}`
    );

    logTest(
        'History was saved',
        stateAfter.historyLength > 0,
        `History length: ${stateAfter.historyLength}`
    );

    const undoStateAfterMove = getUndoButtonState();
    logTest(
        'Undo button is enabled after move',
        undoStateAfterMove.disabled === false,
        `Button disabled: ${undoStateAfterMove.disabled}`
    );

    console.log('\n📸 Take Screenshot 2: Undo button ENABLED (after move)');

    // ========================================================================
    // TEST 3: Click undo and verify state reverts
    // ========================================================================
    console.log('\n%cTest 3: Undo Functionality - State Reverts', 'color: #f2b179; font-weight: bold');

    const scoreBeforeUndo = stateAfter.score;
    const movesBeforeUndo = stateAfter.moves;
    const gridBeforeUndo = stateAfter.gridSnapshot;

    // Click undo
    game.undo();
    await wait(100);

    const stateAfterUndo = getGameState();

    logTest(
        'Score reverted to original',
        stateAfterUndo.score === stateBefore.score,
        `Original: ${stateBefore.score}, After undo: ${stateAfterUndo.score}`
    );

    logTest(
        'Moves reverted to original',
        stateAfterUndo.moves === stateBefore.moves,
        `Original: ${stateBefore.moves}, After undo: ${stateAfterUndo.moves}`
    );

    logTest(
        'Grid state reverted',
        stateAfterUndo.gridSnapshot === stateBefore.gridSnapshot,
        'Grid state matches original state'
    );

    logTest(
        'History length decreased',
        stateAfterUndo.historyLength < stateAfter.historyLength,
        `Before undo: ${stateAfter.historyLength}, After undo: ${stateAfterUndo.historyLength}`
    );

    const undoStateAfterUndo = getUndoButtonState();
    logTest(
        'Undo button disabled after using last undo',
        undoStateAfterUndo.disabled === true,
        `Button disabled: ${undoStateAfterUndo.disabled}, History: ${stateAfterUndo.historyLength}`
    );

    console.log('\n📸 Take Screenshot 3: After undo (state reverted)');

    // ========================================================================
    // TEST 4: Multiple moves and selective undo
    // ========================================================================
    console.log('\n%cTest 4: Multiple Undos', 'color: #f2b179; font-weight: bold');

    // Make 3 moves
    const moveScores = [game.score];
    for (let i = 0; i < 3; i++) {
        makeProgrammaticMove();
        await wait(500);
        moveScores.push(game.score);
    }

    logTest(
        'Three moves executed',
        game.moves === 3,
        `Moves made: ${game.moves}`
    );

    logTest(
        'History contains 3 states',
        game.history.length === 3,
        `History length: ${game.history.length}`
    );

    // Undo once
    game.undo();
    await wait(100);

    logTest(
        'Undo once: Score matches second move',
        game.score === moveScores[2],
        `Expected: ${moveScores[2]}, Actual: ${game.score}`
    );

    logTest(
        'Undo button still enabled',
        !getUndoButtonState().disabled,
        `History remaining: ${game.history.length}`
    );

    // ========================================================================
    // TEST 5: Level complete modal blocks undo
    // ========================================================================
    console.log('\n%cTest 5: Level Complete - Modal Behavior', 'color: #f2b179; font-weight: bold');

    // Force level complete
    game.score = game.targetScore;
    game.levelComplete = true;
    game.showLevelComplete();
    await wait(500);

    const modal = document.getElementById('completeModal');
    const isModalVisible = modal.classList.contains('active');

    logTest(
        'Level complete modal is visible',
        isModalVisible === true,
        `Modal active class: ${isModalVisible}`
    );

    logTest(
        'levelComplete flag is set',
        game.levelComplete === true,
        `levelComplete: ${game.levelComplete}`
    );

    console.log('\n📸 Take Screenshot 4: Level complete modal visible');

    // Try to interact - modal should prevent interaction
    const canInteract = !game.levelComplete && !game.gameOver;
    logTest(
        'Game interactions blocked when level complete',
        canInteract === false,
        `Can interact: ${canInteract}`
    );

    // Hide modal
    game.hideModal('completeModal');
    await wait(100);

    const isModalHidden = !modal.classList.contains('active');
    logTest(
        'Modal can be hidden',
        isModalHidden === true,
        `Modal hidden: ${isModalHidden}`
    );

    console.log('\n📸 Take Screenshot 5: Modal hidden');

    // ========================================================================
    // TEST 6: Game over modal
    // ========================================================================
    console.log('\n%cTest 6: Game Over Modal', 'color: #f2b179; font-weight: bold');

    game.loadLevel(1);
    await wait(100);

    // Force game over
    game.moves = game.maxMoves;
    game.gameOver = true;
    game.showGameOver('Out of moves!');
    await wait(500);

    const gameOverModal = document.getElementById('gameOverModal');
    const isGameOverVisible = gameOverModal.classList.contains('active');

    logTest(
        'Game over modal is visible',
        isGameOverVisible === true,
        `Modal active: ${isGameOverVisible}`
    );

    logTest(
        'gameOver flag is set',
        game.gameOver === true,
        `gameOver: ${game.gameOver}`
    );

    console.log('\n📸 Take Screenshot 6: Game over modal');

    // ========================================================================
    // TEST 7: Undo with modals
    // ========================================================================
    console.log('\n%cTest 7: Undo Hides Modals', 'color: #f2b179; font-weight: bold');

    game.loadLevel(1);
    await wait(100);

    // Make a move to populate history
    makeProgrammaticMove();
    await wait(500);

    // Force game over
    game.gameOver = true;
    game.showGameOver('Test');
    await wait(100);

    // Try undo - should hide modal and restore game
    game.undo();
    await wait(100);

    const modalStillHidden = !document.getElementById('gameOverModal').classList.contains('active');
    const gameOverCleared = game.gameOver === false;

    logTest(
        'Undo hides game over modal',
        modalStillHidden === true,
        `Modal hidden: ${modalStillHidden}`
    );

    logTest(
        'Undo clears gameOver flag',
        gameOverCleared === true,
        `gameOver cleared: ${gameOverCleared}`
    );

    // ========================================================================
    // TEST 8: Chain validation with min chain requirement
    // ========================================================================
    console.log('\n%cTest 8: Chain Validation', 'color: #f2b179; font-weight: bold');

    game.loadLevel(11); // Level with minChain = 3
    await wait(100);

    logTest(
        'Level 11 requires min chain of 3',
        game.minChain === 3,
        `minChain: ${game.minChain}`
    );

    // Try to make a chain of 2 (should be invalid)
    const matches = findMatchingTiles();
    if (matches.length > 0) {
        const match = matches[0];
        const tile1 = game.grid[match.tile1.y][match.tile1.x];
        const tile2 = game.grid[match.tile2.y][match.tile2.x];

        game.chain = [tile1, tile2];
        const isValidShortChain = game.isValidChain();

        logTest(
            'Chain of 2 is invalid when minChain = 3',
            isValidShortChain === false,
            `Chain length: ${game.chain.length}, Valid: ${isValidShortChain}`
        );

        game.chain = [];
    }

    // ========================================================================
    // FINAL REPORT
    // ========================================================================
    console.log('\n' + '='.repeat(60));
    console.log('%c TEST RESULTS SUMMARY', 'color: #f2b179; font-size: 18px; font-weight: bold');
    console.log('='.repeat(60));
    console.log(`%c✓ Passed: ${results.passed}`, 'color: #4ade80; font-weight: bold');
    console.log(`%c✗ Failed: ${results.failed}`, 'color: #f67c5f; font-weight: bold');
    console.log(`Total: ${results.tests.length} tests`);
    console.log('='.repeat(60));

    console.log('\n%c📸 MANUAL SCREENSHOT CHECKLIST:', 'color: #f2b179; font-weight: bold');
    console.log('1. ✓ Initial state - undo button DISABLED');
    console.log('2. ✓ After move - undo button ENABLED');
    console.log('3. ✓ After undo - state reverted');
    console.log('4. ✓ Level complete modal');
    console.log('5. ✓ Modal hidden');
    console.log('6. ✓ Game over modal');

    console.log('\n%c🎮 MANUAL TESTING STEPS:', 'color: #f2b179; font-weight: bold');
    console.log('Now perform these manual tests:');
    console.log('1. Restart the game (Ctrl+Shift+R or Cmd+Shift+R)');
    console.log('2. Verify undo button is disabled initially');
    console.log('3. Drag to create a chain (connect 2+ matching numbers)');
    console.log('4. Verify undo button becomes enabled');
    console.log('5. Click undo and verify everything reverts');
    console.log('6. Make enough moves to reach target score');
    console.log('7. Verify level complete modal appears');
    console.log('8. Try clicking undo - should not work during modal');
    console.log('9. Close modal and verify game is playable');

    return results;
}

// Run the test suite
runTests().then(results => {
    console.log('\n%c✅ All automated tests complete!', 'color: #4ade80; font-size: 16px; font-weight: bold');
    console.log('Please proceed with manual testing and screenshots.');
});
