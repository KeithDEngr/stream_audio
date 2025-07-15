const startButton = document.getElementById('start-btn');
const stopButton = document.getElementById('stop-btn');

startButton.addEventListener('click', startStreaming);
stopButton.addEventListener('click', stopStreaming);

const local_ip = '192.168.1.118';
const socket = io(`wss://${local_ip}:5000`)
let audioContext;
let mediaStream;
let processor;

function startStreaming(){
  console.log("Starting streaming")
  startButton.disabled = true;
  stopButton.disabled = false;

  startCapture();

  socket.on('connect', () => {
    document.getElementById('status').textContent = 'Connected';
    console.log('Connected to server');
  });

  socket.on('message', (msg) => {
    console.log('Message from server:',msg.data);
  });
}

function stopStreaming(){
  startButton.disabled = false;
  stopButton.disabled = true;
  //socket.on('connect', () => {
  //  document.getElementById('status').textContent = 'Connected';
  //  console.log('Connected to server');
  //  startCapture();
  //});
  stopCapture();

  socket.on('disconnect', () =>{
    document.getElementById('status').textContent = 'Disconnected';
    console.log('Disconnected from server');
  });

  //socket.on('message', (msg) => {
  //  console.log('Message from server:',msg.data);
  //});
  console.log('TODO: handle disconnect');
}

function startCapture() {
  navigator.mediaDevices.getUserMedia({ audio: true, video: false })
           .then(stream => {
             audioContext = new (window.AudioContext || window.webkitAudioContext)();
             mediaStream = audioContext.createMediaStreamSource(stream);

             processor = audioContext.createScriptProcessor(1024,1,1);
             processor.onaudioprocess = (e) => {
               const inputData = e.inputBuffer.getChannelData(0);
               const encodedData = encodeAudioData(inputData);
               socket.emit('audio_chunk',encodedData);
             };

             mediaStream.connect(processor);
             processor.connect(audioContext.destination);
           })
           .catch(err => {
             console.error('Error accessing audio stream:',err);
             alert('Microphone access is required for audio streaming');
           });
}

function stopCapture() {
  if (processor){
    processor.disconnect();
    processor.onaudioprocess = null;
  }
  if (mediaStream){
    mediaStream.disconnect();
  }
  if (audioContext){
    audioContext.close().then(() => {
      console.log('Audio context closed');
    });
  }
}

function encodeAudioData(data) {
  const buffer = new ArrayBuffer(data.length * 2);
  const view = new DataView(buffer);

  for (let i = 0; i < data.length; i++){
    view.setInt16(i*2, data[i] * 0x7FFF, true);
  }
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

