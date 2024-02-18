// source: https://developer.chrome.com/blog/voice-driven-web-apps-introduction-to-the-web-speech-api
import { pageElements, showInfo } from "./page-elements.mjs";
import { extractInt, capitalize, linebreakHTMLize } from "./text-processing.mjs";
import { encodeSpecialTokens, execute as executeTokens, joinWords, splitIntoTokens } from "./voice-input-commands.mjs";

const recognitionState = {
  isRecognitionInProgress: false,
  recognitionInputGroupId: null,
  recognitionOutputTarget: null,
  recognitionInterimOutputTarget: null,
};

const SpeechRecognitionEngine = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognitionEngine();
recognition.continuous = true;
recognition.interimResults = true;

let ignoreOnend = false;
let startTimestamp;
let finalTranscript = [];  // Dodane tutaj

const insertTextAtCursor = (targetInput, text) => {
  console.log(">>> Selection:", targetInput.selectionStart, targetInput.selectionEnd, text);
  targetInput.setRangeText(text, targetInput.selectionStart, targetInput.selectionEnd, "end");
};

const getTime = () => {
  return new Date().toTimeString();
}

const recognitionStart = ({ target }) => {
  const recognitionInputId = extractInt(target.id);
  console.log(`=============== ${getTime()}\n=> recognitionStart`);
  console.log(JSON.stringify(recognitionState));
  console.log(`Input controls #${recognitionInputId} selected.`);

  recognition.lang = pageElements['select_dialect'].value;
  const recognitionFlagId = `recognition-switch${recognitionInputId}`;
  const recognitionFlag = document.getElementById(recognitionFlagId);
  if (recognitionFlag.checked) {
    console.log('--- attempting to start recognition');
    const recognitionIcon = document.getElementById(`recognition-icon${recognitionInputId}`);
    recognitionIcon.classList.add('recording-active');
    recognitionState.recognitionOutputTarget = document.getElementById(`input${recognitionInputId}`);
    recognitionState.recognitionInterimOutputTarget = document.getElementById(`interim-output${recognitionInputId}`);
    recognition.start();
  } else {
    console.log(`--- Recognition disabled by user.`);
  }
};

const recognitionStop = ({ target }) => {
  const recognitionInputId = extractInt(target.id);
  console.log(`=============== ${getTime()}\n=> recognitionStop`);
  console.log(JSON.stringify(recognitionState));
  console.log(`Input controls #${recognitionInputId} blurred.`);
  const recognitionFlag = document.getElementById(`recognition-switch${recognitionInputId}`);
  if (recognitionFlag.checked) {
    console.log('--- stopping recognition');
    const recognitionIcon = document.getElementById(`recognition-icon${recognitionInputId}`);
    recognitionIcon.classList.remove('recording-active');
    recognition.stop();
  }
};

export const registerRecognitionCallbacks = () => {
  recognition.onstart = () => {
    console.log(`RECOGNITION.onStart`);
    recognitionState.isRecognitionInProgress = true;
    showInfo('info-speak-now');
  }

  recognition.onerror = (event) => {
    console.log(`RECOGNITION.onError`, event);
    if (event.error === 'no-speech') {
      showInfo('info-no-speech');
      ignoreOnend = true;
    }
    if (event.error === 'audio-capture') {
      showInfo('info-no-microphone');
      ignoreOnend = true;
    }
    if (event.error === 'not-allowed') {
      if (event.timeStamp - startTimestamp < 100) {
        showInfo('info-blocked');
      } else {
        showInfo('info-denied');
      }
      ignoreOnend = true;
    }
  }

  recognition.onresult = (event) => {
    console.log(`RECOGNITION.onResult`, event);
    let interimTranscript = [];

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      interimTranscript.push(event.results[i][0].transcript.trim().toLowerCase());
      if (event.results[i].isFinal) {
        finalTranscript.push(event.results[i][0].transcript.trim().toLowerCase());
      }
    }
    recognitionState.recognitionInterimOutputTarget.value =
      joinWords(encodeSpecialTokens(splitIntoTokens(interimTranscript.join(" "))));
    if (finalTranscript.length) {
      const tokens = splitIntoTokens(finalTranscript.join(""));
      console.log("TOKENS:", tokens);
      const executedTokens = executeTokens(tokens);
      console.log("TOKENS EXECUTED:", executedTokens);
      const joinedWords = joinWords(executedTokens);
      console.log("JOINED:", joinedWords);
      insertTextAtCursor(recognitionState.recognitionOutputTarget, joinedWords);
    } else {
      console.log("---- Empty input");
    }
  }

  recognition.onend = () => {
    console.log(`RECOGNITION.onEnd`);
    recognitionStop({ target: recognitionState.recognitionOutputTarget });
    recognitionState.recognitionOutputTarget.blur();
    recognitionState.isRecognitionInProgress = false;

    if (ignoreOnend) {
      return;
    }
    if (!finalTranscript.length) {
      showInfo('info-start');
      return;
    }
    showInfo('');
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
      const range = document.createRange();
      range.selectNode(document.getElementById('final-span'));
      window.getSelection().addRange(range);
    }
  }
};

export { recognitionStart, recognitionStop };
