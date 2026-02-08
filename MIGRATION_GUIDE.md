# Migration Guide: Von Waldkauz zu Fledermaus in 30 Minuten

Dieses Tutorial zeigt, wie du schnell ein neues Plugin erstellst, basierend auf dem Waldkauz-Beispiel.

## Beispiel-Szenario

Wir erstellen ein **Fledermaus-Monitoring-Plugin** mit:
- Standort-Punkte (GeoJSON)
- Custom Popup mit Artname und Anzahl
- Layer in der Table of Contents

## Schritt 1: Plugin-Template kopieren (2 Min)

```bash
# Terminal im Projekt-Root
cd app/map/plugins
cp -r _template fledermaus-plugin
```

## Schritt 2: Plugin-ID anpassen (5 Min)

### 2.1 Datei: `index.ts`

```typescript
import type { MapPlugin } from "@/app/map/plugins/types";
import { FLEDERMAUS_INTERACTIVE_LAYER_IDS } from "./interactive-layers";
import { fledermausOverlay, FLEDERMAUS_LAYER_IDS } from "./overlays";
import { FLEDERMAUS_TOC_ITEMS } from "./toc-items";
import { FledermausPointPopup } from "./components/fledermaus-point-popup";

export const fledermausPlugin: MapPlugin = {
  id: "fledermaus",
  name: "Fledermaus Monitoring",
  description: "Monitoring von Fledermaus-Standorten",

  overlays: {
    fledermaus: fledermausOverlay,
  },

  tocItems: [...FLEDERMAUS_TOC_ITEMS],
  interactiveLayerIds: [...FLEDERMAUS_INTERACTIVE_LAYER_IDS],

  popupRenderers: {
    [FLEDERMAUS_LAYER_IDS.points]: FledermausPointPopup,
  },

  layerPrefixes: ["fledermaus-"],

  dataPaths: {
    geojson: "data/plugins/fledermaus",
    assets: "data/plugins/fledermaus/assets",
  },

  enabled: true,
};
```

### 2.2 Datei: `overlays.ts`

```typescript
import type { LayerSpecification, SourceSpecification } from "maplibre-gl";
import type { OverlayDefinition } from "@/app/map/overlays/overlay-definition";

export const FLEDERMAUS_SOURCE_IDS = {
  points: "fledermaus-points-src",
} as const;

export const FLEDERMAUS_LAYER_IDS = {
  points: "fledermaus-points",
} as const;

const sources: Record<string, SourceSpecification> = {
  [FLEDERMAUS_SOURCE_IDS.points]: {
    type: "geojson",
    data: "/data/plugins/fledermaus/standorte.geojson",
  },
};

const pointsLayer: LayerSpecification = {
  id: FLEDERMAUS_LAYER_IDS.points,
  type: "circle",
  source: FLEDERMAUS_SOURCE_IDS.points,
  paint: {
    "circle-color": "#8b5cf6", // Violett für Fledermäuse
    "circle-radius": 6,
    "circle-stroke-color": "#ffffff",
    "circle-stroke-width": 2,
  },
  metadata: { geoRole: "overlay" },
};

export const fledermausOverlay: OverlayDefinition = {
  sources,
  layers: [pointsLayer],
};
```

### 2.3 Datei: `toc-items.ts`

```typescript
import type { TocItemConfig } from "@/app/map/features/toc/toc-types";

export const FLEDERMAUS_TOC_ITEMS: readonly TocItemConfig[] = [
  {
    id: "fledermaus-points",
    title: "Fledermaus · Standorte",
    mapLayerIds: ["fledermaus-points"],
    labelLayerIds: [],
    defaultVisible: true,
    defaultLabelsVisible: false,
    defaultOpacity: 1,
  },
] as const;
```

### 2.4 Datei: `interactive-layers.ts`

```typescript
import { FLEDERMAUS_LAYER_IDS } from "./overlays";

export const FLEDERMAUS_INTERACTIVE_LAYER_IDS = [
  FLEDERMAUS_LAYER_IDS.points
] as const;
```

## Schritt 3: Custom Popup erstellen (8 Min)

### Datei: `components/fledermaus-point-popup.tsx`

```typescript
"use client";

import type { PopupRendererProps } from "@/app/map/features/popup/popup-registry";

export function FledermausPointPopup({ feature }: PopupRendererProps) {
  const standort = feature.properties?.standort || "Unbekannt";
  const art = feature.properties?.art || "Unbekannt";
  const anzahl = feature.properties?.anzahl || 0;
  const datum = feature.properties?.datum;

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      {/* Header */}
      <div className="min-w-0">
        <h3 className="truncate text-sm font-bold tracking-tight text-foreground">
          {standort}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground italic">{art}</p>
      </div>

      {/* Daten */}
      <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-xs">
        <div className="text-muted-foreground">Anzahl</div>
        <div className="text-right font-medium">{anzahl}</div>
        
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

## Schritt 4: GeoJSON-Daten vorbereiten (5 Min)

### Daten-Ordner erstellen

```bash
mkdir -p public/data/plugins/fledermaus
```

### Beispiel-GeoJSON: `standorte.geojson`

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [8.6421, 47.6965]
      },
      "properties": {
        "standort": "Zürichberg",
        "art": "Großes Mausohr",
        "anzahl": 12,
        "datum": "2024-08-15"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [8.5504, 47.3689]
      },
      "properties": {
        "standort": "Zugersee",
        "art": "Wasserfledermaus",
        "anzahl": 8,
        "datum": "2024-08-20"
      }
    }
  ]
}
```

## Schritt 5: Plugin registrieren (2 Min)

### Datei: `app/map/plugins/index.ts`

```typescript
import { registerPlugin } from "./plugin-registry";
import { waldkauzPlugin } from "./waldkauz-plugin";
import { fledermausPlugin } from "./fledermaus-plugin";  // NEU

export function registerAllPlugins() {
  registerPlugin(waldkauzPlugin);
  registerPlugin(fledermausPlugin);  // NEU

  console.log("[Plugins] Alle Plugins registriert");
}

registerAllPlugins();
```

## Schritt 6: Plugin testen (5 Min)

```bash
# Development-Server starten
npm run dev
```

### Checklist:

- [ ] Plugin in Console registriert: `[PluginRegistry] Plugin "fledermaus" registriert`
- [ ] Layer erscheint in TOC (Sidebar)
- [ ] Punkte erscheinen auf der Karte (violett)
- [ ] Popup öffnet sich beim Click
- [ ] Popup zeigt korrekte Daten

## Schritt 7: Multi-Deployment vorbereiten (Optional, 3 Min)

### `.env.local` für Fledermaus-Deployment

```bash
# Für fledermaus.eco-gis.ch
NEXT_PUBLIC_APP_TITLE="Fledermaus Monitoring"
NEXT_PUBLIC_APP_SUBTITLE="Schaffhausen"
NEXT_PUBLIC_BASE_URL="https://fledermaus.eco-gis.ch"
```

### Plugin selektiv aktivieren

```typescript
// In fledermausPlugin
enabled: process.env.NEXT_PUBLIC_ENABLE_FLEDERMAUS !== "false"
```

## Tipps & Tricks

### 1. Farben anpassen

Tailwind-Farben für verschiedene Use-Cases:
- Waldkauz: `#ef4444` (red-500)
- Fledermaus: `#8b5cf6` (violet-500)
- Amphibien: `#10b981` (green-500)
- Vögel: `#3b82f6` (blue-500)

### 2. Icons statt Kreise

```typescript
// In overlays.ts
const pointsLayer: LayerSpecification = {
  id: FLEDERMAUS_LAYER_IDS.points,
  type: "symbol",
  source: FLEDERMAUS_SOURCE_IDS.points,
  layout: {
    "icon-image": "bat-icon",  // Icon muss vorher geladen werden
    "icon-size": 0.8
  }
};
```

### 3. Cluster für viele Punkte

```typescript
const sources = {
  [FLEDERMAUS_SOURCE_IDS.points]: {
    type: "geojson",
    data: "/data/plugins/fledermaus/standorte.geojson",
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50
  }
};
```

### 4. TanStack Query für Live-Daten

```typescript
// In components/fledermaus-point-popup.tsx
import { useQuery } from "@tanstack/react-query";

const { data } = useQuery({
  queryKey: ["fledermaus", locationId],
  queryFn: () => fetch(`/api/fledermaus/${locationId}`).then(r => r.json())
});
```

## Troubleshooting

### Plugin wird nicht geladen

**Problem:** Plugin erscheint nicht in der Console

**Lösung:**
1. Prüfe ob Plugin in `/app/map/plugins/index.ts` importiert ist
2. Prüfe Browser-Console auf Syntax-Fehler
3. Nutze `pluginRegistry.debug()` in der Console

### Layer erscheint nicht

**Problem:** Karte zeigt keine Punkte

**Lösung:**
1. Prüfe Network-Tab: Wird GeoJSON geladen? (200 OK)
2. Prüfe ob Layer in TOC aktiviert ist
3. Prüfe MapLibre-Style: `map.getStyle().layers`
4. Prüfe Koordinaten: Sind sie im sichtbaren Bereich?

### Popup funktioniert nicht

**Problem:** Kein Popup beim Click

**Lösung:**
1. Prüfe ob Layer-ID in `interactiveLayerIds` ist
2. Prüfe ob Popup-Renderer registriert ist
3. Prüfe Browser-Console auf Fehler
4. Teste mit generischem Popup (entferne `popupRenderers`)

## Nächste Schritte

- [ ] Erweitere Popup mit Charts (Recharts)
- [ ] Füge Filter-Funktionen hinzu
- [ ] Integriere externe API für Live-Daten
- [ ] Erstelle Export-Funktion (CSV/GeoJSON)
- [ ] Füge Heatmap-Visualisierung hinzu

## Weitere Ressourcen

- `PLUGIN_API.md` - Vollständige API-Dokumentation
- `app/map/plugins/waldkauz-plugin/` - Komplexes Beispiel mit Charts & Audio
- [MapLibre GL JS Docs](https://maplibre.org/maplibre-gl-js/docs/) - Layer-Styles
- [Recharts Docs](https://recharts.org/) - Datenvisualisierung
