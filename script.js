/**
 * script.js
 *
 * Version 15×15 avec fonctions supplémentaires :
 *  - Bouton “Indice” (révèle une lettre au hasard qui n’est pas encore correcte).
 *  - Bouton “Réinitialiser” (vide toutes les cases et restaure le jeu à l’état initial).
 *
 * On garde la même logique de génération : chaque mot (sauf le 1er) doit
 * absolument croiser au moins une lettre pour former un bloc compact.
 */

// -------------------------------------------------
// 1) Liste des mots + définitions
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
// On force les réponses en majuscules
RAW_WORDS.forEach(obj => {
  obj.answer = obj.answer.toUpperCase();
});

// Pour optimiser le placement : du plus long au plus court
let WORDS = RAW_WORDS
  .map((obj, idx) => ({ ...obj, originalIndex: idx }))
  .sort((a, b) => b.answer.length - a.answer.length);

// -------------------------------------------------
// 2) Paramètres de la grille (15×15)
// -------------------------------------------------
const GRID_SIZE = 15;
let grid = [];
let placedWords = [];

/**
 * Initialise grid[][] à null.
 */
function initGrid() {
  grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
}

// -------------------------------------------------
// 3) Fonctions de vérification & comptage croisements
// -------------------------------------------------
/**
 * canPlace(word, r, c, dir)
 *  - Vérifie si “word” (string) se place à (r,c) en dir (“across”|"down").
 *  - N’autorise que les croisements légitimes, pas de débordement, pas de voisins « parasites ».
 */
function canPlace(word, r, c, dir) {
  const L = word.length;
  // 1) Vérifier limites
  if (dir === "across") {
    if (c < 0 || c + L > GRID_SIZE || r < 0 || r >= GRID_SIZE) return false;
  } else {
    if (r < 0 || r + L > GRID_SIZE || c < 0 || c >= GRID_SIZE) return false;
  }
  // 2) Case avant/après le mot (bord ou vide)
  if (dir === "across") {
    if (c - 1 >= 0 && grid[r][c - 1] !== null) return false;
    if (c + L < GRID_SIZE && grid[r][c + L] !== null) return false;
  } else {
    if (r - 1 >= 0 && grid[r - 1][c] !== null) return false;
    if (r + L < GRID_SIZE && grid[r + L][c] !== null) return false;
  }
  // 3) Chaque lettre doit être vide ou même lettre (croisement), et pas de voisins orthogonaux parasites
  for (let i = 0; i < L; i++) {
    const rr = r + (dir === "down" ? i : 0);
    const cc = c + (dir === "across" ? i : 0);
    const ch = word[i];

    // a) La case doit être null ou ch
    if (grid[rr][cc] !== null && grid[rr][cc] !== ch) return false;

    // b) Si la case est vide, vérifier qu’il n’y ait pas de voisins orthogonaux
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
 *  - Retourne le nombre de croisements (lettres identiques déjà dans grid) si l’on plaçait “word”
 *    à (r,c) en “dir”. Sert à exiger ≥1 croisement pour chaque mot (sauf le 1er).
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
// 4) placeWordAt : place le mot dans grid[][]
// -------------------------------------------------
/**
 * placeWordAt(wordObj, r, c, dir)
 *  - Remplit grid[][] avec les lettres de wordObj.answer en commençant à (r,c) dans “dir”.
 *  - Ajoute un objet à placedWords avec toutes les info utiles (cells, originalIndex, clueNumber=null, etc.).
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
// 5) placeAllWords : placement compact 15×15
// -------------------------------------------------
/**
 * 1) initGrid()
 * 2) Placer le mot le plus long (WORDS[0]) au centre en “across”
 * 3) Pour chaque mot i = 1…n-1 :
 *    - Tenter tous les croisements “naturels”
 *    - Si non placé, balayer tout “across” et “down” en exigeant countCrossings ≥ 1
 *    - Sinon, abandonner le mot
 * Résultat : un bloc unique dense dans la grille.
 */
function placeAllWords() {
  initGrid();
  placedWords = [];

  // 5.1) Placer le premier mot (le plus long) au centre
  {
    const first = WORDS[0].answer;
    const r0 = Math.floor(GRID_SIZE / 2);
    const c0 = Math.floor((GRID_SIZE - first.length) / 2);
    placeWordAt(WORDS[0], r0, c0, "across");
  }

  // 5.2) Pour chaque mot suivant, exiger ≥1 croisement
  for (let wi = 1; wi < WORDS.length; wi++) {
    const wordObj = WORDS[wi];
    const word = wordObj.answer;
    let placed = false;

    // 5.2.a) Essayer toutes les intersections possibles
    for (let letterIdx = 0; letterIdx < word.length && !placed; letterIdx++) {
      const ch = word[letterIdx];
      for (let pw of placedWords) {
        for (let cellIdx = 0; cellIdx < pw.cells.length && !placed; cellIdx++) {
          const { row: rr, col: cc } = pw.cells[cellIdx];
          if (grid[rr][cc] === ch) {
            const dir = pw.dir === "across" ? "down" : "across";
            const startR = rr - (dir === "down" ? letterIdx : 0);
            const startC = cc - (dir === "across" ? letterIdx : 0);
            if (canPlace(word, startR, startC, dir) && countCrossings(word, startR, startC, dir) >= 1) {
              placeWordAt(wordObj, startR, startC, dir);
              placed = true;
            }
          }
        }
      }
    }

    // 5.2.b) Si pas encore placé, balayer tout “across”
    if (!placed) {
      for (let r = 0; r < GRID_SIZE && !placed; r++) {
        for (let c = 0; c <= GRID_SIZE - word.length && !placed; c++) {
          if (canPlace(word, r, c, "across") && countCrossings(word, r, c, "across") >= 1) {
            placeWordAt(wordObj, r, c, "across");
            placed = true;
          }
        }
      }
    }
    // 5.2.c) Sinon, balayer tout “down”
    if (!placed) {
      for (let r = 0; r <= GRID_SIZE - word.length && !placed; r++) {
        for (let c = 0; c < GRID_SIZE && !placed; c++) {
          if (canPlace(word, r, c, "down") && countCrossings(word, r, c, "down") >= 1) {
            placeWordAt(wordObj, r, c, "down");
            placed = true;
          }
        }
      }
    }
    // Si aucun placement ne donne ≥1 croisement, on abandonne ce mot
  }
}

// -------------------------------------------------
// 6) numberClues : numérote et construit acrossClues/downClues
// -------------------------------------------------
/**
 * Parcourt placedWords[] pour détecter chaque début d’“Across” ou de “Down”.
 * Si c’est le cas, assigne un numéro croissant (commence à 1) et note numGrid[r][c].
 * RENVOIE : { acrossClues, downClues, numGrid }
 */
function numberClues() {
  const numGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
  let counter = 1;

  for (let pw of placedWords) {
    const { row: r, col: c, dir } = pw;
    let isAcrossStart = false;
    let isDownStart   = false;

    if (dir === "across") {
      if ((c - 1 < 0 || grid[r][c - 1] === null) && (c + 1 < GRID_SIZE && grid[r][c + 1] !== null)) {
        isAcrossStart = true;
      }
    }
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
// 7) renderGrid : affiche la grille dans le DOM
// -------------------------------------------------
/**
 * Construit la table HTML #crossword-grid à partir de grid[][] et numGrid[][].
 * Cases noires => <td class="black"></td>
 * Cases blanches => <td><input ...> [+ petit numéro si numGrid[r][c] != null]</td>
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

        // Si numGrid[r][c] existe, on affiche le petit numéro
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
/**
 * Remplit <ol id="across-clues"> et <ol id="down-clues">.
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
// 9) Fonctions “Vérifier”, “Indice”, “Reveal All”, “Réinitialiser”
// -------------------------------------------------
/**
 * Vérifier : colorie en vert clair si la lettre entrée est bonne,
 * sinon en rouge clair. Ne bloque pas l’input (on peut corriger).
 */
function checkAnswers() {
  document.querySelectorAll("#crossword-grid input").forEach(input => {
    const r = parseInt(input.getAttribute("data-r"));
    const c = parseInt(input.getAttribute("data-c"));
    const sol = grid[r][c];
    const val = input.value.toUpperCase();
    // Enlever toute classe d’indice précédemment appliquée
    input.classList.remove("cell-hint");
    if (val === sol) {
      input.style.backgroundColor = "#c8e6c9"; // vert clair
    } else {
      input.style.backgroundColor = "#ffcdd2"; // rouge clair
    }
  });
}

/**
 * Indice : choisit aléatoirement une case blanche qui n’a pas encore
 * la bonne lettre, et place la bonne lettre dedans. Ajoute la classe
 * .cell-hint pour colorer le fond (jaune clair).
 */
function giveHint() {
  // Récupérer toutes les cases <input>
  const allInputs = Array.from(document.querySelectorAll("#crossword-grid input"));

  // Filtrer celles qui sont “incomplètes” (soit vides, soit incorrectes)
  const incorrectOrEmpty = allInputs.filter(input => {
    const r = parseInt(input.getAttribute("data-r"));
    const c = parseInt(input.getAttribute("data-c"));
    const sol = grid[r][c];
    const val = input.value.toUpperCase();
    return val !== sol;
  });

  if (incorrectOrEmpty.length === 0) {
    alert("Toutes les lettres sont déjà correctes ! Vous avez terminé le mot-croisé.");
    return;
  }

  // Choisir une case au hasard parmi celles-ci
  const randIndex = Math.floor(Math.random() * incorrectOrEmpty.length);
  const chosenInput = incorrectOrEmpty[randIndex];
  const rr = parseInt(chosenInput.getAttribute("data-r"));
  const cc = parseInt(chosenInput.getAttribute("data-c"));
  chosenInput.value = grid[rr][cc];
  chosenInput.disabled = true;                // on bloque la modification
  chosenInput.classList.add("cell-hint");     // style “indice” (jaune clair)
}

/**
 * Reveal All : remplit toutes les cases avec la solution, désactive les inputs.
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
 * Réinitialiser : vide toutes les cases, remet les inputs en état normal.
 * Ne régénère pas la grille complète, juste on efface les saisies/indices.
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
// 10) Initialisation au chargement de la page
// -------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  placeAllWords();
  const { acrossClues, downClues, numGrid } = numberClues();

  renderGrid(numGrid);
  renderClues(acrossClues, downClues);

  document.getElementById("check-button").addEventListener("click", checkAnswers);
  document.getElementById("hint-button").addEventListener("click", giveHint);
  document.getElementById("reveal-button").addEventListener("click", revealAll);
  document.getElementById("reset-button").addEventListener("click", resetGrid);
});
