# Historial de cambios

## v1.0.0
- Creación inicial de la app estática para dibujar polígonos y convertirlos al formato de Qlik.
- Interfaz con Leaflet y Leaflet.draw para capturar coordenadas.
- Botones para copiar al portapapeles y limpiar el dibujo.
- Documentación básica de uso y despliegue en Vercel.

## v1.1.0
- Reconstrucción de la interfaz para mostrar el mapa de OpenStreetMap embebido con estado de carga visible.
- Nuevos controles para dibujar puntos rápidos, marcadores y polígonos, con listado consolidado de coordenadas.
- Botones de copia y limpieza actualizados para trabajar con múltiples geometrías.
- Documentación revisada para reflejar el nuevo flujo de captura y exportación.

## v1.2.0
- Sustitución completa de la estrategia de renderizado del mapa con re inicialización segura y control de escala para mejorar la estabilidad en OpenStreetMap.
- Formato de salida específico para Qlik con coordenadas `lon;lat` listas para pegar.
- Registro visual en la interfaz para depurar estados del mapa, carga de teselas y acciones sobre las geometrías.

## v1.2.1
- Correcciones de integridad (SRI) para cargar correctamente los recursos de Leaflet desde CDN.
- Nuevo favicon inline para eliminar el error 404 en navegadores.

## v1.3.0
- Nuevo formato de salida tipo WS con corchetes y comillas para exportar polígonos a Qlik.
- Soporte para exportar múltiples polígonos en un solo bloque y secciones separadas para Qlik y puntos.

## v1.3.1
- Reversión de los cambios de la versión v1.3.0 que rompían la inicialización estable del mapa.
- Se mantiene la corrección de integridad SRI y el favicon inline para evitar bloqueos del CDN y avisos 404.
