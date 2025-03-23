console.time("코드 실행 시간");

if (moveLog.length % 2 === 1) {
    ME = BLACK;
    YOU = WHITE;
}
else {
    ME = WHITE;
    YOU = BLACK;
}

const MAX_DEPTH = 3;

// Position weights
const weights = [
    [120, -20, 20, 5, 5, 20, -20, 120],
    [-20, -40, -5, -5, -5, -5, -40, -20],
    [20, -5, 15, 3, 3, 15, -5, 20],
    [5, -5, 3, 3, 3, 3, -5, 5],
    [5, -5, 3, 3, 3, 3, -5, 5],
    [20, -5, 15, 3, 3, 15, -5, 20],
    [-20, -40, -5, -5, -5, -5, -40, -20],
    [120, -20, 20, 5, 5, 20, -20, 120]
];

function evaluateBoard(board, player) {
    let score = 0;
    let opponent = player === BLACK ? WHITE : BLACK;

    score += evaluateStability(board, player) * 10;
    score += evaluateMobility(board, player) * 5;
    score -= evaluateFrontier(board, player) * 3;

    // Position-based evaluation
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === player) {
                score += weights[row][col];
            } else if (board[row][col] === opponent) {
                score -= weights[row][col];
            }
        }
    }
    return score;
}

function evaluateStability(board, player) {
    let stableDiscs = countStableDiscs(board, player);
    let opponent = player === BLACK ? WHITE : BLACK;
    let opponentStableDiscs = countStableDiscs(board, opponent);

    return stableDiscs - opponentStableDiscs;
}

function countStableDiscs(board, player) {
    let stable = 0;
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === player && isStable(board, row, col)) {
                stable++;
            }
        }
    }
    return stable;
}

function isStable(board, row, col) {
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],          [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];
    for (const [dr, dc] of directions) {
        let r = row + dr;
        let c = col + dc;
        while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
            if (board[r][c] === EMPTY) {
                return false;
            }
            r += dr;
            c += dc;
        }
    }
    return true;
}

function evaluateMobility(board, player) {
    const playerMoves = getValidMoves(board, player).length;
    const opponentMoves = getValidMoves(board, player === BLACK ? WHITE : BLACK).length;
    return playerMoves - opponentMoves;
}

function evaluateFrontier(board, player) {
    let frontierCount = 0;
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === player && isFrontierDisc(board, row, col, player)) {
                frontierCount++;
            }
        }
    }
    return frontierCount;
}

function isFrontierDisc(board, row, col, player) {
    const opponent = (player === BLACK) ? WHITE : BLACK;
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],          [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];
    for (const [dr, dc] of directions) {
        let r = row + dr;
        let c = col + dc;
        while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
            if (board[r][c] === opponent) {
                return true;
            }
            if (board[r][c] === EMPTY) {
                break;
            }
            r += dr;
            c += dc;
        }
    }
    return false;
}

function minimax(board, depth, alpha, beta, maximizingPlayer) {
    if (depth === 0) {
        return evaluateBoard(board, maximizingPlayer ? ME : YOU);
    }
    const player = maximizingPlayer ? ME : YOU;
    const currentValidMoves = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (isValidMoveForMinimax(board, row, col, player)) {
                currentValidMoves.push({ row, col });
            }
        }
    }

    // If no valid moves, pass turn to opponent
    if (currentValidMoves.length === 0) {
        // Recursive call with opponent player
        return minimax(board, depth - 1, alpha, beta, !maximizingPlayer);
    }

    if (maximizingPlayer) {
        let maxEval = -Infinity;
        for (const move of currentValidMoves) {
            // Copy the board
            const boardCopy = board.map(row => [...row]);

            // Simulate the move
            makeSimulatedMove(boardCopy, move.row, move.col, ME);

            // Recursive evaluation
            const eval = minimax(boardCopy, depth - 1, alpha, beta, false);
            maxEval = Math.max(maxEval, eval);

            // Alpha-beta pruning
            alpha = Math.max(alpha, eval);
            if (beta <= alpha)
                break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of currentValidMoves) {
            // Copy the board
            const boardCopy = board.map(row => [...row]);

            // Simulate the move
            makeSimulatedMove(boardCopy, move.row, move.col, YOU);

            // Recursive evaluation
            const eval = minimax(boardCopy, depth - 1, alpha, beta, true);
            minEval = Math.min(minEval, eval);

            // Alpha-beta pruning
            beta = Math.min(beta, eval);
            if (beta <= alpha)
                break;
        }
        return minEval;
    }
}

// Function to check valid moves for minimax
function isValidMoveForMinimax(board, row, col, player) {
    if (board[row][col] !== EMPTY) {
        return false;
    }

    const opponent = player === BLACK ? WHITE : BLACK;
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],          [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];

    for (const [dr, dc] of directions) {
        let r = row + dr;
        let c = col + dc;
        let foundOpponent = false;

        while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === opponent) {
            foundOpponent = true;
            r += dr;
            c += dc;
        }

        if (foundOpponent && r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
            return true;
        }
    }

    return false;
}

// Function to simulate moves for minimax
function makeSimulatedMove(board, row, col, player) {
    board[row][col] = player;

    // Flip discs
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],          [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];

    directions.forEach(([dr, dc]) => {
        let r = row + dr;
        let c = col + dc;
        const discsToFlip = [];

        while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] !== EMPTY && board[r][c] !== player) {
            discsToFlip.push([r, c]);
            r += dr;
            c += dc;
        }

        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
            discsToFlip.forEach(([fr, fc]) => {
                board[fr][fc] = player;
            });
        }
    });
}

// Run minimax to find the best move
let bestScore = -Infinity;
let bestMove = null;
const validMoves = getValidMoves(ME);
for (const move of validMoves) {
    const boardCopy = board.map(row => [...row]);
    makeSimulatedMove(boardCopy, move.row, move.col, ME);
    const score = minimax(boardCopy, MAX_DEPTH, -Infinity, Infinity, false);
    if (score > bestScore) {
        bestScore = score;
        bestMove = move;
    }
}

console.timeEnd("코드 실행 시간");

return bestMove;
