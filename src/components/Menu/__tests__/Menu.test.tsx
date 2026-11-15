import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Menu } from '../Menu';
import type { MenuItem } from '../types';

function Icon() {
  return null;
}

const items: MenuItem[] = [
  { id: 'home', label: 'Home', icon: Icon, href: '#home' },
  {
    id: 'products',
    label: 'Products',
    icon: Icon,
    children: [
      { id: 'web-apps', label: 'Web Apps', icon: Icon, href: '#web' },
      { id: 'storage', label: 'Storage', icon: Icon, disabled: true },
    ],
  },
  { id: 'contact', label: 'Contact', icon: Icon, href: '#contact' },
];

async function openMenu(onSelect?: (item: MenuItem, trail: MenuItem[]) => void) {
  const user = userEvent.setup();
  render(<Menu items={items} label="Main menu" onSelect={onSelect} />);
  await user.click(screen.getByRole('button', { name: 'Open Menu' }));
  const dialog = await screen.findByRole('dialog', { name: 'Main menu' });
   return { user, dialog };
}

describe('Menu', () => {
  it('opens on trigger click and shows the root items', async () => {
    const { dialog } = await openMenu();
    expect(within(dialog).getByText('Home')).toBeInTheDocument();
    expect(within(dialog).getByText('Products')).toBeInTheDocument();
    expect(within(dialog).getByText('Contact')).toBeInTheDocument();
  });

  it('closes when the backdrop is clicked', async () => {
    const { user, dialog } = await openMenu();
    const backdrop = dialog.firstElementChild as HTMLElement;
    await user.click(backdrop);
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'));
  });

  it('closes on native dialog cancel (Escape)', async () => {
    const { dialog } = await openMenu();
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'));
  });

  it('drills into a submenu and back', async () => {
    const { user, dialog } = await openMenu();
    await user.click(within(dialog).getByText('Products'));
    expect(within(dialog).getByText('Web Apps')).toBeInTheDocument();
    expect(within(dialog).queryByText('Home')).not.toBeInTheDocument();

    await user.click(within(dialog).getByText('Back'));
    expect(within(dialog).getByText('Home')).toBeInTheDocument();
  });

  it('selects a leaf item: calls onSelect with the trail and closes', async () => {
    const onSelect = vi.fn();
    const { user, dialog } = await openMenu(onSelect);

    await user.click(within(dialog).getByText('Products'));
    await user.click(within(dialog).getByText('Web Apps'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    const [item, trail] = onSelect.mock.calls[0] as [MenuItem, MenuItem[]];
    expect(item.label).toBe('Web Apps');
    expect(trail.map((group) => group.label)).toEqual(['Products']);

    await waitFor(() => expect(dialog).not.toHaveAttribute('open'));
  });

  it('does not select disabled items', async () => {
    const onSelect = vi.fn();
    const { user, dialog } = await openMenu(onSelect);

    await user.click(within(dialog).getByText('Products'));
    await user.click(within(dialog).getByText('Storage'));

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('supports arrow-key navigation between rows', async () => {
    const { user, dialog } = await openMenu();
    const home = within(dialog).getByText('Home').closest('[data-menu-row]') as HTMLElement;
    home.focus();
    expect(home).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(within(dialog).getByText('Products').closest('[data-menu-row]')).toHaveFocus();

    await user.keyboard('{End}');
    expect(within(dialog).getByText('Contact').closest('[data-menu-row]')).toHaveFocus();

    await user.keyboard('{Home}');
    expect(home).toHaveFocus();
  });

  it('ArrowRight opens a focused group and ArrowLeft goes back', async () => {
    const { user, dialog } = await openMenu();
    (within(dialog).getByText('Home').closest('[data-menu-row]') as HTMLElement).focus();
    await user.keyboard('{ArrowDown}'); // focus Products
    await user.keyboard('{ArrowRight}');
    expect(within(dialog).getByText('Web Apps')).toBeInTheDocument();
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));

    await user.keyboard('{ArrowLeft}');
    expect(within(dialog).getByText('Products')).toBeInTheDocument();
  });

  it('distinguishes same-label items by id instead of breaking on the duplicate', async () => {
    const onSelect = vi.fn();
    const duplicateLabelItems: MenuItem[] = [
      {
        id: 'team-a',
        label: 'Overview',
        icon: Icon,
        children: [{ id: 'team-a-link', label: 'Team A Link', icon: Icon, href: '#a' }],
      },
      {
        id: 'team-b',
        label: 'Overview',
        icon: Icon,
        children: [{ id: 'team-b-link', label: 'Team B Link', icon: Icon, href: '#b' }],
      },
    ];
    const user = userEvent.setup();
    render(<Menu items={duplicateLabelItems} label="Main menu" onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: 'Open Menu' }));
    const dialog = await screen.findByRole('dialog', { name: 'Main menu' });

    const rows = within(dialog).getAllByText('Overview');
    expect(rows).toHaveLength(2);

    await user.click(rows[1]); // open the second "Overview" (team-b)
    expect(within(dialog).getByText('Team B Link')).toBeInTheDocument();
    expect(within(dialog).queryByText('Team A Link')).not.toBeInTheDocument();

    await user.click(within(dialog).getByText('Team B Link'));
    const [item, trail] = onSelect.mock.calls[0] as [MenuItem, MenuItem[]];
    expect(item.id).toBe('team-b-link');
    expect(trail.map((group) => group.id)).toEqual(['team-b']);
  });
});
