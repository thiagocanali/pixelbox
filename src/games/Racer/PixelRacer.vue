<template>
  <div class="racer-container">
    <div class="hud">
      <span>DISTÂNCIA: {{ Math.floor(distance) }}m</span>
      <span>MOEDAS: {{ coins }}</span>
      <span class="speed-alert" v-if="speed > 8">NITRO!</span>
    </div>
    <canvas ref="canvas" width="400" height="500"></canvas>
    <div v-if="gameOver" class="overlay">
      <h2>CRASHED!</h2>
      <button @click="reset">REBOOT [ENTER]</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { fx } from '../../utils/sounds';

const canvas = ref(null);
const distance = ref(0);
const coins = ref(0);
const speed = ref(5);
const gameOver = ref(false);
let ctx, requestId, lastTime = 0, roadOffset = 0;

const car = { x: 180, y: 400, w: 35, h: 60 };
let obstacles = [];
let collectibles = [];

const spawnItems = () => {
  const lanes = [85, 185, 285];
  const freeLane = Math.floor(Math.random() * 3);
  
  lanes.forEach((laneX, i) => {
    if (i !== freeLane && Math.random() > 0.4) {
      obstacles.push({ x: laneX, y: -100, w: 35, h: 60 });
    } else if (i === freeLane && Math.random() > 0.7) {
      collectibles.push({ x: laneX + 10, y: -100, r: 8 });
    }
  });
};

const update = (time) => {
  if (gameOver.value) return;

  distance.value += speed.value / 10;
  speed.value = 5 + (distance.value / 500); // Aumenta velocidade gradualmente
  roadOffset = (roadOffset + speed.value) % 100;

  if (time - lastTime > 1200 - (speed.value * 40)) {
    spawnItems();
    lastTime = time;
  }

  // Lógica Obstáculos
  obstacles.forEach((obs, i) => {
    obs.y += speed.value;
    if (obs.x < car.x + car.w && obs.x + obs.w > car.x && obs.y < car.y + car.h && obs.y + obs.h > car.y) {
      gameOver.value = true;
      fx.explode();
    }
    if (obs.y > 600) obstacles.splice(i, 1);
  });

  // Lógica Moedas
  collectibles.forEach((c, i) => {
    c.y += speed.value;
    const dist = Math.hypot(c.x - (car.x + car.w/2), c.y - (car.y + car.h/2));
    if (dist < 30) {
      collectibles.splice(i, 1);
      coins.value++;
      fx.shoot();
    }
    if (c.y > 600) collectibles.splice(i, 1);
  });

  draw();
  requestId = requestAnimationFrame(update);
};

const draw = () => {
  // Grama
  ctx.fillStyle = '#0a4d0a'; ctx.fillRect(0, 0, 400, 500);
  // Estrada
  ctx.fillStyle = '#222'; ctx.fillRect(50, 0, 300, 500);
  // Faixas Laterais
  ctx.fillStyle = '#fff';
  ctx.fillRect(55, 0, 5, 500); ctx.fillRect(340, 0, 5, 500);
  
  // Linha tracejada central
  ctx.strokeStyle = '#fff'; ctx.setLineDash([30, 30]);
  ctx.lineDashOffset = -roadOffset;
  ctx.beginPath(); ctx.moveTo(150, 0); ctx.lineTo(150, 500);
  ctx.moveTo(250, 0); ctx.lineTo(250, 500); ctx.stroke();

  // Desenhar Carro (Estilo Retro)
  ctx.fillStyle = '#00ff41'; ctx.fillRect(car.x, car.y, car.w, car.h);
  ctx.fillStyle = '#000'; ctx.fillRect(car.x+5, car.y+10, 25, 15); // Para-brisa

  // Desenhar Obstáculos (Carros Vermelhos)
  obstacles.forEach(o => {
    ctx.fillStyle = '#ff0055'; ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = '#fff'; ctx.fillRect(o.x+5, o.y+45, 25, 10);
  });

  // Desenhar Moedas
  collectibles.forEach(c => {
    ctx.fillStyle = '#ffd700';
    ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.stroke();
  });
};

const handleKeys = (e) => {
  if (gameOver.value && e.key === 'Enter') reset();
  if (e.key === 'ArrowLeft' && car.x > 100) car.x -= 100;
  if (e.key === 'ArrowRight' && car.x < 250) car.x += 100;
};

const reset = () => {
  obstacles = []; collectibles = []; distance.value = 0; speed.value = 5;
  gameOver.value = false; car.x = 180; lastTime = performance.now();
};

onMounted(() => { ctx = canvas.value.getContext('2d'); window.addEventListener('keydown', handleKeys); update(0); });
onUnmounted(() => { window.removeEventListener('keydown', handleKeys); cancelAnimationFrame(requestId); });
</script>

<style scoped>
.racer-container { background: #000; height: 100%; display: flex; flex-direction: column; align-items: center; }
.hud { color: #00ff41; font-family: monospace; padding: 10px; display: flex; gap: 20px; font-weight: bold; }
.speed-alert { color: #ff00ff; animation: blink 0.3s infinite; }
canvas { border: 4px solid #333; max-height: 80vh; }
.overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.9); padding: 30px; border: 2px solid #ff00ff; text-align: center; }
button { background: none; border: 1px solid #00ff41; color: #00ff41; padding: 10px; cursor: pointer; margin-top: 10px; }
</style>