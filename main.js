const COORD_PRECISION = 6;
const IMPORT_ORIGINAL_STYLE = { color: '#16a34a', weight: 2, fillOpacity: 0.1 };
const IMPORT_SIMPLIFIED_STYLE = { color: '#16a34a', weight: 3, fillOpacity: 0.2 };

const output = document.getElementById('output');
const copyBtn = document.getElementById('copy-btn');
const copyCompleteBtn = document.getElementById('copy-complete-btn');
const copyHeroSimplifiedBtn = document.getElementById('copy-hero-simplified');
const copyHeroCompleteBtn = document.getElementById('copy-hero-complete');
const copyQlikSimplifiedBtn = document.getElementById('copy-qlik-simplified-btn');
const copyQlikCompleteBtn = document.getElementById('copy-qlik-complete-btn');
const copyIfSimplifiedBtn = document.getElementById('copy-if-simplified-btn');
const copyIfCompleteBtn = document.getElementById('copy-if-complete-btn');
const resetBtn = document.getElementById('reset-btn');
const status = document.getElementById('copy-status');
const mapStatus = document.getElementById('map-status');
const ifPreview = document.getElementById('if-preview');
const ifModal = document.getElementById('if-modal');
const ifModalClose = document.getElementById('if-modal-close');
const ifCancel = document.getElementById('if-cancel');
const ifForm = document.getElementById('if-form');
const thesaurusNameInput = document.getElementById('thesaurus-name');
const polygonValuesContainer = document.getElementById('polygon-values');
const polygonValuesHelper = document.getElementById('polygon-values-helper');
const usePolygonNamesCheckbox = document.getElementById('use-polygon-names');
const visualLog = document.getElementById('visual-log');
const importBtn = document.getElementById('import-btn');
const importExampleBtn = document.getElementById('import-example-btn');
const geoJsonInput = document.getElementById('geojson-input');
const toggleOriginalCheckbox = document.getElementById('toggle-original');
const toggleSimplifiedCheckbox = document.getElementById('toggle-simplified');
const toggleNamesCheckbox = document.getElementById('toggle-names');

const MAX_IMPORT_POINTS = 50;

let map;
let drawnItems;
let importedOriginalGroup;
let importedSimplifiedGroup;
let drawControl;
let lastFormatted = '';
let lastPolygons = { simplified: [], original: [] };
let lastIfExpression = { simplified: '', original: '' };
let currentIfMode = 'simplified';

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

  importedOriginalGroup = new L.LayerGroup();
  importedSimplifiedGroup = new L.LayerGroup();
  map.addLayer(importedOriginalGroup);
  map.addLayer(importedSimplifiedGroup);
  applyOriginalVisibility();
  applySimplifiedVisibility();
  applyNameVisibility();

  drawControl = new L.Control.Draw({
    position: 'topright',
    draw: {
      polyline: false,
      rectangle: false,
      circle: false,
      circlemarker: false,
      marker: false,
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

  map.on(L.Draw.Event.CREATED, ({ layer }) => {
    drawnItems.addLayer(layer);
    const type = layer instanceof L.Polygon ? 'Polígono' : 'Capa';
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
  const simplifiedPolygons = collectGeometries('simplified');
  const originalPolygons = collectGeometries('original');
  lastPolygons = { simplified: simplifiedPolygons, original: originalPolygons };
  const hasPolygons = simplifiedPolygons.length > 0 || originalPolygons.length > 0;

  if (!hasPolygons) {
    lastIfExpression = { simplified: '', original: '' };
  }

  const formatted = formatGeometries(simplifiedPolygons);
  output.textContent = formatted || 'Crea al menos un polígono para ver sus coordenadas aquí.';
  lastFormatted = formatted;
  status.textContent = '';
  toggleExportButtons(hasPolygons);
  refreshIfPreview();
}

function formatGeometries(polygons) {
  if (!polygons.length) return '';
  const pretty = true;

  return polygons
    .map(({ coords, name }, index) => {
      const polygonLabel = buildPolygonLabel(name, index);
      const serialized = buildPolygonString(coords, { pretty });
      return `${polygonLabel}:\n${serialized}`;
    })
    .join('\n\n');
}

function collectGeometries(mode = 'simplified') {
  const polygons = [];
  const targetGroup = mode === 'original' ? importedOriginalGroup : importedSimplifiedGroup;

  const collect = (layer) => {
    if (layer instanceof L.Polygon) {
      polygons.push({ coords: formatPolygon(layer), name: getPolygonName(layer) });
    }
  };

  drawnItems.eachLayer(collect);
  targetGroup?.eachLayer(collect);

  return polygons;
}

function formatPolygon(layer) {
  const latLngs = layer.getLatLngs()[0] || [];
  const closed = ensureClosedPolygon(latLngs);
  return closed.map(({ lat, lng }) => [roundCoord(lng), roundCoord(lat)]);
}

function getPolygonName(layer) {
  if (!layer || typeof layer.polygonName !== 'string') return '';
  return layer.polygonName;
}

function setPolygonName(layer, name) {
  if (!layer || !name) return;
  layer.polygonName = name;
}

function buildPolygonLabel(name, index) {
  if (typeof name === 'string' && name.trim()) {
    return name.trim();
  }
  return `Polígono ${index + 1}`;
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

function roundCoord(value) {
  return Number(value.toFixed(COORD_PRECISION));
}

async function importGeoJsonFromUrl(url, label = 'GeoJSON remoto') {
  try {
    logMessage(`Importando GeoJSON desde ${label}...`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    processGeoJsonData(data, label);
  } catch (error) {
    logMessage(`No se pudo importar ${label}: ${error.message}`, 'error');
  }
}

function importGeoJsonFromFile(file) {
  logMessage(`Importando archivo ${file.name}...`);
  const reader = new FileReader();

  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      processGeoJsonData(data, file.name);
    } catch (error) {
      logMessage(`El archivo ${file.name} no es un GeoJSON válido: ${error.message}`, 'error');
    }
  };

  reader.onerror = () => {
    logMessage(`Error al leer ${file.name}: ${reader.error?.message || 'desconocido'}`, 'error');
  };

  reader.readAsText(file);
}

function processGeoJsonData(data, label = 'GeoJSON') {
  const polygons = extractPolygons(data);
  if (!polygons.length) {
    logMessage(`No se encontraron polígonos en ${label}.`, 'warn');
    return;
  }

  const addedSimplifiedLayers = [];
  const addedOriginalLayers = [];

  polygons.forEach(({ rings, name }, index) => {
    const polygonName = name || `Polígono ${index + 1}`;
    const simplifiedRings = rings.map((ring) => reducePoints(ring, MAX_IMPORT_POINTS));

    const originalLayer = L.polygon(rings, IMPORT_ORIGINAL_STYLE);
    const simplifiedLayer = L.polygon(simplifiedRings, IMPORT_SIMPLIFIED_STYLE);

    setPolygonName(originalLayer, polygonName);
    setPolygonName(simplifiedLayer, polygonName);

    attachPolygonName(originalLayer, polygonName);
    attachPolygonName(simplifiedLayer, polygonName);

    importedOriginalGroup.addLayer(originalLayer);
    importedSimplifiedGroup.addLayer(simplifiedLayer);

    addedOriginalLayers.push(originalLayer);
    addedSimplifiedLayers.push(simplifiedLayer);

    const originalPoints = rings[0]?.length || 0;
    const simplifiedPoints = simplifiedRings[0]?.length || 0;
    if (simplifiedPoints < originalPoints) {
      logMessage(
        `${polygonName} simplificado de ${originalPoints} a ${simplifiedPoints} puntos.`,
        'info'
      );
    }

    logMessage(`${polygonName} importado desde ${label}.`);
  });

  if (addedSimplifiedLayers.length) {
    const group = L.featureGroup([...addedSimplifiedLayers, ...addedOriginalLayers]);
    map.fitBounds(group.getBounds(), { padding: [20, 20] });
    updateOutput();
    applyOriginalVisibility();
    applySimplifiedVisibility();
    logMessage(`Se añadieron ${addedSimplifiedLayers.length} polígonos desde ${label}.`);
  }
}

function extractPolygons(geojson) {
  const polygons = [];

  const addPolygon = (coords, name) => {
    if (!Array.isArray(coords) || !coords.length) return;
    const rings = coords
      .map((ring) => toLatLngRing(ring))
      .filter((ring) => ring && ring.length);
    if (rings.length) polygons.push({ rings, name });
  };

  const handleGeometry = (geometry, properties) => {
    if (!geometry || !geometry.type) return;
    const { type, coordinates } = geometry;
    if (!coordinates) return;

    const name = deriveName(properties);

    switch (type) {
      case 'Polygon':
        addPolygon(coordinates, name);
        break;
      case 'MultiPolygon':
        coordinates.forEach((polygonCoords) => addPolygon(polygonCoords, name));
        break;
      default:
        logMessage(`Geometría ${type} omitida: solo se importan polígonos.`, 'warn');
    }
  };

  if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
    geojson.features.forEach((feature) => handleGeometry(feature.geometry, feature.properties));
  } else if (geojson.type === 'Feature') {
    handleGeometry(geojson.geometry, geojson.properties);
  } else {
    handleGeometry(geojson);
  }

  return polygons;
}

function toLatLngRing(ring) {
  if (!Array.isArray(ring)) return null;
  const latLngs = ring
    .map((point) => {
      const [lng, lat] = point || [];
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { lat, lng };
    })
    .filter(Boolean);
  return ensureClosedPolygon(latLngs);
}

function reducePoints(ring, maxPoints) {
  if (!ring.length) return ring;
  const closedRing = ensureClosedPolygon(ring);

  if (closedRing.length <= maxPoints) return closedRing;

  const openRing = closedRing.slice(0, -1);
  const target = Math.max(2, maxPoints - 1);
  const sampled = [];

  for (let i = 0; i < target; i += 1) {
    const idx = Math.round((i * (openRing.length - 1)) / (target - 1));
    sampled.push(openRing[idx]);
  }

  sampled.push(sampled[0]);
  return sampled;
}

function deriveName(properties) {
  if (!properties || typeof properties !== 'object') return '';
  const candidates = ['name', 'Name', 'nombre', 'Nombre', 'title', 'Title'];

  for (const key of candidates) {
    const value = properties[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

function attachPolygonName(layer, name) {
  if (!name) return;
  setPolygonName(layer, name);
  layer.bindTooltip(name, {
    permanent: true,
    direction: 'center',
    className: 'polygon-label',
    opacity: 0.95,
  });
}

function applyOriginalVisibility() {
  if (!map || !importedOriginalGroup) return;
  const visible = toggleOriginalCheckbox?.checked !== false;
  if (visible) {
    if (!map.hasLayer(importedOriginalGroup)) {
      map.addLayer(importedOriginalGroup);
    }
  } else if (map.hasLayer(importedOriginalGroup)) {
    map.removeLayer(importedOriginalGroup);
  }
}

function applySimplifiedVisibility() {
  if (!map || !importedSimplifiedGroup) return;
  const visible = toggleSimplifiedCheckbox?.checked !== false;
  if (visible) {
    if (!map.hasLayer(importedSimplifiedGroup)) {
      map.addLayer(importedSimplifiedGroup);
    }
  } else if (map.hasLayer(importedSimplifiedGroup)) {
    map.removeLayer(importedSimplifiedGroup);
  }
}

function applyNameVisibility() {
  if (!map) return;
  const visible = toggleNamesCheckbox?.checked !== false;
  const container = map.getContainer?.();
  if (!container) return;
  container.classList.toggle('hide-polygon-names', !visible);
}

function getModeLabel(mode = 'simplified') {
  return mode === 'original' ? 'completo' : 'simplificado';
}

function getPolygonsByMode(mode = 'simplified') {
  if (!lastPolygons || typeof lastPolygons !== 'object') return [];
  return lastPolygons[mode] || [];
}

function setStatus(message, type = 'info') {
  if (!status) return;
  status.textContent = message;
  status.style.color = type === 'success' ? '#16a34a' : type === 'error' ? '#e11d48' : '#2563eb';
}

async function copyFormattedPolygons(mode = 'simplified') {
  const polygons = getPolygonsByMode(mode);
  if (!polygons.length) {
    setStatus('Añade un polígono primero', 'error');
    logMessage('No hay polígonos para copiar coordenadas.', 'warn');
    return;
  }

  const formatted = formatGeometries(polygons);
  if (!formatted) return;

  try {
    await navigator.clipboard.writeText(formatted);
    setStatus(`Copiado (${getModeLabel(mode)})`, 'success');
    logMessage(`Coordenadas copiadas en modo ${getModeLabel(mode)}.`);
  } catch (error) {
    setStatus('No se pudo copiar', 'error');
    logMessage('El navegador no permitió copiar al portapapeles.', 'error');
  }
}

async function copyQlikExport(mode = 'simplified') {
  const polygons = getPolygonsByMode(mode);
  const expression = buildPolygonsExport(polygons);
  if (!expression) {
    setStatus('Añade un polígono primero', 'error');
    logMessage('No hay polígonos para copiar en formato Qlik.', 'warn');
    return;
  }

  try {
    await navigator.clipboard.writeText(expression);
    setStatus(`Exportado (${getModeLabel(mode)})`, 'success');
    logMessage(`Polígonos copiados en formato Qlik (${getModeLabel(mode)}).`);
  } catch (error) {
    setStatus('No se pudo copiar', 'error');
    logMessage('El navegador no permitió copiar el formato Qlik.', 'error');
  }
}

const copyActions = [
  { element: copyBtn, mode: 'simplified', handler: copyFormattedPolygons },
  { element: copyCompleteBtn, mode: 'original', handler: copyFormattedPolygons },
  { element: copyHeroSimplifiedBtn, mode: 'simplified', handler: copyFormattedPolygons },
  { element: copyHeroCompleteBtn, mode: 'original', handler: copyFormattedPolygons },
  { element: copyQlikSimplifiedBtn, mode: 'simplified', handler: copyQlikExport },
  { element: copyQlikCompleteBtn, mode: 'original', handler: copyQlikExport },
];

copyActions.forEach(({ element, mode, handler }) => {
  element?.addEventListener('click', () => handler(mode));
});

copyIfSimplifiedBtn?.addEventListener('click', () => openIfModal('simplified'));
copyIfCompleteBtn?.addEventListener('click', () => openIfModal('original'));

resetBtn.addEventListener('click', () => {
  drawnItems.clearLayers();
  importedOriginalGroup?.clearLayers();
  importedSimplifiedGroup?.clearLayers();
  updateOutput();
  logMessage('Mapa reiniciado: capas limpiadas.');
});

importBtn?.addEventListener('click', () => {
  geoJsonInput?.click();
  logMessage('Selector de archivo GeoJSON abierto.');
});

geoJsonInput?.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  importGeoJsonFromFile(file);
  event.target.value = '';
});

importExampleBtn?.addEventListener('click', () => {
  importGeoJsonFromUrl('ejemplos/ejemplo.geojson', 'ejemplo.geojson');
});

toggleOriginalCheckbox?.addEventListener('change', applyOriginalVisibility);
toggleSimplifiedCheckbox?.addEventListener('change', applySimplifiedVisibility);
toggleNamesCheckbox?.addEventListener('change', applyNameVisibility);
usePolygonNamesCheckbox?.addEventListener('change', updatePolygonValueVisibility);

ifModalClose?.addEventListener('click', closeIfModal);
ifCancel?.addEventListener('click', closeIfModal);

ifModal?.addEventListener('click', (event) => {
  if (event.target === ifModal) {
    closeIfModal();
  }
});

ifForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const polygons = getPolygonsByMode(currentIfMode);
  if (!polygons.length) {
    status.textContent = 'Añade un polígono primero';
    status.style.color = '#e11d48';
    logMessage('No hay polígonos para generar condicionales IF.', 'warn');
    closeIfModal();
    return;
  }

  const thesaurusName = thesaurusNameInput?.value.trim();
  if (!thesaurusName) {
    status.textContent = 'Nombre de tesauro requerido';
    status.style.color = '#e11d48';
    logMessage('Falta el nombre del tesauro para generar el IF.', 'warn');
    return;
  }

  const usePolygonNames = usePolygonNamesCheckbox?.checked;
  const values = usePolygonNames ? derivePolygonNameValues(currentIfMode) : collectPolygonValues();
  if (!values) return;

  const expression = buildConditionalIfExport(thesaurusName, polygons, values);

  try {
    await navigator.clipboard.writeText(expression);
    status.textContent = `IF Qlik (${getModeLabel(currentIfMode)}) exportado`;
    status.style.color = '#16a34a';
    lastIfExpression[currentIfMode] = expression;
    refreshIfPreview();
    closeIfModal();
    logMessage(`Expresión IF de Qlik copiada en modo ${getModeLabel(currentIfMode)}.`);
  } catch (error) {
    status.textContent = 'No se pudo copiar';
    status.style.color = '#e11d48';
    logMessage('El navegador no permitió copiar el IF de Qlik.', 'error');
  }
});

function setMapStatus(message, type) {
  mapStatus.textContent = message;
  mapStatus.style.color = type === 'success' ? '#16a34a' : type === 'error' ? '#e11d48' : '#2563eb';
}

function buildPolygonsExport(polygons) {
  const pretty = true;
  if (!polygons.length) return '';

  return polygons
    .map(({ coords, name }, index) => {
      const label = buildPolygonLabel(name, index);
      const serialized = buildPolygonString(coords, { pretty });
      return `${label}: ${serialized}`;
    })
    .join('\n');
}

function buildPolygonString(coords, options = {}) {
  const { pretty = false } = options;
  const separator = pretty ? ',\n  ' : ',';
  const pairs = coords.map(([lng, lat]) => `[${lng}, ${lat}]`).join(separator);
  const wrapped = `[[${pairs}]]`;
  return `'${wrapped}'`;
}

function buildConditionalIfExport(thesaurusName, polygons, values) {
  if (!polygons.length || polygons.length !== values.length) return '';
  const pretty = true;

  const clauses = polygons.map(({ coords }, index) => {
    const serialized = buildPolygonString(coords, { pretty });
    return `IF(${thesaurusName} ='${values[index]}', ${serialized}`;
  });

  const closing = ')'.repeat(clauses.length);
  const joined = clauses
    .map((clause, index) => `${clause}${index < clauses.length - 1 ? ',' : ''}`)
    .join('\n');

  return `${joined}${closing}`;
}

function toggleExportButtons(enabled) {
  const buttons = [
    copyBtn,
    copyCompleteBtn,
    copyHeroSimplifiedBtn,
    copyHeroCompleteBtn,
    copyQlikSimplifiedBtn,
    copyQlikCompleteBtn,
    copyIfSimplifiedBtn,
    copyIfCompleteBtn,
  ];

  buttons.forEach((btn) => {
    if (!btn) return;
    btn.disabled = !enabled;
    const defaultTitle = btn.dataset.defaultTitle || btn.title || '';
    if (!btn.dataset.defaultTitle) {
      btn.dataset.defaultTitle = defaultTitle;
    }

    btn.title = enabled ? btn.dataset.defaultTitle : 'Dibuja o importa polígonos para habilitar las exportaciones';
  });
}

function openIfModal(mode = 'simplified') {
  currentIfMode = mode;
  const polygons = getPolygonsByMode(mode);
  if (!polygons.length) {
    status.textContent = 'Añade un polígono primero';
    status.style.color = '#e11d48';
    logMessage('No hay polígonos para generar condicionales IF.', 'warn');
    return;
  }

  renderPolygonValueInputs(mode);
  updatePolygonValueVisibility();
  ifModal?.setAttribute('aria-hidden', 'false');
  ifModal?.classList.add('open');
  thesaurusNameInput?.focus();
}

function closeIfModal() {
  ifModal?.setAttribute('aria-hidden', 'true');
  ifModal?.classList.remove('open');
  ifForm?.reset();
}

function renderPolygonValueInputs(mode = 'simplified') {
  if (!polygonValuesContainer) return;
  polygonValuesContainer.innerHTML = '';

  const polygons = getPolygonsByMode(mode);

  polygons.forEach(({ name }, index) => {
    const label = buildPolygonLabel(name, index);
    const wrapper = document.createElement('label');
    wrapper.className = 'field';

    const span = document.createElement('span');
    span.textContent = `Valor para ${label}`;

    const input = document.createElement('input');
    input.type = 'text';
    input.required = true;
    input.name = `polygon-${index + 1}`;
    input.placeholder = `Tesauro ${label}`;
    input.dataset.label = label;

    wrapper.appendChild(span);
    wrapper.appendChild(input);
    polygonValuesContainer.appendChild(wrapper);
  });
}

function updatePolygonValueVisibility() {
  if (!polygonValuesContainer || !polygonValuesHelper) return;
  const usingNames = usePolygonNamesCheckbox?.checked;
  polygonValuesContainer.classList.toggle('is-hidden', !!usingNames);
  polygonValuesHelper.classList.toggle('is-hidden', !!usingNames);
  const inputs = polygonValuesContainer.querySelectorAll('input');
  inputs.forEach((input) => {
    input.required = !usingNames;
  });
}

function collectPolygonValues() {
  if (!polygonValuesContainer) return null;
  const inputs = Array.from(polygonValuesContainer.querySelectorAll('input'));

  const values = [];
  for (const input of inputs) {
    const value = input.value.trim();
    if (!value) {
      const label = input.dataset.label || input.name;
      status.textContent = 'Cada polígono necesita un valor';
      status.style.color = '#e11d48';
      logMessage(`Falta el valor de tesauro para ${label}.`, 'warn');
      input.focus();
      return null;
    }
    values.push(value);
  }

  return values;
}

function derivePolygonNameValues(mode = 'simplified') {
  const polygons = getPolygonsByMode(mode);
  if (!polygons.length) return null;
  return polygons.map(({ name }, index) => buildPolygonLabel(name, index));
}

function refreshIfPreview() {
  if (!ifPreview) return;
  const parts = [];

  if (lastIfExpression.simplified) {
    parts.push(`Simplificado:\n${lastIfExpression.simplified}`);
  }

  if (lastIfExpression.original) {
    parts.push(`Completo:\n${lastIfExpression.original}`);
  }

  if (!parts.length) {
    ifPreview.textContent = 'Genera una expresión IF desde el modal para verla aquí.';
    return;
  }

  ifPreview.textContent = parts.join('\n\n');
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
