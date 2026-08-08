// UAT Test Script for Bomb Defuse Feature
// Run this script in the browser console after opening index.html

console.log("=== 2248 Challenge - Bomb Defuse UAT Test ===");

// Step 1: Unlock all levels
console.log("\n1. Unlocking all levels...");
localStorage.setItem('unlockedLevel', '50');
console.log("✓ Set unlockedLevel to 50");

// Step 2: Load level 40 (which has bombs)
console.log("\n2. Loading level 40...");
if (typeof game !== 'undefined') {
    game.loadLevel(40);
    console.log("✓ Level 40 loaded");
} else {
    console.error("✗ Game object not found. Make sure the game is loaded.");
}

// Step 3: Wait a moment for level to load, then inspect the grid
setTimeout(() => {
    console.log("\n3. Inspecting grid for bomb tiles...");

    if (typeof game !== 'undefined' && game.grid) {
        let bombsFound = [];

        // Search for bombs in the grid
        for (let row = 0; row < game.grid.length; row++) {
            for (let col = 0; col < game.grid[row].length; col++) {
                const tile = game.grid[row][col];
                if (tile && tile.isBomb) {
                    bombsFound.push({
                        position: `[${row}, ${col}]`,
                        timer: tile.bombTimer,
                        value: tile.value,
                        tile: tile
                    });
                }
            }
        }

        if (bombsFound.length > 0) {
            console.log(`✓ Found ${bombsFound.length} bomb tile(s):`);
            bombsFound.forEach((bomb, index) => {
                console.log(`  Bomb ${index + 1}:`);
                console.log(`    Position: ${bomb.position}`);
                console.log(`    Timer: ${bomb.timer}`);
                console.log(`    Value: ${bomb.value}`);
            });

            // Step 4: Provide instructions for manual testing
            console.log("\n4. Manual Testing Instructions:");
            console.log("   a. Look for tiles with bomb icons (💣) on the grid");
            console.log("   b. Create a chain that includes a bomb tile");
            console.log("   c. Verify the bomb timer decreases when NOT included in merge");
            console.log("   d. Verify the bomb is DEFUSED (removed) when included in merge");
            console.log("\n5. Expected Behavior:");
            console.log("   - Before fix: Bomb timer decreased but bomb stayed on grid");
            console.log("   - After fix: Bomb is removed from grid when merged");

            // Step 5: Test the defuse logic programmatically
            console.log("\n6. Testing defuse logic...");
            const testBomb = bombsFound[0].tile;
            console.log(`   Testing with bomb at position ${bombsFound[0].position}`);
            console.log(`   Initial timer: ${testBomb.bombTimer}`);
            console.log(`   isBomb flag: ${testBomb.isBomb}`);

            // Check if defuseBomb method exists
            if (typeof game.defuseBomb === 'function') {
                console.log("   ✓ defuseBomb method exists on game object");
            } else {
                console.log("   ✗ defuseBomb method NOT found on game object");
            }

        } else {
            console.log("✗ No bomb tiles found on level 40");
            console.log("  This could mean:");
            console.log("  - Level 40 doesn't have bombs");
            console.log("  - The grid hasn't loaded yet");
            console.log("  - The level data is incorrect");
        }

        // Display current grid state
        console.log("\n7. Current Grid State:");
        console.log("   Grid dimensions:", game.grid.length, "x", game.grid[0].length);
        console.log("   Current level:", game.currentLevel);

        // Display grid visually
        console.log("\n8. Visual Grid (B = Bomb, number = value):");
        let gridDisplay = "";
        for (let row = 0; row < game.grid.length; row++) {
            let rowDisplay = "   ";
            for (let col = 0; col < game.grid[row].length; col++) {
                const tile = game.grid[row][col];
                if (tile) {
                    if (tile.isBomb) {
                        rowDisplay += `[B${tile.value}]`.padEnd(6);
                    } else {
                        rowDisplay += `[${tile.value}]`.padEnd(6);
                    }
                } else {
                    rowDisplay += "[ - ] ".padEnd(6);
                }
            }
            gridDisplay += rowDisplay + "\n";
        }
        console.log(gridDisplay);

    } else {
        console.error("✗ Game grid not available");
    }

    console.log("\n=== Test Script Complete ===");
    console.log("Please take screenshots of:");
    console.log("1. This console output");
    console.log("2. The game grid showing bomb tiles");
    console.log("3. Before merging a bomb");
    console.log("4. After merging a bomb (should be defused/removed)");

}, 1000);

// Helper function to manually trigger bomb defuse for testing
window.testBombDefuse = function(row, col) {
    console.log(`\n=== Manual Bomb Defuse Test ===`);
    const tile = game.grid[row][col];
    if (tile && tile.isBomb) {
        console.log(`Testing defuse on bomb at [${row}, ${col}]`);
        console.log(`Before: isBomb=${tile.isBomb}, timer=${tile.bombTimer}`);

        if (typeof game.defuseBomb === 'function') {
            game.defuseBomb(tile);
            console.log(`After defuseBomb: isBomb=${tile.isBomb}, timer=${tile.bombTimer}`);
        } else {
            console.log("defuseBomb method not found");
        }
    } else {
        console.log(`No bomb found at [${row}, ${col}]`);
    }
};

console.log("\n💡 Tip: Call testBombDefuse(row, col) to manually test bomb defusing on a specific tile");
