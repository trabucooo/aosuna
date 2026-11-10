/* Videomapping: las cuatro esquinas que se arrastran (o se llevan de un toque, o con las flechas) hasta que la luz
   encaja en el escaparate. No va en la carga inicial: main.js lo pide con import() cuando el escaparate se acerca
   a la pantalla, o con la primera tecla Tab (las asas son botones y tienen que estar en el orden del foco).
   isRm() dice si «reducir movimiento» está activo; keep() pide otro frame al bucle de main.js; wake() lo despierta */
export function createMapping({$,clamp,springStep,isRm,track,T,wake,keep}){
  const stage=$('#stage'),map=$('#map'),mctx=map.getContext('2d'),mRead=$('#mRead');
  // Navegadores sin overflow:clip (style.css): si algo desplaza el escaparate, vuelve a su sitio
  stage.addEventListener('scroll',()=>{stage.scrollTop=stage.scrollLeft=0});
  const goal=[[.28,.22],[.76,.16],[.78,.72],[.26,.66]];
  const pts=[[.08,.1],[.56,.05],[.66,.58],[.16,.52]];
  let fitted=false;
  const hs=pts.map((p,i)=>{const b=document.createElement('button');b.type='button';b.className='h';b.setAttribute('aria-label',T.mapping.corner(i+1));b.setAttribute('aria-pressed','false');stage.appendChild(b);return b});
  function warp(){
    const W=stage.clientWidth,H=stage.clientHeight;if(!W)return;
    const q=pts.map(p=>[p[0]*W,p[1]*H]);
    const[x0,y0]=q[0],[x1,y1]=q[1],[x2,y2]=q[2],[x3,y3]=q[3];
    const dx1=x1-x2,dx2=x3-x2,sx=x0-x1+x2-x3,dy1=y1-y2,dy2=y3-y2,sy=y0-y1+y2-y3;
    const den=dx1*dy2-dx2*dy1||1e-6,g=(sx*dy2-dx2*sy)/den,h=(dx1*sy-sx*dy1)/den;
    const a=x1-x0+g*x1,b=x3-x0+h*x3,d=y1-y0+g*y1,e=y3-y0+h*y3;
    const w=400,hh=300;
    map.style.transform=`matrix3d(${a/w},${d/w},0,${g/w},${b/hh},${e/hh},0,${h/hh},0,0,1,0,${x0},${y0},0,1)`;
    // Con la propiedad translate y no con transform: el scale del asa al cogerla (style.css, .h.grab) se aplica por
    // encima de transform, y escalaba también la posición desde la esquina del escaparate: el asa saltaba lejos del dedo
    hs.forEach((el,i)=>el.style.translate=`${q[i][0]}px ${q[i][1]}px`);
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
    if(moved){warp();keep()}
  }
  /* Toques sueltos (A-03, WCAG 2.5.7): tocar un asa la selecciona (aria-pressed) y el siguiente toque dentro del
     escaparate la lleva a ese punto, con el imán de placeCorner. Arrastrar y las flechas siguen igual */
  let mapSel=-1;
  function mapSelect(i){mapSel=i;hs.forEach((h,k)=>h.setAttribute('aria-pressed',k===i))}
  // Al soltar (o al llevarla de un toque) cerca de su sitio, termina el camino sola, desde donde está y sin rebote
  function settleCorner(i){
    const c=corners[i],g=goal[i],d=Math.hypot(pts[i][0]-g[0],pts[i][1]-g[1]);
    if(d>0&&d<MAG){if(isRm()){pts[i][0]=g[0];pts[i][1]=g[1];warp()}else{c.sx={x:pts[i][0],v:0};c.sy={x:pts[i][1],v:0};c.anim=true;wake()}}
  }
  const TAP_PX=8,TAP_MS=600; // un toque: el dedo se mueve menos de 8 px y lo levanta antes de 0,6 s
  let stageTap=null;
  stage.addEventListener('pointerdown',e=>{stageTap=e.target.classList.contains('h')?null:{id:e.pointerId,x:e.clientX,y:e.clientY,t:e.timeStamp}});
  stage.addEventListener('pointerup',e=>{
    const s=stageTap;stageTap=null;
    if(!s||s.id!==e.pointerId||mapSel<0||Math.hypot(e.clientX-s.x,e.clientY-s.y)>TAP_PX||e.timeStamp-s.t>TAP_MS)return;
    const r=stage.getBoundingClientRect(),i=mapSel;
    corners[i].anim=false;placeCorner(i,(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height);warp();settleCorner(i);mapSelect(-1);
  });
  /* Arrastre: la esquina se mueve exactamente lo que se mueve el dedo desde que tocó el asa (x0, y0 y la esquina
     de partida), no según dónde está el dedo respecto al escaparate. Así, si la página se mueve a mitad del gesto
     (Safari en iOS que hace scroll, el navegador que enseña el asa enfocada, la barra que aparece), la esquina no salta */
  hs.forEach((b,i)=>{
    const c=corners[i];
    // Táctil: tocar un asa no hace scroll, ni zoom, ni la enfoca (enfocarla puede desplazar la página bajo el dedo)
    b.addEventListener('touchstart',e=>e.preventDefault(),{passive:false});
    b.addEventListener('pointerdown',e=>{
      // Si otro dedo ya la lleva, se queda con él. Un arrastre que no terminó bien (sin pointerup) no bloquea el nuevo
      if(c.grab&&c.grab.id!==e.pointerId&&b.hasPointerCapture(c.grab.id))return;
      const r=stage.getBoundingClientRect();
      c.grab={id:e.pointerId,x0:e.clientX,y0:e.clientY,t:e.timeStamp,w:r.width||1,h:r.height||1,px:pts[i][0],py:pts[i][1],far:false};c.anim=false;
      try{b.setPointerCapture(e.pointerId)}catch(err){}
      b.classList.add('grab');
    });
    b.addEventListener('pointermove',e=>{
      const g=c.grab;if(!g||e.pointerId!==g.id)return;
      if(Math.hypot(e.clientX-g.x0,e.clientY-g.y0)>TAP_PX)g.far=true;
      placeCorner(i,g.px+(e.clientX-g.x0)/g.w,g.py+(e.clientY-g.y0)/g.h);warp();
    });
    const up=e=>{
      const g=c.grab;if(!g||e.pointerId!==g.id)return;c.grab=null;b.classList.remove('grab');
      // Un toque (sin arrastrar) la selecciona, o la deselecciona si ya lo estaba
      if(e.type==='pointerup'&&!g.far&&e.timeStamp-g.t<=TAP_MS)mapSelect(mapSel===i?-1:i);
      settleCorner(i);
    };
    b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);
    // Con teclado (Intro o Espacio, sin puntero: detail 0) también se selecciona
    b.addEventListener('click',e=>{if(!e.detail)mapSelect(mapSel===i?-1:i)});
    // Flechas: un paso pequeño; con Mayúsculas, uno grande. El imán también funciona con teclado
    b.addEventListener('keydown',e=>{const k={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!k)return;e.preventDefault();
      const s=e.shiftKey?.05:.01;c.anim=false;placeCorner(i,pts[i][0]+k[0]*s,pts[i][1]+k[1]*s,true);warp()});
  });
  // Mientras se arrastra una esquina, el dedo no hace scroll (touch-action:none no basta en todos los Safari)
  stage.addEventListener('touchmove',e=>{if(corners.some(c=>c.grab))e.preventDefault()},{passive:false});
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
  // select(-1) deselecciona el asa (main.js lo llama con Escape)
  return{warp,stepSprings:stepMapSprings,draw:drawMap,select:mapSelect};
}
