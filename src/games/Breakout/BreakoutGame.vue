<template>
  <div class="breakout-container">
    <div class="hud">SCORE: {{ score }}</div>
    <canvas ref="canvas" width="400" height="400"></canvas>
    <div v-if="gameOver" class="overlay">
      <h2>PADDLE_LOST</h2>
      <button @click="reset">REBOOT [ENTER]</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { fx } from '../../utils/sounds';

const canvas = ref(null);
const score = ref(0);
const gameOver = ref(false);
let ctx, requestId;

let paddle = { x: 160, y: 380, w: 80, h: 10 };
let ball = { x: 200, y: 300, dx: 4, dy: -4, r: 6 };
let bricks = [];

const createBricks = () => {
  bricks = [];
  for(let r=0; r<5; r++) {
    for(let c=0; c<8; c++) {
      bricks.push({ x: 5 + c*49, y: 40 + r*20, w: 45, h: 15, alive: true });
    }
  }
};

const update = () => {
  if (gameOver.value) return;

  ball.x += ball.dx; ball.y += ball.dy;

  if (ball.x < 0 || ball.x > 400) ball.dx *= -1;
  if (ball.y < 0) ball.dy *= -1;
  
  if (ball.y + ball.r > paddle.y && ball.x > paddle.x && ball.x < paddle.x + paddle.w) {
    ball.dy = -Math.abs(ball.dy);
    fx.shoot();
  }

  bricks.forEach(b => {
    if (b.alive && ball.x > b.x && ball.x < b.x + b.w && ball.y > b.y && ball.y < b.y + b.h) {
      b.alive = false; ball.dy *= -1; score.value += 50;
    }
  });

  if (ball.y > 400) {
    gameOver.value = true;
    fx.explode();
  }

  draw();
  requestId = requestAnimationFrame(update);
};

const draw = () => {
  ctx.clearRect(0, 0, 400, 400);
  ctx.fillStyle = '#000'; ctx.fillRect(0,0,400,400);
  ctx.fillStyle = '#00ff41'; ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, 7); ctx.fill();
  bricks.forEach(b => { if(b.alive) { ctx.fillStyle = '#ff00ff'; ctx.fillRect(b.x, b.y, b.w, b.h); }});
};

const reset = () => {
  cancelAnimationFrame(requestId);
  score.value = 0;
  paddle.x = 160;
  ball.x = 200; ball.y = 300; ball.dx = 4; ball.dy = -4;
  createBricks();
  gameOver.value = false;
  update();
};

const handleKeys = (e) => {
  if (e.key === 'ArrowLeft' && paddle.x > 0) paddle.x -= 25;
  if (e.key === 'ArrowRight' && paddle.x < 320) paddle.x += 25;
  if (gameOver.value && e.key === 'Enter') reset();
};

onMounted(() => {
  ctx = canvas.value.getContext('2d');
  createBricks();
  window.addEventListener('keydown', handleKeys);
  update();
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeys);
  cancelAnimationFrame(requestId);
});
</script>

<style scoped>
.breakout-container { background: #000; height: 100%; display: flex; flex-direction: column; align-items: center; position: relative; }
.hud { color: #00ff41; padding: 10px; }
canvas { border: 2px solid #333; }
.overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.9); padding: 30px; border: 2px solid #ff00ff; text-align: center; color: white; }
</style>