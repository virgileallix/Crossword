/**
 * script.js
 *
 * Version 15×15, bloc compact, avec :
 *  - Bouton “Vérifier”
 *  - Bouton “Indice”
 *  - Bouton “Réinitialiser”
 *  - Révélation complète via le “code secret” flèche droite + flèche droite + m t b
 *  - Descriptions (clues) fixes, numérotées manuellement
 */

// -------------------------------------------------
// 1) Liste des mots (20) + définitions (clues)
// -------------------------------------------------
const RAW_WORDS = [
  // Across
  { answer: "ENCRYPTION", clue: "Process of converting data into a code for security." },
  { answer: "DATABASE",   clue: "Organized collection of data." },
  { answer: "FIREWALL",   clue: "Security system that controls incoming and outgoing network traffic." },
  { answer: "FUNCTION",   clue: "Block of code that performs a specific task." },
  { answer: "NETWORK",    clue: "Collection of computers connected together." },
  { answer: "CACHE",      clue: "High-speed data storage between memory and CPU." },
  { answer: "INPUT",      clue: "Data entered into a computer." },
  { answer: "BUG",        clue: "Error in a program." },
  // Down
  { answer: "ALGORITHM",  clue: "Step-by-step procedure to solve a problem." },
  { answer: "COMPILER",   clue: "Program that translates code into machine language." },
  { answer: "HARDWARE",   clue: "The physical parts of a computer." },
  { answer: "BINARY",     clue: "Number system with only 0s and 1s." },
  { answer: "KERNEL",     clue: "Core part of an operating system." },
  { answer: "OUTPUT",     clue: "Data produced by a computer." },
  { answer: "PYTHON",     clue: "Programming language named after a snake." },
  { answer: "SERVER",     clue: "Computer that provides data to other computers." },
  { answer: "CPU",        clue: "Brain of the computer (abbr.)." },
  { answer: "DEBUG",      clue: "To find and remove errors in code." },
  { answer: "JAVA",       clue: "Popular programming language that starts with \"J\"." },
  { answer: "LOOP",       clue: "Structure for repeating a set of instructions." }
];
// On force toutes les réponses en majuscules
RAW_WORDS.forEach(obj => obj.answer = obj.answer.toUpperCase());

// Pour placer du plus long au plus court
let WORDS = RAW_WORDS
  .map((obj, idx) => ({ ...obj, originalIndex: idx }))
  .sort((a, b) => b.answer.length - a.answer.length);

// -------------------------------------------------
// 2) Paramètres de la grille (15×15)
// -------------------------------------------------
const GRID_SIZE = 15;
let grid = [];            // matrice GRID_SIZE×GRID_SIZE (initialisée à null)
let placedWords = [];     // contiendra les mots effectivement placés

/**
 * Initialise la grille à null.
 */
function initGrid() {
  grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
}

// -------------------------------------------------
// 3) canPlace & countCrossings
// -------------------------------------------------
function canPlace(word, r, c, dir) {
  const L = word.length;
  // 1) Vérifier débordement
  if (dir === "across") {
    if (c < 0 || c + L > GRID_SIZE || r < 0 || r >= GRID_SIZE) return false;
  } else {
    if (r < 0 || r + L > GRID_SIZE || c < 0 || c >= GRID_SIZE) return false;
  }
  // 2) Case avant/après le mot
  if (dir === "across") {
    if (c - 1 >= 0 && grid[r][c - 1] !== null) return false;
    if (c + L < GRID_SIZE && grid[r][c + L] !== null) return false;
  } else {
    if (r - 1 >= 0 && grid[r - 1][c] !== null) return false;
    if (r + L < GRID_SIZE && grid[r + L][c] !== null) return false;
  }
  // 3) Chaque lettre doit être vide ou identique, ET pas de voisins parasites
  for (let i = 0; i < L; i++) {
    const rr = r + (dir === "down" ? i : 0);
    const cc = c + (dir === "across" ? i : 0);
    const ch = word[i];
    if (grid[rr][cc] !== null && grid[rr][cc] !== ch) return false;
    if (grid[rr][cc] === null) {
      if (dir === "across") {
        if ((rr - 1 >= 0 && grid[rr - 1][cc] !== null) ||
            (rr + 1 < GRID_SIZE && grid[rr + 1][cc] !== null)) {
          return false;
        }
      } else {
        if ((cc - 1 >= 0 && grid[rr][cc - 1] !== null) ||
            (cc + 1 < GRID_SIZE && grid[rr][cc + 1] !== null)) {
          return false;
        }
      }
    }
  }
  return true;
}

function countCrossings(word, r, c, dir) {
  let crosses = 0;
  for (let i = 0; i < word.length; i++) {
    const rr = r + (dir === "down" ? i : 0);
    const cc = c + (dir === "across" ? i : 0);
    if (grid[rr][cc] === word[i]) crosses++;
  }
  return crosses;
}

// -------------------------------------------------
// 4) placeWordAt : place un mot dans grid[][] et storedWords
// -------------------------------------------------
function placeWordAt(wordObj, r, c, dir) {
  const word = wordObj.answer;
  const cells = [];
  for (let i = 0; i < word.length; i++) {
    const rr = r + (dir === "down" ? i : 0);
    const cc = c + (dir === "across" ? i : 0);
    grid[rr][cc] = word[i];
    cells.push({ row: rr, col: cc });
  }
  placedWords.push({
    answer: word,
    clue: wordObj.clue,
    row: r,
    col: c,
    dir: dir,
    cells: cells,
    originalIndex: wordObj.originalIndex,
    clueNumber: null
  });
}

// -------------------------------------------------
// 5) placeAllWords : placement 15×15, bloc compact
// -------------------------------------------------
function placeAllWords() {
  initGrid();
  placedWords = [];

  // 5.1) Premier mot (le plus long) au centre, horizontal
  {
    const first = WORDS[0].answer;
    const r0 = Math.floor(GRID_SIZE / 2);
    const c0 = Math.floor((GRID_SIZE - first.length) / 2);
    placeWordAt(WORDS[0], r0, c0, "across");
  }

  // 5.2) Pour chaque mot restant, exiger au moins 1 croisement
  for (let wi = 1; wi < WORDS.length; wi++) {
    const wordObj = WORDS[wi];
    const word = wordObj.answer;
    let placed = false;

    // 5.2.a) Essayer toutes les intersections “naturelles”
    for (let letterIdx = 0; letterIdx < word.length && !placed; letterIdx++) {
      const ch = word[letterIdx];
      for (let pw of placedWords) {
        for (let cellIdx = 0; cellIdx < pw.cells.length && !placed; cellIdx++) {
          const { row: rr, col: cc } = pw.cells[cellIdx];
          if (grid[rr][cc] === ch) {
            const dir = pw.dir === "across" ? "down" : "across";
            const startR = rr - (dir === "down" ? letterIdx : 0);
            const startC = cc - (dir === "across" ? letterIdx : 0);
            if (
              canPlace(word, startR, startC, dir) &&
              countCrossings(word, startR, startC, dir) >= 1
            ) {
              placeWordAt(wordObj, startR, startC, dir);
              placed = true;
            }
          }
        }
      }
    }

    // 5.2.b) Si non placé, balayer tout “across” en exigeant ≥1 croisement
    if (!placed) {
      for (let r = 0; r < GRID_SIZE && !placed; r++) {
        for (let c = 0; c <= GRID_SIZE - word.length && !placed; c++) {
          if (
            canPlace(word, r, c, "across") &&
            countCrossings(word, r, c, "across") >= 1
          ) {
            placeWordAt(wordObj, r, c, "across");
            placed = true;
          }
        }
      }
    }

    // 5.2.c) Sinon, balayer tout “down” en exigeant ≥1 croisement
    if (!placed) {
      for (let r = 0; r <= GRID_SIZE - word.length && !placed; r++) {
        for (let c = 0; c < GRID_SIZE && !placed; c++) {
          if (
            canPlace(word, r, c, "down") &&
            countCrossings(word, r, c, "down") >= 1
          ) {
            placeWordAt(wordObj, r, c, "down");
            placed = true;
          }
        }
      }
    }
    // Si aucun emplacement ne donne ≥1 croisement, on “oublie” le mot
  }
}

// -------------------------------------------------
// 6) numberClues : assignation manuelle des numéros
// -------------------------------------------------
function numberClues() {
  const numGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));

  placedWords.forEach(pw => {
    switch (pw.answer) {
      // Across (1→8)
      case "ENCRYPTION": pw.clueNumber = 1; break;
      case "DATABASE":   pw.clueNumber = 2; break;
      case "FIREWALL":   pw.clueNumber = 3; break;
      case "FUNCTION":   pw.clueNumber = 4; break;
      case "NETWORK":    pw.clueNumber = 5; break;
      case "CACHE":      pw.clueNumber = 6; break;
      case "INPUT":      pw.clueNumber = 7; break;
      case "BUG":        pw.clueNumber = 8; break;
      // Down (1→12)
      case "ALGORITHM":  pw.clueNumber = 1; break;
      case "COMPILER":   pw.clueNumber = 2; break;
      case "HARDWARE":   pw.clueNumber = 3; break;
      case "BINARY":     pw.clueNumber = 4; break;
      case "KERNEL":     pw.clueNumber = 5; break;
      case "OUTPUT":     pw.clueNumber = 6; break;
      case "PYTHON":     pw.clueNumber = 7; break;
      case "SERVER":     pw.clueNumber = 8; break;
      case "CPU":        pw.clueNumber = 9; break;
      case "DEBUG":      pw.clueNumber = 10; break;
      case "JAVA":       pw.clueNumber = 11; break;
      case "LOOP":       pw.clueNumber = 12; break;
      default:           pw.clueNumber = null;
    }
    if (pw.clueNumber !== null) {
      numGrid[pw.row][pw.col] = pw.clueNumber;
    }
  });

  // Définitions fixées (Across et Down)
  const acrossClues = [
    { number: 1,  clue: "Process of converting data into a code for security.", length: 10 },
    { number: 2,  clue: "Organized collection of data.", length: 8 },
    { number: 3,  clue: "Security system that controls incoming and outgoing network traffic.", length: 8 },
    { number: 4,  clue: "Block of code that performs a specific task.", length: 8 },
    { number: 5,  clue: "Collection of computers connected together.", length: 7 },
    { number: 6,  clue: "High-speed data storage between memory and CPU.", length: 5 },
    { number: 7,  clue: "Data entered into a computer.", length: 5 },
    { number: 8,  clue: "Error in a program.", length: 3 }
  ];
  const downClues = [
    { number: 1,  clue: "Step-by-step procedure to solve a problem.", length: 9 },
    { number: 2,  clue: "Program that translates code into machine language.", length: 8 },
    { number: 3,  clue: "The physical parts of a computer.", length: 8 },
    { number: 4,  clue: "Number system with only 0s and 1s.", length: 6 },
    { number: 5,  clue: "Core part of an operating system.", length: 6 },
    { number: 6,  clue: "Data produced by a computer.", length: 6 },
    { number: 7,  clue: "Programming language named after a snake.", length: 6 },
    { number: 8,  clue: "Computer that provides data to other computers.", length: 6 },
    { number: 9,  clue: "Brain of the computer (abbr.).", length: 3 },
    { number: 10, clue: "To find and remove errors in code.", length: 5 },
    { number: 11, clue: "Popular programming language that starts with \"J\".", length: 4 },
    { number: 12, clue: "Structure for repeating a set of instructions.", length: 4 }
  ];

  return { acrossClues, downClues, numGrid };
}

// -------------------------------------------------
// 7) renderGrid : construit la <table> HTML
// -------------------------------------------------
function renderGrid(numGrid) {
  const table = document.getElementById("crossword-grid");
  table.innerHTML = "";

  for (let r = 0; r < GRID_SIZE; r++) {
    const tr = document.createElement("tr");
    for (let c = 0; c < GRID_SIZE; c++) {
      const td = document.createElement("td");
      if (grid[r][c] === null) {
        td.classList.add("black");
      } else {
        // Case blanche : on ajoute un <input>
        const input = document.createElement("input");
        input.setAttribute("maxlength", "1");
        input.setAttribute("data-r", r);
        input.setAttribute("data-c", c);
        input.style.textTransform = "uppercase";
        td.appendChild(input);

        // Si un numéro doit apparaître, on le place
        if (numGrid[r][c] !== null) {
          const span = document.createElement("div");
          span.classList.add("cell-number");
          span.textContent = numGrid[r][c];
          td.appendChild(span);
        }
      }
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
}

// -------------------------------------------------
// 8) renderClues : affiche les définitions
// -------------------------------------------------
function renderClues(acrossClues, downClues) {
  const olA = document.getElementById("across-clues");
  const olD = document.getElementById("down-clues");
  olA.innerHTML = "";
  olD.innerHTML = "";

  acrossClues.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.number}. ${item.clue} (${item.length})`;
    olA.appendChild(li);
  });
  downClues.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.number}. ${item.clue} (${item.length})`;
    olD.appendChild(li);
  });
}

// -------------------------------------------------
// 9) Vérifier / Indice / RevealAll / Reset / Secret
// -------------------------------------------------
function checkAnswers() {
  document.querySelectorAll("#crossword-grid input").forEach(input => {
    const r = parseInt(input.getAttribute("data-r"));
    const c = parseInt(input.getAttribute("data-c"));
    const sol = grid[r][c];
    const val = input.value.toUpperCase();

    // Retirer l’éventuelle classe “indice”
    input.classList.remove("cell-hint");
    if (val === sol) {
      input.style.backgroundColor = "#c8e6c9"; // vert clair si correct
    } else {
      input.style.backgroundColor = "#ffcdd2"; // rouge clair sinon
    }
  });
}

function giveHint() {
  const allInputs = Array.from(document.querySelectorAll("#crossword-grid input"));
  const incorrectOrEmpty = allInputs.filter(input => {
    const r = parseInt(input.getAttribute("data-r"));
    const c = parseInt(input.getAttribute("data-c"));
    const sol = grid[r][c];
    const val = input.value.toUpperCase();
    return val !== sol;
  });
  if (incorrectOrEmpty.length === 0) {
    alert("Toutes les lettres sont déjà correctes !");
    return;
  }
  const randIndex = Math.floor(Math.random() * incorrectOrEmpty.length);
  const chosenInput = incorrectOrEmpty[randIndex];
  const rr = parseInt(chosenInput.getAttribute("data-r"));
  const cc = parseInt(chosenInput.getAttribute("data-c"));
  chosenInput.value = grid[rr][cc];
  chosenInput.disabled = true;
  chosenInput.classList.add("cell-hint");
}

function revealAll() {
  document.querySelectorAll("#crossword-grid input").forEach(input => {
    const r = parseInt(input.getAttribute("data-r"));
    const c = parseInt(input.getAttribute("data-c"));
    input.value = grid[r][c];
    input.disabled = true;
    input.style.backgroundColor = "#e0e0e0";
    input.style.color = "#333";
  });
}

function resetGrid() {
  document.querySelectorAll("#crossword-grid input").forEach(input => {
    input.value = "";
    input.disabled = false;
    input.style.backgroundColor = "transparent";
    input.classList.remove("cell-hint");
  });
}

// -------------------------------------------------
// 10) Code secret : → → m t b
// -------------------------------------------------
let secretSequence = [];
const SECRET = ["ArrowRight", "ArrowRight", "m", "t", "b"];

// On écoute désormais ‘keydown’ sur document (et non plus window)
document.addEventListener("keydown", e => {
  // On stocke la touche (e.key)
  secretSequence.push(e.key);
  // On garde uniquement les 5 dernières touches
  if (secretSequence.length > SECRET.length) {
    secretSequence.shift();
  }
  // On vérifie si on a exactement les 5 touches du SECRET (minuscule/majuscule ignoré)
  if (
    secretSequence.length === SECRET.length &&
    secretSequence.every((k, i) => k.toLowerCase() === SECRET[i].toLowerCase())
  ) {
    revealAll();
    alert("Code secret reconnu ! Toutes les réponses sont affichées.");
    secretSequence = [];
  }
});

// -------------------------------------------------
// 11) Init au chargement
// -------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  placeAllWords();
  const { acrossClues, downClues, numGrid } = numberClues();

  renderGrid(numGrid);
  renderClues(acrossClues, downClues);

  document.getElementById("check-button").addEventListener("click", checkAnswers);
  document.getElementById("hint-button").addEventListener("click", giveHint);
  document.getElementById("reset-button").addEventListener("click", resetGrid);
});
