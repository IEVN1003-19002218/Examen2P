import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pizza } from '../pizza';

@Component({
  selector: 'app-detalle',
  imports: [CommonModule],
  templateUrl: './detalle.html',
  styleUrl: './detalle.css'
})
export class Detalle {

  @Input() pizzas: Pizza[] = [];

  @Output() quitar = new EventEmitter<number>();
  @Output() terminar = new EventEmitter<void>();

  quitarPizza(index: number): void {
    this.quitar.emit(index);
  }

  terminarPedido(): void {
    this.terminar.emit();
  }

  get total(): number {
    return this.pizzas.reduce(
      (suma, pizza) => suma + pizza.subtotal, 0
    );
  }
}
