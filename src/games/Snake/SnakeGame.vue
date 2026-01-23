<template>
  <div class="game-container">
    <div class="hud">
      <span>SCORE: {{ score }}</span>
      <button @click="$emit('exit')">SAIR</button>
    </div>
    <canvas ref="canvas" width="400" height="400"></canvas>
    <div v-if="gameOver" class="overlay">
      <h2>GAME OVER</h2>
      <button @click="resetGame">RECOMEÇAR</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const canvas = ref(null);
const score = ref(0);
const gameOver = ref(false);
let ctx, interval;

const snake = ref([{ x: 10, y: 10 }]);
const food = ref({ x: 5, y: 5 });
const direction = ref({ x: 0, y: 0 });
const gridSize = 20;

const resetGame = () => {
  snake.value = [{ x: 10, y: 10 }];
  direction.value = { x: 1, y: 0 };
  score.value = 0;
  gameOver.value = false;
  spawnFood();
};

const spawnFood = () => {
  food.value = {
    x: Math.floor(Math.random() * (400 / gridSize)),
    y: Math.floor(Math.random() * (400 / gridSize))
  };
};

const update = () => {
  if (gameOver.value) return;

  const head = { x: snake.value[0].x + direction.value.x, y: snake.value[0].y + direction.value.y };

  // Colisão com paredes ou corpo
  if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20 || 
      snake.value.some(s => s.x === head.x && s.y === head.y)) {
    gameOver.value = true;
    return;
  }

  snake.value.unshift(head);

  if (head.x === food.value.x && head.y === food.value.y) {
    score.value += 10;
    spawnFood();
  } else {
    snake.value.pop();
  }

  draw();
};

const draw = () => {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 400, 400);

  ctx.fillStyle = '#ff00ff'; // Comidinha neon
  ctx.fillRect(food.value.x * gridSize, food.value.y * gridSize, gridSize - 2, gridSize - 2);

  ctx.fillStyle = '#00ff00'; // Cobra neon
  snake.value.forEach(s => {
    ctx.fillRect(s.x * gridSize, s.y * gridSize, gridSize - 2, gridSize - 2);
  });
};

const handleKey = (e) => {
  const keys = {
    ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }
  };
  if (keys[e.key]) {
    // Evita inverter a direção diretamente
    const newDir = keys[e.key];
    if (newDir.x !== -direction.value.x && newDir.y !== -direction.value.y) {
      direction.value = newDir;
    }
  }
};

onMounted(() => {
  ctx = canvas.value.getContext('2d');
  window.addEventListener('keydown', handleKey);
  resetGame();
  interval = setInterval(update, 100);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKey);
  clearInterval(interval);
});
</script>

<style scoped>
.game-container { position: relative; display: flex; flex-direction: column; align-items: center; background: #111; height: 100%; }
.hud { width: 100%; display: flex; justify-content: space-between; padding: 10px; color: #00ff00; }
canvas { border: 2px solid #333; background: #000; }
.overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.8); padding: 20px; text-align: center; border: 2px solid #ff00ff; }
button { background: transparent; border: 1px solid #00ff00; color: #00ff00; cursor: pointer; padding: 5px 10px; }
button:hover { background: #00ff00; color: #000; }
</style>