FROM ghcr.io/pterodactyl/panel:latest

RUN apk add --no-cache mariadb-client

RUN mkdir -p /var/log/panel/logs/ /var/log/supervisord/ /var/log/nginx/ /var/log/php7/ \
    && chmod 777 /var/log/panel/logs/

# Create a wrapper script that adds --ssl-verify-server-cert=0 to mysql commands
RUN echo '#!/bin/ash' > /usr/local/bin/mysql && \
    echo 'exec /usr/bin/mariadb "$@" --ssl-verify-server-cert=0' >> /usr/local/bin/mysql && \
    chmod +x /usr/local/bin/mysql