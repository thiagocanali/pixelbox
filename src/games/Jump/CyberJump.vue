<template>
  <div class="jump-container">
    <div class="hud">ALTITUDE: {{ Math.floor(score) }}m</div>
    <canvas ref="canvas" width="400" height="500"></canvas>
    <div v-if="gameOver" class="overlay">
      <h2>SYSTEM_FALL</h2>
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
let ctx, player, platforms = [], requestId;

const init = () => {
  // Aumentei a força do pulo (-13) e reduzi a gravidade (0.3) para um controle melhor
  player = { x: 190, y: 400, w: 20, h: 20, vy: 0, jump: -13.5 }; 
  platforms = [];
  
  // Plataforma base maior para segurança
  platforms.push({ x: 50, y: 450, w: 300, h: 12 }); 
  
  // Gerar plataformas com distância vertical garantida (máximo 100px entre elas)
  for(let i=0; i<6; i++) {
    platforms.push({ 
      x: Math.random() * 320, 
      y: i * 85, 
      w: 65, 
      h: 10 
    });
  }
  score.value = 0;
};

const update = () => {
  if (gameOver.value) return;

  player.vy += 0.38; 
  player.y += player.vy;

  // Câmera segue o jogador
  if (player.y < 200) {
    let diff = 200 - player.y;
    player.y = 200;
    score.value += diff/8;
    platforms.forEach(p => {
      p.y += diff;
      if (p.y > 500) {
        p.y = 0;
        p.x = Math.random() * 330;
      }
    });
  }

  // Colisão aprimorada (só colide quando está descendo)
  platforms.forEach(p => {
    if (player.vy > 0 && 
        player.x + player.w > p.x && 
        player.x < p.x + p.w && 
        player.y + player.h >= p.y && 
        player.y + player.h <= p.y + p.h + player.vy) {
      player.vy = player.jump;
      fx.shoot();
    }
  });

  if (player.y > 550) {
    gameOver.value = true;
    fx.explode();
  }

  draw();
  requestId = requestAnimationFrame(update);
};

const draw = () => {
  ctx.fillStyle = '#000'; ctx.fillRect(0,0,400,500);
  
  // Player com efeito Neon
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#00ff41';
  ctx.fillStyle = '#00ff41'; 
  ctx.fillRect(player.x, player.y, player.w, player.h);
  
  // Plataformas com efeito Neon Rosa
  ctx.shadowColor = '#ff00ff';
  ctx.fillStyle = '#ff00ff'; 
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));
  ctx.shadowBlur = 0; // Reset para performance
};

const handleKeys = (e) => {
  if (gameOver.value && e.key === 'Enter') { reset(); return; }
  if (e.key === 'ArrowLeft') player.x -= 30;
  if (e.key === 'ArrowRight') player.x += 30;
  if (player.x < -20) player.x = 400;
  if (player.x > 400) player.x = -20;
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