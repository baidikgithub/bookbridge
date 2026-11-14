import type { Route, Tab, User } from '../types';

export const isAdmin = (user: User) => user.role === 'admin';

// Home is the dashboard. Add starts inventory management (create a book).
const ADMIN_TABS: Tab[] = ['Home', 'Inventory', 'Add', 'Reports', 'Profile'];
const VOLUNTEER_TABS: Tab[] = ['Inventory', 'Reports', 'Profile'];

export const tabsFor = (user: User): Tab[] => (isAdmin(user) ? ADMIN_TABS : VOLUNTEER_TABS);

export const homeTab = (user: User): Tab => (isAdmin(user) ? 'Home' : 'Inventory');

// Volunteers can look through inventory and the other read-only screens.
const VOLUNTEER_ROUTES = new Set<Route['name']>(['Inventory', 'Reports', 'Profile', 'Detail', 'Donations', 'Drives', 'DriveBooks']);

export const canOpen = (user: User, name: Route['name']) => isAdmin(user) || VOLUNTEER_ROUTES.has(name);
