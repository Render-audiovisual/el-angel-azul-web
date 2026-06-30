(function () {
  const googleSheet = {
    id: "17MlFV1VB32PUXm-J7wSocBRDxmepcsmbwRwJa2cGDnI",
    title: "DATOS / EAA",
    url: "https://docs.google.com/spreadsheets/d/17MlFV1VB32PUXm-J7wSocBRDxmepcsmbwRwJa2cGDnI/edit",
    currentTabs: ["GRUPOS", "CONTRATOS", "PASAJEROS", "FICHAS_ADHESION", "PAGOS", "CUOTAS", "CONFIG"],
    requiredTabs: [
      {
        id: "GRUPOS",
        label: "Grupos",
        columns: [
          "id",
          "nivel",
          "viaje",
          "colegio",
          "curso",
          "division",
          "pasajeros_esperados",
          "estado",
          "created_at",
          "updated_at"
        ]
      },
      {
        id: "CONTRATOS",
        label: "Contratos",
        columns: [
          "id",
          "codigo_contrato",
          "colegio_id",
          "colegio_nombre",
          "grupo_id",
          "nivel",
          "viaje",
          "curso",
          "division",
          "estado",
          "fecha_creacion",
          "observaciones",
          "created_at",
          "updated_at"
        ]
      },
      {
        id: "PASAJEROS",
        label: "Pasajeros",
        columns: [
          "id",
          "grupo_id",
          "contrato_id",
          "codigo_contrato",
          "nombre",
          "dni",
          "nacimiento",
          "telefono",
          "responsable_nombre",
          "responsable_dni",
          "responsable_telefono",
          "vinculo",
          "responsable_cuil_cuit",
          "estado",
          "documentacion_estado",
          "ficha_medica_estado",
          "pago_estado",
          "observaciones",
          "created_at",
          "updated_at"
        ]
      },
      {
        id: "FICHAS_ADHESION",
        label: "Fichas de adhesión",
        columns: [
          "id",
          "pasajero_dni",
          "pasajero_nombre",
          "responsable_nombre",
          "responsable_telefono",
          "nivel",
          "viaje",
          "colegio",
          "curso_division",
          "grupo_solicitado",
          "grupo_asignado_id",
          "contrato_id",
          "codigo_contrato",
          "estado_revision",
          "documentacion_estado",
          "ficha_medica_estado",
          "autorizacion_estado",
          "observaciones",
          "created_at",
          "updated_at"
        ]
      },
      {
        id: "PAGOS",
        label: "Pagos",
        columns: [
          "id",
          "pasajero_id",
          "pasajero_dni",
          "contrato_codigo",
          "fecha",
          "monto",
          "medio",
          "estado",
          "cuota_id",
          "comprobante_url",
          "observaciones",
          "created_at"
        ]
      },
      {
        id: "CUOTAS",
        label: "Cuotas",
        columns: [
          "id",
          "pasajero_id",
          "pasajero_dni",
          "contrato_codigo",
          "numero",
          "nombre",
          "monto",
          "vencimiento",
          "estado",
          "created_at",
          "updated_at"
        ]
      },
      {
        id: "CONFIG",
        label: "Configuración",
        columns: [
          "clave",
          "valor",
          "descripcion",
          "updated_at"
        ]
      }
    ]
  };

  const collectionMap = {
    adminPasajeros: {
      key: "angelAzulAdminPasajerosDemoV2",
      sheet: "GRUPOS",
      note: "Contiene grupos y pasajeros anidados mientras el panel mantiene compatibilidad."
    },
    contratos: {
      key: "angelAzulContratos",
      sheet: "CONTRATOS",
      note: "Entidad central entre grupo/colegio y pasajero. Se carga manualmente en Sheets en esta etapa."
    },
    fichasAdhesion: {
      key: "angelAzulFichaAdhesionDemoV1",
      sheet: "FICHAS_ADHESION",
      note: "Bandeja de fichas recibidas, revisión, asignación y aprobación."
    },
    pagos: {
      key: "angelAzulPayments",
      sheet: "PAGOS",
      note: "Preparado para reemplazar datos calculados por movimientos reales."
    },
    cuotas: {
      key: "angelAzulInstallments",
      sheet: "CUOTAS",
      note: "Preparado para cuotas reales por contrato."
    }
  };

  const GOOGLE_SHEETS_CONFIG_KEY = "angelAzulGoogleSheetsConfig";
  const DEFAULT_GOOGLE_SHEETS_ENDPOINT = "/api/google-sheets";

  function readGoogleSheetsConfig() {
    try {
      const raw = window.localStorage.getItem(GOOGLE_SHEETS_CONFIG_KEY);
      const stored = raw ? JSON.parse(raw) : {};
      const endpoint = String(stored.endpoint || DEFAULT_GOOGLE_SHEETS_ENDPOINT).trim();
      const token = String(stored.token || "").trim();
      return {
        endpoint,
        token,
        enabled: stored.enabled !== false && Boolean(endpoint)
      };
    } catch (error) {
      return { endpoint: DEFAULT_GOOGLE_SHEETS_ENDPOINT, token: "", enabled: true };
    }
  }

  function writeGoogleSheetsConfig(config = {}) {
    const endpoint = String(config.endpoint || DEFAULT_GOOGLE_SHEETS_ENDPOINT).trim();
    const token = String(config.token || "").trim();
    const normalized = {
      endpoint,
      token,
      enabled: Boolean(config.enabled !== false && endpoint)
    };
    window.localStorage.setItem(GOOGLE_SHEETS_CONFIG_KEY, JSON.stringify(normalized, null, 2));
    return normalized;
  }

  function googleSheetsStatus() {
    const config = readGoogleSheetsConfig();
    if (!config.endpoint) {
      return {
        state: "local",
        label: "Usando localStorage",
        detail: "Falta configurar endpoint de Apps Script o proxy local para activar lectura real desde Google Sheets."
      };
    }
    return {
      state: config.enabled ? "ready" : "configured",
      label: config.enabled ? "Google Sheets activo" : "Google Sheets preparado",
      detail: config.enabled
        ? "Endpoint cargado. El panel puede leer y escribir las hojas habilitadas de Etapa 1."
        : "Endpoint guardado. Falta habilitar la conexión como fuente activa."
    };
  }

  async function fetchGoogleSheetRows(sheet) {
    const config = readGoogleSheetsConfig();
    if (!config.endpoint || config.enabled === false) {
      throw new Error("Google Sheets no configurado");
    }
    const url = new URL(config.endpoint, window.location.origin);
    url.searchParams.set("sheet", sheet);
    if (config.token) url.searchParams.set("token", config.token);
    const response = await fetch(url.toString(), { method: "GET" });
    const payload = await response.json();
    if (!payload.ok) throw new Error(payload.error || "No se pudo leer Google Sheets");
    return Array.isArray(payload.rows) ? payload.rows : [];
  }

  async function writeGoogleSheetRows(sheet, rows = [], deleteIds = []) {
    const config = readGoogleSheetsConfig();
    if (!config.endpoint || config.enabled === false) {
      throw new Error("Google Sheets no configurado");
    }
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ token: config.token, sheet, rows, deleteIds })
    });
    const payload = await response.json();
    if (!payload.ok) throw new Error(payload.error || "No se pudo escribir Google Sheets");
    return payload;
  }

  const providers = {
    localStorage: {
      id: "localStorage",
      label: "LocalStorage temporal",
      read(key, fallback = null) {
        try {
          const raw = window.localStorage.getItem(key);
          return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
          return fallback;
        }
      },
      write(key, value) {
        window.localStorage.setItem(key, JSON.stringify(value, null, 2));
        return value;
      }
    },
    googleSheets: {
      id: "googleSheets",
      label: "Google Sheets",
      status: `Sheet definido: ${googleSheet.title}`,
      config: readGoogleSheetsConfig,
      connection: googleSheetsStatus,
      readSheet: fetchGoogleSheetRows,
      writeSheet: writeGoogleSheetRows
    },
    supabase: {
      id: "supabase",
      label: "Supabase",
      status: "Preparado para REST/Auth"
    },
    firebase: {
      id: "firebase",
      label: "Firebase",
      status: "Preparado para Firestore/Auth"
    }
  };

  let activeProvider = providers.localStorage;

  function setProvider(providerId) {
    activeProvider = providers[providerId] || providers.localStorage;
    return activeProvider;
  }

  function collection({ key, seed = () => [], normalize = (item) => item }) {
    function load() {
      const stored = activeProvider.read ? activeProvider.read(key, null) : null;
      if (!stored) {
        const initialData = seed();
        save(initialData);
        return initialData;
      }
      return Array.isArray(stored) ? stored.map(normalize) : seed();
    }

    function save(items = []) {
      const normalized = Array.isArray(items) ? items.map(normalize) : [];
      if (activeProvider.write) activeProvider.write(key, normalized);
      return normalized;
    }

    return {
      key,
      provider: () => activeProvider,
      load,
      save
    };
  }

  function csvEscape(value) {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function toCsv(columns = [], rows = []) {
    const header = columns.map(csvEscape).join(",");
    const body = rows.map((row) => columns.map((column) => csvEscape(row[column])).join(",")).join("\n");
    return [header, body].filter(Boolean).join("\n");
  }

  function blankCsvPackage() {
    return Object.fromEntries(googleSheet.requiredTabs.map((tab) => [tab.id, toCsv(tab.columns, [])]));
  }

  function appsScriptTemplate() {
    const tabs = googleSheet.requiredTabs.map((tab) => ({
      name: tab.id,
      columns: tab.columns
    }));
    return `const SPREADSHEET_ID = "${googleSheet.id}";
const API_TOKEN = "EAA_CHANGE_ME";
const SCHEMA = ${JSON.stringify(tabs, null, 2)};
const WRITE_ALLOWED_SHEETS = ["CONTRATOS", "PASAJEROS", "FICHAS_ADHESION"];

function doGet(event) {
  const token = String(event.parameter.token || "");
  if (token !== API_TOKEN) {
    return jsonResponse({ ok: false, error: "Token inválido" });
  }
  const sheet = String(event.parameter.sheet || "");
  if (!SCHEMA.some((tab) => tab.name === sheet)) {
    return jsonResponse({ ok: false, error: "Hoja no permitida" });
  }
  return jsonResponse({ ok: true, sheet, rows: readSheet(sheet) });
}

function doPost(event) {
  const payload = JSON.parse(event.postData.contents || "{}");
  const token = String(payload.token || event.parameter.token || "");
  if (token !== API_TOKEN) {
    return jsonResponse({ ok: false, error: "Token inválido" });
  }
  const sheet = String(payload.sheet || "");
  if (!SCHEMA.some((tab) => tab.name === sheet)) {
    return jsonResponse({ ok: false, error: "Hoja no permitida" });
  }
  if (!WRITE_ALLOWED_SHEETS.includes(sheet)) {
    return jsonResponse({ ok: false, error: "Escritura no habilitada para esta hoja" });
  }
  writeSheet(sheet, payload.rows || []);
  return jsonResponse({ ok: true, sheet });
}

function setupSchema() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  SCHEMA.forEach((tab) => {
    const sheet = ss.getSheetByName(tab.name) || ss.insertSheet(tab.name);
    sheet.clear();
    sheet.getRange(1, 1, 1, tab.columns.length).setValues([tab.columns]);
    sheet.setFrozenRows(1);
  });
}

function readSheet(name) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  const headers = values.shift() || [];
  return values.filter((row) => row.some(Boolean)).map((row) => (
    Object.fromEntries(headers.map((header, index) => [header, row[index] || ""]))
  ));
}

function writeSheet(name, rows) {
  const tab = SCHEMA.find((item) => item.name === name);
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
  const values = rows.map((row) => tab.columns.map((column) => row[column] || ""));
  sheet.clear();
  sheet.getRange(1, 1, 1, tab.columns.length).setValues([tab.columns]);
  if (values.length) sheet.getRange(2, 1, values.length, tab.columns.length).setValues(values);
  sheet.setFrozenRows(1);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
  }

  function architecture() {
    return {
      active: activeProvider.id,
      sheet: googleSheet,
      collections: Object.values(collectionMap),
      providers: Object.values(providers).map(({ id, label, status }) => ({ id, label, status: status || "Activo" })),
      googleSheetsConfig: readGoogleSheetsConfig(),
      googleSheetsStatus: googleSheetsStatus(),
      note: "Las pantallas consumen colecciones. Hoy persisten en localStorage; el destino de migración ya quedó definido en Google Sheets."
    };
  }

  window.ElAngelAzulPersistence = {
    providers,
    googleSheet,
    collectionMap,
    setProvider,
    collection,
    readGoogleSheetsConfig,
    writeGoogleSheetsConfig,
    googleSheetsStatus,
    fetchGoogleSheetRows,
    writeGoogleSheetRows,
    toCsv,
    blankCsvPackage,
    appsScriptTemplate,
    architecture
  };
})();
