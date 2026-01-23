<template>
  <div class="hacker-container">
    <div class="terminal-header">
      <span>ROOT@SYSTEM:~/DECRYPTOR</span>
      <span class="money">₿ {{ bitcoins.toFixed(4) }}</span>
    </div>
    
    <div class="main-layout">
      <div class="code-area" ref="scrollArea">
        <div v-for="(line, i) in codeLines" :key="i" class="code-line">
          <span class="line-num">{{ i + 1 }}</span> {{ line }}
        </div>
        <div class="cursor">_</div>
      </div>

      <div class="shop">
        <h3>UPGRADES</h3>
        <button @click="buyUpgrade('coffee')" :disabled="bitcoins < shop.coffee.price">
          CAFEZINHO (₿{{ shop.coffee.price }}) <br><small>+ lucro por tecla</small>
        </button>
        <button @click="buyUpgrade('server')" :disabled="bitcoins < shop.server.price">
          MINERADORA (₿{{ shop.server.price }}) <br><small>Ganha ₿ auto</small>
        </button>
      </div>
    </div>

    <div v-if="activeBug" class="bug-alert" :style="{ top: bugPos.y + 'px', left: bugPos.x + 'px' }" @click="killBug">
      [!] FIREWALL DETECTADO: CLIQUE PARA DESTRUIR
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue';
import { fx } from '../../utils/sounds';

const bitcoins = ref(0);
const codeLines = ref(['> Iniciando exploit...']);
const activeBug = ref(false);
const bugPos = reactive({ x: 0, y: 0 });
const scrollArea = ref(null);

const shop = reactive({
  coffee: { price: 0.01, level: 1 },
  server: { price: 0.05, level: 0 }
});

const hackerTexts = [
  "import socket, sys", "def decrypt(data, key):", "for i in range(256):", 
  "payload = os.urandom(1024)", "target_addr = '192.168.1.1'", "bypass_firewall(v3)",
  "injecting_shellcode...", "access_granted = True", "db_dump = await fetch()"
];

const handleKey = () => {
  // Ganha Bitcoin ao digitar
  bitcoins.value += 0.0005 * shop.coffee.level;
  
  // Adiciona linha de código aleatória
  const randomCode = hackerTexts[Math.floor(Math.random() * hackerTexts.length)];
  codeLines.value.push(`> ${randomCode}`);
  if (codeLines.value.length > 15) codeLines.value.shift();
  
  // Scroll automático
  nextTick(() => { if(scrollArea.value) scrollArea.value.scrollTop = scrollArea.value.scrollHeight; });

  // Chance de aparecer um Bug (Inimigo)
  if (!activeBug.value && Math.random() < 0.02) spawnBug();
};

const spawnBug = () => {
  activeBug.value = true;
  bugPos.x = 50 + Math.random() * 200;
  bugPos.y = 100 + Math.random() * 200;
  fx.shoot();
};

const killBug = () => {
  activeBug.value = false;
  bitcoins.value += 0.01;
  fx.shoot();
};

const buyUpgrade = (id) => {
  if (bitcoins.value >= shop[id].price) {
    bitcoins.value -= shop[id].price;
    shop[id].level++;
    shop[id].price *= 1.5;
    fx.shoot();
  }
};

// Mineradora Automática
let minerInterval;
onMounted(() => {
  window.addEventListener('keydown', handleKey);
  minerInterval = setInterval(() => {
    bitcoins.value += 0.001 * shop.server.level;
    if (activeBug.value) bitcoins.value -= 0.002; // Bug rouba dinheiro!
  }, 1000);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKey);
  clearInterval(minerInterval);
});
</script>

<style scoped>
.hacker-container { background: #000; height: 100%; display: flex; flex-direction: column; color: #00ff41; font-family: 'Courier New', monospace; position: relative; }
.terminal-header { padding: 10px; border-bottom: 2px solid #00ff41; display: flex; justify-content: space-between; background: #050505; }
.money { color: #ffd700; font-weight: bold; }
.main-layout { display: flex; flex: 1; overflow: hidden; }
.code-area { flex: 2; padding: 10px; overflow-y: hidden; background: rgba(0, 255, 65, 0.02); }
.shop { flex: 1; border-left: 1px solid #00ff41; padding: 10px; background: #080808; display: flex; flex-direction: column; gap: 10px; }
.code-line { font-size: 0.8rem; margin-bottom: 4px; }
.line-num { color: #555; margin-right: 10px; }
button { background: #000; border: 1px solid #00ff41; color: #00ff41; padding: 8px; cursor: pointer; text-align: left; }
button:disabled { border-color: #222; color: #222; }
.bug-alert { position: absolute; background: red; color: white; padding: 10px; cursor: crosshair; font-weight: bold; border: 2px solid white; animation: blink 0.2s infinite; }
@keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
</style>