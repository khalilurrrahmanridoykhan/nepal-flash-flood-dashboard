import { situation, timelineEvents } from "./incident-data";

export const dataset = {
  version: "2026.08.27-1",
  publishedAt: "2026-08-27T14:30:00+05:45",
  status: "approved" as const,
  license: "CC BY 4.0 for dashboard-authored data; source materials retain their original terms",
};

export const sourceRegistry = timelineEvents.reduce<Record<string, { id: string; publisher: string; url: string; claims: string[] }>>((registry, event) => {
  const id = event.source.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  registry[id] ??= { id, publisher: event.source, url: event.sourceUrl, claims: [] };
  registry[id].claims.push(event.id);
  return registry;
}, {});

export function situationResponse() { return { data: situation, metadata: dataset }; }
export function eventsGeoJson() {
  return { type: "FeatureCollection" as const, features: timelineEvents.map(({ coordinates, ...event }) => ({ type: "Feature" as const, id: event.id, geometry: { type: "Point" as const, coordinates }, properties: { ...event, datasetVersion: dataset.version } })), metadata: dataset };
}

export const versions = [
  { version: "2026.08.27-1", publishedAt: dataset.publishedAt, summary: "Initial reviewed public dataset", status: "current" },
  { version: "2026.08.26-1", publishedAt: "2026-08-26T22:00:00+05:45", summary: "Initial event route and preliminary reported totals", status: "superseded" },
];

