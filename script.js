/* =========================
   VARIABLES GLOBALES
========================= */
let products = [];
let correct = 0;
let answers = [];
let timerInterval = null;

const TOTAL_TIME = 5 * 60; // segundos
let time = TOTAL_TIME;

let warned1min = false;
let warned30sec = false;

let userName = "";
let userBadge = "";
let testActive = false;
let testFinished = false; // 🔥 FIX evita doble final


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
  const nameValid = nameInput.value.trim().length >= 3;
  const badgeValid = badgeInput.value.trim().length >= 3;

  nameInput.classList.toggle("valid", nameValid);
  nameInput.classList.toggle("invalid", !nameValid);

  badgeInput.classList.toggle("valid", badgeValid);
  badgeInput.classList.toggle("invalid", !badgeValid);

  startBtn.disabled = !(nameValid && badgeValid);
}

nameInput.addEventListener("input", validateInputs);
badgeInput.addEventListener("input", validateInputs);

/* =========================
   INICIAR TEST
========================= */
function startTest() {
  userName = nameInput.value.trim();
  userBadge = badgeInput.value.trim();

  if (!userName || !userBadge) return;

  testActive = true;
  lockBackButton();

  document.getElementById("startScreen").style.display = "none";
  document.getElementById("loader").style.display = "block";

  loadProducts();
}

/* =========================
   CARGAR PRODUCTOS
========================= */
function loadProducts() {
  time = TOTAL_TIME;
  warned1min = false;
  warned30sec = false;

  fetch("https://script.google.com/macros/s/AKfycbxuodVSt8c-bjxvE5n6cgdZNQCeCCnmUXO5MV75EnzrkCbTaNP0M3RrBvDJ_rcEWMnl/exec")
    .then(res => res.json())
    .then(data => {
      products = [...data];
      shuffle(products);

      correct = 0;
      answers = [];

      document.getElementById("loader").style.display = "none";
      document.querySelector(".container").style.display = "block";

      loadQuestion();
      startTimer();
    })
    .catch(() => alert("Error cargando productos"));
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
  if (testFinished) return; // 🔥 FIX

  if (products.length === 0) {
    finishTest();
    return;
  }

  const p = products[0];

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
  if (testFinished) return; // 🔥 FIX
  if (products.length === 0) return;

  const input = codeInput.value.trim();
  const currentProduct = products.shift();

  if (input === "") {
    products.push(currentProduct);
    loadQuestion();
    return;
  }

  const isCorrect = input === currentProduct.code;

  if (isCorrect) correct++;

  answers.push({
    producto: currentProduct.name,
    ingresado: input,
    correcto: currentProduct.code,
    acierto: isCorrect
  });

  loadQuestion();
}


/* =========================
   PROGRESO
========================= */
function updateProgress() {
  const total = answers.length + products.length;
  const current = answers.length + 1;
  const percent = (answers.length / total) * 100;

  document.getElementById("progressText").textContent =
    `Pregunta ${current} de ${total}`;

  document.getElementById("progressFill").style.width = percent + "%";
}

/* =========================
   TEMPORIZADOR
========================= */
function startTimer() {
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    time--;

    const timerEl = document.getElementById("timer");
    timerEl.textContent = `Tiempo: ${formatTime(time)}`;

    if (time === 60 && !warned1min) {
      warned1min = true;
      playBeep(1);
      vibrate([300]);
      timerEl.style.color = "#f57c00";
      alertBanner("⚠️ Queda < 1 minuto");
    }

    if (time === 30 && !warned30sec) {
      warned30sec = true;
      playBeep(2);
      vibrate([200, 100, 200]);
      timerEl.style.color = "#d32f2f";
      alertBanner("🚨 Queda < 30 segundos");
    }
    // 🔔 10 SEGUNDOS (pitido rápido)
     if (time <= 10 && time > 0) {
       playBeep(1, 120);
     }

    if (time <= 0) {
      clearInterval(timerInterval);
      finishTest();
    }
  }, 1000);
}

/* =========================
   CONFIRMAR FINAL ¿ESTAS SEGURO?
========================= */
function confirmarFinal() {
  const fondo = document.createElement("div");
  fondo.style.position = "fixed";
  fondo.style.inset = "0";
  fondo.style.background = "rgba(0,0,0,0.5)";
  fondo.style.display = "flex";
  fondo.style.alignItems = "center";
  fondo.style.justifyContent = "center";
  fondo.style.zIndex = "9999";

  const caja = document.createElement("div");
  caja.style.background = "white";
  caja.style.padding = "20px";
  caja.style.borderRadius = "10px";
  caja.style.textAlign = "center";
  caja.style.minWidth = "260px";

  caja.innerHTML = `
    <p style="font-size:16px; margin-bottom:6px;">
      ¿Estás seguro/a de finalizar?
    </p>
    <p id="tiempoModal" style="font-size:14px; color:#d32f2f;">
      Aún quedan <strong>${formatTime(time)}</strong> ⏳
    </p>
    <div style="margin-top:15px; display:flex; justify-content:center; gap:20px;">
      <button id="btnSi">Sí</button>
      <button id="btnNo">No</button>
    </div>
  `;

  fondo.appendChild(caja);
  document.body.appendChild(fondo);

  // 🔁 Actualiza el tiempo dentro del modal
  const intervaloModal = setInterval(() => {
    const t = document.getElementById("tiempoModal");
    if (!t) return;
    t.innerHTML = `Aún quedan <strong>${formatTime(time)}</strong> ⏳`;
  }, 1000);

  document.getElementById("btnSi").onclick = () => {
    clearInterval(intervaloModal);
    fondo.remove();
    finishTest();
  };

  document.getElementById("btnNo").onclick = () => {
    clearInterval(intervaloModal);
    fondo.remove();
  };
}




/* =========================
   FINAL
========================= */
function finishTest() {
 
  if (testFinished) return; // 🔥 FIX
  testFinished = true;

  testActive = false;
  clearInterval(timerInterval);

  const TOTAL_PREGUNTAS = products.length + answers.length;

  const answeredNames = answers.map(a => a.producto);

  const unanswered = products
    .filter(p => !answeredNames.includes(p.name))
    .map(p => ({
      producto: p.name,
      ingresado: "— sin responder —",
      correcto: p.code,
      acierto: false
    }));

  const finalAnswers = [...answers, ...unanswered];

  const correctFinal = finalAnswers.filter(a => a.acierto).length;
  const incorrectFinal = TOTAL_PREGUNTAS - correctFinal;
  const nota = Math.round((correctFinal / TOTAL_PREGUNTAS) * 100);

  const timeUsed = TOTAL_TIME - time;
const timeFormatted = formatTime(timeUsed);

saveResults(
  TOTAL_PREGUNTAS,
  correctFinal,
  incorrectFinal,
  nota,
  timeFormatted
);


  document.querySelector(".container").innerHTML = `
    <h2>Evaluación Finalizada</h2>
    <p><strong>Asociado:</strong> ${userName}</p>
    <p><strong>Gafete:</strong> ${userBadge}</p>

    <p>Total preguntas: ${TOTAL_PREGUNTAS}</p>
    <p>Correctas: ${correctFinal}</p>
    <p>Incorrectas: ${incorrectFinal}</p>

    <h3>Nota final: ${nota}%</h3>

    <h4>Errores (${incorrectFinal})</h4>
    <ul class="results">
      ${finalAnswers
        .filter(a => !a.acierto)
        .map(e => `
          <li>
            <strong>${e.producto}</strong><br>
            Ingresado: <span style="color:#c62828">${e.ingresado}</span><br>
            Correcto: <span style="color:#2e7d32">${e.correcto}</span>
          </li>
          <p></p>
        `)
        .join("")}
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

codeInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    submitAnswer();
  }
});

/* =========================
   ENTER PARA INICIAR
========================= */
document.addEventListener("keydown", e => {
  if (e.key === "Enter" && !startBtn.disabled && startBtn.offsetParent !== null) {
    startTest();
  }
});

/* =========================
   UTILIDADES
========================= */
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function playBeep(times = 1, duration = 300) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  for (let i = 0; i < times; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.value = 880;
    gain.gain.value = 0.2;

    osc.connect(gain);
    gain.connect(ctx.destination);

    const start = ctx.currentTime + i * 0.4;
    osc.start(start);
    osc.stop(start + duration / 1000);
  }
}

function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

function alertBanner(text) {
  let el = document.getElementById("timeAlert");

  if (!el) {
    el = document.createElement("div");
    el.id = "timeAlert";
    el.style.fontWeight = "bold";
    el.style.textAlign = "center";
    el.style.marginTop = "10px";
    document.getElementById("timer").parentNode.appendChild(el);
  }

  el.textContent = text;
}

/* =========================
   BLOQUEAR SALIDA
========================= */
function lockBackButton() {
  history.pushState(null, "", location.href);
}

window.addEventListener("popstate", () => {
  if (testActive) lockBackButton();
});

window.addEventListener("beforeunload", e => {
  if (testActive) {
    e.preventDefault();
    e.returnValue = "";
  }
});

// Guardar resultados en linea 
function saveResults(total, correctas, incorrectas, nota, tiempo) {
  fetch("https://script.google.com/macros/s/AKfycbxuodVSt8c-bjxvE5n6cgdZNQCeCCnmUXO5MV75EnzrkCbTaNP0M3RrBvDJ_rcEWMnl/exec", {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nombre: userName,
      gafete: userBadge,
      total,
      correctas,
      incorrectas,
      nota,
      tiempo
    })
  });
}

