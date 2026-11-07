
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'pizzeria/pedido',
    pathMatch: 'full'
  },
  {
    path: 'pizzeria/pedido',
    loadComponent: () =>
      import('./pizzeria/pedido/pedido')
        .then(m => m.Pedido)
  },
  {
    path: 'pizzeria/ventas',
    loadComponent: () =>
      import('./pizzeria/ventas/ventas')
        .then(m => m.Ventas)
  },
  {
    path: '**',
    redirectTo: 'pizzeria/pedido'
  }
];
