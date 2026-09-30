import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router"

import { BrandMark } from "~/components/art/gear-art"
import { buttonVariants } from "~/components/ui/button"
import { SITE } from "~/lib/site"
import type { Route } from "./+types/root"
import "./app.css"

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
  { rel: "manifest", href: "/site.webmanifest" },
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={SITE.lang}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content={SITE.themeColor} />
        <meta name="color-scheme" content="light" />
        <meta name="author" content={SITE.author} />
        <meta name="format-detection" content="telephone=no" />
        <Meta />
        <Links />
      </head>
      <body>
        <a
          href="#konten"
          className="sr-only z-100 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Lewati ke konten utama
        </a>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}

export function HydrateFallback() {
  return (
    <main
      id="konten"
      className="grid min-h-svh place-items-center"
      aria-busy="true"
    >
      <BrandMark className="size-12 animate-pulse" />
      <span className="sr-only">Memuat…</span>
    </main>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let title = "Ada yang korslet"
  let details = "Terjadi kesalahan yang tidak terduga. Coba muat ulang halaman."
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = "Halaman tidak ditemukan"
      details =
        "Sepertinya kabelnya putus di sini. Halaman yang kamu cari tidak ada atau sudah dipindahkan."
    } else {
      title = `Kesalahan ${error.status}`
      details = error.statusText || details
    }
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main
      id="konten"
      className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center gap-4 p-6 text-center"
    >
      <title>{`${title} — ${SITE.name}`}</title>
      <meta name="robots" content="noindex" />
      <BrandMark className="size-14" />
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        {title}
      </h1>
      <p className="text-muted-foreground">{details}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link to="/" className={buttonVariants()}>
          Ke beranda
        </Link>
        <Link
          to="/simulator"
          className={buttonVariants({ variant: "outline" })}
        >
          Buka simulator
        </Link>
      </div>
      {stack && (
        <pre className="mt-4 w-full overflow-x-auto rounded-lg bg-muted p-4 text-left text-xs">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
