import confetti from 'canvas-confetti';
import tailwindColors from 'tailwindcss/colors';

export const showConfetti = () => {
  const end = Date.now() + 2 * 1000;
  const confettiColors = [
    tailwindColors.sky['700'],
    tailwindColors.fuchsia['700'],
  ];

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 80,
      startVelocity: 50,
      origin: { x: 0 },
      colors: confettiColors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 80,
      startVelocity: 50,
      origin: { x: 1 },
      colors: confettiColors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
};
