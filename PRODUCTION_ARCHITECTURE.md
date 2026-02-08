# Production-Ready WebGIS Architektur

## 🎯 Ziel

Ein wartungsfreundliches, wiederverwendbares WebGIS-System mit:
- PostGIS-Datenbank für alle Geodaten
- Admin-Interface für Layer-Management
- Dynamische Popup-Konfiguration
- Keine Code-Änderungen für neue Layer

---

## 🏗️ Architektur-Übersicht

### Stack-Empfehlung

```
Frontend:     Next.js 16 + React 19 + MapLibre GL
Backend API:  Next.js API Routes / tRPC
Tile Server:  pg_tileserv / Martin / tegola
Database:     PostgreSQL 16 + PostGIS 3.4
Cache:        Redis (optional, für Vector Tiles)
Admin UI:     React Admin / Refine
```

### Komponenten

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                     │
├──────────────────────────────────────────────────────────┤
│  Public Map Viewer        │  Admin Panel                 │
│  - MapLibre GL            │  - Layer CRUD                │
│  - Dynamic Layer Loading  │  - Style Editor              │
│  - Popup Rendering        │  - Popup Template Builder    │
│  - Feature Info           │  - User Management           │
└──────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  Backend API  │  │  Tile Server  │  │  File Storage │
│  (Next.js)    │  │  (pg_tileserv)│  │  (S3/Local)   │
├───────────────┤  ├───────────────┤  ├───────────────┤
│ - Layer API   │  │ - Vector Tiles│  │ - Assets      │
│ - Popup API   │  │ - MVT Format  │  │ - Images      │
│ - Auth        │  │ - Dynamic SQL │  │ - Documents   │
│ - Feature API │  │ - Caching     │  │               │
└───────────────┘  └───────────────┘  └───────────────┘
        │                   │
        └───────────┬───────┘
                    ▼
        ┌───────────────────────┐
        │  PostgreSQL + PostGIS │
        ├───────────────────────┤
        │ - Geodata Tables      │
        │ - Layer Config        │
        │ - Popup Templates     │
        │ - User/Permissions    │
        └───────────────────────┘
```

---

## 🗄️ Datenbankschema

### 1. Geodaten-Tables

Jedes Thema bekommt eine eigene Tabelle mit PostGIS-Geometry:

```sql
-- Beispiel: Waldkauz-Standorte
CREATE TABLE waldkauz_standorte (
    id SERIAL PRIMARY KEY,
    location VARCHAR(255),
    location_id VARCHAR(50) UNIQUE,
    geom GEOMETRY(Point, 4326),  -- WGS84
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- PostGIS-Index für Performance
CREATE INDEX idx_waldkauz_geom ON waldkauz_standorte USING GIST (geom);

-- Beispiel: Flächen
CREATE TABLE naturschutzgebiete (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    kategorie VARCHAR(100),
    flaeche_ha DECIMAL(10, 2),
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_naturschutz_geom ON naturschutzgebiete USING GIST (geom);
```

### 2. Layer-Konfiguration

Zentrale Tabelle für alle Layer-Definitionen:

```sql
CREATE TABLE layers (
    id SERIAL PRIMARY KEY,
    
    -- Identifikation
    layer_id VARCHAR(100) UNIQUE NOT NULL,  -- z.B. "waldkauz-points"
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),  -- z.B. "Fauna", "Flora", "Schutzgebiete"
    
    -- Datenquelle
    source_type VARCHAR(50) NOT NULL,  -- 'postgis', 'geojson', 'wms'
    source_table VARCHAR(255),  -- PostGIS-Tabelle
    source_query TEXT,  -- Optionale Custom-Query
    geometry_column VARCHAR(50) DEFAULT 'geom',
    
    -- MapLibre Style
    layer_type VARCHAR(50) NOT NULL,  -- 'circle', 'fill', 'line', 'symbol'
    paint_properties JSONB,  -- MapLibre paint-Eigenschaften
    layout_properties JSONB,  -- MapLibre layout-Eigenschaften
    
    -- TOC-Einstellungen
    default_visible BOOLEAN DEFAULT true,
    default_opacity DECIMAL(3, 2) DEFAULT 1.0,
    min_zoom INTEGER DEFAULT 0,
    max_zoom INTEGER DEFAULT 22,
    
    -- Interaktivität
    is_interactive BOOLEAN DEFAULT false,
    popup_template_id INTEGER REFERENCES popup_templates(id),
    
    -- Metadaten
    sort_order INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Beispiel-Eintrag
INSERT INTO layers (
    layer_id, name, category, 
    source_type, source_table, layer_type,
    paint_properties, is_interactive
) VALUES (
    'waldkauz-points',
    'Waldkauz · Standorte',
    'Fauna',
    'postgis',
    'waldkauz_standorte',
    'circle',
    '{
        "circle-color": "#ef4444",
        "circle-radius": 6,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2
    }'::jsonb,
    true
);
```

### 3. Popup-Templates

Flexible Popup-Konfiguration ohne Code:

```sql
CREATE TABLE popup_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Template-Typ
    template_type VARCHAR(50) DEFAULT 'table',  -- 'table', 'card', 'custom'
    
    -- Felder-Definition
    fields JSONB NOT NULL,
    -- Beispiel:
    -- [
    --   {"key": "name", "label": "Name", "type": "text", "order": 1},
    --   {"key": "kategorie", "label": "Kategorie", "type": "badge", "order": 2},
    --   {"key": "wert", "label": "Wert", "type": "number", "format": "int", "order": 3}
    -- ]
    
    -- Custom-Komponenten (optional)
    has_custom_component BOOLEAN DEFAULT false,
    custom_component_name VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Beispiel-Eintrag
INSERT INTO popup_templates (name, template_type, fields) VALUES (
    'Waldkauz Popup',
    'card',
    '[
        {"key": "location", "label": "Standort", "type": "text", "order": 1},
        {"key": "location_id", "label": "ID", "type": "text", "order": 2},
        {"key": "created_at", "label": "Erfasst", "type": "date", "format": "dd.MM.yyyy", "order": 3}
    ]'::jsonb
);
```

### 4. Layer-Gruppen (TOC-Organisation)

```sql
CREATE TABLE layer_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_expanded BOOLEAN DEFAULT true,
    parent_id INTEGER REFERENCES layer_groups(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE layer_group_members (
    layer_id INTEGER REFERENCES layers(id),
    group_id INTEGER REFERENCES layer_groups(id),
    sort_order INTEGER DEFAULT 0,
    PRIMARY KEY (layer_id, group_id)
);
```

### 5. User & Permissions

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer',  -- 'admin', 'editor', 'viewer'
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE layer_permissions (
    layer_id INTEGER REFERENCES layers(id),
    user_id INTEGER REFERENCES users(id),
    can_view BOOLEAN DEFAULT true,
    can_edit BOOLEAN DEFAULT false,
    PRIMARY KEY (layer_id, user_id)
);
```

---

## 🚀 Backend API (Next.js API Routes)

### Layer API

```typescript
// app/api/layers/route.ts
import { db } from '@/lib/db';

export async function GET() {
  const layers = await db.query(`
    SELECT 
      l.*,
      pt.fields as popup_fields
    FROM layers l
    LEFT JOIN popup_templates pt ON l.popup_template_id = pt.id
    WHERE l.enabled = true
    ORDER BY l.sort_order
  `);
  
  return Response.json(layers.rows);
}

// app/api/layers/[id]/route.ts
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  
  await db.query(`
    UPDATE layers 
    SET 
      name = $1,
      paint_properties = $2,
      updated_at = NOW()
    WHERE id = $3
  `, [body.name, body.paintProperties, params.id]);
  
  return Response.json({ success: true });
}
```

### Feature API

```typescript
// app/api/features/[layerId]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { layerId: string } }
) {
  const { searchParams } = new URL(request.url);
  const bbox = searchParams.get('bbox');  // "minx,miny,maxx,maxy"
  
  const layer = await getLayerConfig(params.layerId);
  
  const query = `
    SELECT 
      id,
      ST_AsGeoJSON(geom) as geometry,
      *
    FROM ${layer.source_table}
    WHERE ST_Intersects(
      geom, 
      ST_MakeEnvelope($1, $2, $3, $4, 4326)
    )
    LIMIT 100
  `;
  
  const features = await db.query(query, bbox.split(','));
  
  return Response.json({
    type: "FeatureCollection",
    features: features.rows
  });
}
```

---

## 🗺️ Vector Tile Server

### Option 1: pg_tileserv (Empfohlen)

**Vorteile:**
- Automatische MVT-Generierung aus PostGIS
- Keine Konfiguration nötig
- REST-API für Tiles
- Sehr performant

```bash
# Installation
docker run -p 7800:7800 \
  -e DATABASE_URL="postgres://user:pass@host/db" \
  pramsey/pg_tileserv

# Tiles verfügbar unter:
# http://localhost:7800/{schema}.{table}/{z}/{x}/{y}.pbf
```

**MapLibre Integration:**

```typescript
// app/lib/tile-sources.ts
export function createPostGISTileSource(
  tableName: string,
  options?: {
    minZoom?: number;
    maxZoom?: number;
    buffer?: number;
  }
) {
  return {
    type: "vector" as const,
    tiles: [
      `${process.env.NEXT_PUBLIC_TILE_SERVER_URL}/public.${tableName}/{z}/{x}/{y}.pbf`
    ],
    minzoom: options?.minZoom ?? 0,
    maxzoom: options?.maxZoom ?? 22,
    buffer: options?.buffer ?? 64,
  };
}
```

### Option 2: Martin

```bash
# Installation
docker run -p 3000:3000 \
  -e DATABASE_URL="postgres://user:pass@host/db" \
  maplibre/martin

# Mit Konfiguration
martin --config martin.yaml
```

---

## 🎨 Dynamic Layer Loading

### Frontend-Integration

```typescript
// app/lib/layers/use-dynamic-layers.ts
import { useQuery } from '@tanstack/react-query';

export function useDynamicLayers() {
  return useQuery({
    queryKey: ['layers'],
    queryFn: async () => {
      const res = await fetch('/api/layers');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,  // 5 Minuten Cache
  });
}

// app/map/core/use-dynamic-map-setup.ts
export function useDynamicMapSetup(map: MaplibreMap | null) {
  const { data: layers } = useDynamicLayers();
  
  useEffect(() => {
    if (!map || !layers) return;
    
    for (const layer of layers) {
      // 1. Source hinzufügen
      if (!map.getSource(layer.source_id)) {
        if (layer.source_type === 'postgis') {
          map.addSource(layer.source_id, 
            createPostGISTileSource(layer.source_table)
          );
        }
      }
      
      // 2. Layer hinzufügen
      if (!map.getLayer(layer.layer_id)) {
        map.addLayer({
          id: layer.layer_id,
          type: layer.layer_type,
          source: layer.source_id,
          'source-layer': layer.source_table,
          paint: layer.paint_properties,
          layout: layer.layout_properties,
        });
      }
    }
  }, [map, layers]);
}
```

---

## 🎛️ Admin Panel (Layer-Management)

### React Admin Setup

```typescript
// app/admin/page.tsx
import { Admin, Resource } from 'react-admin';
import { LayerList, LayerEdit, LayerCreate } from './layers';
import { PopupTemplateList, PopupTemplateEdit } from './popups';

export default function AdminPage() {
  return (
    <Admin dataProvider={dataProvider} authProvider={authProvider}>
      <Resource 
        name="layers" 
        list={LayerList} 
        edit={LayerEdit} 
        create={LayerCreate} 
      />
      <Resource 
        name="popup-templates" 
        list={PopupTemplateList} 
        edit={PopupTemplateEdit} 
      />
    </Admin>
  );
}
```

### Layer-Editor

```typescript
// app/admin/layers/LayerEdit.tsx
export function LayerEdit() {
  return (
    <Edit>
      <SimpleForm>
        <TextInput source="name" label="Layer-Name" />
        <SelectInput source="category" choices={categories} />
        
        <TextInput source="source_table" label="PostGIS-Tabelle" />
        
        <SelectInput source="layer_type" choices={[
          { id: 'circle', name: 'Punkte (Circle)' },
          { id: 'fill', name: 'Flächen (Fill)' },
          { id: 'line', name: 'Linien' },
        ]} />
        
        {/* Style-Editor */}
        <MapLibreStyleEditor source="paint_properties" />
        
        {/* Popup-Template */}
        <ReferenceInput source="popup_template_id" reference="popup-templates">
          <SelectInput optionText="name" />
        </ReferenceInput>
        
        <BooleanInput source="is_interactive" />
        <BooleanInput source="enabled" />
      </SimpleForm>
    </Edit>
  );
}
```

---

## 🎨 Popup-Template-Builder

### Visual Popup Editor

```typescript
// app/admin/popups/PopupTemplateBuilder.tsx
export function PopupTemplateBuilder() {
  const [fields, setFields] = useState<PopupField[]>([]);
  
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Editor */}
      <div>
        <h3>Felder konfigurieren</h3>
        
        <DndContext onDragEnd={handleDragEnd}>
          <SortableContext items={fields}>
            {fields.map(field => (
              <PopupFieldEditor 
                key={field.id}
                field={field}
                onChange={updateField}
              />
            ))}
          </SortableContext>
        </DndContext>
        
        <Button onClick={addField}>+ Feld hinzufügen</Button>
      </div>
      
      {/* Live-Preview */}
      <div>
        <h3>Vorschau</h3>
        <PopupPreview fields={fields} />
      </div>
    </div>
  );
}
```

---

## 📈 Migrations-Pfad

### Phase 1: PostGIS-Setup (1-2 Wochen)

1. PostgreSQL + PostGIS aufsetzen
2. GeoJSON → PostGIS migrieren
3. pg_tileserv einrichten
4. Frontend auf Vector Tiles umstellen

### Phase 2: Layer-API (1 Woche)

1. Datenbank-Schema erstellen
2. Layer-API implementieren
3. Frontend auf dynamisches Loading umstellen

### Phase 3: Admin-Panel (2 Wochen)

1. React Admin aufsetzen
2. Layer-CRUD implementieren
3. Style-Editor bauen

### Phase 4: Popup-Builder (1 Woche)

1. Popup-Template-Schema
2. Visual Builder UI
3. Frontend-Rendering

---

## 💰 Kosten-Nutzen

### Aktueller Ansatz (Plugin-System)
- ✅ Schneller Einstieg
- ✅ Volle Code-Kontrolle
- ❌ Manuelles Layer-Management
- ❌ Code-Änderungen für neue Layer
- ❌ Keine Nicht-Entwickler können Layer verwalten

### Datenbank-Ansatz
- ✅ Admin-UI für Layer-Management
- ✅ Keine Code-Änderungen für neue Layer
- ✅ Nicht-Entwickler können Layer verwalten
- ✅ Versionierung & Backup der Geodaten
- ✅ Performance durch Vector Tiles
- ❌ Höhere Infrastruktur-Komplexität
- ❌ Längere Entwicklungszeit

---

## 🎯 Empfehlung

### Sofort:
Behalte das Plugin-System für **Prototypen & spezielle Features** (Waldkauz-Charts, etc.)

### Mittelfristig (3-6 Monate):
1. PostGIS aufsetzen
2. Vector Tiles via pg_tileserv
3. Layer-API für einfache Layer

### Langfristig (6-12 Monate):
1. Vollständiges Admin-Panel
2. Popup-Template-Builder
3. User-Management

### Hybrid-Ansatz:
- **Standard-Layer**: Datenbank + Admin-UI
- **Spezial-Features**: Plugin-System (Charts, Audio, etc.)

---

## 📚 Weitere Ressourcen

- **pg_tileserv**: https://github.com/CrunchyData/pg_tileserv
- **Martin Tile Server**: https://github.com/maplibre/martin
- **React Admin**: https://marmelab.com/react-admin/
- **PostGIS Docs**: https://postgis.net/documentation/

---

**Fazit:** Dein Vorschlag ist absolut richtig für ein production-ready System. Der Migrations-Pfad zeigt, wie man schrittweise von der aktuellen Lösung dahin kommt.
