# Analiza Polygons

Aplicación web ligera para dibujar puntos o polígonos sobre un mapa base de OpenStreetMap y obtener las coordenadas listas para compartir. Pensada para despliegues estáticos, por ejemplo en Vercel.

## Uso
1. Abre `index.html` en un entorno estático (Vercel, GitHub Pages o un servidor local simple).
2. Haz clic sobre el mapa para crear puntos rápidos o usa los controles para añadir marcadores y polígonos.
3. Las coordenadas aparecerán en el panel inferior. Copia el bloque generado con **Copiar coordenadas**.
4. Usa **Limpiar mapa** para borrar todas las geometrías y empezar de nuevo.

El mapa utiliza teselas públicas de OpenStreetMap y Leaflet Draw para la creación de geometrías.

## Desarrollo local
No necesita build. Cualquier servidor estático funcionará; por ejemplo:

```bash
python -m http.server 4173
```

Luego abre `http://localhost:4173` en tu navegador.

## Tecnologías
- [Leaflet](https://leafletjs.com/) para el mapa.
- [Leaflet.draw](https://github.com/Leaflet/Leaflet.draw) para la edición de polígonos y marcadores.

## Despliegue en Vercel
Selecciona **Framework Preset: Other** y publica el directorio raíz como proyecto estático. El archivo de entrada es `index.html`.
