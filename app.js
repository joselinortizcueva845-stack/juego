const URL_MODELO = "./modelo/";

let model, webcam, maxPredictions;
let jugadaActual = "Nada";
let puntosJugador = 0;
let puntosIA = 0;

// Referencias al DOM
const btnJugar = document.getElementById("btn-jugar");
const textoEstado = document.getElementById("estado");
const deteccionActual = document.getElementById("deteccion-actual");
const iaEleccion = document.getElementById("ia-eleccion");
const iaTexto = document.getElementById("ia-texto");
const spanPuntosJugador = document.getElementById("puntos-jugador");
const spanPuntosIA = document.getElementById("puntos-ia");

// Inicializar modelo y cámara
async function init() {
  const modelURL = URL_MODELO + "model.json";
  const metadataURL = URL_MODELO + "metadata.json";

  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();

  // Configurar webcam (ancho, alto, efecto espejo)
  webcam = new tmImage.Webcam(250, 250, true);
  await webcam.setup();
  await webcam.play();
  window.requestAnimationFrame(loop);

  document.getElementById("webcam-container").appendChild(webcam.canvas);
  
  btnJugar.disabled = false;
  btnJugar.innerText = "¡Jugar Ronda!";
}

// Bucle continuo para actualizar video y predicciones
async function loop() {
  webcam.update();
  await predecir();
  window.requestAnimationFrame(loop);
}

// Clasificar lo que ve la cámara
async function predecir() {
  const prediction = await model.predict(webcam.canvas);
  let mejorProbabilidad = 0;
  let claseDetectada = "Nada";

  for (let i = 0; i < maxPredictions; i++) {
    if (prediction[i].probability > mejorProbabilidad) {
      mejorProbabilidad = prediction[i].probability;
      claseDetectada = prediction[i].className;
    }
  }

  // Filtrar detecciones con más del 75% de seguridad
  if (mejorProbabilidad > 0.75) {
    jugadaActual = claseDetectada;
    deteccionActual.innerText = `${claseDetectada} (${Math.round(mejorProbabilidad * 100)}%)`;
  }
}

// Iniciar cuenta regresiva de la ronda
function iniciarRonda() {
  btnJugar.disabled = true;
  iaEleccion.innerText = "⏳";
  iaTexto.innerText = "Pensando...";

  let contador = 3;
  textoEstado.innerText = `Prepárate... ${contador}`;

  const intervalo = setInterval(() => {
    contador--;
    if (contador > 0) {
      textoEstado.innerText = `Prepárate... ${contador}`;
    } else {
      clearInterval(intervalo);
      evaluarRonda();
      btnJugar.disabled = false;
    }
  }, 1000);
}

// Comparar jugada del usuario vs IA
function evaluarRonda() {
  const jugador = jugadaActual;
  const opciones = ["Piedra", "Papel", "Tijera"];
  const emojis = {
    Piedra: "✊",
    Papel: "✋",
    Tijera: "✌️"
  };

  const ia = opciones[Math.floor(Math.random() * opciones.length)];
  iaEleccion.innerText = emojis[ia];
  iaTexto.innerText = ia;

  if (jugador === "Nada" || !opciones.includes(jugador)) {
    textoEstado.innerText = "⚠️ No detecté tu mano a tiempo. ¡Intenta de nuevo!";
    return;
  }

  if (jugador === ia) {
    textoEstado.innerText = `🤝 ¡Empate! Ambos sacaron ${jugador}`;
  } else if (
    (jugador === "Piedra" && ia === "Tijera") ||
    (jugador === "Papel" && ia === "Piedra") ||
    (jugador === "Tijera" && ia === "Papel")
  ) {
    puntosJugador++;
    spanPuntosJugador.innerText = puntosJugador;
    textoEstado.innerText = `🎉 ¡Ganaste! ${jugador} vence a ${ia}`;
  } else {
    puntosIA++;
    spanPuntosIA.innerText = puntosIA;
    textoEstado.innerText = `💻 Ganó la IA: ${ia} vence a ${jugador}`;
  }
}

// Eventos
btnJugar.addEventListener("click", iniciarRonda);

// Arrancar aplicación
init();