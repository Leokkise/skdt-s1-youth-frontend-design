import { useEffect, useId, useRef, useState } from 'react';

type Item = { label: string; value: string; color: number; note?: string };
type TooltipState = { title: string; items: Item[] };

export function useAnalyticsTooltip<T extends HTMLElement>() {
  const root = useRef<T>(null);
  const id = useId();
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const open = tooltip !== null;
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => { if (event.target instanceof Node && !root.current?.contains(event.target)) setTooltip(null); };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);
  function show(title: string, items: Item[]) { setTooltip({ title, items }); }
  return { root, id, tooltip, show, hide: () => setTooltip(null) };
}
export function AnalyticsTooltip({ id, value }: { id: string; value: TooltipState | null }) {
  if (!value) return null;
  const titleIsOnlyLabel = value.items.length === 1 && value.items[0].label === value.title;
  return <div id={id} role="tooltip" className="analytics-chart-tooltip analytics-tooltip-docked">
    <div className="analytics-tooltip-content" key={`${value.title}-${value.items.map(item => item.label).join('-')}`}>
      <strong>{value.title}</strong>
      <ul>{value.items.map(item => <li key={item.label}>
        <span className={`demographic-dot demographic-color-${item.color % 16}`} aria-hidden="true" />
        <span className="analytics-detail-copy"><span className="analytics-detail-label">{!titleIsOnlyLabel && item.label}</span>{item.note && <small>{item.note}</small>}</span>
        <b>{item.value}</b>
      </li>)}</ul>
    </div>
  </div>;
}

export function AnalyticsDetails({ chart, hint }: { chart: Pick<ReturnType<typeof useAnalyticsTooltip>, 'id' | 'tooltip'>; hint: string }) {
  return <div className="analytics-details-rail"><AnalyticsTooltip id={chart.id} value={chart.tooltip} />{!chart.tooltip && <p>{hint}<span>Hover a row or chart group, focus it with the keyboard, or tap to inspect.</span></p>}</div>;
}
