from flask import Flask, json, request, jsonify, redirect
from chatbot.bot import Bot
import pathlib
import json
from translation.translate import translate, getLanguages
import threading
import random


def getAbosulteParent(path):
    return pathlib.Path(path).parent.absolute()


app = Flask(__name__)
processes = {}
thread_id = random.randint(0, 100000)
processes[thread_id] = Bot((str(getAbosulteParent(getAbosulteParent((__file__))))+ "/logger/messages.log"))
bot = processes[thread_id]

HOST = "0.0.0.0"
PORT = 8080
RUNNING = False

with open(str(getAbosulteParent(getAbosulteParent((__file__))))+ "/common_conf/routes.json", "r") as f:
    routes = json.loads(f.read())
    HOST = routes['chatbot']["host"]
    PORT = routes['chatbot']["port"]

@app.route("/")
def index():
    processes[thread_id].run()
    global RUNNING
    RUNNING = True
    return redirect("/chatbot")

@app.route('/chatbot', methods=['GET'])
def chatbot():
    global RUNNING
    if not RUNNING:
        return redirect("/")
    if request.args.get('text'):
        response = bot.get_response(request.args.get('text'))
        return jsonify({"status": "OK", "text": response})
    else:
        return jsonify({"status": "error", "response": "No text parameter"})

@app.route('/translate', methods=['GET'])
def translate_text():
    print(request)
    if request.args.get('text') and request.args.get('target'):
        response = translate(request.args.get('text'), request.args.get('target'))
        return jsonify({"status": "OK", "text": response})
    else:
        return jsonify({"status": "error", "response": "No parameter"})


@app.route("/languages", methods=['GET'])
def languages():
    return jsonify({"status": "OK", "text": getLanguages()})

if __name__ == '__main__':
    app.run(host=HOST, port=PORT, debug=True)