(function(){
  var root=document.documentElement;
  var calm=matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* keep the reader's place when switching language */
  var chk=document.getElementById('langchk'),anchor=null,top=0;
  function pick(){
    var els=document.querySelectorAll('main header, main .ticker, main .sec-head, main .card, main .row, main .feature, main .group, main .hours, main .compare, main .block, main .box, main footer');
    for(var i=0;i<els.length;i++){var r=els[i].getBoundingClientRect();if(r.bottom>0){anchor=els[i];top=r.top;return;}}
  }
  document.getElementById('langBtn').addEventListener('pointerdown',pick);
  chk.addEventListener('keydown',pick);
  chk.addEventListener('change',function(){
    if(!anchor)pick();
    window.scrollBy(0,anchor.getBoundingClientRect().top-top);
    anchor=null;
  });

  /* section menu + accessibility panel: one open at a time, close on outside tap / Escape / pick */
  var menu=document.getElementById('secmenu'),panel=document.getElementById('a11yPanel');
  [menu,panel].forEach(function(d){
    d.addEventListener('toggle',function(){if(d.open)[menu,panel].forEach(function(o){if(o!==d)o.open=false;});});
  });
  menu.querySelectorAll('.menu a').forEach(function(a){a.addEventListener('click',function(){menu.open=false;});});
  document.addEventListener('click',function(e){
    if(menu.open&&(e.target===menu||!menu.contains(e.target)))menu.open=false;
    if(panel.open&&!panel.contains(e.target))panel.open=false;
  });
  document.addEventListener('keydown',function(e){
    if(e.key!=='Escape')return;
    [menu,panel].forEach(function(d){if(d.open){d.open=false;d.querySelector('summary').focus();}});
  });

  /* reading progress line */
  var bar=document.querySelector('.progress span'),ticking=false;
  function progress(){
    var max=document.documentElement.scrollHeight-innerHeight;
    bar.style.transform='scaleX('+(max>0?Math.min(1,scrollY/max):0)+')';
    ticking=false;
  }
  addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(progress);}},{passive:true});
  addEventListener('resize',progress);
  progress();

  /* live election-day line in the ticker (Israel time; static text stays if anything fails) */
  var status=document.getElementById('status');
  var OPEN=Date.UTC(2026,9,27,5,0),CLOSE=Date.UTC(2026,9,27,20,0),DAY=Date.UTC(2026,9,27);
  var DATE_HE='שלישי 27.10 · <span dir="ltr">07:00–22:00</span>',DATE_EN='Tue 27.10 · <span dir="ltr">07:00–22:00</span>';
  function seg(s){return s.split(' · ').map(function(p){return '<span class="seg">'+p+'</span>';}).join(' · ');}
  function both(he,en){return '<span class="he">'+seg(he)+'</span><span class="en">'+seg(en)+'</span>';}
  function n(x){return '<span class="tnum">'+x+'</span>';}
  function left(ms){
    var mins=Math.max(1,Math.ceil(ms/60000)),h=Math.floor(mins/60),m=mins%60;
    var he=h?(h===1?'שעה':n(h)+' שעות')+(m?' ו-'+n(m)+' דק׳':''):(m===1?'דקה':n(m)+' דקות');
    var en=(h?n(h)+'h':'')+(h&&m?' ':'')+(m?n(m)+'m':'');
    return [he,en];
  }
  function renderStatus(){
    var now=Date.now(),html;
    if(now>=CLOSE){
      html=both('הקלפיות נסגרו · תודה שהשפעתם','Polls are closed · Thanks for voting');
    }else if(now>=OPEN){
      var l=left(CLOSE-now);
      html='<i class="live" aria-hidden="true"></i>'+both('הקלפיות פתוחות עכשיו · נסגרות בעוד '+l[0],'Polls are open now · closing in '+l[1]);
    }else{
      var d=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jerusalem',year:'numeric',month:'2-digit',day:'2-digit'}).format(now).split('-');
      var days=Math.round((DAY-Date.UTC(+d[0],d[1]-1,+d[2]))/864e5);
      if(days<=0)html=both('היום בחירות · הקלפיות נפתחות ב-<span dir="ltr">07:00</span>','Election Day is today · polls open at <span dir="ltr">07:00</span>');
      else if(days===1)html=both('מחר בחירות · '+DATE_HE,'Election Day is tomorrow · '+DATE_EN);
      else if(days===2)html=both('עוד יומיים לבחירות · '+DATE_HE,n(2)+' days to Election Day · '+DATE_EN);
      else html=both('עוד '+n(days)+' ימים לבחירות · '+DATE_HE,n(days)+' days to Election Day · '+DATE_EN);
    }
    if(status.innerHTML!==html)status.innerHTML=html;
  }
  function tick(){try{renderStatus();}catch(e){return;}setTimeout(tick,60000-Date.now()%60000+50);}
  tick();
  document.addEventListener('visibilitychange',function(){if(!document.hidden)try{renderStatus();}catch(e){}});

  if(!('IntersectionObserver' in window))return;

  /* current section: label on the menu button + highlight in menu and tabs */
  var curT=menu.querySelector('.cur-t'),defT=curT.innerHTML;
  var links={};
  document.querySelectorAll('.menu a[href^="#"], .tabs a[href^="#"]').forEach(function(a){
    var id=a.getAttribute('href').slice(1);(links[id]=links[id]||[]).push(a);
  });
  var current=null;
  function setActive(id){
    if(id===current)return;
    if(current&&links[current])links[current].forEach(function(a){a.removeAttribute('aria-current');});
    current=id;
    if(!links[id]){curT.innerHTML=defT;return;}
    links[id].forEach(function(a){a.setAttribute('aria-current','true');});
    var item=menu.querySelector('.menu a[href="#'+id+'"]');
    curT.innerHTML=item.querySelector('span').innerHTML;
  }
  var spy=new IntersectionObserver(function(entries){
    entries.forEach(function(e){if(e.isIntersecting)setActive(e.target.id);});
  },{rootMargin:'-30% 0px -65% 0px'});
  ['top'].concat(Object.keys(links)).forEach(function(id){var el=document.getElementById(id);if(el)spy.observe(el);});

  /* bottom "find my polling station" bar: only between the hero and the footer */
  var heroVisible=true,footVisible=false;
  function syncCta(){root.classList.toggle('cta-on',!heroVisible&&!footVisible);}
  new IntersectionObserver(function(e){heroVisible=e[0].isIntersecting;syncCta();},{rootMargin:'-'+getComputedStyle(root).getPropertyValue('--bar-h').trim()+' 0px 0px 0px'}).observe(document.querySelector('.hero .btns'));
  new IntersectionObserver(function(e){footVisible=e[0].isIntersecting;syncCta();}).observe(document.querySelector('footer'));

  if(calm)return;

  /* one-time reveals; only things below the first screen are hidden, so nothing visible ever blinks */
  var vh=innerHeight;
  var kinds=[
    ['.sec-head h2, footer h2','mask'],
    ['.sec-head .sub-h, .sec-head .intro, .sec>p, .sec>.chips, .sec>.btn, .group, .row, .card, .feature, .hours, .compare, .sec>.box, .foot-kicker, .frow, .logo-foot, .fnote','']
  ];
  var pending=new Map();
  var reveal=new IntersectionObserver(function(entries){
    var due=[];
    entries.forEach(function(e){
      if(!e.isIntersecting)return;
      reveal.unobserve(e.target);
      due=due.concat(pending.get(e.target));
      pending.delete(e.target);
    });
    due.sort(function(a,b){return a.getBoundingClientRect().top-b.getBoundingClientRect().top;})
      .forEach(function(el,i){
        el.style.setProperty('--d',Math.min(i*.05,.15)+'s');
        el.classList.add('in');
      });
  });
  kinds.forEach(function(k){
    document.querySelectorAll(k[0]).forEach(function(el){
      if(el.classList.contains('rv')||el.getBoundingClientRect().top<vh)return;
      el.classList.add('rv');
      if(k[1])el.classList.add(k[1]);
      /* clipped elements have no visible area to observe, so watch their container */
      var watch=k[1]==='mask'?el.parentElement:el;
      if(!pending.has(watch)){pending.set(watch,[]);reveal.observe(watch);}
      pending.get(watch).push(el);
    });
  });

  /* big numbers count up the first time they come into view */
  var NUM=/^(\d[\d,]*)(\.\d+)?(%?)$/;
  function countUp(el){
    var txt=el.textContent.trim(),m=NUM.exec(txt),dec=m[2]?m[2].length-1:0,target=parseFloat(txt.replace(/,/g,'')),t0=null;
    function fmt(v){return v.toLocaleString('en-US',{minimumFractionDigits:dec,maximumFractionDigits:dec,useGrouping:m[1].indexOf(',')>-1})+m[3];}
    function step(t){
      if(t0===null)t0=t;
      var p=Math.min(1,(t-t0)/900);
      el.textContent=p<1?fmt(target*(1-Math.pow(1-p,4))):txt;
      if(p<1)requestAnimationFrame(step);
    }
    el.textContent=fmt(0);
    requestAnimationFrame(step);
  }
  var counter=new IntersectionObserver(function(entries){
    entries.forEach(function(e){if(e.isIntersecting){counter.unobserve(e.target);countUp(e.target);}});
  },{threshold:.6});
  document.querySelectorAll('.big, .stat b').forEach(function(el){
    if(NUM.test(el.textContent.trim())&&el.getBoundingClientRect().top>=vh)counter.observe(el);
  });
})();
