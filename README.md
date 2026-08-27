# Nepal Flash Flood Dashboard

An evidence-led interactive map of the 26 August 2026 Bhotekoshi–Trishuli flash flood. It combines a guided incident timeline, interactive map layers, source provenance, downloadable event data, and clear distinctions between reported observations and estimated progression.

> This is a public-information visualization, not an emergency-warning, navigation, or hydraulic-forecasting system.

## Features

- Interactive MapLibre map with pan, zoom, pitch, and event selection
- Animated, time-stepped flood route with playback controls
- Reported versus estimated evidence labels and direct source links
- Affected-place, infrastructure, district, and satellite-context layers
- Responsive interface with reduced-motion support
- Versioned situation, event, source, revision, and health APIs
- GeoJSON and CSV event downloads

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification

```bash
npm run lint
npm run build
```

## Public API

| Endpoint | Description |
| --- | --- |
| `/api/v1/situation` | Approved situation summary and dataset version |
| `/api/v1/events` | Event observations as GeoJSON |
| `/api/v1/events?format=csv` | Downloadable event table |
| `/api/v1/sources/:id` | Source provenance and supported claims |
| `/api/v1/versions` | Dataset revision history |
| `/api/v1/health` | Service and dataset freshness metadata |

See [data operations](docs/DATA_OPERATIONS.md) and the [geospatial method](docs/GEOSPATIAL_METHOD.md) for publication and interpretation rules.

## Data responsibility

Incident totals can change rapidly. Every public value must carry a verification time and source. Animated movement between cited locations is illustrative interpolation; it must not be interpreted as measured velocity, depth, extent, or arrival prediction.

## License

Application code is released under the MIT License. Dashboard-authored datasets are intended for CC BY 4.0 reuse; third-party source materials and map tiles retain their original terms.

