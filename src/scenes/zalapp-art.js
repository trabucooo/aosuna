/* Cuaderno de ruta de Zalapp: las ilustraciones de partículas. Este módulo no va en la carga inicial: main.js lo
   pide con import() cuando el móvil de Zalapp se acerca a la pantalla (o al abrir el cuaderno, si aún no ha llegado).
   Recibe de main.js lo que comparte con el resto de la web (utilidades, el lienzo de muestreo, el diálogo) y
   devuelve las funciones que main.js llama. Si el <canvas> no existe o no da contexto, devuelve null.
   isRm() dice si «reducir movimiento» está activo: es una función porque puede cambiar con la página abierta */
export function createArt({$,$$,rand,clamp,small,isRm,sample,octx,ART_FONT,loadPoints,groups,zDlg,zLayout,zLog,NF,LANG}){
  const cv0=$('#zArt');if(!cv0||!cv0.getContext('2d'))return null;
  /* ---------- Cuaderno de ruta: ilustraciones de partículas ----------
     Un <canvas> propio en la hoja (mitad izquierda en ordenador, arriba en móvil) con su propia reserva de puntos.
     Cada etapa tiene figure(ctx, w, h): un dibujo a línea en un lienzo de 400x300 que se muestrea con sample(), y
     si la tiene, figure.number: una cifra que se forma en puntos (70 % de los puntos para la figura, 30 % para la
     cifra). Algunas figuras van por partes (figure.parts) para poder tocar cada una: filtros, salidas, señales.
     Al cambiar de etapa, cada punto va a su diana con muelle, un pequeño arco y un retardo de 0 a 140 ms; las
     dianas se emparejan ordenando por ángulo respecto al centro. El texto entra cuando ha llegado el 80 % */
  const ART_N=small()?1200:2400,ART_DELAY=140,ART_NOISE=.5,ART_LW=4,ART_REPEL=70;
  const art={cv:$('#zArt'),ctx:null,ok:false,on:false,raf:0,last:0,w:0,h:0,rect:null,color:'#fff',
    x:new Float32Array(ART_N),y:new Float32Array(ART_N),vx:new Float32Array(ART_N),vy:new Float32Array(ART_N),
    tx:new Float32Array(ART_N),ty:new Float32Array(ART_N),hx:new Float32Array(ART_N),hy:new Float32Array(ART_N),
    sz:new Float32Array(ART_N),al:new Uint8Array(ART_N),g:new Int16Array(ART_N),go:new Float64Array(ART_N),
    bend:new Float32Array(ART_N),ph:new Float32Array(ART_N),fq:new Float32Array(ART_N),dx:new Float32Array(ART_N),dy:new Float32Array(ART_N),
    stage:-1,ready:true,t0:0,onReady:null,cache:[],centers:[],pulse:[],marks:new Set(),flt:['as','au','fl','ot'],
    zPaths:null,phonePts:null,loaded:false,mx:-999,my:-999,numCache:new Map(),ka:new Float64Array(ART_N),kb:new Float64Array(ART_N)};
  for(let i=0;i<ART_N;i++){art.bend[i]=rand(-.22,.22);art.ph[i]=rand(0,6.283);art.fq[i]=rand(.0006,.0014);const a=rand(0,6.283),r=rand(8,26);art.dx[i]=Math.cos(a)*r;art.dy[i]=Math.sin(a)*r}
  // Figuras. Todas a línea de 3-5 px en un lienzo de 400x300 (sin rellenos grandes; las letras sí son glifos)
  const artText=(c,t,x,y,px)=>{c.font=ART_FONT(px);c.textAlign='center';c.textBaseline='middle';c.fillText(t,x,y)};
  const CURSOR_PATH=new Path2D('M1.5 1.5v18.6l5-4.5 3.4 7.6 3.5-1.6-3.4-7.4 7-.6z');
  // Una figura por partes: dibujarla entera es dibujar todas sus partes
  const parts=(list,number)=>{const f=(c,w,h)=>list.forEach(p=>p(c,w,h));f.parts=list;if(number)f.number=number;return f};
  const fig=(draw,number)=>parts([draw],number);
  // KM 47: los 47 círculos de la encuesta, en el orden de los grupos (36 asalariados, 5 autónomos, 4 de flota, 2 Otro)
  const circle47=i=>c=>{c.lineWidth=3;c.beginPath();c.arc(60+(i%8)*40,40+((i/8)|0)*44,13,0,6.283);c.stroke()};
  // KM 120: cada salida es una carretera curva: un trazo ancho al que se le vacía el centro (quedan los dos bordes)
  const road=(x0,y0,cx,cy,x1,y1)=>c=>{c.beginPath();c.moveTo(x0,y0);c.quadraticCurveTo(cx,cy,x1,y1);c.lineWidth=22;c.stroke();
    c.globalCompositeOperation='destination-out';c.lineWidth=14;c.stroke();c.globalCompositeOperation='source-over'};
  // KM 180: cuatro señales en fila, con la letra de cada una (la del HTML: D, A, F, O en español; W, T, S, O en inglés)
  const signLetters=$$('.sign-shape b',zDlg).map(b=>b.textContent);
  const SIGN_X=[58,152,248,342],SIGN_Y=140;
  const artSigns=[
    c=>{const x=SIGN_X[0],y=SIGN_Y;c.beginPath();c.moveTo(x,y-44);c.lineTo(x+46,y+34);c.lineTo(x-46,y+34);c.closePath();c.stroke();artText(c,signLetters[0],x,y+12,36)},
    c=>{const x=SIGN_X[1],y=SIGN_Y;c.beginPath();for(let k=0;k<8;k++){const a=k*Math.PI/4+Math.PI/8;c[k?'lineTo':'moveTo'](x+Math.cos(a)*43,y+Math.sin(a)*43)}c.closePath();c.stroke();artText(c,signLetters[1],x,y+2,44)},
    c=>{const x=SIGN_X[2],y=SIGN_Y;c.beginPath();c.arc(x,y,41,0,6.283);c.stroke();artText(c,signLetters[2],x,y+2,44)},
    c=>{const x=SIGN_X[3],y=SIGN_Y;c.beginPath();c.roundRect(x-38,y-38,76,76,8);c.stroke();artText(c,signLetters[3],x,y+2,44)},
  ];
  // Descanso: el texto del sello del HTML, en arco
  const stampText=($('.log-stamp .stamp-title',zDlg)?.textContent||'').toUpperCase();
  const teamLetters=$$('.team-stamp .stamp-title',zDlg).map(e=>e.textContent.trim()[0].toUpperCase());
  const NF2=new Intl.NumberFormat(LANG==='en'?'en-GB':'es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
  const ART=[
    // KM 0: un camión de perfil y, a la derecha, seis plazas con una P, todas tachadas
    fig(c=>{
      c.strokeRect(22,118,112,72);
      c.beginPath();c.moveTo(134,190);c.lineTo(134,132);c.lineTo(160,132);c.lineTo(178,156);c.lineTo(188,160);c.lineTo(188,190);c.closePath();c.stroke();
      c.beginPath();c.moveTo(142,140);c.lineTo(157,140);c.lineTo(169,154);c.lineTo(142,154);c.closePath();c.stroke();
      [44,104,166].forEach(x=>{c.beginPath();c.arc(x,201,11,0,6.283);c.stroke()});
      c.lineWidth=3;c.beginPath();c.moveTo(8,216);c.lineTo(392,216);c.stroke();c.lineWidth=ART_LW;
      c.strokeRect(276,40,40,40);artText(c,'P',296,61,30);c.beginPath();c.moveTo(296,80);c.lineTo(296,104);c.stroke();
      c.beginPath();c.moveTo(206,110);c.lineTo(386,110);for(let k=0;k<=6;k++){c.moveTo(206+k*30,110);c.lineTo(206+k*30,200)}c.stroke();
      c.lineWidth=3;c.beginPath();for(let k=0;k<6;k++){const x=206+k*30;c.moveTo(x+9,128);c.lineTo(x+21,182);c.moveTo(x+21,128);c.lineTo(x+9,182)}c.stroke();
    },NF.format(390057)),
    // KM 47: 47 círculos en rejilla de 8 columnas (cada uno es una parte: los filtros los reagrupan)
    parts(Array.from({length:47},(_,i)=>circle47(i)),NF2.format(7.39)),
    // KM 120: un cruce desde arriba: rombo en el centro (parte 0) y cuatro salidas curvas (N, E, S, O)
    parts([
      c=>{c.beginPath();c.moveTo(200,120);c.lineTo(230,150);c.lineTo(200,180);c.lineTo(170,150);c.closePath();c.stroke()},
      road(200,112,200,58,252,10),road(238,150,300,150,390,102),road(200,188,200,242,148,292),road(162,150,100,150,10,198),
    ]),
    // KM 180: triángulo, octógono, círculo y cuadrado
    parts(artSigns),
    // KM 230: la Z de public/zalapp/z.svg (Path2D, a línea); si no ha llegado, tres trazos
    fig(c=>{
      if(art.zPaths){c.save();c.translate(80,30);c.scale(2.4,2.4);c.lineWidth=ART_LW/2.4;c.lineJoin='miter';art.zPaths.forEach(p=>c.stroke(p));c.restore();return}
      c.beginPath();c.moveTo(110,50);c.lineTo(290,50);c.lineTo(110,250);c.lineTo(290,250);c.stroke();c.beginPath();c.moveTo(250,92);c.lineTo(160,196);c.stroke();
    }),
    // KM 300: el móvil, con los puntos de public/zalapp/movil-puntos.json (si no han llegado, su contorno)
    Object.assign(fig(c=>{c.beginPath();c.roundRect(132,10,136,280,22);c.stroke();c.beginPath();c.roundRect(140,18,120,264,16);c.stroke()}),{json:true}),
    // Descanso: sello redondo de doble círculo, el texto en arco y una estrella en el centro
    fig(c=>{
      c.beginPath();c.arc(200,150,134,0,6.283);c.stroke();c.lineWidth=3;c.beginPath();c.arc(200,150,122,0,6.283);c.stroke();c.lineWidth=ART_LW;
      const ch=[...stampText],step=Math.min(.27,4.6/ch.length),a0=-Math.PI/2-step*(ch.length-1)/2;
      c.font=ART_FONT(30);c.textAlign='center';c.textBaseline='middle';
      ch.forEach((t,k)=>{const a=a0+k*step;c.save();c.translate(200+Math.cos(a)*97,150+Math.sin(a)*97);c.rotate(a+Math.PI/2);c.fillText(t,0,0);c.restore()});
      c.beginPath();for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,r=k%2?15:36;c[k?'lineTo':'moveTo'](200+Math.cos(a)*r,168+Math.sin(a)*r)}c.closePath();c.stroke();
    }),
    // Próxima salida: cartel de autovía con una flecha de salida en diagonal
    fig(c=>{
      c.beginPath();c.roundRect(50,40,300,170,14);c.stroke();c.lineWidth=3;c.beginPath();c.roundRect(62,52,276,146,8);c.stroke();c.lineWidth=ART_LW;
      c.beginPath();c.moveTo(150,180);c.lineTo(262,82);c.moveTo(262,82);c.lineTo(224,84);c.moveTo(262,82);c.lineTo(260,120);c.stroke();
      c.beginPath();c.moveTo(120,210);c.lineTo(120,290);c.moveTo(280,210);c.lineTo(280,290);c.stroke();
    },'30'),
    // El equipo: tres flechas de cursor como las de la web, con sus iniciales debajo
    fig(c=>{
      [40,150,260].forEach((x,k)=>{c.save();c.translate(x+8,30);c.scale(5,5);c.lineWidth=ART_LW/5;c.lineJoin='round';c.stroke(CURSOR_PATH);c.restore();
        artText(c,teamLetters[k]||'',x+45,230,46)});
    }),
  ];
  // Puntos de una parte en el lienzo de 400x300 ([x, y, tamaño, ...]); se calculan una vez por etapa y parte
  function artPartPts(si,pi){
    const C=art.cache[si]||(art.cache[si]=[]);
    if(C[pi])return C[pi];
    const f=ART[si];let out=[];
    if(f.json&&art.phonePts){
      const d=art.phonePts,pts=d.desktop,H=280,W=H*d.ratio,x0=(400-W)/2;
      for(let k=0;k+2<pts.length;k+=3)out.push(x0+pts[k]*W,10+pts[k+1]*H,1+pts[k+2]*1.6);
    }else{
      const p=sample(400,300,c=>{c.lineWidth=ART_LW;c.lineCap='round';c.lineJoin='round';c.globalCompositeOperation='source-over';f.parts[pi](c,400,300)});
      for(let k=0;k<p.length;k+=2)out.push(p[k],p[k+1],0);
    }
    return C[pi]=out;
  }
  // La cifra, muestreada como heroPts(): a media resolución y escalada x2
  function artNumberPts(text,bx,by,bw,bh){
    const key=text+'|'+Math.round(bx)+','+Math.round(by)+','+Math.round(bw)+','+Math.round(bh);
    if(art.numCache.has(key))return art.numCache.get(key);
    octx.font=ART_FONT(100);const fs=Math.min(bh*.92,bw*.94/(octx.measureText(text).width/100||1));
    const p=sample(Math.ceil(bw/2),Math.ceil(bh/2),c=>{artText(c,text,bw/4,bh/4,fs/2)});
    const out=[];for(let k=0;k<p.length;k+=2)out.push(bx+p[k]*2,by+p[k+1]*2);
    art.numCache.set(key,out);return out;
  }
  // Cajas de la figura y de la cifra en el lienzo (las usan artTarget y el precálculo)
  function artBoxes(f){
    const w=art.w,h=art.h,pad=Math.max(12,Math.min(w,h)*.05),num=f.number;
    const fh=num?(h-pad*2)*.68:h-pad*2,s=Math.min((w-pad*2)/400,fh/300);
    return{pad,fh,s,ox:(w-400*s)/2,oy:pad+(fh-300*s)/2,nb:[pad,pad+fh+(h-pad*2)*.04,w-pad*2,(h-pad*2)*.28]};
  }
  // Reparte los puntos, coloca las dianas y las empareja por ángulo. delay: los puntos salen escalonados
  function artTarget(si,delay){
    const f=ART[si],N=ART_N,w=art.w,h=art.h;if(!w||!h)return;
    const num=f.number,F=num?Math.round(N*.7):N;
    // La figura arriba (o en todo el lienzo si no hay cifra) y la cifra debajo
    const{s,ox,oy,nb}=artBoxes(f);
    const P=f.parts.map((_,pi)=>artPartPts(si,pi));
    // Las salidas marcadas del cruce se llevan más puntos (y más grandes)
    const wt=P.map((p,pi)=>p.length/3*(si===2&&art.marks.has(pi-1)?2.6:1)),sum=wt.reduce((a,b)=>a+b,0)||1;
    const T=[],sm=small()?.85:1;let left=F;
    P.forEach((p,pi)=>{
      const L=p.length/3,c=pi===P.length-1?left:Math.round(F*wt[pi]/sum);left-=c;if(!L)return;
      const big=si===2&&art.marks.has(pi-1)?1.6:1;
      for(let j=0;j<c;j++){
        const k=Math.min(L-1,Math.floor((j+Math.random())*L/c))*3,jx=(Math.random()-.5)*2,jy=(Math.random()-.5)*2;
        T.push(ox+(p[k]+jx)*s,oy+(p[k+1]+jy)*s,(p[k+2]||rand(1.3,2.2)*sm)*big,pi);
      }
    });
    while(T.length<F*4)T.push(w/2,h/2,1.5,0);
    if(num){
      const np=artNumberPts(num,nb[0],nb[1],nb[2],nb[3]),L=np.length/2;
      for(let j=0;j<N-F;j++){const k=L?Math.min(L-1,Math.floor((j+Math.random())*L/(N-F)))*2:0;T.push((np[k]||w/2)+rand(-1.5,1.5),(np[k+1]||h/2)+rand(-1.5,1.5),rand(1.3,2.2),-1)}
    }
    // Emparejar: puntos actuales y dianas, cada lista ordenada por ángulo respecto al centro del lienzo
    const cx=w/2,cy=h/2,ka=art.ka,kb=art.kb,key=(a,i)=>Math.floor((a+Math.PI)*1e5)*4096+i;
    for(let i=0;i<N;i++){ka[i]=key(Math.atan2(T[i*4+1]-cy,T[i*4]-cx),i);kb[i]=key(Math.atan2(art.y[i]-cy,art.x[i]-cx),i)}
    ka.sort();kb.sort();
    const ti={length:N},pi={length:N};for(let r=0;r<N;r++){ti[r]=ka[r]%4096;pi[r]=kb[r]%4096}
    const now=performance.now(),G=f.parts.length,cs=Array.from({length:G},()=>[0,0,0]);
    for(let r=0;r<N;r++){
      const i=pi[r],t=ti[r]*4;
      art.hx[i]=T[t];art.hy[i]=T[t+1];art.sz[i]=T[t+2];art.g[i]=T[t+3];
      art.go[i]=delay?now+r/N*ART_DELAY:0;
      if(T[t+3]>=0){const q=cs[T[t+3]];q[0]+=T[t];q[1]+=T[t+1];q[2]++}
    }
    art.centers=cs.map(q=>[q[0]/(q[2]||1),q[1]/(q[2]||1)]);
    artFilter();
  }
  // Dianas finales: en la encuesta, los círculos fuera del filtro se deshacen en polvo tenue alrededor de su sitio
  function artFilter(){
    const dust=art.stage===1;
    for(let i=0;i<ART_N;i++){
      const off=dust&&art.g[i]>=0&&!art.flt.includes(groups[art.g[i]]);
      art.tx[i]=art.hx[i]+(off?art.dx[i]:0);art.ty[i]=art.hy[i]+(off?art.dy[i]:0);art.al[i]=off?0:1;
    }
  }
  function artSize(){
    const r=art.cv.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.6);
    art.rect=r;art.w=r.width;art.h=r.height;
    const W=Math.round(r.width*d),H=Math.round(r.height*d);
    if(art.cv.width!==W||art.cv.height!==H){art.cv.width=W;art.cv.height=H}
    art.ctx.setTransform(d,0,0,d,0,0);
  }
  // Cambio de etapa. ready() se llama cuando el 80 % de los puntos ha llegado (o enseguida sin animaciones)
  function artGo(si,ready){
    art.stage=si;art.onReady=ready;art.ready=false;art.t0=performance.now();art.pulse=[];
    if(si!==2)art.marks.clear();
    // Recién abierto el cuaderno (P-05): repartir y ordenar los 2.400 puntos cuesta. Se hace después del primer
    // pintado (dos rAF: el primero aún va antes de pintar), para que el clic responda con el diálogo ya abierto
    if(art.defer){art.defer=false;requestAnimationFrame(()=>requestAnimationFrame(()=>{if(art.on&&art.stage===si){art.t0=performance.now();zLayout(zLog.cur,true);artPlace(si);artWarm()}}));return}
    artPlace(si);
  }
  function artPlace(si){
    artTarget(si,!isRm());
    if(isRm()){
      // Sin animaciones: la figura aparece formada, con un fundido del lienzo
      art.x.set(art.tx);art.y.set(art.ty);art.vx.fill(0);art.vy.fill(0);
      art.cv.classList.remove('fade');void art.cv.offsetWidth;art.cv.classList.add('fade');
      artReady();
    }
  }
  function artReady(){if(art.ready)return;art.ready=true;const r=art.onReady;art.onReady=null;r&&r()}
  function artOpen(){
    if(!art.ok)return;
    art.color=getComputedStyle(zDlg).getPropertyValue('--accent').trim()||'#fff';
    artSize();
    // Los puntos salen de una nube alrededor del centro, como en la intro
    for(let i=0;i<ART_N;i++){const a=rand(0,6.283),r=Math.sqrt(Math.random())*Math.min(art.w,art.h)*.5;art.x[i]=art.w/2+Math.cos(a)*r;art.y[i]=art.h/2+Math.sin(a)*r;art.vx[i]=art.vy[i]=0}
    // Hasta que lleguen sus dianas (artGo las pone en diferido), los puntos se quedan donde están, en la nube
    art.tx.set(art.x);art.ty.set(art.y);art.go.fill(0);art.al.fill(1);art.defer=true;
    art.on=true;art.last=performance.now();cancelAnimationFrame(art.raf);art.raf=requestAnimationFrame(artLoop);
    if(!art.loaded){
      art.loaded=true;
      // La Z de z.svg (como Path2D) y el móvil de su JSON: al llegar, se rehacen esas dos etapas
      const redo=si=>{art.cache[si]=null;if(art.on&&art.stage===si)artTarget(si,false)};
      fetch(import.meta.env.BASE_URL+'zalapp/z.svg').then(r=>r.ok?r.text():null).then(t=>{
        if(!t)return;const d=new DOMParser().parseFromString(t,'image/svg+xml');
        const ps=[...d.querySelectorAll('path')].map(p=>p.getAttribute('d')).filter(Boolean).map(s=>new Path2D(s));
        if(ps.length){art.zPaths=ps;redo(4)}}).catch(()=>{});
      loadPoints('/zalapp/movil-puntos.json').then(d=>{if(d){art.phonePts=d;redo(5)}});
    }
  }
  function artClose(){art.on=false;cancelAnimationFrame(art.raf)}
  // Muestrear una parte cuesta unos milisegundos (getImageData de 400x300): se hace por adelantado, en ratos libres,
  // para que el cambio de etapa no cargue con ello. Si alguien llega antes, la parte se muestrea en ese momento
  // Con el lienzo animándose cada frame los huecos libres son cortos: cada vuelta hace al menos un trabajo (y como mucho espera 200 ms)
  const idle=cb=>window.requestIdleCallback?requestIdleCallback(cb,{timeout:200}):setTimeout(()=>cb({timeRemaining:()=>8}),60);
  function artWarm(){
    // Las capturas de la etapa de la beta, decodificadas por adelantado (si no, se decodifican al aparecer el texto)
    $$('img',zDlg).forEach(i=>{i.loading='eager';i.decode?.().catch(()=>{})});
    const jobs=[];ART.forEach((f,si)=>{f.parts.forEach((_,pi)=>jobs.push(()=>artPartPts(si,pi)));if(f.number)jobs.push(()=>{const b=artBoxes(f).nb;artNumberPts(f.number,b[0],b[1],b[2],b[3])})});
    const run=dl=>{do jobs.shift()();while(jobs.length&&dl.timeRemaining()>3);if(jobs.length&&art.on)idle(run)};
    idle(run);
  }
  // El bucle solo corre con el cuaderno abierto
  function artLoop(now){
    if(!art.on)return;
    art.raf=requestAnimationFrame(artLoop);
    const f=clamp((now-art.last)/16.67,.2,2.4);art.last=now;
    const{x,y,vx,vy,tx,ty,go,bend,ph,fq}=art,N=ART_N,mx=art.mx,my=art.my,R2=ART_REPEL*ART_REPEL,dm=Math.pow(.8,f),k=.07*f;
    let arrived=0;
    if(!isRm())for(let i=0;i<N;i++){
      let gx=tx[i],gy=ty[i];
      const dx=gx-x[i],dy=gy-y[i];
      if(Math.abs(dx)+Math.abs(dy)<2.5)arrived++;
      if(now<go[i]){gx=x[i];gy=y[i]}
      // Arco: apunta a un lado de la diana en proporción a lo que falta (se anula al llegar)
      else{gx-=dy*bend[i];gy+=dx*bend[i]}
      const w=now*fq[i]+ph[i];gx+=Math.sin(w)*ART_NOISE;gy+=Math.cos(w*1.31)*ART_NOISE;
      vx[i]+=(gx-x[i])*k;vy[i]+=(gy-y[i])*k;
      const ex=x[i]-mx,ey=y[i]-my,d2=ex*ex+ey*ey;
      if(d2<R2&&d2>1){const q=(1-d2/R2)*3/Math.sqrt(d2);vx[i]+=ex*q*f;vy[i]+=ey*q*f}
      vx[i]*=dm;vy[i]*=dm;x[i]+=vx[i]*f;y[i]+=vy[i]*f;
    }
    if(!art.ready&&(arrived>=N*.8||now-art.t0>1800))artReady();
    artDraw(now);
  }
  function artDraw(now){
    const c=art.ctx,{x,y,sz,al,g}=art,N=ART_N;
    c.clearRect(0,0,art.w,art.h);c.fillStyle=art.color;
    // Latido de una señal del DAFO al girar su tarjeta: crece un 22 % desde su centro y vuelve (450 ms)
    const pk=art.pulse.map(p=>{const u=(now-p)/450;return u>0&&u<1?1+.22*Math.sin(Math.PI*u):1});
    for(let pass=0;pass<2;pass++){
      c.globalAlpha=pass?.2:1;
      for(let i=0;i<N;i++){
        if(al[i]!==(pass?0:1))continue;
        let px=x[i],py=y[i];const s=sz[i],m=pk[g[i]];
        if(m&&m!==1){const q=art.centers[g[i]];px=q[0]+(px-q[0])*m;py=q[1]+(py-q[1])*m}
        c.fillRect(px-s/2,py-s/2,s,s);
      }
    }
    c.globalAlpha=1;
  }
  {
    art.ctx=art.cv.getContext('2d');art.ok=true;
    {
      // Al redimensionar (giro, ventana), se recalculan las dianas: los puntos viajan, sin retardo
      new ResizeObserver(()=>{if(!art.on)return;artSize();if(art.stage>=0){artTarget(art.stage,false);if(isRm()){art.x.set(art.tx);art.y.set(art.ty)}}}).observe(art.cv);
      zDlg.addEventListener('pointermove',e=>{if(!art.rect)return;art.mx=e.clientX-art.rect.left;art.my=e.clientY-art.rect.top},{passive:true});
      zDlg.addEventListener('pointerleave',()=>{art.mx=art.my=-999});
    }
  }
  // Filtros de la encuesta, salidas del cruce y señales del DAFO, sobre la figura
  function artSetFilter(g){art.flt=g;if(art.on&&art.stage===1){artFilter();if(isRm()){art.x.set(art.tx);art.y.set(art.ty)}}}
  function artMarks(){
    art.marks=new Set($$('.exit-btn',zDlg).map((b,k)=>b.getAttribute('aria-expanded')==='true'?k:-1).filter(k=>k>=0));
    if(art.on&&art.stage===2){artTarget(2,false);if(isRm()){art.x.set(art.tx);art.y.set(art.ty)}}
  }
  function artPulse(k){if(art.on&&art.stage===3&&!isRm())art.pulse[k]=performance.now()}
  // La etapa 0, muestreada por adelantado en un rato libre (P-05)
  function warmFirst(){idle(()=>ART[0].parts.forEach((_,pi)=>artPartPts(0,pi)))}
  return{art,go:artGo,open:artOpen,close:artClose,setFilter:artSetFilter,marks:artMarks,pulse:artPulse,warmFirst};
}
