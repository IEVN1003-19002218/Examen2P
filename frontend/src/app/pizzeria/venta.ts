import { Pizza } from './pizza';

export interface Venta {
  nombre: string;
  direccion: string;
  telefono: string;
  fecha: string;
  pizzas: Pizza[];
}
