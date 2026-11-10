// Fuentes alojadas en tu propia web: nada se carga desde Google.
// Solo el subconjunto «latin» de cada una: cubre el español y el inglés enteros (tildes, ñ, ¿¡, «», €, –, …).
// Los demás subconjuntos (cirílico, vietnamita, latin-ext) no se descargaban nunca, pero ocupaban sitio en
// dist/ y en el CSS. Si algún día hace falta un carácter como «š» o «ł», añade aquí el latin-ext de esa fuente
// volviendo al import general (p. ej. '@fontsource/schibsted-grotesk/400.css'), que reparte por unicode-range
import '@fontsource/big-shoulders-display/latin-700';
import '@fontsource/big-shoulders-display/latin-900';
import '@fontsource/schibsted-grotesk/latin-400';
import '@fontsource/schibsted-grotesk/latin-400-italic';
import '@fontsource/schibsted-grotesk/latin-600';
import '@fontsource/martian-mono/latin-400';
import '@fontsource/martian-mono/latin-600';
