import confetti from 'canvas-confetti';

export function triggerConfetti() {
  confetti({
    particleCount: 60,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'],
  });
}
