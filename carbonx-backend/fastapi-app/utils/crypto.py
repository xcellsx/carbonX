from cryptography.fernet import Fernet
import os

if not os.path.exists("secret.key"):
    with open("secret.key", "wb") as f:
        f.write(Fernet.generate_key())

with open("secret.key", "rb") as f:
    SECRET_KEY = f.read()

cipher = Fernet(SECRET_KEY)

def encrypt_value(value: str) -> bytes:
    return cipher.encrypt(value.encode())

def decrypt_value(token: bytes) -> str:
    return cipher.decrypt(token).decode()
