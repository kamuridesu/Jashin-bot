#!/bin/bash
# verify package manager to install git ffmpeg, nodejs, npm, webp (apt, pacman, yum)
if [ "$1" != "-yt" ]; then  # if you don't want to install yt-dlp, use the -yt flag
    echo "Instalando yt-dlp..."
    curl https://gist.githubusercontent.com/kamuridesu/b56067968e154f16bfd1af6bde18e929/raw/4fcd89dc4fe756b8d65394ed7244c2577c299303/yt-dlp.sh | bash
fi

# check if current folder is not a git repository
echo "Baixando bot..."
if [ -d .git ]; then
    cd ..
    rm -rf Jashin-bot
fi

git clone https://github.com/kamuridesu/Jashin-bot.git 2>&1>/dev/null
cd Jashin-bot

# install node modules
npm i
echo $(pwd)
