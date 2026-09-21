"use client"

import { useSyncExternalStore } from "react"
import {
  DEFAULT_SETTINGS,
  type AppState,
  type Business,
  type CityList,
  type ParsedRow,
  type Settings,
} from "@/lib/types"
import { normalizePhone } from "@/lib/phone"

const DB_NAME = "mtd-crm-v2"
const STORE_NAME = "kv"
const STATE_KEY = "state"
const STORAGE_KEY = "mtd-crm-v2"

const EMPTY_STATE: AppState = {
  version: 1,
  lists: [],
  settings: DEFAULT_SETTINGS,
  hydrated: false,
  persistence: "local",
  claimUrl: null,
  cloudError: null,
}

let memoryState: AppState = EMPTY_STATE
const listeners = new Set<() => void>()
let hydrateStarted = false

function emit() {
  for (const listener of listeners) listener()
}

function setState(next: AppState) {
  memoryState = next
  emit()
  if (next.hydrated) {
    void persist(next)
  }
}

function snapshot(): Omit<AppState, "hydrated" | "persistence" | "claimUrl" | "cloudError"> {
  return {
    version: 1,
    lists: memoryState.lists,
    settings: memoryState.settings,
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function persistPayload(state: AppState) {
  return JSON.stringify({
    version: 1,
    lists: state.lists,
    settings: state.settings,
  })
}

async function persistLocal(state: AppState) {
  const payload = persistPayload(state)
  try {
    localStorage.setItem(STORAGE_KEY, payload)
  } catch {
    // quota
  }
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite")
      tx.objectStore(STORE_NAME).put(payload, STATE_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    // private mode
  }
}

let cloudTimer: ReturnType<typeof setTimeout> | null = null
let cloudWrite = 0

async function persistCloud(state: AppState) {
  if (state.persistence !== "neon") {
    await persistLocal(state)
    return
  }
  const ticket = ++cloudWrite
  try {
    const response = await fetch("/api/crm", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: persistPayload(state),
    })
    const data = (await response.json()) as { ok?: boolean; error?: string }
    if (ticket !== cloudWrite) return
    if (!response.ok || !data.ok) {
      throw new Error(data.error || "No se pudo guardar en Neon")
    }
    if (memoryState.cloudError) {
      setState({ ...memoryState, cloudError: null })
    }
    await persistLocal(state)
  } catch (error) {
    if (ticket !== cloudWrite) return
    setState({
      ...memoryState,
      cloudError: error instanceof Error ? error.message : "No se pudo guardar en Neon",
    })
    await persistLocal(state)
  }
}

function persist(state: AppState) {
  void persistLocal(state)
  if (cloudTimer) clearTimeout(cloudTimer)
  cloudTimer = setTimeout(() => {
    void persistCloud(memoryState)
  }, 400)
}

function parsePersisted(raw: string | null): Pick<AppState, "lists" | "settings"> | null {
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as Partial<AppState>
    if (!data || data.version !== 1 || !Array.isArray(data.lists)) return null
    return {
      lists: data.lists,
      settings: { ...DEFAULT_SETTINGS, ...data.settings },
    }
  } catch {
    return null
  }
}

async function readPersisted(): Promise<Pick<AppState, "lists" | "settings"> | null> {
  try {
    const db = await openDb()
    const fromDb = await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly")
      const request = tx.objectStore(STORE_NAME).get(STATE_KEY)
      request.onsuccess = () => resolve((request.result as string | undefined) ?? null)
      request.onerror = () => reject(request.error)
    })
    db.close()
    const parsed = parsePersisted(fromDb)
    if (parsed) return parsed
  } catch {
    // ignore
  }
  if (typeof localStorage !== "undefined") {
    return parsePersisted(localStorage.getItem(STORAGE_KEY))
  }
  return null
}

export async function hydrateStore() {
  if (hydrateStarted) return
  hydrateStarted = true
  const persisted = await readPersisted()

  try {
    const response = await fetch("/api/crm")
    const data = (await response.json()) as {
      ok?: boolean
      persistence?: "neon" | "local"
      lists?: AppState["lists"]
      settings?: Settings
      claimUrl?: string | null
      error?: string
    }
    if (response.ok && data.ok && data.persistence === "neon") {
      const cloudLists = Array.isArray(data.lists) ? data.lists : []
      const cloudSettings = { ...DEFAULT_SETTINGS, ...data.settings }
      if (cloudLists.length === 0 && persisted && persisted.lists.length > 0) {
        setState({
          version: 1,
          lists: persisted.lists,
          settings: persisted.settings,
          hydrated: true,
          persistence: "neon",
          claimUrl: data.claimUrl ?? null,
          cloudError: null,
        })
        await persistCloud(memoryState)
        return
      }
      setState({
        version: 1,
        lists: cloudLists,
        settings: cloudSettings,
        hydrated: true,
        persistence: "neon",
        claimUrl: data.claimUrl ?? null,
        cloudError: null,
      })
      return
    }
  } catch {
    // seguimos con el cache local
  }

  setState({
    version: 1,
    lists: persisted?.lists ?? [],
    settings: persisted?.settings ?? DEFAULT_SETTINGS,
    hydrated: true,
    persistence: "local",
    claimUrl: null,
    cloudError: persisted
      ? null
      : "La app está usando este navegador. Conectá Neon para guardar online.",
  })
}

export async function resetDatabase() {
  setState({
    version: 1,
    lists: [],
    settings: DEFAULT_SETTINGS,
    hydrated: true,
    persistence: memoryState.persistence,
    claimUrl: memoryState.claimUrl,
    cloudError: null,
  })
}

function touchList(list: CityList, patch: Partial<CityList>): CityList {
  return { ...list, ...patch, updatedAt: new Date().toISOString() }
}

function parsedToBusiness(row: ParsedRow): Business {
  return {
    id: crypto.randomUUID(),
    name: row.name,
    category: row.category,
    address: row.address,
    phone: row.phone,
    social: row.social,
    contacted: row.contacted,
    respondedOk: row.respondedOk,
    respondedNo: row.respondedNo,
    lastMessageAt: row.lastMessageAt,
  }
}

export function subscribeStore(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getStoreSnapshot() {
  return memoryState
}

export function getServerSnapshot() {
  return EMPTY_STATE
}

export function useAppStore() {
  return useSyncExternalStore(subscribeStore, getStoreSnapshot, getServerSnapshot)
}

export function createListFromRows(
  title: string,
  rows: ParsedRow[],
  sourceFileName?: string
): CityList {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    createdAt: now,
    updatedAt: now,
    sourceFileName,
    businesses: rows.map(parsedToBusiness),
  }
}

export function addList(list: CityList) {
  setState({
    ...memoryState,
    lists: [list, ...memoryState.lists],
  })
}

export function importRows(
  rows: ParsedRow[],
  sourceFileName?: string,
  options?: { appendToListId?: string; fallbackCity?: string }
): { added: number; listsTouched: string[] } {
  if (options?.appendToListId) {
    const before = memoryState.lists.find((list) => list.id === options.appendToListId)
    const existing = before?.businesses.length ?? 0
    appendRows(options.appendToListId, rows, sourceFileName)
    const after = memoryState.lists.find((list) => list.id === options.appendToListId)
    return {
      added: Math.max(0, (after?.businesses.length ?? 0) - existing),
      listsTouched: after ? [after.title] : [],
    }
  }

  const grouped = new Map<string, ParsedRow[]>()
  for (const row of rows) {
    const city = (row.city || options?.fallbackCity || "").trim() || "Sin ciudad"
    const current = grouped.get(city) ?? []
    current.push(row)
    grouped.set(city, current)
  }

  const listsTouched: string[] = []
  let added = 0
  for (const [city, cityRows] of grouped) {
    const existing = memoryState.lists.find(
      (list) => list.title.trim().toLowerCase() === city.toLowerCase()
    )
    if (existing) {
      const countBefore = existing.businesses.length
      appendRows(existing.id, cityRows, sourceFileName)
      const updated = memoryState.lists.find((list) => list.id === existing.id)
      added += Math.max(0, (updated?.businesses.length ?? 0) - countBefore)
      listsTouched.push(city)
    } else {
      addList(createListFromRows(city, cityRows, sourceFileName))
      added += cityRows.length
      listsTouched.push(city)
    }
  }
  return { added, listsTouched }
}

export function renameList(listId: string, title: string) {
  setState({
    ...memoryState,
    lists: memoryState.lists.map((list) =>
      list.id === listId ? touchList(list, { title: title.trim() }) : list
    ),
  })
}

export function deleteList(listId: string) {
  setState({
    ...memoryState,
    lists: memoryState.lists.filter((list) => list.id !== listId),
  })
}

export function appendRows(listId: string, rows: ParsedRow[], sourceFileName?: string) {
  setState({
    ...memoryState,
    lists: memoryState.lists.map((list) => {
      if (list.id !== listId) return list
      const existingPhones = new Set(
        list.businesses.map((item) => normalizePhone(item.phone)).filter(Boolean)
      )
      const next = rows
        .filter((row) => {
          const phone = normalizePhone(row.phone)
          if (phone && existingPhones.has(phone)) return false
          if (phone) existingPhones.add(phone)
          return true
        })
        .map(parsedToBusiness)
      return touchList(list, {
        businesses: [...list.businesses, ...next],
        sourceFileName: sourceFileName ?? list.sourceFileName,
      })
    }),
  })
}

export function updateBusiness(
  listId: string,
  businessId: string,
  patch: Partial<Business>
) {
  setState({
    ...memoryState,
    lists: memoryState.lists.map((list) => {
      if (list.id !== listId) return list
      return touchList(list, {
        businesses: list.businesses.map((item) =>
          item.id === businessId ? { ...item, ...patch } : item
        ),
      })
    }),
  })
}

export function addBusiness(listId: string, row: ParsedRow) {
  appendRows(listId, [row])
}

export function deleteBusiness(listId: string, businessId: string) {
  setState({
    ...memoryState,
    lists: memoryState.lists.map((list) => {
      if (list.id !== listId) return list
      return touchList(list, {
        businesses: list.businesses.filter((item) => item.id !== businessId),
      })
    }),
  })
}

export function updateSettings(patch: Partial<Settings>) {
  setState({
    ...memoryState,
    settings: { ...memoryState.settings, ...patch },
  })
}

export function importBackup(
  state: Pick<AppState, "lists" | "settings"> & { version: 1 }
) {
  setState({
    version: 1,
    lists: state.lists,
    settings: { ...DEFAULT_SETTINGS, ...state.settings },
    hydrated: true,
    persistence: memoryState.persistence,
    claimUrl: memoryState.claimUrl,
    cloudError: null,
  })
}

export function exportBackup(): string {
  return JSON.stringify(snapshot(), null, 2)
}

export function countAppended(listId: string, rows: ParsedRow[]): {
  added: number
  duplicates: number
} {
  const list = memoryState.lists.find((item) => item.id === listId)
  if (!list) return { added: rows.length, duplicates: 0 }
  const existingPhones = new Set(
    list.businesses.map((item) => normalizePhone(item.phone)).filter(Boolean)
  )
  let duplicates = 0
  let added = 0
  for (const row of rows) {
    const phone = normalizePhone(row.phone)
    if (phone && existingPhones.has(phone)) {
      duplicates += 1
    } else {
      added += 1
      if (phone) existingPhones.add(phone)
    }
  }
  return { added, duplicates }
}
