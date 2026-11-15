import { memo, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { isGroup, type MenuItem } from './types';

export const rowClass =
  'flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-neutral-100 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500';

const selectedRowClass = 'bg-blue-50 text-blue-600';

export interface MenuItemRowProps {
  item: MenuItem;
  isSelected?: boolean;
  onOpenGroup: (item: MenuItem) => void;
  onSelectLeaf: (item: MenuItem) => void;
}

export const MenuItemRow = memo(function MenuItemRow({
  item,
  isSelected = false,
  onOpenGroup,
  onSelectLeaf,
}: MenuItemRowProps) {
  const Icon = item.icon;

  const content: ReactNode = (
    <>
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />

      <span className="min-w-0 flex-1">
        <span className="block text-[15px]">{item.label}</span>
        {item.description ? (
          <span className="mt-0.5 block text-[13px] text-neutral-500">{item.description}</span>
        ) : null}
      </span>

      {isGroup(item) ? (
        <ChevronRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-neutral-400" />
      ) : null}
    </>
  );

  const shared = {
    'data-menu-row': true,
    'data-id': item.id,
    'data-disabled': item.disabled ? 'true' : undefined,
    'aria-current': isSelected ? ('true' as const) : undefined,
    className:
      rowClass + (isSelected ? ` ${selectedRowClass}` : '') + (item.disabled ? ' pointer-events-none opacity-40' : ''),
  };

  if (isGroup(item)) {
    return (
      <button
        type="button"
        disabled={item.disabled}
        aria-haspopup="true"
        onClick={() => onOpenGroup(item)}
        {...shared}
      >
        {content}
      </button>
    );
  }

  if (item.href && !item.disabled) {
    return (
      <a href={item.href} onClick={() => onSelectLeaf(item)} {...shared}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" disabled={item.disabled} onClick={() => onSelectLeaf(item)} {...shared}>
      {content}
    </button>
  );
});
