import { NextResponse } from "next/server";
import { situationResponse } from "@/lib/api";
export function GET() { return NextResponse.json(situationResponse(), { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" } }); }

