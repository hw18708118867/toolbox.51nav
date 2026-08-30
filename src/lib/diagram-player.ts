/**
 * 教程原理图播放器（渐进增强）
 *
 * 用法：在 Markdown 里给 <figure class="dg-figure"> 加上
 *   data-steps='[{"t":"步骤标题","d":"步骤说明"}, ...]'
 *   data-interval="1900"        // 可选，每步停留毫秒数
 * 并把 SVG 中同一批出现的元素包进 <g data-step="N">（N 从 0 开始）。
 * 带 data-flow 的分组只放连线，激活时会有「流动虚线」效果；
 * 带 dg-pop 类名的分组激活时会有一个轻微放大入场。
 *
 * 未点播放时，整张图保持静态完整可见（对无 JS / 爬虫同样友好）。
 */

interface DiagramStep {
  /** 步骤标题 */
  t: string;
  /** 步骤说明 */
  d: string;
}

/** 尚未开始播放：展示完整静态图 */
const NOT_STARTED = -1;

const ICON = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
  replay:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3.2-6.9"/><path d="M21 3v5h-5"/></svg>',
  full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12h18M12 3v18"/></svg>',
};

function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = '',
  text = ''
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

export function initDiagramPlayers(root: ParentNode = document): void {
  const figures = root.querySelectorAll<HTMLElement>('figure.dg-figure[data-steps]');
  figures.forEach((fig) => setupFigure(fig));
}

function setupFigure(fig: HTMLElement): void {
  if (fig.dataset.playerReady === '1') return;

  let steps: DiagramStep[] = [];
  try {
    const parsed: unknown = JSON.parse(fig.dataset.steps || '[]');
    if (Array.isArray(parsed)) steps = parsed as DiagramStep[];
  } catch {
    return;
  }
  if (!steps.length) return;
  fig.dataset.playerReady = '1';

  const total = steps.length;
  const targets = Array.from(fig.querySelectorAll<SVGElement>('[data-step]'));
  const baseInterval = Number(fig.dataset.interval) || 1800;

  let step = NOT_STARTED;
  let playing = false;
  let speed = 1;
  let timer: number | undefined;

  // ---------- 控制条 ----------
  const bar = h('div', 'dg-bar');

  const playBtn = h('button', 'dg-btn dg-btn-primary');
  playBtn.type = 'button';
  const playIco = h('span', 'dg-ico');
  playIco.innerHTML = ICON.play;
  const playLabel = h('span', 'dg-label', '播放');
  playBtn.append(playIco, playLabel);

  const replayBtn = h('button', 'dg-btn');
  replayBtn.type = 'button';
  const replayIco = h('span', 'dg-ico');
  replayIco.innerHTML = ICON.replay;
  replayBtn.append(replayIco, h('span', 'dg-label', '重播'));

  const fullBtn = h('button', 'dg-btn');
  fullBtn.type = 'button';
  const fullIco = h('span', 'dg-ico');
  fullIco.innerHTML = ICON.full;
  fullBtn.append(fullIco, h('span', 'dg-label', '查看全图'));

  const speedSel = h('select', 'dg-speed');
  speedSel.setAttribute('aria-label', '播放速度');
  [
    ['0.5', '0.5×'],
    ['1', '1×'],
    ['1.5', '1.5×'],
    ['2', '2×'],
  ].forEach(([value, label]) => {
    const opt = h('option', '', label);
    opt.value = value;
    speedSel.append(opt);
  });
  speedSel.value = '1';

  const dots = h('div', 'dg-dots');
  const dotEls = steps.map((s, i) => {
    const dot = h('button', 'dg-dot', String(i + 1));
    dot.type = 'button';
    dot.title = s.t;
    dot.setAttribute('aria-label', `第 ${i + 1} 步：${s.t}`);
    dots.append(dot);
    return dot;
  });

  bar.append(playBtn, replayBtn, fullBtn, speedSel, dots);

  // ---------- 当前步骤说明 ----------
  const cap = h('div', 'dg-step is-off');
  const capHead = h('div', 'dg-step-head');
  const capIdx = h('span', 'dg-step-idx');
  const capTitle = h('span', 'dg-step-title');
  const capDesc = h('p', 'dg-step-desc');
  capHead.append(capIdx, capTitle);
  cap.append(capHead, capDesc);

  const svg = fig.querySelector('svg');
  const anchor = svg ? svg.nextSibling : fig.firstChild;
  fig.insertBefore(cap, anchor);
  fig.insertBefore(bar, anchor);

  // ---------- 状态 ----------
  function clearTimer(): void {
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timer = undefined;
    }
  }

  function apply(): void {
    const animating = step !== NOT_STARTED;
    fig.classList.toggle('is-animating', animating);

    for (const el of targets) {
      const s = Number(el.getAttribute('data-step') || '0');
      el.classList.toggle('is-hidden', animating && s > step);
      el.classList.toggle('is-active', animating && s === step);
      el.classList.toggle('is-done', animating && s < step);
    }

    dotEls.forEach((dot, i) => {
      dot.classList.toggle('is-current', animating && i === step);
      dot.classList.toggle('is-passed', animating && i < step);
      if (animating && i === step) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });

    cap.classList.toggle('is-off', !animating);
    if (animating) {
      const s = steps[step];
      capIdx.textContent = `步骤 ${step + 1} / ${total}`;
      capTitle.textContent = s.t;
      capDesc.textContent = s.d;
    }

    const finished = animating && step >= total - 1;
    playLabel.textContent = playing ? '暂停' : finished ? '重播' : animating ? '继续' : '播放';
    playIco.innerHTML = playing ? ICON.pause : ICON.play;
    playBtn.setAttribute('aria-label', playing ? '暂停播放' : '播放原理动画');
  }

  function goTo(index: number): void {
    step = Math.min(total - 1, Math.max(0, index));
    apply();
  }

  function schedule(): void {
    clearTimer();
    if (!playing) return;
    timer = window.setTimeout(() => {
      if (step >= total - 1) {
        playing = false;
        apply();
        return;
      }
      goTo(step + 1);
      schedule();
    }, Math.max(500, baseInterval / speed));
  }

  function pause(): void {
    playing = false;
    clearTimer();
    apply();
  }

  function play(): void {
    if (step === NOT_STARTED || step >= total - 1) goTo(0);
    playing = true;
    apply();
    schedule();
  }

  function replay(): void {
    goTo(0);
    playing = true;
    apply();
    schedule();
  }

  function showAll(): void {
    playing = false;
    clearTimer();
    step = NOT_STARTED;
    apply();
  }

  playBtn.addEventListener('click', () => (playing ? pause() : play()));
  replayBtn.addEventListener('click', replay);
  fullBtn.addEventListener('click', showAll);
  speedSel.addEventListener('change', () => {
    speed = Number(speedSel.value) || 1;
    if (playing) schedule();
  });
  dotEls.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      pause();
      goTo(i);
    });
  });

  apply();
}
