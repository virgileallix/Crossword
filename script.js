/**
 * script.js
 *
 * Générateur de mot-croisé 15×15 “Computer Science” avec :
 *  1. Choix du nombre de mots (5 → WORD_POOL.length)
 *  2. Tirage aléatoire de N mots dans un grand dictionnaire
 *  3. Placement compact (chaque mot, sauf le 1er, doit croiser au moins un mot déjà en place)
 *  4. Affichage de la grille + définitions “Across” / “Down”, **dynamiques**
 *  5. Boutons “Vérifier”, “Indice”, “Réinitialiser”
 *  6. Code secret “→ → m t b” pour révéler la solution complète
 */

// -------------------------------------------------
// 1) Dictionnaire (~50 termes CS en anglais)
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
// 2) Variables globales
// -------------------------------------------------
let WORDS = [];              // Mots sélectionnés (d'après le pool)
const GRID_SIZE = 15;        // Grille 15×15
let grid = [];               // Matrice 15×15 de `null` ou caractères
let placedWords = [];        // Objets { answer, clue, row, col, dir, cells, originalIndex, clueNumber }

// -------------------------------------------------
// 3) Initialiser la grille (grid) à `null`
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
  // 2) Case avant / après
  if (dir === "across") {
    if (c - 1 >= 0 && grid[r][c - 1] !== null) return false;
    if (c + L < GRID_SIZE && grid[r][c + L] !== null) return false;
  } else {
    if (r - 1 >= 0 && grid[r - 1][c] !== null) return false;
    if (r + L < GRID_SIZE && grid[r + L][c] !== null) return false;
  }
  // 3) Chaque lettre doit être vide ou identique, sans voisins parasites
  for (let i = 0; i < L; i++) {
    const rr = r + (dir === "down" ? i : 0);
    const cc = c + (dir === "across" ? i : 0);
    const ch = word[i];
    // a) Si case occupée par autre lettre, impossible
    if (grid[rr][cc] !== null && grid[rr][cc] !== ch) return false;
    // b) Si case vide, vérifier qu’il n’y ait pas de voisin orthogonal 
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
  // Compte le nombre de croisements (lettres identiques déjà posées)
  let crosses = 0;
  for (let i = 0; i < word.length; i++) {
    const rr = r + (dir === "down" ? i : 0);
    const cc = c + (dir === "across" ? i : 0);
    if (grid[rr][cc] === word[i]) crosses++;
  }
  return crosses;
}

// -------------------------------------------------
// 5) placeWordAt : place un mot dans grid[][] et storedWords
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
    answer: wordObj.answer,
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

  if (WORDS.length === 0) return;

  // 6.1) Placer le premier mot (plus long) au centre en “across”
  {
    const first = WORDS[0].answer;
    const r0 = Math.floor(GRID_SIZE / 2);
    const c0 = Math.floor((GRID_SIZE - first.length) / 2);
    placeWordAt(WORDS[0], r0, c0, "across");
  }

  // 6.2) Pour chaque mot suivant, exiger un croisement >= 1
  for (let wi = 1; wi < WORDS.length; wi++) {
    const wordObj = WORDS[wi];
    const word = wordObj.answer;
    let placed = false;

    // 6.2.a) Tenter toutes les intersections “naturelles”
    for (let letterIdx = 0; letterIdx < word.length && !placed; letterIdx++) {
      const ch = word[letterIdx];
      for (let pw of placedWords) {
        for (let cellIdx = 0; cellIdx < pw.cells.length && !placed; cellIdx++) {
          const { row: rr, col: cc } = pw.cells[cellIdx];
          if (grid[rr][cc] === ch) {
            // Si pw.dir == "across", on tente "down", sinon "across"
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

    // 6.2.b) Si pas encore placé, balayer tout “across” (en exigeant >=1 croisement)
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

    // 6.2.c) Si toujours pas placé, balayer tout “down” (en exigeant >=1 croisement)
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
    // Si aucun emplacement ne donne >=1 croisement, on “oublie” ce mot
  }
}

// -------------------------------------------------
// 7) numberClues : numérote et crée les listes dynamiques
// -------------------------------------------------
function numberClues() {
  // numGrid va contenir le numéro à afficher dans chaque case de départ
  const numGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
  let counter = 1;

  // On parcourt la grille ligne par ligne, colonne par colonne
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === null) continue;

      // Détecter si cette case est le début d’un mot “across”
      const isAcrossStart =
        (c === 0 || grid[r][c - 1] === null) &&        // rien à gauche
        (c + 1 < GRID_SIZE && grid[r][c + 1] !== null); // lettre à droite

      // Détecter si cette case est le début d’un mot “down”
      const isDownStart =
        (r === 0 || grid[r - 1][c] === null) &&        // rien au-dessus
        (r + 1 < GRID_SIZE && grid[r + 1][c] !== null); // lettre en-dessous

      if (isAcrossStart || isDownStart) {
        // On attribue un numéro si cette case n’en a pas déjà
        if (numGrid[r][c] === null) {
          numGrid[r][c] = counter++;
        }
        // On enregistre ce numéro dans le placedWord correspondant
        // (il peut y avoir un mot across ET un mot down qui commencent ici)
        placedWords.forEach(pw => {
          if (pw.row === r && pw.col === c) {
            pw.clueNumber = numGrid[r][c];
          }
        });
      }
    }
  }

  // Construire deux listes dynamiques “acrossClues” et “downClues”
  const acrossClues = [];
  const downClues = [];

  placedWords.forEach(pw => {
    if (pw.clueNumber === null) return;
    const entry = {
      number: pw.clueNumber,
      clue: pw.clue,
      length: pw.answer.length
    };
    if (pw.dir === "across") {
      acrossClues.push(entry);
    } else {
      downClues.push(entry);
    }
  });

  // Trier par numéro croissant
  acrossClues.sort((a, b) => a.number - b.number);
  downClues.sort((a, b) => a.number - b.number);

  return { acrossClues, downClues, numGrid };
}

// -------------------------------------------------
// 8) renderGrid : construit la table HTML
// -------------------------------------------------
function renderGrid(numGrid) {
  const table = document.getElementById("crossword-grid");
  // Vider l’ancienne table
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

        // Si on a un numéro à afficher ici, on l’ajoute
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
// 9) renderClues : affiche les définitions “Across” / “Down”
// -------------------------------------------------
function renderClues(acrossClues, downClues) {
  const olA = document.getElementById("across-clues");
  const olD = document.getElementById("down-clues");
  // Vider les anciennes listes
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

    // Retirer l’éventuelle classe “indice”
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
  // Copie du WORD_POOL pour le mélanger
  const temp = [...WORD_POOL];
  for (let i = temp.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [temp[i], temp[j]] = [temp[j], temp[i]];
  }
  return temp.slice(0, n);
}

// -------------------------------------------------
// 13) generateCrossword : génère la grille selon le nombre choisi
// -------------------------------------------------
function generateCrossword() {
  const countInput = document.getElementById("word-count");
  let n = parseInt(countInput.value);

  // Validation de n
  if (isNaN(n) || n < 5) {
    alert("Veuillez entrer un nombre de mots compris entre 5 et " + WORD_POOL.length);
    n = 5;
    countInput.value = 5;
  }
  if (n > WORD_POOL.length) {
    alert("Nombre maximal de mots autorisé : " + WORD_POOL.length);
    n = WORD_POOL.length;
    countInput.value = n;
  }

  console.log(`Génération d’un mot-croisé avec ${n} mots…`);

  // 1) Tirer n mots aléatoires
  WORDS = pickRandomWords(n)
    .map((obj, idx) => ({ ...obj, originalIndex: idx }))
    .sort((a, b) => b.answer.length - a.answer.length);

  // 2) Construire la grille (placement des mots)
  placeAllWords();

  // 3) Numérotation des définitions
  const { acrossClues, downClues, numGrid } = numberClues();

  // 4) Affichage
  renderGrid(numGrid);
  renderClues(acrossClues, downClues);

  // 5) Réinitialiser les cases (vider toutes les saisies)
  resetGrid();

  console.log("Mot-croisé généré !");
}

// -------------------------------------------------
// 14) Initialisation au chargement de la page
// -------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  // 1) Fixer la valeur maximale de #word-count au nombre de mots du dictionnaire
  const countInput = document.getElementById("word-count");
  countInput.setAttribute("max", WORD_POOL.length.toString());

  // 2) Liaison du bouton “Générer le mot-croisé”
  document.getElementById("generate-button").addEventListener("click", generateCrossword);

  // 3) Permettre “Entrée” dans l’input #word-count pour lancer la génération
  countInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      generateCrossword();
    }
  });

  // 4) Liaison des boutons “Vérifier”, “Indice” et “Réinitialiser”
  document.getElementById("check-button").addEventListener("click", checkAnswers);
  document.getElementById("hint-button").addEventListener("click", giveHint);
  document.getElementById("reset-button").addEventListener("click", resetGrid);

  // 5) Générer un mot-croisé initial par défaut (ici 10 mots)
  countInput.value = 10;
  generateCrossword();
});
