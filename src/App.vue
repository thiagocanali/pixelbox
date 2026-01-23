<template>
  <div class="main-wrapper">
    <transition name="fade" mode="out-in">
      <WindowsUpdate v-if="state.showWindows" key="windows" />
      <PanicScreen v-else-if="state.showPanic" key="panic" />
      <Dashboard v-else-if="state.isLocked" @unlock="state.isLocked = false" key="dash" />

      <div id="console-shell" v-else key="console">
        <header class="console-header">
          <div class="logo">
            <h1>PIXEL<span>BOX</span></h1>
            <div class="status-indicator"><span class="blink">●</span> V3_RESPONSIVE</div>
          </div>
          <div class="system-clock">{{ currentTime }}</div>
        </header>

        <main class="screen">
          <div class="scanlines"></div>
          <div class="crt-glow"></div>
          
          <transition name="slide-up" mode="out-in">
            <div v-if="!state.currentGame" class="menu-grid" key="menu">
              <div 
                v-for="(game, index) in games" 
                :key="game.id" 
                class="game-card"
                :class="{ 'is-selected': state.selectedIndex === index }"
                @click="selectGame(game)"
              >
                <div class="game-icon">{{ game.icon }}</div>
                <div class="game-info">
                  <div class="game-title">{{ game.name }}</div>
                  <div class="game-stats" v-if="highScores[game.id]">🏆 {{ highScores[game.id] }}</div>
                </div>
                <div class="game-hint" v-if="state.selectedIndex === index">ENTER</div>
              </div>
            </div>

            <div v-else class="game-viewport" key="game">
              <component :is="state.currentGame" @exit="exitGame" @save-score="handleSaveScore" />
            </div>
          </transition>
        </main>

        <footer class="console-footer">
          <div class="footer-content">
            <div class="shortcuts">
              <span class="neon-pink">SETAS</span> | [ENTER] OK | [ESC] SAIR | [L] LOCK
            </div>
          </div>
        </footer>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, markRaw, onMounted, onUnmounted } from 'vue';
import { getScores, saveScore } from './utils/storage';
import { fx } from './utils/sounds';

import Dashboard from './components/Dashboard.vue';
import PanicScreen from './components/PanicScreen.vue';
import WindowsUpdate from './components/WindowsUpdate.vue';
import SnakeGame from './games/Snake/SnakeGame.vue';
import TetrisGame from './games/Tetris/TetrisGame.vue';
import WorkQuest from './games/WorkQuest/WorkQuest.vue';
import SpaceInvaders from './games/Space/SpaceInvaders.vue';
import PixelRacer from './games/Racer/PixelRacer.vue';
import CyberJump from './games/Jump/CyberJump.vue';

const currentTime = ref('');
const highScores = ref(getScores());
const state = reactive({
  isLocked: false,
  currentGame: null,
  showPanic: false,
  showWindows: false,
  selectedIndex: 0
});

const games = [
  { id: 'snake', name: 'SNAKE', icon: '🐍', component: markRaw(SnakeGame) },
  { id: 'tetris', name: 'TETRIS', icon: '🧱', component: markRaw(TetrisGame) },
  { id: 'work', name: 'WORK', icon: '👨‍💻', component: markRaw(WorkQuest) },
  { id: 'space', name: 'SPACE', icon: '👾', component: markRaw(SpaceInvaders) },
  { id: 'racer', name: 'RACER', icon: '🏎️', component: markRaw(PixelRacer) },
  { id: 'jump', name: 'JUMP', icon: '🚀', component: markRaw(CyberJump) }
];

const selectGame = (game) => { state.currentGame = game.component; fx.shoot(); };
const exitGame = () => { state.currentGame = null; highScores.value = getScores(); };
const handleSaveScore = (d) => { saveScore(d.gameId, d.score); highScores.value = getScores(); };

const handleGlobalKeys = (e) => {
  const key = e.key;
  if (!state.currentGame && !state.isLocked && !state.showPanic && !state.showWindows) {
    if (key === 'ArrowRight' || key === 'ArrowDown') state.selectedIndex = (state.selectedIndex + 1) % games.length;
    if (key === 'ArrowLeft' || key === 'ArrowUp') state.selectedIndex = (state.selectedIndex - 1 + games.length) % games.length;
    if (key === 'Enter') selectGame(games[state.selectedIndex]);
  }
  if (e.altKey && key.toLowerCase() === 'w') state.showWindows = !state.showWindows;
  if (key.toLowerCase() === 'p') state.showPanic = !state.showPanic;
  if (key.toLowerCase() === 'l') { state.isLocked = true; state.currentGame = null; }
  if (key === 'Escape') { state.showWindows = false; state.showPanic = false; state.isLocked = false; state.currentGame = null; }
};

onMounted(() => {
  setInterval(() => { currentTime.value = new Date().toLocaleTimeString('pt-BR'); }, 1000);
  window.addEventListener('keydown', handleGlobalKeys);
});
onUnmounted(() => window.removeEventListener('keydown', handleGlobalKeys));
</script>

<style>
:root {
  --neon-green: #00ff41;
  --neon-pink: #ff00ff;
}

body, html {
  margin: 0; padding: 0; height: 100%; width: 100%;
  background: #000; color: var(--neon-green);
  font-family: 'Courier New', monospace; overflow: hidden;
}

.main-wrapper { 
  height: 100vh; 
  display: flex; 
  flex-direction: column; 
}

#console-shell { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  overflow: hidden;
}

.console-header { 
  height: 50px;
  display: flex; justify-content: space-between; align-items: center;
  padding: 0 20px; background: #111; border-bottom: 2px solid #222;
}

.logo h1 { font-size: 1rem; letter-spacing: 3px; margin: 0; }
.logo span { color: var(--neon-pink); }

.screen { 
  flex: 1; /* Ocupa todo o espaço entre header e footer */
  margin: 10px;
  background: #020502; 
  border: 4px solid #2a2a2a; 
  border-radius: 8px; 
  position: relative; 
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.menu-grid { 
  display: grid;
  /* Grid responsiva: ajusta colunas pelo tamanho da tela */
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 15px; 
  padding: 20px;
  width: 100%;
  max-width: 1000px;
  max-height: 100%;
  overflow-y: auto; /* Scroll caso a tela seja MUITO pequena */
}

.game-card { 
  border: 1px solid var(--neon-green); 
  padding: 15px; 
  text-align: center; 
  background: rgba(0, 255, 65, 0.05);
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 120px;
}

.game-card.is-selected {
  background: var(--neon-green);
  color: #000;
  box-shadow: 0 0 15px var(--neon-green);
  transform: scale(1.02);
}

.game-icon { font-size: 2rem; }
.game-title { font-weight: bold; font-size: 0.9rem; margin-top: 5px; }
.game-stats { font-size: 0.7rem; }

.console-footer { 
  height: 40px;
  background: #111; border-top: 2px solid #222;
  display: flex; align-items: center; padding: 0 20px;
  font-size: 0.7rem;
}

.game-viewport {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

/* Scrollbar estilizada para o menu se necessário */
.menu-grid::-webkit-scrollbar { width: 5px; }
.menu-grid::-webkit-scrollbar-thumb { background: var(--neon-green); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>