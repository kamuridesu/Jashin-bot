import os
from app import getAbosulteParent
import json

HOST = "0.0.0.0"
PORT = 8080

with open(str(getAbosulteParent(getAbosulteParent((__file__))))+ "/common_conf/routes.json", "r") as f:
    routes = json.loads(f.read())
    HOST = routes['chatbot']["host"]
    PORT = routes['chatbot']["port"]


def run_api():
    global HOST
    if HOST == "0.0.0.0":
        HOST = "localhost"
    with open("exec.sh", "w", encoding="utf-8") as f:
        f.write(f"""sleep 4 && curl {HOST}:{PORT} &
python3 app.py""")

    os.system("chmod +x exec.sh")
    os.system("./exec.sh")


if __name__ == '__main__':
    run_api()