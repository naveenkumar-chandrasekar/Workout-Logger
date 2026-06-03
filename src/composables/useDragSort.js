/**
 * useDragSort — reorder a list via mouse drag or touch drag.
 *
 * Usage:
 *   const { dragIdx, overIdx, handlers } = useDragSort(
 *     () => myList.value,
 *     (reordered) => { myList.value = reordered }
 *   );
 *
 *   In template on each item:
 *     v-bind="handlers(index)"
 *     :class="{ dragging: dragIdx === index, dragover: overIdx === index }"
 */
import { ref } from 'vue';

export function useDragSort(getList, setList) {
  const dragIdx  = ref(null);
  const overIdx  = ref(null);

  // ── commit: apply reorder ────────────────────────────────────────────────
  function commit(from, to) {
    if (from === null || to === null || from === to) {
      dragIdx.value = null;
      overIdx.value = null;
      return;
    }
    const items  = [...getList()];
    const [item] = items.splice(from, 1);
    items.splice(to, 0, item);
    setList(items);
    dragIdx.value = null;
    overIdx.value = null;
  }

  // ── Mouse / pointer drag (works on desktop) ──────────────────────────────
  function onDragStart(e, idx) {
    dragIdx.value = idx;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
    // dim the element slightly after a tick so the drag ghost looks normal
    requestAnimationFrame(() => {
      if (e.target) e.target.style.opacity = '0.4';
    });
  }

  function onDragOver(e, idx) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    overIdx.value = idx;
  }

  function onDrop(e, idx) {
    e.preventDefault();
    if (e.target) e.target.style.opacity = '';
    commit(dragIdx.value, idx);
  }

  function onDragEnd(e) {
    if (e.target) e.target.style.opacity = '';
    dragIdx.value = null;
    overIdx.value = null;
  }

  // ── Touch drag (mobile) ──────────────────────────────────────────────────
  let touchStartY    = 0;
  let touchItemH     = 48; // fallback row height
  let scrollEl       = null;
  let autoScrollRaf  = null;

  function onTouchStart(e, idx, el) {
    dragIdx.value = idx;
    touchStartY   = e.touches[0].clientY;
    if (el) touchItemH = el.getBoundingClientRect().height || 48;
    // find nearest scrollable ancestor
    scrollEl = findScrollParent(el);
  }

  function onTouchMove(e, idx) {
    if (dragIdx.value === null) return;
    e.preventDefault(); // stop page scroll while dragging

    const y     = e.touches[0].clientY;
    const delta = y - touchStartY;
    const shift = Math.round(delta / touchItemH);
    overIdx.value = Math.max(0, Math.min(getList().length - 1, dragIdx.value + shift));

    // auto-scroll if near edges of scroll container
    if (scrollEl) {
      const rect = scrollEl.getBoundingClientRect();
      const ZONE = 60;
      cancelAnimationFrame(autoScrollRaf);
      if (y < rect.top + ZONE)         autoScroll(scrollEl, -6);
      else if (y > rect.bottom - ZONE) autoScroll(scrollEl,  6);
    }
  }

  function onTouchEnd() {
    cancelAnimationFrame(autoScrollRaf);
    commit(dragIdx.value, overIdx.value ?? dragIdx.value);
  }

  function autoScroll(el, speed) {
    el.scrollTop += speed;
    autoScrollRaf = requestAnimationFrame(() => autoScroll(el, speed));
  }

  function findScrollParent(el) {
    if (!el) return null;
    let p = el.parentElement;
    while (p) {
      const { overflow, overflowY } = getComputedStyle(p);
      if (/auto|scroll/.test(overflow + overflowY)) return p;
      p = p.parentElement;
    }
    return null;
  }

  // ── Convenience: returns all event bindings for one item ─────────────────
  function handlers(idx, elRef) {
    return {
      draggable: true,
      onDragstart: (e) => onDragStart(e, idx),
      onDragover:  (e) => onDragOver(e, idx),
      onDrop:      (e) => onDrop(e, idx),
      onDragend:   (e) => onDragEnd(e),
      onTouchstart:(e) => onTouchStart(e, idx, elRef?.value ?? e.currentTarget),
      onTouchmove: (e) => onTouchMove(e, idx),
      onTouchend:  ()  => onTouchEnd(),
    };
  }

  return { dragIdx, overIdx, handlers };
}
