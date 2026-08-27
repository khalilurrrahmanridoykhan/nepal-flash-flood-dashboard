import { NextRequest, NextResponse } from "next/server";
import { eventsGeoJson } from "@/lib/api";
export function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format") ?? "geojson"; const collection = eventsGeoJson();
  if (format === "csv") {
    const header = "id,time,place,district,status,longitude,latitude,source\n";
    const rows = collection.features.map((f) => [f.id, f.properties.time, f.properties.place, f.properties.district, f.properties.status, f.geometry.coordinates[0], f.geometry.coordinates[1], f.properties.source].map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\n");
    return new NextResponse(header + rows, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=nepal-flash-flood-events.csv" } });
  }
  return NextResponse.json(collection, { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" } });
}

