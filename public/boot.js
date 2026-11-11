// Se ejecuta antes de pintar la página para preparar la intro
document.documentElement.classList.add('js');
// La intro sale en cada visita (dura unos 2 s y el scroll, un toque, una tecla o «Saltar intro» la cortan), salvo
// con «reducir movimiento» o con las animaciones en pausa. Se decide aquí, antes del primer pintado, para que el
// nombre no parpadee. main.js aún apunta «intro-vista» en localStorage, pero ya no se usa para quitarla
var pausa = false;
// Con «Pausar animaciones» activado (A-02) tampoco hay intro, y los cursores no llegan a verse
try { pausa = localStorage.getItem('animaciones-pausadas') === '1'; } catch (e) {}
if (pausa) document.documentElement.classList.add('paused');
if (!pausa && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('intro', 'locked');
}
