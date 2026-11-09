// Textos de la web que se generan desde main.js. El HTML de cada idioma lleva el resto.
// El idioma sale de <html lang="...">: "es" en /, "en" en /en/.

const es = {
  layerHome: 'Portada',
  layerLabel: 'capa',
  loading: p => `Cargando ${p} %`,
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

const en = {
  layerHome: 'Home',
  layerLabel: 'layer',
  loading: p => `Loading ${p}%`,
  repairs: n => n < 3 ? `Repairs: ${n}. Carry on, they’re paid by the hour.` : n < 6 ? `Repairs: ${n}. Not a single complaint.` : `Repairs: ${n}. Scroll down and meet the crew.`,
  crew: ['WordPress', 'SEO writer', 'Sales', 'Researcher', 'Videomapping', 'Zalapp lead', 'Moderator', 'Newsletter', 'AI prompts', 'Web design', 'Lead generation', 'Customer service'],
  zalapp: ['47 responses', '41 drivers', '36 employed', '5 self-employed', '4 fleet managers', '2 other profiles'],
  zalappPhone: {
    label: 'See the Zalapp app',
    alt: 'Map screen from the Zalapp beta',
    cueMouse: 'Switch me on',
    cueTouch: 'Tap the screen',
    log: 'See the route logbook',
    web: 'See the website',
  },
  zalappLog: {
    pending: 'Under construction: coming soon at zalapp.aosuna.es',
    stage: (i, n, km, t) => `Stage ${i} of ${n}. ${km}. ${t}`,
    mark: (i, t) => `Stage ${i}: ${t}`,
  },
  nautes: [
    ['Question', 'How much does it cost to keep a boat?', ['What boat owners, or people thinking of buying one, actually ask.', 'Step one: understand the search intent.']],
    ['Brief', 'A guide to real costs by boat length and use (2026)', ['Main and secondary keywords', 'Audience', 'Goal of the piece']],
    ['Structure', 'An outline before writing a word', ['H1 and H2 sections', 'FAQs', 'Suggested internal links']],
    ['Metadata', 'Ready for search engines', ['Meta title', 'Meta description', 'Slug']],
  ],
  nautesBoat: { label: 'See the Nautes website', alt: 'Nautes website homepage', cueMouse: 'Hover over me', cueTouch: 'Tap the boat', go: 'Visit nautes.es ↗' },
  explora: {
    points: [
      { k: 'N', dir: 'North', name: 'Nautes', text: "Website and boating content in WordPress. You've just seen it above." },
      { k: 'E', dir: 'East', name: 'AI and GEO', text: 'Prompts and content written for AI search engines.' },
      { k: 'S', dir: 'South', name: 'Videomapping', text: "Set-up and AI visuals for shop windows. You'll find it at the end." },
      { k: 'W', dir: 'West', name: 'Lead generation', text: 'The sales side: reaching clients in the sector.' },
    ],
    hintMouse: 'Hover over a compass point.',
    hintTouch: 'Tap a compass point.',
    cueMouse: 'Hover over me',
    cueTouch: 'Tap me',
    piece: d => `Piece delivered on ${d}: brief with main keyword, H2s, FAQs and metadata.`,
    read: 'Read on Nautes ↗',
  },
  portal: {
    hintMouse: 'Hover to build it',
    hintTouch: 'Tap to build it',
    enter: 'Enter the website ↗',
    pending: "Link coming soon: the new website isn’t live yet.",
    cue: 'Build it',
    // Etiquetas del plano (en el JSON van en español, como en la web de Alcar)
    tags: { 'VOLUMEN SUPERIOR': 'UPPER VOLUME', 'CUBIERTA EN VOLADIZO': 'CANTILEVERED ROOF', 'LAMAS DE MADERA': 'TIMBER SLATS' },
  },
  stamps: [
    {
      title: 'VOCATIONAL DIPLOMA IN SALES & COMMERCE',
      school: 'IES Fernando III · Priego de Córdoba',
      foot: 'Dual VET (school + company) · 2023–2025',
      lines: ['“This is where I learned there’s a person behind every sale.”', '“Counter, stockroom and invoices: marketing starts with knowing how things get sold.”'],
      half: false,
    },
    {
      title: 'HIGHER VOCATIONAL DIPLOMA IN MARKETING & ADVERTISING',
      school: 'IES Luis de Góngora · Córdoba',
      foot: 'IN PROGRESS · 2025–2027',
      lines: ['“Learning to turn what I sell into what I communicate.”', '“Running low on ink, but it already prints.”'],
      half: true,
    },
  ],
  mapping: {
    corner: i => `Corner ${i}. Use the arrow keys to move it`,
    done: "Lined up. That’s how it’s done on a real site",
    left: n => n === 1 ? '1 corner to go' : `${n} corners to go`,
  },
  tools: [
    ['WordPress', 'Nautes, with OceanWP, Directorist, Spectra and Stackable.', 'Hands-on experience from a work placement.'],
    ['Keywords and SEO', 'Briefs and content structure for a boating website.', 'Hands-on. No measured ranking results.'],
    ['GEO', 'Generative engine optimisation: content written to be found by AI search tools, at Explora Natura.', 'Exploratory work.'],
    ['ChatGPT, Gemini, NotebookLM', 'Research, writing and organising information.', 'Regular use, always checking the output.'],
    ['Runway', 'AI-generated visuals and video.', 'Used in visual projects.'],
    ['Resolume Arena', 'Video and projection software.', 'Intermediate, by my own assessment.'],
    ['Canva', 'College and project materials.', 'Regular use.'],
    ['Affinity Designer', 'Vector design.', 'Intermediate, by my own assessment.'],
    ['Illustrator', 'Vector design.', 'Intermediate, by my own assessment.'],
    ['Photoshop', 'Image editing.', 'Basic knowledge.'],
    ['HTML, CSS and JS', 'Pages and prototypes in VS Code.', "I build and adapt with help from AI. Still learning."],
    ['Google Docs and Sheets', 'Day-to-day organisation of documents and data, alongside Drive.', 'Regular use.'],
    ['CRMdelSol', 'A Spanish CRM, used for coursework in sales management.', 'Academic use, intermediate by my own assessment.'],
    ['Shopify', 'E-commerce.', 'Basic knowledge.'],
    ['Hostinger', 'Web hosting.', 'Intermediate, by my own assessment.'],
    ['Customer service', 'Almazaras de la Subbética: advising customers and consultative selling.', 'Real work experience.'],
  ],
  copy: { idle: 'Copy email', done: 'Copied', selected: 'Email selected' },
  boss: {
    empty: "Give us something to do, we’re just standing here.",
    reLetter: /\b(?:bring|fetch|throw|toss|chuck|grab|kick|pull|remove)\b.*\b(?:the|an?|letter)\s+([alons])\b/,
    letter: l => `One ${l}, coming right up.`,
    notOurs: "That letter isn’t one of ours.",
    reBreak: /\b(break|smash|wreck|destroy|knock down|demolish|trash)\b.*\b(name|everything|it all|letters)\b/,
    broken: "We’ll knock it down and put it back up in no time.",
    reReset: /\b(normal|original|reset|clean|as it was|undo)\b|remove the colou?r/,
    reset: 'Paint stripped.',
    colors: [['red', /\bred\b/, 'red'], ['blue', /\bblue\b/, 'blue'], ['green', /\bgreen\b/, 'green'], ['pink', /\bpink\b/, 'pink'], ['yellow', /\byellow\b/, 'yellow'], ['orange', /\borange\b/, 'orange'], ['purple', /\bpurple\b/, 'purple'], ['black', /\bblack\b/, 'black']],
    painted: c => `Background painted ${c}.`,
    rePaint: /\b(paint|colou?r)\b/,
    noColor: "We’re out of that colour. Try red, blue, green, pink or purple.",
    places: [['projects', /\bprojects?\b/, 'the projects'], ['contact', /\bcontact\b/, 'the contact section'], ['tools', /\b(tools?|toolbox)\b/, 'the toolbox'], ['home', /\b(home|top)\b/, 'the top'], ['zalapp', /zalapp/, 'Zalapp'], ['zalapp', /\b(logbook|notebook)\b/, 'Zalapp'], ['zalapp', /\bapp\b/, 'Zalapp'], ['nautes', /nautes/, 'Nautes'], ['explora', /explora/, 'Explora Natura'], ['explora', /\bcompass\b/, 'the compass'], ['explora', /\b(diary|log|placement log)\b/, 'the placement log'], ['alcar', /alcar/, 'Alcar'], ['mapping', /mapping/, 'the videomapping'], ['formacion', /\beducation\b/, 'my education'], ['sellos', /\bstamps?\b/, 'the stamps']],
    goTo: p => `Off to ${p}.`,
    reDance: /\b(dance|party|boogie)\b/,
    dance: 'Cue the music.',
    reFollow: /\b(follow|after me|behind me)\b/,
    follow: "We’ll follow you anywhere.",
    reCircle: /\b(circle|ring|line up|form)\b/,
    circle: 'Everyone, in a circle.',
    reLeave: /\b(holidays?|vacation|take a break|day off|go away|get lost|leave|clear off)\b/,
    leave: 'See you later. Back in six seconds.',
    reStrike: /\bstrike\b/,
    reWork: /\b(back to work|get to work|work|come back)\b/,
    work: 'Back to the grind.',
    unknown: "That’s not in our contract. Try one of these orders.",
    chips: ['Paint the background red', 'Bring me the O', 'Break the name', 'Dance', 'Follow me', 'Form a circle', 'Go to Zalapp', 'Holiday', 'Strike', 'Back to normal'],
  },
  strike: {
    complaints: ["I’ve been lifting this O since seven", 'Nobody scrolls round here', 'We want more clicks', 'No scroll, no work', 'My contract says you have to move me', "Even the hosting wouldn’t pay for this"],
    bannerMouse: 'On strike: move your mouse',
    bannerTouch: 'On strike: tap the screen',
    end: 'Fine, back to work',
  },
  notes: [
    ['The intro', 'A portfolio competes with lots of open tabs. My name builds itself in front of you to win those first few seconds and stick in your memory.'],
    ['One line', "If you only look for five seconds, you should still know what I do. That’s why it sits right under my name."],
    ['An invitation to play', 'I ask you to break the site on purpose. People who interact with something stay longer and remember it better.'],
    ['A short menu', "A handful of fixed links. You can jump straight to what you’re after without sitting through the whole story."],
    ['A chosen path', "I only include what connects with the work I’m looking for. A portfolio is also made by leaving things out."],
    ['Stamped, not listed', "My education isn’t a bullet list: the same cursors that build this site bring it in. The second stamp is only half-inked because I haven’t finished that course yet."],
    ['From boat to website', 'The same dots that form the sailboat build the skeleton of the website, and then the real page appears. The industry and the work show up in a single gesture.'],
    ['The method, under way', 'The four steps of every piece sit like buoys along a course, with no tabs: you take them in at a glance and the boat stays the star.'],
    ['A knot, not a paragraph', 'Explora Natura ties Nautes and the videomapping together: the compass points up and down, and the log shows what came out of it, with dates.'],
    ['The app, from the inside', 'A phone made of dots that switches on with the real beta. The buttons mimic the app’s own, so stepping into the project feels natural.'],
    ['From plan to build', 'The new Alcar website is explained the way a house gets built: first the drawing, then the building. The same cursors that put this site together draw the plan.'],
    ["Try it, don’t read it", 'Videomapping is hard to explain. Lining up the light yourself makes sense in ten seconds.'],
    ['Honest levels', 'Every tool says where I used it and how well I know it. Overstating it would show in the first interview.'],
    ['One goal', 'The whole journey ends here: a big email address and a button to copy it. No forms.'],
  ],
  noteCount: (i, n) => `Note ${i} of ${n}`,
  notePin: (i, t) => `Note ${i}: ${t}`,
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

export const STRINGS = { es, en };
export const LANG = document.documentElement.lang.toLowerCase().startsWith('en') ? 'en' : 'es';
export const T = STRINGS[LANG];
// La analítica usa siempre los textos en español para que cada evento sume en una sola fila
export const ES = es;
