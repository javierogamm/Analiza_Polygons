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

## v1.3.0
- Reescritura del script principal para eliminar errores de sintaxis y restaurar la carga del mapa de OpenStreetMap.
- Consolidación de los formateadores de coordenadas para polígonos y puntos con cierre automático de polígonos.
- Mejora de los mensajes de registro para depurar la carga de teselas y las acciones sobre el mapa.
