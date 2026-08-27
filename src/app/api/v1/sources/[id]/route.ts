import { NextResponse } from "next/server";
import { sourceRegistry } from "@/lib/api";
export function GET(_request: Request, context: { params: Promise<{ id: string }> }) { return context.params.then(({ id }) => sourceRegistry[id] ? NextResponse.json(sourceRegistry[id]) : NextResponse.json({ error: "Source not found" }, { status: 404 })); }

