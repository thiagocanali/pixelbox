<template>
  <div class="windows-update">
    <div class="content">
      <div class="loader"></div>
      <h1>Atualizando o Windows</h1>
      <p>{{ progress }}% concluído. Não desligue o computador. Isso pode demorar um pouco.</p>
      <p class="subtext">Seu computador será reiniciado várias vezes.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const progress = ref(0);

onMounted(() => {
  // Progresso extremamente lento para parecer real
  const interval = setInterval(() => {
    if (progress.value < 99) {
      // Sobe 1% em tempos aleatórios entre 10 e 30 segundos
      progress.value++;
    }
  }, Math.random() * 20000 + 10000);
});
</script>

<style scoped>
.windows-update {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: #0078d7; color: white; z-index: 10000;
  display: flex; align-items: center; justify-content: center;
  font-family: "Segoe UI", Tahoma, sans-serif; cursor: none;
}
.content { text-align: center; max-width: 600px; }
.loader {
  width: 50px; height: 50px; border: 3px solid rgba(255,255,255,0.3);
  border-radius: 50%; border-top-color: #fff;
  animation: spin 1.5s infinite linear; margin: 0 auto 30px;
}
h1 { font-weight: 300; font-size: 2.5rem; margin-bottom: 10px; }
p { font-size: 1.2rem; margin-bottom: 5px; opacity: 0.9; }
.subtext { font-size: 0.9rem; opacity: 0.7; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>