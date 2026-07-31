import { MetadataRoute } from "next"

export const dynamic = "force-static"

const sitemap = (): MetadataRoute.Sitemap => [
  {
    url: "https://hrn.reload.co.jp/",
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 1,
  },
]

export default sitemap
