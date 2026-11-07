// Página 404 en el idioma de quien llega. nginx sirve el mismo 404.html para todo el sitio,
// así que el idioma se decide aquí: si la ruta rota está bajo /en/, inglés; si no, el idioma
// preferido del navegador. Sin JavaScript se queda en español, con el botón a la versión inglesa.
const path = location.pathname;
const prefersEn = (navigator.languages?.[0] || navigator.language || '').toLowerCase().startsWith('en');
const en = path.startsWith('/en/') || path === '/en' || (prefersEn && !path.startsWith('/es'));

if (en) {
  const $ = id => document.getElementById(id);
  document.documentElement.lang = 'en';
  document.title = 'Page not found · Alonso Osuna';
  $('crewLabel').textContent = 'Site foreman';
  $('title').textContent = 'This piece isn’t on site';
  $('lead').textContent = 'The page you’re looking for doesn’t exist or has moved. The crew has checked the whole plan and there’s nothing to build here.';
  const home = $('home'), other = $('other');
  home.href = '/en/'; home.textContent = 'Back to home';
  other.href = '/'; other.hreflang = 'es'; other.lang = 'es'; other.textContent = 'Versión en español';
}
