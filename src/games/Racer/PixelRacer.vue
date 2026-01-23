<template>
  <div class="racer-container">
    <div class="hud">
      <span>DISTANCE: {{ Math.floor(distance) }}m</span>
      <span>SPEED: {{ Math.floor(speed * 10) }}km/h</span>
    </div>
    <canvas ref="canvas" width="400" height="500"></canvas>
    <div v-if="gameOver" class="overlay">
      <h2>CRASHED!</h2>
      <button @click="reset">RESTART [ENTER]</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { fx } from '../../utils/sounds';

const canvas = ref(null);
const distance = ref(0);
const speed = ref(5.5);
const gameOver = ref(false);
let ctx, requestId;

const car = { x: 180, y: 400, w: 40, h: 70 };
let obstacles = [];
let roadOffset = 0;
let lastSpawnTime = 0;

const spawnObstacles = () => {
  const lanes = [80, 180, 280];
  // Escolhe uma faixa para ficar LIVRE obrigatoriamente
  const freeLaneIndex = Math.floor(Math.random() * 3);
  
  lanes.forEach((laneX, index) => {
    if (index !== freeLaneIndex) {
      // Chance de 70% de spawnar nas outras faixas (evita corredores vazios demais)
      if (Math.random() > 0.3) {
        obstacles.push({ x: laneX, y: -100, w: 40, h: 70, color: '#ff00ff' });
      }
    }
  });
};

const update = (time) => {
  if (gameOver.value) return;

  distance.value += speed.value / 10;
  roadOffset = (roadOffset + speed.value) % 100;

  // Spawn baseado em tempo/distância para evitar aglomeração
  if (time - lastSpawnTime > 1500 - (speed.value * 50)) {
    spawnObstacles();
    lastSpawnTime = time;
  }

  obstacles.forEach((obs, i) => {
    obs.y += speed.value;
    if (obs.x < car.x + car.w && obs.x + obs.w > car.x &&
        obs.y < car.y + car.h && obs.y + obs.h > car.y) {
      gameOver.value = true;
      fx.explode();
    }
    if (obs.y > 600) obstacles.splice(i, 1);
  });

  draw();
  requestId = requestAnimationFrame(update);
};

const draw = () => {
  ctx.fillStyle = '#004400'; ctx.fillRect(0, 0, 400, 500);
  ctx.fillStyle = '#333'; ctx.fillRect(50, 0, 300, 500);
  ctx.strokeStyle = '#fff';
  ctx.setLineDash([20, 30]); ctx.lineDashOffset = -roadOffset;
  ctx.beginPath();
  ctx.moveTo(133, 0); ctx.lineTo(133, 500);
  ctx.moveTo(266, 0); ctx.lineTo(266, 500);
  ctx.stroke();
  ctx.fillStyle = '#00ff41'; ctx.fillRect(car.x, car.y, car.w, car.h);
  obstacles.forEach(obs => {
    ctx.fillStyle = obs.color; ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
  });
};

const handleKeys = (e) => {
  if (gameOver.value && e.key === 'Enter') { reset(); return; }
  // Movimento lateral suave ou fixo por faixas
  if (e.key === 'ArrowLeft' && car.x > 80) car.x -= 100;
  if (e.key === 'ArrowRight' && car.x < 280) car.x += 100;
};

const reset = () => {
  cancelAnimationFrame(requestId);
  obstacles = []; distance.value = 0; speed.value = 5.5;
  gameOver.value = false; car.x = 180;
  lastSpawnTime = performance.now();
  requestId = requestAnimationFrame(update);
};

onMounted(() => {
  ctx = canvas.value.getContext('2d');
  window.addEventListener('keydown', handleKeys);
  lastSpawnTime = performance.now();
  requestId = requestAnimationFrame(update);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeys);
  cancelAnimationFrame(requestId);
});
</script>

<style scoped>
.racer-container { background: #000; height: 100%; display: flex; flex-direction: column; align-items: center; }
.hud { color: #00ff41; padding: 10px; display: flex; gap: 30px; font-family: monospace; }
canvas { border-left: 5px solid #555; border-right: 5px solid #555; }
.overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.9); padding: 30px; border: 2px solid #ff00ff; text-align: center; }
button { background: none; border: 1px solid #00ff41; color: #00ff41; padding: 10px; cursor: pointer; margin-top: 10px; font-family: inherit; }
</style>