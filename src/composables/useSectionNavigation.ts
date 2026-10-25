import { onMounted, onBeforeUnmount, ref, type Ref } from 'vue';
export const sections = [{ id: 'hero', label: '首页' }, { id: 'about', label: '关于' }, { id: 'hobbies', label: '兴趣' }, { id: 'mymap', label: '足迹' }, { id: 'chat', label: 'AI' }];
export function useSectionNavigation(root: Ref<HTMLElement | undefined>) {
  const active = ref('hero'), progress = ref('0.0'), time = ref('--:--:--');
  let timer: ReturnType<typeof setInterval>;
  const update = () => {
    const nodes = root.value?.querySelectorAll<HTMLElement>('section[id]');
    nodes?.forEach(node => { if (node.getBoundingClientRect().top <= innerHeight * .45) active.value = node.id; });
    progress.value = (scrollY / Math.max(document.documentElement.scrollHeight - innerHeight, 1) * 100).toFixed(1);
  };
  const tick = () => { time.value = new Date().toLocaleTimeString('en-GB', { hour12: false }); };
  let observer: ResizeObserver | undefined;
  onMounted(() => {
    update(); tick(); timer = setInterval(tick, 1000);
    window.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', update); window.addEventListener('pageshow', update);
    observer = new ResizeObserver(update); if (root.value) observer.observe(root.value);
  });
  onBeforeUnmount(() => { clearInterval(timer); observer?.disconnect(); window.removeEventListener('scroll', update); window.removeEventListener('resize', update); window.removeEventListener('pageshow', update); });
  return { active, progress, time };
}
