import { useEffect, useRef } from "react";

/** Lightweight canvas grid + drifting points — colors follow vault theme CSS variables */
export function ParticleGrid() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!(el instanceof HTMLCanvasElement)) return;
    const canvas = el;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const dots: { x: number; y: number; vx: number; vy: number; a: number }[] = [];

    function readThemeStroke() {
      return getComputedStyle(document.documentElement).getPropertyValue("--particle-grid-line").trim() || "rgba(128,128,128,0.08)";
    }

    function readDotRgb(): string {
      return getComputedStyle(document.documentElement).getPropertyValue("--particle-dot-rgb").trim() || "128,128,128";
    }

    function resize() {
      if (!ctx) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      w = parent.clientWidth;
      h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (dots.length === 0) {
        const n = Math.floor((w * h) / 22000);
        for (let i = 0; i < n; i++) {
          dots.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.15,
            vy: (Math.random() - 0.5) * 0.15,
            a: 0.08 + Math.random() * 0.14,
          });
        }
      }
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    const t0 = performance.now();
    function frame(t: number) {
      if (!ctx) return;
      const elapsed = (t - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = readThemeStroke();
      ctx.lineWidth = 1;
      const step = 48;
      const off = (elapsed * 8) % step;
      for (let x = -step; x < w + step; x += step) {
        ctx.beginPath();
        ctx.moveTo(x + off, 0);
        ctx.lineTo(x + off, h);
        ctx.stroke();
      }
      for (let y = -step; y < h + step; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y + off * 0.6);
        ctx.lineTo(w, y + off * 0.6);
        ctx.stroke();
      }
      const rgb = readDotRgb();
      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;
        ctx.fillStyle = `rgba(${rgb},${d.a})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full opacity-90" aria-hidden />;
}
