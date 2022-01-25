from googletrans import Translator
import googletrans


def translate(text, target_language):
    translator = Translator()
    try:
        translated_text = translator.translate(text, dest=target_language)
        return {"status": "OK", "text": translated_text.text}
    except Exception as e:
        return {"status": "erro", "text": "verifique se a linguagem existe!"}


def getLanguages():
    return googletrans.LANGUAGES


if __name__ == '__main__':
    print(translate('Hello, world!', 'ru'))