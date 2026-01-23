<template>
  <div class="pinball-container">
    <div class="hud">
      <div class="score-box">SCORE: <span>{{ score.toLocaleString() }}</span></div>
      <div class="multiplier" v-if="multi > 1">x{{ multi }} BONUS</div>
      <div class="balls-box">BALLS: {{ balls }}</div>
    </div>
    <canvas ref="canvas" width="360" height="600"></canvas>
    <div v-if="gameOver" class="overlay">
      <h2 class="neon-text">GAME OVER</h2>
      <p>FINAL SCORE: {{ score }}</p>
      <button @click="reset">INSERT COIN [ENTER]</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive } from 'vue';
import { fx } from '../../utils/sounds';

const canvas = ref(null);
const score = ref(0);
const balls = ref(3);
const multi = ref(1);
const gameOver = ref(false);
let ctx, requestId;

// Estado da bola com rastro (trail)
const ball = reactive({ 
  x: 180, y: 100, vx: 4, vy: 4, r: 7, 
  trail: [] 
});

const flippers = { 
  left: { x: 85, y: 530, w: 80, active: false, color: '#00ff41' },
  right: { x: 195, y: 530, w: 80, active: false, color: '#ff00ff' }
};

// Elementos da mesa
const bumpers = [
  { x: 100, y: 180, r: 25, color: '#00ffff', active: false },
  { x: 260, y: 180, r: 25, color: '#00ffff', active: false },
  { x: 180, y: 300, r: 35, color: '#ffff00', active: false }
];

const targets = [
  { x: 15, y: 250, w: 10, h: 60, hit: false },
  { x: 335, y: 250, w: 10, h: 60, hit: false }
];

const update = () => {
  if (gameOver.value) return;

  // Física e Gravidade
  ball.vy += 0.28;
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Rastro (Trail)
  ball.trail.push({ x: ball.x, y: ball.y });
  if (ball.trail.length > 8) ball.trail.shift();

  // Colisões com Paredes
  if (ball.x < 15 || ball.x > 345) { 
    ball.vx *= -1; 
    ball.x = ball.x < 15 ? 16 : 344;
    fx.shoot();
  }
  if (ball.y < 15) { 
    ball.vy *= -1; 
    ball.y = 16;
    fx.shoot();
  }

  // FÍSICA DO FUNIL (Melhorada)
  if (ball.y > 480) {
    if (ball.x < 85 && ball.y > ball.x + 400) { // Rampa esquerda
      ball.vx += 1.5; ball.vy *= 0.95;
    }
    if (ball.x > 275 && ball.y > (360 - ball.x) + 400) { // Rampa direita
      ball.vx -= 1.5; ball.vy *= 0.95;
    }
  }

  // Bumpers
  bumpers.forEach(b => {
    const dist = Math.hypot(ball.x - b.x, ball.y - b.y);
    if (dist < b.r + ball.r) {
      const angle = Math.atan2(ball.y - b.y, ball.x - b.x);
      ball.vx = Math.cos(angle) * 10;
      ball.vy = Math.sin(angle) * 10;
      score.value += 100 * multi.value;
      b.active = true;
      fx.shoot();
      setTimeout(() => b.active = false, 100);
    }
  });

  // Targets laterais (Aumentam multiplicador)
  targets.forEach(t => {
    if (!t.hit && ball.x + ball.r > t.x && ball.x - ball.r < t.x + t.w && ball.y > t.y && ball.y < t.y + t.h) {
      t.hit = true;
      multi.value++;
      score.value += 500;
      fx.shoot();
      setTimeout(() => t.hit = false, 5000); // Reseta após 5 segundos
    }
  });

  // Flippers (Lógica de "Kick")
  [flippers.left, flippers.right].forEach((f, i) => {
    const isRight = i === 1;
    if (ball.y > f.y - 15 && ball.y < f.y + 20 && ball.x > f.x && ball.x < f.x + f.w) {
      // Se apertar o flipper no momento exato, a bola ganha mais força
      ball.vy = f.active ? -14 : -7;
      ball.vx = (ball.x - (f.x + f.w/2)) * 0.45;
      score.value += 10;
      fx.shoot();
    }
  });

  // Perder bola
  if (ball.y > 620) {
    balls.value--;
    multi.value = 1;
    if (balls.value <= 0) {
      gameOver.value = true;
      fx.explode();
    } else {
      resetBall();
    }
  }

  draw();
  requestId = requestAnimationFrame(update);
};

const draw = () => {
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, 360, 600);

  // Desenhar Funil e Bordas
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(15, 480); ctx.lineTo(15, 15); ctx.lineTo(345, 15); ctx.lineTo(345, 480);
  ctx.stroke();
  
  // Rampa visual do funil
  ctx.strokeStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.moveTo(15, 480); ctx.lineTo(85, 550);
  ctx.moveTo(345, 480); ctx.lineTo(275, 550);
  ctx.stroke();

  // Desenhar Rastro
  ball.trail.forEach((t, i) => {
    ctx.fillStyle = `rgba(255, 255, 255, ${i / 10})`;
    ctx.beginPath(); ctx.arc(t.x, t.y, ball.r * (i / 8), 0, Math.PI * 2); ctx.fill();
  });

  // Bumpers
  bumpers.forEach(b => {
    ctx.shadowBlur = b.active ? 20 : 5;
    ctx.shadowColor = b.color;
    ctx.fillStyle = b.active ? '#fff' : b.color;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  });

  // Targets
  targets.forEach(t => {
    ctx.fillStyle = t.hit ? '#fff' : '#ff0055';
    ctx.fillRect(t.x, t.y, t.w, t.h);
  });

  // Bola
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill();

  // Flippers
  const drawFlipper = (f, isRight) => {
    ctx.save();
    ctx.translate(isRight ? f.x + f.w : f.x, f.y);
    const angle = f.active ? (isRight ? 0.7 : -0.7) : (isRight ? 0.2 : -0.2);
    ctx.rotate(angle);
    ctx.fillStyle = f.color;
    ctx.shadowBlur = 10; ctx.shadowColor = f.color;
    ctx.fillRect(isRight ? -f.w : 0, -6, f.w, 12);
    ctx.restore();
  };
  drawFlipper(flippers.left, false);
  drawFlipper(flippers.right, true);
};

const resetBall = () => {
  ball.x = 180; ball.y = 80;
  ball.vx = (Math.random() - 0.5) * 6;
  ball.vy = 4;
  ball.trail = [];
};

const reset = () => {
  cancelAnimationFrame(requestId);
  score.value = 0;
  balls.value = 3;
  multi.value = 1;
  gameOver.value = false;
  resetBall();
  update();
};

const handleKeys = (e) => {
  const isDown = e.type === 'keydown';
  if (e.key === 'ArrowLeft') flippers.left.active = isDown;
  if (e.key === 'ArrowRight') flippers.right.active = isDown;
  if (gameOver.value && e.key === 'Enter') reset();
};

onMounted(() => {
  ctx = canvas.value.getContext('2d');
  window.addEventListener('keydown', handleKeys);
  window.addEventListener('keyup', handleKeys);
  update();
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeys);
  window.removeEventListener('keyup', handleKeys);
  cancelAnimationFrame(requestId);
});
</script>

<style scoped>
.pinball-container { background: #000; height: 100%; display: flex; flex-direction: column; align-items: center; position: relative; }
.hud { width: 360px; display: flex; justify-content: space-between; padding: 15px; color: #00ff41; font-family: monospace; z-index: 5; }
.score-box span { color: #fff; text-shadow: 0 0 10px #00ff41; }
.multiplier { color: #ffff00; animation: blink 0.5s infinite; font-weight: bold; }
canvas { border: 4px solid #1a1a1a; border-radius: 20px 20px 0 0; box-shadow: 0 0 30px rgba(0, 255, 65, 0.1); }
.overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.9); padding: 40px; border: 2px solid #ff00ff; text-align: center; color: white; z-index: 100; border-radius: 10px; }
.neon-text { color: #ff00ff; text-shadow: 0 0 15px #ff00ff; margin-bottom: 10px; }
button { background: #000; border: 1px solid #00ff41; color: #00ff41; padding: 12px 24px; cursor: pointer; font-family: inherit; margin-top: 20px; transition: 0.3s; }
button:hover { background: #00ff41; color: #000; }
@keyframes blink { 50% { opacity: 0; } }
</style>