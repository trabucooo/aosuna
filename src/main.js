import './fonts.js';
import './style.css';
import { T, ES, LANG } from './i18n.js';
import alcarShot from './assets/alcar.webp';

(()=>{
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)), rand=(a,b)=>a+Math.random()*(b-a);
const smooth=t=>t*t*(3-2*t);
const root=document.documentElement;
const rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
const small=()=>innerWidth<=860;
let vw=innerWidth,vh=innerHeight;

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
let tone='';
function applyTone(){
  const mid=vh*.5;
  let hit=toneEls[0];
  for(const el of toneEls){const r=el.getBoundingClientRect();if(r.top<=mid&&r.bottom>mid){hit=el;break}}
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
const letters=$$('.l').map(el=>({el,x:0,y:0,r:0,vx:0,vy:0,vr:0,mode:'rest',cx:0,cy:0,w:0,h:0,box:null,done:null}));
function fitName(){
  letters.forEach(L=>L.el.style.transform='');
  const avail=Math.max(0,nameEl.parentElement.clientWidth-parseFloat(getComputedStyle(nameEl.parentElement).paddingLeft)-parseFloat(getComputedStyle(nameEl.parentElement).paddingRight));
  nameEl.style.fontSize='100px';
  const w=word.scrollWidth||1;
  const maxH=vh*(small()?.3:.42);
  const fs=Math.min(avail/w*100*.98,maxH/.84);
  nameEl.style.fontSize=fs+'px';
  letters.forEach(L=>{const r=L.el.getBoundingClientRect();L.cx=r.left+r.width/2;L.cy=r.top+r.height/2;L.w=r.width;L.h=r.height;L.box={left:r.left,top:r.top,width:r.width,height:r.height}});
  surEl.style.fontSize='';
}
function paintLetter(L){L.el.style.transform=(L.x||L.y||L.r)?`translate(${L.x}px,${L.y}px) rotate(${L.r}deg)`:''}

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
  if(small()){c.tx=rand(.04,.7)*vw;c.ty=(band<.4?rand(.08,.13):rand(.9,.96))*vh}
  else if(band<.34){c.tx=rand(.04,.9)*vw;c.ty=rand(.08,.16)*vh}
  else if(band<.68){c.tx=rand(.04,.86)*vw;c.ty=rand(.9,.97)*vh}
  else{c.tx=(Math.random()<.5?rand(.01,.09):rand(.84,.93))*vw;c.ty=rand(.15,.85)*vh}
  c.next=performance.now()+rand(1400,4200);
}
function freeCursors(){return cursors.filter(c=>!c.job&&!c.script&&!c.follow)}
function fetchLetter(L,list){
  L.mode='wait';
  const offs=[[-.3,-.1],[.3,.25]];
  list.forEach((c,i)=>{c.job={L,ox:offs[i%2][0]*L.w,oy:offs[i%2][1]*L.h}});
  if(!list.length)L.mode='carry';
  return new Promise(r=>L.done=r);
}
function stepLetters(f){
  for(const L of letters){
    if(L.mode==='loose'){
      L.x+=L.vx*f;L.y+=L.vy*f;L.r+=L.vr*f;L.vx*=.93;L.vy*=.93;L.vr*=.93;
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
  for(const c of cursors){
    if(c.job){
      const L=c.job.L;c.tx=L.cx+L.x+c.job.ox;c.ty=L.cy+L.y+c.job.oy;
      if(L.mode==='wait'&&Math.hypot(c.tx-c.x,c.ty-c.y)<34)L.mode='carry';
    }else if(orderTarget(c,cursors.indexOf(c),cursors.length,now)){
      c.box.classList.remove('on');
    }else if(c.follow){
      c.box.classList.add('on');
      const r=c.follow.getBoundingClientRect();
      const pad=8,x=r.left-pad,y=r.top-pad,w=Math.min(r.width+pad*2,vw-x-6),h=r.height+pad*2;
      c.tx=x+w-6;c.ty=y+h-6;
      c.box.style.transform=`translate(${x}px,${y}px)`;c.box.style.width=w+'px';c.box.style.height=h+'px';
    }else if(!c.script){
      if(gather){const i=cursors.indexOf(c),a=i/cursors.length*6.283+now*.00018;
        if(small()){c.tx=(i/cursors.length)*vw*.8+6;c.ty=vh*.95+Math.sin(a*3)*10}
        else{c.tx=vw*.82+Math.cos(a)*vw*.1;c.ty=vh*.34+Math.sin(a)*vh*.2}}
      else if(now>c.next)wanderTarget(c);
    }
    c.vx+=(c.tx-c.x)*c.k*f;c.vy+=(c.ty-c.y)*c.k*f;
    const d=Math.pow(.74,f);c.vx*=d;c.vy*=d;c.x+=c.vx*f;c.y+=c.vy*f;
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
    let px=0,py=0,lt=0,drag=false;
    L.el.addEventListener('pointerdown',e=>{
      if(root.classList.contains('intro'))return;
      drag=true;L.mode='drag';cursors.forEach(c=>{if(c.job&&c.job.L===L)c.job=null});
      L.el.setPointerCapture(e.pointerId);px=e.clientX;py=e.clientY;lt=performance.now();L.vx=L.vy=0;L.done=null;
    });
    L.el.addEventListener('pointermove',e=>{
      if(!drag)return;
      const dx=e.clientX-px,dy=e.clientY-py,t=performance.now(),dt=Math.max(8,t-lt);
      L.x+=dx;L.y+=dy;L.r=clamp(L.r+dx*.12,-34,34);L.vx=dx/dt*16;L.vy=dy/dt*16;L.vr=dx*.05;
      px=e.clientX;py=e.clientY;lt=t;
    });
    const up=()=>{
      if(!drag)return;drag=false;
      if(Math.abs(L.x)+Math.abs(L.y)<3){L.x=L.y=L.r=0;L.mode='rest';return}
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
const N=matchMedia('(max-width:860px)').matches?1100:2600;
const px=new Float32Array(N),py=new Float32Array(N),pvx=new Float32Array(N),pvy=new Float32Array(N),ez=new Float32Array(N),ps=new Float32Array(N);
for(let i=0;i<N;i++){px[i]=rand(0,vw);py[i]=rand(0,vh);ez[i]=rand(.045,.12);ps[i]=rand(1.7,3.3)}
let dustNow=[125,139,255],dustTarget=[125,139,255],inkRgb=[238,240,244],layer=T.layerHome;
const aura=$('#aura');
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
  for(let i=0;i<N;i++){const k=Math.floor(Math.random()*n)*2;t[i*2]=x0+(pts[k]+Math.random()*2)*sx;t[i*2+1]=y0+(pts[k+1]+Math.random()*2)*sy}
  return t;
}
function heroPts(){
  const fs=parseFloat(getComputedStyle(nameEl).fontSize);
  return sample(vw>>1,vh>>1,(c)=>{c.font=`900 ${fs/2}px ${getComputedStyle(nameEl).fontFamily}`;c.textAlign='center';c.textBaseline='middle';
    letters.forEach((L,i)=>c.fillText('ALONSO'[i],L.cx/2,L.cy/2))});
}
const stops=$$('[data-shape]').map(el=>({el,shape:el.dataset.shape,alpha:+el.dataset.alpha,s:0,t:null}));
function layout(){
  vw=innerWidth;vh=innerHeight;
  const d=Math.min(devicePixelRatio||1,1.6);cv.width=vw*d;cv.height=vh*d;ctx.setTransform(d,0,0,d,0,0);
  fitName();
  const sm=small();
  for(const st of stops){
    const r=st.el.getBoundingClientRect();
    st.s=st.shape==='hero'?vh*.32:r.top+scrollY+r.height/2-vh/2;
    if(st.shape==='hero'){st.t=toTargets(heroPts(),0,0,2,2);continue}
    if(FULL[st.shape]){st.t=toTargets(sample(320,180,SHAPES[st.shape]),0,0,vw/320,vh/180);continue}
    const size=sm?Math.min(vw*.74,vh*.38):Math.min(vw*.4,vh*.62);
    const x0=sm?(vw-size)/2:vw*.72-size/2,y0=sm?vh*.1:(vh-size)/2;
    st.t=toTargets(sample(240,240,SHAPES[st.shape]),x0,y0,size/240,size/240);
  }
  applyTone();
}
const mouse={x:-999,y:-999,hit:0};
let hp=0;
/* Fondo: plano de obra con rejilla, rastro de los cursores y mira con coordenadas */
function drawField(now){
  const[r,g,b]=inkRgb,step=72,off=-(scrollY*.35)%step;
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
    ctx.strokeStyle=c.col;ctx.globalAlpha=scrollY>vh*.3?.2:.42;ctx.beginPath();ctx.moveTo(t[0],t[1]);
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
    ctx.fillText(`x ${Math.round(mouse.x)}  y ${Math.round(mouse.y+scrollY)}  ${T.layerLabel}: ${layer}`,vw-14,vh-14);
    aura.style.setProperty('--ax',(mouse.x/vw*100)+'%');aura.style.setProperty('--ay',(mouse.y/vh*100)+'%');
  }
}
function stepDust(f,now){
  const y=scrollY;
  hp=clamp(y/(vh*.3));
  const fade=1-smooth(clamp(y/(vh*.42)));
  if(!root.classList.contains('intro')){
    nameEl.style.opacity=fade;$$('.stick .reveal').forEach(e=>e.style.opacity=fade);
  }
  crew.style.opacity=1;
  let i=0;while(i<stops.length-2&&y>=stops[i+1].s)i++;
  const a=stops[i],b=stops[i+1];
  const raw=clamp((y-a.s)/Math.max(1,b.s-a.s));
  const t=smooth(clamp((raw-.22)/.56));
  let al=(a.alpha+(b.alpha-a.alpha)*t);
  if(i===0)al*=clamp(hp*1.6);
  const wa=a.shape==='wave'?1-t:b.shape==='wave'?t:0;
  const ta=a.t,tb=b.t;
  const mr=small()?70:110,mr2=mr*mr;
  for(let n=0;n<N;n++){
    const k=n*2;
    let gx=ta[k]+(tb[k]-ta[k])*t,gy=ta[k+1]+(tb[k+1]-ta[k+1])*t;
    if(wa)gy+=Math.sin(gx*.012+now*.0016)*16*wa;
    if(rm){px[n]=gx;py[n]=gy;continue}
    const e=ez[n]*f;
    pvx[n]+=(gx-px[n])*e*.55;pvy[n]+=(gy-py[n])*e*.55;
    const dx=px[n]-mouse.x,dy=py[n]-mouse.y,d2=dx*dx+dy*dy;
    if(d2<mr2&&d2>1){const q=(1-d2/mr2)*3.2/Math.sqrt(d2);pvx[n]+=dx*q*f;pvy[n]+=dy*q*f}
    const dm=Math.pow(.8,f);pvx[n]*=dm;pvy[n]*=dm;px[n]+=pvx[n]*f;py[n]+=pvy[n]*f;
  }
  for(let c=0;c<3;c++)dustNow[c]+=(dustTarget[c]-dustNow[c])*.06;
  ctx.clearRect(0,0,vw,vh);
  try{drawField(now)}catch(e){console.error(e)}
  if(al<.01)return;
  ctx.globalAlpha=al;
  const lift=c=>Math.min(255,dustNow[c]*.72+90)|0;
  ctx.fillStyle=`rgb(${lift(0)},${lift(1)},${lift(2)})`;
  for(let n=0;n<N;n++)ctx.fillRect(px[n],py[n],ps[n],ps[n]);
  ctx.globalAlpha=1;
}

/* ---------- El equipo acompaña el scroll ---------- */
function updateTeam(){
  const heroOut=scrollY>vh*.42;
  const con=$('#contacto').getBoundingClientRect();
  gather=con.top<vh*.45&&con.bottom>0;
  cursors.forEach((c,i)=>{
    const guide=i<3;
    c.el.classList.toggle('off',introDone&&heroOut&&!gather&&!strike&&!order&&!(guide&&(c.follow||!small())));
  });
}
const selObs=new IntersectionObserver(es=>{
  es.forEach(e=>{
    if(e.target.id==='mail')return;
    const free=cursors.slice(0,3).find(c=>!c.follow);
    const cur=cursors.slice(0,3).find(c=>c.follow===e.target);
    if(e.isIntersecting&&free&&!cur&&introDone){free.follow=e.target;free.job=null;free.box.classList.add('on')}
    if(!e.isIntersecting&&cur){cur.follow=null;cur.box.classList.remove('on');cur.tx=rand(.2,.8)*vw;cur.ty=rand(.8,.95)*vh;cur.next=performance.now()+1200}
  });
},{rootMargin:'-18% 0px -22% 0px'});
$$('[data-sel]').forEach(e=>selObs.observe(e));

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
  const off=Math.max(...pts.map((p,i)=>Math.hypot(p[0]-goal[i][0],p[1]-goal[i][1])));
  const ok=off<.035;
  stage.classList.toggle('done',ok);
  if(ok){pts.forEach((p,i)=>{p[0]=goal[i][0];p[1]=goal[i][1]});if(!fitted){fitted=true;track('videomapping-encajado')}mRead.textContent=T.mapping.done}
  else{const left=pts.filter((p,i)=>Math.hypot(p[0]-goal[i][0],p[1]-goal[i][1])>=.035).length;mRead.textContent=T.mapping.left(left)}
}
hs.forEach((b,i)=>{
  let on=false;
  b.addEventListener('pointerdown',e=>{on=true;b.setPointerCapture(e.pointerId)});
  b.addEventListener('pointermove',e=>{if(!on)return;const r=stage.getBoundingClientRect();pts[i][0]=clamp((e.clientX-r.left)/r.width);pts[i][1]=clamp((e.clientY-r.top)/r.height);warp()});
  const up=()=>on=false;b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);
  b.addEventListener('keydown',e=>{const k={ArrowLeft:[-.01,0],ArrowRight:[.01,0],ArrowUp:[0,-.01],ArrowDown:[0,.01]}[e.key];if(!k)return;e.preventDefault();pts[i][0]=clamp(pts[i][0]+k[0]);pts[i][1]=clamp(pts[i][1]+k[1]);warp()});
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
  pW=pit.clientWidth;pH=pit.clientHeight;
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
const PLACES={projects:'#proyectos',contact:'#contacto',tools:'#herramientas',home:'#inicio',zalapp:'#zRead',nautes:'#nPanel',alcar:'#portal',mapping:'#stage'};
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
  for(const[id,re,name] of B.places)if(re.test(t)){$(PLACES[id]).scrollIntoView({behavior:rm?'auto':'smooth',block:'center'});return B.goTo(name)}
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
function closeBoss(){boss.hidden=true;bBoss.setAttribute('aria-pressed',false)}
bBoss.onclick=()=>boss.hidden?openBoss():closeBoss();
boss.addEventListener('submit',e=>{e.preventDefault();giveOrder(bossIn.value);bossIn.value=''});
addEventListener('keydown',e=>{
  const typing=/INPUT|TEXTAREA/.test(document.activeElement?.tagName||'');
  if(e.key==='Escape'){closeBoss();closeNote();setAudit(false)}
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
    const c0=cursors[0];banner.style.transform=`translate(${clamp(c0.x-banner.offsetWidth/2,8,vw-banner.offsetWidth-8)}px,${c0.y-58}px)`;
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
const NOTE_TARGETS=['#word','.tag','#hint','.top ul','#open','#zRead','.gauge','#portal','#stage','#tool','#mail'];
const NOTES=T.notes.map(([title,text],i)=>[NOTE_TARGETS[i],title,text]);
const pinsEl=$('#pins'),note=$('#note'),bAudit=$('#bAudit');
let auditOn=false,noteI=0;
const pinEls=NOTES.map((n,i)=>{const b=document.createElement('button');b.type='button';b.className='pin';b.textContent=i+1;b.hidden=true;b.setAttribute('aria-label',T.notePin(i+1,n[1]));b.onclick=()=>showNote(i);pinsEl.appendChild(b);return b});
function showNote(i,go){
  noteI=(i+NOTES.length)%NOTES.length;const n=NOTES[noteI];
  $('#nNum').textContent=T.noteCount(noteI+1,NOTES.length);$('#nTitle').textContent=n[1];$('#nText').textContent=n[2];note.hidden=false;
  pinEls.forEach((p,k)=>p.classList.toggle('on',k===noteI));
  track('auditar-nota',{nota:noteI+1});
  if(go){const el=$(n[0]);el.style.scrollMarginTop='76px';el.scrollIntoView({behavior:rm?'auto':'smooth',block:small()?'start':'center'})}
}
function closeNote(){note.hidden=true}
function setAudit(on){auditOn=on;bAudit.setAttribute('aria-pressed',on);pinEls.forEach(p=>p.hidden=!on);if(!on)closeNote()}
bAudit.onclick=()=>{if(auditOn){setAudit(false);return}track('auditar-abierto');closeBoss();setAudit(true);showNote(0,true)};
$('#nPrev').onclick=()=>showNote(noteI-1,true);$('#nNext').onclick=()=>showNote(noteI+1,true);$('#nClose').onclick=()=>setAudit(false);
function stepPins(){
  if(!auditOn)return;
  NOTES.forEach((n,i)=>{const r=$(n[0]).getBoundingClientRect(),b=pinEls[i];const vis=r.bottom>40&&r.top<vh&&getComputedStyle($(n[0])).opacity!=='0';
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
function loop(now){
  const f=clamp((now-last)/16.67,.2,2.4);last=now;
  requestAnimationFrame(loop);
  for(const step of [()=>stepLetters(f),()=>stepCursors(f,now),()=>stepDust(f,now),stepPit,stepPortal,()=>stepStrike(now),stepPins,()=>{if(mapOn)drawMap(now)}]){try{step()}catch(e){console.error(e)}}
}
function placeStops(){
  for(const st of stops){if(st.shape==='hero')continue;const r=st.el.getBoundingClientRect();st.s=r.top+scrollY+r.height/2-vh/2}
}
/* Si la tipografía u otra cosa cambia la altura, recalcula dónde aparece cada forma */
new ResizeObserver(placeStops).observe($('main'));
let rto;
addEventListener('resize',()=>{clearTimeout(rto);rto=setTimeout(()=>{layout();warp();sizePortal()},150)});
addEventListener('scroll',()=>{applyTone();updateTeam()},{passive:true});

async function boot(){
  for(let i=0;i<60&&(!innerWidth||!innerHeight);i++)await pause(100);
  vw=innerWidth;vh=innerHeight;
  try{await Promise.race([Promise.all([document.fonts.load('900 100px "Big Shoulders Display"'),document.fonts.load('600 11px "Martian Mono"')]),pause(1400)])}catch(e){}
  // Si algo falla o el visor frena la animación, la web se abre igualmente
  const guard=setTimeout(rescue,11000);
  try{
    makeCursors();layout();warp();sizePortal();bindLetters();updateTeam();
    for(let n=0;n<N;n++){px[n]=stops[0].t[n*2];py[n]=stops[0].t[n*2+1]}
    requestAnimationFrame(loop);
  }catch(e){console.error(e);clearTimeout(guard);rescue();return}
  // Google Fonts puede llegar tarde: recoloca si cambia la medida
  document.fonts.ready.then(()=>{layout();warp();sizePortal()});
  if(rm){introDone=true;skipped=true;$('#loader').remove();$('#skip').remove();return}
  surEl.textContent='';
  $('#skip').onclick=()=>{track('intro-saltada');finish()};
  addEventListener('wheel',finish,{passive:true});addEventListener('touchmove',finish,{passive:true});addEventListener('keydown',finish);
  await intro();clearTimeout(guard);
}
boot().catch(e=>{console.error(e);rescue()});
})();
