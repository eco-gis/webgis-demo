# Plugin Template README

Dieser Template-Ordner dient als Vorlage für neue Plugins.

## Schnellstart

1. **Kopiere diesen Ordner**
   ```bash
   cp -r app/map/plugins/_template app/map/plugins/my-plugin
   ```

2. **Ersetze "template" mit deiner Plugin-ID**
   - In allen Dateien: `template` → `my-plugin`
   - In allen Konstanten: `TEMPLATE` → `MY_PLUGIN`
   - In allen Komponenten: `Template` → `MyPlugin`

3. **Erstelle Daten-Ordner**
   ```bash
   mkdir -p public/data/plugins/my-plugin
   ```

4. **Füge GeoJSON-Dateien hinzu**
   ```bash
   cp my-data.geojson public/data/plugins/my-plugin/points.geojson
   ```

5. **Registriere Plugin**
   ```typescript
   // In app/map/plugins/index.ts
   import { myPlugin } from "./my-plugin";
   
   export function registerAllPlugins() {
     registerPlugin(myPlugin);
   }
   ```

6. **Teste das Plugin**
   ```bash
   npm run dev
   ```

## Struktur-Übersicht

```
_template/
├── index.ts                    # Plugin-Manifest
├── overlays.ts                 # MapLibre Sources & Layers
├── toc-items.ts                # TOC-Konfiguration
├── interactive-layers.ts       # Interaktive Layer-IDs
├── components/
│   └── template-point-popup.tsx  # Custom Popup
└── README.md                   # Diese Datei
```

## Anpassungen

### Overlays

Definiere deine GeoJSON-Sources und MapLibre-Layers in `overlays.ts`:

```typescript
const sources = {
  "my-source": {
    type: "geojson",
    data: "/data/plugins/my-plugin/data.geojson"
  }
};

const layers = [
  {
    id: "my-layer",
    type: "circle",
    source: "my-source",
    paint: { /* ... */ }
  }
];
```

### TOC-Items

Konfiguriere Layer-Sichtbarkeit in `toc-items.ts`:

```typescript
export const MY_PLUGIN_TOC_ITEMS = [
  {
    id: "my-layer",
    title: "Mein Layer",
    mapLayerIds: ["my-layer"],
    defaultVisible: true
  }
];
```

### Custom Popups

Erstelle Custom-Popup-Komponenten in `components/`:

```typescript
export function MyCustomPopup({ feature }: PopupRendererProps) {
  return <div>{feature.properties?.name}</div>;
}
```

Registriere das Popup im Plugin-Manifest:

```typescript
popupRenderers: {
  "my-layer": MyCustomPopup
}
```

## Hilfe

- Siehe `PLUGIN_API.md` für vollständige API-Dokumentation
- Siehe `MIGRATION_GUIDE.md` für detaillierte Schritt-für-Schritt-Anleitung
- Siehe `app/map/plugins/waldkauz-plugin/` für vollständiges Beispiel
