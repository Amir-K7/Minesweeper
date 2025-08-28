class Minesweeper {
    constructor() {
        this.difficulties = {
            easy: { rows: 9, cols: 9, mines: 10 },
            medium: { rows: 16, cols: 16, mines: 40 },
            hard: { rows: 16, cols: 30, mines: 99 }
        };
        
        this.currentDifficulty = 'easy';
        this.board = [];
        this.gameState = 'ready'; // ready, playing, won, lost
        this.timer = 0;
        this.timerInterval = null;
        this.firstClick = true;
        this.flagsPlaced = 0;
        
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeGame();
    }
    
    initializeElements() {
        this.gameBoard = document.getElementById('game-board');
        this.minesCount = document.getElementById('mines-count');
        this.timerElement = document.getElementById('timer');
        this.flagsCount = document.getElementById('flags-count');
        this.statusIcon = document.getElementById('status-icon');
        this.statusText = document.getElementById('status-text');
        this.newGameBtn = document.getElementById('new-game');
        this.difficultyBtns = document.querySelectorAll('.difficulty-btn');
    }
    
    initializeEventListeners() {
        this.newGameBtn.addEventListener('click', () => this.initializeGame());
        
        this.difficultyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.difficultyBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentDifficulty = e.target.dataset.difficulty;
                this.initializeGame();
            });
        });
    }
    
    initializeGame() {
        this.gameState = 'ready';
        this.timer = 0;
        this.firstClick = true;
        this.flagsPlaced = 0;
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        this.updateDisplay();
        this.createBoard();
        this.renderBoard();
        
        this.statusIcon.textContent = '🙂';
        this.statusText.textContent = 'Click to start!';
        document.body.className = '';
    }
    
    createBoard() {
        const { rows, cols } = this.difficulties[this.currentDifficulty];
        this.board = [];
        
        for (let row = 0; row < rows; row++) {
            this.board[row] = [];
            for (let col = 0; col < cols; col++) {
                this.board[row][col] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborCount: 0
                };
            }
        }
    }
    
    placeMines(firstClickRow, firstClickCol) {
        const { rows, cols, mines } = this.difficulties[this.currentDifficulty];
        let minesPlaced = 0;
        
        while (minesPlaced < mines) {
            const row = Math.floor(Math.random() * rows);
            const col = Math.floor(Math.random() * cols);
            
            // Don't place mine on first click or if already has mine
            if ((row === firstClickRow && col === firstClickCol) || 
                this.board[row][col].isMine) {
                continue;
            }
            
            this.board[row][col].isMine = true;
            minesPlaced++;
        }
        
        this.calculateNeighborCounts();
    }
    
    calculateNeighborCounts() {
        const { rows, cols } = this.difficulties[this.currentDifficulty];
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (!this.board[row][col].isMine) {
                    let count = 0;
                    
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            const newRow = row + dr;
                            const newCol = col + dc;
                            
                            if (newRow >= 0 && newRow < rows && 
                                newCol >= 0 && newCol < cols &&
                                this.board[newRow][newCol].isMine) {
                                count++;
                            }
                        }
                    }
                    
                    this.board[row][col].neighborCount = count;
                }
            }
        }
    }
    
    renderBoard() {
        const { rows, cols } = this.difficulties[this.currentDifficulty];
        
        this.gameBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        this.gameBoard.innerHTML = '';
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                cell.addEventListener('click', (e) => this.handleCellClick(e, row, col));
                cell.addEventListener('contextmenu', (e) => this.handleRightClick(e, row, col));
                
                this.gameBoard.appendChild(cell);
            }
        }
    }
    
    handleCellClick(event, row, col) {
        event.preventDefault();
        
        if (this.gameState === 'won' || this.gameState === 'lost') return;
        if (this.board[row][col].isRevealed || this.board[row][col].isFlagged) return;
        
        if (this.firstClick) {
            this.placeMines(row, col);
            this.firstClick = false;
            this.gameState = 'playing';
            this.startTimer();
            this.statusText.textContent = 'Good luck!';
        }
        
        this.revealCell(row, col);
        this.updateDisplay();
        this.checkWinCondition();
    }
    
    handleRightClick(event, row, col) {
        event.preventDefault();
        
        if (this.gameState === 'won' || this.gameState === 'lost') return;
        if (this.board[row][col].isRevealed) return;
        
        const cell = this.board[row][col];
        const cellElement = event.target;
        
        if (cell.isFlagged) {
            cell.isFlagged = false;
            cellElement.classList.remove('flagged');
            this.flagsPlaced--;
        } else {
            cell.isFlagged = true;
            cellElement.classList.add('flagged');
            this.flagsPlaced++;
        }
        
        this.updateDisplay();
    }
    
    revealCell(row, col) {
        const { rows, cols } = this.difficulties[this.currentDifficulty];
        const cell = this.board[row][col];
        
        if (cell.isRevealed || cell.isFlagged) return;
        
        cell.isRevealed = true;
        const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cellElement.classList.add('revealed');
        
        if (cell.isMine) {
            this.gameOver();
            return;
        }
        
        if (cell.neighborCount > 0) {
            cellElement.textContent = cell.neighborCount;
            cellElement.dataset.number = cell.neighborCount;
        } else {
            // Auto-reveal adjacent cells for empty cells
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const newRow = row + dr;
                    const newCol = col + dc;
                    
                    if (newRow >= 0 && newRow < rows && 
                        newCol >= 0 && newCol < cols) {
                        this.revealCell(newRow, newCol);
                    }
                }
            }
        }
    }
    
    gameOver() {
        this.gameState = 'lost';
        clearInterval(this.timerInterval);
        
        // Reveal all mines
        const { rows, cols } = this.difficulties[this.currentDifficulty];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (this.board[row][col].isMine) {
                    const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    cellElement.classList.add('mine');
                }
            }
        }
        
        this.statusIcon.textContent = '😵';
        this.statusText.textContent = 'Game Over! Try again?';
        document.body.classList.add('game-lost');
    }
    
    checkWinCondition() {
        const { rows, cols, mines } = this.difficulties[this.currentDifficulty];
        let revealedCount = 0;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (this.board[row][col].isRevealed && !this.board[row][col].isMine) {
                    revealedCount++;
                }
            }
        }
        
        const totalCells = rows * cols;
        if (revealedCount === totalCells - mines) {
            this.gameWon();
        }
    }
    
    gameWon() {
        this.gameState = 'won';
        clearInterval(this.timerInterval);
        
        // Auto-flag remaining mines
        const { rows, cols } = this.difficulties[this.currentDifficulty];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (this.board[row][col].isMine && !this.board[row][col].isFlagged) {
                    this.board[row][col].isFlagged = true;
                    const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    cellElement.classList.add('flagged');
                    this.flagsPlaced++;
                }
            }
        }
        
        this.statusIcon.textContent = '🎉';
        this.statusText.textContent = 'Congratulations! You won!';
        document.body.classList.add('game-won');
        this.updateDisplay();
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateDisplay();
        }, 1000);
    }
    
    updateDisplay() {
        const { mines } = this.difficulties[this.currentDifficulty];
        
        this.minesCount.textContent = mines;
        this.timerElement.textContent = this.timer.toString().padStart(3, '0');
        this.flagsCount.textContent = this.flagsPlaced;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Minesweeper();
});

// Add some additional polish
document.addEventListener('contextmenu', (e) => {
    if (e.target.classList.contains('cell')) {
        e.preventDefault();
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        document.getElementById('new-game').click();
    }
});