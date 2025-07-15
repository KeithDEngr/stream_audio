#!/usr/bin/env python3

from flask import Flask, request, render_template
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import base64
import numpy as np
import wave

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.config['SECRET_KEY'] = 'your_secret_key'
socketio = SocketIO(app, cors_allowed_origins="*")
n = 0
data_chunked = []
#total_data = None
#first_try = True
#total_audio_array = []


@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('audio_chunk')
def handle_audio_chunk(data):
    decoded_data = base64.b64decode(data)
    audio_array = np.frombuffer(decoded_data, dtype=np.int16)

    global data_chunked
    data_chunked.append(audio_array)
    data_compiled = np.concatenate(data_chunked)

    global n
    save_audio(data_compiled,f"output_{n}.wav")
    n+=1
    print("Received audio chunk")

@socketio.on('connect')
def handle_connect():
    print('Client connected')
    emit('message',{'data': 'Connected'})

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')
    emit('message',{'data': 'Disconnected'})

def save_audio(audio_array,file_path,sample_rate=44100):
    audio_format = 'float32'
    with wave.open(file_path,'w') as f:
        num_channels = 1
        sample_width = 2 # num bits to bytes (16 bits and 8bit/byte so = 2)
        f.setnchannels(num_channels)
        f.setsampwidth(sample_width)
        f.setframerate(sample_rate)

        f.writeframes(audio_array.tobytes())

if __name__ == '__main__':
    socketio.run(app,host='0.0.0.0',port=5000,ssl_context=('cert.pem','key.pem'))
