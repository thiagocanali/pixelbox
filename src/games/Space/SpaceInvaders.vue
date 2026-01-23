<template>
  <div class="space-container">
    <div class="hud">SCORE: {{ score }} | LIVES: {{ lives }}</div>
    <canvas ref="canvas" width="400" height="500"></canvas>
    <div v-if="gameOver" class="overlay">
      <h2>VOID_INVADED</h2>
      <p>FINAL SCORE: {{ score }}</p>
      <button @click="reset">REBOOT [ENTER]</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { fx } from '../../utils/sounds';

const canvas = ref(null);
const score = ref(0);
const lives = ref(3);
const gameOver = ref(false);
let ctx, player, bullets = [], enemyBullets = [], enemies = [], requestId;

const init = () => {
  player = { x: 180, y: 450, w: 30, h: 20 };
  bullets = [];
  enemyBullets = [];
  enemies = [];
  score.value = 0;
  lives.value = 3;
  
  for(let row=0; row<4; row++) {
    for(let col=0; col<7; col++) {
      enemies.push({
        x: 40 + col * 45,
        y: 50 + row * 35,
        w: 25,
        h: 20,
        dir: 1,
        alive: true
      });
    }
  }
};

const update = () => {
  if (gameOver.value) return;

  // Balas do Jogador (Rápidas)
  bullets.forEach((b, i) => {
    b.y -= 8;
    if (b.y < 0) bullets.splice(i, 1);
  });

  // Balas dos Inimigos (Mais lentas e em menor quantidade)
  enemyBullets.forEach((eb, i) => {
    eb.y += 3.5; // Velocidade reduzida
    if (eb.y > 500) enemyBullets.splice(i, 1);
    
    // Colisão com Jogador
    if (eb.x < player.x + player.w && eb.x + 4 > player.x &&
        eb.y < player.y + player.h && eb.y + 10 > player.y) {
      enemyBullets.splice(i, 1);
      lives.value--;
      fx.hit?.() || fx.explode();
      if (lives.value <= 0) gameOver.value = true;
    }
  });

  let changeDir = false;
  enemies.forEach(e => {
    if (!e.alive) return;
    
    // Movimento lateral mais calmo
    e.x += 0.8 * e.dir;
    if (e.x > 370 || e.x < 10) changeDir = true;
    
    // IA DE TIRO EQUILIBRADA: 
    // Somente se houver menos de 3 balas inimigas na tela
    if (enemyBullets.length < 3 && Math.random() < 0.005) {
      enemyBullets.push({ x: e.x + e.w/2, y: e.y + e.h });
    }
  });

  if (changeDir) {
    enemies.forEach(e => {
      e.dir *= -1;
      e.y += 12;
      if (e.y > 430) gameOver.value = true;
    });
  }

  // Colisão Bala -> Inimigo
  bullets.forEach((b, bi) => {
    enemies.forEach((e) => {
      if (e.alive && b.x < e.x + e.w && b.x + 5 > e.x &&
          b.y < e.y + e.h && b.y + 10 > e.y) {
        e.alive = false;
        bullets.splice(bi, 1);
        score.value += 100;
        fx.shoot();
      }
    });
  });

  if (enemies.every(e => !e.alive)) init();

  draw();
  requestId = requestAnimationFrame(update);
};

const draw = () => {
  ctx.fillStyle = '#000'; ctx.fillRect(0,0,400,500);
  
  // Player
  ctx.fillStyle = '#00ff41';
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.fillRect(player.x + 12, player.y - 5, 6, 5);

  // Balas Player
  ctx.fillStyle = '#fff';
  bullets.forEach(b => ctx.fillRect(b.x, b.y, 2, 10));
  
  // Balas Inimigas (Vermelho neon)
  ctx.fillStyle = '#ff4444';
  enemyBullets.forEach(eb => ctx.fillRect(eb.x, eb.y, 3, 12));

  // Inimigos
  enemies.forEach(e => {
    if (e.alive) {
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(e.x, e.y, e.w, e.h);
      ctx.fillStyle = '#000';
      ctx.fillRect(e.x + 5, e.y + 5, 3, 3);
      ctx.fillRect(e.x + 17, e.y + 5, 3, 3);
    }
  });
};

const handleKeys = (e) => {
  if (gameOver.value && e.key === 'Enter') { reset(); return; }
  if (e.key === 'ArrowLeft' && player.x > 0) player.x -= 15;
  if (e.key === 'ArrowRight' && player.x < 370) player.x += 15;
  if (e.key === ' ' || e.key === 'ArrowUp') {
    if (bullets.length < 2) { // Player pode ter 2 tiros por vez
      bullets.push({ x: player.x + player.w/2 - 1, y: player.y });
      fx.shoot();
    }
  }
};

const reset = () => {
  cancelAnimationFrame(requestId);
  init();
  gameOver.value = false;
  update();
};

onMounted(() => {
  ctx = canvas.value.getContext('2d');
  window.addEventListener('keydown', handleKeys);
  init(); update();
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeys);
  cancelAnimationFrame(requestId);
});
</script>

<style scoped>
.space-container { background: #000; height: 100%; display: flex; flex-direction: column; align-items: center; position: relative; }
.hud { color: #00ff41; padding: 10px; font-family: monospace; font-size: 1rem; }
canvas { border: 2px solid #333; }
.overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.95); padding: 30px; border: 2px solid #ff00ff; text-align: center; color: #fff; }
button { background: #111; border: 1px solid #00ff41; color: #00ff41; padding: 10px 20px; cursor: pointer; font-family: inherit; margin-top: 15px; }
</style>