/**
 * script.js
 *
 * Générateur de mot-croisé “Computer Science Crossword”
 * Cette version force chaque mot (à partir du 2ᵉ) à **croiser** au moins une lettre
 * déjà placée, de sorte à créer UN SEUL îlot cohérent.
 */

// -------------------------------------------------
// 1) Liste des 20 mots + leurs définitions
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
// On force toutes les réponses en majuscules
RAW_WORDS.forEach(obj => {
  obj.answer = obj.answer.toUpperCase();
});

// Pour placer intelligemment du plus long au plus court
let WORDS = RAW_WORDS
  .map((obj, idx) => ({ ...obj, originalIndex: idx }))
  .sort((a, b) => b.answer.length - a.answer.length);

// -------------------------------------------------
// 2) Paramètres de la grille
// -------------------------------------------------
const GRID_SIZE = 20;
let grid = [];              // matrice 20×20 initialisée plus bas
let placedWords = [];       // contiendra chaque mot réellement placé

/**
 * Initialise la grille à `null` pour chaque case.
 */
function initGrid() {
  grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
}

// -------------------------------------------------
// 3) Fonction canPlace + countCrossings
// -------------------------------------------------
/**
 * Vérifie si “word” (chaîne majuscule) peut être posé à (r,c) en “dir” ("across"|"down"),
 * sans dépasser, sans écraser de lettre différente (croisements légitimes acceptés),
 * et en respectant les règles “Before/After must be null or bord” 
 * et “Aucun voisin orthogonal non nul (sauf pour croisement)”.
 */
function canPlace(word, r, c, dir) {
  const L = word.length;
  // 1) Limites
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
  // 3) Pour chaque lettre du mot
  for (let i = 0; i < L; i++) {
    const rr = r + (dir === "down" ? i : 0);
    const cc = c + (dir === "across" ? i : 0);
    const ch = word[i];
    // a) La case doit être vide ou contenir la même lettre (croisement ok)
    if (grid[rr][cc] !== null && grid[rr][cc] !== ch) return false;
    // b) Si case vide (grid[rr][cc] === null), on doit vérifier l’orthogonal
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
 * Compte **combien** de croisements (lettres communes) il y aurait
 * si l’on plaçait “word” à (r,c) en “dir”. 
 * On retourne 0 si aucun car cette fonction sert à forcer
 * au moins un croisement pour chaque mot (à partir du 2ᵉ).
 */
function countCrossings(word, r, c, dir) {
  let crosses = 0;
  for (let i = 0; i < word.length; i++) {
    const rr = r + (dir === "down" ? i : 0);
    const cc = c + (dir === "across" ? i : 0);
    if (grid[rr][cc] === word[i]) {
      crosses++;
    }
  }
  return crosses;
}

// -------------------------------------------------
// 4) placeWordAt (pose réellement le mot dans grid[][])
// -------------------------------------------------
/**
 * Pose “wordObj.answer” à la position (r,c) dans la direction “dir”.
 * On met à jour grid[][] et on empile dans placedWords[] un objet contenant :
 *   answer, clue, row, col, dir, cells (tableau de {row,col}), originalIndex, clueNumber (null pour l'instant)
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
// 5) placeAllWords (essaye de construire le mot-croisé)
// -------------------------------------------------
/**
 * 1) On initialise la grille à null.
 * 2) On place le mot le plus long (“WORDS[0]”) au centre en “across”.
 * 3) Pour chaque mot suivant, on n’autorise que **des placements avec au moins
 *    un croisement** (countCrossings(...) >= 1). On parcourt d’abord TOUTES
 *    les possibilités de croisement (chaque lettre qui matche une lettre déjà en place),
 *    puis si on n’a pas encore placé, on balaie **TOUT** (mais toujours en
 *    exigeant >=1 croisement). Si on ne trouve **aucun emplacement** avec croisement,
 *    on le passe (il restera non placé).  
 */
function placeAllWords() {
  initGrid();
  placedWords = [];

  // 5.1) Placer le premier mot (le plus long) au centre, horizontalement
  {
    const first = WORDS[0].answer;
    const r0 = Math.floor(GRID_SIZE / 2);
    const c0 = Math.floor((GRID_SIZE - first.length) / 2);
    placeWordAt(WORDS[0], r0, c0, "across");
  }

  // 5.2) Pour chaque mot restant, on force >=1 croisement
  for (let wi = 1; wi < WORDS.length; wi++) {
    const wordObj = WORDS[wi];
    const word = wordObj.answer;
    let placed = false;

    // 5.2.a) Tenter toutes les intersections possibles (croisement “naturel”)
    for (let letterIdx = 0; letterIdx < word.length && !placed; letterIdx++) {
      const ch = word[letterIdx];
      // Pour chaque mot déjà posé
      for (let pw of placedWords) {
        for (let cellIdx = 0; cellIdx < pw.cells.length && !placed; cellIdx++) {
          const { row: rr, col: cc } = pw.cells[cellIdx];
          if (grid[rr][cc] === ch) {
            // Si pw.dir est “across”, on tente ce mot en “down” & vice versa
            const dir = (pw.dir === "across" ? "down" : "across");
            // On calcule la position de départ pour que word[letterIdx] tombe sur (rr,cc)
            const startR = rr - (dir === "down" ? letterIdx : 0);
            const startC = cc - (dir === "across" ? letterIdx : 0);
            if (canPlace(word, startR, startC, dir)) {
              // On vérifie au moins 1 croisement (ici on sait qu'il y a au moins le croisement ch)
              if (countCrossings(word, startR, startC, dir) >= 1) {
                placeWordAt(wordObj, startR, startC, dir);
                placed = true;
              }
            }
          }
        }
      }
    }

    // 5.2.b) Si toujours pas placé, on tente **TOUTES** les cases et orientations,
    //          mais en exigeant Xover >=1 (au moins un croisement).
    if (!placed) {
      // Essayer “across”
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
    if (!placed) {
      // Essayer “down”
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
    // Si on n'a PAS trouvé de placement avec au moins un croisement, on NE PLACE PAS le mot.
    // Cela garantit que la grille reste **UN SEUL îlot cohérent**.
  }
}

// -------------------------------------------------
// 6) Numérotation “Across” / “Down”
// -------------------------------------------------
/**
 * Parcourt chaque mot placé (placedWords[]) et détecte s’il démarre
 * un “Across” ou un “Down”. Si oui, lui assigne un numéro croissant.
 * On remplit `numGrid[r][c] = numéro` pour la case qui débute le mot.
 *
 * Retourne { acrossClues, downClues, numGrid } :
 *   - acrossClues/ downClues : liste d’objets { number, clue, length, answer, r, c }
 *   - numGrid      : matrice 20×20 avec un numéro ou null
 */
function numberClues() {
  // 6.1) Matrice numGrid initialisée à null
  const numGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
  let counter = 1;

  // 6.2) Pour chaque mot déjà placé
  for (let pw of placedWords) {
    const { row: r, col: c, dir, cells } = pw;
    let isAcrossStart = false;
    let isDownStart   = false;

    // Début d’un "Across" ?
    if (dir === "across") {
      if ((c - 1 < 0 || grid[r][c - 1] === null) && (c + 1 < GRID_SIZE && grid[r][c + 1] !== null)) {
        isAcrossStart = true;
      }
    }
    // Début d’un "Down" ?
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

  // 6.3) Construire deux listes “acrossClues” et “downClues”
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
 * Construit la <table id="crossword-grid"> en fonction de grid[][] & numGrid[][] :
 *   - Si grid[r][c] === null ⇒ <td class="black"></td>
 *   - Sinon ⇒ <td> avec un <input maxlength="1" data-r="r" data-c="c" />
 *              + si numGrid[r][c] ≠ null, on affiche un <div class="cell-number">num</div>
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
        // Case blanche : on ajoute <input>
        const input = document.createElement("input");
        input.setAttribute("maxlength", "1");
        input.setAttribute("data-r", r);
        input.setAttribute("data-c", c);
        input.style.textTransform = "uppercase";
        td.appendChild(input);
        // Si on a un numéro à afficher dans la case
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
 * Ex. "3. Step-by-step procedure to solve a problem. (9)"
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
// 10) Initialisation au chargement de la page
// -------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  placeAllWords();
  const { acrossClues, downClues, numGrid } = numberClues();
  renderGrid(numGrid);
  renderClues(acrossClues, downClues);

  document.getElementById("check-button").addEventListener("click", checkAnswers);
  document.getElementById("reveal-button").addEventListener("click", revealAll);
});
