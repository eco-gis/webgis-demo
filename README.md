# Generisches WebGIS – eco|gis

Modernes, plugin-basiertes WebGIS-Framework für ökologische Fachanwendungen.

## 🚀 Features

- **Plugin-System**: Isolierte, wiederverwendbare Use-Case-Module
- **Modern Stack**: Next.js 16, React 19, TypeScript, MapLibre GL
- **State of the Art**: TanStack Query, Zustand, shadcn/ui, Biome
- **Performance**: PMTiles, Server Components, optimiertes Caching
- **DX**: Hot Reload, TypeScript Strict, ESM, klare Architektur

## 📦 Tech Stack

### Core
- **Framework**: [Next.js 16](https://nextjs.org/) mit React 19
- **Mapping**: [MapLibre GL JS](https://maplibre.org/) + [PMTiles](https://protomaps.com/docs/pmtiles)
- **TypeScript**: Strict Mode, ESM

### State & Data
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Data Fetching**: [TanStack Query](https://tanstack.com/query)
- **Forms**: React Hook Form + Zod

### UI & Styling
- **Components**: [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

### Tools
- **Code Quality**: [Biome](https://biomejs.dev/) (Linting & Formatting)
- **Visualization**: [Recharts](https://recharts.org/)
- **Geodata**: [Turf.js](https://turfjs.org/), Proj4

## 🏗️ Architektur

```
app/
├── config/               # App-Konfiguration
│   └── app-config.ts    # Metadaten, Umgebungsvariablen
├── map/
│   ├── core/            # Kern-Logik (MapLibre Setup, URL-Sync)
│   ├── features/        # Feature-Module
│   │   ├── drawing/    # Zeichen-Tools
│   │   ├── popup/      # Popup-System
│   │   ├── search/     # Geocoding
│   │   ├── toc/        # Table of Contents
│   │   └── wms/        # WMS-Layer
│   ├── plugins/         # 🔌 Plugin-System
│   │   ├── _template/  # Plugin-Vorlage
│   │   └── waldkauz-plugin/  # Beispiel-Plugin
│   └── config/         # Map-Konfiguration
├── lib/                # Utilities & Services
└── providers.tsx       # React Providers (Query, etc.)

public/data/plugins/    # Plugin-spezifische Daten
```

## 🔌 Plugin-System

Plugins kapseln Use-Case-spezifische Funktionalität:

```typescript
export const myPlugin: MapPlugin = {
  id: "my-plugin",
  name: "Mein Plugin",
  overlays: { /* MapLibre Layers */ },
  tocItems: [ /* TOC-Konfiguration */ ],
  popupRenderers: { /* Custom Popups */ },
  enabled: true
};
```

### Neues Plugin erstellen

1. **Template kopieren**
   ```bash
   cp -r app/map/plugins/_template app/map/plugins/my-plugin
   ```

2. **Plugin anpassen** (siehe `MIGRATION_GUIDE.md`)

3. **Plugin registrieren**
   ```typescript
   // app/map/plugins/index.ts
   import { myPlugin } from "./my-plugin";
   registerPlugin(myPlugin);
   ```

4. **Daten hinzufügen**
   ```bash
   mkdir -p public/data/plugins/my-plugin
   cp data.geojson public/data/plugins/my-plugin/
   ```

👉 **Siehe**: [PLUGIN_API.md](PLUGIN_API.md) | [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)

## 🚀 Getting Started

### Voraussetzungen

- Node.js 18+ (empfohlen: 20 LTS)
- npm, yarn, pnpm oder bun

### Installation

```bash
# Repository klonen
git clone https://github.com/eco-gis/biodiv-demo.git
cd biodiv-demo

# Dependencies installieren
npm install

# Umgebungsvariablen konfigurieren
cp .env.example .env.local
# Füge deinen MapTiler API Key hinzu
```

### Development

```bash
npm run dev
# → http://localhost:3000
```

### Production Build

```bash
npm run build
npm run start
```

## ⚙️ Konfiguration

### App-Metadaten

```bash
# .env.local
NEXT_PUBLIC_APP_TITLE="Mein WebGIS"
NEXT_PUBLIC_APP_SUBTITLE="Projektgebiet"
NEXT_PUBLIC_BASE_URL="https://my-webgis.com"
NEXT_PUBLIC_MAPTILER_KEY="your-api-key"
```

### Plugins aktivieren/deaktivieren

```typescript
// app/map/plugins/index.ts
export function registerAllPlugins() {
  registerPlugin(waldkauzPlugin);
  // registerPlugin(fledermausPlugin);  // Deaktiviert
}
```

## 📚 Dokumentation

- **[PLUGIN_API.md](PLUGIN_API.md)** – Vollständige Plugin-API-Referenz
- **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** – Tutorial: Neues Plugin in 30 Minuten
- **[/app/map/plugins/_template/](app/map/plugins/_template/)** – Plugin-Vorlage

## 🛠️ Scripts

```bash
npm run dev          # Development-Server
npm run build        # Production-Build
npm run start        # Production-Server
npm run lint         # ESLint
npm run biome:check  # Biome Check
npm run biome:fix    # Biome Auto-Fix
npm run deploy       # SSH-Deployment (siehe deploy.sh)
```

## 🗺️ Beispiel-Plugins

### Waldkauz-Plugin

Demonstriert komplexes Plugin mit:
- GeoJSON-Punkte & Buffer-Polygone
- Custom Popup mit interaktiven Charts (Recharts)
- Audio-Player für Sound-Samples
- Presence-Daten mit TanStack Query

📁 **Code**: `app/map/plugins/waldkauz-plugin/`

## 🎨 UI-Komponenten

Basiert auf [shadcn/ui](https://ui.shadcn.com/) mit [Radix UI](https://www.radix-ui.com/):

```bash
# Neue Komponente hinzufügen
npx shadcn@latest add button
```

Verfügbar: Button, Dialog, Dropdown, Tabs, Tooltip, Sheet, und 40+ weitere.

## 🚢 Deployment

### SSH-Deployment (Standard)

```bash
npm run deploy
# → Deployed via SSH (siehe deploy.sh)
```

### Vercel

```bash
vercel deploy
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

## 🤝 Contributing

Contributions sind willkommen! Bitte:

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/amazing`)
3. Commit deine Änderungen (`git commit -m 'Add amazing feature'`)
4. Push zum Branch (`git push origin feature/amazing`)
5. Öffne einen Pull Request

## 📝 License

[MIT License](LICENSE) – Copyright (c) 2024 eco|gis

## 🔗 Links

- **Demo**: [demo-webgis.eco-gis.ch](https://demo-webgis.eco-gis.ch)
- **MapLibre**: [maplibre.org](https://maplibre.org/)
- **Next.js**: [nextjs.org](https://nextjs.org/)
- **shadcn/ui**: [ui.shadcn.com](https://ui.shadcn.com/)

## 💡 Support

Bei Fragen oder Problemen:

- 📧 Email: [support@eco-gis.ch](mailto:support@eco-gis.ch)
- 🐛 Issues: [GitHub Issues](https://github.com/eco-gis/biodiv-demo/issues)
- 📖 Docs: [PLUGIN_API.md](PLUGIN_API.md)

---

**Built with ❤️ by [eco|gis](https://eco-gis.ch)**
