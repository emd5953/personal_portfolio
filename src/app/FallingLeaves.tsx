"use client";

import { useEffect, useRef } from "react";

/* Canvas leaf system — shared by the landing and the career page.
   Pass `spawnAt` to burst extra leaves at a point (used for click bursts). */
export default function FallingLeaves({ spawnAt = null }: { spawnAt?: { x: number; y: number } | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const leavesRef = useRef<{ x: number; y: number; size: number; speed: number; drift: number; rotation: number; rotSpeed: number; opacity: number; color: string }[]>([]);
  const initRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const colors = ["#000000", "#000000", "#000000", "#010101", "#000000", "#020202"];
    const leaves = leavesRef.current;

    function makeLeaf(x: number, y: number) {
      return {
        x, y,
        size: 4 + Math.random() * 8,
        speed: 0.3 + Math.random() * 0.7,
        drift: (Math.random() - 0.5) * 0.5,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        opacity: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    }

    if (!initRef.current) {
      for (let i = 0; i < 25; i++) {
        leaves.push(makeLeaf(Math.random() * canvas.width, Math.random() * canvas.height - canvas.height));
      }
      initRef.current = true;
    }

    // Store makeLeaf on ref so we can use it from the spawn effect
    (canvasRef as unknown as { current: HTMLCanvasElement & { _makeLeaf: typeof makeLeaf } }).current._makeLeaf = makeLeaf;

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      for (let i = leaves.length - 1; i >= 0; i--) {
        const leaf = leaves[i];
        leaf.y += leaf.speed;
        leaf.x += leaf.drift + Math.sin(leaf.y * 0.01) * 0.3;
        leaf.rotation += leaf.rotSpeed;

        if (leaf.y > canvas!.height + 20) {
          if (leaves.length > 25) { leaves.splice(i, 1); continue; }
          leaf.y = -20;
          leaf.x = Math.random() * canvas!.width;
        }
        if (leaf.x > canvas!.width + 20) leaf.x = -20;
        if (leaf.x < -20) leaf.x = canvas!.width + 20;

        ctx!.save();
        ctx!.translate(leaf.x, leaf.y);
        ctx!.rotate(leaf.rotation);
        ctx!.globalAlpha = leaf.opacity;
        ctx!.fillStyle = leaf.color;
        ctx!.beginPath();
        ctx!.ellipse(0, 0, leaf.size * 0.4, leaf.size, 0, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();
      }
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  // Spawn leaves when spawnAt changes
  useEffect(() => {
    if (!spawnAt) return;
    const leaves = leavesRef.current;
    const canvas = canvasRef.current as HTMLCanvasElement & { _makeLeaf?: (x: number, y: number) => typeof leaves[0] };
    if (!canvas?._makeLeaf) return;
    const burst = 8 + Math.floor(Math.random() * 6);
    for (let i = 0; i < burst; i++) {
      leaves.push(canvas._makeLeaf(
        spawnAt.x + (Math.random() - 0.5) * 60,
        spawnAt.y + (Math.random() - 0.5) * 30,
      ));
    }
  }, [spawnAt]);

  return <canvas ref={canvasRef} className="leaf-canvas" style={{ position: "fixed", inset: 0, pointerEvents: "none" }} />;
}
