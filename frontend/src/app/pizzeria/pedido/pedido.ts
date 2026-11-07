
import { Component, OnInit } from '@angular/core';
import { Pizza } from '../pizza';
import { Detalle } from '../detalle/detalle';
import { Ventas } from '../ventas/ventas';
import { Pizzeriaapi } from '../pizzeriaapi';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

@Component({
  selector: 'app-pedido',
  imports: [ReactiveFormsModule, Detalle, Ventas],
  templateUrl: './pedido.html',
  styleUrl: './pedido.css'
})
export class Pedido implements OnInit {

  formulario!: FormGroup;
  pizzas: Pizza[] = [];
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private servicio: Pizzeriaapi
  ) {}

  ngOnInit(): void {
    this.formulario = this.fb.group({
      nombre: ['', Validators.required],
      direccion: ['', Validators.required],
      telefono: ['', Validators.required],
      fecha: ['', Validators.required],
      tamano: ['Chica', Validators.required],
      cantidad: [1, [
        Validators.required,
        Validators.min(1)
      ]],
      jamon: [false],
      pina: [false],
      champinones: [false]
    });
  }

  // AGREGAR PIZZA
  agregarPizza(): void {

    const datos = this.formulario.value;

    const precios: Record<string, number> = {
      Chica: 40,
      Mediana: 80,
      Grande: 120
    };

    const ingredientes: string[] = [];

    if (datos.jamon) ingredientes.push('Jamon');
    if (datos.pina) ingredientes.push('Pina');
    if (datos.champinones) ingredientes.push('Champinones');

    const cantidad = Number(datos.cantidad);
    const precioBase = precios[datos.tamano];

    if (
      !Number.isInteger(cantidad) ||
      cantidad <= 0 ||
      precioBase === undefined
    ) {
      alert('Selecciona un tamaño y una cantidad válida');
      return;
    }

    const subtotal =
      (precioBase + ingredientes.length * 10) * cantidad;

    const pizza: Pizza = {
      tamano: datos.tamano,
      ingredientes,
      cantidad,
      subtotal
    };

    this.pizzas.push(pizza);

    console.log('Pizzas agregadas:', this.pizzas);
  }

  // QUITAR PIZZA
  quitarPizza(index: number): void {
    this.pizzas.splice(index, 1);
  }

  // TERMINAR PEDIDO
  terminarPedido(): void {

    if (this.guardando) return;

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      alert('Completa correctamente los datos del cliente');
      return;
    }

    if (this.pizzas.length === 0) {
      alert('Agrega al menos una pizza');
      return;
    }

    const datos = this.formulario.value;

    const pedido = {
      nombre: datos.nombre,
      direccion: datos.direccion,
      telefono: datos.telefono,
      fecha: datos.fecha,
      pizzas: this.pizzas.map(pizza => ({
        tamano: pizza.tamano,
        ingredientes: pizza.ingredientes,
        cantidad: pizza.cantidad
      }))
    };

    this.guardando = true;

    this.servicio.registrarPedido(pedido).subscribe({

      next: (respuesta) => {
        alert(
          'Pedido registrado correctamente. Total: $' +
          respuesta.total
        );

        this.pizzas = [];

        this.formulario.reset({
          nombre: '',
          direccion: '',
          telefono: '',
          fecha: '',
          tamano: 'Chica',
          cantidad: 1,
          jamon: false,
          pina: false,
          champinones: false
        });

        this.guardando = false;
      },

      error: (error) => {
        console.error('Error al registrar pedido:', error);

        alert(
          error.error?.mensaje ||
          'No se pudo registrar el pedido'
        );

        this.guardando = false;
      }

    });
  }
}
