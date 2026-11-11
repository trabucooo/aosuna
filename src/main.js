import './fonts.js';
import './style.css';
import { T, ES, LANG, ENTREGAS } from './i18n.js';
import alcarShot from './assets/alcar.webp';

/* Toda la web arranca al llamar a start(). La llaman las dos entradas: main-es.js (/) y main-en.js (/en/), esta
   después de registrar los textos en inglés. No arranca sola al importarse: al empaquetar, este archivo e i18n.js
   van juntos, y si arrancara al cargarse lo haría antes de que /en/ hubiera registrado sus textos */
export function start(){
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)), rand=(a,b)=>a+Math.random()*(b-a);
const smooth=t=>t*t*(3-2*t);
/* Muelle con los dos parámetros que usa Apple: response (segundos, lo que tarda en llegar) y damping
   (1 = llega sin pasarse; 0,8 = se pasa un poco, solo si el gesto traía impulso). s = {x, v}; dt en segundos.
   Al no tener duración fija, se puede cambiar el destino a mitad de camino sin saltos */
function springStep(s,target,dt,response=.35,damping=1){
  const w=2*Math.PI/response;
  s.v+=(w*w*(target-s.x)-2*damping*w*s.v)*dt;s.x+=s.v*dt;
}
const root=document.documentElement;
/* roundRect del canvas llegó en Safari 16 (C-06): en iOS 15 el cuaderno lanzaba un TypeError. Este respaldo dibuja
   el mismo rectángulo redondeado con arcTo (radio único; si llega una lista, el primero) */
if(!CanvasRenderingContext2D.prototype.roundRect)CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r=0){
  r=Math.max(0,Math.min(Array.isArray(r)?+r[0]||0:+r||0,Math.abs(w)/2,Math.abs(h)/2));
  this.moveTo(x+r,y);this.arcTo(x+w,y,x+w,y+h,r);this.arcTo(x+w,y+h,x,y+h,r);this.arcTo(x,y+h,x,y,r);this.arcTo(x,y,x+w,y,r);this.closePath();
};
// «Reducir movimiento» se puede cambiar con la página abierta: rm se actualiza (ver «Pausa», más abajo)
const rmQuery=matchMedia('(prefers-reduced-motion: reduce)');
let rm=rmQuery.matches;
/* Pausa (A-02): el botón «Pausar animaciones» del dock, recordado en localStorage. En pausa no hay cursores, ni ruido
   de partículas, ni sonar, ni huelga automática, y el videomapping se queda en un fotograma fijo. Con «reducir
   movimiento» pasa lo mismo: calm() vale para los dos */
const PAUSE_KEY='animaciones-pausadas';
let paused=false;try{paused=localStorage.getItem(PAUSE_KEY)==='1'}catch(e){}
const calm=()=>rm||paused;
/* El bucle duerme cuando no hay nada que mover (P-02): cada paso pone busy = true si necesita otro frame */
let busy=false;
const small=()=>innerWidth<=860;
// Ancho visible, sin la barra de scroll: #dust (width:100%) mide eso, y getBoundingClientRect y clientX también.
// Con innerWidth (que la incluye), en Windows todo lo dibujado con puntos quedaba ~15 px corrido a la izquierda
const viewW=()=>document.documentElement.clientWidth||innerWidth;
let vw=viewW(),vh=innerHeight,SY=scrollY; // SY: scroll del frame actual

/* ---------- Analítica (Umami). Si no carga o está bloqueada, no pasa nada ---------- */
function track(name,data){try{window.umami?.track(name,data)}catch(e){}}

/* ---------- Tonos por sección ---------- */
const TONES={
  paper:['#0E1014','#EEF0F4','#7D8BFF'],
  night:['#0B0D12','#E8ECF5','#FFB300'],
  rust:['#170C08','#FFF1E6','#FF7A45'],
  sea:['#07141F','#E6F2FF','#6FD3F2'],
  cobalt:['#0B0E24','#FFFFFF','#8A96FF'],
  asphalt:['#0F0F11','#F4F1E6','#FFB300'],
  concrete:['#131210','#EDE8DC','#E8734E'],
  void:['#08080C','#F0F0FF','#FF3D9A'],
  oil:['#141005','#FFF6D6','#F4C20D']
};
const toneEls=$$('[data-tone]');
let tone='',toneBoxes=null,contactBox=null;
/* Posiciones de cada sección respecto al documento. Se miden solo cuando cambia la maqueta:
   leerlas en cada evento de scroll obligaba al navegador a recalcularla a mitad de frame */
function measureTones(){
  const y=scrollY,box=el=>{const r=el.getBoundingClientRect();return{el,top:r.top+y,bottom:r.bottom+y}};
  toneBoxes=toneEls.map(box);contactBox=box($('#contacto'));contactBox.text=box($('#contacto .wrap')).top;
  docH=root.scrollHeight;
}
/* Profundidad de scroll: 25, 50, 75 y 100 % de la página, una vez cada uno por visita. No hay listener propio ni
   lecturas de maqueta: usa el scroll que el bucle ya lee una vez por frame (SY) y el alto de la página, que se
   mide solo cuando cambia la maqueta (measureTones). El 100 % tiene un margen de 1 punto por los redondeos */
const DEPTHS=[25,50,75,100];
let docH=0,depthI=0;
function trackDepth(){
  if(!docH)return;
  const pct=(SY+vh)/docH*100;
  while(depthI<DEPTHS.length&&pct>=DEPTHS[depthI]-1){track('scroll-profundidad',{pct:DEPTHS[depthI]});depthI++}
}
function applyTone(){
  if(!toneBoxes)measureTones();
  const mid=SY+vh*.5;
  let hit=toneEls[0];
  for(const b of toneBoxes)if(b.top<=mid&&b.bottom>mid){hit=b.el;break}
  const t=hit.dataset.tone;
  if(t===tone)return;tone=t;
  const[g,i,a]=TONES[t];
  root.style.setProperty('--ground',g);root.style.setProperty('--ink',i);root.style.setProperty('--accent',a);
  dustTarget=hexRgb(paint?paint[1]:a);inkRgb=hexRgb(i);
  if(paint){root.style.setProperty('--ground',paint[0]);root.style.setProperty('--accent',paint[1])}
 
  const h=hit.querySelector('h2,h3');layer=(h?h.textContent:T.layerHome).replace(/\u00AD/g,'');
}
function hexRgb(h){const n=parseInt(h.slice(1),16);return[n>>16,n>>8&255,n&255]}

/* ---------- Letras del nombre ---------- */
const word=$('#word'),nameEl=$('#name'),surEl=$('#sur'),hint=$('#hint');
// sc: muelle de escala (la letra se levanta al cogerla); held: la tiene el dedo; dvx: velocidad horizontal suavizada mientras se arrastra
const letters=$$('.l').map(el=>({el,x:0,y:0,r:0,vx:0,vy:0,vr:0,mode:'rest',cx:0,cy:0,w:0,h:0,box:null,done:null,sc:{x:1,v:0},held:false,dvx:0,hist:[]}));
function fitName(){
  letters.forEach(L=>{L.el.style.transform='';L.t=''});
  const box=nameEl.parentElement,cs=getComputedStyle(box);
  const avail=Math.max(0,box.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight));
  nameEl.style.fontSize='100px';
  const w=word.scrollWidth||1,wh=word.offsetHeight||84;
  // Alto del bloque sticky (100svh): no cambia cuando la barra del navegador móvil aparece o se esconde
  const H=box.clientHeight||vh,maxH=H*(small()?.34:.48);
  // El nombre se queda con el alto que dejan libre apellido, lema, entradilla y pista: en pantallas bajas
  // (o con zoom) encoge antes que empujar el texto fuera de la pantalla o debajo del dock
  let rest=(parseFloat(cs.rowGap)||0)*(box.children.length-1)-wh;
  for(const el of box.children)rest+=el.offsetHeight;
  const free=H-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom)-rest;
  const fs=Math.max(36,Math.min(avail/w*100*.98,maxH/.84,free/wh*100));
  nameEl.style.fontSize=fs+'px';
  // Medidas como si la portada estuviera pegada arriba (sticky): si layout() se ejecuta con la página bajada (llega un
  // JSON de puntos, las fuentes o un resize), la portada ya ha subido y su rect sale negativo. Sin restar box.top, el
  // nombre en puntos se muestreaba fuera del lienzo, salía vacío y las coordenadas de todos los puntos daban NaN
  const by=box.getBoundingClientRect().top;
  letters.forEach(L=>{const r=L.el.getBoundingClientRect(),t=r.top-by;L.cx=r.left+r.width/2;L.cy=t+r.height/2;L.w=r.width;L.h=r.height;L.box={left:r.left,top:t,width:r.width,height:r.height}});
  surEl.style.fontSize='';
}
function paintLetter(L){const s=L.sc.x,t=(L.x||L.y||L.r||s!==1)?`translate(${L.x}px,${L.y}px) rotate(${L.r}deg) scale(${s})`:'';if(t!==L.t){L.t=t;L.el.style.transform=t}}

/* ---------- Cursores ---------- */
const LABELS=T.crew;
const COLORS=['#2A3FF0','#D6264F','#087A50','#B3470F','#7A2BD6','#00788C','#B81F8A','#667000','#3A3AD0','#A8341A','#006B4F','#C03030'];
const crew=$('#crew'),cursors=[];
const CURSOR_SVG='<svg viewBox="0 0 20 24"><path d="M1.5 1.5v18.6l5-4.5 3.4 7.6 3.5-1.6-3.4-7.4 7-.6z"/></svg>';
// Uno por rol (LABELS), en ordenador y en móvil: los que iban sin etiqueta solo hacían bulto
function makeCursors(){
  const n=rm?0:LABELS.length;
  for(let i=0;i<n;i++){
    const el=document.createElement('div');el.className='c';
    const col=COLORS[i%COLORS.length];el.style.setProperty('--c',col);
    el.innerHTML=CURSOR_SVG+`<span>${LABELS[i]}</span>`;
    crew.appendChild(el);
    const a=Math.random()*6.28,R=Math.hypot(vw,vh)*.62;
    const c={el,x:vw/2+Math.cos(a)*R,y:vh/2+Math.sin(a)*R,vx:0,vy:0,tx:vw/2,ty:vh/2,k:rand(.05,.085),next:0,trail:[],col,job:null,script:true,sel:null,slot:null,sx:0,sy:0,follow:null,hidden:false};
    c.tx=c.x;c.ty=c.y;
    const box=document.createElement('div');box.className='selbox';box.style.setProperty('--c',col);crew.appendChild(box);c.box=box;
    cursors.push(c);
  }
}
function wanderTarget(c){
  const band=Math.random();
  // La franja de abajo queda por encima del dock (Auditar / Jefe de obra) para no taparlo
  if(small()){c.tx=rand(.04,.7)*vw;c.ty=band<.4?rand(.08,.13)*vh:vh-rand(95,130)}
  else if(band<.34){c.tx=rand(.04,.9)*vw;c.ty=rand(.08,.16)*vh}
  else if(band<.68){c.tx=rand(Math.min(.3,340/vw),.86)*vw;c.ty=rand(.9,.97)*vh}
  else{c.tx=(Math.random()<.5?rand(.01,.09):rand(.84,.93))*vw;c.ty=rand(.15,.85)*vh}
  // Curvatura del trayecto: una mano no va en línea recta, describe un arco suave
  c.bend=rand(-.28,.28);
  c.next=performance.now()+rand(1400,4200);
}
const MAX_WANDER_V=()=>Math.max(9,Math.min(vw,vh)*.018); // px por frame a 60 Hz (~1000 px/s en un portátil)
// En pausa no hay cursores libres: las letras vuelven solas y los sellos llegan sin nadie que los traiga
function freeCursors(){return paused?[]:cursors.filter(c=>!c.job&&!c.script&&!c.follow&&!c.task)}
function fetchLetter(L,list){
  L.mode='wait';
  const offs=[[-.3,-.1],[.3,.25]];
  list.forEach((c,i)=>{c.job={L,ox:offs[i%2][0]*L.w,oy:offs[i%2][1]*L.h}});
  if(!list.length)L.mode='carry';
  return new Promise(r=>L.done=r);
}
function stepLetters(f){
  const dt=f/60,fr=Math.pow(.93,f); // rozamiento por frame a 60 Hz, igual a cualquier frecuencia de pantalla
  for(const L of letters){
    // Al cogerla se levanta (escala 1,08, sin rebote); al soltarla vuelve con un pelín de rebote, porque se lanzó
    if(!rm){springStep(L.sc,L.held?1.08:1,dt,.3,L.held?1:.8);if(!L.held&&Math.abs(L.sc.x-1)<.0005&&Math.abs(L.sc.v)<.01){L.sc.x=1;L.sc.v=0}}
    if(L.mode!=='rest'||L.sc.x!==1)busy=true;
    if(L.mode==='drag'){
      // Se inclina hacia donde va, como algo que cuelga de los dedos, y se endereza al parar
      L.dvx*=Math.pow(.8,f);
      L.r+=(clamp(L.dvx*1.6,-24,24)-L.r)*(1-Math.pow(.78,f));
    }else if(L.mode==='loose'){
      L.x+=L.vx*f;L.y+=L.vy*f;L.r+=L.vr*f;L.vx*=fr;L.vy*=fr;L.vr*=fr;
      const nx=L.cx+L.x,ny=L.cy+L.y;
      if(nx<20||nx>vw-20){L.vx*=-.6;L.x=clamp(nx,20,vw-20)-L.cx}
      if(ny<40||ny>vh-30){L.vy*=-.6;L.y=clamp(ny,40,vh-30)-L.cy}
    }else if(L.mode==='carry'){
      // En la intro, más deprisa (fast)
      const e=(L.fast?.2:.1)*f;L.x+=-L.x*e;L.y+=-L.y*e;L.r+=-L.r*e;
      if(Math.abs(L.x)+Math.abs(L.y)<1.2){
        L.x=L.y=L.r=0;L.mode='rest';
        cursors.forEach(c=>{if(c.job&&c.job.L===L){c.job=null;c.next=0}});
        if(L.done){const d=L.done;L.done=null;d()}
      }
    }
    paintLetter(L);
  }
}
/* Reposo del equipo. Un cursor sin encargo (duty) deja de gastar frames en dos casos:
   1. Escondido (clase off, fuera de la portada): no se calcula ni se toca el DOM hasta que vuelve a verse.
   2. A la vista, con la intro terminada y CREW_REST_MS sin que nadie mueva el ratón, toque, teclee o haga scroll:
      termina el trayecto que llevaba, se queda donde está y no elige otro destino. Cuando todos están quietos y su
      rastro se ha recogido (TRAIL_FRAMES), el bucle se duerme. Con la primera actividad siguen paseando, cada uno
      a su tiempo (si no, saldrían todos a la vez). El aspecto es el mismo: solo cambia que en reposo no se mueven.
   En Contacto (gather) no hay reposo: la ronda del equipo es parte de la escena. crewClock es su reloj */
const CREW_REST_MS=6000,TRAIL_FRAMES=92;
let crewRest=false,crewClock=0;
function stepCursors(f,now){
  if(paused)return;
  const vmax=MAX_WANDER_V();
  const rest=introDone&&!order&&!strike&&!gather&&now-lastAct>CREW_REST_MS;
  if(crewRest&&!rest)for(const c of cursors)if(c.next<now)c.next=now+rand(0,1800);
  crewRest=rest;crewClock+=f*16.67;
  for(const c of cursors){
    let wander=false;
    const duty=c.job||c.task||c.park||c.slot;
    if(!duty&&c.el.classList.contains('off')){
      if(!c.wasOff){c.wasOff=true;c.trail.length=0;c.vx=c.vy=0}
      continue;
    }
    if(c.wasOff){c.wasOff=false;if(c.next<now)c.next=now+rand(0,1500)}
    if(duty)busy=true;
    if(c.job){
      const L=c.job.L;c.tx=L.cx+L.x+c.job.ox;c.ty=L.cy+L.y+c.job.oy;
      if(L.mode==='wait'&&Math.hypot(c.tx-c.x,c.ty-c.y)<34)L.mode='carry';
    }else if(c.task){
      aimTask(c,now);c.box.classList.remove('on');
    }else if(c.park){
      c.tx=c.park.x;c.ty=c.park.y;c.box.classList.remove('on');
    }else if(orderTarget(c,cursors.indexOf(c),cursors.length,now)){
      c.box.classList.remove('on');
    }else if(c.follow){
      c.box.classList.add('on');
      const r=c.follow.getBoundingClientRect();
      const pad=8,x=r.left-pad,y=r.top-pad,w=Math.round(Math.min(r.width+pad*2,vw-x-6)),h=Math.round(r.height+pad*2);
      c.tx=x+w-6;c.ty=y+h-6;
      c.box.style.transform=`translate(${x}px,${y}px)`;
      // El tamaño es layout: solo se escribe cuando cambia (casi nunca), la posición va por transform
      if(c.bw!==w||c.bh!==h){c.bw=w;c.bh=h;c.box.style.width=w+'px';c.box.style.height=h+'px'}
    }else if(!c.script){
      // En móvil, en fila justo encima del texto de Contacto, y suben con él al hacer scroll: abajo tapaban los botones
      // y, a la derecha (en horizontal), el titular, que ahí ocupa todo el ancho
      if(gather){const i=cursors.indexOf(c),a=i/cursors.length*6.283+crewClock*.00018;
        if(small()){c.tx=(i/cursors.length)*vw*.8+6;c.ty=Math.min(contactBox.text-SY-56,vh-150)+Math.sin(a*3)*8}
        else{c.tx=vw*.82+Math.cos(a)*vw*.1;c.ty=vh*.34+Math.sin(a)*vh*.2}}
      // En reposo no eligen destino nuevo, salvo si se quedaron fuera de la pantalla (soltados por un sello o tras
      // «idos»): si no, desaparecían hasta que alguien moviera el ratón
      else{const out=c.x<-30||c.x>vw+30||c.y<-30||c.y>vh+30;if((!rest||out)&&now>c.next)wanderTarget(c);wander=true}
    }
    // Paseo libre: apunta a un lado del destino en proporción a lo que falta (el desvío se anula al llegar),
    // así el trayecto sale en arco. La intro, los encargos y las órdenes van directos porque llevan tiempos medidos
    let ax=c.tx,ay=c.ty;
    if(wander&&c.bend){const dx=c.tx-c.x,dy=c.ty-c.y;ax-=dy*c.bend;ay+=dx*c.bend}
    c.vx+=(ax-c.x)*c.k*f;c.vy+=(ay-c.y)*c.k*f;
    const d=Math.pow(.74,f);c.vx*=d;c.vy*=d;
    // Tope de velocidad en el paseo: un trayecto largo se ve como un viaje, no como un latigazo
    if(wander){const s=Math.hypot(c.vx,c.vy);if(s>vmax){c.vx*=vmax/s;c.vy*=vmax/s}}
    c.x+=c.vx*f;c.y+=c.vy*f;
    if(!(Math.abs(c.x)<1e5&&Math.abs(c.y)<1e5)){c.x=vw/2;c.y=vh/2;c.vx=c.vy=0;c.tx=c.x;c.ty=c.y;c.trail.length=0}
    c.el.style.transform=`translate3d(${c.x}px,${c.y}px,0)`;
    c.trail.push(c.x,c.y);if(c.trail.length>180)c.trail.splice(0,2);
    if(c.slot){const w=Math.max(0,c.x-c.sx),h=Math.max(0,c.y-c.sy);c.slot.style.width=w+'px';c.slot.style.height=h+'px'}
    // Sin encargo: pide otro frame mientras haya actividad reciente o, en reposo, hasta que se pare y recoja el rastro
    c.still=Math.abs(c.vx)+Math.abs(c.vy)>.05?0:(c.still||0)+1;
    if(!duty&&(!rest||c.still<TRAIL_FRAMES))busy=true;
  }
}
let gather=false;

/* Tirar de las letras */
let repairs=0;
function bindLetters(){
  letters.forEach((L,i)=>{
    let px=0,py=0,lt=0,drag=false,id=null;
    L.el.addEventListener('pointerdown',e=>{
      // Un segundo dedo sobre la misma letra no la hace saltar
      if(root.classList.contains('intro')||drag)return;
      drag=true;id=e.pointerId;L.mode='drag';L.held=true;L.el.classList.add('held');cursors.forEach(c=>{if(c.job&&c.job.L===L)c.job=null});
      // Se agarra donde está, aunque vuele o la estén trayendo: sin saltos (interrumpible en cualquier momento)
      L.el.setPointerCapture(e.pointerId);px=e.clientX;py=e.clientY;lt=e.timeStamp;L.vx=L.vy=L.vr=0;L.dvx=0;L.done=null;
      L.hist=[[L.x,L.y,lt]];
    });
    L.el.addEventListener('pointermove',e=>{
      if(!drag||e.pointerId!==id)return;
      const dx=e.clientX-px,dy=e.clientY-py,t=e.timeStamp,dt=Math.max(4,t-lt);
      L.x+=dx;L.y+=dy;L.dvx+=(dx/dt*16.67-L.dvx)*.5;
      // Historial de los últimos 100 ms para medir la velocidad al soltar (un solo evento es demasiado ruidoso)
      L.hist.push([L.x,L.y,t]);while(L.hist.length>2&&t-L.hist[0][2]>100)L.hist.shift();
      px=e.clientX;py=e.clientY;lt=t;
    });
    const up=e=>{
      if(!drag||e.pointerId!==id)return;drag=false;L.held=false;L.el.classList.remove('held');
      if(Math.abs(L.x)+Math.abs(L.y)<3){L.x=L.y=L.r=0;L.mode='rest';return}
      // La velocidad del dedo pasa tal cual a la letra (px por frame a 60 Hz): sin costura entre arrastre y vuelo.
      // Si el dedo llevaba parado más de 100 ms, la letra se queda donde la dejaste
      const h=L.hist,a=h[0],b=h[h.length-1],span=b[2]-a[2],still=e.timeStamp-b[2]>100;
      L.vx=still||span<1?0:(b[0]-a[0])/span*16.67;L.vy=still||span<1?0:(b[1]-a[1])/span*16.67;
      const vmax=60;L.vx=clamp(L.vx,-vmax,vmax);L.vy=clamp(L.vy,-vmax,vmax);
      L.vr=L.vx*.25;
      L.mode='loose';track('letra-rota',{letra:'ALONSO'[i]});
      setTimeout(()=>{
        if(L.mode!=='loose')return;
        const nx=L.cx+L.x,ny=L.cy+L.y;
        const list=freeCursors().sort((a,b)=>Math.hypot(a.x-nx,a.y-ny)-Math.hypot(b.x-nx,b.y-ny)).slice(0,2);
        fetchLetter(L,list).then(()=>{repairs++;hint.textContent=T.repairs(repairs)});
      },rm?0:420);
    };
    L.el.addEventListener('pointerup',up);L.el.addEventListener('pointercancel',up);
  });
}

/* ---------- Intro ----------
   Solo en la primera visita (boot.js pone la clase intro; aquí se apunta INTRO_KEY en localStorage al empezar) y corta:
   unos 2,2 s. El lema y la entradilla ya se ven desde el principio; aquí solo se monta el nombre. Los cursores
   dibujan la casilla de cada letra, la traen, la pintan en cuanto llega y escriben el apellido. Si un equipo lento
   la alarga, a los INTRO_MAX ms se termina de golpe. Scroll, toque, tecla o «Saltar intro» la cortan (boot) */
const INTRO_KEY='intro-vista',INTRO_MAX=2400;
let skipped=false,introDone=false,introRan=false;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const slots=[];
// Cómo se corta la intro, para el evento intro-saltada (el tipo del evento del navegador → dato «modo»)
const SKIP_MODE={click:'boton',wheel:'scroll',touchmove:'toque',keydown:'tecla'};
async function intro(){
  introRan=true;
  try{localStorage.setItem(INTRO_KEY,'1')}catch(e){}
  performance.mark('intro');
  setTimeout(()=>finish('fin'),INTRO_MAX);
  // Los que no dibujan casillas se acercan al nombre: así llegan pronto a por las letras
  const builders=cursors.slice(0,6),carriers=cursors.slice(6);
  carriers.forEach((c,i)=>{const a=i/carriers.length*6.283;c.tx=vw/2+Math.cos(a)*rand(120,260);c.ty=vh/2+Math.sin(a)*rand(80,200)});
  // Dibujan las casillas de cada letra
  const draw=letters.map(async(L,i)=>{
    await pause(i*50);if(skipped)return;
    const c=builders[i],b=L.box;if(!c)return;
    c.tx=b.left;c.ty=b.top;
    await pause(260);if(skipped)return;
    const s=document.createElement('div');s.className='slot';s.style.left=b.left+'px';s.style.top=b.top+'px';s.style.width=s.style.height='0';document.body.appendChild(s);slots.push(s);
    c.x=b.left;c.y=b.top;c.vx=c.vy=0;c.sx=b.left;c.sy=b.top;c.slot=s;
    c.tx=b.left+b.width;c.ty=b.top+b.height;
    await pause(240);if(skipped)return;
    c.slot=null;s.style.width=b.width+'px';s.style.height=b.height+'px';wanderTarget(c);
  });
  await pause(450);if(skipped)return;
  // Traen las letras (mientras se terminan las últimas casillas); cada una se pinta en cuanto llega
  letters.forEach(L=>{
    L.x=rand(.12,.88)*vw-L.cx;L.y=(Math.random()<.5?rand(.14,.24):rand(.76,.86))*vh-L.cy;L.r=rand(-24,24);L.fast=true;
    L.el.classList.add('on');paintLetter(L);
  });
  const carry=letters.map(async(L,i)=>{
    await pause(i*35);if(skipped)return;
    // Dos cursores por letra si hay bastantes (con 12 quedan 6 carriers: uno por letra; repetir uno le quitaría la letra al otro)
    const two=carriers.length>=letters.length*2,list=(two?[carriers[i*2],carriers[i*2+1]]:[carriers[i%carriers.length]]).filter(Boolean);
    await fetchLetter(L,list);if(skipped)return;
    if(slots[i])slots[i].style.opacity=0;
    const c=builders[i];if(c){c.x=L.cx;c.y=L.box.top;c.vx=c.vy=0;c.tx=L.cx;c.ty=L.box.top+L.box.height}
    L.el.classList.add('painted');
    await pause(200);if(!skipped&&c)wanderTarget(c);
  });
  await Promise.all([...draw,...carry]);if(skipped)return;
  // Escriben el apellido
  const full='OSUNA SOTO';surEl.textContent='';
  for(let i=1;i<=full.length;i++){surEl.textContent=full.slice(0,i);await pause(20);if(skipped)return}
  finish('fin');
}
function rescue(){if(!introDone)finish();root.classList.remove('intro','locked');$$('.l').forEach(l=>l.style.transform='')}
/* how: 'fin' si la intro llega al final (o al tope de INTRO_MAX), o el evento que la corta (clic en «Saltar intro»,
   scroll, toque o tecla). Sin how (rescue, «reducir movimiento» activado a mitad) no se mide nada */
function finish(how){
  if(introDone)return;introDone=true;skipped=true;
  if(introRan){
    if(how==='fin')track('intro-completa');
    else if(how&&SKIP_MODE[how.type])track('intro-saltada',{modo:SKIP_MODE[how.type]});
  }
  letters.forEach(L=>{L.x=L.y=L.r=0;L.mode='rest';L.done=null;L.fast=false;paintLetter(L)});
  slots.forEach(s=>s.remove());
  surEl.textContent='OSUNA SOTO';
  $$('.reveal').forEach(el=>el.classList.add('shown'));
  root.classList.remove('intro','locked');
  $('#skip')?.remove();
  cursors.forEach(c=>{c.job=null;c.slot=null;c.script=false;c.next=0});
  lastAct=performance.now();
  removeEventListener('wheel',finish);removeEventListener('touchmove',finish);removeEventListener('keydown',finish);
}
/* Equipo suelto sin intro (con «Pausar animaciones» o «reducir movimiento» al cargar, o cursores creados con la página
   abierta): makeCursors los deja fuera de la pantalla y con script, esperando a la intro. Aquí se sueltan como en
   finish() y entran paseando, cada uno a su tiempo: esperan fuera hasta c.next y stepCursors les da destino con
   wanderTarget. Se pintan ya ahí fuera para que no asomen un frame en la esquina (left/top 0). En pausa no se mueven
   (stepCursors no corre y #crew está oculto): entran al quitarla */
function freeCrew(){
  const now=performance.now();
  for(const c of cursors){
    c.job=null;c.slot=null;c.script=false;c.next=now+rand(0,1500);
    c.tx=c.x;c.ty=c.y;c.el.style.transform=`translate3d(${c.x}px,${c.y}px,0)`;
  }
}

/* ---------- Polvo: partículas que cambian de forma ---------- */
const fine=matchMedia('(pointer:fine)').matches;
const cv=$('#dust'),ctx=cv.getContext('2d');
const N=matchMedia('(max-width:860px)').matches?1800:4000;
const px=new Float32Array(N),py=new Float32Array(N),pvx=new Float32Array(N),pvy=new Float32Array(N),ez=new Float32Array(N),ps=new Float32Array(N);
// Ruido de reposo: cada punto oscila con su propia fase y frecuencia
const nph=new Float32Array(N),nfq=new Float32Array(N);
// Azar fijo de cada punto (qué parte de la forma le toca y su desvío). Así, si se recoloca la web
// (giro, barra del navegador en móvil, fuentes que llegan tarde) cada punto va al mismo sitio de antes
const pick=new Float32Array(N),jx=new Float32Array(N),jy=new Float32Array(N);
for(let i=0;i<N;i++){px[i]=rand(0,vw);py[i]=rand(0,vh);ez[i]=rand(.045,.12);ps[i]=rand(1.7,3.3);nph[i]=rand(0,6.283);nfq[i]=rand(.0006,.0014);pick[i]=Math.random();jx[i]=Math.random();jy[i]=Math.random()}
const NOISE=.4; // px por eje: en diagonal no pasa de 0,57 px
const dsz=new Float32Array(N); // tamaño de cada punto en este frame (la segunda pasada de la brújula lo reutiliza)
let scrollT=0;
let dustNow=[125,139,255],dustTarget=[125,139,255],inkRgb=[238,240,244],layer=T.layerHome;
const aura=$('#aura');let auraX=-1,auraY=-1;
const SHAPES={
  bubble(c,w,h){c.beginPath();c.roundRect(w*.06,h*.12,w*.88,h*.58,w*.09);c.fill();c.beginPath();c.moveTo(w*.26,h*.66);c.lineTo(w*.22,h*.92);c.lineTo(w*.5,h*.66);c.fill();c.globalCompositeOperation='destination-out';[.3,.5,.7].forEach(x=>{c.beginPath();c.arc(w*x,h*.41,w*.058,0,6.3);c.fill()});c.globalCompositeOperation='source-over'},
  // La brújula entera, sin partes (solo si su hueco no se puede medir; lo normal es compassTargets, más abajo)
  compass(c,w){COMPASS_PARTS.forEach(p=>p[2](c,w))},
  arrow(c,w,h){c.beginPath();[[.26,.04],[.26,.84],[.44,.67],[.57,.97],[.69,.91],[.56,.62],[.8,.6]].forEach((q,i)=>c[i?'lineTo':'moveTo'](q[0]*w,q[1]*h));c.fill()},
  facade(c,w,h){for(let x=0;x<8;x++)for(let y=0;y<4;y++)c.strokeRect(w*(.03+x*.12),h*(.06+y*.23),w*.09,h*.17)},
  beam(c,w,h){c.beginPath();c.moveTo(0,h*.92);c.lineTo(w*.98,h*.04);c.lineTo(w*.98,h*.82);c.closePath();c.fill()},
  scatter(c,w,h){c.fillRect(0,0,w,h)}
};
const FULL={facade:1,beam:1,scatter:1};
const off=document.createElement('canvas');const octx=off.getContext('2d',{willReadFrequently:true});
// La fuente del nombre, para lo que se dibuja con letras en el lienzo de muestreo (brújula y cuaderno de Zalapp)
const ART_FONT=px=>`900 ${px}px "Big Shoulders Display",Impact,sans-serif`;
function sample(w,h,draw){
  w=Math.max(2,w|0);h=Math.max(2,h|0);off.width=w;off.height=h;octx.clearRect(0,0,w,h);octx.fillStyle=octx.strokeStyle='#000';draw(octx,w,h);
  const d=octx.getImageData(0,0,w,h).data,pts=[];
  for(let y=0;y<h;y+=2)for(let x=0;x<w;x+=2)if(d[(y*w+x)*4+3]>128)pts.push(x,y);
  return pts;
}
function toTargets(pts,x0,y0,sx,sy){
  const t=new Float32Array(N*2),n=pts.length/2||1;
  // Muestreo vacío (forma fuera del lienzo): sin este respaldo, pts[0] es undefined y todo el polvo pasa a NaN para siempre
  if(pts.length<2)pts=[160/sx,90/sy];
  for(let i=0;i<N;i++){const k=Math.min(n-1,Math.floor(pick[i]*n))*2;t[i*2]=x0+(pts[k]+jx[i]*2)*sx;t[i*2+1]=y0+(pts[k+1]+jy[i]*2)*sy}
  return t;
}
function heroPts(){
  const fs=parseFloat(getComputedStyle(nameEl).fontSize);
  return sample(vw>>1,vh>>1,(c)=>{c.font=`900 ${fs/2}px ${getComputedStyle(nameEl).fontFamily}`;c.textAlign='center';c.textBaseline='middle';
    letters.forEach((L,i)=>c.fillText('ALONSO'[i],L.cx/2,L.cy/2))});
}
/* Cada parada tiene s (la forma queda completa) y e (empieza a deshacerse). Casi todas son un punto
   (e = s); el retrato tiene meseta. Entre dos paradas a y b, los puntos viajan de a.e a b.s. */
// data-points="/archivo.json": la parada dibuja esa imagen en puntos; si el archivo no llega, usa data-fallback.
// data-alpha-points: opacidad cuando la imagen sí llega (si no, data-alpha).
// anchor: los puntos se mueven con el contenido (scroll) en vez de quedarse fijos en la pantalla
const stops=$$('[data-shape]').map(el=>{const d=el.dataset,alpha=+d.alpha;
  return{el,shape:d.shape,alpha,baseAlpha:alpha,imgAlpha:d.alphaPoints?+d.alphaPoints:alpha,src:d.points||'',fallback:d.fallback||'scatter',
    data:null,s:0,e:0,t:null,z:null,anchor:false,box:null,shot:null,flat:d.shape==='portrait'}});
function stopRange(st){
  if(st.shape==='hero'){st.s=st.e=vh*.32;return}
  if(st.shape==='portrait'){st.s=scene.top+scene.len*PORTRAIT_IN;st.e=scene.top+scene.len*PORTRAIT_OUT;return}
  const r=st.el.getBoundingClientRect();
  // En móvil, el velero o el móvil de Zalapp (encima del texto) quedan completos justo debajo de la barra de arriba
  const slot=(st.data||st.shape==='compass')&&st.el.querySelector(SLOTS);
  if(slot&&small()){st.s=st.e=slot.getBoundingClientRect().top+scrollY-58;return}
  // La brújula, en ordenador, completa en el centro de la pantalla
  if(slot&&st.shape==='compass'){const q=slot.getBoundingClientRect();st.s=st.e=q.top+scrollY+q.height/2-vh/2;return}
  st.s=st.e=r.top+scrollY+r.height/2-vh/2;
}
/* Imágenes en puntos (public/retrato-puntos.json, public/apreton-puntos.json…): {ratio, desktop:[x,y,s,...], mobile:[...]}.
   x e y van de 0 a 1 sobre el recorte; s, la luz de 0 a 1, da el tamaño del punto. Cada archivo se pide una sola vez.
   Variante de dos dibujos (public/nautes-puntos.json, data-shape="morph"): {boat_ratio, shot_ratio,
   desktop:{boat,shot}, mobile:{boat,shot}}. Ya vienen emparejados: el punto i del barco va al punto i de la web */
const pointFiles={};
const okPoints=o=>o.ratio>0&&o.desktop?.length>2&&o.mobile?.length>2;
function readPoints(d){
  if(!d)return null;
  if(!d.boat_ratio)return okPoints(d)?d:null;
  const img={ratio:d.boat_ratio,desktop:d.desktop?.boat,mobile:d.mobile?.boat,
    shot:{ratio:d.shot_ratio,desktop:d.desktop?.shot,mobile:d.mobile?.shot}};
  const paired=okPoints(img)&&okPoints(img.shot)&&img.shot.desktop.length===img.desktop.length&&img.shot.mobile.length===img.mobile.length;
  return paired?img:null;
}
const loadPoints=src=>pointFiles[src]||(pointFiles[src]=fetch(import.meta.env.BASE_URL+src.replace(/^\//,''))
  .then(r=>r.ok?r.json():null).then(readPoints).catch(()=>null));
/* Cada JSON se pide cuando su sección está a una pantalla de distancia (P-04), no al cargar: así no compiten con
   las fuentes ni con el primer pintado. Mientras no llega, la parada usa su forma de reserva (data-fallback); al
   llegar, se recoloca todo (pointsReady) */
let pointsT=0;
const pointsObs=new IntersectionObserver(es=>es.forEach(e=>{
  if(!e.isIntersecting)return;
  pointsObs.unobserve(e.target);
  for(const st of stops)if(st.el===e.target&&st.src)loadPoints(st.src).then(d=>{
    st.data=d;st.failed=!d;
    // Con el móvil en puntos, la captura fija de reserva se esconde (style.css: .has-phone)
    if(d&&st.el.querySelector('.phone-slot'))st.el.classList.add('has-phone');
    pointsReady();
  });
}),{rootMargin:'100% 0px'});
stops.forEach(st=>{if(st.src)pointsObs.observe(st.el)});
// Recoloca cuando llega un JSON o las fuentes, pero no a mitad de un scroll (daría un tirón): espera a que se pare,
// como relayout(). Lo que llega casi a la vez (fuentes y retrato al cargar) se junta en un solo layout()
function pointsReady(){
  clearTimeout(pointsT);
  pointsT=setTimeout(function go(){
    if(performance.now()-scrollT<250){pointsT=setTimeout(go,200);return}
    if(ready){layout();warp();sizePlan();wake()}
  },120);
}
// Tamaño del punto: base + luz × rango, en ordenador (d) y en móvil (m)
const DOT={portrait:{d:[1.1,2.6],m:[1.3,2.4]},points:{d:[1,2.6],m:[1.2,2.3]},morph:{d:[1,2.4],m:[1.2,2.2]},phone:{d:[1,2.4],m:[1,2.4]}};
function pointTargets(data,[x0,y0,W,H],dot){
  const sm=small(),pts=sm?data.mobile:data.desktop,M=Math.floor(pts.length/3);
  if(!M||!(W>=1)||!(H>=1))return null;
  const t=new Float32Array(N*2),z=new Float32Array(N),[z0,zk]=sm?dot.m:dot.d;
  // Si hay más partículas que puntos, se repiten con un desplazamiento mínimo; si hay menos, se recortan
  for(let i=0;i<N;i++){const k=(i%M)*3,j=i>=M?.8:0;t[i*2]=x0+pts[k]*W+(jx[i]*2-1)*j;t[i*2+1]=y0+pts[k+1]*H+(jy[i]*2-1)*j;z[i]=z0+pts[k+2]*zk}
  return{t,z};
}
// Retrato: encaja el recorte en su hueco respetando la proporción; en ordenador, como mucho el 78 % del alto
function portraitBox(ratio){
  const sm=small(),sr=scene.slot.getBoundingClientRect(),kr=scene.stick.getBoundingClientRect();
  if(!sr.width||!sr.height)return null;
  const H=Math.min(sr.height,sm?sr.height:vh*.78,sr.width/ratio),W=H*ratio;
  return[sr.left+(sr.width-W)/2,sr.top-kr.top+(sr.height-H)/2,W,H]; // con el sticky ya pegado arriba
}
/* Capítulo: la imagen va donde iba la forma suelta, a la derecha del texto en ordenador (hasta el 46 % del ancho,
   centrada en vertical) y encima en móvil (92 % del ancho). Nunca pisa el texto, la barra de arriba ni el dock:
   se mide dónde queda el texto en la pantalla cuando la forma está completa (scroll = st.s). Fuera de los capítulos
   (Contacto), el texto es su .wrap */
function chapterBox(st,ratio){
  const sm=small(),r=(st.el.querySelector('.ch-text')||st.el.querySelector('.wrap')||st.el).getBoundingClientRect();
  const top=r.top+scrollY-st.s,gap=sm?14:32,y1=sm?58:72,y2=vh-60,g=16;
  // Al lado: entre el texto y el borde derecho, centrada en vh/2 y, si cabe, en el 72 % del ancho como la forma de antes
  const L=r.right+gap,R=vw-g,sw=Math.min(vw*(sm?.92:.46),R-L,(y2-y1)*ratio),sh=sw/ratio;
  const side=[clamp(vw*.72-sw/2,L,R-sw),clamp(vh/2-sh/2,y1,y2-sh),sw,sh];
  if(!sm)return side;
  // Encima: entre la barra de arriba y el texto, centrada en ese hueco. En móvil en horizontal suele caber más al lado
  const tw=Math.min(vw*.92,vw-2*g,(top-gap-y1)*ratio),th=tw/ratio;
  return sw>tw?side:[(vw-tw)/2,y1+(top-gap-y1-th)/2,tw,th];
}
/* Proyecto con velero: ocupa su hueco (.boat-slot: la columna derecha en ordenador, arriba en móvil) con su
   proporción. Va anclado al contenido, así que se mide en la página y se pasa a la pantalla en la posición de la parada */
const SLOTS='.boat-slot,.phone-slot,.compass-slot';
function boatBox(st,ratio){
  const r=st.el.querySelector(SLOTS).getBoundingClientRect(),off=scrollY-st.s;
  const H=Math.min(r.height,r.width/ratio),W=H*ratio;
  if(!(H>=40))return null;
  return[r.left+(r.width-W)/2,r.top+off+(r.height-H)/2,W,H];
}
// La web, centrada en la pantalla: ancho min(72vw, 1000px) con su proporción
function shotRect(ratio){const W=Math.min(vw*.72,1000),H=W/ratio;return[(vw-W)/2,(vh-H)/2,W,H]}
function imageTargets(st){
  if(!st.data)return null;
  if(st.shape==='morph'){
    const box=boatBox(st,st.data.ratio),pt=box&&pointTargets(st.data,box,DOT.morph);
    if(!pt)return null;
    st.box=box;st.shotBox=shotRect(st.data.shot.ratio);st.shot=pointTargets(st.data.shot,st.shotBox,DOT.morph);
    return st.shot&&pt;
  }
  // Imagen en su hueco (el móvil de Zalapp): anclada al contenido como el velero
  if(st.el.querySelector(SLOTS)){
    const box=boatBox(st,st.data.ratio),pt=box&&pointTargets(st.data,box,DOT.phone);
    if(!pt)return null;
    st.box=box;if(st.data.screen)st.edge=screenEdges(pt.t,box,st.data.screen);
    return pt;
  }
  const box=st.shape==='portrait'?portraitBox(st.data.ratio):chapterBox(st,st.data.ratio);
  return box&&pointTargets(st.data,box,DOT[st.shape]||DOT.points);
}
/* Al encender la pantalla, cada punto de dentro se aparta al borde más cercano: aquí, cuánto (x, y) se mueve.
   Se queda justo por dentro del borde redondeado de la captura (el mismo 9 % de radio), así la captura lo tapa
   al fundirse y el marco del móvil queda limpio, con su grosor de siempre */
function screenEdges(t,[x0,y0,W,H],[a,b,c,d]){
  const e=new Float32Array(N*2),L=x0+W*a,T=y0+H*b,R=x0+W*c,B=y0+H*d,r=(R-L)*.09;
  for(let i=0;i<N;i++){
    const k=i*2,x=t[k],y=t[k+1];if(x<L||x>R||y<T||y>B)continue;
    const dl=x-L,dr=R-x,dt=y-T,db=B-y,m=Math.min(dl,dr,dt,db),j=3+jx[i]*3; // 3-6 px por dentro (y el tamaño del punto)
    let nx=x,ny=y;
    if(m===dl)nx=L+j;else if(m===dr)nx=R-j-3;else if(m===dt)ny=T+j;else ny=B-j-3;
    // En las esquinas, sobre el arco: si no, asomarían por fuera de la esquina redondeada
    const cx=clamp(nx,L+r,R-r),cy=clamp(ny,T+r,B-r),ux=nx-cx,uy=ny-cy,du=Math.hypot(ux,uy);
    if(du>r-j-3){const q=(r-j-3)/(du||1);nx=cx+ux*q;ny=cy+uy*q}
    e[k]=nx-x;e[k+1]=ny-y;
  }
  return e;
}
function sizeCanvas(){
  vw=viewW();vh=innerHeight;SY=scrollY;
  const d=Math.min(devicePixelRatio||1,1.6),w=Math.round(vw*d),h=Math.round(vh*d);
  if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h}
  ctx.setTransform(d,0,0,d,0,0);
}
function layout(){
  sizeCanvas();
  fitName();measureScene();measureTones();
  const sm=small();
  for(const st of stops){
    stopRange(st);st.z=null;st.shot=null;st.box=null;st.edge=null;st.anchor=false;st.alpha=st.baseAlpha;
    if(st.shape==='hero'){st.t=toTargets(heroPts(),0,0,2,2);continue}
    const pt=imageTargets(st);
    if(pt){st.t=pt.t;st.z=pt.z;st.alpha=st.imgAlpha;st.anchor=!!st.box;continue}
    // La brújula: en su hueco y anclada al contenido, como el velero
    if(st.shape==='compass'){const t=compassTargets(st);if(t){st.t=t;st.anchor=true;continue}}
    // Sin imagen (no hay data-points o el archivo no llegó): la forma dibujada, o la de reserva
    const shape=SHAPES[st.shape]?st.shape:SHAPES[st.fallback]?st.fallback:'scatter';
    if(FULL[shape]){st.t=toTargets(sample(320,180,SHAPES[shape]),0,0,vw/320,vh/180);continue}
    let size=sm?Math.min(vw*.74,vh*.38):Math.min(vw*.4,vh*.62),x0=sm?(vw-size)/2:vw*.72-size/2,y0=sm?vh*.1:(vh-size)/2;
    // En móvil, en el hueco entre la barra de arriba y el texto (como las imágenes de los capítulos). Si no cabe, se
    // queda tenue detrás: con la forma completa delante, el texto y los botones de la sección se leían mal
    if(sm){const[bx,by,bw,bh]=chapterBox(st,1),s=Math.min(size,bw);
      if(s>=96){size=s;x0=bx+(bw-s)/2;y0=by+(bh-s)/2}else st.alpha=Math.min(st.alpha,.16)}
    st.t=toTargets(sample(240,240,SHAPES[shape]),x0,y0,size/240,size/240);
  }
  placeBoatShot();placePhone();
  applyTone();
}
const mouse={x:-999,y:-999,hit:0};
let hp=0,heroFade=-1;
const heroReveal=$$('.stick .reveal');
/* Fondo: plano de obra con rejilla, rastro de los cursores y mira con coordenadas */
function drawField(now){
  const[r,g,b]=inkRgb,step=72,off=-(SY*.35)%step;
  ctx.globalAlpha=1;ctx.lineWidth=1;
  ctx.strokeStyle=`rgba(${r},${g},${b},.055)`;ctx.beginPath();
  for(let x=(vw%step)/2;x<vw;x+=step){ctx.moveTo(x+.5,0);ctx.lineTo(x+.5,vh)}
  for(let y=off;y<vh;y+=step){ctx.moveTo(0,y+.5);ctx.lineTo(vw,y+.5)}
  ctx.stroke();
  ctx.fillStyle=`rgba(${r},${g},${b},.3)`;
  for(let x=(vw%step)/2;x<vw;x+=step*4)for(let y=off;y<vh;y+=step*4){ctx.fillRect(x-4,y,9,1);ctx.fillRect(x,y-4,1,9)}
  ctx.lineWidth=1;
  for(const c of cursors){
    const t=c.trail;if(paused||t.length<8||c.el.classList.contains('off'))continue;
    ctx.strokeStyle=c.col;ctx.globalAlpha=SY>vh*.3?.2:.42;ctx.beginPath();ctx.moveTo(t[0],t[1]);
    for(let i=2;i<t.length;i+=2)ctx.lineTo(t[i],t[i+1]);ctx.stroke();
  }
  ctx.globalAlpha=1;ctx.lineWidth=1;
  if(fine&&mouse.x>0){
    ctx.strokeStyle=`rgba(${r},${g},${b},.16)`;ctx.setLineDash([3,6]);ctx.beginPath();
    ctx.moveTo(mouse.x+.5,0);ctx.lineTo(mouse.x+.5,vh);ctx.moveTo(0,mouse.y+.5);ctx.lineTo(vw,mouse.y+.5);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle=`rgba(${r},${g},${b},.6)`;ctx.font='400 10px "Martian Mono",monospace';ctx.textAlign='right';
    ctx.fillText(`x ${Math.round(mouse.x)}  y ${Math.round(mouse.y+SY)}  ${T.layerLabel}: ${layer}`,vw-14,vh-14);
    // Solo se escribe si el ratón se ha movido; es un transform, sin repintado
    if(mouse.x!==auraX||mouse.y!==auraY){auraX=mouse.x;auraY=mouse.y;aura.style.transform=`translate(${auraX}px,${auraY}px)`}
  }
}
function stepDust(f,now){
  const y=SY;
  hp=clamp(y/(vh*.3));
  // Redondeado y solo si cambia: con la portada fuera de pantalla no se toca el DOM en cada frame
  const fade=Math.round((1-smooth(clamp(y/(vh*.42))))*500)/500;
  if(fade!==heroFade&&!root.classList.contains('intro')){
    heroFade=fade;nameEl.style.opacity=fade;heroReveal.forEach(e=>e.style.opacity=fade);
  }
  let i=0;while(i<stops.length-2&&y>=stops[i+1].s)i++;
  const a=stops[i],b=stops[i+1];
  const raw=clamp((y-a.e)/Math.max(1,b.s-a.e));
  // El viaje ocupa el centro del tramo; hacia una meseta termina justo al llegar y desde ella sale nada más empezar
  const lo=a.flat?0:.22,hi=b.flat?1:.78;
  let t=smooth(clamp((raw-lo)/(hi-lo)));
  let al=(a.alpha+(b.alpha-a.alpha)*t);
  // Sin animaciones: las imágenes en puntos (retrato, apretón de manos) aparecen ya formadas (fundido, sin viaje)
  if(rm&&(a.flat||b.flat||a.z||b.z)){t=raw<.5?0:1;al=(t?b.alpha:a.alpha)*smooth(clamp(Math.abs(raw-.5)*4))}
  if(i===0)al*=clamp(hp*1.6);
  const ta=a.t,tb=b.t;
  // Paradas ancladas (el velero): sus dianas suben y bajan con el contenido
  const oa=a.anchor?a.s-y:0,ob=b.anchor?b.s-y:0;
  boat.w=a===boat.st?1-t:b===boat.st?t:0;
  // Del velero a la web: cada punto lleva el progreso de su grupo de retardo (boat.mb) y sale en arco
  const bm=boat.moving&&!rm&&boat.st.shot?boat:null,MBN=MB/N;
  if(bm)al+=(1-al)*clamp(boat.m);
  // Junto al velero los puntos no huyen del ratón: se inclinan hacia él (boat.pull, de 0 a 1, lo calcula stepBoat)
  // Lo mismo junto al móvil de Zalapp (phone.pull)
  phone.w=a===phone.st?1-t:b===phone.st?t:0;
  // La brújula: la aguja (grupos 5 y 6 de comp.g) gira alrededor del centro con comp.ang; el resto se queda quieto
  comp.w=a===comp.st?1-t:b===comp.st?t:0;
  const cbox=comp.st?.box,cpA=!!cbox&&a===comp.st,cpB=!!cbox&&b===comp.st,cg=comp.g;
  const cc=Math.cos(comp.ang.x),cs=Math.sin(comp.ang.x),ccx=comp.cx,ccy=comp.cy;
  const atBoat=boat.w>.5&&!!boat.st?.shot,atPhone=phone.w>.5&&!!phone.st?.box,pull=atBoat&&!bm?boat.pull:atPhone?phone.pull:0;
  // Encima de la brújula los puntos tampoco huyen del ratón: la aguja lo sigue
  const atComp=comp.w>.5&&!!cbox;
  const repel=atBoat||atPhone||atComp?0:bm?1-clamp(boat.m*4):1;
  // Pantalla encendida: los puntos de dentro se apartan hacia los bordes (phone.p, de 0 a 1, en unos 220 ms)
  const pp=phone.p?smooth(phone.p):0,peA=pp&&a===phone.st?a.edge:null,peB=pp&&b===phone.st?b.edge:null,pe=peA||peB;
  // El velero se mece en reposo: ±1,5° alrededor de la base y 2 px arriba y abajo, cada 4 s (sobre las dianas)
  let rkA=false,rkB=false,rc=1,rs=0,rdy=0,rpx=0,rpy=0;
  if(!calm()&&boat.st?.box&&(a===boat.st||b===boat.st)){busy=true;
    const ph=now*6.2832/BOAT_ROCK_MS,calm=1-clamp(boat.m),q=BOAT_ROCK_DEG*Math.PI/180*Math.sin(ph)*calm,[bx,by,bw,bh]=boat.st.box;
    rc=Math.cos(q);rs=Math.sin(q);rdy=BOAT_BOB_PX*Math.cos(ph)*calm;rpx=bx+bw/2;rpy=by+bh*.95;rkA=a===boat.st;rkB=b===boat.st;
  }
  const mr=small()?70:110,mr2=mr*mr,PR2=BOAT_PULL_R*BOAT_PULL_R;
  // Ruido solo cuando no se hace scroll: entra en medio segundo. Con los puntos invisibles (arriba del todo, al = 0)
  // no hay ruido: no se vería, y mantenía el bucle despierto aunque los cursores estuvieran en reposo
  const amp=calm()||al<.01?0:NOISE*smooth(clamp((now-scrollT-150)/500));
  const dm=Math.pow(.8,f),mx=mouse.x,my=mouse.y;
  if(amp)busy=true;
  let moving=false;
  for(let n=0;n<N;n++){
    const k=n*2;
    let ax=ta[k],ay=ta[k+1],bx=tb[k],by=tb[k+1];
    if(rkA){const u=ax-rpx,v=ay-rpy;ax=rpx+u*rc-v*rs;ay=rpy+u*rs+v*rc+rdy}
    if(rkB){const u=bx-rpx,v=by-rpy;bx=rpx+u*rc-v*rs;by=rpy+u*rs+v*rc+rdy}
    if(cpA&&cg[n]>=5){const u=ax-ccx,v=ay-ccy;ax=ccx+u*cc-v*cs;ay=ccy+u*cs+v*cc}
    if(cpB&&cg[n]>=5){const u=bx-ccx,v=by-ccy;bx=ccx+u*cc-v*cs;by=ccy+u*cs+v*cc}
    if(peA){ax+=peA[k]*pp;ay+=peA[k+1]*pp}
    if(peB){bx+=peB[k]*pp;by+=peB[k+1]*pp}
    let gx=ax+(bx-ax)*t,gy=ay+oa+(by+ob-ay-oa)*t;
    // Atracción suave: cada punto se acerca un poco al ratón, menos cuanto más lejos está
    if(pull){const u=mx-gx,v=my-gy,q=BOAT_PULL*pull/(1+(u*u+v*v)/PR2);gx+=u*q;gy+=v*q}
    if(bm){const p=bm.mb[(n*MBN)|0];
      if(p>0){
        // Recto de su sitio en el barco a su sitio en la web, más un empujón hacia fuera desde el centro
        // de la web que crece y se anula (sin(π·p)): se separa y vuelve, como las letras en la intro
        const sh=bm.st.shot.t,lx=gx+(sh[k]-gx)*p,ly=gy+(sh[k+1]-gy)*p,ox=lx-bm.cx,oy=ly-bm.cy;
        const q=Math.sin(Math.PI*clamp(p))*bm.arc*(.5+jx[n])/(Math.hypot(ox,oy)||1);
        gx=lx+ox*q;gy=ly+oy*q;
      }}
    // (px y py son Float32Array: se compara con margen, no con !==, o nunca darían igual)
    if(rm){if(Math.abs(px[n]-gx)+Math.abs(py[n]-gy)>.01)moving=true;px[n]=gx;py[n]=gy;continue}
    if(amp){const w=now*nfq[n]+nph[n];gx+=Math.sin(w)*amp;gy+=Math.cos(w*1.31+nph[n])*amp}
    const e=ez[n]*f*(pe&&(pe[k]||pe[k+1])?2.6:1);
    pvx[n]+=(gx-px[n])*e*.55;pvy[n]+=(gy-py[n])*e*.55;
    const dx=px[n]-mx,dy=py[n]-my,d2=dx*dx+dy*dy;
    if(repel&&d2<mr2&&d2>1){const q=(1-d2/mr2)*3.2*repel/Math.sqrt(d2);pvx[n]+=dx*q*f;pvy[n]+=dy*q*f}
    pvx[n]*=dm;pvy[n]*=dm;px[n]+=pvx[n]*f;py[n]+=pvy[n]*f;
    // Red de seguridad: si algo trae NaN o Infinity, el punto vuelve a su sitio (NaN no se arregla solo)
    if(!(Math.abs(px[n])<1e6&&Math.abs(py[n])<1e6)){px[n]=Number.isFinite(gx)?gx:rand(0,vw);py[n]=Number.isFinite(gy)?gy:rand(0,vh);pvx[n]=pvy[n]=0}
    if(!moving&&pvx[n]*pvx[n]+pvy[n]*pvy[n]>.0004)moving=true;
  }
  if(moving)busy=true;
  for(let c=0;c<3;c++){dustNow[c]+=(dustTarget[c]-dustNow[c])*.06;if(Math.abs(dustTarget[c]-dustNow[c])>.5)busy=true}
  ctx.clearRect(0,0,vw,vh);
  try{drawField(now)}catch(e){console.error(e)}
  if(al<.01)return;
  ctx.globalAlpha=al;
  const lift=c=>Math.min(255,dustNow[c]*.72+90)|0;
  ctx.fillStyle=`rgb(${lift(0)},${lift(1)},${lift(2)})`;
  const za=a.z,zb=b.z,mz=bm&&bm.st.shot.z;
  // Con la brújula delante, la punta norte de la aguja (grupo 5) y la letra encendida (1-4) van en una segunda
  // pasada con su color: en la primera se saltan y se guarda su tamaño (dsz)
  const cw=cpA||cpB?comp.w:0,hl=cw>.01,glow=comp.glow;
  for(let n=0;n<N;n++){
    let s=ps[n];
    if(za||zb){const s0=za?za[n]:ps[n];s=s0+((zb?zb[n]:ps[n])-s0)*t;if(mz)s+=(mz[n]-s)*clamp(bm.mb[(n*MBN)|0])}
    if(hl){const g=cg[n];if(g===5||(g>=1&&g<=4&&glow[g-1]>.01)){dsz[n]=s;continue}}
    ctx.fillRect(px[n],py[n],s,s);
  }
  if(hl){
    const base=[lift(0),lift(1),lift(2)],mix=(c,k)=>`rgb(${base.map((v,i)=>Math.round(v+(c[i]-v)*k)).join(',')})`;
    ctx.fillStyle=mix(comp.hot,cw);
    for(let n=0;n<N;n++)if(cg[n]===5)ctx.fillRect(px[n],py[n],dsz[n],dsz[n]);
    // La letra se ilumina: hacia el color del texto y un poco más gruesa
    for(let k=0;k<4;k++){const q=glow[k]*cw;if(glow[k]<=.01)continue;
      ctx.fillStyle=mix(comp.ink,q);const g=k+1,m=1+.45*q;
      for(let n=0;n<N;n++)if(cg[n]===g){const s=dsz[n]*m;ctx.fillRect(px[n]-(s-dsz[n])/2,py[n]-(s-dsz[n])/2,s,s)}}
  }
  ctx.globalAlpha=1;
}

// Lleva la página hasta una parada (donde su forma está completa), salvo que ya esté ahí
function toStop(st){if(Math.abs(scrollY-st.s)<=40)return false;scrollTo({top:st.s,behavior:rm?'auto':'smooth'});return true}

/* ---------- Nautes: del velero a la web ---------- */
// Si tiene valor, el clic sobre la captura abre la web en otra pestaña; vacía, no hay enlace
const NAUTES_URL='https://nautes.es';
// Retardo según el índice del punto: MB grupos, el grupo g sale g·MB_MS ms más tarde (de 0 a 120 ms)
const MB=16,MB_MS=8;
// Muelle del progreso m (rad/s y amortiguación): ni lineal ni con duración fija, y se puede dar la vuelta a medias
const BOAT_W=9,BOAT_Z=.9,BOAT_HOLD_MS=300,SHOT_FADE_MS=350;
// Reposo: vaivén (grados, px y periodo) y atracción hacia el ratón cuando se acerca a menos de BOAT_NEAR px
const BOAT_ROCK_DEG=1.5,BOAT_BOB_PX=2,BOAT_ROCK_MS=4000,BOAT_NEAR=140,BOAT_PULL=.08,BOAT_PULL_R=220;
const boat={st:stops.find(s=>s.shape==='morph')||null,w:0,want:0,m:0,v:0,mb:new Float32Array(MB),moving:false,
  hT:new Float64Array(64),hM:new Float32Array(64),hN:0,shown:false,holdT:0,closeAt:0,openY:0,done:false,cx:0,cy:0,arc:0,rect:'',btn:null,veil:null,img:null,
  // Invitación: atracción (pull), sonar, cursor aparcado (park) o, sin animaciones, uno fijo (cue). seen: ya se completó
  pull:0,seen:false,used:false,sonar:null,sonarOn:false,sonarT:'',park:null,
  // Botón «Visitar nautes.es» que sigue al cursor sobre la web (go): posición, si se ve, y si se abrió con teclado
  go:null,gx:0,gy:0,goVis:false,goT:'',key:false,live:false,arrive:false};
// Cuando alguien completa la transformación, el sonar y el cursor de la proa dejan de salir en esta sesión
const SEEN_KEY='nautes-velero-visto';
try{boat.seen=sessionStorage.getItem(SEEN_KEY)==='1'}catch(e){}
const CUE=fine?T.nautesBoat.cueMouse:T.nautesBoat.cueTouch;
$('#nautesLink').addEventListener('click',()=>track('nautes-web'));
if(boat.st){
  // Sonar: un anillo que sale de la base del barco (el aro interior lo anima el CSS; este solo se coloca)
  boat.sonar=document.createElement('div');boat.sonar.className='sonar';boat.sonar.setAttribute('aria-hidden','true');boat.sonar.appendChild(document.createElement('i'));
  document.body.appendChild(boat.sonar);
  boat.park=parker(CUE,'#00788C');
  // El botón está siempre en el orden del Tab (A-01). Fuera de su escena no recibe el puntero (.idle) y, al
  // enfocarlo, la página baja hasta el velero; al llegar, se transforma. Solo se quita si el JSON no llega
  const b=boat.btn=document.createElement('button');
  b.type='button';b.id='nautesBoat';b.className='boat-hit idle';b.setAttribute('aria-label',T.nautesBoat.label);
  boat.st.el.querySelector('.proj-copy').after(b); // en el orden del teclado, entre el texto y las boyas
  boat.veil=document.createElement('div');boat.veil.className='nautes-veil';
  boat.img=document.createElement('img');boat.img.className='nautes-shot';boat.img.alt=T.nautesBoat.alt;boat.img.decoding='async';
  // Con la web puesta, un botón que sigue al cursor sobre ella (decorativo: el clic lo recoge boat.btn, que lleva el nombre)
  boat.go=document.createElement('span');boat.go.className='nautes-go';boat.go.setAttribute('aria-hidden','true');boat.go.textContent=T.nautesBoat.go;
  document.body.append(boat.veil,boat.img,boat.go);
  addEventListener('keydown',()=>{boat.key=true},true);addEventListener('pointerdown',()=>{boat.key=false},true);
  addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&(e.movementX||e.movementY))boat.key=false},{passive:true}); // mover el ratón también cuenta
  // Ratón: entrar o enfocar transforma; salir del área (velero + web) o perder el foco lo deshace.
  // Justo después de un scroll no: la web aparecería sola al pasar el velero por debajo del puntero
  const hover=e=>{if(e.pointerType==='mouse'&&performance.now()-scrollT>250)openBoat()};
  b.addEventListener('pointerenter',hover);b.addEventListener('pointermove',e=>{if(!boat.want)hover(e)});
  b.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')closeBoat()});
  // Al enfocarlo, la página va hasta donde el velero está entero (aunque ya cuente como activo, puede quedar a medias)
  // Si hay que bajar, se transforma al llegar (arrive): abrirlo antes lo cerraría el propio scroll
  b.addEventListener('focus',()=>{if(toStop(boat.st))boat.arrive=true;else openBoat()});
  b.addEventListener('blur',()=>{boat.arrive=false;closeBoat()});
  // Táctil: tocar transforma (y tocar fuera, más abajo, deshace). Con la captura ya puesta, el clic encima abre la web
  b.addEventListener('click',e=>{
    if(!boat.want||boat.closeAt){openBoat();return}
    const[x,y,w,h]=boat.st.shotBox,kbd=!e.detail;
    if(boat.shown&&NAUTES_URL&&(kbd||e.clientX>=x&&e.clientX<=x+w&&e.clientY>=y&&e.clientY<=y+h)){track('nautes-web');window.open(NAUTES_URL,'_blank','noopener')}
  });
  document.addEventListener('pointerdown',e=>{if(boat.want&&e.target!==b)closeBoat()});
  // Si se hace scroll con la web montada, se deshace sola
  addEventListener('scroll',()=>{if(boat.want&&!boat.closeAt&&Math.abs(scrollY-boat.openY)>6)closeBoat()},{passive:true});
}
function openBoat(){
  if(!boat.st?.shot||!boat.live)return;
  if(boat.want&&!boat.closeAt)return;
  if(!boat.img.src)boat.img.src=import.meta.env.BASE_URL+(boat.st.el.dataset.shot||'').replace(/^\//,'');
  boat.closeAt=0;boat.want=1;boat.openY=scrollY;boat.used=true;
  boat.veil.classList.add('on');boat.btn.classList.add('open');
  // Mientras dura, el botón queda por encima del velo y los puntos también (estos, solo con animaciones: ver style.css)
  root.classList.add('nautes-on');
}
// Al deshacer, primero se va la captura y luego vuelan los puntos de vuelta al velero
function closeBoat(){
  if(!boat.want||boat.closeAt)return;
  const fade=boat.shown&&!rm?SHOT_FADE_MS:0;
  boat.img.classList.remove('on');boat.btn.classList.remove('link','open');boat.shown=false;boat.holdT=0;
  boat.closeAt=performance.now()+fade;
}
// La captura y el centro de la web se recolocan con la maqueta (layout)
function placeBoatShot(){
  const st=boat.st;if(!st?.shot)return;
  const[x,y,w,h]=st.shotBox,s=boat.img.style;
  s.left=x+'px';s.top=y+'px';s.width=w+'px';s.height=h+'px';
  boat.cx=x+w/2;boat.cy=y+h/2;boat.arc=Math.min(w*.1,90);
}
// m en el instante now - ms, sacado del historial (interpolado)
function boatPast(now,ms){
  const T0=now-ms,H=boat.hT,M=boat.hM,n=Math.min(boat.hN,64);
  for(let j=1;j<=n;j++){const k=(boat.hN-j)&63;
    if(H[k]<=T0){if(j===1)return M[k];const k2=(k+1)&63,u=(T0-H[k])/Math.max(1e-3,H[k2]-H[k]);return M[k]+(M[k2]-M[k])*u}}
  return n?M[(boat.hN-n)&63]:0;
}
function stepBoat(f,now){
  const st=boat.st;if(!st)return;
  // El botón solo actúa con la parada activa (t > 0,9) y si el JSON llegó. Si se enfocó antes de llegar, se
  // transforma al llegar
  const live=!!st.shot&&boat.w>.9,b=boat.btn;
  if(live!==boat.live){boat.live=live;b.classList.toggle('idle',!live);if(!live)closeBoat()}
  // Ha llegado: en la parada y sin scroll desde hace 150 ms (el scroll suave tarda un frame en dar su primer evento)
  if(boat.arrive&&live&&Math.abs(SY-st.s)<=40&&now-scrollT>150){boat.arrive=false;if(document.activeElement===b)openBoat()}
  if(b.hidden!==!!st.failed)b.hidden=!!st.failed;
  if(boat.closeAt&&now>=boat.closeAt){boat.closeAt=0;boat.want=0;boat.veil.classList.remove('on')}
  if(boat.want||boat.moving||boat.closeAt||boat.arrive||boat.pull||boat.goVis)busy=true;
  if(boat.want||boat.moving){
    if(rm){boat.m=boat.want;boat.v=0}
    else{const dt=f/60;boat.v+=(BOAT_W*BOAT_W*(boat.want-boat.m)-2*BOAT_Z*BOAT_W*boat.v)*dt;boat.m+=boat.v*dt}
    const k=boat.hN&63;boat.hT[k]=now;boat.hM[k]=boat.m;boat.hN++;
    let any=boat.want>0;
    for(let g=0;g<MB;g++){const p=g?boatPast(now,g*MB_MS):boat.m;boat.mb[g]=p;if(Math.abs(p)>.001)any=true}
    // En reposo del todo: se limpia y se deja de calcular hasta la próxima vez
    if(!any){boat.m=boat.v=0;boat.mb.fill(0);boat.hN=0;root.classList.remove('nautes-on')}
    boat.moving=any;
  }
  // Completo: m en 1 durante 300 ms y la captura cargada, entonces se funde encima
  if(boat.want&&!boat.closeAt&&boat.m>.995&&Math.abs(boat.v)<.05){
    boat.holdT||=now;
    if(!boat.shown&&(rm||now-boat.holdT>=BOAT_HOLD_MS)&&boat.img.complete&&boat.img.naturalWidth){
      boat.shown=true;boat.img.classList.add('on');if(NAUTES_URL)boat.btn.classList.add('link');
      if(!boat.done){boat.done=true;track('nautes-velero')}
      if(!boat.seen){boat.seen=true;try{sessionStorage.setItem(SEEN_KEY,'1')}catch(e){}}
    }
  }else boat.holdT=0;
  stepInvite(f,now,live);
  stepGo(f);
  // Fuera de la escena solo se coloca si tiene el foco (para que el anillo del foco vaya con el velero mientras
  // la página baja); sin los puntos todavía, sobre su hueco
  if(!live&&document.activeElement!==b)return;
  let x,y,w,h;
  if(st.box){[x,y,w,h]=st.box;y+=st.s-SY}
  else{const q=st.el.querySelector('.boat-slot').getBoundingClientRect();x=q.left;y=q.top;w=q.width;h=q.height}
  if(boat.want&&st.shotBox){const[sx,sy,sw,sh]=st.shotBox,x2=Math.max(x+w,sx+sw),y2=Math.max(y+h,sy+sh);x=Math.min(x,sx);y=Math.min(y,sy);w=x2-x;h=y2-y}
  const r=`${Math.round(x)},${Math.round(y)},${Math.round(w)},${Math.round(h)}`;
  if(r!==boat.rect){boat.rect=r;const s=boat.btn.style;s.transform=`translate(${Math.round(x)}px,${Math.round(y)}px)`;s.width=Math.round(w)+'px';s.height=Math.round(h)+'px'}
}
/* «Visitar nautes.es ↗»: con la web puesta, el botón va pegado al cursor mientras está encima de la captura (y el
   puntero se esconde: el botón hace de cursor). Fuera de la captura se oculta. En táctil o con teclado, que no hay
   cursor, se queda abajo en el centro de la web */
function stepGo(f){
  if(!boat.st.shotBox)return; // sin el JSON todavía no hay web (antes lanzaba un TypeError en cada frame)
  const on=boat.shown&&!!NAUTES_URL,[x,y,w,h]=boat.st.shotBox;
  let vis=false,tx=0,ty=0,follow=false;
  if(on){
    if(fine&&!boat.key){if(mouse.x>=x&&mouse.x<=x+w&&mouse.y>=y&&mouse.y<=y+h){vis=follow=true;tx=mouse.x;ty=mouse.y}}
    else{vis=true;tx=x+w/2;ty=y+h-36}
  }
  if(vis!==boat.goVis){
    boat.goVis=vis;boat.go.classList.toggle('on',vis);boat.btn.classList.toggle('go-cursor',vis&&follow);root.classList.toggle('go-follow',vis&&follow);
    if(vis){boat.gx=tx;boat.gy=ty} // aparece donde está el cursor, sin viajar desde la otra punta
  }
  if(!vis)return;
  // Sigue al cursor con un poco de retraso (se nota que lo arrastras); sin animaciones, pegado
  const k=rm?1:1-Math.pow(.62,f);boat.gx+=(tx-boat.gx)*k;boat.gy+=(ty-boat.gy)*k;
  const t=`translate(${boat.gx.toFixed(1)}px,${boat.gy.toFixed(1)}px) translate(-50%,-50%)`;
  if(t!==boat.goT){boat.goT=t;boat.go.style.transform=t}
}
/* Invitación a pasar por el velero: mientras el proyecto está en pantalla y nadie lo ha usado todavía,
   un cursor del equipo espera junto a la proa con su etiqueta y sale un pulso de sonar cada 2,5 s.
   Al acercar el ratón, los puntos se inclinan hacia él (boat.pull, que usa stepDust) */
function stepInvite(f,now,live){
  const st=boat.st;
  let x=0,y=0,w=0,h=0;
  if(st.box){[x,y,w,h]=st.box;y+=st.s-SY}
  const vis=!!st.shot&&boat.w>.5&&y+h>40&&y<vh-40;
  if(!vis)boat.used=false; // al salir del proyecto, la próxima vez vuelve a invitar (si no se completó)
  // Con una boya abierta, el cursor y el sonar se apartan: la etiqueta de la boya queda encima del velero
  const inv=vis&&introDone&&!boat.seen&&!boat.want&&!boat.used&&buoyOpen<0;
  let tp=0;
  if(fine&&!rm&&live&&!boat.want&&mouse.x>0){
    const dx=Math.max(x-mouse.x,0,mouse.x-x-w),dy=Math.max(y-mouse.y,0,mouse.y-y-h),d=Math.hypot(dx,dy);
    tp=d<BOAT_NEAR?1-d/BOAT_NEAR:0;
  }
  boat.pull+=(tp-boat.pull)*(1-Math.pow(.85,f));if(boat.pull<.002)boat.pull=0;
  const son=inv&&!calm();
  if(son!==boat.sonarOn){boat.sonarOn=son;boat.sonar.classList.toggle('on',son)}
  if(son){const t=`translate(${Math.round(x+w/2)}px,${Math.round(y+h*.97)}px)`;if(t!==boat.sonarT){boat.sonarT=t;boat.sonar.style.transform=t}}
  // La punta del cursor, junto a la proa (a la derecha del casco)
  stepPark(boat.park,inv,x+w*.95+4,y+h*.93+4,now);
}

/* Cursor aparcado: uno del equipo (script = true mientras dura) espera con la punta en (x, y) y otra etiqueta.
   Si la etiqueta no cabe a la derecha, va a la izquierda del cursor. Sin animaciones no hay equipo: un cursor
   fijo con el mismo aspecto (cue) hace de invitación. Lo usan el velero de Nautes y el cuaderno de Zalapp */
function parker(label,color){return{label,color,c:null,keep:'',w:0,cue:null,t:''}}
function stepPark(P,on,x,y,now){
  if(calm()){
    if(P.c){const c=P.c;c.park=null;c.script=false;c.el.classList.remove('flip');c.el.querySelector('span').textContent=P.keep;P.c=null}
    if(on&&!P.cue){
      const q=P.cue=document.createElement('div');q.className='c park-cue';q.setAttribute('aria-hidden','true');q.style.setProperty('--c',P.color);
      q.innerHTML=CURSOR_SVG+'<span></span>';q.querySelector('span').textContent=P.label;document.body.appendChild(q);P.w=q.querySelector('span').offsetWidth;
    }
    if(!P.cue)return;
    if(P.cue.hidden===on)P.cue.hidden=!on;
    if(on){P.cue.classList.toggle('flip',x+15+P.w+12>vw);const t=`translate(${Math.round(x)}px,${Math.round(y)}px)`;if(t!==P.t){P.t=t;P.cue.style.transform=t}}
    return;
  }
  if(on&&!P.c){
    const pool=cursors.slice(3,LABELS.length).filter(c=>!c.job&&!c.script&&!c.follow&&!c.task&&!c.park);
    if(pool.length){
      const c=pool.sort((p,q)=>Math.hypot(p.x-x,p.y-y)-Math.hypot(q.x-x,q.y-y))[0],sp=c.el.querySelector('span');
      c.script=true;c.park={x,y};P.keep=sp.textContent;sp.textContent=P.label;P.w=sp.offsetWidth;c.el.classList.remove('off');P.c=c;
    }
  }
  if(!on&&P.c){const c=P.c;c.park=null;c.script=false;c.next=now+500;c.el.classList.remove('flip');c.el.querySelector('span').textContent=P.keep;P.c=null}
  if(P.c){P.c.park.x=x;P.c.park.y=y;P.c.el.classList.toggle('flip',x+15+P.w+12>vw)}
}

/* ---------- El equipo acompaña el scroll ---------- */
function updateTeam(){
  const heroOut=SY>vh*.42;
  if(!contactBox)measureTones();
  const top=contactBox.top-SY,bottom=contactBox.bottom-SY;
  gather=top<vh*.45&&bottom>0;
  cursors.forEach((c,i)=>{
    const guide=i<3;
    c.el.classList.toggle('off',introDone&&heroOut&&!gather&&!strike&&!order&&!c.task&&!c.park&&!(guide&&(c.follow||!small())));
  });
}
const selObs=new IntersectionObserver(es=>{
  es.forEach(e=>{
    if(e.target.id==='mail')return;
    const free=cursors.slice(0,3).find(c=>!c.follow&&!c.task);
    const cur=cursors.slice(0,3).find(c=>c.follow===e.target);
    if(e.isIntersecting&&free&&!cur&&introDone){free.follow=e.target;free.job=null;free.box.classList.add('on')}
    if(!e.isIntersecting&&cur){cur.follow=null;cur.box.classList.remove('on');cur.tx=rand(.2,.8)*vw;cur.ty=rand(.8,.95)*vh;cur.next=performance.now()+1200}
  });
},{rootMargin:'-18% 0px -22% 0px'});
$$('[data-sel]').forEach(e=>selObs.observe(e));

/* ---------- Escena «Ese equipo soy yo»: retrato de partículas y sellos de formación ---------- */
// p = progreso del scroll dentro de la escena: 0 cuando el sticky se pega arriba, 1 cuando se suelta
const PORTRAIT_IN=.3,PORTRAIT_OUT=.92;  // el retrato está completo entre estos dos puntos (meseta)
// Cada sello: a (los cursores lo traen desde la derecha), hover (encima de su sitio), drop (estampa), end (fin del tramo)
const STAMP_T=[{a:.5,hover:.64,drop:.66,end:.7},{a:.7,hover:.84,drop:.86,end:.92}];
/* El golpe del sello. En el aire está más cerca de ti: se ve un 6 % más grande (UP). Al caer acelera
   (como la gravedad) y en el impacto queda aplastado (SQUASH); luego vuelve a 1 con un muelle amortiguado
   (bounce 0,2 en unos 300 ms: casi sin rebote, solo asienta). La escena da un golpe seco hacia abajo */
const LIFT=40,DROP_MS=90,UP=1.06,SQUASH=.965,SETTLE_MS=420,SETTLE_DECAY=16.8,SETTLE_W=12.6,SHAKE_MS=200,SHAKE_PX=3;
const settle=t=>t>=SETTLE_MS?1:1-(1-SQUASH)*Math.exp(-SETTLE_DECAY*t/1000)*Math.cos(SETTLE_W*t/1000);
const scene={el:$('#open'),stick:$('#open .open-stick'),grid:$('#open .open-grid'),slot:$('#portraitSlot'),text:$('#openText'),top:0,len:1,on:false,shake:-1e9,op:-1};
const stamps=T.stamps.map((d,i)=>{
  const el=$('#stamp'+(i+1)),info=$('#stamp'+(i+1)+'Info');
  // Textos desde i18n.js; el HTML lleva la misma copia para quien navega sin JavaScript
  el.querySelector('.stamp-title').textContent=d.title;el.querySelector('.stamp-school').textContent=d.school;el.querySelector('.stamp-foot').textContent=d.foot;
  info.replaceChildren(...d.lines.map(l=>{const q=document.createElement('p');q.textContent=l;return q}));
  el.classList.toggle('half',!!d.half);info.hidden=true;
  return{n:i+1,el,info,slot:el.parentElement,cfg:STAMP_T[i],rot:parseFloat(getComputedStyle(el).getPropertyValue('--rot'))||0,
    mode:'out',dropT:-1e9,inked:false,open:false,crew:[],role:null,bringer:null,w:0,h:0,box:{x:0,y:0,w:0,h:0}};
});
function measureScene(){
  const r=scene.el.getBoundingClientRect();scene.top=r.top+scrollY;
  scene.len=Math.max(1,scene.el.offsetHeight-scene.stick.offsetHeight);
  stamps.forEach(st=>{st.w=st.el.offsetWidth;st.h=st.el.offsetHeight});
}
function goScene(q){scrollTo({top:scene.top+q*scene.len,behavior:rm?'auto':'smooth'})}
function setInk(st,on){if(st.inked===on)return;st.inked=on;st.el.classList.toggle('inked',on)}
function setStamp(st,on){
  if(on)stamps.forEach(o=>{if(o!==st)setStamp(o,false)});
  if(st.open===on)return;
  st.open=on;st.el.setAttribute('aria-expanded',on);st.info.hidden=!on;st.info.classList.remove('up');
  // Si el panel no cabe por encima de la barra de abajo (Auditar / Jefe de obra), se abre hacia arriba
  if(on){track('sello',{sello:st.n});if(st.info.getBoundingClientRect().bottom>vh-60)st.info.classList.add('up')}
}
function closeStamps(){stamps.forEach(st=>setStamp(st,false))}
stamps.forEach(st=>{
  st.el.addEventListener('click',()=>setStamp(st,!st.open));
  // Con teclado, si el sello aún no está puesto, baja hasta donde ya están estampados los dos
  st.el.addEventListener('focus',()=>{if(st.el.matches(':focus-visible')&&st.mode!=='landed')goScene(.9)});
});
document.addEventListener('pointerdown',e=>{if(!e.target.closest?.('.stamp-slot'))closeStamps()});
/* Cursores retenidos por un sello: carry (lo llevan), point (lo señalan al abrirlo), touch (lo retocan) */
function releaseCursor(c){c.task=null;c.script=false;c.rt=null;c.tx=vw+80;c.ty=c.y;c.next=performance.now()+1300}
function crewFor(st,n){
  let changed=false;
  while(st.crew.length>n){releaseCursor(st.crew.pop());changed=true}
  while(st.crew.length<n){
    const pool=freeCursors();if(!pool.length)break;
    const c=pool.includes(st.bringer)?st.bringer:pool[0];
    c.task=st;c.script=true;c.rt=null;
    // Si estaba escondido, entra desde fuera de la pantalla por la derecha
    if(c.el.classList.contains('off')){c.x=vw+30;c.y=clamp(st.box.y,40,vh-40);c.vx=c.vy=0;c.trail.length=0}
    st.crew.push(c);changed=true;
  }
  if(changed)updateTeam();
}
function aimTask(c,now){
  const st=c.task,b=st.box,i=st.crew.indexOf(c);
  if(st.role==='carry'){c.tx=b.x+b.w*(i?.78:.22);c.ty=b.y+6;return}
  if(st.role==='point'){c.tx=b.x+b.w-10;c.ty=b.y+b.h-8+Math.sin(now*.005)*3;return}
  // Retoque: espera al lado; cada pocos segundos se acerca, hace un trazo corto y se aparta
  const R=c.rt||(c.rt={ph:0,t:now+rand(900,1800),x:0,y:0});
  if(R.ph===0){c.tx=Math.min(b.x+b.w+24,vw-28);c.ty=b.y+b.h*.35;if(now>R.t){R.ph=1;R.t=now+450;R.x=b.x+b.w*rand(.25,.75);R.y=b.y+b.h*rand(.3,.7)}}
  else if(R.ph===1){c.tx=R.x;c.ty=R.y;if(now>R.t){R.ph=2;R.t=now+560}}
  else{const k=clamp(1-(R.t-now)/560);c.tx=R.x+Math.sin(k*Math.PI*3)*12;c.ty=R.y+k*6;if(now>R.t){R.ph=0;R.t=now+rand(2200,4200)}}
}
function stepScene(now){
  const y=SY,p=(y-scene.top)/scene.len,wasOn=scene.on;
  scene.on=y>scene.top-vh&&y<scene.top+scene.len+vh;
  if(!scene.on){if(wasOn){stamps.forEach(st=>crewFor(st,0));closeStamps()}return}
  const op=rm?1:Math.round(smooth(clamp(p/PORTRAIT_IN))*500)/500;
  if(op!==scene.op){scene.op=op;scene.text.style.opacity=op}
  // Primero se leen todas las medidas y después se escribe: leer tras mover un sello obligaría
  // al navegador a recalcular la maqueta a mitad de frame
  const rects=stamps.map(st=>st.slot.getBoundingClientRect());
  stamps.forEach((st,si)=>{
    const c=st.cfg,r=rects[si];
    const mode=rm?'landed':p<c.a?'out':p<c.drop?'carry':'landed';
    if(mode!==st.mode){
      // Solo se ve el golpe si se llega desde el tramo anterior; si la escena acaba de entrar en pantalla, ya está puesto
      if(mode==='landed'){st.dropT=!rm&&wasOn?now:-1e9;st.bringer=st.crew[0]||st.bringer}
      else{setInk(st,false);setStamp(st,false)}
      st.mode=mode;
    }
    let dx=0,dy=0,rot=st.rot,sc=1;
    const off=vw-r.left+40;
    if(mode==='out'){dx=off;dy=-LIFT;sc=UP}
    else if(mode==='carry'){
      const q=clamp((p-c.a)/(c.hover-c.a)),e=1-Math.pow(1-q,3);
      dx=off*(1-e);dy=-LIFT+(q>=1&&!calm()?Math.sin(now*.006)*2:0);rot+=7*(1-e);sc=UP;if(q>=1&&!calm())busy=true;
    }else{
      const t=now-st.dropT;
      // Caída: misma curva acelerada para la altura y para la escala (de UP a SQUASH justo en el impacto)
      if(t<DROP_MS+SETTLE_MS)busy=true;
      if(t<DROP_MS){const k=t/DROP_MS,g=k*k;dy=-LIFT*(1-g);sc=UP+(SQUASH-UP)*g}
      else{if(!st.inked){setInk(st,true);if(t<DROP_MS+120)scene.shake=now}sc=settle(t-DROP_MS)}
    }
    const tf=`translate(${dx}px,${dy}px) rotate(${rot}deg) scale(${sc})`;
    if(tf!==st.tf){st.tf=tf;st.el.style.transform=tf}
    st.box.x=r.left+dx;st.box.y=r.top+dy;st.box.w=st.w;st.box.h=st.h;
    st.role=rm?null:mode==='carry'?'carry':mode==='landed'&&st.open?'point':mode==='landed'&&st.n===2&&p<c.end?'touch':null;
    crewFor(st,st.role==='carry'?2:st.role?1:0);
  });
  // Golpe seco: hacia abajo, un rebote y se apaga (antes era ruido aleatorio en cada frame, que se leía como vibración)
  if(!rm&&now-scene.shake<SHAKE_MS){busy=true;const k=(now-scene.shake)/SHAKE_MS;scene.grid.style.transform=`translateY(${(SHAKE_PX*(1-k)*(1-k)*Math.sin(k*Math.PI*3)).toFixed(2)}px)`}
  else if(scene.grid.style.transform)scene.grid.style.transform='';
}

/* ---------- Zalapp ---------- */
// La encuesta, en la etapa «KM 47» del cuaderno: 47 puntos, uno por registro, y filtros por perfil
const dots=$('#dots');
const groups=[...Array(36).fill('as'),...Array(5).fill('au'),...Array(4).fill('fl'),...Array(2).fill('ot')];
groups.forEach(g=>{const d=document.createElement('i');d.className='dot on';d.dataset.g=g;dots.appendChild(d)});
const zOpts=[['as','au','fl','ot'],['as','au'],['as'],['au'],['fl'],['ot']].map((g,i)=>[T.zalapp[i],g]);
const zPills=$('#zPills'),zRead=$('#zRead');
zOpts.forEach(([t,g],i)=>{const b=document.createElement('button');b.type='button';b.className='pill';b.textContent=t;b.setAttribute('aria-pressed',i==0);
  b.onclick=()=>{track('zalapp-filtro',{filtro:ES.zalapp[i]});$$('.pill',zPills).forEach(x=>x.setAttribute('aria-pressed',x===b));zRead.textContent=t;$$('.dot').forEach(d=>d.classList.toggle('on',g.includes(d.dataset.g)));zFlt=g;artApi?.setFilter(g)};zPills.appendChild(b)});

/* Cuaderno de ruta: un <dialog> a pantalla completa con una página por etapa y un tacógrafo abajo.
   Se abre desde el móvil de puntos (más abajo) o, si este no está, desde la captura fija */
// Si tiene valor, «Ver la web» abre la web de Zalapp en otra pestaña; vacía, avisa de que está en obra
const ZALAPP_URL='';
const zDlg=$('#zDialog'),zSheet=$('#zSheet'),zLive=$('#zLive');
const zPages=$$('.log-page',zDlg),zMarks=$$('.tacho-mark',zDlg),zPrev=$('#zPrev'),zNext=$('#zNext'),zTacho=$('.tacho',zDlg);
const zLog={cur:-1,swipe:null,from:null};
const NF=new Intl.NumberFormat(LANG==='en'?'en-GB':'es-ES');
let logWait=false;
function openLog(from){
  // Las ilustraciones van en un módulo aparte (loadArt). Lo normal es que ya estén: se piden al acercarse el móvil.
  // Si no han llegado, se esperan como mucho 1,2 s; pasado ese tiempo el cuaderno se abre sin ellas, con la hoja de texto
  if(artCv&&!artApi){
    if(logWait)return;logWait=true;
    Promise.race([loadArt(),pause(1200)]).then(()=>{logWait=false;enableArt();showLog(from)});
    return;
  }
  showLog(from);
}
function showLog(from){
  // Antes de abrir, solo la etapa 0 maquetada: showModal() enfoca «Cerrar cuaderno» y eso obliga a maquetar el diálogo
  // entero en el mismo clic (con las nueve etapas, unos 200 ms en móvil). Las otras se maquetan después (zLayout)
  zLayout(0,false);
  zLog.from=from||null;root.classList.add('log-open');zDlg.showModal();artApi?.open();zGo(0,0,true);
}
// Al cerrar (botón o Escape), el foco vuelve a lo que abrió el cuaderno
zDlg.addEventListener('close',()=>{track('zalapp-cerrar',{etapa:zLog.cur+1});artApi?.close();enableArt();root.classList.remove('log-open');wake();const f=zLog.from;if(f&&!f.hidden&&f.getClientRects().length)f.focus()});
$('#zClose').addEventListener('click',()=>zDlg.close());
function zGo(i,dir,first){
  const n=zPages.length;i=Math.max(0,Math.min(n-1,i));
  if(i===zLog.cur&&!first)return;
  // Con las ilustraciones, las páginas que no tocan no se ocultan con hidden: se quedan maquetadas, pintadas y casi
  // transparentes, e inert (fuera del Tab, de los clics y del lector de pantalla). Así la que llega no se maqueta ni
  // se pinta de golpe en ese frame
  // Recién abierto (art.defer), solo se maqueta la etapa actual: las otras ocho, en el frame siguiente (P-05)
  const A=artApi&&artApi.art.on?artApi:null; // las ilustraciones, si están cargadas y el cuaderno se abrió con ellas
  zLayout(i,!!A&&!A.art.defer);
  const p=zPages[i];
  // La hoja gira un poco al pasar (con movimiento reducido, el CSS lo cambia por un fundido). Con las
  // ilustraciones de partículas, el texto entra cuando el 80 % de los puntos ha llegado a su sitio
  const turn=()=>{if(dir){void p.offsetWidth;p.classList.add(dir>0?'turn-fwd':'turn-back')}};
  // (sin el giro: con los puntos dibujando la hoja, el fundido basta, y el giro en 3D obligaba a rasterizar la página entera)
  if(A){p.classList.remove('ready');A.go(i,()=>p.classList.add('ready'))}else turn();
  zLog.cur=i;p.scrollTop=0;
  // aria-disabled en vez de disabled: si el botón con el foco se desactivara, el foco se perdería
  zPrev.setAttribute('aria-disabled',i===0);zNext.setAttribute('aria-disabled',i===n-1);
  zMarks.forEach((m,k)=>{m.classList.toggle('on',k===i);m.classList.toggle('past',k<i);if(k===i)m.setAttribute('aria-current','step');else m.removeAttribute('aria-current')});
  zTacho.style.setProperty('--p',i/(n-1));
  // El lector de pantalla anuncia el título de cada etapa
  zLive.textContent=T.zalappLog.stage(i+1,n,p.querySelector('.log-km').textContent,p.querySelector('.log-h').textContent);
  track('zalapp-etapa',{etapa:p.dataset.etapa});
  $$('[data-count]',p).forEach(countUp);
}
function zLayout(i,keep){
  zPages.forEach((p,k)=>{const off=k!==i;p.hidden=!keep&&off;p.inert=keep&&off;
    p.classList.toggle('near',keep&&Math.abs(k-i)===1);p.classList.toggle('off',keep&&Math.abs(k-i)>1);p.classList.remove('turn-fwd','turn-back')});
}
zPrev.addEventListener('click',()=>zGo(zLog.cur-1,-1));
zNext.addEventListener('click',()=>zGo(zLog.cur+1,1));
zMarks.forEach((m,i)=>{m.setAttribute('aria-label',T.zalappLog.mark(i+1,zPages[i].querySelector('.log-h').textContent));m.addEventListener('click',()=>zGo(i,i>zLog.cur?1:-1))});
zDlg.addEventListener('keydown',e=>{
  if(e.key==='ArrowRight'){e.preventDefault();zGo(zLog.cur+1,1)}
  else if(e.key==='ArrowLeft'){e.preventDefault();zGo(zLog.cur-1,-1)}
});
// Deslizar en táctil: horizontal y claro (no un scroll vertical torcido)
zSheet.addEventListener('pointerdown',e=>{zLog.swipe=e.pointerType==='mouse'?null:{x:e.clientX,y:e.clientY}});
zSheet.addEventListener('pointerup',e=>{
  const w=zLog.swipe;zLog.swipe=null;if(!w)return;
  const dx=e.clientX-w.x,dy=e.clientY-w.y;
  if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.4)zGo(zLog.cur+(dx<0?1:-1),dx<0?1:-1);
});
zSheet.addEventListener('pointercancel',()=>{zLog.swipe=null});
// Contadores: suben desde 0 al abrir la página; sin animaciones, la cifra directa
function countUp(el){
  const to=+el.dataset.count;cancelAnimationFrame(el.zRaf);
  if(rm){el.textContent=NF.format(to);return}
  const t0=performance.now(),D=1400;
  const tick=now=>{const k=Math.min(1,(now-t0)/D);el.textContent=NF.format(Math.round(to*(1-Math.pow(1-k,3))));if(k<1)el.zRaf=requestAnimationFrame(tick)};
  el.zRaf=requestAnimationFrame(tick);
}
// Cruce de caminos: cada salida enseña su línea al pulsarla. Señales del DAFO: se giran
$$('.exit-btn',zDlg).forEach(b=>{
  const line=$('#'+b.getAttribute('aria-controls'));line.hidden=true;
  b.addEventListener('click',()=>{const on=b.getAttribute('aria-expanded')!=='true';b.setAttribute('aria-expanded',on);line.hidden=!on;artApi?.marks()});
});
$$('.sign',zDlg).forEach((b,k)=>b.addEventListener('click',()=>{b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')!=='true');artApi?.pulse(k)}));

/* ---------- Carga en diferido (code splitting) ----------
   Lo que no hace falta para pintar la primera pantalla va en módulos aparte (src/scenes/). import() devuelve una
   promesa y Vite saca cada módulo a su propio archivo: el navegador solo lo descarga y lo analiza cuando se pide.
   near() lo pide cuando el elemento está a menos de «margin» de la pantalla, antes de que haga falta */
const near=(el,fn,margin='100% 0px')=>{
  if(!el)return;
  const o=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){o.disconnect();fn()}},{rootMargin:margin});
  o.observe(el);
};
/* Las ilustraciones de partículas del cuaderno: scenes/zalapp-art.js. artApi es null hasta que llegan */
const artCv=$('#zArt');
let artApi=null,artNext=null,artLoad=null,zFlt=['as','au','fl','ot'];
function loadArt(){
  if(!artCv)return Promise.resolve();
  return artLoad||(artLoad=import('./scenes/zalapp-art.js').then(m=>{
    artNext=m.createArt({$,$$,rand,clamp,small,isRm:()=>rm,sample,octx,ART_FONT,loadPoints,groups,zDlg,zLayout,zLog,NF,LANG});
    enableArt();
  }).catch(e=>console.error(e)));
}
// Se activan con el cuaderno cerrado: has-art cambia la maqueta de la hoja, y con él abierto daría un salto.
// Si llegan con el cuaderno abierto (red lenta), se activan al cerrarlo. Recogen el filtro y las salidas ya marcados
function enableArt(){
  if(!artNext||artApi||zDlg.open)return;
  artApi=artNext;zDlg.classList.add('has-art');artApi.setFilter(zFlt);artApi.marks();
}

// «Ver la web»: con ZALAPP_URL, otra pestaña; si está vacía, el aviso de que está en obra
function zalappWeb(msg){
  track('zalapp-movil',{accion:'web'});
  if(ZALAPP_URL){window.open(ZALAPP_URL,'_blank','noopener');return}
  msg.textContent=T.zalappLog.pending;clearTimeout(phone.msgT);phone.msgT=setTimeout(()=>{msg.textContent=''},6000);
}
// Cuando el móvil de Zalapp se acerca a la pantalla: se pide el módulo y se muestrea la etapa 0 por adelantado (P-05)
near($('#zPhone'),()=>loadArt().then(()=>artApi?.warmFirst()),'50% 0px');
// Captura fija (sin el JSON del móvil): el enlace abre el cuaderno y el botón hace lo mismo que en la hoja
$('#zStaticLog').addEventListener('click',e=>{e.preventDefault();track('zalapp-movil',{accion:'cuaderno'});openLog(e.currentTarget)});
$('#zStaticWeb').addEventListener('click',()=>zalappWeb($('#zMsg')));
// Enlace de texto de la ficha (A-01): siempre a la vista. Sin JavaScript lleva al cuaderno, que se ve abierto
$('#zLogLink').addEventListener('click',e=>{e.preventDefault();track('zalapp-movil',{accion:'cuaderno'});openLog(e.currentTarget)});

/* Zalapp: el móvil de puntos (public/zalapp/movil-puntos.json; screen = rectángulo de la pantalla dentro del móvil).
   Al pasar el ratón, con foco o con un toque, la pantalla se enciende: los puntos de dentro se apartan a los bordes
   (220 ms), se funde la captura real de la beta exactamente encima y sube con muelle una hoja con dos botones
   como los de la app. Al apagar, al revés: baja la hoja, se va la captura y vuelven los puntos.
   La invitación es la del velero: cursor aparcado, sonar, atracción suave y un botón invisible encima */
const PHONE_CLEAR_MS=220,PHONE_FADE_MS=300,PHONE_MARGIN=24,SHEET_W=15,SHEET_Z=.72,PHONE_SEEN='zalapp-movil-visto';
const phone={st:stops.find(s=>s.src&&s.el.querySelector('.phone-slot'))||null,w:0,live:false,on:false,via:'',p:0,k:0,kv:0,imgOn:false,offAt:-1e9,
  hit:null,scr:null,sheet:null,msg:null,rect:'',scrT:'',sheetT:'',
  pull:0,seen:false,used:false,sonar:null,sonarOn:false,sonarT:'',park:parker(fine?T.zalappPhone.cueMouse:T.zalappPhone.cueTouch,'#B3470F'),msgT:0};
try{phone.seen=sessionStorage.getItem(PHONE_SEEN)==='1'}catch(e){}
if(phone.st){
  const b=phone.hit=document.createElement('button');
  // Como el del velero: siempre en el orden del Tab; al enfocarlo fuera de su escena, la página baja hasta el móvil
  b.type='button';b.id='zalappPhone';b.className='phone-hit idle';b.setAttribute('aria-label',T.zalappPhone.label);
  // La pantalla: captura + hoja. Va justo detrás del botón para que el Tab pase del móvil a los dos botones de la hoja
  const scr=phone.scr=document.createElement('div');scr.className='phone-screen';
  scr.innerHTML='<img decoding="async"><div class="app-sheet"><span class="app-grip" aria-hidden="true"></span><button type="button" class="app-btn app-btn-main"></button><button type="button" class="app-btn app-btn-ghost"></button><p class="app-msg" role="status"></p></div>';
  scr.querySelector('img').alt=T.zalappPhone.alt;
  phone.sheet=scr.querySelector('.app-sheet');phone.msg=scr.querySelector('.app-msg');
  const[bLog,bWeb]=scr.querySelectorAll('.app-btn');bLog.textContent=T.zalappPhone.log;bWeb.textContent=T.zalappPhone.web;
  phone.st.el.querySelector('.proj-copy').after(b,scr);
  phone.sonar=document.createElement('div');phone.sonar.className='sonar sonar-phone';phone.sonar.setAttribute('aria-hidden','true');phone.sonar.appendChild(document.createElement('i'));
  document.body.appendChild(phone.sonar);
  // Ratón: al entrar (no justo después de un scroll, o se encendería solo al pasar por debajo del puntero).
  // Se apaga al salir del móvil con 24 px de margen (stepPhone). Teclado: al enfocarlo. Táctil: con un toque
  const hover=e=>{if(e.pointerType==='mouse'&&!phone.on&&performance.now()-scrollT>250)phoneOn('mouse')};
  b.addEventListener('pointerenter',hover);b.addEventListener('pointermove',hover);
  // El foco cuenta como teclado solo si lo último fue una tecla: al volver del cuaderno tras un clic, sigue mandando el ratón
  b.addEventListener('focus',()=>{toStop(phone.st);phoneOn(phone.key?'focus':fine?'mouse':'touch')});
  addEventListener('keydown',()=>{phone.key=true},true);
  addEventListener('pointerdown',()=>{phone.key=false},true);
  // Encendido con teclado y luego se mueve el ratón: manda el ratón (al salir del móvil, se apaga)
  addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&phone.on&&phone.via==='focus'&&(e.movementX||e.movementY))phone.via='mouse'},{passive:true});
  b.addEventListener('click',()=>{if(!phone.on)phoneOn('touch')});
  const inside=el=>el===b||scr.contains(el);
  document.addEventListener('focusin',e=>{if(phone.on&&!inside(e.target))phoneOff()});
  document.addEventListener('pointerdown',e=>{if(phone.on&&!inside(e.target))phoneOff()});
  bLog.addEventListener('click',()=>{track('zalapp-movil',{accion:'cuaderno'});phoneOff();openLog(b)});
  bWeb.addEventListener('click',()=>zalappWeb(phone.msg));
}
function phoneOn(via){
  if(!phone.live)return;
  if(!phone.on){
    track('zalapp-movil',{accion:'encender'});
    if(!phone.seen){phone.seen=true;try{sessionStorage.setItem(PHONE_SEEN,'1')}catch(e){}}
  }
  const img=phone.scr.querySelector('img');if(!img.src)img.src=import.meta.env.BASE_URL+'zalapp/beta-pantalla.webp';
  phone.on=true;phone.via=via;phone.used=true;
}
function phoneOff(){if(phone.on){phone.on=false;phone.msg.textContent=''}}
// Tamaño de la pantalla (con la maqueta): la captura con un 9 % de su ancho de radio; la letra de la hoja, a escala
function placePhone(){
  const st=phone.st;if(!st?.box||!st.data.screen)return;
  const[,,w,h]=st.box,[a,b,c,d]=st.data.screen,sw=w*(c-a),sh=h*(d-b),s=phone.scr.style,i=phone.sonar.firstChild.style;
  s.width=sw+'px';s.height=sh+'px';s.borderRadius=(sw*.09)+'px';s.fontSize=clamp(sw*.068,9,15)+'px';
  i.width=w+'px';i.height=h+'px';i.borderRadius=(w*.16)+'px';
}
function stepPhone(f,now){
  const st=phone.st;if(!st)return;
  const live=!!(st.box&&st.data?.screen)&&phone.w>.9,b=phone.hit;
  if(live!==phone.live){phone.live=live;b.classList.toggle('idle',!live);if(!live)phoneOff();else if(document.activeElement===b)phoneOn(phone.key?'focus':fine?'mouse':'touch')}
  if(b.hidden!==!!st.failed)b.hidden=!!st.failed;
  let x=0,y=0,w=0,h=0;if(st.box){[x,y,w,h]=st.box;y+=st.s-SY}
  // Con el ratón: fuera del móvil (más 24 px de margen) se apaga
  if(phone.on&&phone.via==='mouse'){const m=PHONE_MARGIN;if(mouse.x<x-m||mouse.x>x+w+m||mouse.y<y-m||mouse.y>y+h+m)phoneOff()}
  // Encender: 1) los puntos se apartan, 2) se funde la captura, 3) sube la hoja. Apagar: al revés
  const dt=f/60,imgOn=phone.on||phone.k>.06;
  if(imgOn!==phone.imgOn){phone.imgOn=imgOn;phone.scr.classList.toggle('on',imgOn);if(!imgOn)phone.offAt=now}
  const clear=!rm&&(imgOn||now-phone.offAt<PHONE_FADE_MS);
  phone.p=clamp(phone.p+(clear?1:-1)*dt*1000/PHONE_CLEAR_MS);
  const kT=phone.on&&(rm||phone.p>=1)?1:0;
  if(rm){phone.k=kT;phone.kv=0}
  else{phone.kv+=(SHEET_W*SHEET_W*(kT-phone.k)-2*SHEET_Z*SHEET_W*phone.kv)*dt;phone.k+=phone.kv*dt;if(Math.abs(kT-phone.k)<.003&&Math.abs(phone.kv)<.02){phone.k=kT;phone.kv=0}}
  if((phone.p>0&&phone.p<1)||phone.kv||phone.pull||(clear!==phone.p>0))busy=true;
  if(st.box&&(imgOn||phone.p)){
    const[a,b]=st.data.screen,t=`translate(${(x+w*a).toFixed(1)}px,${(y+h*b).toFixed(1)}px)`;
    if(t!==phone.scrT){phone.scrT=t;phone.scr.style.transform=t}
    const u=`translateY(${((1-clamp(phone.k,-.2,1.2))*100).toFixed(1)}%)`;
    if(u!==phone.sheetT){phone.sheetT=u;phone.sheet.style.transform=u}
  }
  stepPhoneInvite(f,now,live,x,y,w,h);
  if(!live&&document.activeElement!==b)return;
  if(!st.box){const q=st.el.querySelector('.phone-slot').getBoundingClientRect();x=q.left;y=q.top;w=q.width;h=q.height}
  const r=`${Math.round(x)},${Math.round(y)},${Math.round(w)},${Math.round(h)}`;
  if(r!==phone.rect){phone.rect=r;const s=phone.hit.style;s.transform=`translate(${Math.round(x)}px,${Math.round(y)}px)`;s.width=Math.round(w)+'px';s.height=Math.round(h)+'px'}
}
// Invitación, como la del velero: mientras el móvil está en pantalla y nadie lo ha encendido en esta sesión
function stepPhoneInvite(f,now,live,x,y,w,h){
  const vis=live&&y+h>40&&y<vh-40;
  if(!vis)phone.used=false;
  const inv=vis&&introDone&&!phone.seen&&!phone.on&&!phone.used;
  let tp=0;
  if(fine&&!rm&&live&&!phone.on&&mouse.x>0){
    const dx=Math.max(x-mouse.x,0,mouse.x-x-w),dy=Math.max(y-mouse.y,0,mouse.y-y-h),d=Math.hypot(dx,dy);
    tp=d<BOAT_NEAR?1-d/BOAT_NEAR:0;
  }
  phone.pull+=(tp-phone.pull)*(1-Math.pow(.85,f));if(phone.pull<.002)phone.pull=0;
  // Sonar: un contorno del móvil que se abre y se desvanece cada 2,5 s
  const son=inv&&!calm();
  if(son!==phone.sonarOn){phone.sonarOn=son;phone.sonar.classList.toggle('on',son)}
  if(son){const t=`translate(${Math.round(x+w/2)}px,${Math.round(y+h/2)}px)`;if(t!==phone.sonarT){phone.sonarT=t;phone.sonar.style.transform=t}}
  // El cursor, a la derecha del móvil, a la altura de los botones laterales
  stepPark(phone.park,inv,x+w+4,y+h*.36,now);
}

/* ---------- Nautes ---------- */
/* Nautes: el método como rumbo. Cuatro boyas en una línea; cada una abre encima su etiqueta (título y lista).
   Ratón: al pasar por encima. Teclado: al enfocarla. Táctil: al tocarla. Solo una abierta; Escape la cierra */
const nSteps=T.nautes,buoys=[];
let buoyOpen=-1;
function setBuoy(i){
  if(i===buoyOpen)return;
  buoyOpen=i;
  buoys.forEach((b,k)=>{b.btn.setAttribute('aria-expanded',k===i);b.tag.hidden=k!==i});
  if(i>=0)track('nautes-paso',{paso:ES.nautes[i][0]});
}
const closeBuoys=()=>setBuoy(-1);
nSteps.forEach((s,i)=>{
  const li=document.createElement('li'),btn=document.createElement('button'),tag=document.createElement('div'),h=document.createElement('p'),ul=document.createElement('ul');
  btn.type='button';btn.className='buoy';btn.id='nBuoy'+i;btn.textContent=s[0];btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-controls','nTag'+i);
  tag.className='buoy-tag';tag.id='nTag'+i;tag.hidden=true;h.textContent=s[1];
  ul.replaceChildren(...s[2].map(x=>{const q=document.createElement('li');q.textContent=x;return q}));
  tag.append(h,ul);li.append(btn,tag);$('#nBuoys').appendChild(li);buoys.push({btn,tag});
  btn.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')setBuoy(i)});
  // Se cierra al salir del <li> (boya + etiqueta), no de la boya: así el ratón puede subir a leer la etiqueta (A-05)
  li.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&document.activeElement!==btn&&buoyOpen===i)closeBuoys()});
  btn.addEventListener('focus',()=>setBuoy(i));
  btn.addEventListener('blur',()=>{if(buoyOpen===i)closeBuoys()});
  btn.addEventListener('click',()=>setBuoy(i)); // táctil (y clic): abre la suya y cierra las demás
});
document.addEventListener('pointerdown',e=>{if(buoyOpen>=0&&!e.target.closest?.('#nBuoys'))closeBuoys()});

/* ---------- Explora Natura: la brújula y el diario ----------
   La brújula es una parada de #dust (data-shape="compass") anclada a su hueco, .compass-slot. Se dibuja por partes
   en un lienzo cuadrado (COMPASS_PARTS, en fracciones del lado) y cada punto recuerda de qué parte es (comp.g):
   0 esfera (anillos y graduación), 1-4 letras N, E, S, O, 5 mitad norte de la aguja, 6 mitad sur y punto central.
   Solo los grupos 5 y 6 giran (stepDust), con el ángulo comp.ang, un muelle hacia su destino: el punto cardinal
   activo, el ratón si pasa libre por encima o, si no, el norte. Encima de cada letra, un botón invisible */
const COMPASS_RES=360,CP_RING=.36,CP_INNER=.29,CP_LETTER=.44,CP_NEEDLE=.25;
const COMPASS_DIRS=[[0,-1],[1,0],[0,1],[-1,0]];
const compassLetter=k=>(c,w)=>{const[dx,dy]=COMPASS_DIRS[k];c.font=ART_FONT(w*.14);c.textAlign='center';c.textBaseline='middle';
  c.fillText(T.explora.points[k].k,w/2+dx*w*CP_LETTER,w/2+dy*w*CP_LETTER)};
// Media aguja: un triángulo alargado desde el centro (sgn -1, hacia el norte; 1, hacia el sur) con un hueco
// redondo en el centro. El punto central va con la mitad sur
const needleHalf=sgn=>(c,w)=>{const o=w/2;
  c.beginPath();c.moveTo(o,o+sgn*w*CP_NEEDLE);c.lineTo(o+w*.045,o);c.lineTo(o-w*.045,o);c.closePath();c.fill();
  c.globalCompositeOperation='destination-out';c.beginPath();c.arc(o,o,w*.036,0,6.283);c.fill();c.globalCompositeOperation='source-over';
  if(sgn>0){c.beginPath();c.arc(o,o,w*.021,0,6.283);c.fill()}};
// [grupo, peso, dibujo]. El peso multiplica los puntos de esa parte: la graduación, las letras y la aguja se
// llevan más de los que les tocarían por superficie, para que se lean bien entre tanto anillo
const COMPASS_PARTS=[
  // Anillo exterior grueso e interior fino
  [0,1,(c,w)=>{const o=w/2;c.lineWidth=w*.02;c.beginPath();c.arc(o,o,w*CP_RING,0,6.283);c.stroke();
    c.lineWidth=w*.009;c.beginPath();c.arc(o,o,w*CP_INNER,0,6.283);c.stroke()}],
  // Entre los dos, la graduación: larga cada 90°, media cada 30° y corta cada 5°
  [0,2,(c,w)=>{const o=w/2;c.lineCap='butt';
    for(let d=0;d<360;d+=5){const a=d*Math.PI/180,big=d%90===0,mid=d%30===0,r0=w*(CP_INNER+.004),r1=w*(big?CP_RING:mid?.337:.318);
      c.lineWidth=w*(big?.018:mid?.012:.009);c.beginPath();c.moveTo(o+Math.sin(a)*r0,o-Math.cos(a)*r0);c.lineTo(o+Math.sin(a)*r1,o-Math.cos(a)*r1);c.stroke()}}],
  [1,2,compassLetter(0)],[2,2,compassLetter(1)],[3,2,compassLetter(2)],[4,2,compassLetter(3)],
  [5,2.5,needleHalf(-1)],[6,2.5,needleHalf(1)],
];
const comp={st:stops.find(s=>s.shape==='compass')||null,g:new Uint8Array(N),w:0,live:false,cx:0,cy:0,
  ang:{x:0,v:0},active:-1,via:'',at:0,ptype:'',follow:false,glow:new Float32Array(4),
  hot:[138,150,255],hotHex:'',ink:[255,255,255],wrap:$('#ePts'),read:$('#eRead'),btns:[],pos:[],
  pieces:[],piece:-1,seen:false,used:false,park:parker(fine?T.explora.cueMouse:T.explora.cueTouch,'#3A3AD0')};
const COMPASS_SEEN='explora-brujula-vista';
try{comp.seen=sessionStorage.getItem(COMPASS_SEEN)==='1'}catch(e){}
/* Dianas de la brújula: el cuadrado más grande que cabe centrado en su hueco, medido con el scroll en la parada
   (como el velero). Cada punto elige un punto de la figura con su azar fijo (pick), así que su grupo no cambia
   al recolocar la web */
function compassTargets(st){
  const slot=st.el.querySelector('.compass-slot');if(!slot)return null;
  const r=slot.getBoundingClientRect(),S=Math.min(r.width,r.height);
  if(!(S>=80))return null;
  const x0=r.left+(r.width-S)/2,y0=r.top+scrollY-st.s+(r.height-S)/2,W=COMPASS_RES,sc=S/W;
  const P=[],G=[];
  COMPASS_PARTS.forEach(([g,wt,draw])=>{
    const p=sample(W,W,draw);
    for(let k=0;k<p.length;k+=2){const rep=Math.floor(wt)+((k/2)%2<(wt%1)*2?1:0);for(let j=0;j<rep;j++){P.push(p[k],p[k+1]);G.push(g)}}
  });
  const n=G.length;if(!n)return null;
  const t=new Float32Array(N*2);
  for(let i=0;i<N;i++){const k=Math.min(n-1,Math.floor(pick[i]*n));t[i*2]=x0+(P[k*2]+jx[i]*2)*sc;t[i*2+1]=y0+(P[k*2+1]+jy[i]*2)*sc;comp.g[i]=G[k]}
  st.box=[x0,y0,S,S];comp.cx=x0+S/2;comp.cy=y0+S/2;
  return t;
}
// El cuadro de texto: una frase (con su etiqueta en negrita) y, si la pieza tiene url, el enlace a Nautes
function compassSay(label,text,url){
  const p=document.createElement('p');
  if(label){const b=document.createElement('b');b.textContent=label;p.append(b)}
  p.append(text);
  const out=[p];
  if(url){const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';a.textContent=T.explora.read;out.push(a)}
  comp.read.replaceChildren(...out);
}
function markPiece(i){comp.piece=i;comp.pieces.forEach((b,k)=>{b.setAttribute('aria-pressed',k===i);b.parentElement.classList.toggle('on',k===i)})}
function compassPoint(k,via){
  const was=comp.active;comp.active=k;comp.via=via;comp.at=performance.now();comp.used=true;
  if(k===was)return;
  const p=T.explora.points[k];
  markPiece(-1);compassSay(`${p.k} · ${p.name}`,p.text);
  track('explora-brujula',{punto:ES.explora.points[k].k});
  if(!comp.seen){comp.seen=true;try{sessionStorage.setItem(COMPASS_SEEN,'1')}catch(e){}}
}
// Suelta el punto k (o el que esté, sin k): la aguja vuelve al norte o al ratón. El texto del cuadro se queda
function compassFree(k){if(comp.active>=0&&(k==null||comp.active===k)){comp.active=-1;comp.via=''}}
// Clic en N: hasta el velero de Nautes. En S: hasta el escaparate del videomapping. Con teclado, el foco va detrás
function compassGo(k,kbd){
  const b=rm?'auto':'smooth';
  if(k===0){if(boat.st)scrollTo({top:boat.st.s,behavior:b});else $('#proyectos').scrollIntoView({behavior:b});if(kbd)$('#nBuoy0')?.focus({preventScroll:true})}
  else if(k===2){$('#stage').scrollIntoView({behavior:b,block:'center'});if(kbd)$('#stage .h')?.focus({preventScroll:true})}
}
if(comp.st&&comp.wrap){
  comp.ink=hexRgb(TONES[comp.st.el.dataset.tone][1]);
  compassSay('',fine?T.explora.hintMouse:T.explora.hintTouch);
  addEventListener('pointerdown',e=>{comp.ptype=e.pointerType},true);
  addEventListener('keydown',()=>{comp.ptype='key'},true);
  T.explora.points.forEach((p,k)=>{
    const b=document.createElement('button');b.type='button';b.className='compass-pt';
    b.setAttribute('aria-label',`${p.dir} · ${p.name}`);b.setAttribute('aria-describedby','eRead');
    // Ratón: al pasar por encima. Teclado: al enfocar (si la brújula no está en pantalla, se baja hasta ella)
    b.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'&&comp.live)compassPoint(k,'mouse')});
    b.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&document.activeElement!==b)compassFree(k)});
    b.addEventListener('focus',()=>{if(!comp.live)scrollTo({top:comp.st.s,behavior:rm?'auto':'smooth'});if(comp.active!==k)compassPoint(k,'focus')});
    b.addEventListener('blur',()=>compassFree(k));
    // Táctil: el primer toque la gira hacia ese punto (y el foco que trae el toque no cuenta); el segundo, en N o S, lleva allí
    b.addEventListener('click',e=>{
      const touch=e.detail>0&&(comp.ptype==='touch'||comp.ptype==='pen');
      if(comp.active!==k||(touch&&performance.now()-comp.at<450)){compassPoint(k,touch?'touch':'mouse');return}
      compassGo(k,!e.detail);
    });
    comp.wrap.appendChild(b);comp.btns.push(b);comp.pos.push('');
  });
  // Tocar fuera de los puntos cardinales devuelve la aguja al norte
  document.addEventListener('pointerdown',e=>{if(comp.active>=0&&!e.target.closest?.('.compass-pt'))compassFree()});
  // El diario: cinco piezas con su fecha. Al pulsar una, se marca y el cuadro dice qué se entregó ese día
  const L=LANG==='en'?'en':'es';
  ENTREGAS.forEach((p,i)=>{
    const d=p[L],li=document.createElement('li'),b=document.createElement('button'),f=document.createElement('span'),t=document.createElement('span');
    b.type='button';b.className='piece';b.setAttribute('aria-pressed','false');b.setAttribute('aria-describedby','eRead');
    f.className='piece-date';f.textContent=d.fecha;t.className='piece-title';t.textContent=d.titulo;
    b.append(f,t);li.append(b);$('#ePieces').appendChild(li);comp.pieces.push(b);
    b.addEventListener('click',()=>{
      compassFree();markPiece(i);compassSay('',T.explora.piece(d.dia),p.url);
      track('explora-pieza',{fecha:p.es.fecha});
    });
  });
}
// Ángulo equivalente a g (en radianes) más cercano a a: la aguja gira siempre por el camino más corto
const nearAngle=(g,a)=>a+(((g-a)%6.2832)+6.2832*1.5)%6.2832-Math.PI;
function stepCompass(f,now){
  const st=comp.st;if(!st||!comp.wrap)return;
  const box=st.box,live=!!box&&comp.w>.9;
  if(live!==comp.live){comp.live=live;comp.wrap.classList.toggle('live',live);if(!live)compassFree()}
  // La punta norte, en el acento del tono (o en el del bote, si el jefe de obra ha pintado el fondo)
  const h=paint?paint[1]:TONES[st.el.dataset.tone][2];if(h!==comp.hotHex){comp.hotHex=h;comp.hot=hexRgb(h)}
  let cx=0,cy=0,S=0;
  if(box){S=box[2];cx=box[0]+S/2;cy=box[1]+S/2+st.s-SY}
  // Ratón libre encima de la brújula (dentro del círculo de las letras): la aguja lo sigue. Sin animaciones, no
  const dx=mouse.x-cx,dy=mouse.y-cy,dist=Math.hypot(dx,dy),over=live&&fine&&mouse.x>0&&dist<S*.5;
  comp.follow=over&&!rm&&comp.active<0;
  if(over&&now-scrollT>250)comp.used=true;
  let goal=0,resp=.6,damp=.55;
  if(comp.active>=0){goal=comp.active*Math.PI/2;resp=.5;damp=.6}
  else if(comp.follow){goal=dist>S*.05?Math.atan2(dx,-dy):comp.goal||0;resp=.3;damp=.95}
  comp.goal=goal;goal=nearAngle(goal,comp.ang.x);
  if(rm){comp.ang.x=goal;comp.ang.v=0}
  else if(Math.abs(goal-comp.ang.x)>1e-4||Math.abs(comp.ang.v)>1e-4){springStep(comp.ang,goal,Math.min(f/60,.04),resp,damp);busy=true}
  // La letra del punto activo se ilumina (y se apaga) en unos 150 ms
  const kg=rm?1:1-Math.pow(.8,f);
  for(let k=0;k<4;k++){const g=comp.active===k?1:0;comp.glow[k]+=(g-comp.glow[k])*kg;if(Math.abs(g-comp.glow[k])<.005)comp.glow[k]=g;else busy=true}
  // Los botones, sobre cada letra (se recolocan con el scroll y al redimensionar)
  if(box){
    const bs=Math.round(Math.max(44,S*.14)),r=S*CP_LETTER;
    comp.btns.forEach((b,k)=>{const[ux,uy]=COMPASS_DIRS[k],x=Math.round(cx+ux*r-bs/2),y=Math.round(cy+uy*r-bs/2),q=`${x},${y},${bs}`;
      if(q!==comp.pos[k]){comp.pos[k]=q;b.style.transform=`translate(${x}px,${y}px)`;b.style.width=b.style.height=bs+'px'}});
  }
  // Invitación: un cursor del equipo junto a la brújula hasta que alguien la usa (una vez por sesión)
  const vis=!!box&&comp.w>.5&&cy+S/2>40&&cy-S/2<vh-40;
  if(!vis)comp.used=false;
  const inv=vis&&introDone&&!comp.seen&&comp.active<0&&!comp.used;
  stepPark(comp.park,inv,Math.min(cx+S*.34+4,vw-28),cy+S*.34+4,now);
}


/* ---------- Alcar: del plano a la obra ----------
   Cuando el proyecto entra en pantalla, tres cursores del equipo trazan a regla el plano de la web nueva
   (public/alcar-plano.json: polilíneas 0-1 sobre la captura, grupos ui / casa / lamas, y cotas). Al pasar el
   ratón, con foco o con un toque, la captura real se levanta de abajo arriba sobre el plano (clip-path con muelle)
   y el plano se queda debajo al 30 % */
const PORTAL_URL=''; // Dirección de la web nueva
const PORTAL_IMG=alcarShot; // Captura de la web nueva
// Velocidad del trazo y de los saltos entre líneas (px/s), muelle de la obra (rad/s y amortiguación)
const PLAN_SPEED=900,PLAN_JUMP=2700,PLAN_W=9,PLAN_Z=.9,PLAN_TAGS_MS=450,PLAN_SEEN='alcar-obra-vista';
let portal=$('#portal');
// Sin dirección, el marco es un botón: un enlace que no lleva a ninguna parte confunde al teclado y al lector
if(PORTAL_URL){portal.href=PORTAL_URL;portal.target='_blank';portal.rel='noopener'}
else{const b=document.createElement('button');b.type='button';[...portal.attributes].forEach(a=>b.setAttribute(a.name,a.value));b.append(...portal.childNodes);portal.replaceWith(b);portal=b;
  // Sin dirección no se «ve la web»: el nombre dice lo que hace, y la nota de debajo («Enlace pendiente…») lo completa (A-06)
  b.setAttribute('aria-label',T.portal.raise);b.setAttribute('aria-describedby','portalNote')}
const planC=$('.plan-lines',portal),pctx=planC.getContext('2d'),planShot=$('.plan-shot',portal),planLevel=$('.plan-level',portal),planNote=$('#portalNote');
// El marco ya lleva su nombre (aria-label): la captura, dentro, es decorativa
planShot.src=PORTAL_IMG;planShot.alt='';
// La captura lleva loading="lazy" (P-07), pero con JavaScript empieza recortada del todo y Chrome no la pediría hasta
// levantarla: se pide cuando el marco está a una pantalla, para que al levantarla ya esté
const shotObs=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){planShot.loading='eager';shotObs.disconnect()}},{rootMargin:'100% 0px'});
shotObs.observe(portal);
const plan={data:null,w:0,h:0,left:0,top:0,lines:[],tags:[],vis:false,started:false,traced:false,done:false,tracers:[],tagT:0,tagA:0,
  speed:PLAN_SPEED,up:false,upAt:0,m:0,v:0,clip:'',lvl:'',op:'',ink:'',dirty:true,seen:false,used:false,park:parker(T.portal.cue,'#B81F8A'),noteK:''};
try{plan.seen=sessionStorage.getItem(PLAN_SEEN)==='1'}catch(e){}
fetch(import.meta.env.BASE_URL+'alcar-plano.json').then(r=>r.ok?r.json():null).then(d=>{
  if(!d||!(d.ratio>0)||!Array.isArray(d.lineas)||!d.lineas.length)throw 0;
  plan.data=d;portal.classList.add('has-plan');sizePlan();
}).catch(()=>portal.classList.add('no-plan')); // Sin plano: la captura a la vista, con su texto
new IntersectionObserver(es=>{plan.vis=es[0].isIntersecting;wake()},{threshold:.5}).observe(portal);
function planMeasure(){const r=portal.getBoundingClientRect();plan.left=r.left;plan.top=r.top+scrollY;return r}
function sizePlan(){
  const r=planMeasure();if(!r.width)return;
  const d=Math.min(devicePixelRatio||1,1.6),W=r.width,H=r.height;plan.w=W;plan.h=H;
  planC.width=Math.round(W*d);planC.height=Math.round(H*d);pctx.setTransform(d,0,0,d,0,0);
  if(!plan.data)return;
  plan.lines=plan.data.lineas.map(l=>{
    const p=l.p.map(([x,y])=>[x*W,y*H]);let len=0;for(let i=1;i<p.length;i++)len+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);
    return{g:l.g,p,len,drawn:0};
  });
  // Etiquetas (o cotas, en versiones anteriores del JSON): traducidas con i18n si hace falta; en inglés, punto decimal
  plan.tags=(plan.data.etiquetas||plan.data.cotas||[]).map(t=>{const up=String(t.t).toUpperCase();
    return{a:[t.p[0][0]*W,t.p[0][1]*H],b:[t.p[1][0]*W,t.p[1][1]*H],t:(T.portal.tags?.[up]||up).replace(/(\d),(\d)/g,LANG==='en'?'$1.$2':'$1,$2')}});
  // Al redimensionar: lo ya trazado se redibuja entero, sin animar (si estaba a medias, se termina)
  if(plan.started&&!plan.done)planFinish();
  if(plan.done){plan.lines.forEach(l=>l.drawn=l.len);plan.tagA=1}
  plan.dirty=true;
}
// Ruta de un cursor: tramos [ax, ay, bx, by, línea (o null si es un salto), distancia en la línea, largo]
function planRoute(g,x0,y0){
  const segs=[];let px=x0,py=y0;
  for(const l of plan.lines){
    if(l.g!==g)continue;
    const[a]=l.p;segs.push([px,py,a[0],a[1],null,0,Math.hypot(a[0]-px,a[1]-py)]);
    let off=0;
    for(let i=1;i<l.p.length;i++){const[ax,ay]=l.p[i-1],[bx,by]=l.p[i],len=Math.hypot(bx-ax,by-ay);segs.push([ax,ay,bx,by,l,off,len]);off+=len}
    [px,py]=l.p[l.p.length-1];
  }
  return segs;
}
function planStart(){
  plan.started=true;
  if(calm()){planFinish();return} // sin animaciones (o en pausa): el plano aparece entero, sin cursores
  const pool=cursors.slice(3,LABELS.length).filter(c=>!c.job&&!c.script&&!c.follow&&!c.task&&!c.park);
  const sy=plan.top-SY;
  plan.tracers=['ui','casa','lamas'].map((g,k)=>{
    const c=pool[k]||null;
    // El cursor sale de donde esté; si no hay cursores libres, la línea se traza igual, sin cursor
    const x0=c?c.x-plan.left:plan.lines.find(l=>l.g===g)?.p[0][0]||0,y0=c?c.y-sy:plan.lines.find(l=>l.g===g)?.p[0][1]||0;
    if(c){c.script=true;c.park={x:c.x,y:c.y};c.el.classList.remove('off')}
    return{c,segs:planRoute(g,x0,y0),i:0,t:0,x:x0,y:y0};
  });
  // Unos 900 px/s; si el marco es grande (móvil en horizontal, pantallas anchas), algo más rápido para que el
  // trazado más largo no pase de unos 3,4 s y, con las cotas, el total ronde los 4 s
  const longest=Math.max(...plan.tracers.map(tr=>tr.segs.reduce((a,s)=>a+(s[4]?s[6]:0),0)));
  plan.speed=Math.max(PLAN_SPEED,longest/3.4);
}
function planRelease(now){
  for(const tr of plan.tracers){const c=tr.c;if(c){c.park=null;c.script=false;c.next=now+400}}
  plan.tracers=[];
}
function planFinish(){
  plan.lines.forEach(l=>l.drawn=l.len);plan.tagA=1;plan.traced=plan.done=true;plan.dirty=true;
  planRelease(performance.now());
}
function planUp(){
  if(plan.up)return;
  plan.up=true;plan.upAt=performance.now();plan.used=true;portal.classList.add('up');
  track('alcar-obra',{accion:'levantar'});
  if(!plan.seen){plan.seen=true;try{sessionStorage.setItem(PLAN_SEEN,'1')}catch(e){}}
}
function planDown(){if(plan.up){plan.up=false;portal.classList.remove('up')}}
// Ratón: entrar levanta, salir baja. Teclado: el foco. Táctil: el primer toque levanta (y el foco que trae
// consigo no cuenta como clic de entrada); con la obra levantada, el clic entra en la web
portal.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')planUp()});
portal.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')planDown()});
portal.addEventListener('focus',planUp);portal.addEventListener('blur',planDown);
portal.addEventListener('click',e=>{
  if(!plan.up||performance.now()-plan.upAt<450){e.preventDefault();planUp();return}
  if(PORTAL_URL)track('alcar-obra',{accion:'entrar'});else e.preventDefault();
});
document.addEventListener('pointerdown',e=>{if(plan.up&&!portal.contains(e.target))planDown()});
function planDraw(){
  const c=pctx,W=plan.w,H=plan.h,ink=`rgb(${inkRgb[0]},${inkRgb[1]},${inkRgb[2]})`;
  c.clearRect(0,0,W,H);c.strokeStyle=c.fillStyle=ink;c.lineCap='round';c.lineJoin='round';
  for(const l of plan.lines){
    if(!l.drawn)continue;
    const ui=l.g==='ui';c.globalAlpha=ui?.5:1;c.lineWidth=ui?1:1.6;
    c.beginPath();c.moveTo(l.p[0][0],l.p[0][1]);let left=l.drawn;
    for(let i=1;i<l.p.length&&left>0;i++){
      const[ax,ay]=l.p[i-1],[bx,by]=l.p[i],len=Math.hypot(bx-ax,by-ay),k=Math.min(1,left/(len||1));
      c.lineTo(ax+(bx-ax)*k,ay+(by-ay)*k);left-=len;
    }
    c.stroke();
  }
  // Cotas: línea guía de p0 a p1, un punto en p0 y el texto junto a p1, con fondo y borde fino
  if(plan.tagA>0){
    const bg=root.style.getPropertyValue('--ground')||'#000';
    // Letra pequeña, a escala del marco (como las etiquetas de la web de Alcar)
    const fs=clamp(W*.013,7.5,10),pad=Math.round(fs*.6);c.font=`600 ${fs.toFixed(1)}px "Martian Mono",monospace`;c.textBaseline='middle';
    for(const t of plan.tags){
      c.globalAlpha=plan.tagA*.75;c.lineWidth=1;c.beginPath();c.moveTo(t.a[0],t.a[1]);c.lineTo(t.b[0],t.b[1]);c.stroke();
      c.globalAlpha=plan.tagA;c.beginPath();c.arc(t.a[0],t.a[1],2.5,0,6.283);c.fill();
      // Junto a p[1], a su derecha; si no cabe, se desplaza a la izquierda solo lo justo (no salta al otro lado)
      const tw=c.measureText(t.t).width+pad*2,th=Math.round(fs*2);
      const x=Math.max(2,Math.min(W-tw-2,t.b[0]+4)),y=Math.max(2,Math.min(H-th-2,t.b[1]-th/2));
      c.fillStyle=bg;c.fillRect(x,y,tw,th);c.fillStyle=ink;c.strokeRect(x+.5,y+.5,tw-1,th-1);c.fillText(t.t,x+pad,y+th/2+.5);
    }
  }
  c.globalAlpha=1;plan.dirty=false;
}
function stepPlan(f,now){
  // El texto de debajo: la invitación, o con la obra levantada, entrar (o el aviso de que aún no hay enlace)
  const nk=plan.up?(PORTAL_URL?'enter':'pending'):fine?'hintMouse':'hintTouch';
  if(nk!==plan.noteK){plan.noteK=nk;planNote.textContent=T.portal[nk]}
  if(!plan.data||!plan.w)return;
  const dt=f/60;
  // Trazado: una vez, cuando el proyecto entra en pantalla
  if(!plan.started&&plan.vis&&introDone)planStart();
  if(plan.started&&!plan.traced){
    const sy=plan.top-SY;let left=0;
    for(const tr of plan.tracers){
      let time=dt;
      while(tr.i<tr.segs.length&&time>0){
        const s=tr.segs[tr.i],sp=(s[4]?1:PLAN_JUMP/PLAN_SPEED)*plan.speed,rem=s[6]-tr.t,need=rem/sp;
        if(need<=time){time-=need;tr.t=0;tr.i++;if(s[4])s[4].drawn=Math.max(s[4].drawn,s[5]+s[6]);tr.x=s[2];tr.y=s[3]}
        else{tr.t+=time*sp;time=0;const k=tr.t/(s[6]||1);tr.x=s[0]+(s[2]-s[0])*k;tr.y=s[1]+(s[3]-s[1])*k;if(s[4])s[4].drawn=Math.max(s[4].drawn,s[5]+tr.t)}
      }
      if(tr.i<tr.segs.length)left++;
      // La punta del cursor es la del lápiz: se coloca después de stepCursors, sin muelle
      const c=tr.c;if(c){c.x=plan.left+tr.x;c.y=sy+tr.y;c.vx=c.vy=0;c.park.x=c.x;c.park.y=c.y;c.el.style.transform=`translate3d(${c.x}px,${c.y}px,0)`}
    }
    plan.dirty=true;
    if(!left){plan.traced=true;plan.tagT=now}
  }
  // Al acabar, las cotas aparecen; luego los cursores se liberan
  if(plan.traced&&!plan.done){plan.tagA=clamp((now-plan.tagT)/PLAN_TAGS_MS);plan.dirty=true;if(plan.tagA>=1){plan.done=true;planRelease(now)}}
  // Si cambia el tono de la sección, el plano se repinta con su tinta
  const ink=inkRgb.join();if(ink!==plan.ink){plan.ink=ink;plan.dirty=true}
  if(plan.dirty&&plan.vis)planDraw();
  // La obra: muelle de m (0 = plano, 1 = captura); sin animaciones, de golpe (el CSS pone un fundido)
  const want=plan.up?1:0;
  if(rm){plan.m=want;plan.v=0}
  else if(plan.m!==want||plan.v){plan.v+=(PLAN_W*PLAN_W*(want-plan.m)-2*PLAN_Z*PLAN_W*plan.v)*dt;plan.m+=plan.v*dt;if(Math.abs(want-plan.m)<.001&&Math.abs(plan.v)<.01){plan.m=want;plan.v=0}}
  const m=clamp(plan.m);
  if(!rm){
    const clip=`inset(${((1-m)*100).toFixed(2)}% 0 0 0)`;if(clip!==plan.clip){plan.clip=clip;planShot.style.clipPath=clip}
    // El nivel: una línea fina que sube con el borde de la captura (solo mientras se mueve)
    const lvl=m>.004&&m<.996?`translateY(${((1-m)*plan.h).toFixed(1)}px)`:'';
    if(lvl!==plan.lvl){plan.lvl=lvl;planLevel.style.transform=lvl||'translateY(-9999px)';planLevel.style.opacity=lvl?1:0}
  }
  const op=(1-.7*m).toFixed(3);if(op!==plan.op){plan.op=op;planC.style.opacity=op}
  if((plan.started&&!plan.done)||plan.v||plan.m!==want)busy=true;
  // Cursor «Levántala» junto al marco cuando el plano está hecho, hasta que alguien levanta la obra
  const y=plan.top-SY,on=plan.done&&introDone&&!plan.seen&&!plan.up&&!plan.used&&y+plan.h>60&&y<vh-60;
  if(!(y+plan.h>0&&y<vh))plan.used=false;
  stepPark(plan.park,on,Math.min(plan.left+plan.w+4,vw-28),y+plan.h*.45,now);
}

/* ---------- Videomapping ----------
   El código vive en scenes/mapping.js y se carga aparte (ver «Carga en diferido»). mapApi es null hasta que llega.
   Aquí queda lo que usa el bucle: si el escaparate está en pantalla (mapOn) y si ya se pintó el fotograma fijo */
const stage=$('#stage');
let mapApi=null,mapLoad=null;
function loadMap(){
  return mapLoad||(mapLoad=import('./scenes/mapping.js').then(m=>{
    mapApi=m.createMapping({$,clamp,springStep,isRm:()=>rm,track,T,wake,keep:()=>{busy=true}});
    mapApi.warp();mapDrawn=false;wake();
  }).catch(e=>console.error(e)));
}
function warp(){mapApi?.warp()}
let mapOn=false,mapDrawn=false;new IntersectionObserver(es=>{mapOn=es[0].isIntersecting;wake()}).observe(stage);
near(stage,loadMap,'150% 0px');
// Con teclado se puede llegar a las asas de un salto (Tab desde lejos): a la primera tecla Tab se piden ya
addEventListener('keydown',e=>{if(e.key==='Tab')loadMap()},true);

/* ---------- Caja de herramientas ---------- */
const TOOL_COLORS=['#2A3FF0','#087A50','#00788C','#7A2BD6','#B81F8A','#D6264F','#B3470F','#C03030','#A8341A','#3A3AD0','#3A3F55','#006B4F','#667000','#3D6B00','#5B2BB5','#B3470F'];
const TOOLS=T.tools.map(([name,where,level],i)=>[name,TOOL_COLORS[i],where,level]);
const pit=$('#pit'),chips=[];
function pickTool(i){const t=TOOLS[i];$('#tName').textContent=t[0];$('#tWhere').textContent=t[2];$('#tLevel').textContent=t[3];chips.forEach((c,k)=>c.el.setAttribute('aria-pressed',k===i))}
TOOLS.forEach((t,i)=>{const b=document.createElement('button');b.type='button';b.className='chip';b.textContent=t[0];b.style.setProperty('--f',t[1]);b.onclick=()=>{track('herramienta',{nombre:ES.tools[i][0]});pickTool(i)};pit.appendChild(b);chips.push({el:b})});
pickTool(0);
// La física (caer, chocar, agarrar) vive en scenes/toolbox.js y se carga aparte. pitApi es null hasta que llega
let pitOn=false,pitApi=null,pitLoad=null;
function loadPit(){
  return pitLoad||(pitLoad=import('./scenes/toolbox.js').then(m=>{
    pitApi=m.createPit({pit,chips,rand,clamp,isRm:()=>rm,keep:()=>{busy=true}});
    if(pitOn){pitApi.start();wake()}
  }).catch(e=>console.error(e)));
}
function stepPit(){if(pitOn)pitApi?.step()}
near(pit,loadPit);
// La primera vez que la caja entra en pantalla se apunta la entrada al laboratorio
let labSeen=false;
new IntersectionObserver(es=>{pitOn=es[0].isIntersecting;if(pitOn){pitApi?.start();if(!labSeen){labSeen=true;track('laboratorio-visto')}}wake()},{threshold:.15}).observe(pit);
new ResizeObserver(()=>pitApi?.resize()).observe(pit);
$('#dump').onclick=()=>{
  track('caja-volcada');pitApi?.dump();
};

/* ---------- Contacto ---------- */
const copy=$('#copy');
// email-copiado se envía cuando ya se sabe qué pasó: copiado al portapapeles o solo seleccionado (AN-02)
copy.onclick=()=>{
  const mail=$('#mail').textContent;
  const ok=()=>{track('email-copiado',{modo:'portapapeles'});copy.textContent=T.copy.done;setTimeout(()=>copy.textContent=T.copy.idle,1800)};
  const fallback=()=>{track('email-copiado',{modo:'seleccion'});const s=getSelection(),r=document.createRange();r.selectNodeContents($('#mail'));s.removeAllRanges();s.addRange(r);copy.textContent=T.copy.selected};
  if(navigator.clipboard)navigator.clipboard.writeText(mail).then(ok,fallback);else fallback();
};
// La conversión principal: el clic en el email (AN-02)
$('#mail a').addEventListener('click',()=>track('email-clic'));
$('#linkedin').addEventListener('click',()=>track('linkedin'));
// Clics del menú: a qué sección va la gente (AN-02)
$$('.top a[href^="#"]').forEach(a=>a.addEventListener('click',()=>track('menu',{a:a.getAttribute('href')})));
$('#cv').addEventListener('click',()=>track('cv-descargado',{idioma:LANG}));
$$('[data-lang]').forEach(a=>a.addEventListener('click',()=>track('idioma',{a:a.dataset.lang})));
const seenContact=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){track('scroll-contacto');seenContact.disconnect()}},{threshold:.2});
seenContact.observe($('#contacto'));

/* ---------- Plumbing común de órdenes ---------- */
const strip=t=>t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim();
let order=null,orderT=0,strike=false,lastAct=performance.now(),paint=null;
function setOrder(o,ms=9000){order=o;clearTimeout(orderT);if(o&&ms)orderT=setTimeout(()=>{order=null;updateTeam()},ms);updateTeam();wake()}
function repaint(){tone='';applyTone()}
function fling(L){
  if(L.mode!=='rest'&&L.mode!=='loose')return;
  L.vx=rand(-26,26);L.vy=rand(-22,22);L.vr=rand(-12,12);L.mode='loose';
  setTimeout(()=>{if(L.mode!=='loose')return;
    const nx=L.cx+L.x,ny=L.cy+L.y;
    fetchLetter(L,freeCursors().sort((a,b)=>Math.hypot(a.x-nx,a.y-ny)-Math.hypot(b.x-nx,b.y-ny)).slice(0,2))},750);
}
async function atHero(){if(scrollY>vh*.2){scrollTo({top:0,behavior:rm?'auto':'smooth'});await pause(900)}}

/* ---------- Dock: «Escríbeme» y el grupo «Más» (UX-01) ---------- */
const dockEl=$('#dock'),bMore=$('#bMore'),dockMore=$('#dockMore');
$('#bContact').addEventListener('click',()=>track('dock-contacto'));
// En estrecho, los secundarios van en «Más». Al cerrarlo con el foco dentro, el foco vuelve a «Más»
function setMore(on){
  dockEl.classList.toggle('more-open',on);bMore.setAttribute('aria-expanded',on);
  if(!on&&dockMore.contains(document.activeElement)&&!document.activeElement.offsetParent)bMore.focus();
}
bMore.addEventListener('click',()=>setMore(bMore.getAttribute('aria-expanded')!=='true'));
document.addEventListener('pointerdown',e=>{if(!dockEl.contains(e.target))setMore(false)});
// Al cerrar un panel, el foco vuelve a su botón; si está escondido dentro de «Más», a «Más»
function dockFocus(b){(b.offsetParent?b:bMore).focus()}

/* ---------- Jefe de obra ---------- */
const boss=$('#boss'),bossIn=$('#bossIn'),bossReply=$('#bossReply'),bBoss=$('#bBoss');
const PAINT={red:['#1E0708','#FF4D4D'],blue:['#080D24','#6C8BFF'],green:['#07170E','#3DDC84'],pink:['#1C0713','#FF5FB0'],yellow:['#161204','#FFD60A'],orange:['#1B0D04','#FF9234'],purple:['#110822','#B47CFF'],black:['#050506','#F0F0F0']};
const PLACES={projects:'#trabajo',contact:'#contacto',tools:'#herramientas',home:'#inicio',zalapp:'#zPhone',nautes:'#nRoute',explora:'#explora',alcar:'#portal',mapping:'#stage',formacion:'#open',sellos:'#open'};
/* La orden que se envía a la analítica (AN-03): solo la que se ha reconocido (dance, paint:red, goto:contact…) o
   «desconocida». Nunca el texto que escribe la gente, que podría ser personal */
let orderKey='';
function command(raw){
  const B=T.boss,t=strip(raw);orderKey='desconocida';if(!t)return B.empty;
  let m;
  if((m=t.match(B.reLetter))){orderKey='letter:'+m[1];
    const i='alonso'.indexOf(m[1]);const list=letters.filter((L,k)=>'alonso'[k]===m[1]);
    atHero().then(()=>list.forEach(fling));return i<0?B.notOurs:B.letter(m[1].toUpperCase())}
  if(B.reBreak.test(t)){orderKey='break';atHero().then(()=>letters.forEach(fling));return B.broken}
  if(B.reReset.test(t)){orderKey='reset';paint=null;repaint();return B.reset}
  for(const[id,re,name] of B.colors)if(re.test(t)){orderKey='paint:'+id;paint=PAINT[id];repaint();return B.painted(name)}
  if(B.rePaint.test(t)){orderKey='paint:otro';return B.noColor}
  for(const[id,re,name] of B.places)if(re.test(t)){orderKey='goto:'+id;
    // La escena es alta: se baja hasta donde los dos sellos ya están puestos
    if(PLACES[id]==='#open')goScene(.9);
    // Nautes: hasta donde el velero está completo
    else if(id==='nautes'&&boat.st?.shot)scrollTo({top:boat.st.s,behavior:rm?'auto':'smooth'});
    // Zalapp: hasta donde el móvil está formado
    else if(id==='zalapp'&&phone.st?.box)scrollTo({top:phone.st.s,behavior:rm?'auto':'smooth'});
    // Explora Natura: hasta donde la brújula está completa
    else if(id==='explora'&&comp.st)scrollTo({top:comp.st.s,behavior:rm?'auto':'smooth'});
    // Los proyectos, desde su encabezado (la sección es muy alta: centrada caería en mitad de Nautes)
    else $(PLACES[id]).scrollIntoView({behavior:rm?'auto':'smooth',block:id==='projects'?'start':'center'});
    return B.goTo(name)}
  if(B.reDance.test(t)){orderKey='dance';setOrder('dance');return B.dance}
  if(B.reFollow.test(t)){orderKey='follow';setOrder('follow');return B.follow}
  if(B.reCircle.test(t)){orderKey='circle';setOrder('circle');return B.circle}
  if(B.reLeave.test(t)){orderKey='leave';setOrder('leave',6000);return B.leave}
  if(B.reStrike.test(t)){orderKey='strike';closeBoss();startStrike();return''}
  if(B.reWork.test(t)){orderKey='work';setOrder(null);endStrike();return B.work}
  return B.unknown;
}
T.boss.chips.forEach(t=>{
  const b=document.createElement('button');b.type='button';b.className='pill';b.textContent=t;
  b.onclick=()=>giveOrder(t);$('#bossChips').appendChild(b)});
function giveOrder(raw){const r=command(raw);if(strip(raw))track('jefe-orden',{orden:orderKey});bossReply.textContent=r}
function openBoss(){track('jefe-abierto');closeNote();setAudit(false);setMore(false);boss.hidden=false;bBoss.setAttribute('aria-pressed',true);bossReply.textContent='';if(fine)bossIn.focus()}
// Al cerrar un panel con el foco dentro, el foco vuelve al botón que lo abrió (si no, se pierde en <body>)
function closeBoss(){const had=boss.contains(document.activeElement);boss.hidden=true;bBoss.setAttribute('aria-pressed',false);if(had)dockFocus(bBoss)}
bBoss.onclick=()=>boss.hidden?openBoss():closeBoss();
boss.addEventListener('submit',e=>{e.preventDefault();giveOrder(bossIn.value);bossIn.value=''});
addEventListener('keydown',e=>{
  const typing=/INPUT|TEXTAREA/.test(document.activeElement?.tagName||'');
  if(e.key==='Escape'){closeBoss();closeNote();setAudit(false);closeStamps();closeBoat();closeBuoys();compassFree();phoneOff();planDown();mapApi?.select(-1);setMore(false)}
  if(e.key==='/'&&!typing&&introDone){e.preventDefault();openBoss()}
});

/* ---------- Huelga ---------- */
const QUEJAS=T.strike.complaints;
let banner=null,speech=null,speechC=null,quejaT=0;
function startStrike(){
  if(strike||calm()||!cursors.length)return;strike=true;order=null;wake();
  banner=document.createElement('div');banner.className='banner';banner.textContent=fine?T.strike.bannerMouse:T.strike.bannerTouch;document.body.appendChild(banner);
  speech=document.createElement('div');speech.className='speech';document.body.appendChild(speech);
  const say=()=>{if(!strike)return;speechC=cursors[1+Math.floor(Math.random()*(cursors.length-1))];speech.textContent=QUEJAS[Math.floor(Math.random()*QUEJAS.length)]};
  say();quejaT=setInterval(say,2300);updateTeam();
}
function endStrike(){
  if(!strike)return;strike=false;clearInterval(quejaT);banner?.remove();banner=null;
  if(speech){speech.textContent=T.strike.end;const e=speech;setTimeout(()=>e.remove(),1300);speech=null}
  cursors.forEach(c=>c.next=0);updateTeam();
}
['pointermove','pointerdown','keydown','wheel','touchstart','scroll'].forEach(n=>addEventListener(n,()=>{lastAct=performance.now();if(strike&&n!=='scroll')endStrike()},{passive:true}));
function stepStrike(now){
  const busy=!boss.hidden||auditOn||document.activeElement?.tagName==='INPUT'||document.hidden;
  if(!strike&&introDone&&!busy&&now-lastAct>16000)startStrike();
  if(strike){
    const c0=cursors[0],bw=banner.bw||(banner.bw=banner.offsetWidth);banner.style.transform=`translate(${clamp(c0.x-bw/2,8,vw-bw-8)}px,${c0.y-58}px)`;
    if(speech&&speechC)speech.style.transform=`translate(${clamp(speechC.x-40,8,vw-200)}px,${speechC.y-36}px)`;
  }
}
function orderTarget(c,i,n,now){
  if(strike){
    const gap=Math.min(44,vw*.84/n);
    if(i===0){c.tx=vw/2;c.ty=vh-150}else{const k=i-(n/2);c.tx=vw/2+k*gap;c.ty=vh-110+(i%2)*22}
    return true}
  if(!order)return false;
  const a=i/n*6.283;
  if(order==='dance'){const R=Math.min(vw,vh)*.32*(1+.3*Math.sin(now*.004+i));c.tx=vw/2+Math.cos(a+now*.0022)*R;c.ty=vh/2+Math.sin(a+now*.0022)*R}
  else if(order==='follow'){const mx=mouse.x>0?mouse.x:vw/2,my=mouse.y>0?mouse.y:vh/2;c.tx=mx+Math.cos(a)*(30+i*5);c.ty=my+Math.sin(a)*(30+i*5)}
  else if(order==='circle'){const R=Math.min(vw,vh)*.36;c.tx=vw/2+Math.cos(a)*R;c.ty=vh/2+Math.sin(a)*R}
  else if(order==='leave'){c.tx=vw+160;c.ty=vh*(i/n)}
  return true;
}

/* ---------- Auditar esta web ---------- */
// En el orden de la página: portada, menú, retrato y sellos, Nautes, Explora Natura, Zalapp, Alcar, videomapping,
// herramientas y contacto
const NOTE_TARGETS=['#word','.tag','#hint','.top ul','#open','#stamps','#nautesBoat','#nRoute','#eCompass','#zPhone','#portal','#stage','#tool','#mail'];
const NOTES=T.notes.map(([title,text],i)=>[NOTE_TARGETS[i],title,text]);
const pinsEl=$('#pins'),note=$('#note'),bAudit=$('#bAudit');
let auditOn=false,noteI=0;
const noteEls=new Map();
const pinEls=NOTES.map((n,i)=>{const b=document.createElement('button');b.type='button';b.className='pin';b.textContent=i+1;b.hidden=true;b.setAttribute('aria-label',T.notePin(i+1,n[1]));b.onclick=()=>showNote(i);pinsEl.appendChild(b);return b});
function showNote(i,go){
  noteI=(i+NOTES.length)%NOTES.length;const n=NOTES[noteI];
  $('#nNum').textContent=T.noteCount(noteI+1,NOTES.length);$('#nTitle').textContent=n[1];$('#nText').textContent=n[2];note.hidden=false;
  pinEls.forEach((p,k)=>p.classList.toggle('on',k===noteI));
  track('auditar-nota',{nota:noteI+1});
  if(go){const el=$(n[0]);
    // Dentro de la escena alta: el texto se lee con el retrato formado, los sellos cuando ya están los dos
    if(scene.el.contains(el)){goScene(el===scene.el?.4:.9);return}
    // El botón del velero solo existe con su parada activa: se baja hasta ella
    if(boat.st&&(!el||el===boat.btn)){scrollTo({top:boat.st.s,behavior:rm?'auto':'smooth'});return}
    // La brújula, completa
    if(comp.st&&el.id==='eCompass'){scrollTo({top:comp.st.s,behavior:rm?'auto':'smooth'});return}
    el.style.scrollMarginTop='76px';el.scrollIntoView({behavior:rm?'auto':'smooth',block:small()?'start':'center'})}
}
function closeNote(){const had=note.contains(document.activeElement);note.hidden=true;if(had)dockFocus(bAudit)}
function setAudit(on){auditOn=on;bAudit.setAttribute('aria-pressed',on);pinEls.forEach(p=>p.hidden=!on);if(!on)closeNote()}
bAudit.onclick=()=>{if(auditOn){setAudit(false);return}track('auditar-abierto');closeBoss();setMore(false);setAudit(true);showNote(0,true)};
$('#nPrev').onclick=()=>showNote(noteI-1,true);$('#nNext').onclick=()=>showNote(noteI+1,true);$('#nClose').onclick=()=>setAudit(false);
function stepPins(){
  if(!auditOn)return;
  // Primero todas las lecturas, luego todas las escrituras: intercalarlas recalculaba la maqueta doce veces por frame
  const reads=NOTES.map(n=>{const el=noteEls.get(n[0])||noteEls.set(n[0],$(n[0])).get(n[0]);const r=el.getBoundingClientRect();return{r,vis:r.bottom>40&&r.top<vh&&getComputedStyle(el).opacity!=='0'}});
  reads.forEach(({r,vis},i)=>{const b=pinEls[i];
    b.style.display=vis?'':'none';if(vis)b.style.transform=`translate(${clamp(r.left+Math.min(r.width,vw)*.02,16,vw-16)}px,${clamp(r.top,52,vh-20)}px)`});
}


/* ---------- Bucle ---------- */
const you=$('#you');
addEventListener('pointermove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;
  if(fine&&introDone){you.style.opacity=1;you.style.transform=`translate(${e.clientX+15}px,${e.clientY+20}px)`}},{passive:true});
document.addEventListener('pointerleave',()=>{mouse.x=mouse.y=-999;you.style.opacity=0});
let last=performance.now();
// Lista fija de pasos: no se crean funciones nuevas en cada frame (menos trabajo para el recolector)
/* Qué mantiene vivo cada paso (pone busy = true; si ninguno lo pone, el bucle se duerme):
   stepScene     un sello que cae, se asienta o flota (este solo sin calm()) y el golpe de la escena
   stepLetters   una letra que no está en reposo (arrastrada, suelta, esperando o de vuelta) o su escala
   stepCursors   un cursor con encargo, o a la vista mientras haya actividad reciente (ver «Reposo del equipo»;
                 en pausa no se mueven: están ocultos)
   stepDust      puntos que aún se mueven, el ruido de reposo (si se ven) y la ola (no con calm()), el vaivén del velero
                 y el cambio de color
   stepBoat      la transformación del velero, su atracción y el botón «Visitar nautes.es»
   stepCompass   el muelle de la aguja y el brillo de las letras
   stepPhone     encender o apagar la pantalla, el muelle de la hoja y la atracción
   stepPit       piezas de la caja en movimiento o cogidas
   stepPlan      el trazado del plano, las cotas y el muelle de la obra
   stepStrike    la huelga en curso (la automática la despierta un temporizador: armStrike)
   stepPins      nada propio: los pines solo cambian con el scroll o con otra animación
   videomapping  el dibujo animado (no con calm(): ahí se pinta un fotograma fijo) y los muelles de las esquinas
   Además: la intro y las órdenes del jefe de obra. Lo despiertan scroll, puntero, teclado, foco, cambio de tamaño
   y lo que llega más tarde (JSON, fuentes, recolocar) */
const STEPS=[(f,now)=>stepScene(now),f=>stepLetters(f),stepCursors,stepDust,stepBoat,stepCompass,stepPhone,stepPit,stepPlan,(f,now)=>stepStrike(now),stepPins,
  (f,now)=>{if(!mapOn||!mapApi)return;mapApi.stepSprings(f);if(!calm()){mapApi.draw(now);busy=true}else if(!mapDrawn){mapApi.draw(0);mapDrawn=true}}];
let scrolled=false,awake=false,wakeT=0,strikeT=0,ready=false; // ready: boot() ya ha colocado las formas
const IDLE_MS=400; // margen tras el último evento antes de dormir
function wake(){wakeT=performance.now();if(ready&&!awake){awake=true;last=wakeT;requestAnimationFrame(loop)}}
['scroll','wheel','pointermove','pointerdown','keydown','focusin','touchstart','resize'].forEach(n=>addEventListener(n,wake,{passive:true,capture:true}));
// Huelga automática a los 16 s sin actividad: con el bucle dormido hace falta un temporizador que lo despierte
function armStrike(){clearTimeout(strikeT);if(!calm()&&introDone&&!strike)strikeT=setTimeout(wake,Math.max(0,lastAct+16050-performance.now()))}
function loop(now){
  const f=clamp((now-last)/16.67,.2,2.4);last=now;
  // Con el cuaderno abierto, el bucle principal duerme (el cuaderno tiene el suyo); al cerrarlo, wake()
  if(zDlg.open){awake=false;return}
  busy=!introDone||!!order||strike;
  // scrollY se lee una vez, al principio del frame y antes de escribir nada
  SY=scrollY;
  if(scrolled){scrolled=false;try{applyTone();updateTeam();trackDepth()}catch(e){console.error(e)}}
  for(let i=0;i<STEPS.length;i++){try{STEPS[i](f,now)}catch(e){console.error(e)}}
  if(busy||now-wakeT<IDLE_MS)requestAnimationFrame(loop);
  else{awake=false;armStrike()}
}
/* ---------- Pausar animaciones (A-02) ---------- */
const bPause=$('#bPause');
function setPaused(on,user){
  paused=on;root.classList.toggle('paused',on);bPause.setAttribute('aria-pressed',on);
  if(!user)return;
  try{localStorage.setItem(PAUSE_KEY,on?'1':'0')}catch(e){}
  track('pausa',{activa:on?'si':'no'});
  if(on){
    endStrike();
    // Lo que llevaban los cursores sigue sin ellos: las letras vuelven solas y el plano se termina
    cursors.forEach(c=>{if(c.job){const L=c.job.L;if(L.mode==='wait')L.mode='carry';c.job=null}});
    if(plan.started&&!plan.done)planFinish();
  }else{const now=performance.now();cursors.forEach(c=>{c.next=now+rand(0,1200)})} // vuelven a pasear cada uno a su tiempo
  mapDrawn=false;updateTeam();wake();
}
bPause.addEventListener('click',()=>setPaused(!paused,true));
setPaused(paused);
// «Reducir movimiento» cambiado con la página abierta (A-02 d): se aplica sin recargar
rmQuery.addEventListener('change',e=>{
  rm=e.matches;
  if(rm){endStrike();finish()}
  else if(!cursors.length&&introDone){makeCursors();freeCrew();updateTeam()}
  mapDrawn=false;wake();
});

function placeStops(){measureScene();measureTones();planMeasure();for(const st of stops)stopRange(st)}
/* Si la tipografía u otra cosa cambia la altura, recalcula dónde aparece cada forma */
// Si cambia el ancho visible sin que la ventana cambie (aparece la barra de scroll al acabar la intro, que tenía la
// página bloqueada), se recoloca todo: si no, los puntos se dibujarían con el ancho de antes, corridos
new ResizeObserver(()=>{placeStops();if(viewW()!==vw){clearTimeout(rto);rto=setTimeout(relayout,60)}}).observe($('main'));
let rto;
function relayout(){
  // En móvil, la barra del navegador cambia el alto mientras se hace scroll. El lienzo se ajusta
  // al momento (es barato); el recálculo de formas espera a que el scroll se pare para no dar un tirón
  if(performance.now()-scrollT<250){rto=setTimeout(relayout,200);return}
  layout();warp();sizePlan();wake();
}
addEventListener('resize',()=>{
  clearTimeout(rto);
  if(viewW()===vw){sizeCanvas();placeStops();rto=setTimeout(relayout,300)}
  else rto=setTimeout(relayout,150);
});
// El scroll solo apunta que ha pasado; el tono y el equipo se actualizan en el siguiente frame
addEventListener('scroll',()=>{scrollT=performance.now();scrolled=true},{passive:true});

async function boot(){
  for(let i=0;i<60&&(!innerWidth||!innerHeight);i++)await pause(100);
  vw=viewW();vh=innerHeight;
  // Solo se espera la fuente del nombre, como mucho 600 ms (P-01): los puntos y lo demás llegan después y recolocan
  try{await Promise.race([document.fonts.load('900 100px "Big Shoulders Display"'),pause(600)])}catch(e){}
  // Si algo falla o el visor frena la animación, la web se abre igualmente
  const guard=setTimeout(rescue,6000);
  try{
    makeCursors();layout();warp();sizePlan();bindLetters();updateTeam();
    for(let n=0;n<N;n++){px[n]=stops[0].t[n*2];py[n]=stops[0].t[n*2+1]}
    ready=true;wake();
  }catch(e){console.error(e);clearTimeout(guard);rescue();return}
  // Las fuentes propias (fonts.js, con font-display:swap) pueden llegar tarde: recoloca si cambia la medida
  document.fonts.ready.then(pointsReady);
  // Las imágenes en puntos llegan después (pointsReady); si alguna llegó antes de boot, layout() ya la ha usado
  // Sin intro (ya vista en esta sesión o con «reducir movimiento»: boot.js no puso la clase), la página abre montada
  if(!root.classList.contains('intro')){introDone=true;skipped=true;clearTimeout(guard);$('#skip').remove();freeCrew();updateTeam();wake();return}
  surEl.textContent='';
  $('#skip').onclick=finish;
  addEventListener('wheel',finish,{passive:true});addEventListener('touchmove',finish,{passive:true});addEventListener('keydown',finish);
  await intro();clearTimeout(guard);
}
boot().catch(e=>{console.error(e);rescue()});
}
