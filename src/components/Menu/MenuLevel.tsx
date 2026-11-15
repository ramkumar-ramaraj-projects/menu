import { ChevronLeft } from 'lucide-react';
import { MenuItemRow } from './MenuItemRow';
import type { MenuItem } from './types';

export interface MenuLevelProps {
  items: MenuItem[];
  canGoBack: boolean;
  currentLabel?: string;
  selectedId?: string | null;
  onBack: () => void;
  onOpenGroup: (item: MenuItem) => void;
  onSelectLeaf: (item: MenuItem) => void;
  className?: string;
}

export function MenuLevel({
  items,
  canGoBack,
  currentLabel,
  selectedId,
  onBack,
  onOpenGroup,
  onSelectLeaf,
  className,
}: MenuLevelProps) {
  return (
    <div className={className}>
      {canGoBack ? (
        <button
          type="button"
          data-menu-row
          aria-label={currentLabel ? `Back, currently viewing ${currentLabel}` : 'Back'}
          onClick={onBack}
          className="mt-2 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[15px] transition-colors hover:bg-neutral-100 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
        >
          <ChevronLeft aria-hidden="true" className="size-4 shrink-0" />
          <span className="truncate">
            Back
            {currentLabel ? <span className="text-neutral-400"> · {currentLabel}</span> : null}
          </span>
        </button>
      ) : null}

      <ul className="mt-2 flex flex-col">
        {items.map((item) => (
          <li key={item.id}>
            <MenuItemRow
              item={item}
              isSelected={item.id === selectedId}
              onOpenGroup={onOpenGroup}
              onSelectLeaf={onSelectLeaf}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
