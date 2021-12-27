import requests
import subprocess as sp
from time import sleep
import multiprocessing as mp

def check():
    process = None
    if requests.get("https://pastebin.com/raw/74qJgaf8").text == "1":
        process = mp.Process(sp.call("npx nodemon /home/kamuri/Documentos/workspace/personal/Jashin-bot", shell=True))
        process.start()
        print("Bot started")
    else:
        if process != None:
            process.terminate()
            print("Bot stopped")

while True:
    check()
    sleep(1)