import { readFileSync } from "node:fs"
import { neon } from "@neondatabase/serverless"

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=")
      return [line.slice(0, index), line.slice(index + 1).replaceAll(/^"|"$/g, "")]
    })
)

const sql = neon(env.DATABASE_URL)
const tablas = await sql`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
  ORDER BY table_name
`
const columnas = await sql`
  SELECT column_name
  FROM information_schema.columns
  WHERE table_name = 'negocios'
  ORDER BY ordinal_position
`
console.log(
  JSON.stringify(
    {
      tablas: tablas.map((row) => row.table_name),
      negocios: columnas.map((row) => row.column_name),
    },
    null,
    2
  )
)
