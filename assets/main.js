/* Плавный скролл */
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
let lenis = null;
if (window.Lenis && !reduce) {
  lenis = window.lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
  const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}
/* Шапка и фон главного экрана при прокрутке */
const top_ = document.querySelector(".top");
const heroBg = document.querySelector(".hero-bg");
const onScroll = () => {
  const y = window.scrollY;
  top_.classList.toggle("solid", y > 40 || document.body.dataset.view !== "home");
  if (heroBg && y < innerHeight * 1.2) heroBg.style.transform = `translate3d(0,${y * 0.35}px,0) scale(${1 + y * 0.00012})`;
};
addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* Дым на фоне: точки рождаются внутри полос band() и плывут по полю field() */
(function smoke() {
  const cv = document.getElementById("smoke");
  if (!cv || reduce) return;
  const ctx = cv.getContext("2d", { alpha: false });
  let w, h, parts = [];
  const N = Math.min(9000, Math.round(innerWidth * innerHeight / 140));
  let t = 0;
  const band = (x, y) => {
    const v = Math.sin(x * 0.0032 - y * 0.0052 + t * 0.00018) * 0.6 + Math.sin(x * 0.0011 + y * 0.0019 - t * 0.0001) * 0.4;
    return Math.max(0, v);
  };
  const spawn = p => {
    for (let i = 0; i < 12; i++) {
      p.x = Math.random() * w; p.y = Math.random() * h;
      if (Math.random() < band(p.x, p.y)) break;
    }
    p.life = 160 + Math.random() * 420; p.a = 0.25 + Math.random() * 0.55;
    return p;
  };
  function size() {
    w = cv.width = innerWidth; h = cv.height = innerHeight;
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, w, h);
    parts = Array.from({ length: N }, () => spawn({}));
  }
  size();
  addEventListener("resize", size);
  const field = (x, y, t) =>
    Math.sin(x * 0.0021 + t * 0.00011) * 1.6 + Math.cos(y * 0.0027 - t * 0.00009) * 1.3 + Math.sin((x + y) * 0.0012) * 1.1;
  function frame() {
    t += 16;
    ctx.fillStyle = "rgba(0,0,0,0.05)"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#fff";
    for (const p of parts) {
      const a = field(p.x, p.y, t);
      p.x += Math.cos(a) * 0.4 + 0.22; p.y += Math.sin(a) * 0.4 - 0.14;
      if (--p.life < 0 || p.x < 0 || p.x > w || p.y < 0 || p.y > h) spawn(p);
      const s = band(p.x, p.y);
      ctx.globalAlpha = p.a * s * s * s;
      ctx.fillRect(p.x, p.y, 1, 1);
    }
    ctx.globalAlpha = 1;
    if (!document.hidden) requestAnimationFrame(frame);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) requestAnimationFrame(frame); });
  requestAnimationFrame(frame);
})();

/* Подсветка панелей под курсором */
document.querySelectorAll(".panel").forEach(p => p.addEventListener("pointermove", e => {
  const r = p.getBoundingClientRect();
  p.style.setProperty("--mx", e.clientX - r.left + "px");
  p.style.setProperty("--my", e.clientY - r.top + "px");
}));

/* Вкладки скриншотов */
const frames = document.querySelectorAll(".frame");
const tabs = document.querySelectorAll(".switch button");
tabs.forEach(b => b.addEventListener("click", () => {
  tabs.forEach(t => t.setAttribute("aria-selected", String(t === b)));
  frames.forEach(f => f.classList.toggle("active", f.dataset.frame === b.dataset.frame));
}));

if (window.lucide) lucide.createIcons();
