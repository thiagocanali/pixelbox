<template>
  <div class="panic-overlay">
    <div class="code-log">
      <div v-for="(line, i) in lines" :key="i" class="line">
        <span class="timestamp">[{{ new Date().toLocaleTimeString() }}]</span>
        <span class="status"> INFO </span>
        {{ line }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const logs = [
  "Deploying microservice 'auth-v2' to production...",
  "Worker cluster 4: Connection established at 127.0.0.1:8080",
  "Optimizing database indices for table 'user_transactions'...",
  "GET /api/v1/metrics - 200 OK (42ms)",
  "Analyzing heap memory usage... 42% utilized.",
  "Warning: Latency spike detected in region us-east-1",
  "Syncing cloud buckets with local cache...",
  "Compiling assets for production environment..."
];

const lines = ref([]);

onMounted(() => {
  setInterval(() => {
    const randomLog = logs[Math.floor(Math.random() * logs.length)];
    lines.value.push(randomLog);
    if (lines.value.length > 25) lines.value.shift();
  }, 400);
});
</script>

<style scoped>
.panic-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: #000; color: #00ff00; z-index: 9999;
  font-family: 'Consolas', monospace; padding: 20px;
}
.line { font-size: 0.85rem; margin-bottom: 4px; }
.timestamp { color: #888; }
.status { color: #5fafff; font-weight: bold; }
</style>