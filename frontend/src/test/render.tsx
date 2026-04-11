import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import type { ReactElement, ReactNode } from 'react'

interface WrapperOptions {
  initialRoute?: string
}

/**
 * Test helper that wraps a component in the router + helmet providers we
 * rely on throughout the app, so tests don't each re-do the plumbing.
 */
export function renderWithProviders(
  ui: ReactElement,
  { initialRoute = '/', ...options }: WrapperOptions & Omit<RenderOptions, 'wrapper'> = {},
) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <HelmetProvider>
      <MemoryRouter initialEntries={[initialRoute]}>{children}</MemoryRouter>
    </HelmetProvider>
  )

  return render(ui, { wrapper: Wrapper, ...options })
}
