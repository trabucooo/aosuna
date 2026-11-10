// Entrada de /zalapp/ y /en/zalapp/: la página propia del proyecto. Es una página de lectura: el HTML ya trae todo
// el contenido y aquí solo se cargan las fuentes y los estilos, y se apuntan tres eventos de analítica.
// No se pone la clase «js» en <html> (eso lo hace boot.js en la portada): así style.css aplica la versión estática
// del cuaderno, la misma que se ve en la portada sin JavaScript, con las nueve etapas una detrás de otra
import './fonts.js';
import './style.css';
import './zalapp.css';

// Analítica (Umami). Si no carga o está bloqueada, no pasa nada. La visita a la página la cuenta Umami sola
function track(name, data) { try { window.umami?.track(name, data); } catch (e) {} }

// Cada etapa, la primera vez que cruza el centro de la pantalla: dice hasta dónde se lee
const seen = new IntersectionObserver(entries => entries.forEach(e => {
  if (!e.isIntersecting) return;
  seen.unobserve(e.target);
  track('zalapp-pagina-etapa', { etapa: e.target.dataset.etapa });
}), { rootMargin: '-45% 0px -45% 0px' });
document.querySelectorAll('.log-page').forEach(p => seen.observe(p));

// Los dos botones del final («Escríbeme» y «Ver el portfolio») y el cambio de idioma
document.querySelectorAll('[data-cta]').forEach(a => a.addEventListener('click', () => track('zalapp-pagina-cta', { a: a.dataset.cta })));
document.querySelectorAll('[data-lang]').forEach(a => a.addEventListener('click', () => track('idioma', { a: a.dataset.lang })));
