
import {
  Component,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { timeout } from 'rxjs';
import { Pizzeriaapi } from '../pizzeriaapi';

@Component({
  selector: 'app-ventas',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ventas.html',
  styleUrl: './ventas.css'
})
export class Ventas {

  formulario: FormGroup;

  ventas: any[] = [];
  pizzasDetalle: any[] = [];
  pedidoSeleccionado: any = null;

  total = 0;
  cargando = false;
  mensaje = '';
  tipoReporte = '';

  constructor(
    private fb: FormBuilder,
    private servicio: Pizzeriaapi,
    private cdr: ChangeDetectorRef
  ) {
    this.formulario = this.fb.group({
      tipo: ['dia', Validators.required],
      dia: ['sabado'],
      mes: ['noviembre']
    });
  }

  // PREPARAR CONSULTA
  private prepararConsulta(): void {
    this.cargando = true;
    this.mensaje = '';
    this.ventas = [];
    this.total = 0;
    this.pedidoSeleccionado = null;
    this.pizzasDetalle = [];
  }

  // ACTUALIZAR RESULTADOS
  private actualizarResultados(respuesta: any): void {

    this.ventas = respuesta.ventas || [];
    this.total = Number(respuesta.total || 0);
    this.cargando = false;

    if (this.ventas.length === 0) {
      this.mensaje = 'No se encontraron ventas';
    }

    this.cdr.detectChanges();
  }

  // MANEJAR ERRORES
  private mostrarError(error: any): void {

    console.error('Error en consulta:', error);

    this.mensaje = 'No se pudieron consultar las ventas';
    this.cargando = false;

    this.cdr.detectChanges();
  }

  // CONSULTAR POR DIA O MES
  consultarVentas(): void {

    if (this.cargando) return;

    const datos = this.formulario.value;

    this.tipoReporte = datos.tipo === 'dia'
      ? 'Ventas del día: ' + datos.dia
      : 'Ventas del mes: ' + datos.mes;

    this.prepararConsulta();

    const consulta = datos.tipo === 'dia'
      ? this.servicio.ventasPorDia(datos.dia)
      : this.servicio.ventasPorMes(datos.mes);

    consulta.pipe(
      timeout(10000)
    ).subscribe({
      next: (respuesta) => {
        this.actualizarResultados(respuesta);
      },
      error: (error) => {
        this.mostrarError(error);
      }
    });
  }

  // CONSULTAR TODAS LAS VENTAS
  consultarTodas(): void {

    if (this.cargando) return;

    this.tipoReporte = 'Todas las ventas';

    this.prepararConsulta();

    this.servicio.todasLasVentas()
      .pipe(timeout(10000))
      .subscribe({
        next: (respuesta) => {
          this.actualizarResultados(respuesta);
        },
        error: (error) => {
          this.mostrarError(error);
        }
      });
  }

  // VER DETALLE DE UNA VENTA
  verDetalle(id: number): void {

    this.mensaje = '';

    this.servicio.detallePedido(id)
      .pipe(timeout(10000))
      .subscribe({
        next: (respuesta) => {

          this.pedidoSeleccionado = respuesta.pedido;
          this.pizzasDetalle = respuesta.pizzas || [];

          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error(error);

          this.mensaje = 'No se pudo consultar el detalle';

          this.cdr.detectChanges();
        }
      });
  }

  // CERRAR DETALLE
  cerrarDetalle(): void {

    this.pedidoSeleccionado = null;
    this.pizzasDetalle = [];

    this.cdr.detectChanges();
  }
}
