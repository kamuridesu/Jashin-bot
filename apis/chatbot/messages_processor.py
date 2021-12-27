import os
import pathlib
import time
import re


class MessagePreProcessor:
    def __init__(self, filename: str):
        with open(filename, "r", encoding="utf-8") as file: 
            self.message_file_lines = file.readlines()
        self.pre_processed_messages: list = []
        self.preprocessAll()
    
    def preprocessAll(self) -> str:
        for line in self.message_file_lines:
            message: str = " ".join(line.split(' ')[4:])
            try:
                message = message[:message.index("from")]
                # self.pre_processed_message += message + "\n"
            except ValueError:
                pass
            finally:
                if message.strip() not in ["stickerMessage", "videoMessage", "audioMessage", "imageMessage"]:
                    regex = r'@[0-9]\w+'
                    if(re.search(regex, message)):
                        message = ("".join(re.split(regex, message)))
                    message = message.strip().strip("@./;]!@#$%*()_+\"|\\<>?&^:`~{}[]")
                    if message != "" and "bot" not in message.lower():
                        self.pre_processed_messages.append(message)
