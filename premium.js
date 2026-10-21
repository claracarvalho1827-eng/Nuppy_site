(function(){
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
  var header=document.querySelector('header.top');
  var top=document.createElement('button');
  top.className='totop';top.type='button';top.setAttribute('aria-label','Voltar ao topo');top.textContent='↑';
  top.onclick=function(){scrollTo({top:0,behavior:reduce?'auto':'smooth'})};
  document.body.appendChild(top);
  function onScroll(){var y=scrollY;if(header)header.classList.toggle('scrolled',y>20);top.classList.toggle('show',y>800)}
  addEventListener('scroll',onScroll,{passive:true});onScroll();

  document.querySelectorAll('.pain,.tile,.panel').forEach(function(el){
    el.classList.add('spot');
    el.addEventListener('pointermove',function(e){var r=el.getBoundingClientRect();el.style.setProperty('--sx',(e.clientX-r.left)+'px');el.style.setProperty('--sy',(e.clientY-r.top)+'px')});
  });
  document.querySelectorAll('.btn').forEach(function(b){
    b.addEventListener('pointermove',function(e){var r=b.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;b.style.setProperty('--bx',x+'px');b.style.setProperty('--by',y+'px');if(!reduce&&fine)b.style.transform='translate('+((x-r.width/2)*.18)+'px,'+((y-r.height/2)*.25)+'px)'});
    b.addEventListener('pointerleave',function(){b.style.transform=''});
  });
  if(fine&&!reduce){
    var c=document.createElement('div');c.className='cursor';c.setAttribute('aria-hidden','true');document.body.appendChild(c);
    var tx=0,ty=0,cx=0,cy=0;
    addEventListener('pointermove',function(e){tx=e.clientX;ty=e.clientY;c.classList.add('on');var t=e.target.closest&&e.target.closest('a,button,summary,[role=tab],.tile,.mc');c.classList.toggle('big',!!t)});
    document.addEventListener('pointerleave',function(){c.classList.remove('on')});
    (function loop(){cx+=(tx-cx)*.2;cy+=(ty-cy)*.2;c.style.transform='translate('+cx+'px,'+cy+'px)';requestAnimationFrame(loop)})();
  }
})();
