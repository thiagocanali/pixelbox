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
            <div class="status-indicator"><span class="blink">●</span> V3_KEYBOARD_DRIVEN</div>
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
                <div class="game-title">{{ game.name }}</div>
                <div class="game-stats" v-if="highScores[game.id]">🏆 BEST: {{ highScores[game.id] }}</div>
                <div class="game-hint" v-if="state.selectedIndex === index">[ PRESS ENTER ]</div>
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
              <span class="neon-pink">NAV: SETAS</span> | [ENTER] SELECIONAR | [ESC] VOLTAR | [L] LOCK
            </div>
          </div>
        </footer>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, markRaw, onMounted, onUnmounted, computed } from 'vue';
import { getScores, saveScore } from './utils/storage';
import { fx } from './utils/sounds';

// Imports de Componentes e Jogos
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
  { id: 'snake', name: 'SNAKE_PRO', icon: '🐍', component: markRaw(SnakeGame) },
  { id: 'tetris', name: 'BLOCK_FIT', icon: '🧱', component: markRaw(TetrisGame) },
  { id: 'work', name: 'WORK_QUEST', icon: '👨‍💻', component: markRaw(WorkQuest) },
  { id: 'space', name: 'VOID_INVADERS', icon: '👾', component: markRaw(SpaceInvaders) },
  { id: 'racer', name: 'PIXEL_RACER', icon: '🏎️', component: markRaw(PixelRacer) },
  { id: 'jump', name: 'CYBER_JUMP', icon: '🚀', component: markRaw(CyberJump) }
];

const activeGameName = computed(() => {
  return games.find(g => g.component === state.currentGame)?.name || '';
});

const selectGame = (game) => {
  state.currentGame = game.component;
  fx.shoot();
};

const exitGame = () => {
  state.currentGame = null;
  highScores.value = getScores();
};

const handleSaveScore = (d) => {
  saveScore(d.gameId, d.score);
  highScores.value = getScores();
};

const handleGlobalKeys = (e) => {
  const key = e.key;

  if (!state.currentGame && !state.isLocked && !state.showPanic && !state.showWindows) {
    if (key === 'ArrowRight' || key === 'ArrowDown') {
      state.selectedIndex = (state.selectedIndex + 1) % games.length;
      fx.shoot();
    }
    if (key === 'ArrowLeft' || key === 'ArrowUp') {
      state.selectedIndex = (state.selectedIndex - 1 + games.length) % games.length;
      fx.shoot();
    }
    if (key === 'Enter') selectGame(games[state.selectedIndex]);
  }

  if (e.altKey && key.toLowerCase() === 'w') state.showWindows = !state.showWindows;
  if (key.toLowerCase() === 'p') state.showPanic = !state.showPanic;
  if (key.toLowerCase() === 'l') { state.isLocked = true; state.currentGame = null; }
  
  if (key === 'Escape') {
    state.showWindows = false;
    state.showPanic = false;
    state.isLocked = false;
    state.currentGame = null;
  }
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
  --bg-black: #050505;
}

body {
  margin: 0; background: #000; color: var(--neon-green);
  font-family: 'Courier New', Courier, monospace; overflow: hidden;
  user-select: none;
}

.main-wrapper { height: 100vh; width: 100vw; display: flex; flex-direction: column; }
#console-shell { height: 100%; display: flex; flex-direction: column; }

.console-header { 
  display: flex; justify-content: space-between; padding: 10px 20px; 
  background: #111; border-bottom: 2px solid #222; align-items: center; 
}

.logo h1 { margin: 0; font-size: 1.2rem; letter-spacing: 5px; }
.logo span { color: var(--neon-pink); }

.screen { 
  flex-grow: 1; margin: 15px; background: #020502; border: 10px solid #2a2a2a; 
  border-radius: 8px; position: relative; overflow: hidden; display: flex; flex-direction: column; 
}

.scanlines { 
  position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
  background: linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.1) 50%); 
  background-size: 100% 4px; z-index: 100; pointer-events: none; 
}

.crt-glow { 
  position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
  box-shadow: inset 0 0 50px rgba(0, 255, 65, 0.1); pointer-events: none; 
}

.menu-grid { 
  display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); 
  gap: 20px; padding: 40px; z-index: 10; 
}

.game-card { 
  border: 1px solid var(--neon-green); padding: 20px; text-align: center; 
  cursor: pointer; background: rgba(0, 255, 65, 0.02); transition: all 0.2s ease; 
}

.game-card.is-selected {
  background: var(--neon-green);
  color: #000;
  transform: scale(1.05);
  box-shadow: 0 0 25px var(--neon-green);
  border: 2px solid #fff;
}

.game-icon { font-size: 2.5rem; margin-bottom: 10px; }
.game-hint { font-size: 0.6rem; font-weight: bold; margin-top: 10px; animation: blink 0.5s infinite; }

.console-footer { 
  padding: 8px 20px; background: #111; border-top: 2px solid #222; font-size: 0.8rem; 
}

.footer-content { display: flex; justify-content: space-between; align-items: center; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-up-enter-active { transition: all 0.4s ease-out; }
.slide-up-enter-from { transform: translateY(30px); opacity: 0; }
.blink { animation: blink 1s infinite; }
@keyframes blink { 50% { opacity: 0; } }

.game-viewport { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; background: #000; }
</style>