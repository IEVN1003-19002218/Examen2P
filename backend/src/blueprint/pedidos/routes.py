
from flask import Blueprint, request, jsonify
from database import mysql
from datetime import date, datetime
from decimal import Decimal

pedidos_bp = Blueprint(
    'pedidos',
    __name__,
    url_prefix='/api/pedidos'
)


# CONVERTIR RESULTADOS MYSQL A JSON
def convertir_valores(registro):
    for clave, valor in registro.items():
        if isinstance(valor, Decimal):
            registro[clave] = float(valor)
        elif isinstance(valor, (date, datetime)):
            registro[clave] = valor.isoformat()

    return registro


def obtener_registros(cursor):
    columnas = [columna[0] for columna in cursor.description]

    return [
        convertir_valores(dict(zip(columnas, fila)))
        for fila in cursor.fetchall()
    ]


# 1. REGISTRAR PEDIDO
@pedidos_bp.route('/', methods=['POST'])
def registrar_pedido():
    cursor = None

    try:
        datos = request.get_json(silent=True)

        if not isinstance(datos, dict):
            return jsonify({
                'mensaje': 'Datos invalidos'
            }), 400

        nombre = datos.get('nombre')
        direccion = datos.get('direccion')
        telefono = datos.get('telefono')
        fecha = datos.get('fecha')
        pizzas = datos.get('pizzas')

        if not all([nombre, direccion, telefono, fecha]):
            return jsonify({
                'mensaje': 'Faltan datos del cliente'
            }), 400

        if not isinstance(pizzas, list) or not pizzas:
            return jsonify({
                'mensaje': 'Agrega al menos una pizza'
            }), 400

        precios = {
            'Chica': 40,
            'Mediana': 80,
            'Grande': 120
        }

        ingredientes_validos = {
            'Jamon', 'Pina', 'Champinones'
        }

        detalles = []
        total = 0

        for pizza in pizzas:
            tamano = pizza.get('tamano')
            ingredientes = pizza.get('ingredientes', [])
            cantidad = pizza.get('cantidad')

            if tamano not in precios:
                return jsonify({
                    'mensaje': 'Tamano no valido'
                }), 400

            if (
                not isinstance(cantidad, int)
                or isinstance(cantidad, bool)
                or cantidad <= 0
            ):
                return jsonify({
                    'mensaje': 'Cantidad no valida'
                }), 400

            if (
                not isinstance(ingredientes, list)
                or any(i not in ingredientes_validos
                       for i in ingredientes)
                or len(ingredientes) != len(set(ingredientes))
            ):
                return jsonify({
                    'mensaje': 'Ingredientes no validos'
                }), 400

            subtotal = (
                precios[tamano] + len(ingredientes) * 10
            ) * cantidad

            detalles.append((
                tamano,
                ', '.join(ingredientes),
                cantidad,
                subtotal
            ))

            total += subtotal

        cursor = mysql.connection.cursor()

        cursor.execute("""
            INSERT INTO pedidos
            (nombre, direccion, telefono, fecha, total)
            VALUES (%s, %s, %s, %s, %s)
        """, (nombre, direccion, telefono, fecha, total))

        id_pedido = cursor.lastrowid

        for tamano, ingredientes, cantidad, subtotal in detalles:
            cursor.execute("""
                INSERT INTO detalle_pedido
                (id_pedido, tamano, ingredientes, cantidad, subtotal)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                id_pedido, tamano, ingredientes,
                cantidad, subtotal
            ))

        mysql.connection.commit()

        return jsonify({
            'mensaje': 'Pedido registrado correctamente',
            'id_pedido': id_pedido,
            'total': total,
            'exito': True
        }), 201

    except Exception as error:
        mysql.connection.rollback()
        print(error)
        return jsonify({
            'mensaje': 'Error al registrar pedido',
            'exito': False
        }), 500

    finally:
        if cursor:
            cursor.close()


# 2. CONSULTAR VENTAS POR DIA
@pedidos_bp.route('/dia/<string:dia>', methods=['GET'])
def ventas_por_dia(dia):

    dias = {
        'lunes': 0,
        'martes': 1,
        'miercoles': 2,
        'jueves': 3,
        'viernes': 4,
        'sabado': 5,
        'domingo': 6
    }

    dia = dia.lower().strip()
    dia = dia.translate(str.maketrans('áéíóú', 'aeiou'))

    if dia not in dias:
        return jsonify({
            'mensaje': 'Dia no valido',
            'exito': False
        }), 400

    cursor = None

    try:
        cursor = mysql.connection.cursor()

        cursor.execute("""
            SELECT id_pedido, nombre, direccion,
                   telefono, fecha, total
            FROM pedidos
            WHERE WEEKDAY(fecha) = %s
            ORDER BY fecha DESC, id_pedido DESC
        """, (dias[dia],))

        ventas = obtener_registros(cursor)
        total = sum(venta['total'] for venta in ventas)

        return jsonify({
            'exito': True,
            'ventas': ventas,
            'total': total
        }), 200

    except Exception as error:
        print(error)
        return jsonify({
            'mensaje': 'Error al consultar ventas por dia',
            'exito': False
        }), 500

    finally:
        if cursor:
            cursor.close()


# 3. CONSULTAR VENTAS POR MES
@pedidos_bp.route('/mes/<string:mes>', methods=['GET'])
def ventas_por_mes(mes):

    meses = {
        'enero': 1,
        'febrero': 2,
        'marzo': 3,
        'abril': 4,
        'mayo': 5,
        'junio': 6,
        'julio': 7,
        'agosto': 8,
        'septiembre': 9,
        'octubre': 10,
        'noviembre': 11,
        'diciembre': 12
    }

    mes = mes.lower().strip()

    if mes not in meses:
        return jsonify({
            'mensaje': 'Mes no valido',
            'exito': False
        }), 400

    cursor = None

    try:
        cursor = mysql.connection.cursor()

        cursor.execute("""
            SELECT id_pedido, nombre, direccion,
                   telefono, fecha, total
            FROM pedidos
            WHERE MONTH(fecha) = %s
            ORDER BY fecha DESC, id_pedido DESC
        """, (meses[mes],))

        ventas = obtener_registros(cursor)
        total = sum(venta['total'] for venta in ventas)

        return jsonify({
            'exito': True,
            'ventas': ventas,
            'total': total
        }), 200

    except Exception as error:
        print(error)
        return jsonify({
            'mensaje': 'Error al consultar ventas por mes',
            'exito': False
        }), 500

    finally:
        if cursor:
            cursor.close()


# 4. CONSULTAR DETALLE DE UNA VENTA
@pedidos_bp.route('/<int:id_pedido>', methods=['GET'])
def detalle_venta(id_pedido):

    cursor = None

    try:
        cursor = mysql.connection.cursor()

        cursor.execute("""
            SELECT id_pedido, nombre, direccion,
                   telefono, fecha, total
            FROM pedidos
            WHERE id_pedido = %s
        """, (id_pedido,))

        pedidos = obtener_registros(cursor)

        if not pedidos:
            return jsonify({
                'mensaje': 'Pedido no encontrado',
                'exito': False
            }), 404

        cursor.execute("""
            SELECT id_detalle, tamano, ingredientes,
                   cantidad, subtotal
            FROM detalle_pedido
            WHERE id_pedido = %s
        """, (id_pedido,))

        pizzas = obtener_registros(cursor)

        return jsonify({
            'exito': True,
            'pedido': pedidos[0],
            'pizzas': pizzas
        }), 200

    except Exception as error:
        print(error)
        return jsonify({
            'mensaje': 'Error al consultar detalle',
            'exito': False
        }), 500

    finally:
        if cursor:
            cursor.close()

# CONSULTAR TODAS LAS VENTAS
@pedidos_bp.route('/todas', methods=['GET'])
def todas_las_ventas():
    cursor = None

    try:
        cursor = mysql.connection.cursor()

        cursor.execute("""
            SELECT id_pedido, nombre, direccion,
                   telefono, fecha, total
            FROM pedidos
            ORDER BY fecha DESC, id_pedido DESC
        """)

        ventas = obtener_registros(cursor)
        total = sum(venta['total'] for venta in ventas)

        return jsonify({
            'exito': True,
            'ventas': ventas,
            'total': total
        }), 200

    except Exception as error:
        print(error)
        return jsonify({
            'mensaje': 'Error al consultar todas las ventas',
            'exito': False
        }), 500

    finally:
        if cursor:
            cursor.close()