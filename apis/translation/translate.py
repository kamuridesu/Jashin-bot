from googletrans import Translator
import googletrans


def translate(text, target_language):
    translator = Translator()
    try:
        translated_text = translator.translate(text, dest=target_language)
    except Exception as e:
        return e.with_traceback()
    return translated_text.text


def getLanguages():
    return googletrans.LANGUAGES


if __name__ == '__main__':
    print(translate('Hello, world!', 'ru'))