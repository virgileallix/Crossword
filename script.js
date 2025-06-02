/**
 * script.js
 *
 * Générateur de mot-croisé “Computer Science Crossword” pour une grille 15×15
 * avec la règle “chaque mot (sauf le 1er) doit croiser au moins un mot déjà en place”,
 * afin de créer un bloc dense et unique.
 */

// -------------------------------------------------
// 1) Liste des mots + leurs définitions
// -------------------------------------------------
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
// Mettre toutes les réponses en majuscules
RAW_WORDS.forEach(obj => {
  obj.answer = obj.answer.toUpperCase();
});

// Pour placer du plus long au plus court
let WORDS = RAW_WORDS
  .map((obj, idx) => ({ ...obj, originalIndex: idx }))
  .sort((a, b) => b.answer.length - a.answer.length);

// -------------------------------------------------
// 2) Paramètres de la grille (15×15)
// -------------------------------------------------
const GRID_SIZE = 15;
let grid = [];              // matrice 15×15 (initialisée à null plus bas)
let placedWords = [];       // contiendra chaque mot réellement placé

/**
 * Initialise la grille à null pour chaque case.
 */
function initGrid() {
  grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
}

// -------------------------------------------------
// 3) Vérification de placement & comptage des croisements
// -------------------------------------------------
/**
 * Vérifie si “word” peut être posé à (r,c) en direction “dir” ("across"|"down") :
 *  - Pas de dépassement de bord.
 *  - Chaque case est vide (null) ou contient déjà la même lettre (croisement légitime).
 *  - La case immédiatement avant/ après (dans la direction) est vide ou bord.
 *  - Aucun voisin orthogonal n’est non-null (sauf si c’est croisement).
 */
function canPlace(word, r, c, dir) {
  const L = word.length;
  // 1) Limites
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
  // 3) Pour chaque lettre
  for (let i = 0; i < L; i++) {
    const rr = r + (dir === "down" ? i : 0);
    const cc = c + (dir === "across" ? i : 0);
    const ch = word[i];
    // a) case vide ou même lettre
    if (grid[rr][cc] !== null && grid[rr][cc] !== ch) return false;
    // b) si vide, vérifier les voisins orthogonaux
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
 * Compte le nombre de croisements (lettres communes) si l’on plaçait “word” à (r,c) en “dir”.
 * Sert à s’assurer qu’on a AU MOINS 1 croisement pour chaque mot (sauf le 1er).
 * Retourne un entier ≥ 0.
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
// 4) Placement effectif du mot dans grid[][]
// -------------------------------------------------
/**
 * Pose “wordObj.answer” (chaîne majuscule) à (r,c) dans la direction “dir”.
 * Met à jour grid[][] et ajoute un objet à placedWords[] contenant :
 *   answer, clue, row, col, dir, cells (liste de {row,col}),
 *   originalIndex, clueNumber (initialement null).
 */
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
// 5) Algorithme de placement (tous dans un îlot dense)
// -------------------------------------------------
/**
 * 1) Initialiser la grille à null.
 * 2) Placer le mot le plus long (WORDS[0]) au centre en “across”.
 * 3) Pour chaque mot i = 1…N-1, ne placer QUE s’il peut créer ≥ 1 croisement :
 *    - On tente d’abord tous les croisements “naturels” lettre‐à‐lettre.
 *    - Si toujours non placé, on balaie toutes les positions “across” ET “down”,
 *      MAIS n’autorise que celles où countCrossings(...) ≥ 1.
 *    - Si aucun emplacement ne donne ≥ 1 croisement, on abandonne le mot (il ne sera pas placé).
 * 4) En résulte un unique bloc solide sans mot isolé.
 */
function placeAllWords() {
  initGrid();
  placedWords = [];

  // 5.1) Placer le premier mot (plus long) au centre, horizontalement
  {
    const first = WORDS[0].answer;
    const r0 = Math.floor(GRID_SIZE / 2);
    const c0 = Math.floor((GRID_SIZE - first.length) / 2);
    placeWordAt(WORDS[0], r0, c0, "across");
  }

  // 5.2) Pour chaque mot restant, exiger ≥ 1 croisement
  for (let wi = 1; wi < WORDS.length; wi++) {
    const wordObj = WORDS[wi];
    const word = wordObj.answer;
    let placed = false;

    // 5.2.a) Tenter toutes les intersections possibles (croisements “naturels”)
    for (let letterIdx = 0; letterIdx < word.length && !placed; letterIdx++) {
      const ch = word[letterIdx];
      // Pour chaque mot déjà posé
      for (let pw of placedWords) {
        for (let cellIdx = 0; cellIdx < pw.cells.length && !placed; cellIdx++) {
          const { row: rr, col: cc } = pw.cells[cellIdx];
          if (grid[rr][cc] === ch) {
            // Si pw.dir est “across”, on tente ce mot en “down” & vice versa
            const dir = (pw.dir === "across" ? "down" : "across");
            // On calcule le départ pour que word[letterIdx] coïncide avec (rr,cc)
            const startR = rr - (dir === "down" ? letterIdx : 0);
            const startC = cc - (dir === "across" ? letterIdx : 0);
            if (canPlace(word, startR, startC, dir)) {
              // On vérifie qu’il y a au moins 1 croisement
              if (countCrossings(word, startR, startC, dir) >= 1) {
                placeWordAt(wordObj, startR, startC, dir);
                placed = true;
              }
            }
          }
        }
      }
    }

    // 5.2.b) Si non placé, on balaie TOUTES les cases “across” en exigeant ≥ 1 croisement
    if (!placed) {
      for (let r = 0; r < GRID_SIZE && !placed; r++) {
        for (let c = 0; c <= GRID_SIZE - word.length && !placed; c++) {
          if (canPlace(word, r, c, "across") &&
              countCrossings(word, r, c, "across") >= 1) {
            placeWordAt(wordObj, r, c, "across");
            placed = true;
          }
        }
      }
    }
    // 5.2.c) Si toujours non placé, on balaie TOUTES les cases “down” en exigeant ≥ 1 croisement
    if (!placed) {
      for (let r = 0; r <= GRID_SIZE - word.length && !placed; r++) {
        for (let c = 0; c < GRID_SIZE && !placed; c++) {
          if (canPlace(word, r, c, "down") &&
              countCrossings(word, r, c, "down") >= 1) {
            placeWordAt(wordObj, r, c, "down");
            placed = true;
          }
        }
      }
    }
    // Si on n’a trouvé AUCUN emplacement où il croise au moins une lettre, on ne place pas ce mot.
  }
}

// -------------------------------------------------
// 6) Numérotation “Across” / “Down”
// -------------------------------------------------
/**
 * Parcourt placedWords[] et détecte, pour chaque mot, s’il démarre un “Across” ou un “Down”.
 * Si oui, on lui assigne un numéro (incrémental) et on stocke ce numéro dans numGrid[r][c].
 * On retourne ensuite { acrossClues, downClues, numGrid } :
 *   - acrossClues (array) : liste d’objets { number, clue, length, answer, r, c }
 *   - downClues   (array) : idem pour “Down”
 *   - numGrid     (matrix) : GRID_SIZE×GRID_SIZE contenant un numéro ou null
 */
function numberClues() {
  // 6.1) Préparer numGrid rempli de null
  const numGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
  let counter = 1;

  // 6.2) Pour chaque mot déjà placé
  for (let pw of placedWords) {
    const { row: r, col: c, dir } = pw;
    let isAcrossStart = false;
    let isDownStart   = false;

    // Début d'un “Across” ?
    if (dir === "across") {
      if ((c - 1 < 0 || grid[r][c - 1] === null) && (c + 1 < GRID_SIZE && grid[r][c + 1] !== null)) {
        isAcrossStart = true;
      }
    }
    // Début d'un “Down” ?
    if (dir === "down") {
      if ((r - 1 < 0 || grid[r - 1][c] === null) && (r + 1 < GRID_SIZE && grid[r + 1][c] !== null)) {
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

  // 6.3) Constituer acrossClues & downClues
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
  acrossClues.sort((a, b) => a.number - b.number);
  downClues.sort((a, b) => a.number - b.number);

  return { acrossClues, downClues, numGrid };
}

// -------------------------------------------------
// 7) Rendu de la grille HTML
// -------------------------------------------------
/**
 * Construit la balise <table id="crossword-grid"> en fonction de grid[][] et numGrid[][] :
 *   - Si grid[r][c] === null ⇒ <td class="black"></td>
 *   - Sinon ⇒ <td> avec un <input maxlength="1" data-r="r" data-c="c"> 
 *              et, si numGrid[r][c] ≠ null, un <div class="cell-number">num</div>
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
        // Case blanche : on ajoute un <input>
        const input = document.createElement("input");
        input.setAttribute("maxlength", "1");
        input.setAttribute("data-r", r);
        input.setAttribute("data-c", c);
        input.style.textTransform = "uppercase";
        td.appendChild(input);

        // Si un numéro doit apparaître ici
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
// 8) Rendu des définitions (clues)
// -------------------------------------------------
/**
 * Remplit les listes <ol id="across-clues"> et <ol id="down-clues">.
 * Format : “num. définition (longueur)”
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

// -------------------------------------------------
// 9) Vérifier / Afficher toutes les réponses
// -------------------------------------------------
function checkAnswers() {
  document.querySelectorAll("#crossword-grid input").forEach(input => {
    const r = parseInt(input.getAttribute("data-r"));
    const c = parseInt(input.getAttribute("data-c"));
    const sol = grid[r][c];
    const val = input.value.toUpperCase();
    if (val === sol) {
      input.style.backgroundColor = "#c8e6c9"; // vert clair si correct
    } else {
      input.style.backgroundColor = "#ffcdd2"; // rouge clair sinon
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

// -------------------------------------------------
// 10) Initialisation au chargement
// -------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  placeAllWords();
  const { acrossClues, downClues, numGrid } = numberClues();
  renderGrid(numGrid);
  renderClues(acrossClues, downClues);

  document.getElementById("check-button").addEventListener("click", checkAnswers);
  document.getElementById("reveal-button").addEventListener("click", revealAll);
});
