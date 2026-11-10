// Textos de la web que se generan desde main.js. El HTML de cada idioma lleva el resto.
// El idioma sale de <html lang="...">: "es" en /, "en" en /en/.

const es = {
  layerHome: 'Portada',
  layerLabel: 'capa',
  repairs: n => n < 3 ? `Arreglos: ${n}. Puedes seguir, cobran por horas.` : n < 6 ? `Arreglos: ${n}. Ni una queja.` : `Arreglos: ${n}. Baja, que te presento al equipo.`,
  // Etiquetas de los cursores del equipo
  crew: ['WordPress', 'Redactor SEO', 'Comercial', 'Investigador', 'Videomapping', 'Coordinador Zalapp', 'Moderador', 'Newsletter', 'Prompts con IA', 'Diseño web', 'Captación', 'Atención al cliente'],
  // Filtros de Zalapp, en el mismo orden que los grupos de main.js
  zalapp: ['47 registros', '41 conductores', '36 asalariados', '5 autónomos', '4 de flota', '2 con perfil Otro'],
  // Móvil de Zalapp: botón invisible sobre el móvil, captura, etiqueta del cursor (ratón / táctil) y botones de la hoja
  zalappPhone: {
    label: 'Ver la app de Zalapp',
    alt: 'Pantalla del mapa de la beta de Zalapp',
    cueMouse: 'Enciéndeme',
    cueTouch: 'Toca la pantalla',
    log: 'Ver cuaderno de ruta',
    web: 'Ver la web',
  },
  // Cuaderno de ruta de Zalapp: aviso de la web en obra y lo que se anuncia al pasar de etapa
  zalappLog: {
    pending: 'En obra: pronto en zalapp.aosuna.es',
    stage: (i, n, km, t) => `Etapa ${i} de ${n}. ${km}. ${t}`,
    mark: (i, t) => `Etapa ${i}: ${t}`,
  },
  nautes: [
    ['Pregunta', '¿Cuánto cuesta mantener un barco?', ['Lo que se pregunta quien tiene un barco o piensa en comprarlo.', 'Primer paso: entender la intención de búsqueda.']],
    ['Brief', 'Guía de costes reales según eslora y uso (2026)', ['Palabra clave principal y secundarias', 'Audiencia', 'Objetivo de la pieza']],
    ['Estructura', 'Un guion antes de escribir', ['H1 y bloques H2', 'Preguntas frecuentes', 'Enlaces internos propuestos']],
    ['Metadatos', 'Listo para buscadores', ['Metatítulo', 'Metadescripción', 'Slug']],
  ],
  // Velero del proyecto Nautes: botón que lo transforma en la web, texto alternativo de la captura
  // y etiqueta del cursor que se queda junto a la proa (con ratón / en táctil)
  nautesBoat: { label: 'Ver la web de Nautes', alt: 'Portada de la web de Nautes', cueMouse: 'Pásame por encima', cueTouch: 'Toca el velero', go: 'Visitar nautes.es ↗' },
  // Explora Natura: la brújula (en el orden N, E, S, O: k es la letra que se dibuja, dir el nombre para el lector
  // de pantalla) y el cuadro de texto. Las piezas del diario están en ENTREGAS, al final del archivo
  explora: {
    points: [
      { k: 'N', dir: 'Norte', name: 'Nautes', text: 'Web y contenidos náuticos en WordPress. Lo has visto justo arriba.' },
      { k: 'E', dir: 'Este', name: 'IA y GEO', text: 'Prompts y contenidos pensados para buscadores con IA.' },
      { k: 'S', dir: 'Sur', name: 'Videomapping', text: 'Montaje y visuales con IA para escaparates. Lo verás al final.' },
      { k: 'O', dir: 'Oeste', name: 'Captación', text: 'La parte comercial: llegar a clientes del sector.' },
    ],
    hintMouse: 'Pasa el cursor por un punto cardinal.',
    hintTouch: 'Toca un punto cardinal.',
    cueMouse: 'Pásame por encima',
    cueTouch: 'Tócame',
    piece: d => `Pieza entregada el ${d}: brief con keyword principal, H2, preguntas frecuentes y metadatos.`,
    read: 'Leer en Nautes ↗',
  },
  // Alcar, del plano a la obra: aviso bajo el marco (con ratón / en táctil), texto con la obra levantada
  // (con enlace / sin él) y etiqueta del cursor que espera junto al marco
  portal: {
    hintMouse: 'Pasa el cursor y se levanta',
    hintTouch: 'Toca y se levanta',
    enter: 'Entrar en la web ↗',
    pending: 'Enlace pendiente: la web nueva todavía no está publicada.',
    cue: 'Levántala',
    // Nombre del marco mientras no hay dirección (PORTAL_URL vacía en main.js)
    raise: 'Levantar la captura de la web nueva de Alcar',
  },
  // Sellos de formación de la escena «Ese equipo soy yo». El HTML lleva una copia para quien
  // navega sin JavaScript: si cambias un texto aquí, cámbialo también en index.html.
  // En 2027, para pasar el sello 2 a completo:
  //   1. Pon half: false y quita la clase "half" de #stamp2 en index.html y en/index.html
  //      (quita la máscara a medias, tinta-media.svg).
  //   2. Pie: '2025–2027' (sin «EN CURSO»). En inglés, foot: '2025–2027'.
  //   3. Cambia la segunda frase por «Ahora sí, con toda la tinta.» (en inglés, “Now fully inked.”).
  stamps: [
    {
      title: 'TÉCNICO EN ACTIVIDADES COMERCIALES',
      school: 'IES Fernando III · Priego de Córdoba',
      foot: 'FP Dual · 2023–2025',
      lines: ['«Aquí aprendí que detrás de cada venta hay una persona.»', '«Mostrador, almacén y facturas: el marketing empieza por saber cómo se vende.»'],
      half: false,
    },
    {
      title: 'TÉCNICO SUPERIOR EN MARKETING Y PUBLICIDAD',
      school: 'IES Luis de Góngora · Córdoba',
      foot: 'EN CURSO · 2025–2027',
      lines: ['«Aquí aprendo a convertir lo que vendo en lo que comunico.»', '«Le falta tinta, pero ya imprime.»'],
      half: true,
    },
  ],
  mapping: {
    corner: i => `Esquina ${i}. Usa las flechas para moverla`,
    done: 'Encajado. Así se ajusta en un sitio real',
    left: n => n === 1 ? 'Falta 1 esquina' : `Faltan ${n} esquinas`,
  },
  // [nombre, dónde, nivel], en el mismo orden que los colores de main.js
  tools: [
    ['WordPress', 'Nautes, con OceanWP, Directorist, Spectra y Stackable.', 'Experiencia en prácticas de empresa.'],
    ['Palabras clave y SEO', 'Briefs y estructura de contenidos náuticos.', 'Práctico. Sin resultados de posicionamiento medidos.'],
    ['GEO', 'Contenidos pensados para buscadores de IA, en Explora Natura.', 'Trabajo exploratorio.'],
    ['ChatGPT, Gemini, NotebookLM', 'Investigación, textos y organización de información.', 'Uso habitual, siempre revisando el resultado.'],
    ['Runway', 'Visuales y vídeo generados con IA.', 'Uso en proyectos visuales.'],
    ['Resolume Arena', 'Software de vídeo y proyección.', 'Intermedio, según mi autoevaluación.'],
    ['Canva', 'Materiales académicos y de proyectos.', 'Uso habitual.'],
    ['Affinity Designer', 'Diseño vectorial.', 'Intermedio, según mi autoevaluación.'],
    ['Illustrator', 'Diseño vectorial.', 'Intermedio, según mi autoevaluación.'],
    ['Photoshop', 'Edición de imagen.', 'Conocimientos básicos.'],
    ['HTML, CSS y JS', 'Páginas y prototipos en VS Code.', 'Creo y adapto con apoyo de IA. Sigo aprendiendo.'],
    ['Google Docs y Sheets', 'Organización diaria de documentos y datos, junto con Drive.', 'Uso habitual.'],
    ['CRMdelSol', 'Actividades académicas de gestión comercial.', 'Uso académico, intermedio según mi autoevaluación.'],
    ['Shopify', 'Comercio electrónico.', 'Conocimientos básicos.'],
    ['Hostinger', 'Alojamiento web.', 'Intermedio, según mi autoevaluación.'],
    ['Atención al cliente', 'Almazaras de la Subbética: asesoramiento y venta consultiva.', 'Experiencia real de trabajo.'],
  ],
  copy: { idle: 'Copiar email', done: 'Copiado', selected: 'Email seleccionado' },
  // Jefe de obra: lo que entiende (sobre el texto en minúsculas y sin tildes) y lo que contesta
  boss: {
    empty: 'Dime algo, que estamos parados.',
    reLetter: /\b(?:trae|traed|traedme|tira|tirad|lanza|lanzad|quita|quitad)\b.*\b(?:la|el)\s+([alons])\b/,
    letter: l => `Marchando la ${l}.`,
    notOurs: 'Esa letra no es nuestra.',
    reBreak: /(rompe|romped|derriba|derribad|tira|tirad|destroza|destrozad).*(nombre|todo|letras)/,
    broken: 'Lo tiramos y lo levantamos en un momento.',
    reReset: /(normal|original|limpia|limpiad|como estaba|quita el color)/,
    reset: 'Pintura retirada.',
    colors: [['red', /rojo/, 'rojo'], ['blue', /azul/, 'azul'], ['green', /verde/, 'verde'], ['pink', /rosa/, 'rosa'], ['yellow', /amarillo/, 'amarillo'], ['orange', /naranja/, 'naranja'], ['purple', /morado/, 'morado'], ['black', /negro/, 'negro']],
    painted: c => `Fondo pintado de ${c}.`,
    rePaint: /\b(pinta|pintad|color)\b/,
    noColor: 'De ese color no queda bote. Prueba rojo, azul, verde, rosa o morado.',
    places: [['projects', /proyectos/, 'proyectos'], ['contact', /contacto/, 'contacto'], ['tools', /herramientas/, 'herramientas'], ['home', /inicio/, 'inicio'], ['zalapp', /zalapp/, 'zalapp'], ['zalapp', /cuaderno/, 'zalapp'], ['zalapp', /\bapp\b/, 'zalapp'], ['nautes', /nautes/, 'nautes'], ['explora', /explora/, 'Explora Natura'], ['explora', /brujula/, 'la brújula'], ['explora', /diario/, 'el diario'], ['alcar', /alcar/, 'alcar'], ['mapping', /videomapping/, 'videomapping'], ['mapping', /mapping/, 'mapping'], ['formacion', /formacion/, 'formación'], ['sellos', /\bsellos?\b/, 'los sellos']],
    goTo: p => `Vamos ${p.startsWith('el ') ? 'al ' + p.slice(3) : 'a ' + p}.`,
    reDance: /(baila|bailad|fiesta)/,
    dance: 'Música, maestro.',
    reFollow: /(seguidme|sigueme|siguedme|seguid|detras)/,
    follow: 'Te seguimos a todas partes.',
    reCircle: /(circulo|corro|formad|forma)/,
    circle: 'En círculo, todos.',
    reLeave: /(vacaciones|descanso|largo|fuera|iros|marchaos)/,
    leave: 'Hasta luego. Volvemos en seis segundos.',
    reStrike: /huelga/,
    reWork: /(trabajo|seguid currando|a currar|volved)/,
    work: 'Vuelta al tajo.',
    unknown: 'Eso no viene en el convenio. Prueba con una de estas órdenes.',
    chips: ['Pinta el fondo de rojo', 'Traed la O', 'Rompe el nombre', 'Bailad', 'Seguidme', 'Formad un círculo', 'Id a Zalapp', 'Vacaciones', 'Huelga', 'Déjalo normal'],
  },
  strike: {
    complaints: ['Llevo levantando esta O desde las siete', 'Aquí nadie hace scroll', 'Queremos más clics', 'Sin scroll no hay obra', 'Mi convenio dice que me muevas', 'Esto no lo paga ni el hosting'],
    bannerMouse: 'Huelga: mueve el ratón',
    bannerTouch: 'Huelga: toca la pantalla',
    end: 'Vale, volvemos al tajo',
  },
  // Auditar esta web: [título, texto], en el mismo orden que los elementos de main.js
  notes: [
    ['La intro', 'Un portfolio compite con muchas pestañas abiertas. El nombre se construye delante de ti para ganar los primeros segundos y quedarse en la memoria.'],
    ['Una frase', 'Quien solo mire cinco segundos tiene que saber a qué me dedico. Por eso va justo debajo del nombre.'],
    ['Invitar a tocar', 'Te pido que rompas la web a propósito. Quien interactúa con algo se queda más tiempo y lo recuerda mejor.'],
    ['Menú corto', 'Pocos enlaces y fijos. Puedes irte directo a lo que buscas sin tragarte toda la historia.'],
    ['Trayectoria elegida', 'Solo cuento lo que conecta con el trabajo que busco. Un portfolio también se hace quitando cosas.'],
    ['Formación con sello', 'La formación no va en una lista: la traen los mismos cursores que construyen la web. El segundo sello está a medias porque todavía estoy cursando ese ciclo.'],
    ['Del barco a la web', 'Los mismos puntos que forman el velero construyen el esqueleto de la web, y después aparece la página real. El sector y el trabajo se ven en el mismo gesto.'],
    ['El método, en ruta', 'Los cuatro pasos de cada pieza van como boyas en un rumbo, sin pestañas: se leen de un vistazo y el barco sigue siendo el protagonista.'],
    ['Un nudo, no un párrafo', 'Explora Natura conecta Nautes y el videomapping: la brújula señala hacia arriba y hacia abajo, y el diario enseña lo que salió de allí, con fecha.'],
    ['La app, por dentro', 'Un móvil hecho de puntos que se enciende con la beta real. Los botones imitan los de la app para que el paso al proyecto sea natural.'],
    ['Del plano a la obra', 'La web nueva de Alcar se explica como se construye una casa: primero el trazado, después la obra. Los mismos cursores que montan esta web dibujan el plano.'],
    ['Probar en vez de leer', 'Explicar el videomapping cuesta. Encajar tú mismo la luz se entiende en diez segundos.'],
    ['Nivel real', 'Cada herramienta dice dónde la usé y con qué nivel. Inflarlo se notaría en la primera entrevista.'],
    ['Un solo objetivo', 'Todo el recorrido acaba aquí: un email grande y un botón para copiarlo, sin formularios.'],
  ],
  noteCount: (i, n) => `Nota ${i} de ${n}`,
  notePin: (i, t) => `Nota ${i}: ${t}`,
};

/* Diario de prácticas de Explora Natura: las piezas entregadas, en orden. fecha va en el botón, dia en el
   cuadro de texto. Si una tiene url, el cuadro enseña «Leer en Nautes ↗» (en otra pestaña).
   El HTML lleva una copia para quien navega sin JavaScript: si cambias un título, cámbialo también allí */
export const ENTREGAS = [
  { url: '',
    es: { fecha: '19 mar', dia: '19 de marzo', titulo: 'Guía de costes reales según eslora y uso' },
    en: { fecha: '19 Mar', dia: '19 March', titulo: 'A guide to real costs by boat length and use' } },
  { url: '',
    es: { fecha: '26 mar', dia: '26 de marzo', titulo: 'Propietarios a distancia: gestionar tu barco desde otra ciudad' },
    en: { fecha: '26 Mar', dia: '26 March', titulo: 'Owning from afar: managing your boat from another city' } },
  { url: '',
    es: { fecha: '7 abr', dia: '7 de abril', titulo: 'Cuánto cuesta mantener un barco: 5, 8 y 10 m' },
    en: { fecha: '7 Apr', dia: '7 April', titulo: 'What it costs to keep a boat: 5, 8 and 10 m' } },
  { url: '',
    es: { fecha: '9 abr', dia: '9 de abril', titulo: '¿Cuánto cuesta realmente un varadero?' },
    en: { fecha: '9 Apr', dia: '9 April', titulo: 'What does a boatyard really cost?' } },
  { url: '',
    es: { fecha: '13 abr', dia: '13 de abril', titulo: 'El mantenimiento oculto al comprar de segunda mano' },
    en: { fecha: '13 Apr', dia: '13 April', titulo: 'The hidden upkeep of buying second-hand' } },
];

export const LANG = document.documentElement.lang.toLowerCase().startsWith('en') ? 'en' : 'es';
// T: los textos del idioma de la página. En español son los de arriba. Los ingleses van en i18n-en.js, que solo
// carga /en/: main-en.js los pasa a register() antes de arrancar la web (start() en main.js). Así la página en
// español no descarga los textos en inglés
export let T = es;
export function register(strings) { T = strings; }
// La analítica usa siempre los textos en español para que cada evento sume en una sola fila
export const ES = es;
