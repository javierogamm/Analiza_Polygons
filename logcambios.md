# Historial de cambios

## v1.0.0
- Creación inicial de la app estática para dibujar polígonos y convertirlos al formato de Qlik.
- Interfaz con Leaflet y Leaflet.draw para capturar coordenadas.
- Botones para copiar al portapapeles y limpiar el dibujo.
- Documentación básica de uso y despliegue en Vercel.

## v1.0.1
- Ajuste de carga de scripts con `defer` para asegurar que Leaflet y Leaflet.draw inicialicen el mapa correctamente.
- Inicialización del mapa tras `DOMContentLoaded` y mensaje de error cuando el mapa no puede cargarse.
