import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import styles from './HeroField.module.css';

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  accent: boolean;
};

/**
 * The hero visual: a live node field drawn on a 2D canvas.
 *
 * It is a real simulation, not a decoration — every frame recomputes node
 * positions, the proximity graph between them, and how the cursor pushes
 * nearby nodes. Roughly N^2 pair checks per frame; node count is capped and
 * the loop pauses when the canvas is off-screen or the tab is hidden.
 *
 * Under `prefers-reduced-motion` it renders a single static frame and
 * disables both the animation loop and pointer interaction.
 */
export function HeroField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvasNode = canvasRef.current;
    const wrapNode = wrapRef.current;
    if (!canvasNode || !wrapNode) return;
    const ctxNode = canvasNode.getContext('2d');
    if (!ctxNode) return;

    // Non-null aliases so the nested render helpers keep their narrowed types.
    const canvas: HTMLCanvasElement = canvasNode;
    const wrap: HTMLDivElement = wrapNode;
    const ctx: CanvasRenderingContext2D = ctxNode;

    let width = 0;
    let height = 0;
    let nodes: Node[] = [];
    let raf = 0;
    let running = false;

    const pointer = { x: -9999, y: -9999, active: false };

    // Tuning constants (px-based, resolution independent).
    const NODE_DENSITY = 1 / 13000; // nodes per square px
    const MIN_NODES = 24;
    const MAX_NODES = 88;
    const LINK_DIST = 134; // draw an edge between nodes closer than this
    const POINTER_RADIUS = 132; // nodes inside this radius feel the cursor
    const POINTER_PUSH = 0.85;

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    function build() {
      const count = Math.round(
        Math.max(MIN_NODES, Math.min(MAX_NODES, width * height * NODE_DENSITY)),
      );
      nodes = Array.from({ length: count }, () => ({
        x: rand(0, width),
        y: rand(0, height),
        vx: rand(-0.16, 0.16),
        vy: rand(-0.16, 0.16),
        r: rand(0.9, 2.1),
        accent: Math.random() < 0.14,
      }));
    }

    function resize() {
      const rect = wrap.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      if (reduced) drawStatic();
    }

    function step() {
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;

        if (n.x <= 0 || n.x >= width) n.vx *= -1;
        if (n.y <= 0 || n.y >= height) n.vy *= -1;

        if (pointer.active) {
          const dx = n.x - pointer.x;
          const dy = n.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < POINTER_RADIUS * POINTER_RADIUS && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const f = (1 - d / POINTER_RADIUS) * POINTER_PUSH;
            n.x += (dx / d) * f;
            n.y += (dy / d) * f;
          }
        }

        n.x = Math.max(0, Math.min(width, n.x));
        n.y = Math.max(0, Math.min(height, n.y));
      }
    }

    function paint(withPointer: boolean) {
      ctx.clearRect(0, 0, width, height);

      // Proximity graph
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK_DIST * LINK_DIST) {
            const t = 1 - Math.sqrt(d2) / LINK_DIST;
            ctx.strokeStyle = `rgba(244,242,236,${t * 0.14})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }

        if (withPointer && pointer.active) {
          const dx = a.x - pointer.x;
          const dy = a.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < POINTER_RADIUS * POINTER_RADIUS) {
            const t = 1 - Math.sqrt(d2) / POINTER_RADIUS;
            ctx.strokeStyle = `rgba(198,255,85,${t * 0.3})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
          }
        }
      }

      // Nodes
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.accent
          ? 'rgba(198,255,85,0.92)'
          : 'rgba(244,242,236,0.5)';
        ctx.fill();
      }
    }

    function drawStatic() {
      paint(false);
    }

    function loop() {
      if (!running) return;
      step();
      paint(true);
      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (reduced || running) return;
      running = true;
      raf = requestAnimationFrame(loop);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    function onPointerMove(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    }

    function onPointerLeave() {
      pointer.active = false;
    }

    // --- observers ---
    const ro = new ResizeObserver(() => resize());
    ro.observe(wrap);

    let visible = true;
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
        if (visible && !document.hidden) start();
        else stop();
      },
      { threshold: 0.01 },
    );
    io.observe(wrap);

    const onVisibility = () => {
      if (document.hidden || !visible) stop();
      else start();
    };
    document.addEventListener('visibilitychange', onVisibility);

    if (!reduced) {
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerleave', onPointerLeave);
    }

    resize();
    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [reduced]);

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <div className={styles.glow} aria-hidden="true" />
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        aria-hidden="true"
        role="presentation"
      />
      <div className={styles.frame} aria-hidden="true">
        <span className={styles.corner} data-pos="tl" />
        <span className={styles.corner} data-pos="tr" />
        <span className={styles.corner} data-pos="bl" />
        <span className={styles.corner} data-pos="br" />
      </div>
    </div>
  );
}
