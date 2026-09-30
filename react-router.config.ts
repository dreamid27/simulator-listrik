import type { Config } from "@react-router/dev/config"

export default {
  // Situs statis untuk Cloudflare Pages / nginx: semua halaman di-prerender
  // saat build ke build/client, tanpa server Node.
  ssr: false,
  prerender: ["/", "/simulator"],
} satisfies Config
