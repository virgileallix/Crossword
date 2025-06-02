/**
 * script.js
 *
 * Version 15×15, bloc compact, avec :
 *  - Bouton “Vérifier”
 *  - Bouton “Indice” (révèle une lettre aléatoire incorrecte)
 *  - Bouton “Réinitialiser”
 *  - Révélation complète par séquence secrète → → m t b
 *  - Descriptions (clues) fixes, numérotées manuellement
 */

// -------------------------------------------------
// 1) Liste des mots (20) + définitions (clues)
// -------------------------------------------------
const RAW_WORDS = [
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
// Toutes les réponses en majuscules (sécurité)
RAW_WORDS.forEach(obj => obj.answer = obj.answer.toUpperCase());

// Pour le placement, on trie du plus long au plus court
let WORDS = RAW_WORDS
  .map((obj, idx) => ({ ...obj, originalIndex: idx }))
  .sort((a, b) => b.answer.length - a.answer.length);

// -------------------------------------------------
// 2) Paramètres de la grille (15×15)
// -------------------------------------------------
const GRID_SIZE = 15;
let grid = [];            // matrice GRID_SIZE×GRID_SIZE (initialisée à null)
let placedWords = [];     // contiendra les mots effectivement placés avec leurs infos

/**
 * Initialisation de la grille à null.
 */
function initGrid() {
  grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
}

// -------------------------------------------------
// 3) canPlace & countCrossings
// -------------------------------------------------
/**
 * canPlace(word, r, c, dir)
 *   - Vérifie si l’on peut placer “word” à la position (r,c) en direction “dir”.
 *   - Autorise seulement les croisements légitimes, aucun débordement, pas de voisins parasites.
 */
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
  // 3) Vérifier chaque lettre
  for (let i = 0; i < L; i++) {
    const rr = r + (dir === "down" ? i : 0);
    const cc = c + (dir === "across" ? i : 0);
    const ch = word[i];

    // a) Si case occupée par une lettre différente, c’est impossible
    if (grid[rr][cc] !== null && grid[rr][cc] !== ch) return false;

    // b) Si case vide, vérifier qu’aucun voisin orthogonal n’existe
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

/**
 * countCrossings(word, r, c, dir)
 *   - Compte combien de lettres du mot “word” se recouvriraient (croisements)
 *     si on le plaçait à (r,c) en “dir”. Sert à exiger au moins 1 croisement.
 */
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
// 4) placeWordAt : place le mot dans grid[][],
//    enregistre dans placedWords
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
// 5) placeAllWords : algorithme de placement 15×15,
//    bloc compact avec croisement obligatoire
// -------------------------------------------------
function placeAllWords() {
  initGrid();
  placedWords = [];

  // 5.1) Placer le premier mot au centre (horizontal)
  {
    const first = WORDS[0].answer;
    const r0 = Math.floor(GRID_SIZE / 2);
    const c0 = Math.floor((GRID_SIZE - first.length) / 2);
    placeWordAt(WORDS[0], r0, c0, "across");
  }

  // 5.2) Pour chaque mot suivant, exiger au moins 1 croisement
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

    // 5.2.c) Si toujours non placé, balayer tout “down” en exigeant ≥1 croisement
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
    // Si aucun emplacement ne permet ≥1 croisement, on abandonne ce mot
  }
}

// -------------------------------------------------
// 6) numberClues : numérote manuellement les mots
// -------------------------------------------------
/**
 * Ici, nous savons déjà :
 *   Across  :
 *     1. ENCRYPTION  (10)
 *     2. DATABASE    (8)
 *     3. FIREWALL    (8)
 *     4. FUNCTION    (8)
 *     5. NETWORK     (7)
 *     6. CACHE       (5)
 *     7. INPUT       (5)
 *     8. BUG         (3)
 *
 *   Down    :
 *     1. ALGORITHM   (9)
 *     2. COMPILER    (8)
 *     3. HARDWARE    (8)
 *     4. BINARY      (6)
 *     5. KERNEL      (6)
 *     6. OUTPUT      (6)
 *     7. PYTHON      (6)
 *     8. SERVER      (6)
 *     9. CPU         (3)
 *    10. DEBUG       (5)
 *    11. JAVA        (4)
 *    12. LOOP        (4)
 */
function numberClues() {
  // On construit numGrid pour indiquer où placer le numéro dans la grille
  const numGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));

  // Pour chaque mot placé, on lui attribue son numéro fixe selon sa réponse
  placedWords.forEach(pw => {
    switch (pw.answer) {
      // Across
      case "ENCRYPTION":
        pw.clueNumber = 1;
        break;
      case "DATABASE":
        pw.clueNumber = 2;
        break;
      case "FIREWALL":
        pw.clueNumber = 3;
        break;
      case "FUNCTION":
        pw.clueNumber = 4;
        break;
      case "NETWORK":
        pw.clueNumber = 5;
        break;
      case "CACHE":
        pw.clueNumber = 6;
        break;
      case "INPUT":
        pw.clueNumber = 7;
        break;
      case "BUG":
        pw.clueNumber = 8;
        break;
      // Down
      case "ALGORITHM":
        pw.clueNumber = 1;
        break;
      case "COMPILER":
        pw.clueNumber = 2;
        break;
      case "HARDWARE":
        pw.clueNumber = 3;
        break;
      case "BINARY":
        pw.clueNumber = 4;
        break;
      case "KERNEL":
        pw.clueNumber = 5;
        break;
      case "OUTPUT":
        pw.clueNumber = 6;
        break;
      case "PYTHON":
        pw.clueNumber = 7;
        break;
      case "SERVER":
        pw.clueNumber = 8;
        break;
      case "CPU":
        pw.clueNumber = 9;
        break;
      case "DEBUG":
        pw.clueNumber = 10;
        break;
      case "JAVA":
        pw.clueNumber = 11;
        break;
      case "LOOP":
        pw.clueNumber = 12;
        break;
      default:
        pw.clueNumber = null;
    }
    // On place ce numéro dans numGrid pour afficher dans la case
    if (pw.clueNumber !== null) {
      numGrid[pw.row][pw.col] = pw.clueNumber;
    }
  });

  // On construit deux listes statiques pour les définitions :
  const acrossClues = [
    { number: 1, clue: "Process of converting data into a code for security.", length: 10 },
    { number: 2, clue: "Organized collection of data.", length: 8 },
    { number: 3, clue: "Security system that controls incoming and outgoing network traffic.", length: 8 },
    { number: 4, clue: "Block of code that performs a specific task.", length: 8 },
    { number: 5, clue: "Collection of computers connected together.", length: 7 },
    { number: 6, clue: "High-speed data storage between memory and CPU.", length: 5 },
    { number: 7, clue: "Data entered into a computer.", length: 5 },
    { number: 8, clue: "Error in a program.", length: 3 }
  ];
  const downClues = [
    { number: 1, clue: "Step-by-step procedure to solve a problem.", length: 9 },
    { number: 2, clue: "Program that translates code into machine language.", length: 8 },
    { number: 3, clue: "The physical parts of a computer.", length: 8 },
    { number: 4, clue: "Number system with only 0s and 1s.", length: 6 },
    { number: 5, clue: "Core part of an operating system.", length: 6 },
    { number: 6, clue: "Data produced by a computer.", length: 6 },
    { number: 7, clue: "Programming language named after a snake.", length: 6 },
    { number: 8, clue: "Computer that provides data to other computers.", length: 6 },
    { number: 9, clue: "Brain of the computer (abbr.).", length: 3 },
    { number: 10, clue: "To find and remove errors in code.", length: 5 },
    { number: 11, clue: "Popular programming language that starts with \"J\".", length: 4 },
    { number: 12, clue: "Structure for repeating a set of instructions.", length: 4 }
  ];

  return { acrossClues, downClues, numGrid };
}

// -------------------------------------------------
// 7) renderGrid : construit la table HTML
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
        // Case blanche : <input>
        const input = document.createElement("input");
        input.setAttribute("maxlength", "1");
        input.setAttribute("data-r", r);
        input.setAttribute("data-c", c);
        input.style.textTransform = "uppercase";
        td.appendChild(input);

        // Si on a un numéro à afficher, on ajoute <div class="cell-number">n</div>
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
// 8) renderClues : affiche les définitions (Across/Down)
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
/**
 * Vérifie chaque case blanche : 
 *   - Si la lettre tapée est correcte → fond vert clair.
 *   - Sinon → fond rouge clair.
 *   - Les cases “indice” (jaune) perdent leur classe.
 */
function checkAnswers() {
  document.querySelectorAll("#crossword-grid input").forEach(input => {
    const r = parseInt(input.getAttribute("data-r"));
    const c = parseInt(input.getAttribute("data-c"));
    const sol = grid[r][c];
    const val = input.value.toUpperCase();

    input.classList.remove("cell-hint");
    if (val === sol) {
      input.style.backgroundColor = "#c8e6c9";
    } else {
      input.style.backgroundColor = "#ffcdd2";
    }
  });
}

/**
 * Indice : choisit aléatoirement une case incorrecte ou vide,
 * y place la lettre correcte, la désactive et applique la classe .cell-hint.
 */
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

/**
 * Reveal all : révèle toute la solution (s’il est appelé),
 * mais nous ne l’appelons qu’à partir du “secret”.
 */
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

/**
 * Réinitialiser : efface tout, enlève les couleurs et indices, 
 * mais ne reconstruit pas la grille (elle reste visible).
 */
function resetGrid() {
  document.querySelectorAll("#crossword-grid input").forEach(input => {
    input.value = "";
    input.disabled = false;
    input.style.backgroundColor = "transparent";
    input.classList.remove("cell-hint");
  });
}

// -------------------------------------------------
// 10) Gestion du “secret code” → → m t b
// -------------------------------------------------
let secretSequence = [];
const SECRET = ["ArrowRight", "ArrowRight", "m", "t", "b"];

window.addEventListener("keydown", e => {
  // On fait défiler notre buffer (secretSequence)
  secretSequence.push(e.key);
  // Ne garder que les 5 derniers
  if (secretSequence.length > SECRET.length) {
    secretSequence.shift();
  }
  // Vérifier si ça correspond
  if (
    secretSequence.length === SECRET.length &&
    secretSequence.every((k, i) => k.toLowerCase() === SECRET[i].toLowerCase())
  ) {
    revealAll();
    alert("Code secret reconnu ! Voici la solution complète.");
    secretSequence = [];
  }
});

// -------------------------------------------------
// 11) Initialisation au chargement de la page
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
