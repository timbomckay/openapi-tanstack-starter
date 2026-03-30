import { useCallback, useState } from 'react';

import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface ChartInteraction {
  hiddenKeys: Set<string>;
  hoverKey: string | null;
  toggle: (cssKey: string) => void;
  startHover: (cssKey: string) => void;
  endHover: () => void;
}

export function useChartInteraction(): ChartInteraction {
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());
  const [hoverKey, setHoverKey] = useState<string | null>(null);

  const toggle = useCallback((cssKey: string) => {
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(cssKey)) next.delete(cssKey);
      else next.add(cssKey);
      return next;
    });
  }, []);

  const startHover = useCallback((cssKey: string) => setHoverKey(cssKey), []);
  const endHover = useCallback(() => setHoverKey(null), []);

  return { hiddenKeys, hoverKey, toggle, startHover, endHover };
}

// ---------------------------------------------------------------------------
// Legend component
// ---------------------------------------------------------------------------

export interface LegendEntry {
  cssKey: string;
  label: string;
  color: string;
}

export function InteractiveLegend({
  items,
  hiddenKeys,
  hoverKey,
  onToggle,
  onHoverEnter,
  onHoverLeave,
}: {
  items: LegendEntry[];
  hiddenKeys: Set<string>;
  hoverKey: string | null;
  onToggle?: (cssKey: string) => void;
  onHoverEnter?: (cssKey: string) => void;
  onHoverLeave?: () => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 pt-2">
      {items.map((item) => {
        const isHidden = hiddenKeys.has(item.cssKey);
        const isDimmed = !!hoverKey && hoverKey !== item.cssKey;

        return (
          <button
            key={item.cssKey}
            type="button"
            onClick={() => onToggle?.(item.cssKey)}
            onMouseEnter={() => onHoverEnter?.(item.cssKey)}
            onMouseLeave={() => onHoverLeave?.()}
            className={cn(
              'flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 select-none',
              'text-[0.78rem] text-muted-foreground transition-opacity',
              'hover:text-foreground',
              (isHidden || isDimmed) && 'opacity-40',
            )}
          >
            <span
              className="inline-block size-2.5 shrink-0 rounded-sm transition-all"
              style={
                isHidden
                  ? { border: `2px solid ${item.color}` }
                  : { backgroundColor: item.color }
              }
            />
            <span
              className={cn(
                isHidden && 'line-through decoration-muted-foreground/50',
              )}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
