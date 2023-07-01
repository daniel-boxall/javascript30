let chunks = [];
let mediaRecorder;
let audioStream;

function startRecording() {
    chunks = [];
    audioStream = audioContext.createMediaStreamDestination().stream;
    mediaRecorder = new MediaRecorder(audioStream);

    mediaRecorder.addEventListener('dataavailable', event => {
        chunks.push(event.data);
    });

    mediaRecorder.start();
}

function playNote() {
    oscillator.connect(audioStream);
    oscillator.start();
}

function stopNote() {
    oscillator.stop();
    oscillator.disconnect(audioStream);
}

function stopRecording() {
    mediaRecorder.stop();
}

function downloadRecording() {
    const blob = new Blob(chunks, { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'recording.wav';
    link.click();

    URL.revokeObjectURL(url);
}

const startRecordButton = document.getElementById('startRecordButton');
const stopRecordButton = document.getElementById('stopRecordButton');
const downloadButton = document.getElementById('downloadButton');

startRecordButton.addEventListener('click', startRecording);
stopRecordButton.addEventListener('click', stopRecording);
downloadButton.addEventListener('click', downloadRecording);

const drumSounds = {
    clap: '../assets/sounds/clap.wav',
    hihat: '/assets/sounds/hihat.wav',
    kick: '/assets/sounds/kick.wav',
    openhat: '/assets/sounds/openhat.wav',
    boom: '/assets/sounds/boom.wav',
    ride: '/assets/sounds/ride.wav',
    snare: '/assets/sounds/snare.wav',
    tom: '/assets/sounds/tom.wav',
    tink: '/assets/sounds/tink.wav'
};


const userSounds = [];

//audio context
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const gainNode = audioContext.createGain();
gainNode.connect(audioContext.destination);

//loop varaibles
let currentStep = 0;
let timerId;
let tempo = 120;

//function to play sound
function playDrumSound(buffer) {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(gainNode);
    source.start();
}

//Load drum sounds
function loadDrumSounds(callback) {
  const soundKeys = Object.keys(drumSounds);
  let loadedCount = 0;

  soundKeys.forEach((key) => {
    const soundPath = drumSounds[key];
    fetch(soundPath)
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
      .then((audioBuffer) => {
        drumSounds[key] = audioBuffer;
        loadedCount++;

        if (loadedCount === soundKeys.length) {
          callback();
        }
      })
      .catch((error) => {
        console.error(`Error loading sound '${key}':`, error);
      });
  });
}

const beatPattern = [
    { sound: drumSounds.kick, time: 0 },
    { sound: drumSounds.snare, time: 500 },
    { sound: drumSounds.hihat, time: 1000 }
];

function playBeat() {
    const currentSounds = [];

    //add beat pattern sounds
    beatPattern.forEach((beat) => {
        if (beat.time === currentStep) {
            currentSounds.push(beat.sound);
        }
    });

    userSounds.forEach((userSound) => {
        if (userSound.time === currentStep) {
            currentSounds.push(userSound.sound);
        }
    });

    //play the current sounds
    currentSounds.forEach((sound) => {
        playDrumSound(sound);
    });

    //move to the next step
    currentStep++;

    //reset to the beginning if we reach the end of the beat pattern
    if (currentStep >= Math.max(beatPattern.length, ...userSounds.map(sound => sound.time))) {
        currentStep = 0;
    }

    timerId = setTimeOut(playBeat, (60 / tempo) * 1000);
}
function startLoop() {
    stopLoop();
    playBeat();
}

function stopLoop() {
    clearTimeout(timerId);
    currentStep = 0;
}

function adjustTempo(event) {
    tempo = event.target.value;
}

window.addEventListener('load', () => {
    loadDrumSounds(() => {
        console.log('Drum Sounds loaded.');
        startLoop();
    });
});

