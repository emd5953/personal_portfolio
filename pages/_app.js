// This file should be saved as: pages/_app.js

import { Analytics } from "@vercel/analytics/next"

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  )
}

export default MyApp