/* Caja de herramientas: la física de las piezas (gravedad, choques y agarre con muelle). Los botones y sus textos
   los crea main.js desde el principio; este módulo solo los hace caer y moverse, y se pide con import() cuando la
   caja se acerca a la pantalla. Con «reducir movimiento» (isRm) las piezas se quedan en su lista, sin física.
   keep() pide otro frame al bucle de main.js */
export function createPit({pit,chips,rand,clamp,isRm,keep}){
  let pitBuilt=false,pW=0,pH=0;
  function startPit(){
    if(pitBuilt||isRm())return;pitBuilt=true;
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
    if(!pitBuilt)return;
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
      if(c.hold||Math.abs(c.vx)>.05||Math.abs(c.vy)>.6||Math.abs(clamp(c.vx*1.6,-16,16)-c.rot)>.05)keep();
      const goal=clamp(c.vx*1.6,-16,16);c.rot+=(goal-c.rot)*.14;
      c.el.style.transform=`translate(${c.x-c.w/2}px,${c.y-c.h/2}px) rotate(${c.rot}deg)`;
    }
  }
  return{
    start:startPit,step:stepPit,
    // El tamaño de la caja se lee solo cuando cambia, no en cada frame
    resize(){if(pitBuilt){pW=pit.clientWidth;pH=pit.clientHeight}},
    dump(){if(pitBuilt)chips.forEach(c=>{c.vx=rand(-12,12);c.vy=rand(-30,-14)})},
  };
}
