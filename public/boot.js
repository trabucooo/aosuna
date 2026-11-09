// Se ejecuta antes de pintar la página para preparar la intro
document.documentElement.classList.add('js');
// La intro solo se ve la primera vez en la sesión (main.js apunta «intro-vista» al empezarla) y nunca con
// «reducir movimiento». Se decide aquí, antes del primer pintado, para que el nombre no parpadee
var introVista = false;
try { introVista = sessionStorage.getItem('intro-vista') === '1'; } catch (e) {}
if (!introVista && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('intro', 'locked');
}
