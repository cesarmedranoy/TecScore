/**
 * Efectos de celebración con canvas-confetti.
 *
 * Funciones simples para disparar animaciones en momentos clave:
 *  - Predicción registrada
 *  - Puntos ganados (bonus, racha)
 *  - Subir de posición en ranking
 *
 * Usa colores de marca TecScore (verde + dorado + naranja).
 */

import confetti from "canvas-confetti";

const BRAND_COLORS = [
  "#15803d", // emerald-700 — primary
  "#22c55e", // green-500
  "#eab308", // yellow-500 — accent
  "#fbbf24", // amber-400
  "#ea580c", // orange-600 — streak
];

/**
 * Confetti general "se registró tu apuesta".
 * Burst desde el centro inferior + lluvia suave por 1.5s.
 */
export function celebratePrediction(): void {
  // Burst central instantáneo
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { x: 0.5, y: 0.7 },
    colors: BRAND_COLORS,
    ticks: 200,
    gravity: 0.9,
    scalar: 1.1,
    zIndex: 9999,
  });

  // Lluvia desde los lados (estilo cancha de fútbol)
  const duration = 1500;
  const end = Date.now() + duration;
  const interval = setInterval(() => {
    if (Date.now() > end) return clearInterval(interval);
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: BRAND_COLORS,
      zIndex: 9999,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: BRAND_COLORS,
      zIndex: 9999,
    });
  }, 200);
}

/**
 * Confetti épico "ganaste bonus de racha".
 * Más grande, dorado, dura más.
 */
export function celebrateStreakBonus(): void {
  const duration = 3000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 6,
      angle: 60,
      spread: 80,
      origin: { x: 0 },
      colors: ["#eab308", "#fbbf24", "#fde047"],
      shapes: ["circle"],
      scalar: 1.2,
      zIndex: 9999,
    });
    confetti({
      particleCount: 6,
      angle: 120,
      spread: 80,
      origin: { x: 1 },
      colors: ["#eab308", "#fbbf24", "#fde047"],
      shapes: ["circle"],
      scalar: 1.2,
      zIndex: 9999,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
