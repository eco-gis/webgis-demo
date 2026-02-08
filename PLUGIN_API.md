# Plugin API Dokumentation

Dieses Dokument beschreibt die Plugin-API für das generische WebGIS-Framework.

## Übersicht

Das Plugin-System ermöglicht es, Use-Case-spezifische Funktionalität isoliert zu entwickeln und zu registrieren, ohne den Core-Code zu ändern.

## Plugin-Struktur

Ein Plugin besteht aus folgenden Komponenten:

```
app/map/plugins/<plugin-id>/
├── index.ts                    # Plugin-Manifest & Registration
├── overlays.ts                 # MapLibre Overlay-Definitionen
├── toc-items.ts                # Table of Contents Konfiguration
├── interactive-layers.ts       # Interaktive Layer-IDs
├── components/                 # React-Komponenten
│   ├── <plugin>-popup.tsx     # Custom Popup-Komponenten
│   └── ...
└── lib/                        # Hilfsfunktionen & Services
    └── ...
```

## Plugin-Manifest

Ein Plugin wird über ein `MapPlugin`-Objekt definiert:

```typescript
import type { MapPlugin } from "@/app/map/plugins/types";

export const myPlugin: MapPlugin = {
  // Eindeutige Plugin-ID
  id: "my-plugin",
  
  // Display-Name
  name: "Mein Plugin",
  
  // Optionale Beschreibung
  description: "Beschreibung des Plugins",
  
  // Overlay-Registry (MapLibre Sources & Layers)
  overlays: {
    myOverlay: {
      sources: { /* ... */ },
      layers: [ /* ... */ ]
    }
  },
  
  // TOC-Items (Layer-Konfiguration)
  tocItems: [
    {
      id: "my-layer",
      title: "Mein Layer",
      mapLayerIds: ["my-layer-id"],
      defaultVisible: true,
      defaultOpacity: 1
    }
  ],
  
  // Interaktive Layer-IDs (Click/Hover)
  interactiveLayerIds: ["my-layer-id"],
  
  // Custom Popup-Renderer (optional)
  popupRenderers: {
    "my-layer-id": MyCustomPopup
  },
  
  // Layer-Präfixe für Ordering (optional)
  layerPrefixes: ["my-plugin-"],
  
  // Data-Pfade (optional)
  dataPaths: {
    geojson: "data/plugins/my-plugin",
    assets: "data/plugins/my-plugin/assets"
  },
  
  // Aktiviert/Deaktiviert
  enabled: true
};
```

## Plugin-Registration

Registriere dein Plugin in `/app/map/plugins/index.ts`:

```typescript
import { registerPlugin } from "./plugin-registry";
import { myPlugin } from "./my-plugin";

export function registerAllPlugins() {
  registerPlugin(myPlugin);
  // ... andere Plugins
}

registerAllPlugins();
```

## Overlay-Definitionen

Overlays definieren GeoJSON-Sources und MapLibre-Layers:

```typescript
import type { OverlayDefinition } from "@/app/map/overlays/overlay-definition";

export const myOverlay: OverlayDefinition = {
  sources: {
    "my-source": {
      type: "geojson",
      data: "/data/plugins/my-plugin/data.geojson"
    }
  },
  layers: [
    {
      id: "my-layer",
      type: "circle",
      source: "my-source",
      paint: {
        "circle-color": "#ff0000",
        "circle-radius": 6
      },
      metadata: { geoRole: "overlay" }
    }
  ]
};
```

## TOC-Items

TOC-Items steuern die Layer-Sichtbarkeit und -Eigenschaften:

```typescript
export const myTocItems: TocItemConfig[] = [
  {
    id: "my-layer",
    title: "Mein Layer · Beschreibung",
    mapLayerIds: ["my-layer"],
    labelLayerIds: [],  // Optional: Label-Layers
    defaultVisible: true,
    defaultLabelsVisible: false,
    defaultOpacity: 1
  }
];
```

## Custom Popup-Komponenten

Erstelle Custom-Popups für spezifische Layer:

```typescript
import type { PopupRendererProps } from "@/app/map/features/popup/popup-registry";

export function MyCustomPopup({ feature, layerId }: PopupRendererProps) {
  const name = feature.properties?.name || "Unbekannt";
  
  return (
    <div className="space-y-2">
      <h3 className="font-bold">{name}</h3>
      <p>Custom Popup-Inhalt</p>
    </div>
  );
}
```

## Daten-Organisation

Plugin-Daten gehören in `/public/data/plugins/<plugin-id>/`:

```
/public/data/plugins/my-plugin/
├── data.geojson
├── json/
│   └── additional-data.json
└── assets/
    └── image.png
```

## Beispiel: Vollständiges Plugin

Siehe `/app/map/plugins/waldkauz-plugin/` für ein vollständiges Beispiel.

## Best Practices

1. **Eindeutige IDs**: Plugin-ID, Layer-IDs und Source-IDs müssen eindeutig sein
2. **Präfixe**: Nutze Plugin-ID als Präfix (z.B. `"my-plugin-points"`)
3. **Daten-Isolation**: Alle Plugin-Daten in `/public/data/plugins/<plugin-id>/`
4. **Type-Safety**: Nutze TypeScript für alle Definitionen
5. **Lazy Loading**: Große Daten nur bei Bedarf laden
6. **Clean Code**: Halte Plugin-Code unabhängig vom Core

## API-Referenz

### Plugin-Registry

```typescript
import { pluginRegistry } from "@/app/map/plugins/plugin-registry";

// Alle Plugins
const plugins = pluginRegistry.getAll();

// Nur aktive Plugins
const enabled = pluginRegistry.getEnabled();

// Spezifisches Plugin
const plugin = pluginRegistry.get("my-plugin");

// Aggregierte Overlays
import { getAggregatedOverlays } from "@/app/map/plugins/plugin-registry";
const overlays = getAggregatedOverlays();
```

### Popup-Registry

```typescript
import { registerPopupRenderer } from "@/app/map/features/popup/popup-registry";

// Popup-Renderer registrieren
registerPopupRenderer("my-layer-id", MyCustomPopup);
```

### TanStack Query

```typescript
import { usePresenceDataQuery } from "@/app/lib/api/queries";

// Query-Hook nutzen
const { data, isLoading, error } = usePresenceDataQuery("file-base");
```

## Troubleshooting

### Plugin wird nicht geladen

- Prüfe ob Plugin in `/app/map/plugins/index.ts` registriert ist
- Prüfe Browser-Konsole auf Fehler
- Nutze `pluginRegistry.debug()` im Browser

### Layer erscheint nicht auf Karte

- Prüfe Layer-IDs in Overlay-Definition
- Prüfe GeoJSON-Pfade (404-Fehler in Network-Tab)
- Prüfe ob Layer in TOC aktiviert ist

### Popup funktioniert nicht

- Prüfe ob Layer-ID in `interactiveLayerIds` enthalten ist
- Prüfe ob Popup-Renderer korrekt registriert ist
- Prüfe Browser-Konsole auf Fehler
