FROM debian:11.2
RUN apt update
RUN apt install build-essential zlib1g-dev libncurses5-dev libgdbm-dev libnss3-dev libssl-dev libreadline-dev libffi-dev libsqlite3-dev wget libbz2-dev wget curl python3 python3-pip -y
RUN wget https://www.python.org/ftp/python/3.8.0/Python-3.8.0.tgz
RUN tar -xzf Python-3.8.0.tgz && cd Python-3.8.0
RUN cd Python-3.8.0 && ./configure --enable-optimizations
RUN cd ./Python-3.8.0 && make -j 8
RUN cd ./Python-3.8.0 && make altinstall
RUN pip3.8 install chatterbot chatterbot_corpus flask 
RUN pip3.8 install Cython
RUN pip3.8 install spacy==2.1.9
RUN python3.8 -m spacy download en_core_web_sm
RUN python3.8 -m spacy link en_core_web_sm en
COPY ./chatbot/requirements.txt .
RUN pip3.8 install -r requirements.txt
COPY ./translation/requirements.txt .
RUN pip3.8 install -r requirements.txt
RUN pip3.8 install Flask
WORKDIR /home/app
COPY . .
CMD ["python3.8", "run.py"]