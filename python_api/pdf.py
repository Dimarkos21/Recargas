from flask import Flask, request, jsonify
from flask_cors import CORS
import pdfplumber
import os
import re

app = Flask(__name__)
CORS(app)

def formatear_numero(texto):
    """Extrae el primer número válido de una cadena, manejando comas y puntos."""
    if not texto: return None
    # Busca patrones numéricos (ej: 1.200,50 o 10,00 o 5.50)
    match = re.search(r'(\d+[\.,]?\d*)', str(texto))
    if match:
        num_str = match.group(1).replace(',', '.')
        try:
            return float(num_str)
        except:
            return None
    return None

@app.route('/procesar-lista', methods=['POST'])
def procesar_universal():
    if 'file' not in request.files:
        return jsonify({"error": "No file"}), 400
    
    file = request.files['file']
    path = "temp_upload.pdf"
    file.save(path)
    
    resultado = []
    
    try:
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                table = page.extract_table()
                if not table: continue
                
                # Usamos la primera fila con datos para determinar cuántas columnas hay
                num_columnas = len(table[0])
                contexto_padre = ""

                for row in table:
                    # 1. Limpieza: quitar saltos de línea en cada celda
                    row = [str(c).replace('\n', ' ').strip() if c else "" for c in row]
                    
                    # 2. Ignorar filas totalmente vacías
                    if not any(row): continue
                    
                    # 3. Lógica de Identificación:
                    # Si la última celda no tiene un número, es un TITULO/CATEGORÍA
                    precio = formatear_numero(row[-1])
                    
                    if precio is None:
                        # Si no hay precio al final, esta fila define el contexto (Categoría)
                        # Solo guardamos si la primera celda tiene texto
                        if row[0]: contexto_padre = row[0]
                        continue
                    
                    # 4. Si hay un número al final, es un PRODUCTO
                    resultado.append({
                        "seccion": contexto_padre,
                        "detalle": " | ".join(row[:-1]), # Une todas las columnas previas
                        "valor": precio
                    })
        
        return jsonify(resultado)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(path): os.remove(path)

if __name__ == '__main__':
    app.run(port=5000)