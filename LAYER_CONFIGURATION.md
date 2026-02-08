# Layer/Thema Konfiguration – Anleitung

Diese Anleitung erklärt Schritt für Schritt, wie du ein neues Layer/Thema im WebGIS konfigurierst.

## 📋 Übersicht

Ein vollständiges Layer/Thema besteht aus:
1. **GeoJSON-Daten** – Die geografischen Daten
2. **Overlay-Definition** – MapLibre Sources & Layers
3. **TOC-Konfiguration** – Sichtbarkeit & Einstellungen in der Sidebar
4. **Interaktive Layer** – Click-Events & Popups
5. **Custom Popup** (optional) – Spezielle Darstellung der Attributdaten

## 🚀 Quick Start (5 Minuten)

### Schritt 1: GeoJSON-Datei vorbereiten

Erstelle deine GeoJSON-Datei im Plugin-Data-Ordner:

```bash
mkdir -p public/data/plugins/mein-thema
```

**Beispiel:** `public/data/plugins/mein-thema/standorte.geojson`

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [8.5417, 47.3769]
      },
      "properties": {
        "name": "Standort 1",
        "kategorie": "A",
        "wert": 42,
        "datum": "2024-01-15"
      }
    }
  ]
}
```

### Schritt 2: Plugin erstellen

```bash
# Template kopieren
cp -r app/map/plugins/_template app/map/plugins/mein-thema-plugin

# In mein-thema-plugin-Ordner wechseln
cd app/map/plugins/mein-thema-plugin
```

### Schritt 3: Overlay-Definition anpassen

**Datei:** `overlays.ts`

```typescript
import type { LayerSpecification, SourceSpecification } from "maplibre-gl";
import type { OverlayDefinition } from "@/app/map/overlays/overlay-definition";

// 1. Source-IDs definieren
export const MEIN_THEMA_SOURCE_IDS = {
  points: "mein-thema-points-src",
} as const;

// 2. Layer-IDs definieren
export const MEIN_THEMA_LAYER_IDS = {
  points: "mein-thema-points",
} as const;

// 3. GeoJSON-Sources definieren
const sources: Record<string, SourceSpecification> = {
  [MEIN_THEMA_SOURCE_IDS.points]: {
    type: "geojson",
    data: "/data/plugins/mein-thema/standorte.geojson",
  },
};

// 4. Layer-Style definieren
const pointsLayer: LayerSpecification = {
  id: MEIN_THEMA_LAYER_IDS.points,
  type: "circle",
  source: MEIN_THEMA_SOURCE_IDS.points,
  paint: {
    "circle-color": "#10b981",     // Farbe (Tailwind green-500)
    "circle-radius": 8,             // Größe in Pixel
    "circle-stroke-color": "#ffffff", // Rand-Farbe
    "circle-stroke-width": 2,       // Rand-Breite
  },
  metadata: { geoRole: "overlay" },
};

// 5. Overlay exportieren
export const meinThemaOverlay: OverlayDefinition = {
  sources,
  layers: [pointsLayer],
};
```

### Schritt 4: TOC-Items konfigurieren

**Datei:** `toc-items.ts`

```typescript
import type { TocItemConfig } from "@/app/map/features/toc/toc-types";

export const MEIN_THEMA_TOC_ITEMS: readonly TocItemConfig[] = [
  {
    id: "mein-thema-points",           // Eindeutige ID
    title: "Mein Thema · Standorte",   // Titel in der Sidebar
    mapLayerIds: ["mein-thema-points"], // Layer-IDs aus overlays.ts
    labelLayerIds: [],                  // Optional: Label-Layer
    defaultVisible: true,               // Standardmäßig sichtbar
    defaultLabelsVisible: false,        // Labels standardmäßig aus
    defaultOpacity: 1,                  // Deckkraft (0-1)
  },
] as const;
```

### Schritt 5: Interaktive Layer definieren

**Datei:** `interactive-layers.ts`

```typescript
import { MEIN_THEMA_LAYER_IDS } from "./overlays";

// Layer, die auf Klicks reagieren sollen
export const MEIN_THEMA_INTERACTIVE_LAYER_IDS = [
  MEIN_THEMA_LAYER_IDS.points
] as const;
```

### Schritt 6: Plugin-Manifest anpassen

**Datei:** `index.ts`

```typescript
import type { MapPlugin } from "@/app/map/plugins/types";
import { MEIN_THEMA_INTERACTIVE_LAYER_IDS } from "./interactive-layers";
import { meinThemaOverlay, MEIN_THEMA_LAYER_IDS } from "./overlays";
import { MEIN_THEMA_TOC_ITEMS } from "./toc-items";

export const meinThemaPlugin: MapPlugin = {
  id: "mein-thema",
  name: "Mein Thema",
  description: "Beschreibung des Themas",

  overlays: {
    meinThema: meinThemaOverlay,
  },

  tocItems: [...MEIN_THEMA_TOC_ITEMS],
  interactiveLayerIds: [...MEIN_THEMA_INTERACTIVE_LAYER_IDS],

  // Optional: Custom Popup (siehe unten)
  popupRenderers: {},

  layerPrefixes: ["mein-thema-"],

  dataPaths: {
    geojson: "data/plugins/mein-thema",
  },

  enabled: true,
};
```

### Schritt 7: Plugin registrieren

**Datei:** `app/map/plugins/index.ts`

```typescript
import { registerPlugin } from "./plugin-registry";
import { waldkauzPlugin } from "./waldkauz-plugin";
import { meinThemaPlugin } from "./mein-thema-plugin";  // NEU

export function registerAllPlugins() {
  registerPlugin(waldkauzPlugin);
  registerPlugin(meinThemaPlugin);  // NEU
  
  console.log("[Plugins] Alle Plugins registriert");
}

registerAllPlugins();
```

### Schritt 8: Testen

```bash
npm run dev
# → http://localhost:3000
```

**Checklist:**
- [ ] Plugin in Console registriert
- [ ] Layer erscheint in TOC (Sidebar öffnen)
- [ ] Layer ist auf Karte sichtbar
- [ ] Click auf Feature öffnet Popup

---

## 🎨 Layer-Styling (MapLibre)

### Punkt-Layer (Circle)

```typescript
{
  id: "mein-layer",
  type: "circle",
  source: "mein-source",
  paint: {
    "circle-color": "#ef4444",
    "circle-radius": 6,
    "circle-stroke-color": "#ffffff",
    "circle-stroke-width": 2,
    "circle-opacity": 0.9,
  }
}
```

### Linien-Layer

```typescript
{
  id: "mein-layer",
  type: "line",
  source: "mein-source",
  paint: {
    "line-color": "#3b82f6",
    "line-width": 3,
    "line-opacity": 0.8,
  }
}
```

### Polygon-Layer (Fill + Line)

```typescript
// Fill-Layer
{
  id: "mein-layer-fill",
  type: "fill",
  source: "mein-source",
  paint: {
    "fill-color": "#10b981",
    "fill-opacity": 0.3,
  }
}

// Line-Layer (Umriss)
{
  id: "mein-layer-line",
  type: "line",
  source: "mein-source",
  paint: {
    "line-color": "#059669",
    "line-width": 2,
  }
}
```

### Symbol-Layer (Icons/Text)

```typescript
{
  id: "mein-layer",
  type: "symbol",
  source: "mein-source",
  layout: {
    "text-field": ["get", "name"],  // Property aus GeoJSON
    "text-size": 12,
    "text-offset": [0, 1.5],
  },
  paint: {
    "text-color": "#000000",
    "text-halo-color": "#ffffff",
    "text-halo-width": 2,
  }
}
```

### Datengetriebenes Styling

**Farbe basierend auf Property:**

```typescript
paint: {
  "circle-color": [
    "match",
    ["get", "kategorie"],
    "A", "#ef4444",  // Rot für Kategorie A
    "B", "#3b82f6",  // Blau für Kategorie B
    "C", "#10b981",  // Grün für Kategorie C
    "#94a3b8"        // Grau als Fallback
  ]
}
```

**Größe basierend auf Wert:**

```typescript
paint: {
  "circle-radius": [
    "interpolate",
    ["linear"],
    ["get", "wert"],
    0, 4,      // Wert 0 → Radius 4
    100, 12    // Wert 100 → Radius 12
  ]
}
```

---

## 🔧 Erweiterte Konfiguration

### 1. Custom Popup erstellen

**Datei:** `components/mein-thema-popup.tsx`

```typescript
"use client";

import type { PopupRendererProps } from "@/app/map/features/popup/popup-registry";

export function MeinThemaPopup({ feature }: PopupRendererProps) {
  const name = feature.properties?.name || "Unbekannt";
  const kategorie = feature.properties?.kategorie;
  const wert = feature.properties?.wert;
  const datum = feature.properties?.datum;

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      {/* Header */}
      <div className="min-w-0">
        <h3 className="truncate text-sm font-bold tracking-tight">
          {name}
        </h3>
        {kategorie && (
          <span className="text-xs text-muted-foreground">
            Kategorie {kategorie}
          </span>
        )}
      </div>

      {/* Daten-Tabelle */}
      <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-xs">
        {wert !== undefined && (
          <>
            <div className="text-muted-foreground">Wert</div>
            <div className="text-right font-medium">{wert}</div>
          </>
        )}
        
        {datum && (
          <>
            <div className="text-muted-foreground">Datum</div>
            <div className="text-right font-medium">{datum}</div>
          </>
        )}
      </div>
    </div>
  );
}
```

**In `index.ts` registrieren:**

```typescript
import { MeinThemaPopup } from "./components/mein-thema-popup";

export const meinThemaPlugin: MapPlugin = {
  // ...
  popupRenderers: {
    [MEIN_THEMA_LAYER_IDS.points]: MeinThemaPopup,
  },
  // ...
};
```

### 2. Mehrere Layer kombinieren

```typescript
// overlays.ts
export const MEIN_THEMA_LAYER_IDS = {
  points: "mein-thema-points",
  polygonsFill: "mein-thema-polygons-fill",
  polygonsLine: "mein-thema-polygons-line",
} as const;

export const meinThemaOverlay: OverlayDefinition = {
  sources: {
    points: { type: "geojson", data: "/data/.../points.geojson" },
    polygons: { type: "geojson", data: "/data/.../polygons.geojson" },
  },
  layers: [
    // Polygone zuerst (unten)
    polygonsFillLayer,
    polygonsLineLayer,
    // Punkte darüber
    pointsLayer,
  ],
};
```

**TOC mit mehreren Layern:**

```typescript
// toc-items.ts
export const MEIN_THEMA_TOC_ITEMS = [
  {
    id: "mein-thema-polygons",
    title: "Mein Thema · Flächen",
    mapLayerIds: ["mein-thema-polygons-fill", "mein-thema-polygons-line"],
    defaultVisible: true,
  },
  {
    id: "mein-thema-points",
    title: "Mein Thema · Punkte",
    mapLayerIds: ["mein-thema-points"],
    defaultVisible: true,
  },
];
```

### 3. Clustering für viele Punkte

```typescript
// overlays.ts
const sources: Record<string, SourceSpecification> = {
  [MEIN_THEMA_SOURCE_IDS.points]: {
    type: "geojson",
    data: "/data/plugins/mein-thema/standorte.geojson",
    cluster: true,              // Clustering aktivieren
    clusterMaxZoom: 14,         // Bis Zoom-Level 14 clustern
    clusterRadius: 50,          // Cluster-Radius in Pixel
  },
};

// Cluster-Layer
const clusterLayer: LayerSpecification = {
  id: "mein-thema-clusters",
  type: "circle",
  source: MEIN_THEMA_SOURCE_IDS.points,
  filter: ["has", "point_count"],
  paint: {
    "circle-color": [
      "step",
      ["get", "point_count"],
      "#10b981", 10,   // < 10 Punkte: Grün
      "#f59e0b", 50,   // 10-50: Orange
      "#ef4444"        // > 50: Rot
    ],
    "circle-radius": [
      "step",
      ["get", "point_count"],
      15, 10,   // < 10: Radius 15
      20, 50,   // 10-50: Radius 20
      25        // > 50: Radius 25
    ]
  }
};

// Cluster-Count-Label
const clusterCountLayer: LayerSpecification = {
  id: "mein-thema-cluster-count",
  type: "symbol",
  source: MEIN_THEMA_SOURCE_IDS.points,
  filter: ["has", "point_count"],
  layout: {
    "text-field": ["get", "point_count_abbreviated"],
    "text-size": 12,
  },
  paint: {
    "text-color": "#ffffff",
  }
};

// Einzelne Punkte (nicht geclustert)
const pointsLayer: LayerSpecification = {
  id: MEIN_THEMA_LAYER_IDS.points,
  type: "circle",
  source: MEIN_THEMA_SOURCE_IDS.points,
  filter: ["!", ["has", "point_count"]],  // Nur nicht-geclusterte
  paint: {
    "circle-color": "#10b981",
    "circle-radius": 6,
  }
};

export const meinThemaOverlay: OverlayDefinition = {
  sources,
  layers: [clusterLayer, clusterCountLayer, pointsLayer],
};
```

---

## 📊 Tailwind-Farben für Layer

```typescript
// Rot-Töne
"#ef4444"  // red-500 (Standard Rot)
"#dc2626"  // red-600 (Dunkler)

// Blau-Töne
"#3b82f6"  // blue-500 (Standard Blau)
"#2563eb"  // blue-600 (Dunkler)

// Grün-Töne
"#10b981"  // green-500 (Standard Grün)
"#059669"  // green-600 (Dunkler)

// Violett-Töne
"#8b5cf6"  // violet-500 (Fledermäuse, Nacht)
"#7c3aed"  // violet-600 (Dunkler)

// Orange-Töne
"#f59e0b"  // amber-500 (Warnung, Mittel)
"#d97706"  // amber-600 (Dunkler)

// Grau-Töne
"#94a3b8"  // slate-400 (Neutral, Fallback)
"#64748b"  // slate-500 (Dunkler)
```

---

## 🔍 Debugging

### Plugin nicht sichtbar?

```typescript
// In Browser-Console:
pluginRegistry.debug()
```

### Layer nicht auf Karte?

```typescript
// In Browser-Console:
map.getStyle().layers.filter(l => l.id.startsWith("mein-thema"))
```

### GeoJSON nicht geladen?

- Prüfe Browser Network-Tab (404-Fehler?)
- Prüfe GeoJSON-Syntax (https://geojsonlint.com/)
- Prüfe Koordinaten (WGS84: [lon, lat])

### Popup funktioniert nicht?

- Layer-ID in `interactiveLayerIds`?
- Popup-Renderer registriert?
- Browser-Console auf Fehler prüfen

---

## 📚 Weitere Ressourcen

- **MapLibre Style Spec**: https://maplibre.org/maplibre-style-spec/
- **Turf.js** (Geodata-Analysen): https://turfjs.org/
- **GeoJSON.io** (Editor): https://geojson.io/
- **PLUGIN_API.md** – Vollständige Plugin-API
- **MIGRATION_GUIDE.md** – Schritt-für-Schritt-Tutorial

---

**Viel Erfolg beim Konfigurieren deines neuen Layers!** 🎉
