import { useEffect, useRef } from "react";

/**
 * Minimalist high-tech wave background.
 *
 * - Dense grid of small light-violet dots (#D8BFD8)
 * - Horizontal left-to-right data-stream motion
 * - Vertical undulation via layered sine waves
 * - Dots vary in opacity (0.3 → 0.8) based on their phase in the wave
 * - Intended to sit behind hero content (z-index: -1) with a soft blend
 *
 * Fills its parent container (expects parent to size it).
 */
const WaveDotsBackground = ({
  dotColor = "#D8BFD8",
  spacing = 20,
  dotRadius = 1.3,
  speed = 0.25, // pixels per frame — slow & steady
}) => {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;
    let t = 0; // horizontal phase offset (advances each frame)

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      // Two superposed sine waves → organic feel
      const amp1 = height * 0.18;
      const amp2 = height * 0.09;
      const freq1 = (Math.PI * 2) / (width * 1.2);
      const freq2 = (Math.PI * 2) / (width * 0.55);

      // Columns & rows counts
      const cols = Math.ceil(width / spacing) + 2;
      const rows = Math.ceil(height / spacing) + 2;
      const baseY = height * 0.55; // wave settles a bit below mid — not dead-centered

      for (let cx = 0; cx < cols; cx++) {
        const x = cx * spacing;
        // Two layered waves produce irregular, organic undulation
        const waveY =
          baseY +
          Math.sin(x * freq1 + t * 0.012) * amp1 +
          Math.sin(x * freq2 - t * 0.018) * amp2;

        for (let ry = 0; ry < rows; ry++) {
          const y = ry * spacing;
          // Distance from the undulating spine → controls opacity (depth band)
          const dist = Math.abs(y - waveY);
          // Feather falloff — dots inside ±140px are visible; outside fade to 0
          const band = 140;
          if (dist > band) continue;

          // Normalise 0..1 then map to 0.3..0.8
          const falloff = 1 - dist / band; // 1 near spine, 0 at edge
          // Add a subtle traveling brightness pulse
          const pulse = 0.5 + 0.5 * Math.sin((x - t) * 0.012);
          const opacity = 0.3 + 0.5 * falloff * pulse;

          ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
          ctx.fillStyle = dotColor;
          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      t += speed * 60; // frame-time independent drift rate, L→R
      rafRef.current = requestAnimationFrame(render);
    };

    resize();
    const handleResize = () => resize();
    window.addEventListener("resize", handleResize);
    // Honour user reduced-motion preference
    const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!prefersReduced) {
      rafRef.current = requestAnimationFrame(render);
    } else {
      // Static single frame for accessibility
      render();
      cancelAnimationFrame(rafRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [dotColor, spacing, dotRadius, speed]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      data-testid="wave-dots-bg-canvas"
      aria-hidden="true"
      style={{ mixBlendMode: "normal" }}
    />
  );
};

export default WaveDotsBackground;
