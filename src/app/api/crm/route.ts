import { NextResponse } from "next/server"
import {
  getClaimUrl,
  hasDatabaseUrl,
  loadCrmSnapshot,
  saveCrmSnapshot,
} from "@/lib/db"
import { DEFAULT_SETTINGS, type CityList, type Settings } from "@/lib/types"

export const dynamic = "force-dynamic"

function isCityList(value: unknown): value is CityList {
  if (!value || typeof value !== "object") return false
  const item = value as CityList
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    Array.isArray(item.businesses)
  )
}

export async function GET() {
  if (!hasDatabaseUrl()) {
    return NextResponse.json({
      ok: true,
      persistence: "local",
      lists: [],
      settings: DEFAULT_SETTINGS,
      claimUrl: null,
    })
  }

  try {
    const snapshot = await loadCrmSnapshot()
    return NextResponse.json({
      ok: true,
      persistence: "neon",
      lists: snapshot?.lists ?? [],
      settings: snapshot?.settings ?? DEFAULT_SETTINGS,
      claimUrl: getClaimUrl(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        persistence: "local",
        error: error instanceof Error ? error.message : "No se pudo leer la base",
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  if (!hasDatabaseUrl()) {
    return NextResponse.json(
      {
        ok: false,
        persistence: "local",
        error: "Falta DATABASE_URL. Creá una base Neon con npm run db:create",
      },
      { status: 503 }
    )
  }

  try {
    const body = (await request.json()) as {
      lists?: unknown
      settings?: Partial<Settings>
    }
    if (!Array.isArray(body.lists) || !body.lists.every(isCityList)) {
      return NextResponse.json(
        { ok: false, error: "El cuerpo no tiene listas válidas." },
        { status: 400 }
      )
    }

    await saveCrmSnapshot({
      lists: body.lists,
      settings: { ...DEFAULT_SETTINGS, ...body.settings },
    })

    return NextResponse.json({
      ok: true,
      persistence: "neon",
      claimUrl: getClaimUrl(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo guardar",
      },
      { status: 500 }
    )
  }
}
