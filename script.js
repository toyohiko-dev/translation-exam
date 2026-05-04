const BUNDLED_CSV_PATH = "data/interpreter_practice_200_questions.csv";
const ANSWER_DURATION_SECONDS = 60;
const SOFT_TEXT_LIMIT = 300;
const BUNDLED_PROGRESS_STORAGE_KEY = "translation-exam:bundled-progress:v1";

const elements = {
  csvFileInput: document.getElementById("csvFileInput"),
  reloadBundledButton: document.getElementById("reloadBundledButton"),
  resetProgressButton: document.getElementById("resetProgressButton"),
  datasetStatus: document.getElementById("datasetStatus"),
  progressSummary: document.getElementById("progressSummary"),
  phaseLabel: document.getElementById("phaseLabel"),
  promptTitle: document.getElementById("promptTitle"),
  promptMeta: document.getElementById("promptMeta"),
  timerDisplay: document.getElementById("timerDisplay"),
  timerCaption: document.getElementById("timerCaption"),
  startButton: document.getElementById("startButton"),
  sameTopicButton: document.getElementById("sameTopicButton"),
  pauseButton: document.getElementById("pauseButton"),
  resumeButton: document.getElementById("resumeButton"),
  previousTopicButton: document.getElementById("previousTopicButton"),
  revealCard: document.getElementById("revealCard"),
  revealedJapanese: document.getElementById("revealedJapanese"),
  messageBanner: document.getElementById("messageBanner"),
};

const appState = {
  prompts: [],
  sourceLabel: "初期CSV",
  currentPrompt: null,
  phase: "idle",
  paused: false,
  countdownIntervalId: null,
  countdownEndTime: null,
  countdownRemainingMs: ANSWER_DURATION_SECONDS * 1000,
  activeUtterance: null,
  playbackToken: 0,
  history: [],
  historyIndex: -1,
  seenPromptIds: new Set(),
  persistProgress: false,
  lengthWarningMessage: "",
  infoMessage: "",
};

function setPhase(phase) {
  appState.phase = phase;

  const labels = {
    idle: "準備完了",
    speaking: "読み上げ中",
    answering: "回答中",
    finished: "終了",
    error: "エラー",
  };

  const pausedSuffix =
    appState.paused && (phase === "speaking" || phase === "answering") ? "（一時停止中）" : "";

  elements.phaseLabel.textContent = `${labels[phase] || phase}${pausedSuffix}`;
  elements.phaseLabel.dataset.phase = phase;
  updateControlAvailability();
}

function setMessage(message, tone = "warning") {
  if (!message) {
    elements.messageBanner.hidden = true;
    elements.messageBanner.textContent = "";
    elements.messageBanner.dataset.tone = "";
    return;
  }

  elements.messageBanner.hidden = false;
  elements.messageBanner.textContent = message;
  elements.messageBanner.dataset.tone = tone;
}

function refreshMessageBanner() {
  const messages = [];

  if (appState.infoMessage) {
    messages.push(appState.infoMessage);
  }

  if (appState.lengthWarningMessage) {
    messages.push(appState.lengthWarningMessage);
  }

  if (!messages.length) {
    setMessage("");
    return;
  }

  setMessage(messages.join("\n"), "warning");
}

function setDatasetStatus(message) {
  elements.datasetStatus.textContent = message;
}

function setTimer(secondsRemaining) {
  elements.timerDisplay.textContent = String(Math.max(0, secondsRemaining)).padStart(2, "0");
}

function resetReveal() {
  elements.revealedJapanese.textContent = "";
  elements.revealCard.classList.add("reveal-hidden");
}

function showReveal(textJa) {
  elements.revealedJapanese.textContent = textJa;
  elements.revealCard.classList.remove("reveal-hidden");
}

function clearInfoMessage() {
  if (!appState.infoMessage) {
    return;
  }

  appState.infoMessage = "";
  refreshMessageBanner();
}

function resetRoundArtifacts() {
  clearCountdown();
  cancelSpeech();
  appState.paused = false;
  resetReveal();
  setTimer(ANSWER_DURATION_SECONDS);
  appState.countdownRemainingMs = ANSWER_DURATION_SECONDS * 1000;
  elements.timerCaption.textContent = "読み上げが終わると、カウントダウンが始まります。";
}

function clearCountdown() {
  if (appState.countdownIntervalId !== null) {
    window.clearInterval(appState.countdownIntervalId);
    appState.countdownIntervalId = null;
  }
  appState.countdownEndTime = null;
}

function cancelSpeech() {
  appState.playbackToken += 1;
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  appState.activeUtterance = null;
}

function getSeenCount() {
  return appState.seenPromptIds.size;
}

function getTotalCount() {
  return appState.prompts.length;
}

function getRemainingCount() {
  return Math.max(0, getTotalCount() - getSeenCount());
}

function getUnseenPrompts() {
  return appState.prompts.filter((prompt) => !appState.seenPromptIds.has(prompt.id));
}

function hasRemainingPrompts() {
  return getUnseenPrompts().length > 0;
}

function saveBundledProgress() {
  if (!appState.persistProgress) {
    return;
  }

  const ids = Array.from(appState.seenPromptIds);
  window.localStorage.setItem(BUNDLED_PROGRESS_STORAGE_KEY, JSON.stringify(ids));
}

function loadBundledProgress(prompts) {
  const raw = window.localStorage.getItem(BUNDLED_PROGRESS_STORAGE_KEY);
  if (!raw) {
    return new Set();
  }

  try {
    const parsed = JSON.parse(raw);
    const validIds = new Set(prompts.map((prompt) => prompt.id));
    return new Set(parsed.filter((id) => validIds.has(id)));
  } catch {
    return new Set();
  }
}

function updateProgressSummary() {
  elements.progressSummary.textContent = `進捗：${getSeenCount()} / ${getTotalCount()}（残り${getRemainingCount()}問）`;
}

function updateControlAvailability() {
  const hasPrompts = getTotalCount() > 0;
  const hasCurrentPrompt = Boolean(appState.currentPrompt);
  const isSpeaking = appState.phase === "speaking";
  const isAnswering = appState.phase === "answering";
  const isPausablePhase = isSpeaking || isAnswering;
  const hasStartedRound = hasCurrentPrompt || appState.history.length > 0;
  const canStartNewPrompt = hasPrompts && hasRemainingPrompts();

  elements.startButton.textContent = hasStartedRound ? "次の問題" : "出題開始";
  elements.startButton.disabled = !canStartNewPrompt;
  elements.sameTopicButton.disabled = !hasCurrentPrompt;
  elements.pauseButton.disabled = !isPausablePhase || appState.paused;
  elements.resumeButton.disabled = !isPausablePhase || !appState.paused;
  elements.previousTopicButton.disabled = appState.historyIndex <= 0;
  elements.resetProgressButton.disabled = !hasPrompts || getSeenCount() === 0;

  elements.startButton.classList.toggle("button-active", !elements.startButton.disabled);
  elements.sameTopicButton.classList.toggle("button-active", !elements.sameTopicButton.disabled);
  elements.previousTopicButton.classList.toggle(
    "button-active",
    !elements.previousTopicButton.disabled
  );
  elements.pauseButton.classList.toggle("button-active", !elements.pauseButton.disabled);
  elements.resumeButton.classList.toggle("button-active", !elements.resumeButton.disabled);
  elements.resetProgressButton.classList.toggle(
    "button-active",
    !elements.resetProgressButton.disabled
  );
}

function updatePromptSummary(prompt) {
  if (!prompt) {
    elements.promptTitle.textContent = "準備ができたら出題開始を押してください。";
    elements.promptMeta.textContent = "読み上げた日本文は、回答時間が終わるまで表示されません。";
    return;
  }

  elements.promptTitle.textContent = prompt.title;
  elements.promptMeta.textContent = `データ: ${appState.sourceLabel}`;
}

function pickRandomPromptFromList(prompts) {
  const index = Math.floor(Math.random() * prompts.length);
  return prompts[index];
}

function pickNextUnseenPrompt() {
  const unseenPrompts = getUnseenPrompts();
  if (!unseenPrompts.length) {
    return null;
  }
  return pickRandomPromptFromList(unseenPrompts);
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function parseCsv(csvText) {
  const rows = [];
  let currentField = "";
  let currentRow = [];
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "," && !insideQuotes) {
      currentRow.push(currentField);
      currentField = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i += 1;
      }

      currentRow.push(currentField);
      currentField = "";

      if (currentRow.some((field) => String(field).trim() !== "")) {
        rows.push(currentRow);
      }

      currentRow = [];
      continue;
    }

    currentField += char;
  }

  if (currentField !== "" || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((field) => String(field).trim() !== "")) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) {
    throw new Error("CSVが空です。");
  }

  const headers = rows[0].map(normalizeHeader);
  const hasHeader = headers.includes("japanese") || headers.includes("ja") || headers.includes("text");
  const dataRows = hasHeader ? rows.slice(1) : rows;

  const textIndex = hasHeader
    ? headers.findIndex((header) => ["japanese", "ja", "text"].includes(header))
    : 0;
  const titleIndex = hasHeader ? headers.findIndex((header) => header === "title") : -1;
  const idIndex = hasHeader ? headers.findIndex((header) => header === "id") : -1;

  const prompts = dataRows
    .map((columns, rowIndex) => {
      const textJa = String(columns[textIndex] || "").trim();
      if (!textJa) {
        return null;
      }

      const rawTitle = titleIndex >= 0 ? String(columns[titleIndex] || "").trim() : "";
      const rawId = idIndex >= 0 ? String(columns[idIndex] || "").trim() : "";

      return {
        id: rawId || `row-${rowIndex + 1}`,
        title: rawTitle || `問題${rowIndex + 1}`,
        textJa,
      };
    })
    .filter(Boolean);

  if (!prompts.length) {
    throw new Error("読み上げに使える日本文が見つかりませんでした。");
  }

  return prompts;
}

function buildLengthWarning(prompts) {
  const tooLong = prompts.filter((prompt) => prompt.textJa.length > SOFT_TEXT_LIMIT);
  if (!tooLong.length) {
    return "";
  }

  const examples = tooLong
    .slice(0, 3)
    .map((prompt) => `${prompt.title}（${prompt.textJa.length}文字）`)
    .join("、");

  return `300文字を超える問題があります。読み上げが長くなる可能性があります: ${examples}`;
}

function getJapaneseVoice() {
  if (!("speechSynthesis" in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) {
    return null;
  }

  return (
    voices.find((voice) => voice.lang === "ja-JP") ||
    voices.find((voice) => voice.lang && voice.lang.toLowerCase().startsWith("ja")) ||
    null
  );
}

function startCountdown() {
  startCountdownFromRemainingMs(ANSWER_DURATION_SECONDS * 1000);
}

function startCountdownFromRemainingMs(remainingMs) {
  clearCountdown();
  appState.paused = false;
  setPhase("answering");
  elements.timerCaption.textContent = "いまは回答時間です。終了後に読み上げた日本文を確認できます。";
  appState.countdownRemainingMs = remainingMs;
  appState.countdownEndTime = Date.now() + remainingMs;
  setTimer(Math.ceil(remainingMs / 1000));

  appState.countdownIntervalId = window.setInterval(() => {
    const msRemaining = appState.countdownEndTime - Date.now();
    appState.countdownRemainingMs = Math.max(0, msRemaining);
    const secondsRemaining = Math.max(0, Math.ceil(msRemaining / 1000));
    setTimer(secondsRemaining);

    if (msRemaining <= 0) {
      clearCountdown();
      setPhase("finished");
      showReveal(appState.currentPrompt.textJa);
      elements.timerCaption.textContent = "終了しました。読み上げた日本文を確認してください。";
    }
  }, 250);
}

function speakPrompt(prompt) {
  if (!("speechSynthesis" in window) || typeof window.SpeechSynthesisUtterance === "undefined") {
    throw new Error("このブラウザでは音声読み上げを利用できません。");
  }

  const utterance = new SpeechSynthesisUtterance(prompt.textJa);
  const voice = getJapaneseVoice();
  const playbackToken = ++appState.playbackToken;

  utterance.lang = voice?.lang || "ja-JP";
  utterance.voice = voice || null;
  utterance.rate = 1;
  utterance.pitch = 1;

  utterance.onend = () => {
    if (playbackToken !== appState.playbackToken) {
      return;
    }
    appState.activeUtterance = null;
    startCountdown();
  };

  utterance.onerror = () => {
    if (playbackToken !== appState.playbackToken) {
      return;
    }
    appState.activeUtterance = null;
    setPhase("error");
    setMessage(
      "読み上げに失敗しました。再度お試しいただくか、日本語音声に対応したブラウザをご利用ください。"
    );
  };

  appState.activeUtterance = utterance;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function markPromptAsSeen(prompt) {
  if (!prompt || appState.seenPromptIds.has(prompt.id)) {
    return;
  }

  appState.seenPromptIds.add(prompt.id);
  saveBundledProgress();
  updateProgressSummary();
  updateControlAvailability();
}

function startPromptFromBeginning(prompt, options = {}) {
  if (!prompt) {
    return;
  }

  const { addToHistory = false, markSeen = false } = options;
  clearInfoMessage();
  resetRoundArtifacts();
  appState.currentPrompt = prompt;
  appState.paused = false;

  if (addToHistory) {
    if (appState.historyIndex < appState.history.length - 1) {
      appState.history = appState.history.slice(0, appState.historyIndex + 1);
    }
    appState.history.push(prompt);
    appState.historyIndex = appState.history.length - 1;
  }

  if (markSeen) {
    markPromptAsSeen(prompt);
  }

  updatePromptSummary(prompt);
  setPhase("speaking");
  elements.timerCaption.textContent = "読み上げ中です。終了するとカウントダウンが始まります。";

  try {
    speakPrompt(prompt);
  } catch (error) {
    setPhase("error");
    setMessage(error.message);
  }
}

function notifyAllPromptsCompleted() {
  appState.infoMessage = "全問出題済みです";
  refreshMessageBanner();
  updateControlAvailability();
}

function startRound() {
  if (!getTotalCount()) {
    return;
  }

  const prompt = pickNextUnseenPrompt();
  if (!prompt) {
    notifyAllPromptsCompleted();
    return;
  }

  startPromptFromBeginning(prompt, { addToHistory: true, markSeen: true });
}

function restartSameTopic() {
  if (!appState.currentPrompt) {
    return;
  }

  clearInfoMessage();
  startPromptFromBeginning(appState.currentPrompt, { addToHistory: false, markSeen: false });
}

function goToNextTopic() {
  if (!getTotalCount()) {
    return;
  }

  const prompt = pickNextUnseenPrompt();
  if (!prompt) {
    notifyAllPromptsCompleted();
    return;
  }

  startPromptFromBeginning(prompt, { addToHistory: true, markSeen: true });
}

function goToPreviousTopic() {
  if (appState.historyIndex <= 0) {
    return;
  }

  clearInfoMessage();
  appState.historyIndex -= 1;
  const previousPrompt = appState.history[appState.historyIndex];
  startPromptFromBeginning(previousPrompt, { addToHistory: false, markSeen: false });
}

function pauseSession() {
  if (appState.paused) {
    return;
  }

  if (appState.phase === "speaking") {
    if (!("speechSynthesis" in window) || !appState.activeUtterance) {
      return;
    }
    window.speechSynthesis.pause();
    appState.paused = true;
    elements.timerCaption.textContent = "読み上げを一時停止しています。再開すると続きから流れます。";
    setPhase("speaking");
    return;
  }

  if (appState.phase === "answering") {
    const msRemaining = appState.countdownEndTime - Date.now();
    appState.countdownRemainingMs = Math.max(0, msRemaining);
    clearCountdown();
    appState.paused = true;
    elements.timerCaption.textContent = "回答時間を一時停止しています。再開すると続きから始まります。";
    setPhase("answering");
  }
}

function resumeSession() {
  if (!appState.paused) {
    return;
  }

  if (appState.phase === "speaking") {
    if (!("speechSynthesis" in window)) {
      return;
    }
    window.speechSynthesis.resume();
    appState.paused = false;
    elements.timerCaption.textContent = "読み上げ中です。終了するとカウントダウンが始まります。";
    setPhase("speaking");
    return;
  }

  if (appState.phase === "answering") {
    startCountdownFromRemainingMs(appState.countdownRemainingMs);
  }
}

function resetProgress() {
  if (!getTotalCount()) {
    return;
  }

  appState.seenPromptIds = new Set();
  appState.history = [];
  appState.historyIndex = -1;
  appState.currentPrompt = null;
  appState.infoMessage = "進捗をリセットしました。";

  resetRoundArtifacts();
  updatePromptSummary(null);
  setPhase("idle");
  updateProgressSummary();
  updateControlAvailability();
  saveBundledProgress();
  refreshMessageBanner();
}

async function loadPromptsFromCsvText(csvText, sourceLabel, options = {}) {
  const prompts = parseCsv(csvText);
  const lengthWarning = buildLengthWarning(prompts);
  const { persistProgress = false } = options;

  appState.prompts = prompts;
  appState.sourceLabel = sourceLabel;
  appState.persistProgress = persistProgress;
  appState.seenPromptIds = persistProgress ? loadBundledProgress(prompts) : new Set();
  appState.currentPrompt = null;
  appState.history = [];
  appState.historyIndex = -1;
  appState.lengthWarningMessage = lengthWarning;
  appState.infoMessage = "";

  resetRoundArtifacts();
  updatePromptSummary(null);
  updateProgressSummary();
  setPhase("idle");
  setDatasetStatus(`${sourceLabel}を読み込みました。${prompts.length}問使えます。`);
  refreshMessageBanner();

  if (!hasRemainingPrompts()) {
    notifyAllPromptsCompleted();
  }
}

async function loadBundledCsv() {
  setDatasetStatus("初期CSVを読み込んでいます...");
  setMessage("");

  try {
    const response = await fetch(BUNDLED_CSV_PATH);
    if (!response.ok) {
      throw new Error(`初期CSVを読み込めませんでした（${response.status}）。`);
    }

    const csvText = await response.text();
    await loadPromptsFromCsvText(csvText, "初期CSV", { persistProgress: true });
  } catch (error) {
    appState.prompts = [];
    appState.seenPromptIds = new Set();
    updateProgressSummary();
    updateControlAvailability();
    setPhase("error");
    setDatasetStatus("初期CSVを読み込めませんでした。");
    setMessage(`${error.message} CSVを読み込むには、ローカルWebサーバー経由で開いてください。`);
  }
}

async function handleCustomCsvSelection(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    const csvText = await file.text();
    await loadPromptsFromCsvText(csvText, `読み込みCSV（${file.name}）`, {
      persistProgress: false,
    });
  } catch (error) {
    setPhase("error");
    setMessage(`CSVを読み込めませんでした: ${error.message}`);
  } finally {
    elements.csvFileInput.value = "";
  }
}

function initializeVoiceWarmup() {
  if (!("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

function initializeApp() {
  setPhase("idle");
  setTimer(ANSWER_DURATION_SECONDS);
  resetReveal();
  updateProgressSummary();
  updateControlAvailability();
  initializeVoiceWarmup();

  elements.startButton.addEventListener("click", () => {
    const hasStartedRound = Boolean(appState.currentPrompt) || appState.history.length > 0;
    if (hasStartedRound) {
      goToNextTopic();
      return;
    }
    startRound();
  });

  elements.sameTopicButton.addEventListener("click", restartSameTopic);
  elements.pauseButton.addEventListener("click", pauseSession);
  elements.resumeButton.addEventListener("click", resumeSession);
  elements.previousTopicButton.addEventListener("click", goToPreviousTopic);
  elements.reloadBundledButton.addEventListener("click", loadBundledCsv);
  elements.resetProgressButton.addEventListener("click", resetProgress);
  elements.csvFileInput.addEventListener("change", handleCustomCsvSelection);

  loadBundledCsv();
}

initializeApp();
