<template>
  <div class="jump-container">
    <div class="hud-top">
      <span>ALTITUDE: {{ Math.floor(score) }}m</span>
      <span>₿: {{ coins }}</span>
    </div>
    <canvas ref="canvas" width="400" height="500"></canvas>
    <div v-if="gameOver" class="overlay">
      <h2>REBOOT_REQUIRED</h2>
      <button @click="reset">RESTART [ENTER]</button>
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
let ctx, player, platforms = [], requestId;

const init = () => {
  player = { x: 190, y: 400, w: 20, h: 20, vy: 0, jump: -12 };
  platforms = [];
  platforms.push({ x: 50, y: 450, w: 300, h: 10, hasCoin: false });
  
  for(let i=0; i<6; i++) {
    platforms.push({ x: Math.random() * 300, y: i * 80, w: 70, h: 10, hasCoin: Math.random() > 0.7 });
  }
  score.value = 0;
};

const update = () => {
  if (gameOver.value) return;

  // DIFICULDADE PROGRESSIVA
  const difficulty = score.value > 1000 ? 0.45 : 0.35;
  const platWidth = score.value > 1500 ? 45 : 70;

  player.vy += difficulty;
  player.y += player.vy;

  if (player.y < 250) {
    let diff = 250 - player.y;
    player.y = 250;
    score.value += diff / 10;
    platforms.forEach(p => {
      p.y += diff;
      if (p.y > 500) {
        p.y = 0;
        p.x = Math.random() * (400 - platWidth);
        p.w = platWidth;
        p.hasCoin = Math.random() > 0.6;
      }
    });
  }

  platforms.forEach(p => {
    // Colisão Plataforma
    if (player.vy > 0 && player.x + player.w > p.x && player.x < p.x + p.w &&
        player.y + player.h > p.y && player.y + player.h < p.y + p.h + player.vy) {
      player.vy = player.jump;
      fx.shoot();
    }
    // Colisão Moeda
    if (p.hasCoin && player.x + player.w > p.x && player.x < p.x + p.w &&
        player.y + player.h > p.y - 20 && player.y < p.y) {
      p.hasCoin = false;
      coins.value++;
      fx.shoot();
    }
  });

  if (player.y > 550) { gameOver.value = true; fx.explode(); }

  draw();
  requestId = requestAnimationFrame(update);
};

const draw = () => {
  ctx.fillStyle = '#000'; ctx.fillRect(0,0,400,500);
  ctx.fillStyle = '#00ff41'; ctx.fillRect(player.x, player.y, player.w, player.h);
  
  platforms.forEach(p => {
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    if (p.hasCoin) {
      ctx.fillStyle = '#ffd700';
      ctx.beginPath(); ctx.arc(p.x + p.w/2, p.y - 10, 5, 0, 7); ctx.fill();
    }
  });
};

const handleKeys = (e) => {
  if (e.key === 'ArrowLeft') player.x -= 30;
  if (e.key === 'ArrowRight') player.x += 30;
  if (player.x < -20) player.x = 400; if (player.x > 400) player.x = -20;
  if (gameOver.value && e.key === 'Enter') reset();
};

const reset = () => { cancelAnimationFrame(requestId); init(); gameOver.value = false; update(); };
onMounted(() => { ctx = canvas.value.getContext('2d'); window.addEventListener('keydown', handleKeys); init(); update(); });
onUnmounted(() => { window.removeEventListener('keydown', handleKeys); cancelAnimationFrame(requestId); });
</script>

<style scoped>
.jump-container { background: #000; height: 100%; position: relative; display: flex; flex-direction: column; align-items: center; }
.hud-top { position: absolute; top: 10px; width: 100%; display: flex; justify-content: space-around; color: #00ff41; font-family: monospace; font-size: 1.2rem; z-index: 10; pointer-events: none; }
canvas { border: 2px solid #333; margin-top: 40px; }
.overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.9); padding: 20px; border: 2px solid #ff00ff; text-align: center; color: #fff; z-index: 20; }
button { background: #111; border: 1px solid #00ff41; color: #00ff41; padding: 10px; cursor: pointer; margin-top: 10px; }
</style>