import type { ComponentType } from 'react';

export interface MenuIconProps {
  className?: string;
  strokeWidth?: number | string;
  'aria-hidden'?: boolean | 'true' | 'false';
}

export type MenuIcon = ComponentType<MenuIconProps>;

export interface MenuItem {
  id: string;
  label: string;
  description?: string;
  icon: MenuIcon;
  href?: string;
  disabled?: boolean;
  children?: MenuItem[];
}

export function isGroup(item: MenuItem): item is MenuItem & { children: MenuItem[] } {
  return Array.isArray(item.children) && item.children.length > 0;
}
