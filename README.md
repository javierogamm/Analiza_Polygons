# Analiza Polygons

Aplicación web ligera para dibujar polígonos sobre un mapa base de OpenStreetMap y obtener las coordenadas en el formato que acepta Qlik (longitud, latitud). Pensada para despliegues estáticos, por ejemplo en Vercel.

## Uso
1. Abre `index.html` en un entorno estático (Vercel, GitHub Pages o un servidor local simple).
2. Dibuja un polígono con el control "Draw a polygon".
3. Al terminar, las coordenadas aparecerán en el panel inferior en el formato requerido.
4. Usa **Copiar formato Qlik** para llevarte la cadena al portapapeles.

El polígono se cierra automáticamente si el último punto no coincide con el primero, garantizando un anillo válido.

## Desarrollo local
No necesita build. Cualquier servidor estático funcionará; por ejemplo:

```bash
python -m http.server 4173
```

Luego abre `http://localhost:4173` en tu navegador.

## Tecnologías
- [Leaflet](https://leafletjs.com/) para el mapa.
- [Leaflet.draw](https://github.com/Leaflet/Leaflet.draw) para la edición de polígonos.

## Despliegue en Vercel
Selecciona **Framework Preset: Other** y publica el directorio raíz como proyecto estático. El archivo de entrada es `index.html`.
