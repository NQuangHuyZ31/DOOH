import { ReactNode } from 'react';

export interface AppRoute {
  path: string;
  element: ReactNode;
  key?: string;
  title?: string;
  icon?: ReactNode;
  children?: AppRoute[];
  layout?: 'main' | 'guest';
}
