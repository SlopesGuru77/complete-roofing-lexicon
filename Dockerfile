FROM zeabur/caddy-static
LABEL "language"="static"
COPY index.html sw.js manifest.json og-cover.png icon-192.png icon-512.png icon-maskable.png /usr/share/caddy/
