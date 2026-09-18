let preguntas = [], indiceActual = 0, tiperTimeout = null;
const txtTitulo = document.getElementById('titulo-cuestionario'), txtPregunta = document.getElementById('texto-pregunta'), txtBasico = document.getElementById('nivel-basico'), txtIntermedio = document.getElementById('nivel-intermedio'), txtAvanzado = document.getElementById('nivel-avanzado'), txtProgreso = document.getElementById('progreso'), btnAnterior = document.getElementById('btn-anterior'), btnSiguiente = document.getElementById('btn-siguiente'), bloqueCuestionario = document.getElementById('bloque-cuestionario'), pantallaFinal = document.getElementById('pantalla-final'), btnReiniciar = document.getElementById('btn-reiniciar'), inputBusqueda = document.getElementById('input-busqueda'), resultadosBusqueda = document.getElementById('resultados-busqueda'), btnMicrofono = document.getElementById('btn-microfono'), zonaEvaluacion = document.getElementById('zona-evaluacion'), enunciadoTest = document.getElementById('enunciado-test'), opcionesContenedor = document.getElementById('opciones-contenedor'), feedbackTest = document.getElementById('feedback-test');

fetch('preguntas.json')
    .then(res => { if (!res.ok) throw new Error(); return res.json(); })
    .then(data => {
        const contenido = data.Hoja1;
        txtTitulo.textContent = contenido["TÍTULO"] || "Cuestionario";
        preguntas = contenido.slice(1).filter(item => item.PREGUNTAS);
        const guardado = localStorage.getItem('progreso_cuestionario');
        if (guardado !== null && guardado < preguntas.length) indiceActual = parseInt(guardado, 10);
        mostrarPregunta(indiceActual); configurarBuscador(); configurarReconocimientoVoz(); recuperarTemaAlCargar();
    }).catch(() => { txtTitulo.textContent = "Error al conectar preguntas.json"; });

function efectoTipeado(elemento, textoCompleto) {
    clearTimeout(tiperTimeout); elemento.textContent = ""; let i = 0;
    function escribir() { if (i < textoCompleto.length) { elemento.textContent += textoCompleto.charAt(i); i++; tiperTimeout = setTimeout(escribir, 15); } } escribir();
}

function mostrarPregunta(indice) {
    if (preguntas.length === 0) return;
    bloqueCuestionario.style.display = 'block'; pantallaFinal.style.display = 'none';
    const p = preguntas[indice];
    efectoTipeado(txtPregunta, `${p["Nº"]}. ${p["PREGUNTAS"]}`);
    txtBasico.textContent = p["NIVEL BÁSICO"]; txtIntermedio.textContent = p["NIVEL INTERMEDIO"]; txtAvanzado.textContent = p["NIVEL AVANZADO"];
    document.getElementById('wrap-intermedio').style.display = 'none'; document.getElementById('wrap-avanzado').style.display = 'none';
    document.getElementById('flecha-intermedio').textContent = '▼'; document.getElementById('flecha-avanzado').textContent = '▼';
    txtProgreso.textContent = `Pregunta ${indice + 1} de ${preguntas.length}`;
    btnAnterior.disabled = (indice === 0); btnSiguiente.textContent = (indice === preguntas.length - 1) ? "Finalizar" : "Siguiente";
    localStorage.setItem('progreso_cuestionario', indice); generarPreguntaComprension(p);
}

function toggleNivel(idWrapper) {
    const wrap = document.getElementById(idWrapper);
    const flecha = document.getElementById(idWrapper === 'wrap-intermedio' ? 'flecha-intermedio' : 'flecha-avanzado');
    if (wrap.style.display === 'block') { wrap.style.display = 'none'; flecha.textContent = '▼'; }
    else { wrap.style.display = 'block'; flecha.textContent = '▲'; }
}

function generarPreguntaComprension(datosPregunta) {
    feedbackTest.style.display = 'none'; opcionesContenedor.innerHTML = ''; zonaEvaluacion.style.display = 'block';
    enunciadoTest.textContent = `Respecto a la pregunta actual, ¿cuál de los niveles profundiza bajo el prisma del neoconstitucionalismo axiológico?`;
    const opciones = [{ texto: "El Nivel Básico (Es explicativo coloquial)", correcta: false }, { texto: "El Nivel Intermedio (Detalla la parte dogmática y orgánica)", correcta: false }, { texto: "El Nivel Avanzado (Aborda el neoconstitucionalismo formal)", correcta: true }];
    opciones.sort(() => Math.random() - 0.5);
    opciones.forEach(opc => {
        const b = document.createElement('button'); b.className = 'opcion-btn'; b.textContent = opc.texto;
        b.addEventListener('click', () => { feedbackTest.style.display = 'block'; if (opc.correcta) { feedbackTest.textContent = "¡Excelente! Comprensión correcta. 🌟"; feedbackTest.style.color = "#2ecc71"; } else { feedbackTest.textContent = "Sugerencia: repasa la lectura avanzada. ❌"; feedbackTest.style.color = "#e74c3c"; } });
        opcionesContenedor.appendChild(b);
    });
}

function configurarReconocimientoVoz() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SpeechRecognition) { btnMicrofono.style.display = 'none'; return; }
    const recognition = new SpeechRecognition(); recognition.lang = 'es-ES';
    btnMicrofono.addEventListener('click', () => { recognition.start(); });
    recognition.onstart = () => { btnMicrofono.classList.add('escuchando'); inputBusqueda.placeholder = "Escuchando..."; };
    recognition.onend = () => { btnMicrofono.classList.remove('escuchando'); inputBusqueda.placeholder = "🔍 Buscar palabra clave..."; };
    recognition.onresult = (e) => { inputBusqueda.value = e.results.transcript; inputBusqueda.dispatchEvent(new Event('input')); };
}

function configurarBuscador() {
    inputBusqueda.addEventListener('input', (e) => {
        const termino = e.target.value.toLowerCase().trim(); resultadosBusqueda.innerHTML = ''; if (termino === '') return;
        const coincidencias = preguntas.filter(p => p["PREGUNTAS"].toLowerCase().includes(termino) || p["NIVEL BÁSICO"].toLowerCase().includes(termino));
        coincidencias.forEach(p => {
            const item = document.createElement('div'); item.className = 'resultado-item'; item.textContent = `${p["Nº"]}. ${p["PREGUNTAS"]}`;
            item.addEventListener('click', () => { indiceActual = preguntas.findIndex(prog => prog["Nº"] === p["Nº"]); mostrarPregunta(indiceActual); inputBusqueda.value = ''; resultadosBusqueda.innerHTML = ''; });
            resultadosBusqueda.appendChild(item);
        });
    });
    document.addEventListener('click', (e) => { if (e.target !== inputBusqueda && e.target !== btnMicrofono) resultadosBusqueda.innerHTML = ''; });
}

function cambiarTema() {
    const root = document.documentElement, b = document.getElementById('toggle-tema');
    if (root.getAttribute('data-theme') === 'dark') { root.setAttribute('data-theme', 'light'); b.textContent = "🌙 Modo Oscuro"; localStorage.setItem('tema_cuestionario', 'light'); }
    else { root.setAttribute('data-theme', 'dark'); b.textContent = "☀️ Modo Claro"; localStorage.setItem('tema_cuestionario', 'dark'); }
}

function recuperarTemaAlCargar() { if (localStorage.getItem('tema_cuestionario') === 'dark') { document.documentElement.setAttribute('data-theme', 'dark'); document.getElementById('toggle-tema').textContent = "☀️ Modo Claro"; } }

btnSiguiente.addEventListener('click', () => { if (indiceActual < preguntas.length - 1) { indiceActual++; mostrarPregunta(indiceActual); } else { bloqueCuestionario.style.display = 'none'; pantallaFinal.style.display = 'block'; } });
btnAnterior.addEventListener('click', () => { if (indiceActual > 0) { indiceActual--; mostrarPregunta(indiceActual); } });
btnReiniciar.addEventListener('click', () => { indiceActual = 0; localStorage.removeItem('progreso_cuestionario'); mostrarPregunta(indiceActual); });
function copiarTexto(idParrafo) { const texto = document.getElementById(idParrafo).textContent; navigator.clipboard.writeText(texto).then(() => { alert("¡Texto copiado al portapapeles!"); }).catch(err => { console.error(err); }); }
