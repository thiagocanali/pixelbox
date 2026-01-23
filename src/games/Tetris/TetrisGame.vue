<template>
  <div class="tetris-container">
    <div class="stats">
      <p>SCORE: {{ score }}</p>
      <button @click="$emit('exit')">VOLTAR</button>
    </div>
    <canvas ref="canvas" width="240" height="400"></canvas>
    <div v-if="gameOver" class="overlay">
      <h2>SYSTEM FAILURE</h2>
      <button @click="reset">REBOOT</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const canvas = ref(null);
const score = ref(0);
const gameOver = ref(false);
let ctx, player, board, requestId;

const createPiece = (type) => {
  if (type === 'T') return [[0, 1, 0], [1, 1, 1], [0, 0, 0]];
  if (type === 'O') return [[2, 2], [2, 2]];
  if (type === 'L') return [[0, 3, 0], [0, 3, 0], [0, 3, 3]];
  if (type === 'I') return [[0, 4, 0, 0], [0, 4, 0, 0], [0, 4, 0, 0], [0, 4, 0, 0]];
  return [[5, 5, 0], [0, 5, 5], [0, 0, 0]];
};

const draw = () => {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);
  drawMatrix(board, {x: 0, y: 0});
  drawMatrix(player.matrix, player.pos);
};

const drawMatrix = (matrix, offset) => {
  const colors = [null, '#ff00ff', '#00ff00', '#00ffff', '#ffff00', '#ff0000'];
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        ctx.fillStyle = colors[value];
        ctx.fillRect((x + offset.x) * 20, (y + offset.y) * 20, 18, 18);
      }
    });
  });
};

const merge = (board, player) => {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) board[y + player.pos.y][x + player.pos.x] = value;
    });
  });
};

const collide = (board, player) => {
  const [m, o] = [player.matrix, player.pos];
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 && (board[y + o.y] && board[y + o.y][x + o.x]) !== 0) return true;
    }
  }
  return false;
};

const playerDrop = () => {
  player.pos.y++;
  if (collide(board, player)) {
    player.pos.y--;
    merge(board, player);
    playerReset();
    arenaSweep();
  }
  dropCounter = 0;
};

const arenaSweep = () => {
  outer: for (let y = board.length - 1; y > 0; --y) {
    for (let x = 0; x < board[y].length; ++x) {
      if (board[y][x] === 0) continue outer;
    }
    const row = board.splice(y, 1)[0].fill(0);
    board.unshift(row);
    score.value += 10;
    y++;
  }
};

const playerReset = () => {
  const pieces = 'ILJOTSZ';
  player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
  player.pos.y = 0;
  player.pos.x = (board[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
  if (collide(board, player)) {
    gameOver.value = true;
  }
};

let dropCounter = 0;
let lastTime = 0;
const update = (time = 0) => {
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if (dropCounter > 1000) playerDrop();
  draw();
  if (!gameOver.value) requestId = requestAnimationFrame(update);
};

const reset = () => {
  board = Array.from({length: 20}, () => Array(12).fill(0));
  player = { pos: {x: 0, y: 0}, matrix: null };
  score.value = 0;
  gameOver.value = false;
  playerReset();
  update();
};

onMounted(() => {
  ctx = canvas.value.getContext('2d');
  window.addEventListener('keydown', handleKey);
  reset();
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKey);
  cancelAnimationFrame(requestId);
});

const handleKey = (e) => {
  if (e.key === 'ArrowLeft') { player.pos.x--; if (collide(board, player)) player.pos.x++; }
  if (e.key === 'ArrowRight') { player.pos.x++; if (collide(board, player)) player.pos.x--; }
  if (e.key === 'ArrowDown') playerDrop();
};
</script>

<style scoped>
.tetris-container { display: flex; flex-direction: column; align-items: center; background: #050505; height: 100%; padding: 10px; }
.stats { color: #00ffff; display: flex; gap: 20px; margin-bottom: 10px; }
canvas { border: 4px solid #222; box-shadow: 0 0 20px rgba(0,255,255,0.1); }
.overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.9); padding: 30px; border: 2px solid #ff0000; text-align: center; }
button { background: none; border: 1px solid #00ffff; color: #00ffff; cursor: pointer; padding: 5px 15px; }
</style>