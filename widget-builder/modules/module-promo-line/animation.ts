const TRACK_COPIES = 2;

export { TRACK_COPIES };

export function startAnimation(root: HTMLElement, track: HTMLElement, speed: number): void {
  const measure = () => {
    const shiftPx = track.scrollWidth / TRACK_COPIES;
    const rootWidth = root.clientWidth || window.innerWidth || 1;
    const duration = Math.max((shiftPx + rootWidth) / speed, 1) || 20;

    track.style.setProperty('--marquee-shift', `${shiftPx}px`);
    track.style.animation = `marquee-scroll ${duration}s linear infinite`;
  };

  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(measure);
  } else {
    setTimeout(measure, 16);
  }
}
