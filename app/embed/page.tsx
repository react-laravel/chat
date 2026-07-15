import { EmbedClient } from './EmbedClient'

export default async function EmbedPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>
}) {
  const { client } = await searchParams
  return <EmbedClient clientId={client ?? ''} />
}
