<template>
  <div class="termo-container">
    <div class="hud">
      <div class="title" :title="secretWord">
        TERMO.EXE
      </div>

      <div class="subtitle">
        Adivinhe a palavra em 6 tentativas
      </div>
    </div>

    <div class="board">
      <div
        v-for="(row, rowIndex) in guesses"
        :key="rowIndex"
        class="row"
      >
        <div
          v-for="(letter, colIndex) in row"
          :key="colIndex"
          class="tile"
          :class="getTileClass(rowIndex, colIndex)"
        >
          {{ letter }}
        </div>
      </div>
    </div>

    <div class="keyboard">
      <div class="kb-row">
        <button
          v-for="key in topKeys"
          :key="key"
          @click="handleKey(key)"
        >
          {{ key }}
        </button>
      </div>

      <div class="kb-row">
        <button
          v-for="key in middleKeys"
          :key="key"
          @click="handleKey(key)"
        >
          {{ key }}
        </button>
      </div>

      <div class="kb-row">
        <button class="big" @click="submitGuess">
          ENTER
        </button>

        <button
          v-for="key in bottomKeys"
          :key="key"
          @click="handleKey(key)"
        >
          {{ key }}
        </button>

        <button class="big" @click="removeLetter">
          ⌫
        </button>
      </div>
    </div>

    <!-- CHEAT MODE -->
    <div v-if="secretMode" class="cheat">
      {{ secretWord }}
    </div>

    <div v-if="gameOver" class="overlay">
      <h2 v-if="won">ACCESS_GRANTED</h2>
      <h2 v-else>ACCESS_DENIED</h2>

      <p class="answer">
        Palavra:
        <span>{{ secretWord }}</span>
      </p>

      <button @click="resetGame">
        REBOOT [ENTER]
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

/* =========================
   KEYBOARD
========================= */

const topKeys = 'QWERTYUIOP'.split('');
const middleKeys = 'ASDFGHJKL'.split('');
const bottomKeys = 'ZXCVBNM'.split('');

/* =========================
   WORDS
========================= */

const words = [
  // cyber / hacker
  'TERMO','NINJA','LASER','PIXEL','CYBER','GHOST','REACT','VUEJX',
  'GAMER','HACKR','BLOCO','MOUSE','TECLA','TELAS','VERDE','PRETO',
  'BRAVO','FRASE','LIVRO','CHUVA','FLORE','TREVO','PEDRA','FONTE',
  'LINHA','CAIXA','TETRI','SWORD','MAGIA','DRAGO','PLANO','MUNDO',
  'BOTAO','FONES','NIVEL','QUEST','ARENA','TIROS','DEMON','SCOUT',
  'PYROS','MEDIC','SNIPR','HEAVY','SPYZ','JOGAR','FURIA','METAL',
  'NEONS','SKULL','ROBOT','SIGMA','NEXUS','VIRUS','ADMIN','ROOTS',
  'SHELL','DEBUG','STACK','ARRAY','LOOPS','WHILE','BREAK','VAPOR',
  'RETRO','ANIME','MANGA','CHAOS','OMEGA','ALPHA','DELTA','GAMMA',
  'BLADE','FLASH','SMOKE','SHOCK','CRASH','STORM','SNAKE','RAVEN',
  'CRYPT','NIGHT','DREAM','FROST','FLAME','BLOOD','VENOM','RADAR',
  'SPEED','ULTRA',

  // comuns
  'AMIGO','SONHO','TEMPO','FORTE','CASAL','FESTA','PRAIA','CAMPO',
  'PORTA','ROUPA','BANHO','ALUNO','PROVA','LAPIS','BOLSA','CARRO',
  'MOTOR','AVIAO','NAVIO','TIGRE','ZEBRA','COBRA','PEIXE','FRUTA',
  'MELAO','BANAN','MACAS','LIMAO','ARROZ','PASTA','PIZZA','DOCES',
  'BOLOS','LEITE','SUCOS','VINHO','DANCA','FILME','SERIE','ATRIZ',
  'PALCO','SHOWS','NOITE','TARDE','MANHA','ONTEM','ANTES','RISOS',
  'CHORO','MEDOS','FELIZ','CALMO','FORCA','HONRA','PODER','REINO',

  // fantasia
  'DRUID','MAGOZ','ORCZZ','ELFOZ','ANJOZ','MONST','BESTA','ESPAD',
  'ESCUD','GUERR',

  // programação
  'NODEJ','MYSQL','REDIS','LINUX','UBUNT','MACOS','PYTHO','JAVAS',
  'TYPES','FETCH','TOKEN','LOGIN','ROUTE','STATE','STORE','CACHE',
  'INPUT','CLICK','PRESS','BUILD','DEPLO','SERVE','NPMJX','YARNX',
  'GITZZ','COMIT','MERGE','PULLS','PUSHS','BRANC','CODAR','BANCO',

  // games
  'ZELDA','MARIO','SONIC','KRATO','LINKZ','SAMUS','PACMA','CRAFT',
  'MOBZZ','PVPZZ','BOSSS','LOOTS','SKINS','XPZZZ','RANKS','CLANS',
  'RAIDE','DUNGE','FARMA','TANKS','HEALS',

  // espaço
  'ASTRO','COMET','LUNAR','SOLAR','GALAX','NEBUL','COSMO','ORBIT',
  'TROVA','VENTO','GEADA','RAIOS','TEMPE','FUMAC','BRASA','ONDAS',

  // extras
  'SOMBR','CLARO','BRILH','ESCUR','MISTE','LOUCO','VIBRA','ENERG',
  'DADOS','SORTE','AZARZ','GANHO','PERDA','RISCO','FATAL','MITOS'
];

/* =========================
   FILTER 5 LETTERS
========================= */

const filteredWords = words.filter(
  word => word.length === 5
);

/* =========================
   GAME STATE
========================= */

const secretWord = ref('');
const currentRow = ref(0);
const currentCol = ref(0);

const gameOver = ref(false);
const won = ref(false);

const secretMode = ref(false);

const guesses = ref(
  Array.from({ length: 6 }, () => Array(5).fill(''))
);

const evaluations = ref(
  Array.from({ length: 6 }, () => Array(5).fill(''))
);

/* =========================
   CHEAT SYSTEM
========================= */

let cheatCode = '';
const secretSequence = 'IDDQD';

/* =========================
   WORD GENERATION
========================= */

const randomWord = () => {
  return filteredWords[
    Math.floor(Math.random() * filteredWords.length)
  ];
};

/* =========================
   RESET
========================= */

const resetGame = () => {
  secretWord.value = randomWord();

  guesses.value = Array.from(
    { length: 6 },
    () => Array(5).fill('')
  );

  evaluations.value = Array.from(
    { length: 6 },
    () => Array(5).fill('')
  );

  currentRow.value = 0;
  currentCol.value = 0;

  gameOver.value = false;
  won.value = false;
};

/* =========================
   INPUT
========================= */

const handleKey = (key) => {
  if (gameOver.value) return;

  if (currentCol.value < 5) {
    guesses.value[currentRow.value][currentCol.value] = key;
    currentCol.value++;
  }
};

const removeLetter = () => {
  if (gameOver.value) return;

  if (currentCol.value > 0) {
    currentCol.value--;

    guesses.value[currentRow.value][currentCol.value] = '';
  }
};

/* =========================
   CHECK WORD
========================= */

const submitGuess = () => {
  if (gameOver.value) return;

  if (currentCol.value < 5) return;

  const guess =
    guesses.value[currentRow.value].join('');

  const answer = secretWord.value;

  let result = Array(5).fill('wrong');

  // letras corretas
  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) {
      result[i] = 'correct';
    }
  }

  // letras presentes
  for (let i = 0; i < 5; i++) {
    if (
      result[i] !== 'correct' &&
      answer.includes(guess[i])
    ) {
      result[i] = 'present';
    }
  }

  evaluations.value[currentRow.value] = result;

  // vitória
  if (guess === answer) {
    won.value = true;
    gameOver.value = true;
    return;
  }

  currentRow.value++;
  currentCol.value = 0;

  // derrota
  if (currentRow.value >= 6) {
    gameOver.value = true;
  }
};

/* =========================
   TILE CLASS
========================= */

const getTileClass = (row, col) => {
  return evaluations.value[row][col];
};

/* =========================
   KEYBOARD LISTENER
========================= */

const keyboardListener = (e) => {
  const key = e.key.toUpperCase();

  // evita bug segurando tecla
  if (e.repeat) return;

  // reset
  if (gameOver.value && e.key === 'Enter') {
    resetGame();
    return;
  }

  // CTRL + SHIFT + K
  if (
    e.ctrlKey &&
    e.shiftKey &&
    e.key.toLowerCase() === 'k'
  ) {
    secretMode.value = !secretMode.value;
    return;
  }

  // tecla `
  if (e.key === '`') {
    alert(`PALAVRA: ${secretWord.value}`);
    return;
  }

  // letras
  if (/^[A-Z]$/.test(key)) {

    // cheat
    cheatCode += key;

    if (cheatCode.length > 5) {
      cheatCode = cheatCode.slice(-5);
    }

    if (cheatCode === secretSequence) {
      alert(`IDDQD ENABLED\n\n${secretWord.value}`);
    }

    // input
    handleKey(key);

    return;
  }

  // backspace
  if (e.key === 'Backspace') {
    removeLetter();
    return;
  }

  // enter
  if (e.key === 'Enter') {
    submitGuess();
  }
};

/* =========================
   LIFE CYCLE
========================= */

onMounted(() => {
  resetGame();

  window.addEventListener(
    'keydown',
    keyboardListener
  );
});

onUnmounted(() => {
  window.removeEventListener(
    'keydown',
    keyboardListener
  );
});
</script>

<style scoped>
.termo-container {
  background: #000;
  color: #00ff41;

  min-height: 100vh;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  font-family: monospace;

  padding: 20px;

  position: relative;

  overflow: hidden;
}

/* HUD */

.hud {
  text-align: center;
  margin-bottom: 25px;
}

.title {
  font-size: 2.4rem;

  color: #ff00ff;

  text-shadow:
    0 0 10px #ff00ff,
    0 0 25px #ff00ff;

  letter-spacing: 3px;

  cursor: help;
}

.subtitle {
  opacity: 0.7;
  margin-top: 8px;
}

/* BOARD */

.board {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row {
  display: flex;
  gap: 8px;
}

.tile {
  width: 60px;
  height: 60px;

  border: 2px solid #333;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 2rem;
  font-weight: bold;

  text-transform: uppercase;

  background: #111;

  transition: all 0.2s ease;
}

.correct {
  background: #00ff41;
  border-color: #00ff41;

  color: #000;

  box-shadow:
    0 0 15px #00ff41,
    0 0 30px #00ff41;
}

.present {
  background: #ffff00;
  border-color: #ffff00;

  color: #000;

  box-shadow:
    0 0 15px #ffff00,
    0 0 30px #ffff00;
}

.wrong {
  background: #1a1a1a;
  border-color: #444;

  color: #555;
}

/* KEYBOARD */

.keyboard {
  margin-top: 30px;

  display: flex;
  flex-direction: column;

  gap: 10px;
}

.kb-row {
  display: flex;
  justify-content: center;
  gap: 6px;
}

button {
  background: #111;

  color: #00ffff;

  border: 1px solid #00ffff;

  padding: 10px;

  min-width: 40px;

  cursor: pointer;

  font-family: inherit;

  transition: all 0.15s ease;
}

button:hover {
  background: #00ffff;

  color: #000;

  box-shadow:
    0 0 10px #00ffff,
    0 0 20px #00ffff;
}

.big {
  min-width: 80px;
}

/* GAME OVER */

.overlay {
  position: absolute;
  inset: 0;

  background: rgba(0, 0, 0, 0.95);

  display: flex;
  flex-direction: column;

  align-items: center;
  justify-content: center;

  gap: 15px;

  z-index: 50;
}

.overlay h2 {
  font-size: 2rem;

  color: #ff00ff;

  text-shadow: 0 0 20px #ff00ff;
}

.answer span {
  color: #ffff00;
}

/* SECRET CHEAT */

.cheat {
  position: fixed;

  bottom: 10px;
  right: 10px;

  font-size: 10px;

  opacity: 0.08;

  color: #00ff41;

  pointer-events: none;
  user-select: none;

  letter-spacing: 2px;
}

/* MOBILE */

@media (max-width: 600px) {
  .tile {
    width: 48px;
    height: 48px;

    font-size: 1.5rem;
  }

  button {
    min-width: 30px;

    padding: 8px;

    font-size: 0.8rem;
  }

  .title {
    font-size: 1.8rem;
  }
}
</style>