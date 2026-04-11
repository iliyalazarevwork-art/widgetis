import { setupServer } from 'msw/node'

// Handlers are added per test via server.use(...).
export const server = setupServer()
