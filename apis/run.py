import os
from app import getAbosulteParent
import json
import subprocess as sp

HOST = "0.0.0.0"
PORT = 8080

with open(str(getAbosulteParent(getAbosulteParent((__file__))))+ "/common_conf/routes.json", "r") as f:
    routes = json.loads(f.read())
    HOST = routes['chatbot']["host"]
    PORT = routes['chatbot']["port"]


def run_api():
    global HOST
    if HOST == "0.0.0.0" or HOST == "chatbot":
        HOST = "localhost"
    with open("exec.sh", "w", encoding="utf-8") as f:
        f.write(f"""sleep 4 && curl {HOST}:{PORT} &
python3.8 app.py""")

    sp.run("chmod +x exec.sh", shell=True)
    sp.run("./exec.sh", shell=True)
    while True:
        pass


if __name__ == '__main__':
    run_api()