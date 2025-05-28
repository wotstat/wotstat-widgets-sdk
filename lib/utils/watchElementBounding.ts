type ElementDef =
  | HTMLElement
  | (() => HTMLElement | undefined)
  | string;

export interface BBox {
  width: number;
  height: number;
  x: number;   // absolute page-X (incl. scroll)
  y: number;   // absolute page-Y (incl. scroll)
}

export interface WatchOptions {
  /** ms to debounce callback calls (default: 0) */
  debounce?: number;
  /** ms polling interval for element detection (default: 500) */
  pollInterval?: number;
}

/**
 * Watch an element’s bounding box (width, height, absolute x/y) and
 * invoke `onChange` whenever it changes. Supports pause/resume.
 */
export function watchElementBounding(
  elementDef: ElementDef,
  onChange: (bbox: BBox) => void,
  options: WatchOptions = {}
): { disconnect(): void; pause(): void; resume(): void } {
  let el: HTMLElement | undefined;
  let prev: BBox | null = null;
  let resizeObs: ResizeObserver | null = null;
  let pollId: number;
  let enabled = true;

  const interval = options.pollInterval ?? 500;

  const getElement = (): HTMLElement | undefined => {
    if (typeof elementDef === "string") {
      return document.querySelector<HTMLElement>(elementDef) ?? undefined;
    }
    if (typeof elementDef === "function") {
      return elementDef() ?? undefined;
    }
    return elementDef;
  };

  function readBBox(e: HTMLElement): BBox {
    const rect = e.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
    };
  }

  function debounceFn<T extends (...args: any[]) => void>(fn: T, wait: number): T {
    let timeout: number | undefined;
    return ((...args: any[]) => {
      if (timeout != null) window.clearTimeout(timeout);
      timeout = window.setTimeout(() => fn(...args), wait);
    }) as T;
  }

  function checkAndNotify() {
    if (!el) return;
    const cur = readBBox(el);
    if (
      !prev ||
      cur.width !== prev.width ||
      cur.height !== prev.height ||
      cur.x !== prev.x ||
      cur.y !== prev.y
    ) {
      prev = cur;
      onChange(cur);
    }
  }

  const trigger = options.debounce
    ? debounceFn(checkAndNotify, options.debounce)
    : checkAndNotify;

  function initWatcher() {
    const found = getElement();
    if (!found) return;
    if (found !== el) {
      if (resizeObs) {
        resizeObs.disconnect();
        resizeObs = null;
      }
      el = found;
      prev = null;
      if (typeof ResizeObserver !== "undefined") {
        resizeObs = new ResizeObserver(trigger);
        resizeObs.observe(el);
      } else {
        console.warn(
          "ResizeObserver not supported; size changes won’t be observed automatically."
        );
      }
      // initial check
      trigger();
    }
  }

  const scrollHandler = () => trigger();
  const resizeHandler = () => trigger();

  function startWatching() {
    initWatcher();
    pollId = window.setInterval(initWatcher, interval);
    window.addEventListener("scroll", scrollHandler, { passive: true });
    window.addEventListener("resize", resizeHandler);
  }

  function stopWatching() {
    if (pollId) window.clearInterval(pollId);
    window.removeEventListener("scroll", scrollHandler);
    window.removeEventListener("resize", resizeHandler);
    if (resizeObs) {
      resizeObs.disconnect();
      resizeObs = null;
    }
  }

  // begin on load
  startWatching();

  return {
    /** Stop all watching permanently */
    disconnect() {
      stopWatching();
      el = undefined;
      prev = null;
    },
    /** Temporarily pause observing (can resume) */
    pause() {
      if (!enabled) return;
      enabled = false;
      stopWatching();
    },
    /** Resume observing after a pause */
    resume() {
      if (enabled) return
      enabled = true;
      if (el) {
        // re-observe existing element
        if (typeof ResizeObserver !== "undefined") {
          resizeObs = new ResizeObserver(trigger);
          resizeObs.observe(el);
        }
        trigger();
      }
      // restart polling and listeners
      startWatching();
    },
  };
}
