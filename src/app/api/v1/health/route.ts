import { NextResponse } from "next/server";
import { dataset, sourceRegistry } from "@/lib/api";
export function GET() { return NextResponse.json({ status: "ok", datasetVersion: dataset.version, publishedAt: dataset.publishedAt, approvedSources: Object.keys(sourceRegistry).length, freshness: "review-required" }); }

