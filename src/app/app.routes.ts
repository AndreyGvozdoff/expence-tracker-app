import { Routes } from '@angular/router';
import {PageNotFoundComponent} from './page-not-found/page-not-found.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./transactionlist/transactionlist.component').then(c => c.TransactionlistComponent)
  },
  { path: '**', component: PageNotFoundComponent },
];
