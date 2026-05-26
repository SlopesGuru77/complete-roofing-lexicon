FROM nginx:alpine
LABEL "language"="static"
RUN sed -i 's|listen       80;|listen       8080;|' /etc/nginx/conf.d/default.conf
COPY index.html sw.js manifest.json og-cover.png icon-192.png icon-512.png icon-maskable.png /usr/share/nginx/html/
EXPOSE 8080
