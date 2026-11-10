// Se ejecuta antes de pintar la página para preparar la intro
document.documentElement.classList.add('js');
// La intro solo se ve en la primera visita (main.js apunta «intro-vista» en localStorage al empezarla) y nunca
// con «reducir movimiento». Se decide aquí, antes del primer pintado, para que el nombre no parpadee.
// Si el navegador bloquea localStorage (modo privado estricto), el try/catch lo deja en «no vista»: sale la intro
var introVista = false, pausa = false;
try { introVista = localStorage.getItem('intro-vista') === '1'; } catch (e) {}
// Con «Pausar animaciones» activado (A-02) tampoco hay intro, y los cursores no llegan a verse
try { pausa = localStorage.getItem('animaciones-pausadas') === '1'; } catch (e) {}
if (pausa) document.documentElement.classList.add('paused');
if (!introVista && !pausa && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('intro', 'locked');
}
