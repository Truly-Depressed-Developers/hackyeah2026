/// <reference types="msw/vite/client" />

// DEV is statically false in prod builds, so the worker never ships.
export async function enableMocks() {
  if (!import.meta.env.DEV || import.meta.env.VITE_MOCK_SEARCH !== 'true') return
  const { network } = await import('virtual:msw')
  const { handlers } = await import('./handlers')
  network.configure({ handlers })
  await network.enable()
}
