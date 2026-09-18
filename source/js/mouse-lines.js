(function() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 9998;
    pointer-events: none;
  `;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let w = window.innerWidth;
  let h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;

  // ��ǳ�λ÷� + ӫ��Ч��
  const baseColor = [255, 180, 200];
  const lifetime = 35;
  let points = [];

  window.addEventListener('mousemove', e => {
    points.push({
      x: e.clientX,
      y: e.clientY,
      life: lifetime
    });
  });

  window.addEventListener('mouseout', () => {
    points = [];
  });

  window.addEventListener('resize', () => {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
  });

  function animate() {
    ctx.clearRect(0, 0, w, h);

    points = points.filter(p => p.life > 0);
    points.forEach(p => p.life--);

    if (points.length >= 2) {
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // ӫ�ⷢ��Ч��
      ctx.shadowColor = `rgb(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]})`;
      ctx.shadowBlur = 6;

      for (let i = 1; i < points.length; i++) {
        const p1 = points[i-1];
        const p2 = points[i];
        const opacity = Math.min(p1.life, p2.life) / lifetime;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${opacity * 0.6})`;
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
    }

    requestAnimationFrame(animate);
  }

  animate();
})();