import { NextResponse } from "next/server";
import { dataset, versions } from "@/lib/api";
export function GET() { return NextResponse.json({ data: versions, metadata: dataset }); }

