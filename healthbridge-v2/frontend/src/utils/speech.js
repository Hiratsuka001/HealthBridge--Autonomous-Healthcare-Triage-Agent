export function startVoiceRecognition(lang = "bn-BD", onResult, onEnd) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Use Google Chrome or Edge for live Bengali/English Speech-to-Text.");
    if (onEnd) onEnd();
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = lang;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };

  recognition.onerror = () => {
    if (onEnd) onEnd();
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  recognition.start();
  return recognition;
}

export function speakText(text, lang = "bn-BD") {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel(); // Stop any current speech
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

