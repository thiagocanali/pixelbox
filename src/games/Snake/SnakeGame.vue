<template>
  <div class="snake-container">
    <div class="hud">SCORE: {{ score }} | BITCOINS: {{ coins }}</div>
    <canvas ref="canvas" width="400" height="400"></canvas>
    <div v-if="gameOver" class="overlay">
      <h2>SEGMENT_FAULT</h2>
      <button @click="reset">REBOOT [ENTER]</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { fx } from '../../utils/sounds';

const canvas = ref(null);
const score = ref(0);
const coins = ref(0);
const gameOver = ref(false);
let ctx, requestId, lastTime = 0;

const gridSize = 20;
const tileCount = 20;

let snake = [{ x: 10, y: 10 }];
let food = { x: 5, y: 5 };
let coin = { x: -1, y: -1 };
let direction = { x: 0, y: 0 };
let nextDirection = { x: 0, y: 0 };
let gameSpeed = 120; // Velocidade inicial estável

const init = () => {
  snake = [{ x: 10, y: 10 }];
  direction = { x: 0, y: 0 };
  nextDirection = { x: 0, y: 0 };
  score.value = 0;
  gameOver.value = false;
  spawnFood();
};

const spawnFood = () => {
  food = { 
    x: Math.floor(Math.random() * tileCount), 
    y: Math.floor(Math.random() * tileCount) 
  };
  // Spawn raro de moeda
  if (Math.random() > 0.8) {
    coin = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) };
  }
};

const update = (time) => {
  if (gameOver.value) return;

  if (time - lastTime > gameSpeed) {
    direction = nextDirection;
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // PAREDES INFINITAS (PORTAL)
    if (head.x < 0) head.x = tileCount - 1;
    if (head.x >= tileCount) head.x = 0;
    if (head.y < 0) head.y = tileCount - 1;
    if (head.y >= tileCount) head.y = 0;

    // Colisão com o corpo (apenas se estiver movendo)
    if ((direction.x !== 0 || direction.y !== 0) && 
        snake.some(s => s.x === head.x && s.y === head.y)) {
      gameOver.value = true;
      fx.explode();
      return;
    }

    snake.unshift(head);

    // Comer comida
    if (head.x === food.x && head.y === food.y) {
      score.value += 10;
      fx.shoot();
      spawnFood();
      if (gameSpeed > 60) gameSpeed -= 1; // Aumenta velocidade sutilmente
    } else if (head.x === coin.x && head.y === coin.y) {
      coins.value++;
      fx.shoot();
      coin = { x: -1, y: -1 };
    } else {
      snake.pop();
    }
    lastTime = time;
  }

  draw();
  requestId = requestAnimationFrame(update);
};

const draw = () => {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 400, 400);

  // Comida Neon Pink
  ctx.fillStyle = '#ff00ff';
  ctx.fillRect(food.x * gridSize + 2, food.y * gridSize + 2, gridSize - 4, gridSize - 4);

  // Moeda Gold
  if (coin.x !== -1) {
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(coin.x * gridSize + 10, coin.y * gridSize + 10, 6, 0, 7);
    ctx.fill();
  }

  // Cobra Neon Green
  snake.forEach((s, i) => {
    ctx.fillStyle = i === 0 ? '#fff' : '#00ff41';
    ctx.fillRect(s.x * gridSize + 1, s.y * gridSize + 1, gridSize - 2, gridSize - 2);
  });
};

const handleKeys = (e) => {
  if (gameOver.value && e.key === 'Enter') { reset(); return; }
  
  const key = e.key;
  if (key === 'ArrowUp' && direction.y === 0) nextDirection = { x: 0, y: -1 };
  if (key === 'ArrowDown' && direction.y === 0) nextDirection = { x: 0, y: 1 };
  if (key === 'ArrowLeft' && direction.x === 0) nextDirection = { x: -1, y: 0 };
  if (key === 'ArrowRight' && direction.x === 0) nextDirection = { x: 1, y: 0 };
};

const reset = () => { init(); };

onMounted(() => {
  ctx = canvas.value.getContext('2d');
  window.addEventListener('keydown', handleKeys);
  init();
  update(0);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeys);
  cancelAnimationFrame(requestId);
});
</script>

<style scoped>
.snake-container { background: #000; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.hud { color: #00ff41; font-family: monospace; font-size: 1.2rem; margin-bottom: 10px; }
canvas { border: 2px solid #333; box-shadow: 0 0 20px rgba(0, 255, 65, 0.2); }
.overlay { position: absolute; background: rgba(0,0,0,0.9); padding: 30px; border: 2px solid #ff00ff; text-align: center; color: white; }
button { background: none; border: 1px solid #00ff41; color: #00ff41; padding: 10px 20px; cursor: pointer; margin-top: 15px; }
</style>