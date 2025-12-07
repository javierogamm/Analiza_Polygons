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

## v1.4.0
- Nuevo botón dedicado para copiar polígonos en formato Qlik con la expresión exacta `=\n'[[]]'` y separadores por comas.
- Generación automática de la cadena Qlik con coordenadas `longitud,latitud` cerradas, lista para pegar.
- El botón se desactiva sin polígonos para evitar copiar datos incompletos y mantiene el registro de acciones del mapa.

## v1.5.0
- Exportación simplificada: el panel y las copias ahora devuelven únicamente la cadena de coordenadas entre corchetes, con longitud primero y sin textos adicionales.
- La expresión Qlik se formatea en varias líneas para pegar directamente en el destino con la estructura `=\n'[[[lng, lat], ...]]'`.

## v1.6.0
- Reubicación del botón de copia en modo Qlik al encabezado del panel de exportación para distinguirlo claramente del botón de copia estándar.
- Estilo destacado para el botón de Qlik que resalta su propósito y mantiene la interfaz ordenada.

## v1.7.0
- Limitación de la edición a polígonos: se desactivaron los puntos rápidos y marcadores para que cada clic pertenezca a un polígono.
- Exportación numerada: cada polígono se muestra y copia con su etiqueta "Polígono N" y coordenadas entrecomilladas de forma independiente.
- Textos de ayuda y botones actualizados para reflejar el flujo centrado en polígonos y facilitar la exportación.

## v1.8.0
- Nuevo modo de exportación IF para Qlik que solicita el nombre del tesauro y un valor por polígono antes de generar los condicionales anidados.
- Botón dedicado en el panel de exportación que copia la expresión IF manteniendo el mapa y el flujo anterior intactos.

## v1.9.0
- Modal completo para configurar el nombre del tesauro y los valores por polígono antes de exportar el IF de Qlik.
- Vista previa persistente del IF generado debajo del panel de exportación para validar el resultado antes de pegarlo.
- Eliminación del visor de registro del mapa y nuevo marcador de vértices estilo pin de mapas, más grande y visible para dibujar.

## v1.10.0
- Botones para importar GeoJSON (archivo o ejemplo incluido) y pintar automáticamente los polígonos en el mapa existente.
- Simplificación automática de anillos a un máximo de 50 vértices para preservar la forma sin sobrecargar el lienzo.
- Registro visual dedicado que documenta cada paso de la importación, con centrado del mapa y actualización de exportaciones.

## v1.11.0
- El importador asigna automáticamente el nombre de cada polígono a partir de la propiedad `name` (y variantes) del GeoJSON y lo muestra como etiqueta.
- Visualización dual en verde del polígono original y su versión simplificada, con controles para mostrar u ocultar cada tipo desde la interfaz.
- Limpieza del mapa que borra también las capas importadas y mantiene el visor de exportación sincronizado.
