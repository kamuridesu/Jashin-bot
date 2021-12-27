from flask import Flask, json, request, jsonify, redirect
from bot import Bot
from messages_processor import MessagePreProcessor
import pathlib


def getAbosulteParent(path):
    return pathlib.Path(path).parent.absolute()


app = Flask(__name__)
bot = Bot()
bot.train(MessagePreProcessor(str(getAbosulteParent(getAbosulteParent(getAbosulteParent(__file__))))+ "/logger/messages.log").pre_processed_messages)


@app.route('/', methods=['GET'])
def index():
    if request.args.get('text'):
        response = bot.get_response(request.args.get('text'))
        return jsonify(response)
    else:
        return jsonify({"status": "error", "response": "No text parameter"})

if __name__ == '__main__':
    app.run(host="localhost", port=8080, debug=True)