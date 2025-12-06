# Historial de cambios

## v1.0.0
- Creación inicial de la app estática para dibujar polígonos y convertirlos al formato de Qlik.
- Interfaz con Leaflet y Leaflet.draw para capturar coordenadas.
- Botones para copiar al portapapeles y limpiar el dibujo.
- Documentación básica de uso y despliegue en Vercel.

## v1.0.1
- Ajuste de carga de scripts con `defer` para asegurar que Leaflet y Leaflet.draw inicialicen el mapa correctamente.
- Inicialización del mapa tras `DOMContentLoaded` y mensaje de error cuando el mapa no puede cargarse.

## v1.0.2
- Carga garantizada de Leaflet y Leaflet.draw antes de inicializar el mapa, evitando fallos de renderizado en despliegues estáticos como Vercel.
- Revalidación del tamaño del mapa tras crearlo para asegurar que las teselas de OpenStreetMap se muestren siempre.

## v1.0.3
- Espera activa a que las bibliotecas de Leaflet y Leaflet.draw queden realmente cargadas, incluso si las etiquetas de script ya existen, eliminando pantallas en blanco.
- Revalidación adicional del tamaño del mapa al iniciar y al redimensionar la ventana para evitar contenedores en blanco en despliegues estáticos.
