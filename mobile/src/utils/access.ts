import type { Route, Tab, User } from '../types';

export const isAdmin = (user: User) => user.role === 'admin';

// Home is shared. Add (inventory management) and Reports are admin-only.
const ADMIN_TABS: Tab[] = ['Home', 'Inventory', 'Add', 'Reports', 'Profile'];
const VOLUNTEER_TABS: Tab[] = ['Home', 'Inventory', 'Profile'];

export const tabsFor = (user: User): Tab[] => (isAdmin(user) ? ADMIN_TABS : VOLUNTEER_TABS);

export const homeTab = (_user: User): Tab => 'Home';

// Volunteers can look through inventory and the other read-only screens, but not Reports.
const VOLUNTEER_ROUTES = new Set<Route['name']>(['Home', 'Inventory', 'Profile', 'MyBooks', 'Detail', 'Donations', 'Drives', 'DriveBooks']);

export const canOpen = (user: User, name: Route['name']) => isAdmin(user) || VOLUNTEER_ROUTES.has(name);
