const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('start-button');
const overlay = document.getElementById('overlay');

const startSound = document.getElementById('start-sound');
const dropSound = document.getElementById('drop-sound');
const gameOverSound = document.getElementById('gameover-sound');
const bgm = document.getElementById('bgm');

let isGameOver = false;
let gameInterval = null;
let grid = [];
let score = 0;
let level = 0;
let speed = 500;

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 24;

// canvasサイズを自動調整
canvas.width  = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

// テトリミノ定義
const TETROMINOS = {
  I: { shape: [[1,1,1,1]], color: 'cyan' },
  O: { shape: [[1,1],[1,1]], color: 'yellow' },
  T: { shape: [[0,1,0],[1,1,1]], color: 'purple' },
  S: { shape: [[0,1,1],[1,1,0]], color: 'green' },
  Z: { shape: [[1,1,0],[0,1,1]], color: 'red' },
  J: { shape: [[1,0,0],[1,1,1]], color: 'blue' },
  L: { shape: [[0,0,1],[1,1,1]], color: 'orange' }
};

let currentPiece = null;

// ピース生成
function createPiece() {
  const keys = Object.keys(TETROMINOS);
  const rand = keys[Math.floor(Math.random() * keys.length)];
  const piece = TETROMINOS[rand];
  return {
    shape: piece.shape.map(row => [...row]),
    color: piece.color,
    x: Math.floor(COLS / 2) - Math.ceil(piece.shape[0].length / 2),
    y: 0
  };
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // 固定ブロックを描画
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c]) {
        ctx.fillStyle = grid[r][c];
        ctx.fillRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    }
  }
  // 現在のピースを描画
  if (currentPiece) {
    for (let r = 0; r < currentPiece.shape.length; r++) {
      for (let c = 0; c < currentPiece.shape[r].length; c++) {
        if (currentPiece.shape[r][c]) {
          ctx.fillStyle = currentPiece.color;
          ctx.fillRect((currentPiece.x + c) * BLOCK_SIZE, (currentPiece.y + r) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }
      }
    }
  }
  // スコア表示
  ctx.fillStyle = "white";
  ctx.font = "14px 'Press Start 2P'";
  ctx.fillText("SCORE: " + score, 5, 15);
  ctx.fillText("LEVEL: " + level, 5, 35);
}

function createEmptyGrid() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

// 衝突判定
function collide(piece, grid) {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        let newY = piece.y + r;
        let newX = piece.x + c;
        if (newY >= ROWS || newX < 0 || newX >= COLS || grid[newY][newX]) {
          return true;
        }
      }
    }
  }
  return false;
}

// ピースを固定
function merge(piece, grid) {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        grid[piece.y + r][piece.x + c] = piece.color;
      }
    }
  }
}

// ライン消去
function clearLines() {
  let linesCleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (grid[r].every(cell => cell)) {
      grid.splice(r, 1);
      grid.unshift(Array(COLS).fill(0));
      linesCleared++;
      r++; // もう一度同じ行をチェック
    }
  }
  if (linesCleared > 0) {
    score += linesCleared * 100;
    level = Math.floor(score / 500);
    updateSpeed();
  }
}

// ピース回転
function rotate(piece) {
  const newShape = piece.shape[0].map((_, c) =>
    piece.shape.map(row => row[c]).reverse()
  );
  return newShape;
}

// スピード更新
function updateSpeed() {
  clearInterval(gameInterval);
  speed = Math.max(100, 500 - level * 50);
  gameInterval = setInterval(gameLoop, speed);
}

function startGame() {
  isGameOver = false;
  grid = createEmptyGrid();
  score = 0;
  level = 0;
  speed = 500;
  currentPiece = createPiece();
  overlay.classList.add('hidden');
  startSound.play();
  
  setTimeout(() => {
    bgm.play();
    gameInterval = setInterval(gameLoop, speed);
  }, 1000);
}

function gameLoop() {
  if (isGameOver) return;
  
  // 1マス落下
  currentPiece.y++;
  if (collide(currentPiece, grid)) {
    currentPiece.y--; // 戻す
    merge(currentPiece, grid);
    dropSound.play(); // ← 着地時に音を鳴らす
    clearLines();
    currentPiece = createPiece();
    if (collide(currentPiece, grid)) {
      endGame();
    }
  }

  drawGrid();
}

function endGame() {
  clearInterval(gameInterval);
  bgm.pause();
  bgm.currentTime = 0;
  gameOverSound.play();
  overlay.classList.remove('hidden');
  startButton.textContent = 'RETRY';
  isGameOver = true;
}

document.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    if (isGameOver || !overlay.classList.contains('hidden')) {
      startGame();
    } else {
      // ハードドロップ
      while (!collide(currentPiece, grid)) {
        currentPiece.y++;
      }
      currentPiece.y--; // 1マス戻す
      merge(currentPiece, grid);
      dropSound.play(); // ← ハードドロップでも着地音
      clearLines();
      currentPiece = createPiece();
      if (collide(currentPiece, grid)) {
        endGame();
      }
    }
  }
  if (!isGameOver && overlay.classList.contains('hidden')) {
    if (e.code === 'ArrowLeft') {
      currentPiece.x--;
      if (collide(currentPiece, grid)) currentPiece.x++;
    }
    if (e.code === 'ArrowRight') {
      currentPiece.x++;
      if (collide(currentPiece, grid)) currentPiece.x--;
    }
    if (e.code === 'ArrowDown') {
      currentPiece.y++;
      if (collide(currentPiece, grid)) currentPiece.y--;
    }
    if (e.code === 'ArrowUp') {
      const oldShape = currentPiece.shape;
      currentPiece.shape = rotate(currentPiece);
      if (collide(currentPiece, grid)) {
        currentPiece.shape = oldShape; // 回転キャンセル
      }
    }
    drawGrid();
  }
});

startButton.addEventListener('click', startGame);
