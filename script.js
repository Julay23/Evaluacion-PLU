/* =========================
   VARIABLES GLOBALES
========================= */
let products = [];
let index = 0;
let correct = 0;
let answers = [];
//let time = 120;
let timerInterval = null;

const TOTAL_TIME = 5*60; // segundos
let time = TOTAL_TIME;


let userName = "";
let userBadge = "";

let testActive = false;



/* =========================
   ELEMENTOS
========================= */
const nameInput = document.getElementById("userName");
const badgeInput = document.getElementById("userBadge");
const startBtn = document.getElementById("startBtn");
const codeInput = document.getElementById("codeInput");

/* =========================
   VALIDACIÓN INICIO
========================= */
function validateInputs() {
  let valid = true;

  if (nameInput.value.trim().length < 3) {
    nameInput.classList.add("invalid");
    nameInput.classList.remove("valid");
    valid = false;
  } else {
    nameInput.classList.add("valid");
    nameInput.classList.remove("invalid");
  }

  if (badgeInput.value.trim().length < 3) {
    badgeInput.classList.add("invalid");
    badgeInput.classList.remove("valid");
    valid = false;
  } else {
    badgeInput.classList.add("valid");
    badgeInput.classList.remove("valid");
  }

  startBtn.disabled = !valid;
}

nameInput.addEventListener("input", validateInputs);
badgeInput.addEventListener("input", validateInputs);

/* =========================
   INICIAR TEST
========================= */
function startTest() {
  userName = nameInput.value.trim();
  userBadge = badgeInput.value.trim();

  testActive = true;
  lockBackButton();


  if (!userName || !userBadge) return;

  document.getElementById("startScreen").style.display = "none";
  document.getElementById("loader").style.display = "block";

  loadProducts();
}

/* =========================
   CARGAR PRODUCTOS
========================= */
function loadProducts() {
  fetch("https://script.google.com/macros/s/AKfycbxuodVSt8c-bjxvE5n6cgdZNQCeCCnmUXO5MV75EnzrkCbTaNP0M3RrBvDJ_rcEWMnl/exec")
    .then(res => res.json())
    .then(data => {
      products = data;
      shuffle(products);

      document.getElementById("loader").style.display = "none";
      document.querySelector(".container").style.display = "block";

      index = 0;
      correct = 0;
      answers = [];

      loadQuestion();
      startTimer();
    })
    .catch(() => {
      alert("Error cargando productos");
    });
}

/* =========================
   MEZCLAR
========================= */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/* =========================
   MOSTRAR PREGUNTA
========================= */
function loadQuestion() {
  const p = products[index];

  document.getElementById("productImage").src = p.image;
  document.getElementById("productName").textContent = p.name;

  codeInput.value = "";
  codeInput.focus();

  updateProgress();
}

/* =========================
   RESPUESTA
========================= */
function submitAnswer() {
  const input = codeInput.value.trim();
  const isCorrect = input === products[index].code;

  if (isCorrect) correct++;

  answers.push({
    producto: products[index].name,
    ingresado: input,
    correcto: products[index].code,
    acierto: isCorrect
  });

  index++;

  if (index < products.length) {
    loadQuestion();
  } else {
    finishTest();
  }
}

/* =========================
   PROGRESO
========================= */
function updateProgress() {
  const current = index + 1;
  const total = products.length;
  const percent = (current / total) * 100;

  document.getElementById("progressText").textContent =
    `Pregunta ${current} de ${total}`;

  document.getElementById("progressFill").style.width = percent + "%";
}

/* =========================
   TEMPORIZADOR
========================= */
function startTimer() {
  timerInterval = setInterval(() => {
    time--;

    document.getElementById("timer").textContent =
      `Tiempo: ${Math.floor(time / 60)}:${String(time % 60).padStart(2, "0")}`;

    if (time <= 0) finishTest();
  }, 1000);
}

window.addEventListener("beforeunload", (e) => {
  if (testActive) {
    e.preventDefault();
    e.returnValue = "";
  }
});
function lockBackButton() {
  history.pushState(null, "", location.href);
}

window.addEventListener("popstate", () => {
  if (testActive) {
    lockBackButton();
  }
});



/* =========================
   FINAL
========================= */
function finishTest() {
  testActive = false;
  clearInterval(timerInterval);
  const timeUsed = TOTAL_TIME - time;

  saveResults();

  const errores = answers.filter(a => !a.acierto);

  document.querySelector(".container").innerHTML = `
    <h2>Evaluación Finalizada</h2>

    <p><strong>Asociado:</strong> ${userName}</p>
    <p><strong>Gafete:</strong> ${userBadge}</p>

    <p>Total: ${products.length}</p>
    <p>Correctas: ${correct}</p>
    <p>Incorrectas: ${products.length - correct}</p>

    <h3>Nota: ${Math.round((correct / products.length) * 100)}%</h3>

    <h4>Errores (${errores.length})</h4>
<ul class="results">

  ${errores.map(e => `
    <li style="
      margin-bottom:12px;
      line-height:1.4;
      word-break: break-word;
      overflow-wrap: break-word;
    ">
      <strong>${e.producto}</strong><br>
      Ingresado: <span style="color:#c62828;font-weight:600;">
        ${e.ingresado || "vacío"}
      </span><br>
      Correcto: <span style="color:#2e7d32;font-weight:600;">
        ${e.correcto}
      </span>
    </li>
  `).join("")}

</ul>


    <button onclick="location.reload()">Volver al inicio</button>
  `;
}


/* =========================
   INPUT SOLO NÚMEROS
========================= */
codeInput.addEventListener("input", () => {
  codeInput.value = codeInput.value.replace(/\D/g, "");
});

codeInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    submitAnswer();
  }

  if (
    !/[0-9]/.test(e.key) &&
    !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)
  ) {
    e.preventDefault();
  }
});

/* =========================
   ENTER PARA INICIAR
========================= */
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !startBtn.disabled && startBtn.offsetParent !== null) {
    startTest();
  }
});

window.addEventListener("load", () => {
  nameInput.value = "";
  badgeInput.value = "";
  startBtn.disabled = true;

  nameInput.classList.remove("valid", "invalid");
  badgeInput.classList.remove("valid", "invalid");
});

/*=============================================
    FUNCION PARA CONVERTIR EL TIEMPO A MINUTOS
===============================================*/
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}


// Guardar resultados en linea
function saveResults() {

  const timeUsed = TOTAL_TIME - time;
  const timeFormatted = formatTime(timeUsed);

  fetch("https://script.google.com/macros/s/AKfycbxuodVSt8c-bjxvE5n6cgdZNQCeCCnmUXO5MV75EnzrkCbTaNP0M3RrBvDJ_rcEWMnl/exec", {
    method: "POST",
    mode: "no-cors", // 🔥 CLAVE
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      nombre: userName,
      gafete: userBadge,
      total: products.length,
      correctas: correct,
      incorrectas: products.length - correct,
      nota: Math.round((correct / products.length) * 100),
      tiempo: timeFormatted
    })
  });
}



