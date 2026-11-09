import { useEffect, useId, useRef, useState } from 'react';
import YouthIcon from '../demo/YouthIcon';

type Props = {
  id: string; name: string; value: string; suggestions: string[]; required?: boolean;
  'aria-invalid'?: boolean; 'aria-describedby'?: string;
  onChange: (value: string) => void;
};
const searchKey = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase().trim();

export default function AddressAutocomplete({ suggestions, onChange, value, ...inputProps }: Props) {
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [active, setActive] = useState(-1);
  const [placement, setPlacement] = useState({ above: false, height: 260 });
  const options = showAll ? suggestions : suggestions.filter(option => searchKey(option).includes(searchKey(value)));
  useEffect(() => { setActive(-1); }, [value, showAll]);
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = root.current?.getBoundingClientRect();
      if (!rect) return;
      const viewport = window.visualViewport;
      const top = viewport?.offsetTop || 0;
      const bottom = top + (viewport?.height || window.innerHeight);
      const below = bottom - rect.bottom - 12;
      const above = rect.top - top - 12;
      const useAbove = below < 180 && above > below;
      setPlacement({ above: useAbove, height: Math.max(80, Math.min(260, useAbove ? above : below)) });
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    window.visualViewport?.addEventListener('resize', place);
    return () => { window.removeEventListener('scroll', place, true); window.removeEventListener('resize', place); window.visualViewport?.removeEventListener('resize', place); };
  }, [open]);
  useEffect(() => { if (active >= 0) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest', behavior: 'instant' }); }, [active, listId]);
  const choose = (option: string) => { onChange(option); setOpen(false); setActive(-1); };
  return <div ref={root} className="address-autocomplete" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) { setOpen(false); setActive(-1); } }}>
    <input {...inputProps} ref={input} type="text" autoComplete="off" value={value} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={listId} aria-activedescendant={open && active >= 0 && active < options.length ? `${listId}-${active}` : undefined}
      onFocus={() => { setOpen(true); setShowAll(false); }}
      onChange={event => { onChange(event.target.value); setShowAll(false); setOpen(true); }}
      onKeyDown={event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault(); setOpen(true);
          if (options.length) setActive(index => event.key === 'ArrowDown' ? (index + 1) % options.length : index <= 0 ? options.length - 1 : index - 1);
        } else if (event.key === 'Enter' && open && active >= 0 && options[active]) { event.preventDefault(); choose(options[active]); }
        else if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); setActive(-1); }
        else if (event.key === 'Tab') { setOpen(false); setActive(-1); }
      }} />
    <button type="button" className="address-suggestions-toggle" aria-label={`Show ${inputProps.id === 'street' ? 'street' : 'subdivision or village'} suggestions`} aria-expanded={open} aria-controls={listId} onPointerDown={event => event.preventDefault()} onClick={() => { const next = !open; input.current?.focus({ preventScroll: true }); setShowAll(true); setActive(-1); setOpen(next); }}><YouthIcon name="chevron" /></button>
    <ul id={listId} role="listbox" aria-label="Talipapa address suggestions" hidden={!open} className={`address-options ${placement.above ? 'opens-above' : ''}`} style={{ maxHeight: placement.height }}>
      {options.length ? options.map((option, index) => <li id={`${listId}-${index}`} key={option} role="option" aria-selected={index === active} onPointerDown={event => event.preventDefault()} onClick={() => choose(option)}>{option}</li>) : <li className="address-no-match" role="presentation">No matching suggestion. You can keep your typed address.</li>}
    </ul>
  </div>;
}
