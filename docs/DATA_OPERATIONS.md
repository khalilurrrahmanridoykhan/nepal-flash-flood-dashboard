# Data operations

The public dashboard reads only an approved, versioned dataset. New material must be staged, checked for malformed geometry, duplicate claims, timestamps, source URLs, and confidence language, then reviewed before publication.

## Public endpoints

- `/api/v1/situation` — approved headline figures and dataset version.
- `/api/v1/events` — GeoJSON event observations.
- `/api/v1/events?format=csv` — downloadable CSV.
- `/api/v1/sources/:id` — provenance for a source and its supported claims.
- `/api/v1/versions` — public correction and revision history.
- `/api/v1/health` — deployment and dataset freshness metadata.

## Publication rules

1. Never overwrite a published version; create a new version.
2. Treat changed casualty figures as a revision, not a silent correction.
3. Do not promote staged data without a named reviewer.
4. Preserve the exact source URL and retrieval timestamp.
5. Mark inferred route timing as estimated.
