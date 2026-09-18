/**
 * SoftPane mouse effects
 * ---------------------------------------------------------------
 *  1. Cursor trail - a tapered ribbon: thick at the cursor, thin at the tail
 *  2. Particle burst on mouse click (left = blue/purple, right = pink/violet)
 *
 *  Everything is drawn on a single canvas that sits above the page but ignores
 *  pointer events, so it never blocks clicks.
 *
 *  Tuning knobs are grouped in CONFIG below.
 */
(function () {
  'use strict';

  var CONFIG = {
    // --- trail ---
    maxPoints: 20,        // how many cursor positions are kept (longer = longer trail)
    headWidth: 7,         // thickness right under the cursor (px)
    tailWidth: 0.2,       // thickness at the far end of the trail
    minStep: 1.6,         // ignore movements smaller than this (px) - smooths jitter
    fadeFrames: 7,        // trail dies within this many frames once the cursor stops

    // --- particles ---
    particleCount: 18,    // particles per click
    particleLife: 46,     // particle lifetime in frames
    particleSpeed: 6.5,   // initial speed (px per frame)

    // --- palette (blue -> purple, matches the site accent #6c7ae0) ---
    trailHead: [124, 140, 255],
    trailTail: [176, 132, 250],
    leftClick: [[108, 122, 224], [139, 122, 224], [165, 180, 252]],
    rightClick: [[232, 132, 200], [176, 132, 250], [124, 140, 255]]
  };

  /* ---------------------------------------------------------------- setup */
  var canvas = document.createElement('canvas');
  canvas.id = 'softpane-cursor-canvas';
  canvas.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;' +
    'z-index:9998;pointer-events:none;';
  document.body.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  if (!ctx) return;   // give up quietly rather than throwing
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var w = 0, h = 0;

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels
  }
  resize();
  window.addEventListener('resize', resize);

  var now = (window.performance && window.performance.now) ? window.performance.now.bind(window.performance) : function () { return Date.now(); };

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- trail */
  var points = [];
  var particles = [];
  var lastX = -1, lastY = -1, lastMove = 0;
  var ribbon = 1;   // overall trail intensity; decays after movement stops

  function rgba(c, a) {
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  }

  function mix(a, b, t) {
    return [
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t)
    ];
  }

  window.addEventListener('mousemove', function (e) {
    var x = e.clientX, y = e.clientY;
    // drop micro-movements so the ribbon stays smooth
    if (lastX >= 0) {
      var dx = x - lastX, dy = y - lastY;
      if (dx * dx + dy * dy < CONFIG.minStep * CONFIG.minStep) return;
    }
    lastX = x; lastY = y;
    lastMove = now();
    ribbon = 1;
    points.push({ x: x, y: y });
    if (points.length > CONFIG.maxPoints) points.shift();
  });

  document.addEventListener('mouseleave', function () { points.length = 0; });

  function drawTrail() {
    if (points.length < 2) return;

    // The trail must feel tied to the cursor: the moment movement stops it
    // shrinks away within a few frames instead of lingering.
    if (now() - lastMove > 55) {
      if (points.length <= 2) { points.length = 0; return; }
      points.shift();
      ribbon /= 1.5;
      if (ribbon < 0.04) { points.length = 0; ribbon = 1; return; }
    }

    var n = points.length;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = rgba(CONFIG.trailHead, 0.55);
    ctx.shadowBlur = 6;

    for (var i = 1; i < n; i++) {
      var t = i / (n - 1);              // 0 = tail, 1 = head
      var a = points[i - 1], b = points[i];

      // thickness grows towards the cursor, opacity follows it
      var width = CONFIG.tailWidth + (CONFIG.headWidth - CONFIG.tailWidth) * Math.pow(t, 1.7);
      var alpha = Math.pow(t, 1.55) * 0.7 * ribbon;

      ctx.beginPath();
      ctx.lineWidth = width;
      ctx.strokeStyle = rgba(mix(CONFIG.trailTail, CONFIG.trailHead, t), alpha);
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ------------------------------------------------------------ particles */
  function burst(x, y, palette) {
    for (var i = 0; i < CONFIG.particleCount; i++) {
      var angle = (Math.PI * 2 * i) / CONFIG.particleCount + Math.random() * 0.6;
      var speed = CONFIG.particleSpeed * (0.45 + Math.random() * 0.85);
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: CONFIG.particleLife * (0.6 + Math.random() * 0.7),
        maxLife: CONFIG.particleLife,
        size: 1.4 + Math.random() * 2.8,
        color: palette[(Math.random() * palette.length) | 0]
      });
    }
    // keep the particle pool bounded
    if (particles.length > 260) particles.splice(0, particles.length - 260);
  }

  window.addEventListener('mousedown', function (e) {
    if (reduceMotion) return;
    // 0 = left button, 2 = right button
    var palette = e.button === 2 ? CONFIG.rightClick : CONFIG.leftClick;
    burst(e.clientX, e.clientY, palette);
  });

  function drawParticles() {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.vy += 0.075;        // slight gravity so they arc instead of floating
      p.vx *= 0.975;        // air drag
      p.vy *= 0.975;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1;

      if (p.life <= 0) { particles.splice(i, 1); continue; }

      var a = Math.min(1, p.life / p.maxLife);
      ctx.beginPath();
      ctx.fillStyle = rgba(p.color, a * 0.9);
      ctx.shadowColor = rgba(p.color, a * 0.7);
      ctx.shadowBlur = 8;
      ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  /* ----------------------------------------------------------------- loop */
  function animate() {
    ctx.clearRect(0, 0, w, h);
    drawTrail();
    drawParticles();
    requestAnimationFrame(animate);
  }
  animate();
})();
