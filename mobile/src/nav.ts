import type { Tab } from './components';

export type Route =
  | { name: 'Home' }
  | { name: 'Inventory' }
  | { name: 'Reports' }
  | { name: 'Scan' }
  | { name: 'Review' }
  | { name: 'Detail'; bookId: number };

export type Nav = {
  push: (r: Route) => void;
  back: () => void;
  tab: (t: Tab) => void;
};
