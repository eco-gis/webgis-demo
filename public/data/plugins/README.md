# Plugin Data Directory Structure

This directory contains plugin-specific data files organized by plugin ID.

## Structure

```
/public/data/plugins/
  <plugin-id>/          # e.g., waldkauz, fledermaus
    *.geojson           # GeoJSON files
    json/               # JSON data
    soundsample/        # Audio files
    images/             # Images
    ...                 # Other plugin-specific assets
```

## Example: Waldkauz Plugin

```
/public/data/plugins/waldkauz/
  waldkauz_location.geojson
  buffer_500.geojson
  buffer_1000.geojson
  buffer_2000.geojson
  json/
    presence_data.json
  soundsample/
    location_01.mp3
    location_01.vtt
```

## Usage in Plugins

Plugins reference their data using relative paths from `/public/`:

```typescript
// In plugin overlay definition
{
  type: "geojson",
  data: "/data/plugins/<plugin-id>/file.geojson"
}

// In plugin components
fetch(`/data/plugins/<plugin-id>/json/data.json`)
```
