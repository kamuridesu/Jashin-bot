from flask import Flask, json, request, jsonify, redirect
from chatbot.bot import Bot
import pathlib
from translation.translate import translate, getLanguages


def getAbosulteParent(path):
    return pathlib.Path(path).parent.absolute()


app = Flask(__name__)
bot = Bot()
bot.train_from_file((str(getAbosulteParent(getAbosulteParent((__file__))))+ "/logger/messages.log"))


@app.route('/chatbot', methods=['GET'])
def chatbot():
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
    app.run(host="0.0.0.0", port=9000, debug=True)