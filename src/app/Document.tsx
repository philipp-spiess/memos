import stylesUrl from './styles.css?url'

export const Document: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Memos</title>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&display=swap"
        rel="stylesheet"
      />
      <link rel="stylesheet" href={stylesUrl} />
      <link rel="modulepreload" href="/src/client.tsx" />
    </head>
    <body>
      <div id="root">{children}</div>
      <script type="module" src="/src/client.tsx" />
    </body>
  </html>
)
