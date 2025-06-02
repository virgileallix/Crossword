/**
 * script.js
 *
 * Générateur de mot-croisé 15×15 “Computer Science” qui permet de :
 *  1. Choisir le nombre de mots (entre 5 et 40) au chargement.
 *  2. Tirer au hasard N mots dans un dictionnaire interne de ~50 termes CS.
 *  3. Construire un mot-croisé compact (chaque mot, sauf le premier, doit croiser au moins un mot déjà en place).
 *  4. Afficher la grille + définitions “Across” / “Down”.
 *  5. Boutons “Vérifier”, “Indice”, “Réinitialiser”.
 *  6. Code secret “→ → m t b” pour révéler la solution complète.
 */

// -------------------------------------------------
// 1) Dictionnaire interne (~50 termes CS en anglais)
// -------------------------------------------------
const WORD_POOL = [
  { answer: "ALGORITHM",      clue: "Step-by-step procedure to solve a problem." },
  { answer: "ARRAY",          clue: "Data structure of contiguous elements of same type." },
  { answer: "AUTHENTICATION", clue: "Process of verifying user identity." },
  { answer: "BACKUP",         clue: "Copying data to prevent loss." },
  { answer: "BINARY",         clue: "Number system with only 0s and 1s." },
  { answer: "BIT",            clue: "Binary digit, 0 or 1." },
  { answer: "BUG",            clue: "Error in a program." },
  { answer: "CACHE",          clue: "High-speed data storage between memory and CPU." },
  { answer: "CLASS",          clue: "Blueprint for creating objects in OOP." },
  { answer: "CLOUD",          clue: "Network-based data storage or services." },
  { answer: "COMPILER",       clue: "Program that translates code into machine language." },
  { answer: "CPU",            clue: "Brain of the computer (abbr.)." },
  { answer: "DATA",           clue: "Facts or information stored." },
  { answer: "DATABASE",       clue: "Organized collection of data." },
  { answer: "DEBUG",          clue: "To find and remove errors in code." },
  { answer: "DRIVER",         clue: "Software that controls hardware devices." },
  { answer: "ENCRYPTION",     clue: "Process of converting data into a code for security." },
  { answer: "FIREWALL",       clue: "Security system that controls incoming and outgoing network traffic." },
  { answer: "FUNCTION",       clue: "Block of code that performs a specific task." },
  { answer: "GITHUB",         clue: "Popular platform for hosting Git repositories." },
  { answer: "HARDWARE",       clue: "The physical parts of a computer." },
  { answer: "INPUT",          clue: "Data entered into a computer." },
  { answer: "INTERFACE",      clue: "Boundary between two systems or modules." },
  { answer: "JAVA",           clue: "Popular programming language that starts with \"J\"." },
  { answer: "KERNEL",         clue: "Core part of an operating system." },
  { answer: "LOOP",           clue: "Structure for repeating a set of instructions." },
  { answer: "MODULE",         clue: "Self-contained unit of code or functionality." },
  { answer: "NETWORK",        clue: "Collection of computers connected together." },
  { answer: "OBJECT",         clue: "Instance of a class in OOP." },
  { answer: "PACKAGE",        clue: "Namespace that organizes classes and interfaces." },
  { answer: "PROTOCOL",       clue: "Rules for data exchange between devices." },
  { answer: "QUEUE",          clue: "Data structure where first-in-first-out principle applies." },
  { answer: "RECURSION",      clue: "Function that calls itself." },
  { answer: "ROUTER",         clue: "Device that forwards data packets between networks." },
  { answer: "SERVER",         clue: "Computer that provides data to other computers." },
  { answer: "SOFTWARE",       clue: "Programs and other operating information used by a computer." },
  { answer: "STACK",          clue: "Data structure where last-in-first-out principle applies." },
  { answer: "SYNTAX",         clue: "Rules that define correct code structure." },
  { answer: "TERMINAL",       clue: "Text-based interface to interact with OS." },
  { answer: "THREAD",         clue: "Smallest sequence of programmed instructions that can be managed independently." },
  { answer: "VARIABLE",       clue: "Storage location paired with a name and a value." },
  { answer: "VIRTUALIZATION", clue: "Technique to create a virtual version of computer resources." },
  { answer: "VIRUS",          clue: "Malicious software that replicates itself." },
  { answer: "VLAN",           clue: "Virtual Local Area Network." },
  { answer: "WIFI",           clue: "Wireless networking technology." },
  { answer: "XML",            clue: "Markup language that defines a set of rules for encoding documents." },
  { answer: "YAML",           clue: "Human-friendly data serialization standard." },
  { answer: "ZIGBEE",         clue: "Specification for a suite of high-level communication protocols." }
];
// Forcer toutes les réponses en majuscules
WORD_POOL.forEach(obj => obj.answer = obj.answer.toUpperCase());

// -------------------------------------------------
// 2) Variables globales de l’application
// -------------------------------------------------
let WORDS = [];            // Tableau des mots sélectionnés (définitions incluses)
const GRID_SIZE = 15;      // Grille 15×15
let grid = [];             // Matrice 15×15 (initialisée à null)
let placedWords = [];      // Mots effectivement placés avec leurs infos

// -------------------------------------------------
// 3) Initialisation de la grille à null
// -------------------------------------------------
function initGrid() {
  grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
}

// -------------------------------------------------
// 4) Fonctions canPlace & countCrossings
// -------------------------------------------------
function canPlace(word, r, c, dir) {
  const L = word.length;
  // 1) Vérifier débordement
  if (dir === "across") {
    if (c < 0 || c + L > GRID_SIZE || r < 0 || r >= GRID_SIZE) return false;
  } else {
    if (r < 0 || r + L > GRID_SIZE || c < 0 || c >= GRID_SIZE) return false;
  }
  // 2) Case avant/après
  if (dir === "across") {
    if (c - 1 >= 0 && grid[r][c - 1] !== null) return false;
    if (c + L < GRID_SIZE && grid[r][c + L] !== null) return false;
  } else {
    if (r - 1 >= 0 && grid[r - 1][c] !== null) return false;
    if (r + L < GRID_SIZE && grid[r + L][c] !== null) return false;
  }
  // 3) Chaque lettre
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
// 5) placeWordAt : place le mot dans grid[][] et storedWords
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
// 6) placeAllWords : placement 15×15, bloc compact
// -------------------------------------------------
function placeAllWords() {
  initGrid();
  placedWords = [];

  if (WORDS.length === 0) return; // Si aucun mot sélectionné, pas de grille

  // 6.1) Premier mot (plus long) au centre en horizontal
  {
    const first = WORDS[0].answer;
    const r0 = Math.floor(GRID_SIZE / 2);
    const c0 = Math.floor((GRID_SIZE - first.length) / 2);
    placeWordAt(WORDS[0], r0, c0, "across");
  }

  // 6.2) Pour chaque mot suivant, exiger au moins 1 croisement
  for (let wi = 1; wi < WORDS.length; wi++) {
    const wordObj = WORDS[wi];
    const word = wordObj.answer;
    let placed = false;

    // 6.2.a) Essayer toutes les intersections “naturelles”
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

    // 6.2.b) Si non placé, balayer tout “across” en exigeant ≥1 croisement
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

    // 6.2.c) Sinon, balayer tout “down” en exigeant ≥1 croisement
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
    // Si aucun emplacement ne donne ≥1 croisement, on abandonne ce mot
  }
}

// -------------------------------------------------
// 7) numberClues : assignation manuelle des numéros
// -------------------------------------------------
function numberClues() {
  const numGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));

  placedWords.forEach(pw => {
    switch (pw.answer) {
      // Across (1→8)
      case "ENCRYPTION":      pw.clueNumber = 1; break;
      case "DATABASE":        pw.clueNumber = 2; break;
      case "FIREWALL":        pw.clueNumber = 3; break;
      case "FUNCTION":        pw.clueNumber = 4; break;
      case "NETWORK":         pw.clueNumber = 5; break;
      case "CACHE":           pw.clueNumber = 6; break;
      case "INPUT":           pw.clueNumber = 7; break;
      case "BUG":             pw.clueNumber = 8; break;
      // Down (1→12)
      case "ALGORITHM":       pw.clueNumber = 1; break;
      case "COMPILER":        pw.clueNumber = 2; break;
      case "HARDWARE":        pw.clueNumber = 3; break;
      case "BINARY":          pw.clueNumber = 4; break;
      case "KERNEL":          pw.clueNumber = 5; break;
      case "OUTPUT":          pw.clueNumber = 6; break;
      case "PYTHON":          pw.clueNumber = 7; break;
      case "SERVER":          pw.clueNumber = 8; break;
      case "CPU":             pw.clueNumber = 9; break;
      case "DEBUG":           pw.clueNumber = 10; break;
      case "JAVA":            pw.clueNumber = 11; break;
      case "LOOP":            pw.clueNumber = 12; break;
      default:                pw.clueNumber = null;
    }
    if (pw.clueNumber !== null) {
      numGrid[pw.row][pw.col] = pw.clueNumber;
    }
  });

  // Définitions fixes (Across et Down) en fonction des numéros
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
// 8) renderGrid : construit la table HTML
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
        // Case blanche : on met un <input>
        const input = document.createElement("input");
        input.setAttribute("maxlength", "1");
        input.setAttribute("data-r", r);
        input.setAttribute("data-c", c);
        input.style.textTransform = "uppercase";
        td.appendChild(input);

        // Si numGrid[r][c] non-null, afficher le numéro
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
// 9) renderClues : affiche les définitions
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
// 10) Vérifier / Indice / RevealAll / Reset / Secret
// -------------------------------------------------
function checkAnswers() {
  document.querySelectorAll("#crossword-grid input").forEach(input => {
    const r = parseInt(input.getAttribute("data-r"));
    const c = parseInt(input.getAttribute("data-c"));
    const sol = grid[r][c];
    const val = input.value.toUpperCase();

    input.classList.remove("cell-hint");
    if (val === sol) {
      input.style.backgroundColor = "#c8e6c9"; // vert clair
    } else {
      input.style.backgroundColor = "#ffcdd2"; // rouge clair
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
// 11) Code secret : → → m t b
// -------------------------------------------------
let secretSequence = [];
const SECRET = ["ArrowRight", "ArrowRight", "m", "t", "b"];

document.addEventListener("keydown", e => {
  secretSequence.push(e.key);
  if (secretSequence.length > SECRET.length) {
    secretSequence.shift();
  }
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
// 12) Fonction utilitaire : tirer N mots aléatoires
// -------------------------------------------------
function pickRandomWords(n) {
  // On copie le WORD_POOL dans un array temporaire pour le mélanger
  const temp = [...WORD_POOL];
  // Mélange par Fisher-Yates
  for (let i = temp.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [temp[i], temp[j]] = [temp[j], temp[i]];
  }
  // On prend les n premiers
  return temp.slice(0, n);
}

// -------------------------------------------------
// 13) Génération initiale et gestion du bouton “Générer”
// -------------------------------------------------
function generateCrossword() {
  const countInput = document.getElementById("word-count");
  let n = parseInt(countInput.value);
  if (isNaN(n) || n < 5) n = 5;
  if (n > WORD_POOL.length) n = WORD_POOL.length;

  // Tirer n mots aléatoires
  WORDS = pickRandomWords(n)
    .map((obj, idx) => ({ ...obj, originalIndex: idx }))
    .sort((a, b) => b.answer.length - a.answer.length); // tri par longueur décroissante

  // Construire la grille
  placeAllWords();
  const { acrossClues, downClues, numGrid } = numberClues();

  // Afficher dans le DOM
  renderGrid(numGrid);
  renderClues(acrossClues, downClues);
  resetGrid(); // s’assure que toutes les cases sont vides et prêtes
}

window.addEventListener("DOMContentLoaded", () => {
  // Au chargement, on lie le bouton “Générer” et on fait un puzzle par défaut
  document.getElementById("generate-button").addEventListener("click", generateCrossword);

  // Boutons “Vérifier”, “Indice” et “Réinitialiser”
  document.getElementById("check-button").addEventListener("click", checkAnswers);
  document.getElementById("hint-button").addEventListener("click", giveHint);
  document.getElementById("reset-button").addEventListener("click", resetGrid);

  // Génération par défaut : 10 mots
  generateCrossword();
});
