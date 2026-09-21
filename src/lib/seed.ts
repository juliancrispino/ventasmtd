import type { Business, CityList } from "@/lib/types"

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString()
}

function business(
  partial: Omit<Business, "id" | "contacted" | "respondedOk" | "respondedNo" | "lastMessageAt"> &
    Partial<Pick<Business, "contacted" | "respondedOk" | "respondedNo" | "lastMessageAt">>
): Business {
  return {
    id: crypto.randomUUID(),
    contacted: false,
    respondedOk: false,
    respondedNo: false,
    lastMessageAt: null,
    ...partial,
  }
}

export function createSampleList(): CityList {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title: "Mar del Plata",
    createdAt: now,
    updatedAt: now,
    sourceFileName: "ejemplo-mar-del-plata.csv",
    businesses: [
      business({
        name: "ALMA Estilistas",
        category: "Peluquería",
        address: "Córdoba 3298 (esq. Roca), Mar del Plata",
        phone: "+542234593893",
        social: "",
        contacted: true,
        lastMessageAt: daysAgo(21),
      }),
      business({
        name: "Diego Dap's",
        category: "Peluquería",
        address: "San Luis 2608, Mar del Plata",
        phone: "+542234460252",
        social: "",
        contacted: true,
        respondedOk: true,
        lastMessageAt: daysAgo(4),
      }),
      business({
        name: "Geo Estilistas",
        category: "Peluquería",
        address: "Rivadavia 2522, Mar del Plata",
        phone: "+542236335707",
        social: "",
        contacted: true,
        respondedNo: true,
        lastMessageAt: daysAgo(9),
      }),
      business({
        name: "URBAN CUT Barbería",
        category: "Barbería / Peluquería",
        address: "Rawson 1774, Mar del Plata",
        phone: "+541126334403",
        social: "",
      }),
      business({
        name: "White Estilistas y Barberos",
        category: "Barbería / Peluquería",
        address: "La Rioja 1918, Mar del Plata",
        phone: "+542235717652",
        social: "",
      }),
      business({
        name: "Peluquería Nurihar de Mary Sierra",
        category: "Peluquería",
        address: "Av. T. A. Edison 1099, Mar del Plata",
        phone: "+542235246796",
        social: "",
        contacted: true,
        lastMessageAt: daysAgo(2),
      }),
      business({
        name: "Florencia Chica Estilista",
        category: "Peluquería / Estética",
        address: "Olavarría 2268, Mar del Plata",
        phone: "+542236339525",
        social: "",
      }),
      business({
        name: "Salón de Belleza María Susana",
        category: "Salón de belleza",
        address: "Av. J. H. Jara 434, Mar del Plata",
        phone: "+542234731057",
        social: "",
      }),
      business({
        name: "Niki Beauty Bar Mar del Plata",
        category: "Centro de estética",
        address: "San Luis 1989, Mar del Plata",
        phone: "+541168110437",
        social: "",
        contacted: true,
        lastMessageAt: daysAgo(18),
      }),
      business({
        name: "AWWA Láser & Estética",
        category: "Centro de estética",
        address: "Gral. Roca 1522, Mar del Plata",
        phone: "+542236867257",
        social: "",
      }),
      business({
        name: "Lyssa Beauty Studio",
        category: "Centro de estética",
        address: "3 de Febrero 2934, Mar del Plata",
        phone: "+542236237391",
        social: "",
      }),
      business({
        name: "MIMOSCOTA",
        category: "Estética / Peluquería canina",
        address: "Bolívar 3268, Mar del Plata",
        phone: "+542233390282",
        social: "@mimoscota",
        contacted: true,
        lastMessageAt: daysAgo(16),
      }),
      business({
        name: "Peluquería Canina Sebastian",
        category: "Peluquería canina",
        address: "Corrientes 2524, Mar del Plata",
        phone: "+542235769117",
        social: "",
      }),
      business({
        name: "Animalito's Estética Canina y Boutique",
        category: "Estética / Peluquería canina",
        address: "Moreno 2843, Mar del Plata",
        phone: "+542235911737",
        social: "",
      }),
      business({
        name: "De Pelos Estética Canina",
        category: "Estética canina",
        address: "French 5453, Mar del Plata",
        phone: "+542233575400",
        social: "",
        contacted: true,
        respondedOk: true,
        lastMessageAt: daysAgo(1),
      }),
      business({
        name: "LAVADERO CANINO",
        category: "Lavadero / Peluquería canina",
        address: "Av. Jacinto Peralta Ramos 555, Mar del Plata",
        phone: "+542234780096",
        social: "",
      }),
    ],
  }
}
