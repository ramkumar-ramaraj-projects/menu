import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useMenuNavigation } from '../useMenuNavigation';
import type { MenuItem } from '../types';

function Icon() {
  return null;
}

const webApps: MenuItem = { id: 'web-apps', label: 'Web Apps', icon: Icon, href: '#web' };
const products: MenuItem = { id: 'products', label: 'Products', icon: Icon, children: [webApps] };
const home: MenuItem = { id: 'home', label: 'Home', icon: Icon, href: '#home' };
const items: MenuItem[] = [home, products];

describe('useMenuNavigation', () => {
  it('starts at the root level', () => {
    const { result } = renderHook(() => useMenuNavigation(items));
    expect(result.current.depth).toBe(0);
    expect(result.current.items).toBe(items);
    expect(result.current.current).toBeUndefined();
  });

  it('open() drills into a group and shows its children', () => {
    const { result } = renderHook(() => useMenuNavigation(items));

    act(() => result.current.open(products));

    expect(result.current.depth).toBe(1);
    expect(result.current.current?.label).toBe('Products');
    expect(result.current.items).toEqual(products.children);
    expect(result.current.direction).toBe(1);
  });

  it('back() returns to the previous level and sets returnFocusId', () => {
    const { result } = renderHook(() => useMenuNavigation(items));

    act(() => result.current.open(products));
    act(() => result.current.back());

    expect(result.current.depth).toBe(0);
    expect(result.current.items).toBe(items);
    expect(result.current.direction).toBe(-1);
    expect(result.current.returnFocusId).toBe('products');
  });

  it('back() at the root is a no-op', () => {
    const { result } = renderHook(() => useMenuNavigation(items));

    act(() => result.current.back());

    expect(result.current.depth).toBe(0);
    expect(result.current.direction).toBe(1);
    expect(result.current.returnFocusId).toBeNull();
  });

  it('reset() returns to the root from any depth', () => {
    const { result } = renderHook(() => useMenuNavigation(items));

    act(() => result.current.open(products));
    act(() => result.current.reset());

    expect(result.current.depth).toBe(0);
    expect(result.current.trail).toEqual([]);
    expect(result.current.items).toBe(items);
  });

  it('trail accumulates across nested open() calls', () => {
    const grandchild: MenuItem = { id: 'enterprise', label: 'Enterprise', icon: Icon, children: [webApps] };
    const child: MenuItem = { id: 'software', label: 'Software', icon: Icon, children: [grandchild] };
    const root: MenuItem[] = [{ id: 'products', label: 'Products', icon: Icon, children: [child] }];

    const { result } = renderHook(() => useMenuNavigation(root));

    act(() => result.current.open(root[0]));
    act(() => result.current.open(child));

    expect(result.current.depth).toBe(2);
    expect(result.current.trail.map((item: MenuItem) => item.label)).toEqual(['Products', 'Software']);
    expect(result.current.items).toEqual(child.children);
  });
});
