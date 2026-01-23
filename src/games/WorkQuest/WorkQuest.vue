<template>
  <div class="quest-container">
    <div class="stats-bar">
      <span>FILES_ENCRYPTED: {{ dataCount }} TB</span>
      <span>CPS: {{ autoRate }}</span>
    </div>

    <div class="terminal-area" ref="terminal">
      <div v-for="(log, i) in logs" :key="i" class="log-line">> {{ log }}</div>
      <div class="cursor">_</div>
    </div>

    <div class="shop">
      <button 
        v-for="up in upgrades" 
        :key="up.name" 
        :disabled="dataCount < up.cost"
        @click="buyUpgrade(up)"
      >
        {{ up.name }} (Cost: {{ up.cost }})
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const dataCount = ref(0);
const autoRate = ref(0);
const logs = ref(['INITIALIZING SECURE CONNECTION...', 'ENCRYPTION KEY: AES-256-GCM']);
const terminal = ref(null);

const upgrades = ref([
  { name: 'Sinal Wi-fi', cost: 10, power: 1 },
  { name: 'Proxy Server', cost: 50, power: 5 },
  { name: 'Quantum CPU', cost: 200, power: 25 },
]);

const handleKeyPress = () => {
  dataCount.value++;
  logs.value.push(`Injecting packet ${Math.random().toString(16).slice(2, 8)}... SUCCESS`);
  if (logs.value.length > 15) logs.value.shift();
};

const buyUpgrade = (up) => {
  if (dataCount.value >= up.cost) {
    dataCount.value -= up.cost;
    autoRate.value += up.power;
    up.cost = Math.floor(up.cost * 1.5);
  }
};

let timer;
onMounted(() => {
  window.addEventListener('keydown', handleKeyPress);
  timer = setInterval(() => {
    dataCount.value += autoRate.value;
  }, 1000);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress);
  clearInterval(timer);
});
</script>

<style scoped>
.quest-container { background: #000; height: 100%; display: flex; flex-direction: column; padding: 15px; }
.stats-bar { border-bottom: 1px solid #00ff00; padding-bottom: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; }
.terminal-area { flex-grow: 1; font-size: 0.8rem; overflow: hidden; color: #008800; }
.shop { display: flex; gap: 10px; padding-top: 10px; border-top: 1px solid #333; }
button { background: #111; border: 1px solid #00ff00; color: #00ff00; font-size: 0.7rem; cursor: pointer; padding: 5px; }
button:disabled { border-color: #333; color: #333; cursor: not-allowed; }
.cursor { animation: blink 0.8s infinite; }
@keyframes blink { 50% { opacity: 0; } }
</style>