const COORD_PRECISION = 6;
const IMPORT_ORIGINAL_STYLE = { color: '#16a34a', weight: 2, fillOpacity: 0.1 };
const IMPORT_SIMPLIFIED_STYLE = { color: '#16a34a', weight: 3, fillOpacity: 0.2 };

const output = document.getElementById('output');
const copyBtn = document.getElementById('copy-btn');
const copyCompleteBtn = document.getElementById('copy-complete-btn');
const copyQlikSimplifiedBtn = document.getElementById('copy-qlik-simplified-btn');
const copyQlikCompleteBtn = document.getElementById('copy-qlik-complete-btn');
const copyIfSimplifiedBtn = document.getElementById('copy-if-simplified-btn');
const copyIfCompleteBtn = document.getElementById('copy-if-complete-btn');
const copyPickSimplifiedBtn = document.getElementById('copy-pick-simplified-btn');
const copyPickCompleteBtn = document.getElementById('copy-pick-complete-btn');
const copyGestionaSimplifiedBtn = document.getElementById('copy-gestiona-simplified-btn');
const copyGestionaCompleteBtn = document.getElementById('copy-gestiona-complete-btn');
const copyCsvSimplifiedBtn = document.getElementById('copy-csv-simplified-btn');
const copyCsvCompleteBtn = document.getElementById('copy-csv-complete-btn');
const exportGeoJsonSimplifiedBtn = document.getElementById('export-geojson-simplified-btn');
const exportGeoJsonCompleteBtn = document.getElementById('export-geojson-complete-btn');
const resetBtn = document.getElementById('reset-btn');
const status = document.getElementById('copy-status');
const mapStatus = document.getElementById('map-status');
const ifPreview = document.getElementById('if-preview');
const pickPreview = document.getElementById('pick-preview');
const ifModal = document.getElementById('if-modal');
const ifModalClose = document.getElementById('if-modal-close');
const ifCancel = document.getElementById('if-cancel');
const ifForm = document.getElementById('if-form');
const thesaurusNameInput = document.getElementById('thesaurus-name');
const polygonValuesContainer = document.getElementById('polygon-values');
const polygonValuesHelper = document.getElementById('polygon-values-helper');
const usePolygonNamesCheckbox = document.getElementById('use-polygon-names');
const pickModal = document.getElementById('pick-modal');
const pickModalClose = document.getElementById('pick-modal-close');
const pickCancel = document.getElementById('pick-cancel');
const pickForm = document.getElementById('pick-form');
const pickReferenceInput = document.getElementById('pick-reference');
const pickValuesContainer = document.getElementById('pick-values');
const pickValuesHelper = document.getElementById('pick-values-helper');
const usePickNamesCheckbox = document.getElementById('use-pick-names');
const gestionaModal = document.getElementById('gestiona-modal');
const gestionaModalClose = document.getElementById('gestiona-modal-close');
const gestionaCancel = document.getElementById('gestiona-cancel');
const gestionaForm = document.getElementById('gestiona-form');
const gestionaReferenceInput = document.getElementById('gestiona-reference');
const gestionaCoordsInput = document.getElementById('gestiona-coords');
const gestionaValuesContainer = document.getElementById('gestiona-values');
const gestionaValuesHelper = document.getElementById('gestiona-values-helper');
const useGestionaNamesCheckbox = document.getElementById('use-gestiona-names');
const visualLog = document.getElementById('visual-log');
const importBtn = document.getElementById('import-btn');
const importExampleBtn = document.getElementById('import-example-btn');
const importShpBtn = document.getElementById('import-shp-btn');
const importShpLimitedBtn = document.getElementById('import-shp-limited-btn');
const selectShpAreaBtn = document.getElementById('select-shp-area-btn');
const importShpExampleBtn = document.getElementById('import-shp-example-btn');
const geoJsonInput = document.getElementById('geojson-input');
const shpInput = document.getElementById('shp-input');
const shpSelectionModal = document.getElementById('shp-selection-modal');
const shpSelectionClose = document.getElementById('shp-selection-close');
const shpSelectionCancel = document.getElementById('shp-selection-cancel');
const shpSelectionForm = document.getElementById('shp-selection-form');
const shpSelectionCountInput = document.getElementById('shp-selection-count');
const shpSelectionHelper = document.getElementById('shp-selection-helper');
const randomCountInput = document.getElementById('random-count');
const randomApplyBtn = document.getElementById('random-apply-btn');
const toggleOriginalCheckbox = document.getElementById('toggle-original');
const toggleSimplifiedCheckbox = document.getElementById('toggle-simplified');
const toggleNamesCheckbox = document.getElementById('toggle-names');

const MAX_IMPORT_POINTS = 50;

let map;
let drawnItems;
let importedOriginalGroup;
let importedSimplifiedGroup;
let selectionAreaGroup;
let drawControl;
let selectionDrawTool;
let lastFormatted = '';
let lastPolygons = { simplified: [], original: [] };
let lastIfExpression = { simplified: '', original: '' };
let lastPickExpression = { simplified: '', original: '' };
let currentIfMode = 'simplified';
let currentPickMode = 'simplified';
let currentGestionaMode = 'simplified';
let importedPolygonCounter = 0;
let selectionAreaLayer = null;
let selectionActive = false;
let pendingShpSelection = null;

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
  selectionAreaGroup = new L.FeatureGroup();
  map.addLayer(importedOriginalGroup);
  map.addLayer(importedSimplifiedGroup);
  map.addLayer(selectionAreaGroup);
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
    if (selectionActive) {
      selectionActive = false;
      setSelectionArea(layer);
      return;
    }

    drawnItems.addLayer(layer);
    const type = layer instanceof L.Polygon ? 'Polígono' : 'Capa';
    logMessage(`${type} creado y añadido al mapa.`);
    updateOutput();
  });

  map.on(L.Draw.Event.DELETED, () => {
    logMessage('Capas eliminadas del mapa.', 'warn');
    updateOutput();
  });

  map.on(L.Draw.Event.DRAWSTOP, () => {
    selectionActive = false;
  });

  selectionDrawTool = new L.Draw.Polygon(map, {
    allowIntersection: false,
    showArea: true,
    shapeOptions: {
      color: '#f97316',
      weight: 3,
      dashArray: '6 6',
      fillOpacity: 0.12,
    },
  });
}

function removeExistingMap() {
  if (map) {
    map.off();
    map.remove();
  }
}

function setSelectionArea(layer) {
  if (!layer) return;

  selectionAreaGroup?.clearLayers();
  selectionAreaLayer = layer;
  selectionAreaGroup?.addLayer(layer);
  logMessage('Área SHP seleccionada y lista para filtrar.', 'info');
}

function getSelectionAreaLatLngs() {
  if (!selectionAreaLayer || typeof selectionAreaLayer.getLatLngs !== 'function') return [];
  const latLngs = selectionAreaLayer.getLatLngs();
  return latLngs[0] || [];
}

function updateOutput() {
  const simplifiedPolygons = collectGeometries('simplified');
  const originalPolygons = collectGeometries('original');
  lastPolygons = { simplified: simplifiedPolygons, original: originalPolygons };
  const hasPolygons = simplifiedPolygons.length > 0 || originalPolygons.length > 0;

  if (!hasPolygons) {
    lastIfExpression = { simplified: '', original: '' };
    lastPickExpression = { simplified: '', original: '' };
  }

  const formatted = formatGeometries(simplifiedPolygons);
  output.textContent = formatted || 'Crea al menos un polígono para ver sus coordenadas aquí.';
  lastFormatted = formatted;
  status.textContent = '';
  toggleExportButtons(hasPolygons);
  refreshIfPreview();
  refreshPickPreview();
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

function createImportToken() {
  importedPolygonCounter += 1;
  return `import-${importedPolygonCounter}`;
}

function setImportToken(layer, token) {
  if (!layer) return;
  layer.importToken = token;
}

function getImportToken(layer) {
  return layer?.importToken || '';
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

async function importShpFromFile(file) {
  if (typeof shp !== 'function') {
    logMessage('No se encontró la librería para SHP (shpjs).', 'error');
    return;
  }

  logMessage(`Importando SHP ${file.name}...`);
  try {
    const buffer = await file.arrayBuffer();
    await importShpFromBuffer(buffer, file.name);
  } catch (error) {
    logMessage(`Error al leer ${file.name}: ${error.message}`, 'error');
  }
}

async function importShpFromFileWithArea(file, count, areaLatLngs) {
  if (!areaLatLngs || !areaLatLngs.length) {
    logMessage('Debes seleccionar un área antes de cargar polígonos del SHP.', 'warn');
    return;
  }

  if (!Number.isFinite(count) || count <= 0) {
    logMessage('El número de polígonos a cargar debe ser mayor que cero.', 'warn');
    return;
  }

  logMessage(`Importando SHP ${file.name} con filtro de área...`);
  try {
    const buffer = await file.arrayBuffer();
    await importShpFromBuffer(buffer, file.name, { areaLatLngs, limit: count });
  } catch (error) {
    logMessage(`Error al leer ${file.name}: ${error.message}`, 'error');
  }
}

async function importShpFromUrl(url, label = 'SHP remoto') {
  if (typeof shp !== 'function') {
    logMessage('No se encontró la librería para SHP (shpjs).', 'error');
    return;
  }

  try {
    logMessage(`Importando SHP desde ${label}...`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    await importShpFromBuffer(buffer, label);
  } catch (error) {
    logMessage(`No se pudo importar ${label}: ${error.message}`, 'error');
  }
}

async function importShpFromBuffer(buffer, label, options = {}) {
  try {
    const result = await shp(buffer);
    const layers = normalizeShpResult(result);
    if (!layers.length) {
      logMessage(`No se encontraron capas en ${label}.`, 'warn');
      return;
    }

    let remaining = Number.isFinite(options.limit) ? options.limit : null;

    layers.forEach(({ data, layerName }) => {
      if (remaining !== null && remaining <= 0) return;
      const layerLabel = layerName ? `${label} · ${layerName}` : label;
      const added = processGeoJsonData(data, layerLabel, {
        ...options,
        limit: remaining,
      });
      if (remaining !== null) {
        remaining = Math.max(0, remaining - added);
      }
    });

    logMessage(`SHP ${label} procesado con ${layers.length} capa(s).`, 'info');
  } catch (error) {
    logMessage(`Error al procesar ${label}: ${error.message}`, 'error');
  }
}

function normalizeShpResult(result) {
  if (!result) return [];
  if (Array.isArray(result)) {
    return result.map((data) => ({ data, layerName: '' }));
  }
  if (result.type) {
    return [{ data: result, layerName: '' }];
  }
  if (typeof result === 'object') {
    return Object.entries(result).map(([layerName, data]) => ({ data, layerName }));
  }
  return [];
}

function processGeoJsonData(data, label = 'GeoJSON', options = {}) {
  const { areaLatLngs, limit } = options;
  let polygons = extractPolygons(data);

  if (areaLatLngs?.length) {
    const filtered = filterPolygonsByArea(polygons, areaLatLngs);
    if (!filtered.length) {
      logMessage(`No se encontraron polígonos dentro del área en ${label}.`, 'warn');
      return 0;
    }

    if (filtered.length !== polygons.length) {
      logMessage(
        `Filtro de área aplicado: ${filtered.length} de ${polygons.length} polígonos dentro del área.`,
        'info'
      );
    }
    polygons = filtered;
  }

  if (Number.isFinite(limit)) {
    if (limit < polygons.length) {
      logMessage(`Se cargarán solo ${limit} polígonos de ${polygons.length} disponibles.`, 'info');
    }
    polygons = polygons.slice(0, limit);
  }

  if (!polygons.length) {
    logMessage(`No se encontraron polígonos en ${label}.`, 'warn');
    return 0;
  }

  const addedSimplifiedLayers = [];
  const addedOriginalLayers = [];

  polygons.forEach(({ rings, name }, index) => {
    const polygonName = name || `Polígono ${index + 1}`;
    const importToken = createImportToken();
    const simplifiedRings = rings.map((ring) => reducePoints(ring, MAX_IMPORT_POINTS));

    const originalLayer = L.polygon(rings, IMPORT_ORIGINAL_STYLE);
    const simplifiedLayer = L.polygon(simplifiedRings, IMPORT_SIMPLIFIED_STYLE);

    setImportToken(originalLayer, importToken);
    setImportToken(simplifiedLayer, importToken);

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

  return addedSimplifiedLayers.length;
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

function filterPolygonsByArea(polygons, areaLatLngs) {
  const areaBounds = L.latLngBounds(areaLatLngs);
  return polygons.filter(({ rings }) => {
    const primaryRing = rings[0] || [];
    if (!primaryRing.length) return false;
    if (!primaryRing.every((point) => areaBounds.contains(point))) return false;
    return primaryRing.every((point) => isPointInsidePolygon(point, areaLatLngs));
  });
}

function isPointInsidePolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
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

function getImportedPolygonPairs() {
  const pairs = new Map();
  if (!importedSimplifiedGroup || !importedOriginalGroup) return pairs;

  importedSimplifiedGroup.getLayers().forEach((layer) => {
    const token = getImportToken(layer);
    if (!token) return;
    const entry = pairs.get(token) || {};
    entry.simplified = layer;
    pairs.set(token, entry);
  });

  importedOriginalGroup.getLayers().forEach((layer) => {
    const token = getImportToken(layer);
    if (!token) return;
    const entry = pairs.get(token) || {};
    entry.original = layer;
    pairs.set(token, entry);
  });

  return pairs;
}

function shuffleArray(values) {
  const array = [...values];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function applyRandomSelection(count) {
  const pairs = getImportedPolygonPairs();
  const tokens = Array.from(pairs.keys());

  if (!tokens.length) {
    logMessage('No hay polígonos importados para seleccionar aleatoriamente.', 'warn');
    return;
  }

  if (!Number.isFinite(count) || count <= 0) {
    logMessage('El número de polígonos debe ser mayor que cero.', 'warn');
    return;
  }

  const target = Math.min(count, tokens.length);
  if (target === tokens.length) {
    logMessage(
      `La selección solicitada coincide con los ${tokens.length} polígonos importados.`,
      'info'
    );
    return;
  }

  const selectedTokens = new Set(shuffleArray(tokens).slice(0, target));
  tokens.forEach((token) => {
    if (selectedTokens.has(token)) return;
    const pair = pairs.get(token);
    if (pair?.simplified) importedSimplifiedGroup.removeLayer(pair.simplified);
    if (pair?.original) importedOriginalGroup.removeLayer(pair.original);
  });

  const remainingLayers = [];
  selectedTokens.forEach((token) => {
    const pair = pairs.get(token);
    if (pair?.simplified) remainingLayers.push(pair.simplified);
    else if (pair?.original) remainingLayers.push(pair.original);
  });

  if (remainingLayers.length) {
    const group = L.featureGroup(remainingLayers);
    map.fitBounds(group.getBounds(), { padding: [20, 20] });
  }

  updateOutput();
  applyOriginalVisibility();
  applySimplifiedVisibility();
  applyNameVisibility();

  logMessage(
    `Selección aleatoria aplicada: ${target} de ${tokens.length} polígonos importados.`,
    'info'
  );
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

function downloadCsvExport(mode = 'simplified') {
  const polygons = getPolygonsByMode(mode);
  const csv = buildCsvExport(polygons);
  if (!csv) {
    setStatus('Añade un polígono primero', 'error');
    logMessage('No hay polígonos para exportar a CSV.', 'warn');
    return;
  }

  try {
    const csvWithBom = `\uFEFF${csv}`;
    const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const suffix = mode === 'simplified' ? 'simplificados' : 'completos';

    link.href = url;
    link.download = `poligonos-${suffix}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setStatus(`CSV (${getModeLabel(mode)}) descargado`, 'success');
    logMessage(`CSV generado en modo ${getModeLabel(mode)} y descargado como archivo.`);
  } catch (error) {
    setStatus('No se pudo descargar', 'error');
    logMessage('El navegador no permitió descargar el CSV.', 'error');
  }
}

function downloadGeoJsonExport(mode = 'simplified') {
  const polygons = getPolygonsByMode(mode);
  if (!polygons.length) {
    setStatus('Añade un polígono primero', 'error');
    logMessage('No hay polígonos para exportar a GeoJSON.', 'warn');
    return;
  }

  const geojson = buildGeoJsonExport(polygons);

  try {
    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: 'application/geo+json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const suffix = mode === 'simplified' ? 'simplificados' : 'completos';

    link.href = url;
    link.download = `poligonos-${suffix}.geojson`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setStatus(`GeoJSON (${getModeLabel(mode)}) descargado`, 'success');
    logMessage(`GeoJSON generado en modo ${getModeLabel(mode)} listo para reimportar.`);
  } catch (error) {
    setStatus('No se pudo descargar', 'error');
    logMessage('El navegador no permitió descargar el GeoJSON.', 'error');
  }
}

const copyActions = [
  { element: copyBtn, mode: 'simplified', handler: copyFormattedPolygons },
  { element: copyCompleteBtn, mode: 'original', handler: copyFormattedPolygons },
  { element: copyQlikSimplifiedBtn, mode: 'simplified', handler: copyQlikExport },
  { element: copyQlikCompleteBtn, mode: 'original', handler: copyQlikExport },
  { element: copyPickSimplifiedBtn, mode: 'simplified', handler: openPickModal },
  { element: copyPickCompleteBtn, mode: 'original', handler: openPickModal },
  { element: copyGestionaSimplifiedBtn, mode: 'simplified', handler: openGestionaModal },
  { element: copyGestionaCompleteBtn, mode: 'original', handler: openGestionaModal },
  { element: copyCsvSimplifiedBtn, mode: 'simplified', handler: downloadCsvExport },
  { element: copyCsvCompleteBtn, mode: 'original', handler: downloadCsvExport },
  { element: exportGeoJsonSimplifiedBtn, mode: 'simplified', handler: downloadGeoJsonExport },
  { element: exportGeoJsonCompleteBtn, mode: 'original', handler: downloadGeoJsonExport },
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
  selectionAreaGroup?.clearLayers();
  selectionAreaLayer = null;
  updateOutput();
  logMessage('Mapa reiniciado: capas limpiadas.');
});

importBtn?.addEventListener('click', () => {
  geoJsonInput?.click();
  logMessage('Selector de archivo GeoJSON abierto.');
});

importShpBtn?.addEventListener('click', () => {
  shpInput?.click();
  logMessage('Selector de archivo SHP abierto.');
});

selectShpAreaBtn?.addEventListener('click', () => {
  if (!selectionDrawTool) return;
  selectionActive = true;
  selectionDrawTool.enable();
  logMessage('Dibuja un área en el mapa para filtrar polígonos SHP.');
});

importShpLimitedBtn?.addEventListener('click', () => {
  openShpSelectionModal();
});

geoJsonInput?.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  importGeoJsonFromFile(file);
  event.target.value = '';
});

shpInput?.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (pendingShpSelection) {
    const { count, areaLatLngs } = pendingShpSelection;
    pendingShpSelection = null;
    importShpFromFileWithArea(file, count, areaLatLngs);
  } else {
    importShpFromFile(file);
  }
  event.target.value = '';
});

importExampleBtn?.addEventListener('click', () => {
  importGeoJsonFromUrl('ejemplos/ejemplo.geojson', 'ejemplo.geojson');
});

importShpExampleBtn?.addEventListener('click', () => {
  importShpFromUrl(
    'ejemplosshp/50001uA_50004_14082025_PARCELA.ZIP',
    '50001uA_50004_14082025_PARCELA.ZIP'
  );
});

randomApplyBtn?.addEventListener('click', () => {
  const value = Number.parseInt(randomCountInput?.value, 10);
  applyRandomSelection(value);
});

toggleOriginalCheckbox?.addEventListener('change', applyOriginalVisibility);
toggleSimplifiedCheckbox?.addEventListener('change', applySimplifiedVisibility);
toggleNamesCheckbox?.addEventListener('change', applyNameVisibility);
usePolygonNamesCheckbox?.addEventListener('change', updatePolygonValueVisibility);
usePickNamesCheckbox?.addEventListener('change', updatePickValueVisibility);
useGestionaNamesCheckbox?.addEventListener('change', updateGestionaValueVisibility);

ifModalClose?.addEventListener('click', closeIfModal);
ifCancel?.addEventListener('click', closeIfModal);
pickModalClose?.addEventListener('click', closePickModal);
pickCancel?.addEventListener('click', closePickModal);
gestionaModalClose?.addEventListener('click', closeGestionaModal);
gestionaCancel?.addEventListener('click', closeGestionaModal);
shpSelectionClose?.addEventListener('click', closeShpSelectionModal);
shpSelectionCancel?.addEventListener('click', closeShpSelectionModal);

ifModal?.addEventListener('click', (event) => {
  if (event.target === ifModal) {
    closeIfModal();
  }
});

gestionaModal?.addEventListener('click', (event) => {
  if (event.target === gestionaModal) {
    closeGestionaModal();
  }
});

pickModal?.addEventListener('click', (event) => {
  if (event.target === pickModal) {
    closePickModal();
  }
});

shpSelectionModal?.addEventListener('click', (event) => {
  if (event.target === shpSelectionModal) {
    closeShpSelectionModal();
  }
});

shpSelectionForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const count = Number.parseInt(shpSelectionCountInput?.value, 10);
  if (!Number.isFinite(count) || count <= 0) {
    logMessage('El número de polígonos debe ser mayor que cero.', 'warn');
    shpSelectionCountInput?.focus();
    return;
  }

  const areaLatLngs = getSelectionAreaLatLngs();
  if (!areaLatLngs.length) {
    logMessage('Primero selecciona un área para filtrar los polígonos SHP.', 'warn');
    return;
  }

  pendingShpSelection = { count, areaLatLngs };
  closeShpSelectionModal();
  shpInput?.click();
  logMessage(`Listo para cargar ${count} polígonos dentro del área seleccionada.`);
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

gestionaForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const polygons = getPolygonsByMode(currentGestionaMode);
  if (!polygons.length) {
    status.textContent = 'Añade un polígono primero';
    status.style.color = '#e11d48';
    logMessage('No hay polígonos para generar secciones Gestiona.', 'warn');
    closeGestionaModal();
    return;
  }

  const referenceField = gestionaReferenceInput?.value.trim();
  const coordsField = gestionaCoordsInput?.value.trim();
  if (!referenceField || !coordsField) {
    status.textContent = 'Campos de referencia requeridos';
    status.style.color = '#e11d48';
    logMessage('Completa los nombres de referencia y coordenadas.', 'warn');
    return;
  }

  const usePolygonNames = useGestionaNamesCheckbox?.checked;
  const values = usePolygonNames ? derivePolygonNameValues(currentGestionaMode) : collectGestionaValues();
  if (!values) return;

  const expression = buildGestionaExport(referenceField, coordsField, polygons, values);

  try {
    await navigator.clipboard.writeText(expression);
    status.textContent = `Secciones Gestiona (${getModeLabel(currentGestionaMode)}) exportadas`;
    status.style.color = '#16a34a';
    closeGestionaModal();
    logMessage(`Código Gestiona copiado en modo ${getModeLabel(currentGestionaMode)}.`);
  } catch (error) {
    status.textContent = 'No se pudo copiar';
    status.style.color = '#e11d48';
    logMessage('El navegador no permitió copiar el código Gestiona.', 'error');
  }
});

pickForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const polygons = getPolygonsByMode(currentPickMode);
  if (!polygons.length) {
    status.textContent = 'Añade un polígono primero';
    status.style.color = '#e11d48';
    logMessage('No hay polígonos para generar condicionales PickMatch.', 'warn');
    closePickModal();
    return;
  }

  const referenceField = pickReferenceInput?.value.trim();
  if (!referenceField) {
    status.textContent = 'Campo de referencia requerido';
    status.style.color = '#e11d48';
    logMessage('Falta el campo de referencia para generar el PickMatch.', 'warn');
    return;
  }

  const usePolygonNames = usePickNamesCheckbox?.checked;
  const values = usePolygonNames ? derivePolygonNameValues(currentPickMode) : collectPickValues();
  if (!values) return;

  const expression = buildPickMatchExport(referenceField, polygons, values);

  try {
    await navigator.clipboard.writeText(expression);
    status.textContent = `PickMatch (${getModeLabel(currentPickMode)}) exportado`;
    status.style.color = '#16a34a';
    lastPickExpression[currentPickMode] = expression;
    refreshPickPreview();
    closePickModal();
    logMessage(`Expresión PickMatch de Qlik copiada en modo ${getModeLabel(currentPickMode)}.`);
  } catch (error) {
    status.textContent = 'No se pudo copiar';
    status.style.color = '#e11d48';
    logMessage('El navegador no permitió copiar el PickMatch de Qlik.', 'error');
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

function buildCsvExport(polygons) {
  if (!polygons.length) return '';
  const header = ['Nombre de polígono', 'Polígono'];
  const rows = polygons.map(({ coords, name }, index) => {
    const label = buildPolygonLabel(name, index);
    const serialized = `'${buildCompactPolygonString(coords)}'`;
    return [label, serialized];
  });

  return [header, ...rows].map((cells) => cells.map(escapeCsvCell).join(',')).join('\n');
}

function buildCompactPolygonString(coords) {
  const pairs = coords.map(([lng, lat]) => `[${lng},${lat}]`).join(',');
  return `[[${pairs}]]`;
}

function buildGeoJsonExport(polygons) {
  return {
    type: 'FeatureCollection',
    features: polygons.map(({ coords, name }, index) => ({
      type: 'Feature',
      properties: { name: buildPolygonLabel(name, index) },
      geometry: {
        type: 'Polygon',
        coordinates: [coords],
      },
    })),
  };
}

function escapeCsvCell(value) {
  const asString = String(value ?? '');
  const escaped = asString.replace(/"/g, '""');
  return `"${escaped}"`;
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

function buildPickMatchExport(referenceField, polygons, values) {
  if (!referenceField || polygons.length !== values.length) return '';
  const pretty = true;

  const matchValues = values.map((value) => `'${value}'`).join(',\n        ');
  const polygonStrings = polygons
    .map(({ coords }) => buildPolygonString(coords, { pretty }))
    .join(',\n    ');

  return `Pick(\n    Match(${referenceField},\n        ${matchValues}\n    ),\n    ${polygonStrings}\n)`;
}

function buildGestionaExport(referenceField, coordsField, polygons, values) {
  if (!referenceField || !coordsField || polygons.length !== values.length) return '';
  const pretty = true;

  return polygons
    .map(({ coords, name }, index) => {
      const label = buildPolygonLabel(name, index);
      const section = buildSectionName(label);
      const serialized = buildPolygonString(coords, { pretty });
      const sanitizedValue = sanitizeSelectorValue(values[index]);
      return [
        `{{#${section} | condition :(personalized.${referenceField}=="${sanitizedValue}")}}`,
        `{{let | reference: personalized.${coordsField} | result: ${serialized}}}`,
        `{{/${section}}}`,
      ].join('\n');
    })
    .join('\n\n');
}

function buildSectionName(label) {
  const fallback = 'section_POLIGONO';
  if (!label) return fallback;

  const normalized = label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .trim();

  if (!normalized) return fallback;
  return `section_${normalized.toUpperCase()}`;
}

function sanitizeSelectorValue(value) {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');
}

function toggleExportButtons(enabled) {
  const buttons = [
    copyBtn,
    copyCompleteBtn,
    copyQlikSimplifiedBtn,
    copyQlikCompleteBtn,
    copyIfSimplifiedBtn,
    copyIfCompleteBtn,
    copyPickSimplifiedBtn,
    copyPickCompleteBtn,
    copyGestionaSimplifiedBtn,
    copyGestionaCompleteBtn,
    copyCsvSimplifiedBtn,
    copyCsvCompleteBtn,
    exportGeoJsonSimplifiedBtn,
    exportGeoJsonCompleteBtn,
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

function openShpSelectionModal() {
  const hasSelection = getSelectionAreaLatLngs().length > 0;
  if (shpSelectionHelper) {
    shpSelectionHelper.textContent = hasSelection
      ? 'Área detectada. Selecciona el número de polígonos a cargar.'
      : 'Dibuja primero un área con "Seleccionar área SHP" para filtrar los polígonos.';
  }
  shpSelectionModal?.setAttribute('aria-hidden', 'false');
  shpSelectionModal?.classList.add('open');
  shpSelectionCountInput?.focus();
}

function closeShpSelectionModal() {
  shpSelectionModal?.setAttribute('aria-hidden', 'true');
  shpSelectionModal?.classList.remove('open');
  shpSelectionForm?.reset();
}

function openPickModal(mode = 'simplified') {
  currentPickMode = mode;
  const polygons = getPolygonsByMode(mode);
  if (!polygons.length) {
    status.textContent = 'Añade un polígono primero';
    status.style.color = '#e11d48';
    logMessage('No hay polígonos para generar condicionales PickMatch.', 'warn');
    return;
  }

  renderPickValueInputs(mode);
  updatePickValueVisibility();
  pickModal?.setAttribute('aria-hidden', 'false');
  pickModal?.classList.add('open');
  pickReferenceInput?.focus();
}

function closePickModal() {
  pickModal?.setAttribute('aria-hidden', 'true');
  pickModal?.classList.remove('open');
  pickForm?.reset();
}

function openGestionaModal(mode = 'simplified') {
  currentGestionaMode = mode;
  const polygons = getPolygonsByMode(mode);
  if (!polygons.length) {
    status.textContent = 'Añade un polígono primero';
    status.style.color = '#e11d48';
    logMessage('No hay polígonos para generar secciones Gestiona.', 'warn');
    return;
  }

  renderGestionaValueInputs(mode);
  updateGestionaValueVisibility();
  gestionaModal?.setAttribute('aria-hidden', 'false');
  gestionaModal?.classList.add('open');
  gestionaReferenceInput?.focus();
}

function closeGestionaModal() {
  gestionaModal?.setAttribute('aria-hidden', 'true');
  gestionaModal?.classList.remove('open');
  gestionaForm?.reset();
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

function renderPickValueInputs(mode = 'simplified') {
  if (!pickValuesContainer) return;
  pickValuesContainer.innerHTML = '';

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
    input.name = `pick-${index + 1}`;
    input.placeholder = `Valor PickMatch ${label}`;
    input.dataset.label = label;

    wrapper.appendChild(span);
    wrapper.appendChild(input);
    pickValuesContainer.appendChild(wrapper);
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

function updatePickValueVisibility() {
  if (!pickValuesContainer || !pickValuesHelper) return;
  const usingNames = usePickNamesCheckbox?.checked;
  pickValuesContainer.classList.toggle('is-hidden', !!usingNames);
  pickValuesHelper.classList.toggle('is-hidden', !!usingNames);
  const inputs = pickValuesContainer.querySelectorAll('input');
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

function collectPickValues() {
  if (!pickValuesContainer) return null;
  const inputs = Array.from(pickValuesContainer.querySelectorAll('input'));

  const values = [];
  for (const input of inputs) {
    const value = input.value.trim();
    if (!value) {
      const label = input.dataset.label || input.name;
      status.textContent = 'Cada polígono necesita un valor para Match';
      status.style.color = '#e11d48';
      logMessage(`Falta el valor PickMatch para ${label}.`, 'warn');
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

function renderGestionaValueInputs(mode = 'simplified') {
  if (!gestionaValuesContainer) return;
  gestionaValuesContainer.innerHTML = '';

  const polygons = getPolygonsByMode(mode);

  polygons.forEach(({ name }, index) => {
    const label = buildPolygonLabel(name, index);
    const wrapper = document.createElement('label');
    wrapper.className = 'field';

    const span = document.createElement('span');
    span.textContent = `Referencia valor para ${label}`;

    const input = document.createElement('input');
    input.type = 'text';
    input.required = true;
    input.name = `gestiona-${index + 1}`;
    input.placeholder = `Valor de referencia ${label}`;
    input.dataset.label = label;

    wrapper.appendChild(span);
    wrapper.appendChild(input);
    gestionaValuesContainer.appendChild(wrapper);
  });
}

function updateGestionaValueVisibility() {
  if (!gestionaValuesContainer || !gestionaValuesHelper) return;
  const usingNames = useGestionaNamesCheckbox?.checked;
  gestionaValuesContainer.classList.toggle('is-hidden', !!usingNames);
  gestionaValuesHelper.classList.toggle('is-hidden', !!usingNames);
  const inputs = gestionaValuesContainer.querySelectorAll('input');
  inputs.forEach((input) => {
    input.required = !usingNames;
  });
}

function collectGestionaValues() {
  if (!gestionaValuesContainer) return null;
  const inputs = Array.from(gestionaValuesContainer.querySelectorAll('input'));

  const values = [];
  for (const input of inputs) {
    const value = input.value.trim();
    if (!value) {
      const label = input.dataset.label || input.name;
      status.textContent = 'Cada polígono necesita un valor de referencia';
      status.style.color = '#e11d48';
      logMessage(`Falta la referencia para ${label}.`, 'warn');
      input.focus();
      return null;
    }
    values.push(value);
  }

  return values;
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

function refreshPickPreview() {
  if (!pickPreview) return;
  const parts = [];

  if (lastPickExpression.simplified) {
    parts.push(`Simplificado:\n${lastPickExpression.simplified}`);
  }

  if (lastPickExpression.original) {
    parts.push(`Completo:\n${lastPickExpression.original}`);
  }

  if (!parts.length) {
    pickPreview.textContent = 'Genera una expresión PickMatch desde el modal para verla aquí.';
    return;
  }

  pickPreview.textContent = parts.join('\n\n');
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
