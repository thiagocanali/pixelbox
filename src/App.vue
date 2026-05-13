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
            <div class="status-indicator"><span class="blink">●</span> V3_ULTIMATE</div>
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
              <component 
                :is="state.currentGame" 
                @exit="exitGame" 
                @save-score="handleSaveScore" 
              />
            </div>
          </transition>
        </main>

        <footer class="console-footer">
          <div class="shortcuts">
            <span class="neon-pink">SETAS</span> p/ Navegar | [ENTER] Play | [ESC] Sair do Jogo | [L] Bloquear
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

// Importação de todos os jogos
import Dashboard from './components/Dashboard.vue';
import PanicScreen from './components/PanicScreen.vue';
import WindowsUpdate from './components/WindowsUpdate.vue';
import SnakeGame from './games/Snake/SnakeGame.vue';
import TetrisGame from './games/Tetris/TetrisGame.vue';
import WorkQuest from './games/WorkQuest/WorkQuest.vue';
import SpaceInvaders from './games/Space/SpaceInvaders.vue';
import PixelRacer from './games/Racer/PixelRacer.vue';
import CyberJump from './games/Jump/CyberJump.vue';
import BreakoutGame from './games/Breakout/BreakoutGame.vue';
import CyberCombat from './games/Combat/CyberCombat.vue';
import NeonPinball from './games/Pinball/NeonPinball.vue';
import TermoGame from './games/Termo/TermoGame.vue';

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
  { id: 'space', name: 'INVADERS', icon: '👾', component: markRaw(SpaceInvaders) },
  { id: 'jump', name: 'JUMP', icon: '🚀', component: markRaw(CyberJump) },
  { id: 'racer', name: 'RACER', icon: '🏎️', component: markRaw(PixelRacer) },
  { id: 'tetris', name: 'TETRIS', icon: '🧱', component: markRaw(TetrisGame) },
  { id: 'work', name: 'HACKER', icon: '👨‍💻', component: markRaw(WorkQuest) },
  { id: 'breakout', name: 'BRICKS', icon: '🧱', component: markRaw(BreakoutGame) },
  { id: 'combat', name: 'COMBAT', icon: '🥊', component: markRaw(CyberCombat) },
  { id: 'pinball', name: 'PINBALL', icon: '🎱', component: markRaw(NeonPinball) },
  { id: 'termo', name: 'TERMO', icon: '📝', component: markRaw(TermoGame) }
];

const selectGame = (game) => { state.currentGame = game.component; fx.shoot(); };
const exitGame = () => { state.currentGame = null; highScores.value = getScores(); };
const handleSaveScore = (d) => { saveScore(d.gameId, d.score); highScores.value = getScores(); };

const handleGlobalKeys = (e) => {
  if (!state.currentGame && !state.isLocked && !state.showPanic && !state.showWindows) {
    if (e.key === 'ArrowRight') state.selectedIndex = (state.selectedIndex + 1) % games.length;
    if (e.key === 'ArrowLeft') state.selectedIndex = (state.selectedIndex - 1 + games.length) % games.length;
    if (e.key === 'Enter') selectGame(games[state.selectedIndex]);
  }
  if (e.key === 'Escape') { state.currentGame = null; state.showPanic = false; state.showWindows = false; }
  if (e.key.toLowerCase() === 'l') state.isLocked = true;
};

onMounted(() => {
  setInterval(() => { currentTime.value = new Date().toLocaleTimeString('pt-BR'); }, 1000);
  window.addEventListener('keydown', handleGlobalKeys);
});
</script>

<style>
:root { --neon-green: #00ff41; --neon-pink: #ff00ff; }
body, html { margin: 0; background: #000; color: var(--neon-green); font-family: monospace; overflow: hidden; height: 100vh; }
.main-wrapper { height: 100vh; display: flex; flex-direction: column; }
#console-shell { flex: 1; display: flex; flex-direction: column; }
.console-header { height: 50px; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; background: #111; border-bottom: 2px solid #222; }
.logo h1 { font-size: 1.2rem; margin: 0; }
.logo span { color: var(--neon-pink); }
.screen { flex: 1; margin: 10px; background: #020502; border: 3px solid #333; position: relative; display: flex; justify-content: center; align-items: center; overflow: hidden; }
.menu-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 15px; padding: 20px; width: 100%; max-width: 900px; }
.game-card { border: 1px solid var(--neon-green); padding: 15px; text-align: center; cursor: pointer; transition: 0.2s; }
.game-card.is-selected { background: var(--neon-green); color: #000; box-shadow: 0 0 15px var(--neon-green); transform: translateY(-5px); }
.game-icon { font-size: 2rem; }
.console-footer { height: 40px; background: #111; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; border-top: 2px solid #222; }
.game-viewport { width: 100%; height: 100%; }
.blink { animation: blinker 1s linear infinite; }
@keyframes blinker { 50% { opacity: 0; } }
</style>