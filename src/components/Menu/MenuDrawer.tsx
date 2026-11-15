import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { X } from 'lucide-react';
import { useScrollLock } from './useScrollLock';
import { CLOSE_DELAY_MS, DISMISS_DISTANCE, DURATION_CLASS } from './animation';

const SHEET_LAYOUT = 'fixed inset-x-2 bottom-2 mx-auto w-[calc(100%-1rem)] max-w-md rounded-2xl';
const DRAWER_LAYOUT = 'lg:inset-x-auto lg:inset-y-0 lg:right-0 lg:left-auto lg:mx-0 lg:w-full lg:max-w-sm lg:rounded-none lg:pt-10';
const PANEL_SURFACE = 'overflow-hidden bg-white p-4 shadow-lg';

export interface MenuDrawerProps {
  id: string;
  open: boolean;
  onRequestClose: () => void;
  onClosed: () => void;
  label: string;
  dragToDismiss: boolean;
  panelRef: RefObject<HTMLDivElement | null>;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  children: ReactNode;
}

export function MenuDrawer({
  id,
  open,
  onRequestClose,
  onClosed,
  label,
  dragToDismiss,
  panelRef,
  onKeyDown,
  children,
}: MenuDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(() => window.innerHeight);

  useLayoutEffect(() => {
    function updateHeight() {
      setViewportHeight(window.visualViewport?.height ?? window.innerHeight);
    }
    updateHeight();
    window.addEventListener('resize', updateHeight);
    window.visualViewport?.addEventListener('resize', updateHeight);
    return () => {
      window.removeEventListener('resize', updateHeight);
      window.visualViewport?.removeEventListener('resize', updateHeight);
    };
  }, []);

  useScrollLock(open);

  useLayoutEffect(() => {
    if (open && scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        dialog.showModal();
        // showModal() auto-focuses the first focusable descendant (the
        // close button) when nothing has `autofocus`. Redirect focus to
        // the panel itself instead — focusing a row here would re-trigger
        // the WebKit scroll-jump bug, so the panel is the neutral target.
        panelRef.current?.focus({ preventScroll: true });
      }
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }

    if (!dialog.open) return;
    setVisible(false);

    const panel = panelRef.current;
    const resolvedMs = panel ? parseFloat(getComputedStyle(panel).transitionDuration) * 1000 : NaN;
    const delayMs = Number.isFinite(resolvedMs) ? resolvedMs : CLOSE_DELAY_MS;

    const timeout = setTimeout(() => {
      if (dialog.open) dialog.close();
      onClosed();
    }, delayMs);
    return () => clearTimeout(timeout);
  }, [open, onClosed, panelRef]);

  function handleDragStart(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragToDismiss) return;
    dragStartY.current = event.clientY;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleDragMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragStartY.current === null) return;
    setDragY(Math.max(0, event.clientY - dragStartY.current));
  }

  function handleDragEnd() {
    if (dragStartY.current === null) return;
    dragStartY.current = null;
    setIsDragging(false);

    const shouldClose = dragY > DISMISS_DISTANCE;
    setDragY(0);
    if (shouldClose) onRequestClose();
  }

  return (
    <dialog
      id={id}
      ref={dialogRef}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault();
        onRequestClose();
      }}
      style={{ height: viewportHeight }}
      className="fixed inset-0 m-0 max-h-none w-full max-w-none border-0 bg-transparent p-0 backdrop:bg-transparent"
    >
      <div
        onClick={onRequestClose}
        className={`fixed inset-0 bg-black/40 transition-opacity ${DURATION_CLASS} ${visible ? 'opacity-100' : 'opacity-0'}`}
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={onKeyDown}
        style={isDragging ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
        className={`${SHEET_LAYOUT} ${DRAWER_LAYOUT} ${PANEL_SURFACE} menu-sheet-transition outline-none ${visible ? 'menu-sheet-visible' : 'menu-sheet-hidden'}`}
      >
        {dragToDismiss ? (
          <div
            aria-hidden="true"
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            onPointerCancel={handleDragEnd}
            className="flex h-3 shrink-0 cursor-grab touch-none items-center justify-center lg:hidden"
          >
            <div className="h-1 w-10 rounded-full bg-neutral-300" />
          </div>
        ) : null}

        <button
          type="button"
          onClick={onRequestClose}
          aria-label="Close menu"
          className="absolute right-3 top-3 rounded-full p-1.5 text-neutral-500 transition hover:bg-neutral-100 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
        >
          <X aria-hidden="true" className="size-4" />
        </button>

        <div
          ref={scrollRef}
          className="max-h-[calc(100svh-5rem)] overflow-y-auto overscroll-contain [overflow-anchor:none] lg:max-h-[calc(100svh-6.5rem)]"
        >
          {children}
        </div>
      </div>
    </dialog>
  );
}
