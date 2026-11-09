# Auditoría de aosuna.es

Fecha: 9 de noviembre de 2026 · Estado auditado: working tree actual de `aosuna/` (rama `main`, último commit `5f60f7b`) con los cambios sin commitear de `src/main.js` y `src/style.css`, y el build de `dist/` generado a las 11:51 del mismo día.

> **Nota sobre el estado del repositorio.** El encargo decía que había cambios sin commitear en `index.html`, `en/index.html`, `src/i18n.js`, `src/main.js` y `src/style.css`. Hoy `git status` solo muestra `src/main.js` y `src/style.css` modificados, más `public/cv/alonso-osuna-cv-es.pdf` **sin seguimiento** (`??`). He auditado ese estado real. `src/main.js` tiene 2.139 líneas, no unas 1.970.

---

## 1. Resumen ejecutivo

1. La base es buena: HTML semántico, enlace de salto, diálogo nativo con devolución del foco, CSP estricta sin `unsafe-inline`, 404 real, hreflang correctos y una versión sin JavaScript que se lee de verdad.
2. Hay **un fallo crítico de teclado**: el cuaderno de ruta de Zalapp y el enlace a nautes.es no se alcanzan con Tab ni con lector de pantalla, porque sus botones solo existen mientras su escena está en pantalla.
3. **El rendimiento lo hunde la intro**: el lema y la entradilla no aparecen hasta que termina, a los 6,6 s en escritorio y a los 8,3 s en móvil. Por eso el LCP móvil es de 9,2 s. Además, el bucle de animación sigue a 60 fps en reposo, también con «reducir movimiento».
4. Antes de publicar faltan tres cosas: el ID de Umami, el CV en inglés y hacer commit del CV en español.
5. La analítica cubre casi todo, pero no mide el clic en el email (la conversión principal) y `ANALITICA.md` ya no coincide con el código.

| Área | Nota |
| --- | --- |
| Accesibilidad (WCAG 2.2 AA) | 6/10 |
| Rendimiento y Core Web Vitals | 4/10 |
| Calidad del código y mantenibilidad | 6/10 |
| SEO técnico e internacionalización | 7/10 |
| Seguridad y despliegue | 8/10 |
| Listo para publicar | 4/10 |
| Engagement y UX | 6/10 |

---

## 2. Bloqueantes antes de publicar

| # | Bloqueante | Evidencia | Arreglo |
| --- | --- | --- | --- |
| B1 | ID de Umami sin poner | `index.html:31` y `en/index.html:31`: `data-website-id="UMAMI_WEBSITE_ID"` | Pon el Website ID real. Añade también `data-domains="aosuna.es"` para no contar las pruebas en local. |
| B2 | Falta el CV en inglés | `en/index.html:487` enlaza `/cv/alonso-osuna-cv-en.pdf`. Medido: `GET /cv/alonso-osuna-cv-en.pdf → 404 text/html`. Como el enlace lleva `download`, el navegador descarga la página 404 con nombre `.pdf` y el archivo sale roto. | Añade `public/cv/alonso-osuna-cv-en.pdf`. Hasta entonces, en `/en/` enlaza el CV en español con el texto «Download CV (Spanish)». |
| B3 | El CV en español no está en git | `git status`: `?? public/cv/alonso-osuna-cv-es.pdf`. Si el VPS construye desde un `git clone` o un `git pull`, el PDF no llega a la imagen y el botón «Descargar CV» da 404. | `git add public/cv/alonso-osuna-cv-es.pdf` y commit. |
| B4 | El cuaderno de Zalapp y la web de Nautes no se alcanzan con teclado ni con lector de pantalla | Ver A-01 | Ver A-01 |
| B5 | Enlaces vacíos a propósito (no rompen, pero conviene decidir) | `main.js:968` `ZALAPP_URL=''`, `main.js:1598` `PORTAL_URL=''`, `i18n.js:316-330` las cinco entregas con `url: ''` | Puedes publicar así: los textos ya dicen «en obra» o «enlace pendiente». Revisa A-06 para Alcar. |

No he encontrado `TODO`, `FIXME` ni textos sin traducir en `/en/`. Los nombres propios en español, como «Observatorio del Transporte…» o «Almazaras de la Subbética», son correctos.

---

## 3. Hallazgos por severidad

Formato: **ID · Área · Severidad** · Archivo:línea · Qué pasa · Por qué importa · Cómo arreglarlo · Esfuerzo.

### Crítico

#### A-01 · Accesibilidad · Crítico
- **Dónde:** `src/main.js:667` y `:726` (botón del velero, `#nautesBoat`), `src/main.js:1325` y `:1372` (botón del móvil, `#zalappPhone`), `src/style.css:276` (`.js .has-phone .phone-static{display:none}`).
- **Qué pasa:** los dos botones se crean con `hidden=true` y solo se muestran mientras su escena está activa (`boat.w>.9` o `phone.w>.9`). Cuando cargan los puntos, la captura fija con el enlace «Ver cuaderno de ruta» (`index.html:223`) se oculta. **Medido** recorriendo la página con Tab: después de la última pieza del diario de Explora el foco salta directamente a `#portal` (Alcar). Ni el velero ni el móvil aparecen en el orden de Tab y no están en el árbol de accesibilidad. Resultado: **el cuaderno de 9 etapas y el único enlace a nautes.es no se pueden abrir ni con teclado ni con lector de pantalla**, salvo que alguien haya hecho scroll justo hasta esa altura.
- **Por qué importa:** WCAG 2.1.1 Teclado (A) y 4.1.2 Nombre, función y valor (A). Además, es tu mejor proyecto.
- **Cómo arreglarlo:** hay que hacer dos cosas.
  1. Pon enlaces de texto normales en la ficha de cada proyecto. Siempre se ven, valen también sin JavaScript y ayudan al SEO:
     ```html
     <!-- Nautes, dentro de .proj-copy -->
     <p><a class="more" href="https://nautes.es" target="_blank" rel="noopener">Ver nautes.es ↗</a></p>
     <!-- Zalapp, dentro de .proj-copy -->
     <p><a class="more" href="#zDialog" id="zLogLink">Abrir el cuaderno de ruta</a></p>
     ```
     y en `main.js` engancha `#zLogLink` igual que `#zStaticLog` (`main.js:1310`).
  2. No saques del Tab los botones de las escenas: aplica el patrón de la brújula (`main.js:1531`). Al enfocar el botón, la página baja hasta su escena:
     ```js
     // main.js:726 — en lugar de alternar hidden
     b.addEventListener('focus',()=>{if(boat.w<.9)scrollTo({top:boat.st.s,behavior:rm?'auto':'smooth'})});
     ```
- **Esfuerzo:** S para los enlaces y M para el patrón de foco.

#### P-01 · Rendimiento · Crítico
- **Dónde:** `src/style.css:94` (`.js.intro .reveal{opacity:0}`), `src/main.js:292` (las `.reveal` solo se muestran al final de `intro()`) y `src/main.js:2120` (`boot()` espera fuentes y JSON hasta 1,4 s antes de empezar).
- **Qué pasa:** el elemento LCP en móvil es `p.lead`, y no se pinta hasta que acaba la intro. **Medido:** en móvil con 4G y CPU ×4, LCP de **9.152 ms** y fin de la intro a los 8.275 ms. En escritorio, LCP de 3.292 ms (una letra `<i>`) y fin de la intro a los 6.551 ms.
- **Por qué importa:** el LCP es «malo» por encima de 4 s. También pierdes la prueba de los 5 segundos: durante los primeros segundos solo se ve «Cargando 0 %» (`index.html:42`), un contador falso que llega al 100 % en 1.050 ms (`main.js:245`), y los cursores.
- **Cómo arreglarlo:** deja `.tag` y `.lead` visibles desde el principio y anima solo el nombre. Recorta la intro a 2–2,5 s, quita la espera de los JSON en `boot()` y reprodúcela solo en la primera visita de la sesión:
  ```css
  /* style.css:94 — el lema y la entradilla no esperan a la intro */
  .js.intro .stick .reveal{opacity:1;translate:none}
  ```
  ```js
  // main.js:2120 — no esperar a los puntos para empezar
  await Promise.race([document.fonts.load('900 100px "Big Shoulders Display"'),pause(600)]);
  // y antes de intro(): solo la primera vez en la sesión
  if(sessionStorage.getItem('intro-vista')){finish();}else{sessionStorage.setItem('intro-vista','1');await intro();}
  ```
- **Esfuerzo:** M.

### Alto

#### A-02 · Accesibilidad · Alto: animaciones sin forma de pausarlas (2.2.2)
- **Dónde:** `src/main.js:108-118` (los cursores vagan sin fin), `:2086-2096` (el bucle nunca para) y `:1847-1857` (`drawMap` no mira `rm`).
- **Qué pasa:** los 22 cursores (12 en móvil) se mueven sin parar sobre el contenido. No hay ningún botón de pausa, y la orden «Vacaciones» solo los quita durante 6 s (`main.js:1983`). Con `prefers-reduced-motion: reduce` desaparecen los cursores y la intro, pero **medido**: el canvas del videomapping se sigue animando (`map_canvas_animates: true`), el bucle sigue corriendo a 60 rAF/s y las partículas siguen moviéndose con el scroll en los tramos sin imagen (`main.js:551` solo fuerza 0/1 en las paradas con retrato o puntos). En móvil a 320 px, las etiquetas de los cursores tapan la entradilla y la pista (captura en «Métricas»).
- **Por qué importa:** WCAG 2.2.2 Poner en pausa, detener, ocultar (A): todo movimiento automático de más de 5 s, junto a otro contenido, necesita un control para pararlo. La preferencia del sistema operativo no cuenta como ese control.
- **Cómo arreglarlo:** añade al dock un botón «Pausar animaciones», con `aria-pressed` y recordado en `localStorage`. Cuando esté activo, o con `rm`, oculta `#crew`, congela `drawMap` (dibuja un fotograma fijo) y duerme el bucle (ver P-02).
  ```js
  // main.js:2086 — el videomapping también respeta rm y la pausa
  (f,now)=>{if(mapOn){stepMapSprings(f);if(!(rm||paused)||!mapDrawn){drawMap(rm||paused?0:now);mapDrawn=true}}}
  ```
- **Esfuerzo:** M.

#### P-02 · Rendimiento · Alto: el bucle `requestAnimationFrame` no para nunca
- **Dónde:** `src/main.js:2088-2096`, `:614-615` (limpia y redibuja el lienzo entero en cada frame, también la rejilla de `drawField`).
- **Qué pasa:** **medido** con la página quieta, sin tocar nada, durante 4 s:

  | Condición | rAF/s | Tareas del hilo principal |
  | --- | --- | --- |
  | Escritorio, arriba | 60 | 195 ms/s |
  | Escritorio, contacto | 60 | 475 ms/s |
  | Escritorio con «reducir movimiento», arriba | 60 | 95 ms/s |
  | Escritorio con «reducir movimiento», videomapping | 60 | 426 ms/s |
  | Móvil con CPU ×4, arriba | — | 565 ms/s |

  (En Chrome sin pantalla el pintado va por software y estas cifras salen infladas, pero la tendencia vale: el hilo principal nunca descansa.)
- **Por qué importa:** gasta batería en móvil, calienta portátiles y empeora el INP cuando la gente interactúa, porque el hilo ya está ocupado.
- **Cómo arreglarlo:** duerme el bucle cuando no hay nada que mover y despiértalo con scroll, puntero, cambio de tamaño o una animación en curso. Con `rm`, pinta solo en esos eventos.
  ```js
  let awake=false,idleSince=0;
  function wake(){idleSince=performance.now();if(!awake){awake=true;last=performance.now();requestAnimationFrame(loop)}}
  ['scroll','pointermove','pointerdown','keydown','resize'].forEach(n=>addEventListener(n,wake,{passive:true}));
  // en loop(): si nada se mueve (sin intro, sin órdenes, sin muelles activos, sin mapa ni caja en pantalla)
  // y han pasado 1,5 s desde el último evento, no se pide otro frame:
  if(quiet()&&now-idleSince>1500){awake=false;return}
  ```
- **Esfuerzo:** M.

#### E-01 · Engagement · Alto: la intro retrasa el mensaje
- **Dónde:** `src/main.js:242-294`.
- **Qué pasa:** «Marketing, web e ideas en práctica» y la entradilla salen a los 6,6 s en escritorio y a los 8,3 s en móvil (medido). La nota 2 de la propia auditoría (`i18n.js:149`) dice que quien mire cinco segundos tiene que saber a qué te dedicas, y hoy no se cumple. Un scroll, un toque o una tecla cortan la intro (`main.js:2135`), y eso ayuda, pero quien solo mira no lo sabe.
- **Cómo arreglarlo:** como en P-01. Lema y entradilla desde el primer frame, intro corta y solo en la primera visita, y quita el «Cargando 0 %» falso.
- **Esfuerzo:** S, incluido en P-01.

#### A-03 · Accesibilidad · Alto: el videomapping solo funciona arrastrando (2.5.7)
- **Dónde:** `src/main.js:1817-1843`.
- **Qué pasa:** las esquinas se mueven arrastrando o con las flechas del teclado (`main.js:1841`). En táctil, o con un ratón de un solo clic sin teclado, no hay forma de ajustarlas con toques sueltos.
- **Por qué importa:** WCAG 2.5.7 Movimientos de arrastre (AA, nuevo en 2.2). El teclado no cuenta como alternativa de puntero.
- **Cómo arreglarlo:** «toca un asa y luego toca el sitio». Al pulsar un asa, queda seleccionada (`aria-pressed=true`) y el siguiente toque en `#stage` la lleva a ese punto. Otra opción es un botón «Encajar una esquina» que coloque la siguiente.
  ```js
  let sel=-1;
  hs.forEach((b,i)=>b.addEventListener('click',e=>{if(e.detail){sel=sel===i?-1:i;hs.forEach((h,k)=>h.setAttribute('aria-pressed',k===sel))}}));
  stage.addEventListener('click',e=>{if(sel<0||e.target.classList.contains('h'))return;const r=stage.getBoundingClientRect();
    placeCorner(sel,(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height);warp()});
  ```
- **Esfuerzo:** S.

#### P-03 · Rendimiento · Alto: CLS en escritorio por el tamaño del nombre
- **Dónde:** `src/main.js:69-86` (`fitName()` cambia `font-size` del h1 por JavaScript).
- **Qué pasa:** **medido** en escritorio a 1350×940: CLS **0,146**. El 88 % sale de un único cambio a los 314 ms: `H1#name`, de 251 a 459 px de alto. En móvil, CLS de 0,077.
- **Por qué importa:** el CLS «necesita mejorar» por encima de 0,1.
- **Cómo arreglarlo:** el CSS ya tiene la fórmula para la versión sin JavaScript (`style.css:676`). Úsala también con JavaScript, y así `fitName()` solo hace un ajuste fino:
  ```css
  .name{font-size:min(calc((100vw - 32px) / 2.95),48svh)}
  ```
- **Esfuerzo:** S.

#### S-01 · SEO · Alto: el texto del h1 que lee Google es «AALLOONNSSOO»
- **Dónde:** `index.html:78-83`, igual en `en/index.html`.
- **Qué pasa:** el h1 lleva `aria-label`, y el lector de pantalla lo anuncia bien, pero su texto real es `<i>A</i><b>A</b>…`. **Medido** en `dist/index.html`: el texto del h1 es `AALLOONNSSOO OSUNA SOTO`. Google indexa el texto, no el `aria-label`.
- **Cómo arreglarlo:** pon el nombre como texto oculto visualmente dentro del h1 y quita el `aria-label`:
  ```html
  <h1 class="name" id="name" translate="no">
    <span class="sr-only">Alonso Osuna Soto</span>
    <span class="word" id="word" aria-hidden="true">…</span>
    <span class="sur" id="sur" aria-hidden="true">OSUNA SOTO</span>
  </h1>
  ```
- **Esfuerzo:** S.

### Medio

#### A-04 · Accesibilidad · Medio: contraste de dos herramientas de la caja
- **Dónde:** `src/main.js:1860`. Texto blanco de 12 px y peso 600 (`style.css:565`).
- **Qué pasa:** «Palabras clave y SEO» sobre `#0A8A5C` da **4,37:1** y «CRMdelSol» sobre `#7A8500` da **4,05:1** (calculado). Las etiquetas de los cursores (`main.js:91`, `style.css:50`) usan los mismos dos colores, aunque son decorativas.
- **Por qué importa:** WCAG 1.4.3 Contraste mínimo (AA), que pide 4,5:1.
- **Cómo arreglarlo:** cambia `#0A8A5C` por `#087A50` (5,37:1) y `#7A8500` por `#667000` (5,41:1), en `TOOL_COLORS` y en `COLORS`.
- **Esfuerzo:** S.

#### A-05 · Accesibilidad · Medio: la etiqueta de las boyas de Nautes se cierra al ir hacia ella
- **Dónde:** `src/main.js:1432-1433` y `src/style.css:202` (`bottom:calc(100% + 6px)`).
- **Qué pasa:** la etiqueta se abre al pasar el ratón por la boya y se cierra con `pointerleave`. Al subir el ratón hacia la etiqueta se cruza el hueco de 6 px y se cierra.
- **Por qué importa:** WCAG 1.4.13 Contenido con hover o foco (AA): el contenido tiene que poder recorrerse con el puntero.
- **Cómo arreglarlo:** escucha `pointerleave` en el `<li>`, que contiene la boya y la etiqueta, y no en el botón. Otra opción es quitar el hueco con un `::before` transparente de 6 px en `.buoy-tag`.
- **Esfuerzo:** S.

#### A-06 · Accesibilidad · Medio: el marco de Alcar promete algo que no hace
- **Dónde:** `index.html:403` (`aria-label="Ver la web nueva de Alcar"`) y `src/main.js:1605` (sin URL pasa a ser un `<button>` que no navega).
- **Qué pasa:** el lector anuncia «Ver la web nueva de Alcar, botón», pero al pulsarlo solo se levanta la captura y aparece «Enlace pendiente». El nombre no describe la acción.
- **Cómo arreglarlo:** mientras `PORTAL_URL` esté vacío, cambia el `aria-label` a «Levantar la captura de la web nueva de Alcar» y añade `aria-describedby="portalNote"`.
- **Esfuerzo:** S.

#### P-04 · Rendimiento · Medio: los cuatro JSON de puntos se piden todos al cargar
- **Dónde:** `src/main.js:391-395` y `:2120`.
- **Qué pasa:** **medido** en móvil: `nautes-puntos.json` 50 KB, `apreton` 29,5 KB, `retrato` 29,5 KB y `movil` 25,8 KB comprimidos (480 KB sin comprimir). Todos se piden en el primer segundo, compiten con las fuentes y `boot()` espera hasta 1,4 s por ellos. Cada archivo trae los puntos de escritorio y de móvil, aunque solo se usa uno.
- **Cómo arreglarlo:** pide cada JSON cuando su sección está a una pantalla de distancia, con un `IntersectionObserver` y `rootMargin:'100% 0px'`, y no lo esperes en `boot()`. Separa `desktop` y `mobile` en dos archivos (por ejemplo, `retrato-puntos.d.json` y `.m.json`).
- **Esfuerzo:** M.

#### P-05 · Rendimiento · Medio: abrir el cuaderno es lento en móvil
- **Dónde:** `src/main.js:973` (`openLog`), `:1215-1233` (`artOpen`) y `:1150-1186` (`artTarget`, que ordena 1.200 o 2.400 puntos en el mismo clic).
- **Qué pasa:** **medido** en móvil con CPU ×4, INP del clic en «Ver cuaderno de ruta»: **344 ms**. El INP de las demás interacciones medidas (copiar email, Jefe de obra, Auditar, caja, Siguiente etapa) fue de 104 ms.
- **Cómo arreglarlo:** abre el diálogo y pinta la etapa 0 en un frame. Luego lanza `artTarget` en el siguiente `requestAnimationFrame`. Además, deja precalculada la etapa 0 (`artWarm`) cuando el móvil de Zalapp entra en pantalla, no al abrir.
- **Esfuerzo:** S.

#### P-06 · Rendimiento · Medio: un único bundle de 104 KB
- **Dónde:** `dist/assets/main-BJv3-luZ.js`: 104.286 bytes, 41.334 comprimido. El CSS pesa 54 KB, 11,6 KB comprimido.
- **Qué pasa:** todo el código va en la carga inicial: el arte del cuaderno, la caja de herramientas, el videomapping, Alcar, el Jefe de obra y la huelga. **Medido:** TBT en móvil de **448 ms**, con 5 tareas largas y la mayor de 279 ms. En escritorio, 11 ms.
- **Cómo arreglarlo:** carga en diferido las escenas que están por debajo del primer pantallazo (`import()` al acercarse, ver C-01). Con eso se podrían ahorrar unos 30–40 KB de JavaScript inicial; es una estimación.
- **Esfuerzo:** M.

#### C-01 · Código · Medio: `main.js` hace todo en 2.139 líneas
- **Dónde:** `src/main.js`, un solo IIFE (`:6-2139`) con estado compartido por variables de módulo (`SY`, `vw`, `cursors`, `paint`, `tone`…).
- **Propuesta de división, sin reescribir:** mover bloques tal cual y exportar lo que hoy es global.

  | Módulo | Líneas actuales | Carga |
  | --- | --- | --- |
  | `core/util.js` (`$`, `clamp`, `springStep`, `track`, `rm`, `small`) | 7-26 | inicial |
  | `core/tones.js` | 28-63 | inicial |
  | `core/crew.js` (cursores, `parker`/`stepPark`, `updateTeam`) | 89-193, 800-846 | inicial |
  | `hero/letters.js` + `hero/intro.js` | 65-87, 196-306 | inicial |
  | `dust/engine.js` (partículas, `sample`, `stops`, `layout`) | 308-640 | inicial |
  | `scenes/portrait-stamps.js` | 848-953 | `import()` al acercarse |
  | `scenes/nautes.js` (velero + boyas) | 642-798, 1414-1438 | `import()` |
  | `scenes/explora.js` | 1440-1590 | `import()` |
  | `scenes/zalapp.js` + `scenes/zalapp-art.js` | 955-1412 | `import()`; el arte, al abrir el cuaderno |
  | `scenes/alcar.js` | 1593-1763 | `import()` |
  | `scenes/mapping.js` | 1765-1857 | `import()` |
  | `scenes/toolbox.js` | 1859-1924 | `import()` |
  | `ui/contact.js`, `ui/boss.js`, `ui/strike.js`, `ui/audit.js` | 1926-2074 | inicial (son pequeños) |
  | `main.js` (bucle con registro de pasos y `boot`) | 2079-2138 | inicial |

  Para el estado compartido, crea un objeto `state` en `core/state.js` (`{SY,vw,vh,mouse,paint,introDone…}`) que los módulos importan. Cada escena exporta `{step(f,now), layout(), destroy?}` y se registra en `STEPS`.
- **Esfuerzo:** L, en varias tandas, una escena por commit.

#### C-02 · Código · Medio: el mismo texto vive en cuatro sitios
- **Dónde:** cinco conjuntos de datos están en `index.html`, en `en/index.html` y en `src/i18n.js`: sellos (`index.html:103-127` ↔ `i18n.js:69-84`), pasos de Nautes (`index.html:161-166` ↔ `i18n.js:28-33`), brújula (`index.html:190-193` ↔ `i18n.js:41-44`), diario (`index.html:197-201` ↔ `i18n.js:315-331`) y herramientas (`index.html:459-474` ↔ `i18n.js:91-108`). Los comentarios de `i18n.js:62-63` y `:314` ya avisan de que hay que cambiarlos a mano.
- **Medido:** la estructura de los dos HTML es idéntica línea a línea (493 líneas cada uno). **La única diferencia que no es de texto** es el orden del selector de idioma (`index.html:71` frente a `en/index.html:71`), y es intencionada. Ya hay una deriva: `i18n.js:196` y `:198` usan `You've` y `You'll` con apóstrofo recto, mientras `en/index.html:190` y `:192` usan `’`. En `i18n.js` en inglés se mezclan los dos apóstrofos.
- **Cómo arreglarlo:** genera los bloques `<noscript>` desde `i18n.js` en el build con un plugin de Vite (`transformIndexHtml`) y deja en el HTML marcadores como `<!--@tools-->`. A medio plazo, una sola plantilla para los dos idiomas.
- **Esfuerzo:** M.

#### AN-01 · Analítica · Medio: `ANALITICA.md` no coincide con el código
- **Dónde:** `ANALITICA.md:21-55` frente a las llamadas a `track()` en `main.js`.
- **Qué pasa:**
  - El documento cita `portal-alcar` (`ANALITICA.md:32`), pero el código envía `alcar-obra` con `{accion:'levantar'|'entrar'}` (`main.js:1675`, `:1686`).
  - Según el documento, `auditar-nota` va «de 1 a 12» con 12 nombres (`ANALITICA.md:26`, `:44-55`). Hay 14 notas y con otros nombres (`i18n.js:147-162`).
  - Seis eventos no están documentados: `nautes-velero` (`main.js:743`), `nautes-web` (`:686`), `zalapp-etapa` (`:999`), `zalapp-movil` con `encender`/`cuaderno`/`web` (`:1305`, `:1310`, `:1349`, `:1355`), `explora-brujula` (`:1509`) y `explora-pieza` (`:1552`).
- **Cómo arreglarlo:** actualiza la tabla. Si no, en Umami verás eventos que no sabrás leer.
- **Esfuerzo:** S.

#### AN-02 · Analítica · Medio: no se mide la conversión principal
- **Dónde:** `index.html:483` (enlace `mailto:`, sin evento) y `src/main.js:1928-1934`.
- **Qué pasa:** el objetivo del portfolio es que te escriban, y el clic en el email no se registra. `email-copiado` se envía antes de saber si se copió (`main.js:1929`) y no distingue el caso en que solo se selecciona el texto (`fallback`). Tampoco se miden los clics del menú ni el cierre del cuaderno, que diría cuántas etapas se leen.
- **Cómo arreglarlo:**
  ```js
  $('#mail a').addEventListener('click',()=>track('email-clic'));
  // copiar: un evento con el resultado
  navigator.clipboard.writeText(mail).then(()=>{track('email-copiado',{modo:'portapapeles'});ok()},()=>{track('email-copiado',{modo:'seleccion'});fallback()});
  $$('.top a[href^="#"]').forEach(a=>a.addEventListener('click',()=>track('menu',{a:a.getAttribute('href')})));
  zDlg.addEventListener('close',()=>track('zalapp-cerrar',{etapa:zLog.cur+1}));
  ```
  En Umami, crea un embudo: visita → `scroll-contacto` → `email-clic`, `email-copiado`, `linkedin` o `cv-descargado`.
- **Esfuerzo:** S.

#### SEO-01 · SEO · Medio: título pobre y sin datos estructurados
- **Dónde:** `index.html:6` y `en/index.html:6` (`<title>Alonso Osuna</title>`), y `index.html:7` (la descripción tiene 82 caracteres).
- **Qué pasa:** el título no dice a qué te dedicas y es igual en los dos idiomas. No hay JSON-LD.
- **Cómo arreglarlo:**
  ```html
  <title>Alonso Osuna Soto · Marketing digital, contenidos y web | Portfolio</title>
  <meta name="description" content="Portfolio de Alonso Osuna Soto, estudiante de Marketing y Publicidad en Córdoba: contenidos y SEO en WordPress, investigación de mercado, IA y videomapping. Disponible para prácticas y primer empleo.">
  <script type="application/ld+json">
  {"@context":"https://schema.org","@graph":[
   {"@type":"WebSite","@id":"https://aosuna.es/#web","url":"https://aosuna.es/","name":"Alonso Osuna","inLanguage":["es","en"]},
   {"@type":"ProfilePage","@id":"https://aosuna.es/#page","url":"https://aosuna.es/","isPartOf":{"@id":"https://aosuna.es/#web"},"mainEntity":{"@id":"https://aosuna.es/#alonso"},"inLanguage":"es"},
   {"@type":"Person","@id":"https://aosuna.es/#alonso","name":"Alonso Osuna Soto","url":"https://aosuna.es/","email":"mailto:alonsoosunasoto@gmail.com",
    "jobTitle":"Estudiante de Marketing y Publicidad","address":{"@type":"PostalAddress","addressLocality":"Córdoba","addressCountry":"ES"},
    "alumniOf":[{"@type":"EducationalOrganization","name":"IES Luis de Góngora"},{"@type":"EducationalOrganization","name":"IES Fernando III"}],
    "knowsAbout":["Marketing digital","SEO","WordPress","Contenidos","Videomapping"],
    "sameAs":["https://www.linkedin.com/in/alonso-osuna-soto-23522835b/"]}]}
  </script>
  ```
  La CSP no lo bloquea: un bloque `application/ld+json` no se ejecuta. En `/en/` usa `inLanguage:"en"` y `jobTitle` en inglés.
- **Esfuerzo:** S.

#### UX-01 · Engagement · Medio: no hay un acceso fijo al contacto
- **Dónde:** `index.html:46-49` (el dock solo tiene «Auditar esta web» y «Jefe de obra») y `src/style.css:592` (en móvil, el menú oculta «Herramientas»).
- **Qué pasa:** el email, LinkedIn y el CV solo aparecen en la última sección. A mitad de un proyecto, la única vía es el enlace «Contacto» del menú, en letra mono de 11 px.
- **Cómo arreglarlo:** añade al dock un tercer botón «Escríbeme», un enlace a `#contacto` con estilo de acento. Valora repetir «Escríbeme» al final del cuaderno de Zalapp (etapa «El equipo»), que es donde más interés hay.
- **Esfuerzo:** S.

#### D-01 · Despliegue · Medio · Pendiente de verificar en producción: `/en` sin barra
- **Dónde:** `nginx.conf:39-43` (`try_files $uri $uri/ =404`), con nginx escuchando en 8080 detrás de Caddy.
- **Qué pasa:** según cómo resuelva nginx el directorio, `/en` se sirve directamente o responde con un 301. Si es un 301 con la configuración por defecto (`absolute_redirect on`, `port_in_redirect on`), la cabecera `Location` puede salir como `http://aosuna.es:8080/en/`, y ese puerto no está publicado. No lo he podido comprobar sin el servidor real. En local, mi servidor de prueba sí redirige a `/en/`.
- **Cómo comprobarlo:**
  ```sh
  curl -sI https://aosuna.es/en | grep -iE "^HTTP|^location"
  ```
- **Cómo arreglarlo, por si acaso:** añade `absolute_redirect off;` en el bloque `server` de `nginx.conf`. Así las redirecciones son relativas y no llevan puerto.
- **Esfuerzo:** S.

### Bajo

| ID | Área | Dónde | Qué pasa | Cómo arreglarlo | Esf. |
| --- | --- | --- | --- | --- | --- |
| A-07 | A11y | `style.css:42-44`; medido: enlace «EN» de 16×25 px (16×36 en móvil) | Menos de 24 px de ancho. Cumple 2.5.8 por la excepción de espacio, pero es fácil fallar el toque. | `.top .lang a{min-width:24px;text-align:center}` | S |
| A-08 | A11y | `index.html:45-63` | `#pins`, `#dock`, `#note` y `#boss` quedan fuera de los landmarks. Los 14 pines van antes del dock en el DOM, pero se ven repartidos por la página (2.4.3, orden del foco). | Mete el dock y los paneles en un `<div role="region" aria-label="Herramientas de la página">` y pon `#pins` después de `#note`. | S |
| A-09 | A11y | `index.html:50`, `:451` | `aria-live` en todo `#note` y todo `#tool`: anuncia también los botones («Anterior Siguiente Cerrar», «Volcar la caja»). | Pon `aria-live` solo en el contenedor del texto (`#nText`, `#tWhere`/`#tLevel`). | S |
| A-10 | A11y | `index.html:221`, `:322-323` | Tres capturas con el mismo `alt` («Pantalla del mapa de la beta de Zalapp»). | Distingue iPhone y Android. | S |
| A-11 | A11y | `main.js:18` | `rm` se lee una sola vez: si alguien cambia la preferencia con la página abierta, no se aplica. | `matchMedia(...).addEventListener('change',()=>location.reload())` o actualizar `rm`. | S |
| A-12 | A11y | `main.js:963`, `:1863` | `aria-pressed` en grupos de opción única (filtros de Zalapp y herramientas). Funciona, pero `aria-pressed` describe interruptores independientes. | Es aceptable. Si quieres afinar: `role="radiogroup"` y `role="radio"` con `aria-checked`. | S |
| P-07 | Rend. | `index.html:405` | `alcar.webp` (36 KB) se pide al cargar (medido a los 352 ms), aunque está muy por debajo del primer pantallazo. | `loading="lazy"` en `.plan-shot`. | S |
| P-08 | Rend. | `src/fonts.js:2-8` | Sin `preload` de la fuente del nombre. `font-display:swap` y los `unicode-range` están bien: medido, solo se descargan los subsets latinos (8 archivos woff2, unos 125 KB). | `<link rel="preload" as="font" type="font/woff2" crossorigin href="…big-shoulders-display-latin-900-normal-….woff2">` (con un plugin, porque el hash cambia en cada build). | S |
| P-09 | Rend. | `public/boot.js` | Script clásico síncrono de 236 bytes en `<head>` (`index.html:32`): bloquea el análisis una ida y vuelta. Pone las clases `js`, `intro` y `locked` antes del primer pintado, que es lo que se busca. | Mantenerlo. La alternativa sería ponerlo inline con un hash en la CSP (`'sha256-…'`), pero no compensa. | — |
| C-03 | Código | `main.js:2077`, `:520-524`; `:325`, `:326`, `:328`; `:31` | Código muerto: `signs=[]` («muro de firmas») se recorre en cada frame; las formas `bolt`, `olive` y `boat` y el tono `olive` no se usan en ningún `data-shape`, `data-fallback` ni `data-tone`. | Quitarlo o dejarlo en una rama. | S |
| C-04 | Código | `main.js:2128` | El comentario dice «Google Fonts puede llegar tarde», pero las fuentes son propias. | Corregir el comentario. | S |
| C-05 | Código | `main.js:26` | `track()` es seguro: usa `window.umami?.track` dentro de `try`. Correcto. Medido: sin Umami, el único error de consola es el script bloqueado (`net::ERR_FAILED`). Con el ID de ejemplo, Umami recibiría peticiones con un ID que no existe. | Ver B1. | — |
| C-06 | Compat. | `main.js:327`, `:1099`, `:1110` | `CanvasRenderingContext2D.roundRect` necesita Safari 16 o posterior. En iOS 15, el cuaderno lanzaría un `TypeError` (la portada usa `bubble` solo como forma de reserva). `overflow:clip` (`style.css:550`) también es de Safari 16, pero ya tiene arreglo en `main.js:1768`. | Comprobar si existe: `if(!c.roundRect)c.roundRect=(x,y,w,h)=>c.rect(x,y,w,h)`. | S |
| S-02 | SEO | `index.html:69`, `:141` | «Proyectos» en el menú lleva a `#proyectos`, que es el artículo de Nautes, no el encabezado «Toca, que están vivos» (`#trabajo`). | Mueve `id="proyectos"` a `<section id="trabajo">` o cambia el enlace. | S |
| S-03 | Copy | `index.html:178` | «…Hoy estudio Marketing y Publicidad en Córdoba. Ahí trabajé en Nautes…»: la frase del medio rompe la lectura y el segundo «Ahí» parece referirse a Córdoba. | Quita «Hoy estudio…» de este párrafo. | S |
| SEC-01 | Seguridad | `nginx/security-headers.conf:7` | `interest-cohort=()` es una directiva obsoleta y Chrome avisa en la consola («Unrecognized feature»). | Quítala. | S |
| SEC-02 | Seguridad | `public/cv/LEEME.txt` | Las instrucciones internas se publican: medido, `GET /cv/LEEME.txt → 200`. | Muévelo fuera de `public/` o añádelo a un filtro del build. | S |
| SEC-03 | Despliegue | `Dockerfile:2`, `:10`; `compose.yaml` | Sin `HEALTHCHECK`, imágenes sin fijar por versión o digest, y sin límite de logs. | Ver el bloque de abajo. | S |
| SEC-04 | Seguridad | `CADDY.md:12` | HSTS de un año con `includeSubDomains` desde el primer día. `CADDY.md:34` ya recomienda empezar con 300 s, bien. **No** conviene `preload` mientras pruebes subdominios. | Sigue el propio `CADDY.md`: 300 s, luego 31536000. | — |
| AN-03 | Privacidad | `main.js:1991` | `jefe-orden` envía a Umami el texto libre que escribe la gente (`ANALITICA.md:57` ya lo avisa). | Envía solo la orden reconocida (`dance`, `paint:red`…) o `desconocida`. | S |

Bloque propuesto para SEC-03:
```dockerfile
# Dockerfile: fija la versión exacta que estés usando hoy (o su digest @sha256:…)
FROM node:24-alpine AS build          # → p. ej. node:24.x.y-alpine
…
FROM nginxinc/nginx-unprivileged:stable-alpine   # → p. ej. :1.x.y-alpine
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO /dev/null http://127.0.0.1:8080/ || exit 1
```
```yaml
# compose.yaml
    logging:
      driver: json-file
      options: { max-size: "10m", max-file: "3" }
```

---

## 4. Métricas medidas

**Fecha:** 9 de noviembre de 2026, sobre el build de producción (`dist/`, 11:51).

**Herramientas:** Chrome for Testing 153 sin pantalla con Playwright 1.63 y scripts propios (PerformanceObserver para LCP, CLS, long tasks y Event Timing; CDP para la limitación de red y CPU y para las métricas de CPU).

**Lo que no he podido ejecutar:** Lighthouse, axe-core y pa11y no estaban instalados y el entorno no tiene red para instalarlos. Tampoco `npm run build` ni `npm run preview`, porque `node_modules` solo trae los binarios de Windows de esbuild y rollup. He usado el `dist/` que ya habías generado, con un servidor local que imita nginx y Caddy: gzip, 404 real, `Cache-Control` y la misma CSP. Umami estaba bloqueado. No he probado en Safari iOS, Chrome Android ni Firefox reales.

| Métrica | Móvil (412×823, DPR 1,75, 150 ms RTT, 1,6 Mbps, CPU ×4) | Escritorio (1350×940, 40 ms, 10 Mbps, CPU ×1) | Umbral «bueno» |
| --- | --- | --- | --- |
| FCP | 1.100 ms | 300 ms | ≤ 1.800 ms |
| **LCP** | **9.152 ms** (`p.lead`) | **3.292 ms** (letra `<i>`) | ≤ 2.500 ms |
| **CLS** | 0,077 | **0,146** (`H1#name`) | ≤ 0,1 |
| TBT (aprox., tareas largas tras el FCP) | 448 ms (5 tareas, máx. 279 ms) | 11 ms | ≤ 200 ms |
| INP (9 interacciones: copiar, Jefe, Auditar, caja…) | 104 ms | 72 ms | ≤ 200 ms |
| INP al abrir el cuaderno de Zalapp | **344 ms** | — | ≤ 200 ms |
| Fin de la intro | 8.275 ms | 6.551 ms | — |
| Transferencia / peticiones | 324 KB / 21 | 324 KB / 21 | — |
| Hilo principal en reposo | 565 ms/s | 195 ms/s (arriba) – 475 ms/s (contacto) | — |
| rAF en reposo con «reducir movimiento» | — | 60/s, y el canvas del videomapping se sigue animando | 0 |

**Comprobaciones de accesibilidad (scripts propios en lugar de axe):**
- Encabezados: un solo h1. Los h2 vacíos (`#nTitle`, `index.html:52`) y «Da una orden» están dentro de paneles `hidden`, así que no se anuncian. Bien.
- Nombres accesibles: ningún botón ni enlace visible sin nombre. Sin IDs duplicados.
- Recorrido con Tab (95 pasos): todos los elementos con foco visible (`outline` de 2 px). **No aparecen** `#nautesBoat` ni `#zalappPhone` (A-01).
- Diálogo `#zDialog`: al abrirlo, el foco va a «Cerrar cuaderno». El Tab da la vuelta dentro del diálogo; las flechas cambian de etapa y se anuncia, por ejemplo, «Etapa 2 de 9. KM 47 · 09:15. La encuesta». **Escape** lo cierra y devuelve el foco al botón que lo abrió. Correcto.
- Jefe de obra: `/` lo abre con el foco en el campo. «Rompe el nombre» responde por `aria-live`. Escape lo cierra y devuelve el foco a `#bBoss`. Correcto.
- Reflow a 320 px y zoom al 200 % (675 px CSS): sin scroll horizontal de página (`scrollWidth = clientWidth`). El diario de piezas desborda dentro de su propio carrusel, lo cual es intencionado.
- Contraste de las 9 paletas `data-tone`: tinta sobre fondo entre 15,3 y 19,1:1, acento sobre fondo entre 6,1 y 11,4:1. Todas cumplen. Fallan dos colores de herramienta (A-04).
- Sin JavaScript: en `main` se leen 10.580 caracteres; las 9 etapas del cuaderno, las listas `<noscript>`, la captura de Alcar y el botón del CV se ven. **Es cierto que la web se lee sin JavaScript.**
- 404: `/en/no-existe` devuelve **404**, con `lang="en"` y textos en inglés.

---

## 5. Lo que está bien hecho y conviene no tocar

- **Enlace de salto** a `main#contenido` con `tabindex="-1"` (`index.html:36`, `:75`) y `scroll-padding` para que la barra y el dock no tapen el foco (`style.css:19-20`).
- **Cuaderno de Zalapp:** `<dialog>` nativo con `showModal()`, foco devuelto al cerrar (`main.js:975`), `aria-disabled` en lugar de `disabled` para no perder el foco (`:993-994`), marcas del tacógrafo con nombre y `aria-current="step"` (`:995`, `:1004`), anuncio de cada etapa (`:998`) y páginas fuera de vista con `inert` (`:984`).
- **Escape cierra todo** y el atajo `/` no se dispara mientras se escribe (`main.js:1997-2001`). Los paneles devuelven el foco al botón que los abrió (`:1994`, `:2064`).
- **Alternativas al arrastre** en las letras (los chips del Jefe de obra: «Rompe el nombre», «Traed la O»), en la caja (cada herramienta es un botón) y en el cuaderno (botones además de deslizar).
- **Reducir movimiento:** sin intro desde `boot.js`, sin cursores, contadores directos y fundidos en lugar de giros (`style.css:490-500`, `:538-542`, `:645-647`). Solo faltan el bucle y el videomapping (A-02, P-02).
- **Canvas:** `devicePixelRatio` limitado a 1,6 (`main.js:475`, `:1196`, `:1620`), el bucle del cuaderno solo corre con el diálogo abierto (`:1246-1249`), `IntersectionObserver` para el videomapping, la caja y Alcar (`:1846`, `:1917`, `:1616`), lecturas y escrituras separadas para evitar el *layout thrashing* (`:920-922`, `:2070`) y transformaciones que solo se escriben si cambian. **No he encontrado fugas** de listeners ni de rAF: todo se registra una vez y `countUp` y el cuaderno cancelan sus frames. Con la pestaña oculta, el navegador detiene `requestAnimationFrame` y la huelga comprueba `document.hidden` (`:2020`).
- **Fuentes propias** con `@fontsource`, `font-display:swap` y `unicode-range` (solo se bajan los subsets latinos), y `assetsInlineLimit:0` para no necesitar `data:` en la CSP (`vite.config.js:8-9`).
- **CSP estricta** sin `unsafe-inline` y sin errores de CSP en consola. Cabeceras repetidas en cada `location`, con `always` para que salgan también en el 404 (`nginx.conf:16-43`). `/assets/` inmutable y HTML `no-cache`.
- **Contenedor:** `nginx-unprivileged`, `read_only`, `cap_drop: ALL`, `no-new-privileges`, límites de memoria, CPU y PIDs, y sin puertos publicados (`compose.yaml`).
- **Internacionalización:** `hreflang` es, en y x-default recíprocos en los dos HTML y en `sitemap.xml` con `xhtml:link`, `og:locale` cruzados, `og.png` y `og-en.png` de 1200×630, y la 404 elige idioma por ruta o por navegador (`src/404.js`).
- **Selector de idioma:** los `<span aria-hidden>` dejan un único enlace con `lang="en"`, `hreflang="en"` y nombre «English version (EN)». El nombre contiene el texto visible (2.5.3). Se entiende bien con lector de pantalla.
- **Textos honestos:** niveles reales de cada herramienta y avisos de «objetivos propuestos, todavía no conseguidos». Es un punto fuerte del portfolio.

---

## 6. Plan de acción

### Hoy (antes de publicar)
1. **B1:** ID de Umami y `data-domains="aosuna.es"` en los dos HTML.
2. **B2 y B3:** subir `alonso-osuna-cv-en.pdf` y hacer commit de los dos PDF.
3. **A-01:** enlaces de texto «Ver nautes.es ↗» y «Abrir el cuaderno de ruta» en las fichas de Nautes y Zalapp.
4. **P-01 y E-01:** lema y entradilla visibles desde el principio. `boot()` sin esperar los JSON.
5. **A-04:** los dos colores de herramienta.
6. Desplegar y comprobar en producción:
   ```sh
   curl -sI https://aosuna.es/ | grep -iE "^HTTP|content-security|strict-transport|x-frame|cache-control"
   curl -sI https://aosuna.es/assets/$(curl -s https://aosuna.es/ | grep -o 'main-[^"]*\.js' | head -1) | grep -i cache-control   # immutable
   curl -sI https://aosuna.es/en | grep -iE "^HTTP|^location"        # D-01: 200, o 301 sin :8080
   curl -sI https://aosuna.es/no-existe | head -1                     # 404
   curl -sI https://aosuna.es/cv/alonso-osuna-cv-en.pdf | head -1     # 200
   curl -sI https://www.aosuna.es/x | grep -iE "^HTTP|^location"      # 301 a https://aosuna.es/x
   curl -sI -H "Accept-Encoding: zstd, gzip" https://aosuna.es/retrato-puntos.json | grep -i content-encoding
   ```
   Después, una pasada de PageSpeed Insights (Lighthouse) y de axe DevTools sobre la URL real, para completar el apartado 4.

### Esta semana
- **A-02 y P-02:** botón «Pausar animaciones», bucle que duerme en reposo y videomapping quieto con `rm`.
- **A-03:** videomapping con toques sueltos.
- **P-03:** `font-size` inicial del nombre en CSS (CLS).
- **S-01 y SEO-01:** h1 con texto real, título, descripción y JSON-LD.
- **AN-01 y AN-02:** actualizar `ANALITICA.md`, evento `email-clic` y embudo en Umami.
- **UX-01:** «Escríbeme» en el dock.
- **P-04 y P-05:** JSON en diferido y apertura del cuaderno en dos frames.
- **A-05 y A-06**, **D-01** (`absolute_redirect off`), **SEC-01 a SEC-03** y los «Bajo» de esfuerzo S.

### Más adelante
- **C-01 y P-06:** dividir `main.js` en módulos y cargar las escenas con `import()`.
- **C-02:** generar los `<noscript>` desde `i18n.js` en el build.
- **C-06** y prueba real en Safari iOS, Chrome Android y Firefox, sobre todo el arrastre de esquinas, que acabas de cambiar.
- HSTS: de 300 s a 31536000 cuando todo vaya bien. Sin `preload`.
- Volver a medir con Lighthouse y axe y actualizar las notas de esta auditoría.

---

## 7. Correcciones aplicadas (9 de noviembre de 2026)

Rama `correcciones-auditoria`, creada desde `explora-brujula` (sin push ni merge). Primero, un commit con lo que había sin commitear (`8de9609`, «Estado previo a las correcciones», con los dos CV) y otro con esta auditoría (`1b65de8`). Después, un commit por ID o por grupo pequeño de IDs.

**Cómo se ha verificado:** `npm run build` sin errores (`node_modules` de Windows, sin `npm ci`). `dist/` servido con un servidor local que manda la CSP de `nginx/security-headers.conf`. Chrome 153 sin pantalla por CDP con scripts propios y Lighthouse 13.6. No he usado axe por separado: Lighthouse ya pasa las reglas de axe en su categoría de accesibilidad. No he probado en Safari iOS, Chrome Android ni Firefox reales, ni el build de Docker (el daemon no estaba en marcha).

### Estado de cada ID

| ID | Estado | Commit | Nota |
| --- | --- | --- | --- |
| B1 | parcial | `dd7f507` | `data-domains="aosuna.es"` en los dos HTML. Falta el Website ID: sigue `UMAMI_WEBSITE_ID`. |
| B2 | hecho | `8de9609` | `public/cv/alonso-osuna-cv-en.pdf` en el commit de estado previo. |
| B3 | hecho | `8de9609` | `public/cv/alonso-osuna-cv-es.pdf` (la versión sin teléfono) en git. |
| B4 | hecho | `640e5cd` | Ver A-01. |
| B5 | no hecho | — | `ZALAPP_URL`, `PORTAL_URL` y las `url` de `ENTREGAS` siguen vacías: hacen falta las direcciones. |
| A-01 | hecho | `640e5cd` | «Ver nautes.es ↗» y «Abrir el cuaderno de ruta» en las fichas (también sin JavaScript). `#nautesBoat` y `#zalappPhone` siempre en el Tab: al enfocarlos, la página baja a su parada y se activan al llegar. Arreglado de paso un `TypeError` en cada frame de `stepGo` mientras no llegaba el JSON de Nautes. |
| P-01 | hecho | `84c2dc9` | Lema y entradilla desde el primer pintado. Sin «Cargando N %». `boot()` solo espera la fuente del nombre (600 ms como mucho). |
| E-01 | hecho | `84c2dc9` | Intro de unos 1,7 s (tope de 2,4 s), solo la primera vez en la sesión. |
| A-02 | hecho | `7bdf62f` | «Pausar animaciones» en el dock, con `aria-pressed` y guardado en `localStorage`. En pausa: sin cursores, sin ruido, sin sonar, sin huelga, sin intro y el videomapping quieto. |
| P-02 | hecho | `7bdf62f`, `09baa7a` | El bucle duerme en reposo. Inventario de qué mantiene vivo cada paso en el comentario de `STEPS`. |
| A-03 | hecho | `b915320` | Tocar un asa la selecciona y el siguiente toque la lleva allí (con imán). «Pruébalo» lo explica. |
| P-03 | hecho | `1f87a10` | Tamaño inicial del nombre en CSS; queda a menos del 3 % del final de `fitName()`. |
| S-01 | hecho | `57d9254`, `b23e60e` | El h1 empieza por «Alonso Osuna Soto» en `dist/`; nombre accesible sin mayúsculas forzadas. |
| A-04 | hecho | `8c6b217` | `#087A50` (5,37:1) y `#667000` (5,41:1). |
| A-05 | hecho | `6483578`, `ad0c92c` | `pointerleave` en el `<li>` y puente sobre el hueco. Además, la mitad de arriba de la etiqueta quedaba tapada por `#nautesBoat`: ahora va por encima. |
| A-06 | hecho | `9be8d2c` | Sin URL: «Levantar la captura de la web nueva de Alcar», con `aria-describedby="portalNote"`. |
| P-04 | parcial | `8785a99`, `09baa7a` | Cada JSON se pide a una pantalla de distancia. No he separado `desktop` y `mobile` en dos archivos: pediste no cambiar el formato. |
| P-05 | hecho | `acf1ec8` | Diálogo y etapa 0 en un frame (antes de `showModal()` solo queda maquetada esa); el arte y las otras etapas, después. La etapa 0 se precalcula al acercarse el móvil. |
| P-06 | no hecho | — | Fuera de alcance. |
| C-01 | no hecho | — | Fuera de alcance. |
| C-02 | no hecho | — | Fuera de alcance. |
| AN-01 | hecho | `39c7321` | Tabla de eventos rehecha desde el código, notas 1-14 y «Embudo de contacto». |
| AN-02 | hecho | `0d2350c` | `email-clic`, `email-copiado` con `modo`, `menu` y `zalapp-cerrar`. |
| AN-03 | hecho | `0d2350c` | `jefe-orden` solo envía la orden reconocida o `desconocida`. |
| SEO-01 | hecho | `e64c19c` | Título, descripción, og/twitter:title y JSON-LD en los dos idiomas. |
| UX-01 | hecho | `5657ac8` | «Escríbeme» / «Get in touch». Por debajo de 540 px, los secundarios van en «Más». No he repetido «Escríbeme» al final del cuaderno (era opcional). |
| D-01 | hecho | `6629db9` | `absolute_redirect off;`. Falta comprobarlo en producción con `curl`. |
| A-07 | hecho | `ae5c7c3` | 24×36 px en móvil. |
| A-08 | hecho | `ae5c7c3` | Región «Herramientas de la página» / «Page tools»; `#pins` después de `#note`. |
| A-09 | hecho | `ae5c7c3` | `aria-live` solo en los textos de `#note` y `#tool`. |
| A-10 | hecho | `ae5c7c3` | Alt distintos para iPhone y Android. |
| A-11 | hecho | `7bdf62f` | `rm` se actualiza con `matchMedia('change')`, sin recargar. |
| A-12 | no hecho | — | No estaba en la lista; la auditoría ya lo daba por aceptable. |
| P-07 | hecho | `4dc3e91` | `loading="lazy"`; con JavaScript se pide al estar a una pantalla (recortada del todo, Chrome no la pedía hasta levantarla). |
| P-08 | no hecho | — | Fuera de alcance. |
| P-09 | — | — | Se mantiene, como recomendaba la auditoría. |
| C-03 | hecho | `a2dd2ef` | Fuera `signs`, `bolt`, `olive`, `boat` y el tono `olive`. |
| C-04 | hecho | `a2dd2ef` | |
| C-05 | — | — | Correcto; depende de B1. |
| C-06 | hecho | `a2dd2ef` | Respaldo de `roundRect` con `arcTo`; probado quitando el nativo. |
| S-02 | hecho | `40fde85` | «Proyectos» y «Id a proyectos» llevan a `#trabajo`. |
| S-03 | no hecho | — | No estaba en la lista. |
| SEC-01 | hecho | `6629db9` | |
| SEC-02 | hecho | `6629db9` | Ahora en `docs/LEEME-cv.txt`. |
| SEC-03 | parcial | `6629db9` | `HEALTHCHECK` y rotación de logs. Las versiones de las imágenes no están fijadas (hay un comentario). `compose.yaml` validado con `docker compose config`; sin probar el build. |
| SEC-04 | — | — | No requiere cambios en el repositorio. |

### Métricas antes y después

Mismo método antes (sobre `1b65de8`) y después (sobre `09baa7a`). Son mis medidas en este equipo, así que los números absolutos no coinciden con los del apartado 4 (otra máquina y Playwright), pero la comparación entre las dos columnas sí vale. El Chrome sin pantalla no va sincronizado con la pantalla: el bucle corre a unos 180 frames/s en vez de 60.

| Métrica | Antes | Después |
| --- | --- | --- |
| Móvil (412×823, 150 ms, 1,6 Mbps, CPU ×4): LCP | 9.860 ms (`p.lead`) | 1.204–1.344 ms (`p.lead`) |
| Móvil: FCP | 1.472 ms | 1.204–1.344 ms |
| Móvil: CLS | 0,034 | 0,045–0,048 (el cambio de fuente del nombre) |
| Móvil: TBT | 308 ms | 332–383 ms |
| Escritorio (1350×940, 40 ms, 10 Mbps): LCP | 3.604 ms | 844–1.088 ms |
| Escritorio: CLS | 0,135 | 0,027–0,029 |
| Escritorio: TBT | 0 ms | 1–11 ms |
| Fin de la intro, desde la navegación (escritorio / móvil) | 7.060 / 9.400 ms | ~2.100 / ~4.000 ms (la intro en sí dura ~1,7 s) |
| Reposo 4 s con «reducir movimiento», arriba / en el videomapping | 180 frames/s y 148 / 364 ms/s de tareas | 0 frames/s y 0 ms/s |
| Reposo 4 s en pausa, arriba / en el videomapping | — | 0 frames/s y 0 ms/s |
| Reposo 4 s con animaciones, arriba / en contacto | 180 frames/s, 366 / 543 ms/s | 144 frames/s, 290 / 457 ms/s (los cursores siguen a la vista: es lo esperado) |
| INP al abrir el cuaderno (móvil, CPU ×4, 3 intentos) | 472–736 ms | 224–296 ms |
| JSON de puntos pedidos al cargar | 4 | 1 (`retrato-puntos.json`) |
| `alcar.webp` al cargar | sí (a los 81 ms) | no |

Lighthouse 13.6 después (antes no se pudo pasar):

| Página | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/`, móvil | 98 | 97 | 96 | 100 | 1,9 s | 0,042 | 30 ms |
| `/`, escritorio | 100 | 97 | 96 | 100 | 0,7 s | 0,023 | 0 ms |
| `/en/`, móvil | 96 | 97 | 96 | 100 | 2,1 s | 0,012 | 100 ms |
| `/en/`, escritorio | 99 | 97 | 96 | 100 | 0,7 s | 0,009 | 0 ms |

Lo que baja la nota en buenas prácticas es el script de Umami, que en local no resuelve. Las cabeceras de caché son las del servidor de pruebas, no las de nginx.

### Comprobaciones

- **Consola:** sin errores en un recorrido completo (scroll de arriba abajo, Jefe de obra, Auditar con las 14 notas, el cuaderno entero y la pausa), salvo Umami bloqueado. Sin violaciones de CSP. En `/` y en `/en/`.
- **Tab de principio a fin:** 57 paradas desde el enlace de salto hasta «Descargar CV», todas con foco visible. Orden: «Ver nautes.es ↗», el velero (se transforma al llegar), las boyas, la brújula, el diario, «Abrir el cuaderno de ruta», el móvil (se enciende) y sus dos botones, y luego Alcar. Igual en `/en/` y en móvil.
- **Cuaderno:** se abre con Intro y el foco va a «Cerrar cuaderno». El Tab no sale del diálogo, las flechas cambian de etapa (se anuncian) y Escape cierra y devuelve el foco. También con «reducir movimiento».
- **Reducir movimiento:** 0 frames/s en reposo, videomapping quieto y sin cursores; las esquinas se siguen moviendo.
- **Sin scroll horizontal** a 320 px ni al 200 % (675×470), recorriendo toda la página, en los dos idiomas.
- **Sin JavaScript:** se lee entera (10.643 caracteres en `main`), con «Ver nautes.es ↗», «Abrir el cuaderno de ruta», las 9 etapas y el CV. El h1 empieza por «Alonso Osuna Soto».

### Pendientes para Alonso

1. **ID de Umami:** cambiar `UMAMI_WEBSITE_ID` en `index.html` y `en/index.html` (ver `ANALITICA.md`) y crear en Umami el embudo de contacto.
2. **Comprobar en producción** con los `curl` del apartado 6, sobre todo `/en` (D-01), `/cv/alonso-osuna-cv-en.pdf` (200) y que `/cv/LEEME.txt` ya da 404.
3. **Probar en Safari iOS, Chrome Android y Firefox reales:** el arrastre y los toques del videomapping, el botón de pausa, el cuaderno y el velero o el móvil con teclado.
4. **Fijar las versiones de las imágenes de Docker** (`Dockerfile`) y hacer un `docker compose build` para comprobar el `HEALTHCHECK` y `nginx -t`.
5. **Enlaces pendientes (B5):** `ZALAPP_URL`, `PORTAL_URL` y las `url` de las entregas del diario.
6. **Encontrado con Lighthouse, sin tocar porque no estaba en la lista:**
   - El botón naranja de Zalapp («Ver cuaderno de ruta», `.app-btn-main`) tiene un contraste de 3,04:1 (blanco sobre `#F26B2C`). Sale en la captura de reserva, en la hoja del móvil y sin JavaScript. Opciones: texto azul petróleo `#102D3C` sobre el mismo naranja (4,73:1, los dos colores de la marca) o un naranja más oscuro como `#C2410C` con texto blanco (5,18:1).
   - Lighthouse marca el enlace de idioma porque su nombre («English version (EN)») no empieza por el texto visible («EN»). La auditoría lo daba por bueno (2.5.3); si quieres que pase la regla de axe, «EN · English version».
7. **Rendimiento en móvil que sigue alto:** el TBT con CPU ×4 (332-383 ms) y el INP al abrir el cuaderno (224-296 ms) siguen por encima de 200 ms. El siguiente paso son P-06 y C-01: cargar las escenas con `import()`.
