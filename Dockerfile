FROM debian:11.2
WORKDIR /home
RUN apt update && apt install curl git ffmpeg nodejs npm webp -y || apt install curl git ffmpeg nodejs npm libwebp -y || apt install curl git ffmpeg nodejs libwebp -y -y 
COPY ./setup_docker.sh ./install.sh
RUN chmod +x ./install.sh
RUN ./install.sh && echo "yey"
COPY ./config/config.auth.json ./Jashin-bot/config/
COPY ./config/config.admin.json ./Jashin-bot/config/
COPY ./entrypoint.sh /usr/local/bin/
CMD ["entrypoint.sh"]