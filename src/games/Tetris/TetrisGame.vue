<template>
  <div class="tetris-container">
    <div class="hud">
      <div class="stat">PONTOS: {{ score }}</div>
      <div class="stat">LINHAS: {{ lines }}</div>
    </div>
    <canvas ref="canvas" width="240" height="400"></canvas>
    <div v-if="gameOver" class="overlay">
      <h2>GAME_OVER</h2>
      <button @click="reset">REBOOT [ENTER]</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { fx } from '../../utils/sounds';

const canvas = ref(null);
const score = ref(0);
const lines = ref(0);
const gameOver = ref(false);
let ctx, requestId, dropCounter = 0, dropInterval = 1000, lastTime = 0;

// Cores Neon
const colors = [null, '#ff00ff', '#00ff41', '#00ffff', '#ffff00', '#ff8000', '#0000ff', '#ff0000'];

// Definição das Peças
const pieces = 'ILJOTSZ';
const createPiece = (type) => {
  if (type === 'I') return [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]];
  if (type === 'L') return [[0,2,0],[0,2,0],[0,2,2]];
  if (type === 'J') return [[0,3,0],[0,3,0],[3,3,0]];
  if (type === 'O') return [[4,4],[4,4]];
  if (type === 'T') return [[0,5,0],[5,5,5],[0,0,0]];
  if (type === 'S') return [[0,6,6],[6,6,0],[0,0,0]];
  if (type === 'Z') return [[7,7,0],[0,7,7],[0,0,0]];
};

const arena = Array.from({length: 20}, () => Array(12).fill(0));
const player = { pos: {x: 0, y: 0}, matrix: null };

// Efeito Visual de Linha Completada
let flashLines = [];

const rotate = (matrix) => {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  matrix.forEach(row => row.reverse());
};

const playerRotate = () => {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix);
  while (collide()) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix);
      rotate(player.matrix);
      rotate(player.matrix);
      player.pos.x = pos;
      return;
    }
  }
  fx.shoot(); // Som de rotação
};

const collide = () => {
  const [m, o] = [player.matrix, player.pos];
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) return true;
    }
  }
  return false;
};

const merge = () => {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) arena[y + player.pos.y][x + player.pos.x] = value;
    });
  });
};

const arenaSweep = () => {
  let rowCount = 1;
  for (let y = arena.length - 1; y > 0; --y) {
    if (arena[y].every(value => value !== 0)) {
      // Adiciona linha para animação de flash
      flashLines.push(y);
      
      const row = arena.splice(y, 1)[0].fill(0);
      arena.unshift(row);
      ++y;
      score.value += rowCount * 10;
      lines.value++;
      rowCount *= 2;
      fx.shoot(); // Feedback sonoro
    }
  }
  if (flashLines.length > 0) {
    setTimeout(() => { flashLines = []; }, 100); // Remove o flash após 100ms
  }
};

const playerDrop = () => {
  player.pos.y++;
  if (collide()) {
    player.pos.y--;
    merge();
    playerReset();
    arenaSweep();
  }
  dropCounter = 0;
};

const playerReset = () => {
  player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
  player.pos.y = 0;
  player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
  if (collide()) {
    gameOver.value = true;
    fx.explode();
  }
};

const update = (time = 0) => {
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if (dropCounter > dropInterval) playerDrop();
  draw();
  requestId = requestAnimationFrame(update);
};

const draw = () => {
  // Fundo
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);

  // Desenha Arena
  arena.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        ctx.fillStyle = colors[value];
        ctx.fillRect(x * 20, y * 20, 19, 19);
      }
    });
  });

  // Desenha Peça Atual
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        ctx.fillStyle = colors[value];
        ctx.fillRect((x + player.pos.x) * 20, (y + player.pos.y) * 20, 19, 19);
      }
    });
  });

  // Animação de Flash nas linhas completadas
  flashLines.forEach(y => {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, y * 20, canvas.value.width, 20);
  });
};

const handleKeys = (e) => {
  if (gameOver.value && e.key === 'Enter') { reset(); return; }
  if (e.key === 'ArrowLeft') { player.pos.x--; if(collide()) player.pos.x++; }
  if (e.key === 'ArrowRight') { player.pos.x++; if(collide()) player.pos.x--; }
  if (e.key === 'ArrowDown') playerDrop();
  if (e.key === ' ' || e.key === 'ArrowUp') playerRotate(); // ESPAÇO ou SETA CIMA rotaciona
};

const reset = () => {
  arena.forEach(row => row.fill(0));
  score.value = 0;
  lines.value = 0;
  gameOver.value = false;
  playerReset();
};

onMounted(() => {
  ctx = canvas.value.getContext('2d');
  window.addEventListener('keydown', handleKeys);
  playerReset();
  update();
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeys);
  cancelAnimationFrame(requestId);
});
</script>

<style scoped>
.tetris-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #000;
  height: 100%;
  position: relative;
}
.hud {
  display: flex;
  gap: 20px;
  color: #00ff41;
  font-family: monospace;
  padding: 10px;
}
canvas {
  border: 2px solid #333;
  max-height: 70vh; /* Responsividade para telas baixas */
  width: auto;
}
.overlay {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0,0,0,0.9);
  padding: 20px;
  border: 2px solid var(--neon-pink);
  text-align: center;
  color: #fff;
}
button {
  background: #111;
  border: 1px solid #00ff41;
  color: #00ff41;
  padding: 8px 15px;
  cursor: pointer;
  margin-top: 10px;
  font-family: inherit;
}
</style>