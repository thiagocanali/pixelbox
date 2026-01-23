<template>
  <div class="space-container">
    <div class="hud">SCORE: {{ score }} | LIVES: {{ lives }} | MOEDAS: {{ coins }}</div>
    <div v-if="boss" class="boss-health-bar"><div :style="{ width: (boss.hp / boss.maxHp * 100) + '%' }"></div></div>
    <canvas ref="canvas" width="400" height="500"></canvas>
    <div v-if="gameOver" class="overlay">
      <h2>{{ lives <= 0 ? 'VOID_INVADED' : 'SYSTEM_SAVED' }}</h2>
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
const coins = ref(0);
const gameOver = ref(false);
const boss = ref(null);

let ctx, player, bullets = [], enemyBullets = [], enemies = [], drops = [], requestId;

const init = () => {
  player = { x: 180, y: 450, w: 30, h: 20 };
  enemies = []; bullets = []; enemyBullets = []; drops = []; boss.value = null;
  score.value = 0; lives.value = 3;
  spawnWave();
};

const spawnWave = () => {
  for(let row=0; row<3; row++) {
    for(let col=0; col<6; col++) {
      enemies.push({ x: 50 + col * 50, y: 50 + row * 40, w: 30, h: 25, alive: true, dir: 1 });
    }
  }
};

const update = () => {
  if (gameOver.value) return;

  // Jogador
  bullets.forEach((b, i) => { b.y -= 7; if(b.y < 0) bullets.splice(i,1); });

  // Tiros Inimigos
  enemyBullets.forEach((eb, i) => {
    eb.y += 4;
    if (eb.x < player.x + player.w && eb.x + 4 > player.x && eb.y < player.y + player.h && eb.y + 10 > player.y) {
      enemyBullets.splice(i, 1); lives.value--; fx.explode();
      if (lives.value <= 0) gameOver.value = true;
    }
    if (eb.y > 500) enemyBullets.splice(i, 1);
  });

  // Moedas
  drops.forEach((d, i) => {
    d.y += 2;
    if (d.x < player.x + player.w && d.x + 10 > player.x && d.y < player.y + player.h && d.y + 10 > player.y) {
      drops.splice(i,1); coins.value++; fx.shoot();
    }
  });

  // Boss
  if (boss.value) {
    boss.value.x += 2.5 * boss.value.dir;
    if (boss.value.x > 300 || boss.value.x < 0) boss.value.dir *= -1;
    if (Math.random() < 0.04) enemyBullets.push({ x: boss.value.x + 50, y: boss.value.y + 60 });
  }

  // Inimigos Normais
  let moveDown = false;
  enemies.forEach(e => {
    if (!e.alive) return;
    e.x += 1.5 * e.dir;
    if (e.x > 370 || e.x < 10) moveDown = true;
    if (Math.random() < 0.005 && enemyBullets.length < 4) enemyBullets.push({ x: e.x + 15, y: e.y + 25 });
  });

  if (moveDown) {
    enemies.forEach(e => { e.dir *= -1; e.y += 10; });
  }

  // Colisões
  bullets.forEach((b, bi) => {
    enemies.forEach(e => {
      if (e.alive && b.x < e.x + e.w && b.x + 5 > e.x && b.y < e.y + e.h && b.y + 5 > e.y) {
        e.alive = false; bullets.splice(bi, 1); score.value += 100;
        if (Math.random() > 0.6) drops.push({ x: e.x, y: e.y });
      }
    });
    if (boss.value && b.x < boss.value.x + boss.value.w && b.x + 5 > boss.value.x && b.y < boss.value.y + boss.value.h) {
      boss.value.hp--; bullets.splice(bi, 1);
      if (boss.value.hp <= 0) { boss.value = null; score.value += 5000; coins.value += 50; }
    }
  });

  if (enemies.every(e => !e.alive) && !boss.value) boss.value = { x: 150, y: 50, w: 100, h: 60, hp: 40, maxHp: 40, dir: 1 };

  draw();
  requestId = requestAnimationFrame(update);
};

const draw = () => {
  ctx.fillStyle = '#000'; ctx.fillRect(0,0,400,500);
  ctx.fillStyle = '#00ff41'; ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.fillStyle = '#fff'; bullets.forEach(b => ctx.fillRect(b.x, b.y, 3, 10));
  ctx.fillStyle = '#ff4444'; enemyBullets.forEach(eb => ctx.fillRect(eb.x, eb.y, 3, 10));
  ctx.fillStyle = '#ffd700'; drops.forEach(d => { ctx.beginPath(); ctx.arc(d.x, d.y, 6, 0, 7); ctx.fill(); });

  enemies.forEach(e => { if(e.alive) { ctx.fillStyle = '#ff00ff'; ctx.fillRect(e.x, e.y, e.w, e.h); }});
  if (boss.value) {
    ctx.fillStyle = '#ff0000'; ctx.fillRect(boss.value.x, boss.value.y, boss.value.w, boss.value.h);
    ctx.fillStyle = '#fff'; ctx.fillRect(boss.value.x+20, boss.value.y+15, 10, 10); ctx.fillRect(boss.value.x+70, boss.value.y+15, 10, 10);
  }
};

const handleKeys = (e) => {
  if (e.key === 'ArrowLeft' && player.x > 0) player.x -= 20;
  if (e.key === 'ArrowRight' && player.x < 370) player.x += 20;
  if (e.key === ' ' || e.key === 'ArrowUp') {
    if (bullets.length < 3) { bullets.push({ x: player.x + 13, y: player.y }); fx.shoot(); }
  }
  if (gameOver.value && e.key === 'Enter') reset();
};

const reset = () => { cancelAnimationFrame(requestId); init(); gameOver.value = false; update(); };
onMounted(() => { ctx = canvas.value.getContext('2d'); window.addEventListener('keydown', handleKeys); init(); update(); });
onUnmounted(() => { window.removeEventListener('keydown', handleKeys); cancelAnimationFrame(requestId); });
</script>