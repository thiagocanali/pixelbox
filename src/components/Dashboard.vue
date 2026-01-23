<template>
  <div class="dashboard-overlay">
    <div class="grid-layout">
      <div class="panel cpu">
        <h3>CPU_LOAD</h3>
        <div class="bar-container"><div class="bar" :style="{width: cpuLoad + '%'}"></div></div>
        <p>{{ cpuLoad }}% - STABLE</p>
      </div>
      <div class="panel network">
        <h3>NETWORK_TRAFFIC</h3>
        <div class="lines">
          <div v-for="n in 5" :key="n" class="traffic-line" :style="{width: Math.random()*100+'%'}"></div>
        </div>
      </div>
      <div class="panel logs">
        <h3>SYSTEM_LOGS</h3>
        <div class="log-content">
          <div v-for="(log, i) in logs" :key="i" class="log-entry">> {{ log }}</div>
        </div>
      </div>
    </div>
    <div class="input-area">
      <span>SYSTEM@ADMIN:~$</span>
      <input v-model="command" @keyup.enter="checkCommand" autofocus placeholder="_" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const emit = defineEmits(['unlock']);
const cpuLoad = ref(42);
const command = ref('');
const logs = ref(['Kernel boot successful', 'Initializing network...', 'Proxy established']);

const checkCommand = () => {
  if (command.value.toLowerCase() === 'dev') {
    emit('unlock');
  }
  command.value = '';
};

onMounted(() => {
  setInterval(() => {
    cpuLoad.value = Math.floor(Math.random() * 20) + 30;
    logs.value.push(`Request ${Math.random().toString(16).slice(2,8)} handled.`);
    if(logs.value.length > 8) logs.value.shift();
  }, 2000);
});
</script>

<style scoped>
.dashboard-overlay { background: #050505; height: 100%; padding: 20px; display: flex; flex-direction: column; gap: 20px; color: #00ff41; font-family: monospace; }
.grid-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; flex-grow: 1; }
.panel { border: 1px solid #1a1a1a; padding: 15px; background: #0a0a0a; }
.bar-container { background: #111; height: 10px; margin: 10px 0; }
.bar { background: #00ff41; height: 100%; transition: width 0.5s; }
.traffic-line { height: 4px; background: #008800; margin: 5px 0; }
.log-content { font-size: 0.7rem; color: #008800; }
.input-area { display: flex; gap: 10px; border-top: 1px solid #1a1a1a; padding-top: 10px; }
input { background: transparent; border: none; color: #00ff41; outline: none; width: 100%; }
</style>