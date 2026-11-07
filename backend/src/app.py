from flask import Flask, jsonify
from flask_cors import CORS
from database import mysql
from config import config
from blueprint.pedidos.routes import pedidos_bp
app = Flask(__name__)

# Configurar Flask y MySQL
app.config.from_object(config["development"])

# Permitir conexión desde Angular
CORS(app, resources={
    r"/api/*": {
        "origins": "http://localhost:4200"
    }
})

# Inicializar MySQL
mysql.init_app(app)
app.register_blueprint(pedidos_bp)
# Ruta de prueba
@app.route("/", methods=["GET"])
def inicio():
    return jsonify({
        "mensaje": "API de Pizzeria funcionando",
        "exito": True
    }), 200

# Manejo de error 404
@app.errorhandler(404)
def pagina_no_encontrada(error):
    return jsonify({
        "mensaje": "Ruta no encontrada",
        "exito": False
    }), 404

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)