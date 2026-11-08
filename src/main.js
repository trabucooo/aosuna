import './fonts.js';
import './style.css';
import { T, ES, LANG } from './i18n.js';
import alcarShot from './assets/alcar.webp';

(()=>{
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
const rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
const small=()=>innerWidth<=860;
let vw=innerWidth,vh=innerHeight,SY=scrollY; // SY: scroll del frame actual

/* ---------- Analítica (Umami). Si no carga o está bloqueada, no pasa nada ---------- */
function track(name,data){try{window.umami?.track(name,data)}catch(e){}}

/* ---------- Tonos por sección ---------- */
const TONES={
  paper:['#0E1014','#EEF0F4','#7D8BFF'],
  olive:['#10130A','#EEF0D0','#C7D34A'],
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
  toneBoxes=toneEls.map(box);contactBox=box($('#contacto'));
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
  const avail=Math.max(0,nameEl.parentElement.clientWidth-parseFloat(getComputedStyle(nameEl.parentElement).paddingLeft)-parseFloat(getComputedStyle(nameEl.parentElement).paddingRight));
  nameEl.style.fontSize='100px';
  const w=word.scrollWidth||1;
  // Alto del bloque sticky (100svh): no cambia cuando la barra del navegador móvil aparece o se esconde
  const maxH=(nameEl.parentElement.clientHeight||vh)*(small()?.3:.42);
  const fs=Math.min(avail/w*100*.98,maxH/.84);
  nameEl.style.fontSize=fs+'px';
  letters.forEach(L=>{const r=L.el.getBoundingClientRect();L.cx=r.left+r.width/2;L.cy=r.top+r.height/2;L.w=r.width;L.h=r.height;L.box={left:r.left,top:r.top,width:r.width,height:r.height}});
  surEl.style.fontSize='';
}
function paintLetter(L){const s=L.sc.x,t=(L.x||L.y||L.r||s!==1)?`translate(${L.x}px,${L.y}px) rotate(${L.r}deg) scale(${s})`:'';if(t!==L.t){L.t=t;L.el.style.transform=t}}

/* ---------- Cursores ---------- */
const LABELS=T.crew;
const COLORS=['#2A3FF0','#D6264F','#0A8A5C','#B3470F','#7A2BD6','#00788C','#B81F8A','#7A8500','#3A3AD0','#A8341A','#006B4F','#C03030'];
const crew=$('#crew'),cursors=[];
function makeCursors(){
  const n=rm?0:(small()?12:22);
  for(let i=0;i<n;i++){
    const el=document.createElement('div');el.className='c';
    const col=COLORS[i%COLORS.length];el.style.setProperty('--c',col);
    el.innerHTML='<svg viewBox="0 0 20 24"><path d="M1.5 1.5v18.6l5-4.5 3.4 7.6 3.5-1.6-3.4-7.4 7-.6z"/></svg>'+(i<LABELS.length?`<span>${LABELS[i]}</span>`:'');
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
function freeCursors(){return cursors.filter(c=>!c.job&&!c.script&&!c.follow&&!c.task)}
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
      const e=.1*f;L.x+=-L.x*e;L.y+=-L.y*e;L.r+=-L.r*e;
      if(Math.abs(L.x)+Math.abs(L.y)<1.2){
        L.x=L.y=L.r=0;L.mode='rest';
        cursors.forEach(c=>{if(c.job&&c.job.L===L){c.job=null;c.next=0}});
        if(L.done){const d=L.done;L.done=null;d()}
      }
    }
    paintLetter(L);
  }
}
function stepCursors(f,now){
  const vmax=MAX_WANDER_V();
  for(const c of cursors){
    let wander=false;
    if(c.job){
      const L=c.job.L;c.tx=L.cx+L.x+c.job.ox;c.ty=L.cy+L.y+c.job.oy;
      if(L.mode==='wait'&&Math.hypot(c.tx-c.x,c.ty-c.y)<34)L.mode='carry';
    }else if(c.task){
      aimTask(c,now);c.box.classList.remove('on');
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
      if(gather){const i=cursors.indexOf(c),a=i/cursors.length*6.283+now*.00018;
        if(small()){c.tx=(i/cursors.length)*vw*.8+6;c.ty=vh-110+Math.sin(a*3)*10}
        else{c.tx=vw*.82+Math.cos(a)*vw*.1;c.ty=vh*.34+Math.sin(a)*vh*.2}}
      else{if(now>c.next)wanderTarget(c);wander=true}
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
    c.el.style.transform=`translate3d(${c.x}px,${c.y}px,0)`;
    c.trail.push(c.x,c.y);if(c.trail.length>180)c.trail.splice(0,2);
    if(c.slot){const w=Math.max(0,c.x-c.sx),h=Math.max(0,c.y-c.sy);c.slot.style.width=w+'px';c.slot.style.height=h+'px'}
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

/* ---------- Intro ---------- */
let skipped=false,introDone=false;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const slots=[];
async function intro(){
  const loader=$('#loader'),pct=$('#pct');
  const t0=performance.now();
  (function count(){if(skipped)return;const p=clamp((performance.now()-t0)/1050);pct.textContent=T.loading(Math.round(p*100));if(p<1)setTimeout(count,40)})();
  await pause(520);if(skipped)return;
  cursors.forEach((c,i)=>{const a=i/cursors.length*6.283;c.tx=vw/2+Math.cos(a)*rand(46,120);c.ty=vh/2+Math.sin(a)*rand(46,110)});
  await pause(620);if(skipped)return;
  loader.classList.add('pop');
  cursors.forEach(c=>{const a=Math.atan2(c.y-vh/2,c.x-vw/2);c.vx+=Math.cos(a)*22;c.vy+=Math.sin(a)*22;wanderTarget(c)});
  await pause(260);if(skipped)return;
  // Dibujan las casillas de cada letra
  const builders=cursors.slice(0,12);
  const draw=letters.map(async(L,i)=>{
    await pause(i*110);if(skipped)return;
    const c=builders[i],b=L.box;
    c.tx=b.left;c.ty=b.top;
    await pause(300);if(skipped)return;
    const s=document.createElement('div');s.className='slot';s.style.left=b.left+'px';s.style.top=b.top+'px';s.style.width=s.style.height='0';document.body.appendChild(s);slots.push(s);
    c.x=b.left;c.y=b.top;c.vx=c.vy=0;c.sx=b.left;c.sy=b.top;c.slot=s;
    c.tx=b.left+b.width;c.ty=b.top+b.height;
    await pause(430);if(skipped)return;
    c.slot=null;s.style.width=b.width+'px';s.style.height=b.height+'px';wanderTarget(c);
  });
  await Promise.all(draw);if(skipped)return;
  // Traen las letras
  letters.forEach(L=>{
    L.x=rand(.08,.92)*vw-L.cx;L.y=(Math.random()<.5?rand(.1,.22):rand(.78,.92))*vh-L.cy;L.r=rand(-28,28);
    L.el.classList.add('on');paintLetter(L);
  });
  await pause(130);if(skipped)return;
  const carriers=cursors.slice(4);
  const carry=letters.map(async(L,i)=>{
    await pause(i*90);if(skipped)return;
    const list=[carriers[i*2%carriers.length],carriers[(i*2+1)%carriers.length]].filter(Boolean);
    await fetchLetter(L,list);
    if(!skipped&&slots[i])slots[i].style.opacity=0;
  });
  await Promise.all(carry);if(skipped)return;
  // Pintan
  await Promise.all(letters.map(async(L,i)=>{
    await pause(i*75);if(skipped)return;
    const c=cursors[i%cursors.length];
    c.x=L.cx;c.y=L.box.top;c.vx=c.vy=0;c.tx=L.cx;c.ty=L.box.top+L.box.height;
    L.el.classList.add('painted');
    await pause(380);if(!skipped)wanderTarget(c);
  }));
  if(skipped)return;
  // Escriben el apellido
  const full='OSUNA SOTO';surEl.textContent='';
  for(let i=1;i<=full.length;i++){surEl.textContent=full.slice(0,i);await pause(34);if(skipped)return}
  for(const el of $$('.reveal')){el.classList.add('shown');await pause(130);if(skipped)return}
  finish();
}
function rescue(){if(!introDone)finish();root.classList.remove('intro','locked');$$('.l').forEach(l=>l.style.transform='')}
function finish(){
  if(introDone)return;introDone=true;skipped=true;
  letters.forEach(L=>{L.x=L.y=L.r=0;L.mode='rest';L.done=null;paintLetter(L)});
  slots.forEach(s=>s.remove());
  surEl.textContent='OSUNA SOTO';
  root.classList.remove('intro','locked');
  $('#loader')?.remove();$('#skip')?.remove();
  cursors.forEach(c=>{c.job=null;c.slot=null;c.script=false;c.next=0});
  lastAct=performance.now();
  removeEventListener('wheel',finish);removeEventListener('touchmove',finish);removeEventListener('keydown',finish);
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
let scrollT=0;
let dustNow=[125,139,255],dustTarget=[125,139,255],inkRgb=[238,240,244],layer=T.layerHome;
const aura=$('#aura');let auraX=-1,auraY=-1;
const SHAPES={
  bolt(c,w,h){c.beginPath();const p=[[.58,.02],[.2,.56],[.46,.56],[.36,.98],[.82,.38],[.54,.38],[.72,.02]];p.forEach((q,i)=>c[i?'lineTo':'moveTo'](q[0]*w,q[1]*h));c.fill()},
  olive(c,w,h){c.save();c.translate(w*.5,h*.54);c.rotate(-.5);c.beginPath();c.ellipse(0,0,w*.3,h*.38,0,0,6.3);c.fill();c.globalCompositeOperation='destination-out';c.beginPath();c.ellipse(-w*.1,-h*.14,w*.05,h*.09,.4,0,6.3);c.fill();c.restore();c.globalCompositeOperation='source-over';c.save();c.translate(w*.72,h*.13);c.rotate(.55);c.beginPath();c.ellipse(0,0,w*.2,h*.07,0,0,6.3);c.fill();c.restore()},
  bubble(c,w,h){c.beginPath();c.roundRect(w*.06,h*.12,w*.88,h*.58,w*.09);c.fill();c.beginPath();c.moveTo(w*.26,h*.66);c.lineTo(w*.22,h*.92);c.lineTo(w*.5,h*.66);c.fill();c.globalCompositeOperation='destination-out';[.3,.5,.7].forEach(x=>{c.beginPath();c.arc(w*x,h*.41,w*.058,0,6.3);c.fill()});c.globalCompositeOperation='source-over'},
  boat(c,w,h){c.beginPath();c.moveTo(w*.48,h*.04);c.lineTo(w*.48,h*.66);c.lineTo(w*.12,h*.66);c.fill();c.beginPath();c.moveTo(w*.54,h*.14);c.lineTo(w*.54,h*.66);c.lineTo(w*.84,h*.66);c.fill();c.beginPath();c.moveTo(w*.06,h*.72);c.lineTo(w*.94,h*.72);c.lineTo(w*.76,h*.9);c.lineTo(w*.24,h*.9);c.fill()},
  browser(c,w,h){c.lineWidth=w*.035;c.strokeRect(w*.06,h*.14,w*.88,h*.72);c.fillRect(w*.06,h*.14,w*.88,h*.13);c.fillRect(w*.14,h*.36,w*.32,h*.4);c.fillRect(w*.54,h*.36,w*.32,h*.06);c.fillRect(w*.54,h*.5,w*.32,h*.06);c.fillRect(w*.54,h*.64,w*.2,h*.06)},
  arrow(c,w,h){c.beginPath();[[.26,.04],[.26,.84],[.44,.67],[.57,.97],[.69,.91],[.56,.62],[.8,.6]].forEach((q,i)=>c[i?'lineTo':'moveTo'](q[0]*w,q[1]*h));c.fill()},
  route(c,w,h){c.lineWidth=h*.024;c.beginPath();c.moveTo(0,h*.8);c.bezierCurveTo(w*.3,h*.2,w*.42,h*1.05,w*.66,h*.55);c.bezierCurveTo(w*.78,h*.3,w*.9,h*.3,w,h*.14);c.stroke();[[.16,.56],[.42,.67],[.66,.55],[.88,.32]].forEach(q=>{c.beginPath();c.arc(q[0]*w,q[1]*h,h*.04,0,6.3);c.fill()})},
  wave(c,w,h){c.lineWidth=h*.022;for(let r=0;r<5;r++){c.beginPath();for(let x=0;x<=w;x+=6){const y=h*(.62+r*.08)+Math.sin(x/w*12+r)*h*.035;x?c.lineTo(x,y):c.moveTo(x,y)}c.stroke()}},
  facade(c,w,h){for(let x=0;x<8;x++)for(let y=0;y<4;y++)c.strokeRect(w*(.03+x*.12),h*(.06+y*.23),w*.09,h*.17)},
  beam(c,w,h){c.beginPath();c.moveTo(0,h*.92);c.lineTo(w*.98,h*.04);c.lineTo(w*.98,h*.82);c.closePath();c.fill()},
  scatter(c,w,h){c.fillRect(0,0,w,h)}
};
const FULL={route:1,wave:1,facade:1,beam:1,scatter:1};
const off=document.createElement('canvas');const octx=off.getContext('2d',{willReadFrequently:true});
function sample(w,h,draw){
  w=Math.max(2,w|0);h=Math.max(2,h|0);off.width=w;off.height=h;octx.clearRect(0,0,w,h);octx.fillStyle=octx.strokeStyle='#000';draw(octx,w,h);
  const d=octx.getImageData(0,0,w,h).data,pts=[];
  for(let y=0;y<h;y+=2)for(let x=0;x<w;x+=2)if(d[(y*w+x)*4+3]>128)pts.push(x,y);
  return pts;
}
function toTargets(pts,x0,y0,sx,sy){
  const t=new Float32Array(N*2),n=pts.length/2||1;
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
// data-points="/archivo.json": la parada dibuja esa imagen en puntos; si el archivo no llega, usa data-fallback
const stops=$$('[data-shape]').map(el=>({el,shape:el.dataset.shape,alpha:+el.dataset.alpha,src:el.dataset.points||'',fallback:el.dataset.fallback||'scatter',data:null,s:0,e:0,t:null,z:null,flat:el.dataset.shape==='portrait'}));
function stopRange(st){
  if(st.shape==='hero'){st.s=st.e=vh*.32;return}
  if(st.shape==='portrait'){st.s=scene.top+scene.len*PORTRAIT_IN;st.e=scene.top+scene.len*PORTRAIT_OUT;return}
  const r=st.el.getBoundingClientRect();st.s=st.e=r.top+scrollY+r.height/2-vh/2;
}
/* Imágenes en puntos (public/retrato-puntos.json, public/apreton-puntos.json…): {ratio, desktop:[x,y,s,...], mobile:[...]}.
   x e y van de 0 a 1 sobre el recorte; s, la luz de 0 a 1, da el tamaño del punto. Cada archivo se pide una sola vez */
const pointFiles={};
const loadPoints=src=>pointFiles[src]||(pointFiles[src]=fetch(import.meta.env.BASE_URL+src.replace(/^\//,''))
  .then(r=>r.ok?r.json():null).then(d=>d&&d.ratio&&d.desktop?.length&&d.mobile?.length?d:null).catch(()=>null));
const pointsLoad=Promise.all(stops.filter(st=>st.src).map(st=>loadPoints(st.src).then(d=>st.data=d)));
// Tamaño del punto: base + luz × rango, en ordenador (d) y en móvil (m)
const DOT={portrait:{d:[1.1,2.6],m:[1.3,2.4]},points:{d:[1,2.6],m:[1.2,2.3]}};
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
   se mide dónde queda el texto en la pantalla cuando la forma está completa (scroll = st.s) */
function chapterBox(st,ratio){
  const sm=small(),r=(st.el.querySelector('.ch-text')||st.el).getBoundingClientRect();
  const top=r.top+scrollY-st.s,gap=sm?14:32,y1=sm?58:72,y2=vh-60,g=16;
  // Al lado: entre el texto y el borde derecho, centrada en vh/2 y, si cabe, en el 72 % del ancho como la forma de antes
  const L=r.right+gap,R=vw-g,sw=Math.min(vw*(sm?.92:.46),R-L,(y2-y1)*ratio),sh=sw/ratio;
  const side=[clamp(vw*.72-sw/2,L,R-sw),clamp(vh/2-sh/2,y1,y2-sh),sw,sh];
  if(!sm)return side;
  // Encima: entre la barra de arriba y el texto, centrada en ese hueco. En móvil en horizontal suele caber más al lado
  const tw=Math.min(vw*.92,vw-2*g,(top-gap-y1)*ratio),th=tw/ratio;
  return sw>tw?side:[(vw-tw)/2,y1+(top-gap-y1-th)/2,tw,th];
}
function imageTargets(st){
  if(!st.data)return null;
  const box=st.shape==='portrait'?portraitBox(st.data.ratio):chapterBox(st,st.data.ratio);
  return box&&pointTargets(st.data,box,DOT[st.shape]||DOT.points);
}
function sizeCanvas(){
  vw=innerWidth;vh=innerHeight;SY=scrollY;
  const d=Math.min(devicePixelRatio||1,1.6),w=Math.round(vw*d),h=Math.round(vh*d);
  if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h}
  ctx.setTransform(d,0,0,d,0,0);
}
function layout(){
  sizeCanvas();
  fitName();measureScene();measureTones();
  const sm=small();
  for(const st of stops){
    stopRange(st);st.z=null;
    if(st.shape==='hero'){st.t=toTargets(heroPts(),0,0,2,2);continue}
    const pt=imageTargets(st);
    if(pt){st.t=pt.t;st.z=pt.z;continue}
    // Sin imagen (no hay data-points o el archivo no llegó): la forma dibujada, o la de reserva
    const shape=SHAPES[st.shape]?st.shape:SHAPES[st.fallback]?st.fallback:'scatter';
    if(FULL[shape]){st.t=toTargets(sample(320,180,SHAPES[shape]),0,0,vw/320,vh/180);continue}
    const size=sm?Math.min(vw*.74,vh*.38):Math.min(vw*.4,vh*.62);
    const x0=sm?(vw-size)/2:vw*.72-size/2,y0=sm?vh*.1:(vh-size)/2;
    st.t=toTargets(sample(240,240,SHAPES[shape]),x0,y0,size/240,size/240);
  }
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
    const t=c.trail;if(t.length<8||c.el.classList.contains('off'))continue;
    ctx.strokeStyle=c.col;ctx.globalAlpha=SY>vh*.3?.2:.42;ctx.beginPath();ctx.moveTo(t[0],t[1]);
    for(let i=2;i<t.length;i+=2)ctx.lineTo(t[i],t[i+1]);ctx.stroke();
  }
  ctx.globalAlpha=.16;ctx.strokeStyle=`rgb(${dustNow[0]|0},${dustNow[1]|0},${dustNow[2]|0})`;ctx.lineWidth=1.4;
  signs.slice(-40).forEach((f,k)=>{
    let h=7;for(const ch of f.id)h=(h*31+ch.charCodeAt(0))>>>0;
    const ox=(h%1000)/1000*(vw-130),oy=((h>>10)%1000)/1000*(vh-90);
    for(const a of f.strokes){ctx.beginPath();for(let i=0;i+1<a.length;i+=2)ctx[i?'lineTo':'moveTo'](ox+a[i]*1.3,oy+a[i+1]*.86);ctx.stroke()}
  });
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
  const wa=a.shape==='wave'?1-t:b.shape==='wave'?t:0;
  const ta=a.t,tb=b.t;
  const mr=small()?70:110,mr2=mr*mr;
  // Ruido solo cuando no se hace scroll: entra en medio segundo
  const amp=rm?0:NOISE*smooth(clamp((now-scrollT-150)/500));
  const dm=Math.pow(.8,f),mx=mouse.x,my=mouse.y,wt=now*.0016;
  for(let n=0;n<N;n++){
    const k=n*2;
    let gx=ta[k]+(tb[k]-ta[k])*t,gy=ta[k+1]+(tb[k+1]-ta[k+1])*t;
    if(wa)gy+=Math.sin(gx*.012+wt)*16*wa;
    if(rm){px[n]=gx;py[n]=gy;continue}
    if(amp){const w=now*nfq[n]+nph[n];gx+=Math.sin(w)*amp;gy+=Math.cos(w*1.31+nph[n])*amp}
    const e=ez[n]*f;
    pvx[n]+=(gx-px[n])*e*.55;pvy[n]+=(gy-py[n])*e*.55;
    const dx=px[n]-mx,dy=py[n]-my,d2=dx*dx+dy*dy;
    if(d2<mr2&&d2>1){const q=(1-d2/mr2)*3.2/Math.sqrt(d2);pvx[n]+=dx*q*f;pvy[n]+=dy*q*f}
    pvx[n]*=dm;pvy[n]*=dm;px[n]+=pvx[n]*f;py[n]+=pvy[n]*f;
  }
  for(let c=0;c<3;c++)dustNow[c]+=(dustTarget[c]-dustNow[c])*.06;
  ctx.clearRect(0,0,vw,vh);
  try{drawField(now)}catch(e){console.error(e)}
  if(al<.01)return;
  ctx.globalAlpha=al;
  const lift=c=>Math.min(255,dustNow[c]*.72+90)|0;
  ctx.fillStyle=`rgb(${lift(0)},${lift(1)},${lift(2)})`;
  const za=a.z,zb=b.z;
  if(za||zb){for(let n=0;n<N;n++){const s0=za?za[n]:ps[n],s=s0+((zb?zb[n]:ps[n])-s0)*t;ctx.fillRect(px[n],py[n],s,s)}}
  else for(let n=0;n<N;n++)ctx.fillRect(px[n],py[n],ps[n],ps[n]);
  ctx.globalAlpha=1;
}

/* ---------- El equipo acompaña el scroll ---------- */
function updateTeam(){
  const heroOut=SY>vh*.42;
  if(!contactBox)measureTones();
  const top=contactBox.top-SY,bottom=contactBox.bottom-SY;
  gather=top<vh*.45&&bottom>0;
  cursors.forEach((c,i)=>{
    const guide=i<3;
    c.el.classList.toggle('off',introDone&&heroOut&&!gather&&!strike&&!order&&!c.task&&!(guide&&(c.follow||!small())));
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
      dx=off*(1-e);dy=-LIFT+(q>=1?Math.sin(now*.006)*2:0);rot+=7*(1-e);sc=UP;
    }else{
      const t=now-st.dropT;
      // Caída: misma curva acelerada para la altura y para la escala (de UP a SQUASH justo en el impacto)
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
  if(!rm&&now-scene.shake<SHAKE_MS){const k=(now-scene.shake)/SHAKE_MS;scene.grid.style.transform=`translateY(${(SHAKE_PX*(1-k)*(1-k)*Math.sin(k*Math.PI*3)).toFixed(2)}px)`}
  else if(scene.grid.style.transform)scene.grid.style.transform='';
}

/* ---------- Zalapp ---------- */
const dots=$('#dots');
const groups=[...Array(36).fill('as'),...Array(5).fill('au'),...Array(4).fill('fl'),...Array(2).fill('ot')];
groups.forEach(g=>{const d=document.createElement('i');d.className='dot on';d.dataset.g=g;dots.appendChild(d)});
const zOpts=[['as','au','fl','ot'],['as','au'],['as'],['au'],['fl'],['ot']].map((g,i)=>[T.zalapp[i],g]);
const zPills=$('#zPills'),zRead=$('#zRead');
zOpts.forEach(([t,g],i)=>{const b=document.createElement('button');b.type='button';b.className='pill';b.textContent=t;b.setAttribute('aria-pressed',i==0);
  b.onclick=()=>{track('zalapp-filtro',{filtro:ES.zalapp[i]});$$('.pill',zPills).forEach(x=>x.setAttribute('aria-pressed',x===b));zRead.textContent=t;$$('.dot').forEach(d=>d.classList.toggle('on',g.includes(d.dataset.g)))};zPills.appendChild(b)});

/* ---------- Nautes ---------- */
const nSteps=T.nautes;
const nPills=$('#nPills'),nPanel=$('#nPanel');
function showStep(i){const s=nSteps[i];nPanel.innerHTML=`<p class="eyebrow">${s[0]}</p><h4>${s[1]}</h4><ul>${s[2].map(x=>`<li>${x}</li>`).join('')}</ul>`;$$('.pill',nPills).forEach((p,k)=>p.setAttribute('aria-pressed',k===i))}
nSteps.forEach((s,i)=>{const b=document.createElement('button');b.type='button';b.className='pill';b.textContent=s[0];b.onclick=()=>{track('nautes-paso',{paso:ES.nautes[i][0]});showStep(i)};nPills.appendChild(b)});showStep(0);

/* ---------- Alcar: la captura se deshace en ceros y unos ---------- */
const PORTAL_URL=''; // Dirección de la web nueva
const PORTAL_IMG=alcarShot; // Captura de la web nueva
const portal=$('#portal'),bitsC=$('#bits'),bc=bitsC.getContext('2d'),enter=$('#enter');
const CELL=13,base=document.createElement('canvas');
const P={x:0,y:0,tx:0,ty:0,on:false,w:0,h:0,cols:0,rows:0,d:null,n:null,b:null,rgb:null,dirty:true,wave:-1,wx:0,wy:0,hold:0};
let shotImg=null;
function drawBase(c,w,h){
  if(shotImg){const r=Math.max(w/shotImg.width,h/shotImg.height),iw=shotImg.width*r;c.drawImage(shotImg,(w-iw)/2,0,iw,shotImg.height*r);return}
  c.fillStyle='#26231F';c.fillRect(0,0,w,h);
  const g=[['#2B2823',0,.34],['#37332C',.34,.62],['#211F1B',.62,1]];
  g.forEach(([f,a,b])=>{c.fillStyle=f;c.beginPath();c.moveTo(a*w+h*.14,30);c.lineTo(b*w+h*.14,30);c.lineTo(b*w-h*.14,h);c.lineTo(a*w-h*.14,h);c.fill()});
  c.fillStyle='#26231F';c.fillRect(0,0,w,30);c.fillStyle='#5A544B';[16,31,46].forEach(x=>{c.beginPath();c.arc(x,15,4.5,0,6.3);c.fill()});
  c.fillStyle='#EDE8DC';c.textBaseline='alphabetic';c.font=`900 ${Math.max(28,w*.075)}px "Big Shoulders Display",Impact,sans-serif`;c.fillText(T.portal.placeholder,18,h-38);
  c.font='400 11px "Martian Mono",monospace';c.fillText(T.portal.placeholderSub,18,h-18);
}
function sizePortal(){
  const r=portal.getBoundingClientRect();if(!r.width)return;
  const d=Math.min(devicePixelRatio||1,1.6);P.w=r.width;P.h=r.height;
  bitsC.width=r.width*d;bitsC.height=r.height*d;bc.setTransform(d,0,0,d,0,0);
  base.width=r.width;base.height=r.height;drawBase(base.getContext('2d'),r.width,r.height);
  P.cols=Math.ceil(r.width/CELL);P.rows=Math.ceil(r.height/CELL);const n=P.cols*P.rows;
  P.d=new Float32Array(n);P.n=new Float32Array(n).map(()=>Math.random());P.b=new Uint8Array(n).map(()=>Math.random()<.5?48:49);
  const t=document.createElement('canvas');t.width=P.cols;t.height=P.rows;const tc=t.getContext('2d',{willReadFrequently:true});tc.drawImage(base,0,0,P.cols,P.rows);
  P.rgb=tc.getImageData(0,0,P.cols,P.rows).data;P.dirty=true;
}
if(PORTAL_IMG){const im=new Image();im.onload=()=>{shotImg=im;sizePortal()};im.src=PORTAL_IMG}
function aimPortal(e){const r=portal.getBoundingClientRect();P.tx=e.clientX-r.left;P.ty=e.clientY-r.top}
const openP=()=>{P.on=true;P.dirty=true};
const shutP=()=>{P.on=false};
portal.addEventListener('pointerenter',e=>{aimPortal(e);P.x=P.tx;P.y=P.ty;if(e.pointerType==='mouse')openP()});
portal.addEventListener('pointermove',aimPortal);
portal.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')shutP()});
portal.addEventListener('focus',()=>{if(!portal.matches(':focus-visible'))return;P.tx=P.w/2;P.ty=P.h/2;openP()});
portal.addEventListener('blur',shutP);
portal.addEventListener('click',e=>{
  if(!fine&&!P.on){e.preventDefault();aimPortal(e);P.x=P.tx;P.y=P.ty;openP();return}
  track('portal-alcar');
  P.wave=0;P.hold=40;P.wx=P.x;P.wy=P.y;P.dirty=true;
  if(!PORTAL_URL){e.preventDefault();$('#portalNote').textContent=T.portal.pending}
});
if(PORTAL_URL){portal.href=PORTAL_URL;portal.target='_blank';portal.rel='noopener'}
let portalVis=false;new IntersectionObserver(es=>portalVis=es[0].isIntersecting).observe(portal);
function stepPortal(){
  if(!portalVis||!P.d||!P.dirty)return;
  P.x+=(P.tx-P.x)*.2;P.y+=(P.ty-P.y)*.2;
  if(P.wave>=0){P.wave+=30;if(P.wave>Math.hypot(P.w,P.h)*1.3&&--P.hold<0)P.wave=-1}
  const R=Math.min(P.w,P.h)*.4;let active=false;
  bc.drawImage(base,0,0,P.w,P.h);bc.font='600 11px "Martian Mono",monospace';bc.textBaseline='middle';bc.textAlign='center';
  for(let j=0;j<P.rows;j++)for(let i=0;i<P.cols;i++){
    const k=j*P.cols+i,cx=i*CELL+CELL/2,cy=j*CELL+CELL/2;
    let t=0;
    if(P.on&&Math.hypot(cx-P.x,cy-P.y)<R*(.55+P.n[k]*.6))t=1;
    if(P.wave>=0&&Math.hypot(cx-P.wx,cy-P.wy)<P.wave)t=1;
    P.d[k]+=(t-P.d[k])*(rm?1:t?.24:.06);
    const v=P.d[k];if(v<.02)continue;active=true;
    bc.globalAlpha=Math.min(1,v*1.3);bc.fillStyle='#0A0A0C';bc.fillRect(i*CELL,j*CELL,CELL,CELL);
    if(v>.15){
      if(!rm&&Math.random()<.05)P.b[k]=P.b[k]===48?49:48;
      const p=k*4,lift=c=>Math.min(255,P.rgb[p+c]*1.3+70)|0;
      bc.globalAlpha=v;bc.fillStyle=`rgb(${lift(0)},${lift(1)},${lift(2)})`;
      bc.fillText(String.fromCharCode(P.b[k]),cx,cy+(1-v)*7);
    }
  }
  bc.globalAlpha=1;
  enter.style.opacity=P.on?1:0;enter.style.transform=`translate(${P.x}px,${P.y}px) translate(-50%,-50%)`;
  if(!active&&!P.on&&P.wave<0)P.dirty=false;
}

/* ---------- Videomapping ---------- */
const stage=$('#stage'),map=$('#map'),mctx=map.getContext('2d'),mRead=$('#mRead');
const goal=[[.28,.22],[.76,.16],[.78,.72],[.26,.66]];
const pts=[[.08,.1],[.56,.05],[.66,.58],[.16,.52]];
let fitted=false;
const hs=pts.map((p,i)=>{const b=document.createElement('button');b.type='button';b.className='h';b.setAttribute('aria-label',T.mapping.corner(i+1));stage.appendChild(b);return b});
function warp(){
  const W=stage.clientWidth,H=stage.clientHeight;if(!W)return;
  const q=pts.map(p=>[p[0]*W,p[1]*H]);
  const[x0,y0]=q[0],[x1,y1]=q[1],[x2,y2]=q[2],[x3,y3]=q[3];
  const dx1=x1-x2,dx2=x3-x2,sx=x0-x1+x2-x3,dy1=y1-y2,dy2=y3-y2,sy=y0-y1+y2-y3;
  const den=dx1*dy2-dx2*dy1||1e-6,g=(sx*dy2-dx2*sy)/den,h=(dx1*sy-sx*dy1)/den;
  const a=x1-x0+g*x1,b=x3-x0+h*x3,d=y1-y0+g*y1,e=y3-y0+h*y3;
  const w=400,hh=300;
  map.style.transform=`matrix3d(${a/w},${d/w},0,${g/w},${b/hh},${e/hh},0,${h/hh},0,0,1,0,${x0},${y0},0,1)`;
  hs.forEach((el,i)=>el.style.transform=`translate(${q[i][0]}px,${q[i][1]}px)`);
  // Cada esquina en su sitio se pone verde por separado: se ve el progreso, no solo el final
  const seated=pts.map((p,i)=>p[0]===goal[i][0]&&p[1]===goal[i][1]);
  hs.forEach((el,i)=>el.classList.toggle('ok',seated[i]));
  const ok=seated.every(Boolean);
  stage.classList.toggle('done',ok);
  if(ok){if(!fitted){fitted=true;track('videomapping-encajado')}mRead.textContent=T.mapping.done}
  else mRead.textContent=T.mapping.left(seated.filter(s=>!s).length);
}
/* Esquinas con imán. Cerca de su sitio (MAG) tiran de la esquina hacia él; muy cerca (SEAT) encaja de golpe
   y no se suelta hasta alejarla un poco más (UNSEAT): se nota el «clic». Al soltar cerca, llega sola con un muelle */
const MAG=.07,SEAT=.03,UNSEAT=.05;
const corners=pts.map(()=>({grab:null,sx:{x:0,v:0},sy:{x:0,v:0},anim:false}));
function placeCorner(i,x,y,kb){
  const g=goal[i],d=Math.hypot(x-g[0],y-g[1]),was=pts[i][0]===g[0]&&pts[i][1]===g[1];
  // Con teclado no hay imán (atraparía la esquina con pasos de 0,01): encaja solo al caer justo en su sitio
  if(d<(kb?.006:was?UNSEAT:SEAT)){pts[i][0]=g[0];pts[i][1]=g[1];return}
  const pull=!kb&&d<MAG?Math.pow(1-d/MAG,2)*.6:0;
  pts[i][0]=clamp(x+(g[0]-x)*pull);pts[i][1]=clamp(y+(g[1]-y)*pull);
}
function stepMapSprings(f){
  let moved=false;
  corners.forEach((c,i)=>{
    if(!c.anim)return;
    springStep(c.sx,goal[i][0],f/60,.25);springStep(c.sy,goal[i][1],f/60,.25);
    pts[i][0]=c.sx.x;pts[i][1]=c.sy.x;moved=true;
    if(Math.hypot(c.sx.x-goal[i][0],c.sy.x-goal[i][1])<.002&&Math.hypot(c.sx.v,c.sy.v)<.01){c.anim=false;pts[i][0]=goal[i][0];pts[i][1]=goal[i][1]}
  });
  if(moved)warp();
}
hs.forEach((b,i)=>{
  const c=corners[i];
  const at=e=>{const r=stage.getBoundingClientRect();return[(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height]};
  b.addEventListener('pointerdown',e=>{
    if(c.grab)return;
    // Se guarda dónde se ha cogido el asa: la esquina no salta al centro del dedo
    const[x,y]=at(e);c.grab={id:e.pointerId,ox:x-pts[i][0],oy:y-pts[i][1]};c.anim=false;
    b.setPointerCapture(e.pointerId);b.classList.add('grab');
  });
  b.addEventListener('pointermove',e=>{
    if(!c.grab||e.pointerId!==c.grab.id)return;
    const[x,y]=at(e);placeCorner(i,x-c.grab.ox,y-c.grab.oy);warp();
  });
  const up=e=>{
    if(!c.grab||e.pointerId!==c.grab.id)return;c.grab=null;b.classList.remove('grab');
    // Suelta cerca de su sitio: termina el camino sola, desde donde está y sin rebote
    const g=goal[i],d=Math.hypot(pts[i][0]-g[0],pts[i][1]-g[1]);
    if(d>0&&d<MAG){if(rm){pts[i][0]=g[0];pts[i][1]=g[1];warp()}else{c.sx={x:pts[i][0],v:0};c.sy={x:pts[i][1],v:0};c.anim=true}}
  };
  b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);
  // Flechas: un paso pequeño; con Mayúsculas, uno grande. El imán también funciona con teclado
  b.addEventListener('keydown',e=>{const k={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!k)return;e.preventDefault();
    const s=e.shiftKey?.05:.01;c.anim=false;placeCorner(i,pts[i][0]+k[0]*s,pts[i][1]+k[1]*s,true);warp()});
});
let mapOn=false;new IntersectionObserver(es=>mapOn=es[0].isIntersecting).observe(stage);
function drawMap(now){
  const t=now*.0006;
  mctx.fillStyle='#10061C';mctx.fillRect(0,0,400,300);
  for(let i=0;i<14;i++){
    const y=((i*34+now*.03)%340)-30,hue=(300+i*14+now*.02)%360;
    mctx.fillStyle=`hsl(${hue} 95% 58%)`;mctx.beginPath();
    mctx.moveTo(0,y);for(let x=0;x<=400;x+=20)mctx.lineTo(x,y+Math.sin(x*.016+t*3+i)*16);
    mctx.lineTo(400,y+12);for(let x=400;x>=0;x-=20)mctx.lineTo(x,y+12+Math.sin(x*.016+t*3+i)*16);
    mctx.fill();
  }
}

/* ---------- Caja de herramientas ---------- */
const TOOL_COLORS=['#2A3FF0','#0A8A5C','#00788C','#7A2BD6','#B81F8A','#D6264F','#B3470F','#C03030','#A8341A','#3A3AD0','#3A3F55','#006B4F','#7A8500','#3D6B00','#5B2BB5','#B3470F'];
const TOOLS=T.tools.map(([name,where,level],i)=>[name,TOOL_COLORS[i],where,level]);
const pit=$('#pit'),chips=[];
function pickTool(i){const t=TOOLS[i];$('#tName').textContent=t[0];$('#tWhere').textContent=t[2];$('#tLevel').textContent=t[3];chips.forEach((c,k)=>c.el.setAttribute('aria-pressed',k===i))}
TOOLS.forEach((t,i)=>{const b=document.createElement('button');b.type='button';b.className='chip';b.textContent=t[0];b.style.setProperty('--f',t[1]);b.onclick=()=>{track('herramienta',{nombre:ES.tools[i][0]});pickTool(i)};pit.appendChild(b);chips.push({el:b})});
pickTool(0);
let pitOn=false,pitBuilt=false,pW=0,pH=0;
function startPit(){
  if(pitBuilt||rm)return;pitBuilt=true;
  chips.forEach(c=>{c.w=c.el.offsetWidth;c.h=c.el.offsetHeight});
  pit.classList.add('phys');pW=pit.clientWidth;pH=pit.clientHeight;
  chips.forEach((c,i)=>{
    c.x=rand(c.w/2+4,Math.max(c.w/2+5,pW-c.w/2-4));c.y=-40-i*52;c.vx=rand(-1,1);c.vy=0;c.rot=0;c.hold=null;
    const at=e=>{const r=pit.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};
    c.el.addEventListener('pointerdown',e=>{c.el.setPointerCapture(e.pointerId);c.hold=at(e)});
    c.el.addEventListener('pointermove',e=>{if(c.hold)c.hold=at(e)});
    const up=()=>c.hold=null;
    c.el.addEventListener('pointerup',up);c.el.addEventListener('pointercancel',up);
  });
}
/* Física de ladrillos: gravedad, choques y agarre con muelle */
function stepPit(){
  if(!pitBuilt||!pitOn)return;
  for(const c of chips){
    if(c.hold){c.vx+=(c.hold.x-c.x)*.16;c.vy+=(c.hold.y-c.y)*.16;c.vx*=.72;c.vy*=.72}
    else{c.vy+=.55;c.vx*=.992}
    c.vx=clamp(c.vx,-34,34);c.vy=clamp(c.vy,-34,34);
    c.x+=c.vx;c.y+=c.vy;
  }
  for(let it=0;it<5;it++){
    for(let i=0;i<chips.length;i++)for(let j=i+1;j<chips.length;j++){
      const a=chips[i],b=chips[j];
      const ox=(a.w+b.w)/2-Math.abs(a.x-b.x),oy=(a.h+b.h)/2-Math.abs(a.y-b.y);
      if(ox<=0||oy<=0)continue;
      const ma=a.hold?0:1,mb=b.hold?0:1,sum=ma+mb||1;
      if(oy<ox){
        const s=a.y<b.y?-1:1;a.y+=s*oy*ma/sum;b.y-=s*oy*mb/sum;
        const v=(a.vy*ma+b.vy*mb)/sum;
        if(ma)a.vy=v-(a.vy-v)*.12;if(mb)b.vy=v-(b.vy-v)*.12;
        const f=(a.vx-b.vx)*.09;a.vx-=f;b.vx+=f;
      }else{
        const s=a.x<b.x?-1:1;a.x+=s*ox*ma/sum;b.x-=s*ox*mb/sum;
        const v=(a.vx*ma+b.vx*mb)/sum;
        if(ma)a.vx=v-(a.vx-v)*.2;if(mb)b.vx=v-(b.vx-v)*.2;
      }
    }
    for(const c of chips){
      if(c.y>pH-c.h/2){c.y=pH-c.h/2;c.vy*=c.vy>3?-.28:0;c.vx*=.86}
      if(c.x<c.w/2){c.x=c.w/2;c.vx=Math.abs(c.vx)*.4}
      if(c.x>pW-c.w/2){c.x=pW-c.w/2;c.vx=-Math.abs(c.vx)*.4}
    }
  }
  for(const c of chips){
    const goal=clamp(c.vx*1.6,-16,16);c.rot+=(goal-c.rot)*.14;
    c.el.style.transform=`translate(${c.x-c.w/2}px,${c.y-c.h/2}px) rotate(${c.rot}deg)`;
  }
}
new IntersectionObserver(es=>{pitOn=es[0].isIntersecting;if(pitOn)startPit()},{threshold:.15}).observe(pit);
// El tamaño de la caja se lee solo cuando cambia, no en cada frame
new ResizeObserver(()=>{if(pitBuilt){pW=pit.clientWidth;pH=pit.clientHeight}}).observe(pit);
$('#dump').onclick=()=>{
  track('caja-volcada');
  if(!pitBuilt)return;
  chips.forEach(c=>{c.vx=rand(-12,12);c.vy=rand(-30,-14)});
};

/* ---------- Contacto ---------- */
const copy=$('#copy');
copy.onclick=()=>{
  track('email-copiado');
  const mail=$('#mail').textContent;
  const ok=()=>{copy.textContent=T.copy.done;setTimeout(()=>copy.textContent=T.copy.idle,1800)};
  const fallback=()=>{const s=getSelection(),r=document.createRange();r.selectNodeContents($('#mail'));s.removeAllRanges();s.addRange(r);copy.textContent=T.copy.selected};
  if(navigator.clipboard)navigator.clipboard.writeText(mail).then(ok,fallback);else fallback();
};
$('#linkedin').addEventListener('click',()=>track('linkedin'));
$('#cv').addEventListener('click',()=>track('cv-descargado',{idioma:LANG}));
$$('[data-lang]').forEach(a=>a.addEventListener('click',()=>track('idioma',{a:a.dataset.lang})));
const seenContact=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){track('scroll-contacto');seenContact.disconnect()}},{threshold:.2});
seenContact.observe($('#contacto'));

/* ---------- Plumbing común de órdenes ---------- */
const strip=t=>t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim();
let order=null,orderT=0,strike=false,lastAct=performance.now(),paint=null;
function setOrder(o,ms=9000){order=o;clearTimeout(orderT);if(o&&ms)orderT=setTimeout(()=>{order=null;updateTeam()},ms);updateTeam()}
function repaint(){tone='';applyTone()}
function fling(L){
  if(L.mode!=='rest'&&L.mode!=='loose')return;
  L.vx=rand(-26,26);L.vy=rand(-22,22);L.vr=rand(-12,12);L.mode='loose';
  setTimeout(()=>{if(L.mode!=='loose')return;
    const nx=L.cx+L.x,ny=L.cy+L.y;
    fetchLetter(L,freeCursors().sort((a,b)=>Math.hypot(a.x-nx,a.y-ny)-Math.hypot(b.x-nx,b.y-ny)).slice(0,2))},750);
}
async function atHero(){if(scrollY>vh*.2){scrollTo({top:0,behavior:rm?'auto':'smooth'});await pause(900)}}

/* ---------- Jefe de obra ---------- */
const boss=$('#boss'),bossIn=$('#bossIn'),bossReply=$('#bossReply'),bBoss=$('#bBoss');
const PAINT={red:['#1E0708','#FF4D4D'],blue:['#080D24','#6C8BFF'],green:['#07170E','#3DDC84'],pink:['#1C0713','#FF5FB0'],yellow:['#161204','#FFD60A'],orange:['#1B0D04','#FF9234'],purple:['#110822','#B47CFF'],black:['#050506','#F0F0F0']};
const PLACES={projects:'#proyectos',contact:'#contacto',tools:'#herramientas',home:'#inicio',zalapp:'#zRead',nautes:'#nPanel',alcar:'#portal',mapping:'#stage',formacion:'#open',sellos:'#open'};
function command(raw){
  const B=T.boss,t=strip(raw);if(!t)return B.empty;
  let m;
  if((m=t.match(B.reLetter))){
    const i='alonso'.indexOf(m[1]);const list=letters.filter((L,k)=>'alonso'[k]===m[1]);
    atHero().then(()=>list.forEach(fling));return i<0?B.notOurs:B.letter(m[1].toUpperCase())}
  if(B.reBreak.test(t)){atHero().then(()=>letters.forEach(fling));return B.broken}
  if(B.reReset.test(t)){paint=null;repaint();return B.reset}
  for(const[id,re,name] of B.colors)if(re.test(t)){paint=PAINT[id];repaint();return B.painted(name)}
  if(B.rePaint.test(t))return B.noColor;
  for(const[id,re,name] of B.places)if(re.test(t)){
    // La escena es alta: se baja hasta donde los dos sellos ya están puestos
    if(PLACES[id]==='#open')goScene(.9);else $(PLACES[id]).scrollIntoView({behavior:rm?'auto':'smooth',block:'center'});
    return B.goTo(name)}
  if(B.reDance.test(t)){setOrder('dance');return B.dance}
  if(B.reFollow.test(t)){setOrder('follow');return B.follow}
  if(B.reCircle.test(t)){setOrder('circle');return B.circle}
  if(B.reLeave.test(t)){setOrder('leave',6000);return B.leave}
  if(B.reStrike.test(t)){closeBoss();startStrike();return''}
  if(B.reWork.test(t)){setOrder(null);endStrike();return B.work}
  return B.unknown;
}
T.boss.chips.forEach(t=>{
  const b=document.createElement('button');b.type='button';b.className='pill';b.textContent=t;
  b.onclick=()=>giveOrder(t);$('#bossChips').appendChild(b)});
function giveOrder(raw){const t=strip(raw);if(t)track('jefe-orden',{orden:t.slice(0,40)});bossReply.textContent=command(raw)}
function openBoss(){track('jefe-abierto');closeNote();setAudit(false);boss.hidden=false;bBoss.setAttribute('aria-pressed',true);bossReply.textContent='';if(fine)bossIn.focus()}
// Al cerrar un panel con el foco dentro, el foco vuelve al botón que lo abrió (si no, se pierde en <body>)
function closeBoss(){const had=boss.contains(document.activeElement);boss.hidden=true;bBoss.setAttribute('aria-pressed',false);if(had)bBoss.focus()}
bBoss.onclick=()=>boss.hidden?openBoss():closeBoss();
boss.addEventListener('submit',e=>{e.preventDefault();giveOrder(bossIn.value);bossIn.value=''});
addEventListener('keydown',e=>{
  const typing=/INPUT|TEXTAREA/.test(document.activeElement?.tagName||'');
  if(e.key==='Escape'){closeBoss();closeNote();setAudit(false);closeStamps()}
  if(e.key==='/'&&!typing&&introDone){e.preventDefault();openBoss()}
});

/* ---------- Huelga ---------- */
const QUEJAS=T.strike.complaints;
let banner=null,speech=null,speechC=null,quejaT=0;
function startStrike(){
  if(strike||rm||!cursors.length)return;strike=true;order=null;
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
const NOTE_TARGETS=['#word','.tag','#hint','.top ul','#open','#stamps','#zRead','.gauge','#portal','#stage','#tool','#mail'];
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
    el.style.scrollMarginTop='76px';el.scrollIntoView({behavior:rm?'auto':'smooth',block:small()?'start':'center'})}
}
function closeNote(){const had=note.contains(document.activeElement);note.hidden=true;if(had)bAudit.focus()}
function setAudit(on){auditOn=on;bAudit.setAttribute('aria-pressed',on);pinEls.forEach(p=>p.hidden=!on);if(!on)closeNote()}
bAudit.onclick=()=>{if(auditOn){setAudit(false);return}track('auditar-abierto');closeBoss();setAudit(true);showNote(0,true)};
$('#nPrev').onclick=()=>showNote(noteI-1,true);$('#nNext').onclick=()=>showNote(noteI+1,true);$('#nClose').onclick=()=>setAudit(false);
function stepPins(){
  if(!auditOn)return;
  // Primero todas las lecturas, luego todas las escrituras: intercalarlas recalculaba la maqueta doce veces por frame
  const reads=NOTES.map(n=>{const el=noteEls.get(n[0])||noteEls.set(n[0],$(n[0])).get(n[0]);const r=el.getBoundingClientRect();return{r,vis:r.bottom>40&&r.top<vh&&getComputedStyle(el).opacity!=='0'}});
  reads.forEach(({r,vis},i)=>{const b=pinEls[i];
    b.style.display=vis?'':'none';if(vis)b.style.transform=`translate(${clamp(r.left+Math.min(r.width,vw)*.02,16,vw-16)}px,${clamp(r.top,52,vh-20)}px)`});
}

/* El muro de firmas llegará en una segunda fase */
const signs=[];

/* ---------- Bucle ---------- */
const you=$('#you');
addEventListener('pointermove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;
  if(fine&&introDone){you.style.opacity=1;you.style.transform=`translate(${e.clientX+15}px,${e.clientY+20}px)`}},{passive:true});
document.addEventListener('pointerleave',()=>{mouse.x=mouse.y=-999;you.style.opacity=0});
let last=performance.now();
// Lista fija de pasos: no se crean funciones nuevas en cada frame (menos trabajo para el recolector)
const STEPS=[(f,now)=>stepScene(now),f=>stepLetters(f),stepCursors,stepDust,stepPit,stepPortal,(f,now)=>stepStrike(now),stepPins,(f,now)=>{if(mapOn){stepMapSprings(f);drawMap(now)}}];
let scrolled=false;
function loop(now){
  const f=clamp((now-last)/16.67,.2,2.4);last=now;
  requestAnimationFrame(loop);
  // scrollY se lee una vez, al principio del frame y antes de escribir nada
  SY=scrollY;
  if(scrolled){scrolled=false;try{applyTone();updateTeam()}catch(e){console.error(e)}}
  for(let i=0;i<STEPS.length;i++){try{STEPS[i](f,now)}catch(e){console.error(e)}}
}
function placeStops(){measureScene();measureTones();for(const st of stops)stopRange(st)}
/* Si la tipografía u otra cosa cambia la altura, recalcula dónde aparece cada forma */
new ResizeObserver(placeStops).observe($('main'));
let rto;
function relayout(){
  // En móvil, la barra del navegador cambia el alto mientras se hace scroll. El lienzo se ajusta
  // al momento (es barato); el recálculo de formas espera a que el scroll se pare para no dar un tirón
  if(performance.now()-scrollT<250){rto=setTimeout(relayout,200);return}
  layout();warp();sizePortal();
}
addEventListener('resize',()=>{
  clearTimeout(rto);
  if(innerWidth===vw){sizeCanvas();placeStops();rto=setTimeout(relayout,300)}
  else rto=setTimeout(relayout,150);
});
// El scroll solo apunta que ha pasado; el tono y el equipo se actualizan en el siguiente frame
addEventListener('scroll',()=>{scrollT=performance.now();scrolled=true},{passive:true});

async function boot(){
  for(let i=0;i<60&&(!innerWidth||!innerHeight);i++)await pause(100);
  vw=innerWidth;vh=innerHeight;
  try{await Promise.race([Promise.all([document.fonts.load('900 100px "Big Shoulders Display"'),document.fonts.load('600 11px "Martian Mono"'),pointsLoad]),pause(1400)])}catch(e){}
  // Si algo falla o el visor frena la animación, la web se abre igualmente
  const guard=setTimeout(rescue,11000);
  try{
    makeCursors();layout();warp();sizePortal();bindLetters();updateTeam();
    for(let n=0;n<N;n++){px[n]=stops[0].t[n*2];py[n]=stops[0].t[n*2+1]}
    requestAnimationFrame(loop);
  }catch(e){console.error(e);clearTimeout(guard);rescue();return}
  // Google Fonts puede llegar tarde: recoloca si cambia la medida
  document.fonts.ready.then(()=>{layout();warp();sizePortal()});
  // Si las imágenes en puntos llegan tarde, se recalculan las dianas; si no llegan, se queda la forma de reserva
  pointsLoad.then(()=>{if(stops.some(st=>st.data&&!st.z))layout()});
  if(rm){introDone=true;skipped=true;$('#loader').remove();$('#skip').remove();return}
  surEl.textContent='';
  $('#skip').onclick=()=>{track('intro-saltada');finish()};
  addEventListener('wheel',finish,{passive:true});addEventListener('touchmove',finish,{passive:true});addEventListener('keydown',finish);
  await intro();clearTimeout(guard);
}
boot().catch(e=>{console.error(e);rescue()});
})();
