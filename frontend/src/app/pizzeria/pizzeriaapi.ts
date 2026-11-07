
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Pizzeriaapi {

  private url = 'http://127.0.0.1:5000/api/pedidos/';

  constructor(private http: HttpClient) {}

  // REGISTRAR PEDIDO
  registrarPedido(datos: any): Observable<any> {
    return this.http.post<any>(this.url, datos);
  }

  // CONSULTAR VENTAS POR DIA
  ventasPorDia(dia: string): Observable<any> {
    return this.http.get<any>(
      this.url + 'dia/' + encodeURIComponent(dia)
    );
  }

  // CONSULTAR VENTAS POR MES
  ventasPorMes(mes: string): Observable<any> {
    return this.http.get<any>(
      this.url + 'mes/' + encodeURIComponent(mes)
    );
  }

  // CONSULTAR DETALLE DE UNA VENTA
  detallePedido(id: number): Observable<any> {
    return this.http.get<any>(
      this.url + id
    );
  }
  // CONSULTAR TODAS LAS VENTAS
todasLasVentas(): Observable<any> {
  return this.http.get<any>(this.url + 'todas');
}
}
