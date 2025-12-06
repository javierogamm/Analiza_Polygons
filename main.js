const COORD_PRECISION = 6;

const output = document.getElementById('output');
const copyBtn = document.getElementById('copy-btn');
const copyQlikBtn = document.getElementById('copy-qlik-btn');
const resetBtn = document.getElementById('reset-btn');
const status = document.getElementById('copy-status');
const mapStatus = document.getElementById('map-status');
const visualLog = document.getElementById('visual-log');

let map;
let drawnItems;
let drawControl;
let lastFormatted = '';
let lastPolygons = [];

initMap();
updateOutput();

function initMap() {
  removeExistingMap();

  map = L.map('map', {
    zoomControl: false,
    preferCanvas: true,
    worldCopyJump: true,
  }).setView([40.4168, -3.7038], 6);

  const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    minZoom: 3,
    attribution: '&copy; OpenStreetMap contributors',
    errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
  });

  tiles
    .on('load', () => {
      setMapStatus('Mapa cargado', 'success');
      logMessage('Teselas de OpenStreetMap cargadas correctamente.');
    })
    .on('tileerror', (event) => {
      const { x, y, z } = event.coords || {};
      setMapStatus('Error al cargar mapas', 'error');
      logMessage(`Fallo cargando tesela z:${z} x:${x} y:${y}.`, 'error');
    })
    .addTo(map);

  L.control.zoom({ position: 'topright' }).addTo(map);
  L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);

  drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);

  drawControl = new L.Control.Draw({
    position: 'topright',
    draw: {
      polyline: false,
      rectangle: false,
      circle: false,
      circlemarker: false,
      marker: {
        repeatMode: true,
        title: 'Añadir punto',
      },
      polygon: {
        allowIntersection: false,
        showArea: true,
        drawError: {
          color: '#e11d48',
          message: 'Los vértices no pueden cruzarse.',
        },
        shapeOptions: {
          color: '#2563eb',
          weight: 3,
        },
      },
    },
    edit: {
      featureGroup: drawnItems,
      edit: false,
      remove: true,
    },
  });

  map.addControl(drawControl);
  map.whenReady(() => map.invalidateSize());

  map.on('click', ({ latlng }) => {
    const marker = L.marker(latlng, { title: 'Punto rápido' });
    drawnItems.addLayer(marker);
    logMessage(`Punto añadido en ${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}.`);
    updateOutput();
  });

  map.on(L.Draw.Event.CREATED, ({ layer }) => {
    drawnItems.addLayer(layer);
    const type = layer instanceof L.Polygon ? 'Polígono' : 'Marcador';
    logMessage(`${type} creado y añadido al mapa.`);
    updateOutput();
  });

  map.on(L.Draw.Event.DELETED, () => {
    logMessage('Capas eliminadas del mapa.', 'warn');
    updateOutput();
  });
}

function removeExistingMap() {
  if (map) {
    map.off();
    map.remove();
  }
}

function updateOutput() {
  const { polygons, markers } = collectGeometries();
  lastPolygons = polygons;

  const formatted = formatGeometries(polygons, markers);
  output.textContent = formatted || 'Crea al menos un punto para ver sus coordenadas aquí.';
  lastFormatted = formatted;
  status.textContent = '';
  toggleQlikButton(polygons.length > 0);
}

function formatGeometries(polygons, markers) {
  const blocks = [];
  if (polygons.length) {
    blocks.push(formatPolygonsForWs(polygons));
    blocks.push(formatPolygonsForQlik(polygons));
  }
  if (markers.length) {
    blocks.push(`Puntos:\n${markers.join('\n')}`);
  }

  return blocks.join('\n\n');
}

function collectGeometries() {
  const polygons = [];
  const markers = [];

  drawnItems.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      markers.push(formatMarker(layer));
    } else if (layer instanceof L.Polygon) {
      polygons.push(formatPolygon(layer));
    }
  });

  return { polygons, markers };
}

function formatMarker(layer) {
  const { lat, lng } = layer.getLatLng();
  return `Punto: [${roundCoord(lng)}, ${roundCoord(lat)}]`;
}

function formatPolygon(layer) {
  const latLngs = layer.getLatLngs()[0] || [];
  const closed = ensureClosedPolygon(latLngs);
  return closed.map(({ lat, lng }) => [roundCoord(lng), roundCoord(lat)]);
}

function ensureClosedPolygon(latLngs) {
  if (!latLngs.length) return [];
  const closed = [...latLngs];
  const first = latLngs[0];
  const last = latLngs[latLngs.length - 1];
  if (first.lat !== last.lat || first.lng !== last.lng) {
    closed.push(first);
  }
  return closed;
}

function formatPolygonsForWs(polygons) {
  const formatted = polygons
    .map((coords, index) => {
      const pairs = coords.map(([lng, lat]) => `[${lng}, ${lat}]`).join(', ');
      return polygons.length > 1 ? `Polígono ${index + 1}: ${pairs}` : `Polígono: ${pairs}`;
    })
    .join('\n');

  return `Polígonos (Lng,Lat):\n${formatted}`;
}

function formatPolygonsForQlik(polygons) {
  const formatted = polygons
    .map((coords, index) => {
      const pairs = coords.map(([lng, lat]) => `${lng};${lat}`).join(' | ');
      return polygons.length > 1 ? `Polígono ${index + 1}: ${pairs}` : `Polígono: ${pairs}`;
    })
    .join('\n');

  return `Polígonos (Qlik):\n${formatted}`;
}

function roundCoord(value) {
  return Number(value.toFixed(COORD_PRECISION));
}

copyBtn.addEventListener('click', async () => {
  if (!lastFormatted) return;
  try {
    await navigator.clipboard.writeText(lastFormatted);
    status.textContent = 'Copiado';
    status.style.color = '#16a34a';
    logMessage('Coordenadas copiadas al portapapeles.');
  } catch (error) {
    status.textContent = 'No se pudo copiar';
    status.style.color = '#e11d48';
    logMessage('El navegador no permitió copiar al portapapeles.', 'error');
  }
});

copyQlikBtn.addEventListener('click', async () => {
  const expression = buildQlikExpression(lastPolygons);
  if (!expression) {
    status.textContent = 'Añade un polígono primero';
    status.style.color = '#e11d48';
    logMessage('No hay polígonos para copiar en formato Qlik.', 'warn');
    return;
  }

  try {
    await navigator.clipboard.writeText(expression);
    status.textContent = 'Qlik listo';
    status.style.color = '#16a34a';
    logMessage('Polígono copiado en formato Qlik con corchetes y comas.');
  } catch (error) {
    status.textContent = 'No se pudo copiar';
    status.style.color = '#e11d48';
    logMessage('El navegador no permitió copiar el formato Qlik.', 'error');
  }
});

resetBtn.addEventListener('click', () => {
  drawnItems.clearLayers();
  updateOutput();
  logMessage('Mapa reiniciado: capas limpiadas.');
});

function setMapStatus(message, type) {
  mapStatus.textContent = message;
  mapStatus.style.color = type === 'success' ? '#16a34a' : type === 'error' ? '#e11d48' : '#2563eb';
}

function buildQlikExpression(polygons) {
  if (!polygons.length) return '';

  const formattedPolygons = polygons.map((coords) => {
    const pairs = coords.map(([lng, lat]) => `[${lng},${lat}]`).join(',');
    return `[${pairs}]`;
  });

  return `=\n'[${formattedPolygons.join(',')}]'`;
}

function toggleQlikButton(enabled) {
  if (!copyQlikBtn) return;
  copyQlikBtn.disabled = !enabled;
  copyQlikBtn.title = enabled ? 'Copiar polígonos en formato Qlik' : 'Dibuja un polígono para habilitar la copia Qlik';
}

function logMessage(message, level = 'info') {
  if (!visualLog) return;
  const entry = document.createElement('div');
  entry.className = `log-entry ${level}`;
  const time = new Date().toLocaleTimeString();
  entry.textContent = `${time} · ${message}`;
  visualLog.prepend(entry);

  const maxEntries = 10;
  while (visualLog.children.length > maxEntries) {
    visualLog.removeChild(visualLog.lastChild);
  }
}
