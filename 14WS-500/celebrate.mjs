// Goal-reached confetti. Vanilla canvas, no dependencies; the canvas removes
// itself when the last piece falls off screen.

const COLORS = ['#f5c542', '#ff6b4a', '#35c1f1', '#7ee081', '#b388ff', '#ffffff'];
const BURSTS = [0, 700, 1500];
const PIECES_PER_BURST = 90;
const GRAVITY = 0.12;
const DRAG = 0.992;
const MAX_DURATION_MS = 7000;

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function createCanvas() {
  const canvas = document.createElement('canvas');
  canvas.className = 'celebration-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  return canvas;
}

function spawn(pieces, width, height) {
  for (let i = 0; i < PIECES_PER_BURST; i += 1) {
    const fromLeft = i % 2 === 0;
    const angle = (fromLeft ? -60 : -120) + (Math.random() - 0.5) * 50;
    const speed = 9 + Math.random() * 9;
    const rad = (angle * Math.PI) / 180;
    pieces.push({
      x: fromLeft ? width * 0.05 : width * 0.95,
      y: height * 0.85,
      vx: Math.cos(rad) * speed,
      vy: Math.sin(rad) * speed,
      size: 6 + Math.random() * 6,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.3,
      wobble: Math.random() * Math.PI * 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });
  }
}

export function celebrate() {
  if (prefersReducedMotion()) return;

  const canvas = createCanvas();
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const ratio = window.devicePixelRatio || 1;
  let width = 0;
  let height = 0;
  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);

  const pieces = [];
  const timers = BURSTS.map((delay) => setTimeout(() => spawn(pieces, width, height), delay));
  const start = performance.now();
  const lastBurstAt = BURSTS[BURSTS.length - 1];

  const finish = () => {
    timers.forEach(clearTimeout);
    window.removeEventListener('resize', resize);
    canvas.remove();
  };

  const frame = (now) => {
    const elapsed = now - start;
    ctx.clearRect(0, 0, width, height);

    for (let i = pieces.length - 1; i >= 0; i -= 1) {
      const p = pieces[i];
      p.vx *= DRAG;
      p.vy = p.vy * DRAG + GRAVITY;
      p.wobble += 0.1;
      p.x += p.vx + Math.sin(p.wobble) * 0.6;
      p.y += p.vy;
      p.rotation += p.spin;
      if (p.y > height + 20) {
        pieces.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      // Scale one axis by the wobble so pieces look like they flip as they fall.
      ctx.scale(1, Math.abs(Math.cos(p.wobble)) * 0.8 + 0.2);
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }

    const allBurstsDone = elapsed > lastBurstAt;
    if ((allBurstsDone && pieces.length === 0) || elapsed > MAX_DURATION_MS) {
      finish();
      return;
    }
    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
}
