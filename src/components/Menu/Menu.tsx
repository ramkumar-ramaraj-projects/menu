import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { MenuDrawer } from './MenuDrawer';
import { MenuLevel } from './MenuLevel';
import { useMenuNavigation } from './useMenuNavigation';
import { useMeasuredHeight } from './useMeasuredHeight';
import { DURATION_CLASS, SLIDE_IN_LEFT, SLIDE_IN_RIGHT } from './animation';
import { isGroup, type MenuItem } from './types';

const FOCUSABLE_ROW_SELECTOR = '[data-menu-row]:not([data-disabled="true"])';

export interface MenuProps {
  items: MenuItem[];
  label?: string;
  triggerLabel?: string;
  onSelect?: (item: MenuItem, trail: MenuItem[]) => void;
  closeOnSelect?: boolean;
  dragToDismiss?: boolean;
}

export function Menu({
  items,
  label = 'Main menu',
  triggerLabel = 'Open Menu',
  onSelect,
  closeOnSelect = true,
  dragToDismiss = true,
}: MenuProps) {
  const dialogId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const nav = useMenuNavigation(items);
  const panelRef = useRef<HTMLDivElement>(null);
  const [measureRef, contentHeight] = useMeasuredHeight<HTMLDivElement>();
  const [navigated, setNavigated] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const panelKey = nav.trail.map((group) => group.id).join('/') || 'root';

  const wasOpenRef = useRef(false);
  const suppressRingRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }

    const isFreshOpen = !wasOpenRef.current;
    wasOpenRef.current = true;

    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const returnTarget = nav.returnFocusId
          ? panelRef.current?.querySelector<HTMLElement>(
              `[data-menu-row][data-id="${CSS.escape(nav.returnFocusId)}"]`,
            )
          : null;
        const firstEnabledRow = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_ROW_SELECTOR);
        const target = returnTarget ?? firstEnabledRow;
        target?.focus({ preventScroll: true });

        if (isFreshOpen && target) {
          target.style.boxShadow = 'none';
          suppressRingRef.current = target;
        }
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [isOpen, panelKey, nav.returnFocusId]);

  const handleClosed = useCallback(() => {
    setNavigated(false);
  }, []);

  function handleOpenGroup(item: MenuItem) {
    setNavigated(true);
    nav.open(item);
  }

  function handleBack() {
    setNavigated(true);
    nav.back();
  }

  function handleSelectLeaf(item: MenuItem) {
    setSelectedId(item.id);
    onSelect?.(item, nav.trail);
    if (closeOnSelect) setIsOpen(false);
  }

  function getFocusableRows(): HTMLElement[] {
    return Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_ROW_SELECTOR) ?? []);
  }

  function handlePanelKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (suppressRingRef.current) {
      suppressRingRef.current.style.boxShadow = '';
      suppressRingRef.current = null;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const rows = getFocusableRows();
      const index = rows.indexOf(document.activeElement as HTMLElement);
      if (index === -1) return;

      const next =
        event.key === 'ArrowDown' ? (index + 1) % rows.length : (index - 1 + rows.length) % rows.length;
      rows[next]?.focus();
      event.preventDefault();
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      const rows = getFocusableRows();
      const target = event.key === 'Home' ? rows[0] : rows[rows.length - 1];
      target?.focus();
      event.preventDefault();
      return;
    }

    if (event.key === 'ArrowRight') {
      const itemId = (document.activeElement as HTMLElement)?.dataset.id;
      const item = nav.items.find((candidate) => candidate.id === itemId);
      if (item && isGroup(item)) handleOpenGroup(item);
      event.preventDefault();
      return;
    }

    if (event.key === 'ArrowLeft' && nav.depth > 0) {
      handleBack();
      event.preventDefault();
    }
  }

  const announcement = navigated ? `${nav.current?.label ?? label}, ${nav.items.length} items` : '';

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={dialogId}
        onClick={() => setIsOpen(true)}
        className="rounded-full bg-blue-500 px-4 py-2 text-[15px] text-white shadow-sm transition hover:bg-blue-600 active:scale-[0.97] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
      >
        {triggerLabel}
      </button>

      <MenuDrawer
        id={dialogId}
        open={isOpen}
        onRequestClose={() => setIsOpen(false)}
        onClosed={handleClosed}
        label={label}
        dragToDismiss={dragToDismiss}
        panelRef={panelRef}
        onKeyDown={handlePanelKeyDown}
      >
        <div style={{ height: contentHeight }} className={`overflow-hidden ${navigated ? `transition-[height] ${DURATION_CLASS}` : ''}`} >
          <div ref={measureRef}>
            <MenuLevel
              key={panelKey}
              items={nav.items}
              canGoBack={nav.depth > 0}
              currentLabel={nav.current?.label}
              selectedId={selectedId}
              onBack={handleBack}
              onOpenGroup={handleOpenGroup}
              onSelectLeaf={handleSelectLeaf}
              className={!navigated ? '' : nav.direction === 1 ? SLIDE_IN_RIGHT : SLIDE_IN_LEFT}
            />
          </div>
        </div>

        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </MenuDrawer>
    </>
  );
}
