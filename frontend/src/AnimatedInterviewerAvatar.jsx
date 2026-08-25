import { useEffect, useRef } from "react";
import bundledAishaJordanInterviewer from "./assets/aisha-jordan-interviewer.jpg";

const STATE_COPY = {
  idle: "Ready when you are",
  speaking: "Speaking",
  listening: "Listening",
  thinking: "Reviewing your answer",
  encouraging: "Follow-up coaching",
};

function coverGeometry(imageWidth, imageHeight, width, height, scaleBoost = 1, offsetX = 0, offsetY = 0) {
  const scale = Math.max(width / imageWidth, height / imageHeight) * scaleBoost;
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  return {
    x: (width - drawWidth) / 2 + offsetX,
    y: (height - drawHeight) / 2 + offsetY,
    width: drawWidth,
    height: drawHeight,
    scale,
  };
}

function drawMouthMotion(context, image, geometry, time) {
  const sourceX = image.naturalWidth * 0.43;
  const sourceY = image.naturalHeight * 0.415;
  const sourceWidth = image.naturalWidth * 0.20;
  const sourceHeight = image.naturalHeight * 0.11;

  const destinationX = geometry.x + sourceX * geometry.scale;
  const destinationY = geometry.y + sourceY * geometry.scale;
  const destinationWidth = sourceWidth * geometry.scale;
  const destinationHeight = sourceHeight * geometry.scale;

  const speechWave = (Math.sin(time / 86) + Math.sin(time / 137 + 1.1) + 2) / 4;
  const verticalScale = 1 + speechWave * 0.075;
  const horizontalScale = 1 - speechWave * 0.018;
  const animatedWidth = destinationWidth * horizontalScale;
  const animatedHeight = destinationHeight * verticalScale;
  const animatedX = destinationX + (destinationWidth - animatedWidth) / 2;
  const animatedY = destinationY + (destinationHeight - animatedHeight) / 2 + speechWave * 0.7;

  context.save();
  context.beginPath();
  context.ellipse(
    destinationX + destinationWidth / 2,
    destinationY + destinationHeight / 2,
    destinationWidth * 0.48,
    destinationHeight * 0.48,
    0,
    0,
    Math.PI * 2,
  );
  context.clip();
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    animatedX,
    animatedY,
    animatedWidth,
    animatedHeight,
  );
  context.restore();
}

export default function AnimatedInterviewerAvatar({ state = "idle", name = "Aisha Jordan", reducedMotion = false }) {
  const safeState = STATE_COPY[state] ? state : "idle";
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const image = new Image();
    image.decoding = "async";
    image.src = bundledAishaJordanInterviewer;

    let frameId = 0;
    let active = true;
    let resizeObserver = null;
    const prefersReducedMotion = reducedMotion || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    const paint = (time = performance.now()) => {
      if (!active || !image.naturalWidth || !image.naturalHeight) return;

      const parent = canvas.parentElement;
      const width = Math.max(1, canvas.clientWidth || parent?.clientWidth || 1);
      const height = Math.max(1, canvas.clientHeight || parent?.clientHeight || 1);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const targetWidth = Math.round(width * pixelRatio);
      const targetHeight = Math.round(height * pixelRatio);

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      const context = canvas.getContext("2d", { alpha: false });
      if (!context) return;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      let scaleBoost = 1.01;
      let offsetX = 0;
      let offsetY = 0;

      if (!prefersReducedMotion) {
        if (safeState === "speaking") {
          scaleBoost = 1.012 + Math.sin(time / 760) * 0.0025;
          offsetX = Math.sin(time / 1120) * 0.7;
          offsetY = Math.sin(time / 690) * 0.55;
        } else if (safeState === "listening") {
          scaleBoost = 1.011 + Math.sin(time / 1600) * 0.0015;
          offsetY = Math.sin(time / 1450) * 0.7;
        } else if (safeState === "encouraging") {
          offsetY = Math.sin(time / 240) * 1.1;
        }
      }

      const geometry = coverGeometry(image.naturalWidth, image.naturalHeight, width, height, scaleBoost, offsetX, offsetY);
      context.drawImage(image, geometry.x, geometry.y, geometry.width, geometry.height);

      if (!prefersReducedMotion && safeState === "speaking") {
        drawMouthMotion(context, image, geometry, time);
      }
    };

    const animate = (time) => {
      paint(time);
      if (active && !prefersReducedMotion && ["speaking", "listening", "encouraging"].includes(safeState)) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    const start = () => {
      window.cancelAnimationFrame(frameId);
      paint();
      if (!prefersReducedMotion && ["speaking", "listening", "encouraging"].includes(safeState)) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    image.onload = start;
    if (image.complete && image.naturalWidth) start();

    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => paint());
      resizeObserver.observe(canvas.parentElement || canvas);
    } else {
      window.addEventListener("resize", paint);
    }

    return () => {
      active = false;
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      if (!window.ResizeObserver) window.removeEventListener("resize", paint);
    };
  }, [safeState, reducedMotion]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`aisha-interviewer-canvas state-${safeState}`}
        role="img"
        aria-label={`${name}, virtual interviewer, ${STATE_COPY[safeState]}`}
      />
      <div className="aisha-photo-vignette" aria-hidden="true" />
      <div className={`aisha-speaking-glow state-${safeState}`} aria-hidden="true" />
      <div className={`avatar-state-pill state-${safeState}`}>
        <span className="avatar-state-dot" />
        <strong>{STATE_COPY[safeState]}</strong>
      </div>
    </>
  );
}
