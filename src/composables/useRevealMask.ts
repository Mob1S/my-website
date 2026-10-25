import { onMounted, onBeforeUnmount, type Ref } from 'vue';

export function useRevealMask(top: Ref<HTMLElement | undefined>, bottom: Ref<HTMLElement | undefined>, suspended: Ref<boolean>, reduced: Ref<boolean>) {
  let frame = 0, disposed = false, path = '', visible = false, suppressed = false;
  let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, angle = 0, previousAngle = Infinity, previousScale = 0, url = '';
  const controller = new AbortController();
  const move = (event: PointerEvent) => {
    visible = event.pointerType !== 'touch'; tx = event.clientX; ty = event.clientY;
    suppressed = !!(event.target as Element)?.closest('.map-container, .chat-terminal, .hero-actions, .nav-vertical');
  };
  const hide = () => { visible = false; };
  const sync = () => { if (bottom.value) bottom.value.style.transform = `translateY(${-scrollY}px)`; };
  function render() {
    if (disposed) return;
    frame = requestAnimationFrame(render);
    const dx = (tx - x) * .08, dy = (ty - y) * .08;
    x += dx; y += dy;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const layer = top.value;
    if (!layer) return;
    const term = layer.querySelector('.chat-terminal')?.getBoundingClientRect();
    const nearTerminal = term && x > term.left - 150 && x < term.right + 150 && y > term.top - 150 && y < term.bottom + 150;
    if (!visible || suspended.value || reduced.value || suppressed || nearTerminal || !path) {
      layer.style.maskImage = 'none'; layer.style.webkitMaskImage = 'none'; return;
    }
    const track = layer.querySelector('.monza-track')?.getBoundingClientRect();
    const scale = track && x >= track.left && x <= track.right && y >= track.top && y <= track.bottom ? .11 : .21;
    if (Math.abs(angle - previousAngle) > .1 || scale !== previousScale) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><g transform="translate(300,300) rotate(${angle}) scale(${scale}) translate(${-237 * 1758 / 300},${-58 * 693 / 118})"><path d="${path}" fill="white"/></g></svg>`;
      url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
      previousAngle = angle; previousScale = scale;
    }
    layer.style.webkitMaskImage = `linear-gradient(black,black),${url}`;
    layer.style.maskImage = `linear-gradient(black,black),${url}`;
    layer.style.webkitMaskComposite = 'xor'; layer.style.maskComposite = 'subtract';
    layer.style.maskSize = layer.style.webkitMaskSize = 'auto,600px 600px';
    layer.style.maskPosition = layer.style.webkitMaskPosition = `0 0,${x - 300}px ${y + scrollY - 300}px`;
    layer.style.maskRepeat = layer.style.webkitMaskRepeat = 'no-repeat';
  }
  onMounted(() => {
    void fetch('/F1_SVG_wb.svg', { signal: controller.signal }).then(r => { if (!r.ok) throw new Error(); return r.text(); }).then(text => { path = text.match(/\bd="([^"]+)"/)?.[1] || ''; }).catch(() => {});
    document.addEventListener('pointermove', move, { passive: true }); document.addEventListener('pointerleave', hide);
    window.addEventListener('scroll', sync, { passive: true }); window.addEventListener('pageshow', sync);
    sync(); frame = requestAnimationFrame(render);
  });
  onBeforeUnmount(() => {
    disposed = true; controller.abort(); cancelAnimationFrame(frame);
    document.removeEventListener('pointermove', move); document.removeEventListener('pointerleave', hide);
    window.removeEventListener('scroll', sync); window.removeEventListener('pageshow', sync);
  });
}
