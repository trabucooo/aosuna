// Se ejecuta antes de pintar la página para preparar la intro
document.documentElement.classList.add('js');
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('intro', 'locked');
}
