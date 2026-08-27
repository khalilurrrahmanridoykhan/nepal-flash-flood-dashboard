export type EvidenceStatus = "observed" | "reported" | "estimated";
export type TimelineEvent = { id: string; time: string; minutes: number; place: string; district: string; coordinates: [number, number]; status: EvidenceStatus; summary: string; detail: string; source: string; sourceUrl: string };

export const timelineEvents: TimelineEvent[] = [
  { id: "origin", time: "09:00", minutes: 0, place: "Northern border", district: "Rasuwa", coordinates: [85.3770, 28.2781], status: "reported", summary: "Sudden surge enters the Lhende–Bhotekoshi system", detail: "A large pulse of water, sediment and boulders was reported moving south from the Tibet side of the border.", source: "ICIMOD media advisory", sourceUrl: "https://www.icimod.org/press-release/major-flash-flood-sweeps-through-nepals-rasuwa-district-raising-fears-of-further-downstream-flooding/" },
  { id: "timure", time: "09:15", minutes: 15, place: "Timure", district: "Rasuwa", coordinates: [85.3428, 28.1789], status: "observed", summary: "Flood reaches Timure and the border trade corridor", detail: "Markets, roads and border infrastructure were reported damaged as the flood moved through the narrow valley.", source: "The Kathmandu Post", sourceUrl: "https://kathmandupost.com/national/2026/08/26/major-flood-damages-syabrubesi-hydropower-projects-in-rasuwa" },
  { id: "syabrubesi", time: "09:35", minutes: 35, place: "Syabrubesi", district: "Rasuwa", coordinates: [85.3413, 28.1644], status: "reported", summary: "The surge continues through Syabrubesi", detail: "Settlements and hydropower infrastructure along the river corridor were affected.", source: "OnlineKhabar", sourceUrl: "https://english.onlinekhabar.com/rasuwa-flood-damage-places.html" },
  { id: "mailung", time: "10:10–10:40", minutes: 70, place: "Mailung", district: "Rasuwa", coordinates: [85.2069, 28.0695], status: "estimated", summary: "Estimated downstream progression through Mailung", detail: "The displayed time is interpolated between reported locations and is not an official arrival time.", source: "Dashboard interpolation", sourceUrl: "#methodology" },
  { id: "betrawati", time: "11:10", minutes: 130, place: "Betrawati", district: "Nuwakot", coordinates: [85.1769, 27.9656], status: "reported", summary: "Flood enters the wider Trishuli corridor", detail: "Damage was reported along the Betrawati–Rasuwagadhi road and at multiple bridges.", source: "The Kathmandu Post", sourceUrl: "https://kathmandupost.com/national/2026/08/26/update-rasuwa-flood-death-toll-climbs-to-72-as-dozens-remain-missing" },
  { id: "trishuli", time: "12:00–13:00", minutes: 210, place: "Trishuli Bazaar", district: "Nuwakot", coordinates: [85.1447, 27.9210], status: "estimated", summary: "Estimated arrival in the Trishuli valley", detail: "Authorities warned communities downstream to remain away from the river corridor.", source: "DHM warning via media", sourceUrl: "https://english.onlinekhabar.com/flood-tibet-rasuwa-damage.html" },
  { id: "devighat", time: "Afternoon", minutes: 270, place: "Devighat", district: "Nuwakot", coordinates: [85.1144, 27.8696], status: "reported", summary: "Downstream impacts extend to Devighat", detail: "The event continued toward the Narayani system while rescue and assessment operations expanded.", source: "Associated Press", sourceUrl: "https://apnews.com/article/61b592d428e4631add31ce052d0daf1f" },
];
export const riverCoordinates = timelineEvents.map((event) => event.coordinates);
export const situation = { status: "Active response", verifiedAt: "27 Aug 2026 · 14:30 NPT", deaths: 168, missing: "1,300+", districts: 7, roadDamage: "~40 km" };
export const layers = [
  { id: "route", label: "Flood route", color: "#35b9ff", defaultOn: true },
  { id: "places", label: "Affected places", color: "#ffb454", defaultOn: true },
  { id: "infrastructure", label: "Infrastructure", color: "#d4ff62", defaultOn: true },
  { id: "districts", label: "District boundaries", color: "#a6afbd", defaultOn: false },
  { id: "satellite", label: "Satellite imagery", color: "#bd9bff", defaultOn: false },
];

export const infrastructure = [
  { id: "rasuwagadhi", name: "Rasuwagadhi HEP", kind: "Hydropower", coordinates: [85.364, 28.219], status: "Damage reported" },
  { id: "chilime", name: "Chilime HEP", kind: "Hydropower", coordinates: [85.315, 28.187], status: "Damage reported" },
  { id: "trishuli3a", name: "Trishuli 3A", kind: "Hydropower", coordinates: [85.183, 27.989], status: "Damage reported" },
  { id: "trishuli3b", name: "Trishuli 3B hub", kind: "Substation", coordinates: [85.174, 27.951], status: "Damage reported" },
];

export const districtOutlines = {
  type: "FeatureCollection" as const,
  features: [
    { type: "Feature" as const, properties: { name: "Rasuwa" }, geometry: { type: "Polygon" as const, coordinates: [[[85.05, 27.92], [85.05, 28.34], [85.52, 28.34], [85.52, 27.92], [85.05, 27.92]]] } },
    { type: "Feature" as const, properties: { name: "Nuwakot" }, geometry: { type: "Polygon" as const, coordinates: [[[84.98, 27.72], [84.98, 28.04], [85.42, 28.04], [85.42, 27.72], [84.98, 27.72]]] } },
  ],
};
