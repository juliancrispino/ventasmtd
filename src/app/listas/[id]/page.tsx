import { ListDetail } from "@/components/list-detail"

export default async function ListPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ListDetail listId={id} />
}
