import stylesUrl from './styles.css?url'
import type { RequestInfo } from 'rwsdk/runtime/requestInfo/types'
import type { AppContext } from './types'

const faviconHref = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Recording dot"><circle cx="32" cy="32" r="16" fill="#e11d48" /></svg>'
)}`

type DocumentProps = RequestInfo<any, AppContext> & { children: React.ReactNode }

export const Document: React.FC<DocumentProps> = ({ children, ctx }) => {
  const title = ctx?.meta?.title ?? 'Talking into the Void'
  const description =
    ctx?.meta?.description ?? 'A minimal interface for browsing and listening to transcribed voice memos.'
  const image = ctx?.meta?.image ?? '/og.png'

  return (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={image} />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&display=swap"
        rel="stylesheet"
      />
      <link rel="icon" type="image/svg+xml" href={faviconHref} />
      <link rel="stylesheet" href={stylesUrl} />
      <link rel="modulepreload" href="/src/client.tsx" />
    </head>
    <body>
      <div id="root">{children}</div>
      <script type="module" src="/src/client.tsx" />
    </body>
  </html>
  )
}
