const output = document.getElementById('output');
const copyBtn = document.getElementById('copy-btn');
const resetBtn = document.getElementById('reset-btn');
const status = document.getElementById('copy-status');
const mapStatus = document.getElementById('map-status');
const visualLog = document.getElementById('visual-log');

let map;
let drawnItems;
let drawControl;
let lastFormatted = '';

initMap();

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
  const formatted = formatGeometries();
  output.textContent = formatted || 'Crea al menos un punto para ver sus coordenadas aquí.';
  lastFormatted = formatted;
  status.textContent = '';
}

function formatGeometries() {
  const geometries = [];
  drawnItems.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      geometries.push(formatMarker(layer));
    } else if (layer instanceof L.Polygon) {
      const polygon = formatPolygon(layer);
      if (polygon) geometries.push(polygon);
    }
  });

  return geometries.join('\n\n');
}

function formatMarker(layer) {
  const { lat, lng } = layer.getLatLng();
  return `Punto: [${lng.toFixed(6)}, ${lat.toFixed(6)}]`;
}

function formatPolygon(layer) {
  const latLngs = layer.getLatLngs()[0] || [];
  if (!latLngs.length) return '';

  const closed = ensureClosedPolygon(latLngs);
  const coordinates = closed.map(({ lat, lng }) => [Number(lng.toFixed(6)), Number(lat.toFixed(6))]);
  const qlikFormatted = coordinates.map(([lng, lat]) => `${lng};${lat}`).join(' | ');
  return `Polígono (Qlik): ${qlikFormatted}`;
}

function ensureClosedPolygon(points) {
  if (points.length < 3) return points;
  const first = points[0];
  const last = points[points.length - 1];
  const isClosed = first.lat === last.lat && first.lng === last.lng;
  return isClosed ? points : [...points, first];
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

resetBtn.addEventListener('click', () => {
  drawnItems.clearLayers();
  updateOutput();
  logMessage('Mapa reiniciado: capas limpiadas.');
});

updateOutput();

function setMapStatus(message, type) {
  mapStatus.textContent = message;
  mapStatus.style.color = type === 'success' ? '#16a34a' : type === 'error' ? '#e11d48' : '#2563eb';
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
