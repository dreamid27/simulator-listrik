import { data } from "react-router"

// Rute tangkap-semua: dilempar ke ErrorBoundary root sebagai 404.
export function clientLoader() {
  throw data(null, { status: 404 })
}

export default function NotFound() {
  return null
}
