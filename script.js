/**
 * script.js
 *
 * Générateur de mot-croisé “Computer Science Crossword”
 *  - Trie d'abord les mots par longueur décroissante.
 *  - Place chaque mot sur une grille 20×20 en essayant systématiquement
 *    toutes les orientations et positions possibles (pas de conflits).
 *  - Numérote “Across” et “Down” en parcourant la grille de haut à gauche vers le bas.
 *  - Génère la grille HTML avec <td> + <input> + petits numéros.
 *  - Boutons “Vérifier” et “Afficher toutes les réponses” en bas.
 */

// ------------------------------
// 1) Liste des mots + définitions
// ------------------------------
const RAW_WORDS = [
  { answer: "ALGORITHM",  clue: "Step-by-step procedure to solve a problem." },
  { answer: "BINARY",     clue: "Number system with only 0s and 1s." },
  { answer: "BUG",        clue: "Error in a program." },
  { answer: "CACHE",      clue: "High-speed data storage between memory and CPU." },
  { answer: "COMPILER",   clue: "Program that translates code into machine language." },
  { answer: "CPU",        clue: "Brain of the computer (abbr.)." },
  { answer: "DATABASE",   clue: "Organized collection of data." },
  { answer: "DEBUG",      clue: "To find and remove errors in code." },
  { answer: "ENCRYPTION", clue: "Process of converting data into a code for security." },
  { answer: "FIREWALL",   clue: "Security system that controls incoming and outgoing network traffic." },
  { answer: "FUNCTION",   clue: "Block of code that performs a specific task." },
  { answer: "HARDWARE",   clue: "The physical parts of a computer." },
  { answer: "INPUT",      clue: "Data entered into a computer." },
  { answer: "JAVA",       clue: "Popular programming language that starts with \"J\"." },
  { answer: "KERNEL",     clue: "Core part of an operating system." },
  { answer: "LOOP",       clue: "Structure for repeating a set of instructions." },
  { answer: "NETWORK",    clue: "Collection of computers connected together." },
  { answer: "OUTPUT",     clue: "Data produced by a computer." },
  { answer: "PYTHON",     clue: "Programming language named after a snake." },
  { answer: "SERVER",     clue: "Computer that provides data to other computers." }
];

// On force les réponses en majuscules
RAW_WORDS.forEach(obj => {
  obj.answer = obj.answer.toUpperCase();
});

// Pour le placement, on duplique et on trie par longueur décroissante
let WORDS = RAW_WORDS
  .map((obj, idx) => ({ ...obj, originalIndex: idx }))
  .sort((a, b) => b.answer.length - a.answer.length);

// ------------------------------
// 2) Paramètres de la grille
// ------------------------------
const GRID_SIZE = 20;
let grid = [];           // matrice GRID_SIZE×GRID_SIZE initialisée à null
let placedWords = [];    // stocke chaque mot placé : { answer, clue, row, col, dir, cells, clueNumber }

// Initialisation de la grille à null
function initGrid() {
  grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
}

// ------------------------------
// 3) Placement des mots
// ------------------------------
/**
 * Vérifie si on peut placer word.answer (string) à (r,c) en direction dir ("across"|"down").
 * - Aucun dépassement de grille.
 * - Chaquе case doit être null ou contenir la même lettre (croisement valide).
 * - Avant/après le mot, on doit avoir bord ou case vide (pour éviter de coller 2 mots).
 * - Autour (orthogonal) des lettres du mot, pas d’autres lettres (sauf si c’est un croisement légitime).
 */
function canPlace(word, r, c, dir) {
  const L = word.length;
  // 1) Vérifier limites
  if (dir === "across") {
    if (c < 0 || c + L > GRID_SIZE || r < 0 || r >= GRID_SIZE) return false;
  } else {
    if (r < 0 || r + L > GRID_SIZE || c < 0 || c >= GRID_SIZE) return false;
  }
  // 2) Case juste avant et après (dans la direction) doivent être libres ou bord
  if (dir === "across") {
    if (c - 1 >= 0 && grid[r][c - 1] !== null) return false;
    if (c + L < GRID_SIZE && grid[r][c + L] !== null) return false;
  } else {
    if (r - 1 >= 0 && grid[r - 1][c] !== null) return false;
    if (r + L < GRID_SIZE && grid[r + L][c] !== null) return false;
  }
  // 3) Pour chaque lettre du mot
  for (let i = 0; i < L; i++) {
    const rr = r + (dir === "down" ? i : 0);
    const cc = c + (dir === "across" ? i : 0);
    const ch = word[i];
    // a) Si la case est occupée par une autre lettre ≠ ch, on ne peut pas
    if (grid[rr][cc] !== null && grid[rr][cc] !== ch) return false;
    // b) Si on n’est pas en croisement (grid[rr][cc] === null), vérifier l’orthogonal
    if (grid[rr][cc] === null) {
      if (dir === "across") {
        // vérifier au-dessus et en-dessous
        if ((rr - 1 >= 0 && grid[rr - 1][cc] !== null) ||
            (rr + 1 < GRID_SIZE && grid[rr + 1][cc] !== null)) {
          return false;
        }
      } else {
        // down : vérifier à gauche et à droite
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
 * Place le mot “word” (string) à (r,c) en direction dir. Met à jour grid[][] et placedWords[].
 * idxWords correspond à l’indice dans WORDS (pour récupérer la définition + originalIndex).
 */
function placeWordAt(wordObj, r, c, dir) {
  const word = wordObj.answer;
  const L = word.length;
  const cells = [];
  for (let i = 0; i < L; i++) {
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
    clueNumber: null // on numérotera plus tard
  });
}

/**
 * Tente de placer TOUTES les entrées de WORDS[] dans la grille.
 * On place d’abord le plus long mot (au centre, horizontalement),
 * puis on essaie pour chaque suivant :
 *   1) Tenter tous les croisements possibles (pour chaque lettre commune)
 *      avec les mots déjà placés, dans l'orientation opposée.
 *   2) Si aucun croisement n’est trouvé, on balaye toutes les cases
 *      pour l’essayer “across” sans conflit. Si sans succès, idem en “down”.
 */
function placeAllWords() {
  initGrid();
  placedWords = [];

  // 1) Placer le premier mot (le plus long) au centre horizontal
  const first = WORDS[0].answer;
  const midRow = Math.floor(GRID_SIZE / 2);
  const startCol = Math.floor((GRID_SIZE - first.length) / 2);
  placeWordAt(WORDS[0], midRow, startCol, "across");

  // 2) Pour chaque mot restant
  for (let wi = 1; wi < WORDS.length; wi++) {
    const wordObj = WORDS[wi];
    const word = wordObj.answer;
    let placed = false;

    // 2.a) Essayer de croiser avec chaque mot déjà placé
    for (let letterIdx = 0; letterIdx < word.length && !placed; letterIdx++) {
      const ch = word[letterIdx];
      // Pour chaque mot déjà placé
      for (let pw of placedWords) {
        for (let cellIdx = 0; cellIdx < pw.cells.length && !placed; cellIdx++) {
          const { row: rr, col: cc } = pw.cells[cellIdx];
          if (grid[rr][cc] === ch) {
            // On a trouvé un point de croisement potentiel.
            // Si pw.dir est “across”, on place ce mot en “down”, et vice‐versa.
            const dir = (pw.dir === "across" ? "down" : "across");
            // Calculer la position de départ de “word” tel que word[letterIdx] soit sur (rr,cc)
            const startR = rr - (dir === "down" ? letterIdx : 0);
            const startC = cc - (dir === "across" ? letterIdx : 0);
            if (canPlace(word, startR, startC, dir)) {
              placeWordAt(wordObj, startR, startC, dir);
              placed = true;
            }
          }
        }
      }
    }

    // 2.b) Si pas encore placé, on balaye toutes les cases en “across”
    if (!placed) {
      for (let r = 0; r < GRID_SIZE && !placed; r++) {
        for (let c = 0; c <= GRID_SIZE - word.length && !placed; c++) {
          if (canPlace(word, r, c, "across")) {
            placeWordAt(wordObj, r, c, "across");
            placed = true;
          }
        }
      }
    }

    // 2.c) Si encore pas placé, on balaye toutes les cases en “down”
    if (!placed) {
      for (let r = 0; r <= GRID_SIZE - word.length && !placed; r++) {
        for (let c = 0; c < GRID_SIZE && !placed; c++) {
          if (canPlace(word, r, c, "down")) {
            placeWordAt(wordObj, r, c, "down");
            placed = true;
          }
        }
      }
    }

    // Si toujours non placé, on l’ignore (mais avec 20×20^ et 20 mots, ça ne devrait pas arriver).
  }
}

// ------------------------------
// 4) Numérotation “Across” / “Down”
// ------------------------------
/**
 * Parcourt la grille case par case pour attribuer un numéro quand un mot
 * commence réellement “across” ou “down”. Renvoie { acrossClues, downClues, numGrid }.
 *
 * - numGrid[r][c] = n si la case (r,c) est le début d’un mot Across ou Down => affiche “n” dans la grille.
 * - placedWords[i].clueNumber = n pour que l’on sache quel mot a quel numéro.
 * - acrossClues et downClues sont deux tableaux triés par numéro, contenant { number, clue, length }.
 */
function numberClues() {
  // 1) Créer une matrice numGrid initialisée à null
  const numGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
  let counter = 1;

  // 2) On parcourt chaque mot placé et on vérifie s’il commence un Across / Down
  for (let pw of placedWords) {
    const { row: r, col: c, dir, cells } = pw;
    // Début d’un Across ?
    let isAcrossStart = false;
    if (dir === "across") {
      // Case à gauche vide/hors-grille, et case à droite existe (lettre)
      if ((c - 1 < 0 || grid[r][c - 1] === null) &&
          (c + 1 < GRID_SIZE && grid[r][c + 1] !== null)) {
        isAcrossStart = true;
      }
    }
    // Début d’un Down ?
    let isDownStart = false;
    if (dir === "down") {
      if ((r - 1 < 0 || grid[r - 1][c] === null) &&
          (r + 1 < GRID_SIZE && grid[r + 1][c] !== null)) {
        isDownStart = true;
      }
    }
    if (isAcrossStart || isDownStart) {
      if (numGrid[r][c] === null) {
        numGrid[r][c] = counter;
        pw.clueNumber = counter;
        counter++;
      } else {
        pw.clueNumber = numGrid[r][c];
      }
    }
  }

  // 3) Construire acrossClues et downClues
  const acrossClues = [];
  const downClues   = [];
  for (let pw of placedWords) {
    if (pw.clueNumber === null) continue;
    if (pw.dir === "across") {
      acrossClues.push({
        number: pw.clueNumber,
        clue: pw.clue,
        length: pw.answer.length,
        answer: pw.answer,
        r: pw.row,
        c: pw.col
      });
    } else {
      downClues.push({
        number: pw.clueNumber,
        clue: pw.clue,
        length: pw.answer.length,
        answer: pw.answer,
        r: pw.row,
        c: pw.col
      });
    }
  }
  // Trier par numéro
  acrossClues.sort((a, b) => a.number - b.number);
  downClues.sort((a, b) => a.number - b.number);

  return { acrossClues, downClues, numGrid };
}

// ------------------------------
// 5) Rendu de la grille HTML
// ------------------------------
/**
 * Génère la balise <table id="crossword-grid"> en fonction de grid[][] et numGrid[][].
 * - Si grid[r][c] === null → <td class="black"></td>
 * - Sinon → <td> avec un <input maxlength="1" data-r="r" data-c="c"> et, si numGrid[r][c] non-null, un <div class="cell-number">num</div>
 */
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
        // Case blanche : on met un input
        const input = document.createElement("input");
        input.setAttribute("maxlength", "1");
        input.setAttribute("data-r", r);
        input.setAttribute("data-c", c);
        input.style.textTransform = "uppercase";
        td.appendChild(input);

        // Si on doit afficher un numéro dans la case
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

// ------------------------------
// 6) Rendu des définitions (clues)
// ------------------------------
/**
 * Remplit <ol id="across-clues"> et <ol id="down-clues"> avec :
 *   <li>“num. définition (longueur)”</li>
 */
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

// ------------------------------
// 7) Fonctions “Vérifier” et “Afficher toutes les réponses”
// ------------------------------
function checkAnswers() {
  document.querySelectorAll("#crossword-grid input").forEach(input => {
    const r = parseInt(input.getAttribute("data-r"));
    const c = parseInt(input.getAttribute("data-c"));
    const sol = grid[r][c];
    const val = input.value.toUpperCase();
    if (val === sol) {
      input.style.backgroundColor = "#c8e6c9"; // vert clair
    } else {
      input.style.backgroundColor = "#ffcdd2"; // rouge clair
    }
  });
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

// ------------------------------
// 8) Initialisation au chargement
// ------------------------------
window.addEventListener("DOMContentLoaded", () => {
  placeAllWords();
  const { acrossClues, downClues, numGrid } = numberClues();
  renderGrid(numGrid);
  renderClues(acrossClues, downClues);

  document.getElementById("check-button").addEventListener("click", checkAnswers);
  document.getElementById("reveal-button").addEventListener("click", revealAll);
});
