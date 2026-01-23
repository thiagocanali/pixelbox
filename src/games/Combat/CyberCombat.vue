<template>
  <div class="combat-container" :class="{ 'shake': isShaking }">
    <div class="hud">
      <div class="p1-stats">
        <div class="health-bar"><div :style="{ width: player.hp + '%' }"></div></div>
        <div class="stamina-bar"><div :style="{ width: player.stamina + '%' }"></div></div>
      </div>
      <div class="vs-container">
        <div class="vs">VS</div>
        <div class="combo-msg" v-if="combo > 1">{{ combo }} HIT COMBO!</div>
      </div>
      <div class="p2-stats">
        <div class="health-bar enemy"><div :style="{ width: enemy.hp + '%' }"></div></div>
        <div class="stamina-bar enemy"><div :style="{ width: enemy.stamina + '%' }"></div></div>
      </div>
    </div>

    <canvas ref="canvas" width="600" height="300"></canvas>

    <div v-if="gameOver" class="overlay">
      <h1 :class="player.hp <= 0 ? 'lost' : 'won'">{{ player.hp <= 0 ? 'KO_SYSTEM_OFFLINE' : 'VICTORY_UPLOADED' }}</h1>
      <button @click="reset">REBOOT [ENTER]</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { fx } from '../../utils/sounds';

const canvas = ref(null);
const gameOver = ref(false);
const isShaking = ref(false);
const combo = ref(0);
let ctx, requestId;
let particles = [];
let projectiles = [];

const player = reactive({ x: 100, y: 200, w: 40, h: 70, hp: 100, stamina: 100, vy: 0, dir: 1, attacking: false, blocking: false, flash: false });
const enemy = reactive({ x: 450, y: 200, w: 40, h: 70, hp: 100, stamina: 100, vy: 0, dir: -1, attacking: false, flash: false });

const createHitParticles = (x, y, color) => {
  for(let i=0; i<12; i++) {
    particles.push({ x, y, vx: (Math.random()-0.5)*15, vy: (Math.random()-0.5)*15, life: 1.0, color });
  }
};

const attack = (u, t, isPlayer = false) => {
  if (u.stamina < 15 || u.attacking) return;
  u.attacking = true;
  u.stamina -= 15;
  
  // Dash de ataque
  const originalX = u.x;
  u.x += u.dir * 25;

  const hitRange = u.dir === 1 ? u.x + u.w + 20 : u.x - 20;
  const landed = u.dir === 1 ? (hitRange > t.x && u.x < t.x) : (hitRange < t.x + t.w && u.x > t.x);

  if (landed && Math.abs(u.y - t.y) < 60) {
    let damage = isPlayer && combo.value > 3 ? 15 : 8;
    if (t.blocking) {
      damage /= 3;
      createHitParticles(t.x + t.w/2, t.y + 20, '#fff');
    } else {
      if (isPlayer) combo.value++;
      t.hp -= damage;
      t.flash = true;
      isShaking.value = true;
      createHitParticles(hitRange, u.y + 30, isPlayer ? '#00ff41' : '#ff0055');
      setTimeout(() => { isShaking.value = false; t.flash = false; }, 100);
      fx.shoot();
    }
    if (t.hp <= 0) gameOver.value = true;
  } else if (isPlayer) {
    combo.value = 0;
  }

  setTimeout(() => { u.attacking = false; u.x = originalX; }, 120);
};

const shootSpecial = (u) => {
  if (u.stamina < 50) return;
  u.stamina -= 50;
  projectiles.push({ x: u.x + (u.dir * 40), y: u.y + 20, vx: u.dir * 8, color: '#00ffff' });
  fx.shoot();
};

const update = () => {
  if (gameOver.value) return;

  [player, enemy].forEach(u => {
    u.vy += 0.8; u.y += u.vy;
    if (u.y > 200) { u.y = 200; u.vy = 0; }
    if (u.stamina < 100) u.stamina += 0.8;
  });

  // IA do Inimigo (Mais agressiva e recua)
  const dist = Math.abs(player.x - enemy.x);
  enemy.dir = player.x > enemy.x ? 1 : -1;
  
  if (dist > 80) {
    enemy.x += enemy.dir * 2.8;
    enemy.blocking = false;
  } else {
    if (Math.random() < 0.06) attack(enemy, player);
    if (Math.random() < 0.03) enemy.blocking = true;
  }

  // Lógica Projéteis
  projectiles.forEach((p, i) => {
    p.x += p.vx;
    if (p.x < 0 || p.x > 600) projectiles.splice(i, 1);
    if (p.x > enemy.x && p.x < enemy.x + enemy.w && p.y > enemy.y && p.y < enemy.y + enemy.h) {
      enemy.hp -= 15;
      triggerHitEffect(enemy);
      projectiles.splice(i, 1);
    }
  });

  particles.forEach((p, i) => {
    p.x += p.vx; p.y += p.vy; p.life -= 0.04;
    if (p.life <= 0) particles.splice(i, 1);
  });

  draw();
  requestId = requestAnimationFrame(update);
};

const triggerHitEffect = (target) => {
  target.flash = true;
  isShaking.value = true;
  setTimeout(() => { target.flash = false; isShaking.value = false; }, 150);
  if (target.hp <= 0) gameOver.value = true;
};

const draw = () => {
  ctx.fillStyle = '#000'; ctx.fillRect(0,0,600,300);
  
  // Grid Neon no chão
  ctx.strokeStyle = '#002200';
  for(let i=0; i<10; i++) {
    ctx.beginPath(); ctx.moveTo(0, 270 + i*5); ctx.lineTo(600, 270 + i*5); ctx.stroke();
  }

  particles.forEach(p => {
    ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 4, 4);
  });
  ctx.globalAlpha = 1.0;

  projectiles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 15; ctx.shadowColor = p.color;
    ctx.fillRect(p.x, p.y, 20, 10);
    ctx.shadowBlur = 0;
  });

  const drawFighter = (u, color) => {
    ctx.fillStyle = u.flash ? '#fff' : color;
    if (u.blocking) ctx.fillStyle = '#555';
    
    // Corpo
    ctx.fillRect(u.x, u.y, u.w, u.h);
    
    // Detalhe visual de direção (Olhos)
    ctx.fillStyle = '#000';
    ctx.fillRect(u.dir === 1 ? u.x + 25 : u.x + 5, u.y + 10, 10, 5);

    if (u.attacking) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(u.dir === 1 ? u.x + u.w : u.x - 35, u.y + 20, 35, 12);
    }
  };

  drawFighter(player, '#00ff41');
  drawFighter(enemy, '#ff0055');
};

const reset = () => {
  cancelAnimationFrame(requestId);
  Object.assign(player, { x: 100, y: 200, hp: 100, stamina: 100, vy: 0, attacking: false });
  Object.assign(enemy, { x: 450, y: 200, hp: 100, stamina: 100, vy: 0, attacking: false });
  combo.value = 0; projectiles = []; particles = [];
  gameOver.value = false;
  update();
};

onMounted(() => {
  ctx = canvas.value.getContext('2d');
  window.addEventListener('keydown', (e) => {
    if (gameOver.value && e.key === 'Enter') reset();
    if (e.key === 'ArrowLeft') { player.x -= 15; player.dir = -1; player.blocking = (player.dir === 1); }
    if (e.key === 'ArrowRight') { player.x += 15; player.dir = 1; player.blocking = (player.dir === -1); }
    if (e.key === 'ArrowUp' && player.y === 200) player.vy = -14;
    if (e.key === 'ArrowDown') shootSpecial(player);
    if (e.key === ' ') attack(player, enemy, true);
  });
  update();
});
</script>

<style scoped>
.combat-container { background: #000; height: 100%; display: flex; flex-direction: column; align-items: center; position: relative; overflow: hidden; }
.hud { display: flex; width: 100%; justify-content: space-between; padding: 20px; box-sizing: border-box; }
.health-bar { width: 200px; height: 15px; border: 2px solid #fff; background: #111; box-shadow: 0 0 10px rgba(0,255,65,0.3); }
.health-bar div { height: 100%; background: linear-gradient(90deg, #00ff41, #008822); transition: width 0.3s; }
.enemy div { background: linear-gradient(90deg, #ff0055, #880022); }
.stamina-bar { width: 120px; height: 6px; background: #0088ff; margin-top: 5px; box-shadow: 0 0 5px #0088ff; }
.vs-container { text-align: center; }
.vs { color: #fff; font-size: 1.5rem; font-weight: bold; font-style: italic; }
.combo-msg { color: #ffff00; font-size: 0.8rem; animation: pulse 0.3s infinite; }
@keyframes pulse { 0% { scale: 1; } 50% { scale: 1.2; } }
.shake { animation: shake 0.1s linear infinite; }
@keyframes shake { 0% { transform: translate(2px, 2px); } 50% { transform: translate(-2px, -2px); } }
.overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.85); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10; }
.won { color: #00ff41; text-shadow: 0 0 20px #00ff41; }
.lost { color: #ff0055; text-shadow: 0 0 20px #ff0055; }
button { background: #000; border: 2px solid #00ff41; color: #00ff41; padding: 15px 30px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold; }
</style>