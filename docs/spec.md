# MVP Specification

## 1. Scope

This document defines the minimum viable product for the interpretation practice app. It covers only the single-round training loop and CSV-based content loading.

## 2. In Scope

- Load a bundled initial CSV file on first use
- Load a user-selected CSV file from local device storage
- Parse Japanese prompts from CSV
- Select one prompt at random for each round
- Read the selected Japanese prompt aloud using browser speech synthesis
- Start a 60-second countdown after speech playback completes
- Reveal the Japanese prompt after countdown completion
- Allow the user to start another round

## 3. Out of Scope

- Audio recording
- Speech recognition
- Transcript generation
- AI feedback or scoring
- User accounts
- Remote database or backend storage
- Supabase integration
- Practice history analytics
- Difficulty settings
- Multi-language prompt management beyond Japanese source text

## 4. Functional Requirements

### 4.1 CSV loading

- The app must support an initial bundled CSV so the app is usable immediately after opening.
- The app must allow the user to load a CSV file from the local device.
- When a custom CSV is loaded successfully, the app should use that dataset for subsequent rounds during the current session.
- The app should validate that at least one usable Japanese sentence exists.
- Empty rows must be ignored.

### 4.2 CSV format

The app should support the following structure:

id,title,japanese,category,difficulty

- Only `japanese` is required.
- If headers are missing, fallback to treating the first column as Japanese text.
- Rows with empty Japanese text must be ignored.

### 4.3 Random prompt selection

- Each round must choose one prompt randomly from the currently loaded dataset.
- True non-repetition control is not required in MVP.
- If only one prompt exists, that prompt may repeat every round.

### 4.4 Speech playback

- The selected Japanese sentence must be spoken using the browser's speech synthesis capability.
- The app should prefer a Japanese-capable voice when available.
- If multiple Japanese voices exist, selecting a reasonable default is sufficient for MVP.
- The app must detect when playback has ended in order to start the timer.
- The Japanese text must remain hidden while speech is playing.

### 4.5 Countdown

- The countdown duration must be fixed at 60 seconds in MVP.
- The countdown must start only after speech playback finishes.
- The countdown should visibly update so the user can track remaining time.
- The user does not need pause or resume controls in MVP unless implementation becomes trivial.

### 4.6 Reveal

- When the countdown reaches zero, the app must display the Japanese sentence used in the current round.
- The reveal state should remain visible until the user starts the next round.

### 4.7 Round control

- The user must be able to start a round manually.
- After a round completes, the user must be able to start another random round.
- Starting a new round should clear the previous reveal and reset timer-related state.

## 5. Non-Functional Requirements

### 5.1 Platform

- Must run as a web app in a modern browser.
- Must not require server-side processing for MVP.

### 5.2 Usability

- The main interaction should be understandable with minimal UI.
- The user should always know which phase they are in:
  - ready
  - speaking
  - countdown
  - revealed

### 5.3 Reliability

- If speech synthesis is unavailable or fails, the app should present a clear error or fallback notice.
- The timer should not start before speech playback ends.

### 5.4 Privacy

- User CSV data should remain local in MVP.
- No network upload is required for core functionality.

## 6. Suggested State Model

- `idle`: dataset loaded, waiting to start
- `speaking`: Japanese speech in progress
- `countdown`: 60-second answer window running
- `revealed`: original Japanese sentence shown
- `error`: recoverable issue such as invalid CSV or unavailable speech synthesis

## 7. Edge Cases

- CSV file exists but contains no usable rows
- CSV parsing succeeds but all target cells are blank
- User starts a new round while speech is still active
- Browser blocks or delays speech synthesis initialization
- No Japanese voice is available
- Speech ends unexpectedly early

## 8. Acceptance Criteria

The MVP is complete when all of the following are true:

1. Opening the app with the bundled CSV allows an immediate practice round.
2. The user can import a local CSV and use it for rounds.
3. A random Japanese sentence is selected and spoken aloud.
4. The Japanese sentence is not shown before the answer period ends.
5. The 60-second countdown begins only after speech playback completes.
6. When the timer reaches zero, the Japanese sentence is displayed.
7. The user can start the next round without reloading the page.
