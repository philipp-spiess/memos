import stylesUrl from './styles.css?url'

const faviconHref = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Recording dot"><circle cx="32" cy="32" r="16" fill="#e11d48" /></svg>'
)}`

export const Document: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Talking into the Void</title>
      <meta
        name="description"
        content="A minimal interface for browsing and listening to transcribed voice memos."
      />
      <meta property="og:title" content="Talking into the Void" />
      <meta
        property="og:description"
        content="A minimal interface for browsing and listening to transcribed voice memos."
      />
      <meta property="og:type" content="website" />
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
