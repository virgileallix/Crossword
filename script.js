/**
 * script.js
 *
 * - Place les 20 mots dans une grille 20×20, en essayant de croiser systématiquement chaque nouveau mot
 *   avec ceux déjà placés.
 * - Affiche la grille sous forme de <table> contenant soit <td class="black"> (cases noires),
 *   soit <td> avec un <input maxlength="1"> dans lequel l'utilisateur entre sa lettre.
 * - Numérote chaque case de départ d'un mot “Across” ou “Down” et remplit les définitions en conséquence.
 * - Propose un bouton “Vérifier” et un bouton “Afficher toutes les réponses”.
 */

// === 1) Définitions des mots et des indices ======================================
const WORDS = [
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
// On normalise en majuscules, sans espaces
WORDS.forEach(obj => (obj.answer = obj.answer.toUpperCase()));


// === 2) Paramètres de la grille =================================================
const GRID_SIZE = 20;       // grille 20×20
let grid = [];              // matrice GRID_SIZE×GRID_SIZE, initialement tout à null


/** 
 * Structure pour suivre où sont placés les mots :
 *  - startRow, startCol : coordonnées du premier caractère (0-based)
 *  - direction : "across" ou "down"
 *  - answer : le mot complet (ex. "ALGORITHM")
 *  - clueIndex : l'indice attribué à ce mot (numérotation croisée)
 *  - cells : tableau de {r, c} pour chaque lettre
 */
let placedWords = [];      


// === 3) Initialisation de la grille =============================================
function initGrid() {
  grid = new Array(GRID_SIZE);
  for (let r = 0; r < GRID_SIZE; r++) {
    grid[r] = new Array(GRID_SIZE).fill(null);
  }
}

/**
 * Tente de placer TOUS les mots de WORDS[] dans la grille.
 * On place d'abord le premier horizontalement au centre, 
 * puis chaque mot suivant essaie de croiser ses lettres avec ceux déjà placés.
 */
function placeAllWords() {
  placedWords = [];
  initGrid();

  // 1) Placer le premier mot (WORDS[0]) exactement au centre en mode "across"
  let first = WORDS[0].answer;
  let r0 = Math.floor(GRID_SIZE / 2);
  let c0 = Math.floor((GRID_SIZE - first.length) / 2);
  placeWordAt(first, r0, c0, "across", 0);

  // 2) Pour chaque mot suivant, on essaie à tout prix de croiser
  for (let i = 1; i < WORDS.length; i++) {
    let word = WORDS[i].answer;
    let placed = false;

    // Pour chaque lettre du mot “word”…
    for (let letterIndex = 0; letterIndex < word.length && !placed; letterIndex++) {
      let ch = word[letterIndex];

      // Pour chaque mot déjà placé…
      for (let pw of placedWords) {
        // pour chaque case qu’occupe pw…
        for (let cellIdx = 0; cellIdx < pw.cells.length && !placed; cellIdx++) {
          let { r, c } = pw.cells[cellIdx];
          if (grid[r][c] === ch) {
            // On a trouvé un point de croisement potentiel
            // Si pw est horizontal, ce mot doit être vertical, et vice-versa
            let dir = pw.direction === "across" ? "down" : "across";
            // On calcule la cellule de départ pour “word” :
            // - Si on croise la lettre letterIndex avec pw.cells[cellIdx],
            //   alors la case de “word” numéro letterIndex se trouve en (r,c).
            let startR = r - letterIndex * (dir === "down" ? 1 : 0);
            let startC = c - letterIndex * (dir === "across" ? 1 : 0);

            if (canPlace(word, startR, startC, dir)) {
              placeWordAt(word, startR, startC, dir, i);
              placed = true;
            }
          }
        }
      }
    }

    // 3) Si pas trouvé de croisement possible, on place “word” horizontalement
    //    sur la première ligne où ça passe en entier (ligne vide de préférence)
    if (!placed) {
      for (let rr = 0; rr < GRID_SIZE && !placed; rr++) {
        for (let cc = 0; cc <= GRID_SIZE - word.length && !placed; cc++) {
          if (canPlace(word, rr, cc, "across")) {
            placeWordAt(word, rr, cc, "across", i);
            placed = true;
          }
        }
      }
    }
    // Si toujours pas placed, on essaye vertical…
    if (!placed) {
      for (let rr = 0; rr <= GRID_SIZE - word.length && !placed; rr++) {
        for (let cc = 0; cc < GRID_SIZE && !placed; cc++) {
          if (canPlace(word, rr, cc, "down")) {
            placeWordAt(word, rr, cc, "down", i);
            placed = true;
          }
        }
      }
    }
    // Si encore pas placé, on l'ignore (mais avec 20×20, ça ne devrait pas arriver)
  }
}

/**
 * Vérifie si l'on peut placer “word” (string) de longueur L
 * à la position (rStart,cStart), dans la direction “dir” ("across"|"down").
 *  - On ne peut pas dépasser de la grille.
 *  - Chaque case doit être soit vide (null) soit contenir le même caractère.
 *  - Immédiatement avant et après le mot (dans la direction de pose),
 *    on doit trouver un bord de grille ou une case vide (pour pas fusionner 2 mots).
 *  - Autour de chaque lettre (orthogonalement à la direction), il ne doit pas y avoir
 *    de lettres non nulles (sauf si c’est un croisement volontaire).
 */
function canPlace(word, rStart, cStart, dir) {
  let L = word.length;

  // 1) Vérifier les bornes
  if (dir === "across") {
    if (cStart < 0 || cStart + L > GRID_SIZE || rStart < 0 || rStart >= GRID_SIZE) return false;
  } else {
    if (rStart < 0 || rStart + L > GRID_SIZE || cStart < 0 || cStart >= GRID_SIZE) return false;
  }

  // 2) Case juste avant et après (dans la direction) doivent être vides ou bord
  if (dir === "across") {
    // case gauche
    if (cStart - 1 >= 0 && grid[rStart][cStart - 1] !== null) return false;
    // case droite de fin
    if (cStart + L < GRID_SIZE && grid[rStart][cStart + L] !== null) return false;
  } else {
    if (rStart - 1 >= 0 && grid[rStart - 1][cStart] !== null) return false;
    if (rStart + L < GRID_SIZE && grid[rStart + L][cStart] !== null) return false;
  }

  // 3) Pour chaque lettre du mot…
  for (let i = 0; i < L; i++) {
    let r = rStart + (dir === "down" ? i : 0);
    let c = cStart + (dir === "across" ? i : 0);
    let ch = word[i];

    // 3a) la case doit être vide ou contenir la même lettre
    if (grid[r][c] !== null && grid[r][c] !== ch) return false;

    // 3b) autour de la case (orthogonal), s’il y a déjà une lettre, 
    //     c’est un croisement non voulu à cet indice i
    if (dir === "across") {
      // Vérifier au-dessus et en-dessous de cette case
      if (r > 0 && grid[r - 1][c] !== null) {
        // si c’est un véritable croisement, on ne doit avoir que la même lettre
        if (grid[r][c] !== ch) return false;
      }
      if (r + 1 < GRID_SIZE && grid[r + 1][c] !== null) {
        if (grid[r][c] !== ch) return false;
      }
    } else { // down
      if (c > 0 && grid[r][c - 1] !== null) {
        if (grid[r][c] !== ch) return false;
      }
      if (c + 1 < GRID_SIZE && grid[r][c + 1] !== null) {
        if (grid[r][c] !== ch) return false;
      }
    }
  }

  return true;
}

/**
 * Place “word” dans la grille à (rStart,cStart) selon direction “dir”.
 * On met à jour la matrice grid[][] et on ajoute à placedWords[].
 * idx est l’indice dans WORDS[], pour récupérer la définition plus tard.
 */
function placeWordAt(word, rStart, cStart, dir, idx) {
  let cells = [];
  for (let i = 0; i < word.length; i++) {
    let r = rStart + (dir === "down" ? i : 0);
    let c = cStart + (dir === "across" ? i : 0);
    grid[r][c] = word[i];
    cells.push({ r, c });
  }
  placedWords.push({
    answer: word,
    clue: WORDS[idx].clue,
    startRow: rStart,
    startCol: cStart,
    direction: dir,
    cells: cells,
    clueIndex: null // on numérotera après
  });
}


// === 4) Numérotation des mots (“Across” vs “Down”) =================================
/**
 * Parcourt placedWords[], détecte ceux qui démarrent un mot Across ou Down,
 * leur attribue un numéro (1,2,3…) puis remplit deux tableaux séparés pour l’affichage.
 */
function numberClues() {
  let counter = 1;
  // On parcourt case par case pour garder l’ordre croissant (haut-gauche → bas-droite).
  // On construit un tableau de dimensions GRID_SIZE×GRID_SIZE égal à null,
  // sauf sur les premières cases d’un Across/Down où on mettra le numéro.
  let numGrid = Array.from({ length: GRID_SIZE }, () => new Array(GRID_SIZE).fill(null));

  placedWords.forEach(pw => {
    let { startRow: r, startCol: c, direction: dir, answer } = pw;

    // Est-ce début d’un “Across” ? (c’est Across si la case de gauche est null ou hors-grille, 
    //    et si la case à droite existe et contient une lettre)
    let isAcrossStart =
      dir === "across" &&
      (c - 1 < 0 || grid[r][c - 1] === null) &&
      (c + 1 < GRID_SIZE && grid[r][c + 1] !== null);

    // Est-ce début d’un “Down” ? (r-1 hors-grille ou null, et r+1 contient une lettre)
    let isDownStart =
      dir === "down" &&
      (r - 1 < 0 || grid[r - 1][c] === null) &&
      (r + 1 < GRID_SIZE && grid[r + 1][c] !== null);

    if (isAcrossStart || isDownStart) {
      // On attribue un numéro si cette case n'a pas encore de numéro
      if (numGrid[r][c] === null) {
        numGrid[r][c] = counter;
        pw.clueIndex = counter;
        counter++;
      } else {
        pw.clueIndex = numGrid[r][c];
      }
    }
  });

  // Maintenant on construit deux tableaux “acrossClues” et “downClues” triés par numéro
  let acrossClues = [];
  let downClues = [];
  placedWords.forEach(pw => {
    if (pw.clueIndex === null) return;
    if (pw.direction === "across") {
      acrossClues.push({ number: pw.clueIndex, clue: pw.clue, answer: pw.answer });
    } else {
      downClues.push({ number: pw.clueIndex, clue: pw.clue, answer: pw.answer });
    }
  });

  acrossClues.sort((a, b) => a.number - b.number);
  downClues.sort((a, b) => a.number - b.number);

  return { acrossClues, downClues, numGrid };
}


// === 5) Rendu de la grille HTML ====================================================
/**
 * Crée l’élément <table> dans #crossword-grid :
 * - pour chaque case, si grid[r][c]===null → <td class="black"> 
 *   autrement → <td> avec :
 *     - un <div class="cell-number">num</div> si numGrid[r][c] non-null
 *     - un <input maxlength="1" data-r="r" data-c="c" />
 */
function renderGrid(numGrid) {
  const table = document.getElementById("crossword-grid");
  table.innerHTML = "";

  for (let r = 0; r < GRID_SIZE; r++) {
    let tr = document.createElement("tr");
    for (let c = 0; c < GRID_SIZE; c++) {
      let td = document.createElement("td");
      if (grid[r][c] === null) {
        td.classList.add("black");
      } else {
        // On met un input pour l’utilisateur
        let input = document.createElement("input");
        input.setAttribute("maxlength", "1");
        input.setAttribute("data-r", r);
        input.setAttribute("data-c", c);
        input.style.textTransform = "uppercase";
        td.appendChild(input);
        // Si numGrid[r][c] existe, on ajoute la petite étiquette
        if (numGrid[r][c] !== null) {
          let span = document.createElement("div");
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


// === 6) Affichage des définitions =================================================
/**
 * Remplit <ol id="across-clues"> et <ol id="down-clues"> avec :
 *   <li>« 1. Step-by-step procedure to solve a problem. » etc.
 */
function renderClues(acrossClues, downClues) {
  let olAcross = document.getElementById("across-clues");
  let olDown   = document.getElementById("down-clues");
  olAcross.innerHTML = "";
  olDown.innerHTML = "";

  acrossClues.forEach(item => {
    let li = document.createElement("li");
    li.textContent = `${item.number}. ${item.clue}`;
    olAcross.appendChild(li);
  });
  downClues.forEach(item => {
    let li = document.createElement("li");
    li.textContent = `${item.number}. ${item.clue}`;
    olDown.appendChild(li);
  });
}


// === 7) Vérification / Reveal ======================================================
/**
 * “Vérifier” : on parcourt tous les <input> et on compare la lettre saisie
 *   à la lettre solution grid[r][c]. Colorie en vert si OK, en rouge sinon.
 */
function checkAnswers() {
  let allInputs = document.querySelectorAll("#crossword-grid input");
  allInputs.forEach(input => {
    let r = parseInt(input.getAttribute("data-r"));
    let c = parseInt(input.getAttribute("data-c"));
    let sol = grid[r][c];
    let val = input.value.toUpperCase();
    if (val === sol) {
      input.style.backgroundColor = "#c8e6c9"; // vert clair
    } else {
      input.style.backgroundColor = "#ffcdd2"; // rouge clair
    }
  });
}

/**
 * “Afficher toutes les réponses” : on remplit chaque <input> par grid[r][c]
 * et on désactive l'input pour éviter la modification.
 */
function revealAll() {
  let allInputs = document.querySelectorAll("#crossword-grid input");
  allInputs.forEach(input => {
    let r = parseInt(input.getAttribute("data-r"));
    let c = parseInt(input.getAttribute("data-c"));
    input.value = grid[r][c];
    input.disabled = true;
    input.style.backgroundColor = "#e0e0e0";
    input.style.color = "#333";
  });
}


// === 8) Mise en place au chargement de la page ===================================
window.addEventListener("DOMContentLoaded", () => {
  placeAllWords();
  let { acrossClues, downClues, numGrid } = numberClues();
  renderGrid(numGrid);
  renderClues(acrossClues, downClues);

  document.getElementById("check-button").addEventListener("click", checkAnswers);
  document.getElementById("reveal-button").addEventListener("click", revealAll);
});
