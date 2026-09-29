(function(){
  document.documentElement.classList.add("js");

  /* Add your profile URLs here. Links with an empty value stay hidden. */
  var LINKS = { github:"", linkedin:"", resume:"", auction:"", sportzone:"" };
  document.querySelectorAll("[data-link]").forEach(function(el){
    var u = LINKS[el.getAttribute("data-link")];
    if(u){ el.setAttribute("href", u); el.hidden = false; }
  });

  /* Nav: pill on scroll, mobile menu */
  var nav = document.getElementById("nav");
  var toggle = document.getElementById("navtoggle");
  function onScroll(){ nav.classList.toggle("scrolled", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive:true });
  onScroll();
  function setMenu(open){
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  toggle.addEventListener("click", function(){ setMenu(!nav.classList.contains("open")); });
  document.querySelectorAll("#navlinks a").forEach(function(a){
    a.addEventListener("click", function(){ setMenu(false); });
  });

  /* Reveal on scroll */
  var items = document.querySelectorAll(".reveal");
  if("IntersectionObserver" in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold:.12, rootMargin:"0px 0px -40px 0px" });
    items.forEach(function(el){ io.observe(el); });
  } else {
    items.forEach(function(el){ el.classList.add("in"); });
  }

  /* Contact form: opens the visitor's email app */
  var form = document.getElementById("cform");
  var note = document.getElementById("fnote");
  form.addEventListener("submit", function(e){
    e.preventDefault();
    var n = form.elements["name"].value.trim();
    var em = form.elements["email"].value.trim();
    var msg = form.elements["message"].value.trim();
    var subject = "Portfolio message from " + (n || "a visitor");
    var body = msg + "\n\n" + n + (em ? " (" + em + ")" : "");
    var href = "mailto:rohithrohi9047@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    var a = document.createElement("a");
    a.href = href; a.target = "_blank"; a.rel = "noopener";
    document.body.appendChild(a); a.click(); a.remove();
    note.textContent = "Opening your email app. If nothing opens, write to rohithrohi9047@gmail.com.";
  });

  /* Live sensor simulation */
  var canvas = document.getElementById("signal");
  if(!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var elTemp = document.getElementById("r-temp");
  var elMode = document.getElementById("r-mode");
  var elFlag = document.getElementById("r-flag");
  var btnPause = document.getElementById("btn-pause");
  var btnGlitch = document.getElementById("btn-glitch");

  var N = 260;
  var FAN_ON = 38, FAN_OFF = 36, PUMP_ON = 48, PUMP_OFF = 45;
  var YMIN = 20, YMAX = 66;
  var MODES = ["Idle", "Fan on", "Fan + pump"];
  var C = { ink:"#f5f5f5", muted:"#8b8b8b", grid:"rgba(255,255,255,.07)", accent:"#2a86ff", alert:"#f5a742", bg:"#0a0a0a" };
  var FONT = '11px Inter,"Helvetica Neue",Arial,sans-serif';

  var s = { tick:0, T:32, mode:0, raw:[], flags:[], glitch:0, count:0, nextGlitch:110 };

  function gauss(){
    var u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function median(a){
    var b = a.slice().sort(function(x, y){ return x - y; });
    var m = b.length >> 1;
    return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2;
  }

  function step(){
    s.tick++;
    var load = 16 + 12 * Math.sin(s.tick * 0.006) + 4 * Math.sin(s.tick * 0.021 + 1);
    var teq = 30 + load;
    var coolK = [0, 0.02, 0.05][s.mode];
    s.T += 0.03 * (teq - s.T) - coolK * (s.T - 28) + gauss() * 0.12;

    if(s.tick >= s.nextGlitch){
      s.glitch = (Math.random() < 0.5 ? -1 : 1) * (7 + Math.random() * 5);
      s.nextGlitch = s.tick + 240 + Math.random() * 200;
    }
    var reading = s.T + gauss() * 0.15 + s.glitch;
    s.glitch = 0;

    var flag = false;
    if(s.raw.length >= 11){
      var win = s.raw.slice(-11);
      var med = median(win);
      var mad = median(win.map(function(x){ return Math.abs(x - med); })) * 1.4826;
      flag = Math.abs(reading - med) / Math.max(mad, 0.45) > 5;
    }
    s.raw.push(reading);
    s.flags.push(flag);
    if(flag) s.count++;
    if(s.raw.length > N){ s.raw.shift(); s.flags.shift(); }

    var m = median(s.raw.slice(-3));
    if(s.mode === 0 && m >= FAN_ON) s.mode = 1;
    else if(s.mode === 1){
      if(m >= PUMP_ON) s.mode = 2;
      else if(m <= FAN_OFF) s.mode = 0;
    } else if(s.mode === 2 && m <= PUMP_OFF) s.mode = 1;
  }

  function readouts(){
    var last = s.raw[s.raw.length - 1];
    elTemp.textContent = (last === undefined ? "--" : last.toFixed(1) + " \u00B0C");
    elMode.textContent = MODES[s.mode];
    elMode.className = "v" + (s.mode > 0 ? " on" : "");
    elFlag.textContent = String(s.count);
    elFlag.className = "v" + (s.count > 0 ? " some" : "");
  }

  function draw(){
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if(!w || !h) return;
    var dpr = window.devicePixelRatio || 1;
    var cw = Math.round(w * dpr), ch = Math.round(h * dpr);
    if(canvas.width !== cw || canvas.height !== ch){ canvas.width = cw; canvas.height = ch; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    var padL = 30, padR = 66, padT = 10, padB = 8;
    var pw = w - padL - padR, ph = h - padT - padB;
    function X(i){ return padL + pw * ((N - 1 - (s.raw.length - 1 - i)) / (N - 1)); }
    function Y(v){ return padT + ph * (1 - (v - YMIN) / (YMAX - YMIN)); }

    ctx.globalAlpha = 0.09; ctx.fillStyle = C.accent;
    ctx.fillRect(padL, Y(PUMP_ON), pw, Y(FAN_ON) - Y(PUMP_ON));
    ctx.globalAlpha = 0.2;
    ctx.fillRect(padL, Y(YMAX), pw, Y(PUMP_ON) - Y(YMAX));
    ctx.globalAlpha = 1;

    ctx.font = FONT;
    ctx.textBaseline = "middle";
    ctx.textAlign = "right";
    ctx.lineWidth = 1;
    [30, 40, 50, 60].forEach(function(v){
      ctx.strokeStyle = C.grid;
      ctx.beginPath(); ctx.moveTo(padL, Y(v) + .5); ctx.lineTo(padL + pw, Y(v) + .5); ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.fillText(String(v), padL - 8, Y(v));
    });

    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = "rgba(255,255,255,.4)";
    [[FAN_ON, "Fan " + FAN_ON + "\u00B0"], [PUMP_ON, "Pump " + PUMP_ON + "\u00B0"]].forEach(function(t){
      ctx.beginPath(); ctx.moveTo(padL, Y(t[0]) + .5); ctx.lineTo(padL + pw, Y(t[0]) + .5); ctx.stroke();
      ctx.textAlign = "left"; ctx.fillStyle = C.muted;
      ctx.fillText(t[1], padL + pw + 8, Y(t[0]));
    });
    ctx.setLineDash([]);

    if(s.raw.length > 1){
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.lineJoin = "round";
      ctx.beginPath();
      for(var i = 0; i < s.raw.length; i++){
        var y = Math.max(padT, Math.min(padT + ph, Y(s.raw[i])));
        if(i === 0) ctx.moveTo(X(i), y); else ctx.lineTo(X(i), y);
      }
      ctx.stroke();

      var lastFlag = -1;
      for(var j = 0; j < s.raw.length; j++){
        if(!s.flags[j]) continue;
        lastFlag = j;
        var fy = Math.max(padT + 4, Math.min(padT + ph - 4, Y(s.raw[j])));
        ctx.beginPath(); ctx.arc(X(j), fy, 5, 0, Math.PI * 2);
        ctx.fillStyle = C.bg; ctx.fill();
        ctx.strokeStyle = C.alert; ctx.lineWidth = 2; ctx.stroke();
      }
      if(lastFlag >= 0){
        var ly = Math.max(padT + 4, Math.min(padT + ph - 4, Y(s.raw[lastFlag])));
        var lx = X(lastFlag);
        ctx.fillStyle = C.alert; ctx.textBaseline = "middle";
        if(lx > padL + 110){ ctx.textAlign = "right"; ctx.fillText("glitch flagged", lx - 11, ly); }
        else { ctx.textAlign = "left"; ctx.fillText("glitch flagged", lx + 11, ly); }
      }

      var ey = Math.max(padT, Math.min(padT + ph, Y(s.raw[s.raw.length - 1])));
      ctx.beginPath(); ctx.arc(X(s.raw.length - 1), ey, 4, 0, Math.PI * 2);
      ctx.fillStyle = C.accent; ctx.fill();
    }
  }

  function frame(){ step(); if(s.tick % 4 === 0) readouts(); draw(); }

  for(var k = 0; k < 300; k++) step();
  readouts();

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var userPaused = reduce;
  var visible = true;
  var timer = null;
  function sync(){
    var shouldRun = !userPaused && visible;
    if(shouldRun && !timer){ timer = setInterval(frame, 60); }
    else if(!shouldRun && timer){ clearInterval(timer); timer = null; }
    btnPause.textContent = userPaused ? "Play" : "Pause";
  }
  btnPause.addEventListener("click", function(){ userPaused = !userPaused; sync(); });
  btnGlitch.addEventListener("click", function(){
    s.glitch = (Math.random() < 0.5 ? -1 : 1) * 9;
    if(!timer){ step(); readouts(); draw(); }
  });

  if("IntersectionObserver" in window){
    new IntersectionObserver(function(entries){
      visible = entries[0].isIntersecting;
      sync();
      if(visible) draw();
    }).observe(canvas);
  }
  window.addEventListener("resize", draw);
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(draw);

  draw();
  sync();
})();
