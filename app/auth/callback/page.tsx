import { SsoCallback } from './sso-callback'

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{
    ticket?: string
    return_to?: string
    embedded?: string
    client?: string
    parent_origin?: string
  }>
}) {
  const params = await searchParams
  return (
    <SsoCallback
      ticket={params.ticket ?? ''}
      returnTo={params.return_to ?? '/chat'}
      embedded={params.embedded === '1'}
      clientId={params.client}
      parentOrigin={params.parent_origin}
    />
  )
}
