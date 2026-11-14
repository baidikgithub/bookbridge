import type { Photo } from './book';

export type Tab = 'Home' | 'Inventory' | 'Add' | 'Reports' | 'Profile';

export type Route =
  | { name: 'Home' }
  | { name: 'Inventory' }
  | { name: 'Reports' }
  | { name: 'Scan' }
  | { name: 'Review'; isbn?: string; photo?: Photo }
  | { name: 'Detail'; bookId: number }
  | { name: 'Donations' }
  | { name: 'Users' }
  | { name: 'Drives' }
  | { name: 'Profile' }
  | { name: 'DriveBooks'; drive: { id: number; name: string } };

export type Nav = {
  push: (r: Route) => void;
  back: () => void;
  tab: (t: Tab) => void;
};
