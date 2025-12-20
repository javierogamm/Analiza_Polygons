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

## v1.12.0
- El importador de GeoJSON conserva el nombre `name` de cada polígono para mostrarlo en el mapa y reutilizarlo en las exportaciones y expresiones IF.
- Los formularios de valores por polígono ahora listan las etiquetas reales para facilitar la asignación de tesauros.

## v1.13.0
- Nuevo interruptor de visibilidad para mostrar u ocultar las etiquetas de nombre directamente sobre el mapa sin perder la información importada.
- El modal de exportación IF permite reutilizar automáticamente los nombres de los polígonos como valores de tesauro, simplificando el flujo cuando ya vienen nombrados.
- Ayuda contextual y campos dinámicos que se ocultan al usar los nombres existentes, manteniendo el formulario enfocado en el tesauro.

## v1.14.0
- Eliminación del sufijo "(simplificado)" en etiquetas y exportaciones para mantener los nombres originales de los polígonos en todos los formatos.
- Nuevos botones para copiar coordenadas o exportar en modo Qlik diferenciando entre versiones simplificadas y completas.
- Opciones duplicadas para generar expresiones IF con polígonos completos o simplificados y vista previa consolidada para ambos modos.

## v1.15.0
- Nuevo modal de exportación Gestiona que genera secciones condicionadas por polígono con campos de referencia y coordenadas configurables.
- Botones dedicados para lanzar la exportación Gestiona en modos simplificado o completo y copiar el código resultante.
- Validaciones equivalentes al flujo IF que permiten reutilizar los nombres de los polígonos como valores de referencia o definirlos manualmente.

## v1.16.0
- Normalización de los nombres de sección en el exportador Gestiona para que se generen en mayúsculas y sin separadores superfluos.
- Limpieza de los valores del selector para quitar tildes y espacios, y aplicar el operador de igualdad sin espacios intermedios.

## v1.17.0
- Nuevo modal de exportación PickMatch para Qlik que reutiliza los valores de polígonos o permite definirlos manualmente en modos simplificado o completo.
- Botones dedicados para lanzar y copiar el PickMatch, con vista previa persistente junto a la del IF y validaciones equivalentes.
- Generación de la expresión PickMatch con formato legible que respeta la sintaxis `Pick(Match(...), coordenadas...)` sin afectar el mapa ni el resto de exportaciones.

## v1.18.0
- Columna lateral de exportación junto al mapa con todos los métodos agrupados primero en versión simplificada y luego completa.
- Nueva exportación a CSV que incluye el nombre del polígono y su geometría compacta lista para pegar en planillas.
- Visibilidad por defecto ajustada para mostrar solo las geometrías simplificadas, manteniendo ocultos los nombres y los polígonos originales al cargar.

## v1.19.0
- La exportación a CSV ahora genera un archivo descargable con nombres y coordenadas en lugar de copiar al portapapeles.
- El botón de dibujar polígonos en el mapa usa un ícono tipo pin para que la herramienta sea reconocible.

## v1.20.0
- Los CSV descargados incluyen el prefijo BOM para forzar la codificación UTF-8 en planillas y evitar caracteres corruptos.

## v1.21.0
- El botón de dibujar polígonos muestra un ícono SVG propio incrustado para que siempre sea visible sobre el mapa.

## v1.22.0
- Botones dedicados para exportar los polígonos como GeoJSON en modos simplificado o completo, listos para reimportar.
- Generación de archivos GeoJSON con el nombre de cada polígono como propiedad y coordenadas cerradas.
- Documentación actualizada para reflejar el nuevo flujo de importación y exportación GeoJSON.

## v1.23.0
- Botones de GeoJSON destacados en la barra lateral que descargan directamente el archivo en el mismo formato de importación.
- Descargas diferenciadas para polígonos simplificados y completos sin pasos intermedios.
- Documentación ajustada para aclarar el formato `FeatureCollection` listo para reimportar.

## v1.24.0
- Botón dedicado para cargar archivos SHP en ZIP desde el equipo y convertirlos a polígonos visibles en el mapa.
- Soporte para importar SHP por capas y registrar el procesamiento en el panel de pasos con shpjs.
- Botón de ejemplo SHP conectado a los ZIP disponibles en `/ejemplosshp` y versión visible en el encabezado.

## v1.25.0
- Control para mantener solo N polígonos aleatorios entre los importados y descartar el resto con un clic.
- Selección sincronizada entre capas simplificadas y originales, manteniendo nombres y centrado del mapa.
- Interfaz actualizada con campo numérico y ayuda contextual para la selección aleatoria.
