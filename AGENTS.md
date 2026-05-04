# AGENTS.md

## Purpose
- This repository is a personal interpretation practice web app.
- The current phase is design-first. Do not start implementing the app until the design documents are agreed.

## Product Goal
- Load Japanese source sentences from CSV.
- Pick one sentence at random.
- Read the Japanese aloud so the user must interpret by listening rather than reading.
- After speech ends, start a 60-second countdown.
- When the answer time ends, reveal the original Japanese sentence.

## MVP Scope
- CSV loading by the user
- Initial bundled CSV loading
- Random prompt selection
- Japanese text-to-speech playback
- 60-second countdown after playback completes
- Show the Japanese sentence after the answer window ends

## Out of Scope
- Recording
- Speech recognition
- Transcription
- AI scoring
- Supabase
- Login
- Database persistence

## CSV Format
The app must support the following CSV structure:

id,title,japanese,category,difficulty

- Only `japanese` is required.
- Other fields may be empty but must not break parsing.
- The initial dataset is located at:
  - `data/interpreter_practice_200_questions.csv`

## App State Model
The app must clearly manage the following states:

- idle
- speaking
- answering
- finished

State transitions:
- idle → speaking (on start)
- speaking → answering (after speech ends)
- answering → finished (after 60s)
- finished → speaking (next question)

## UI/UX Rules
- Do NOT show the Japanese sentence during speaking or answering.
- The title may be shown before playback.
- The Japanese sentence may only be revealed in the finished state.
- The countdown must be highly visible during answering.
- The UI should work well on mobile and desktop.

## File Structure
The app must remain a simple static web app:

- index.html
- styles.css
- script.js
- data/
- docs/

Do NOT introduce frameworks (React, Next.js, etc.) in this phase.

## Working Rules
- Prioritize a simple local-first architecture.
- Keep implementation dependency-light.
- Favor browser-native APIs:
  - SpeechSynthesis
  - fetch
  - basic CSV parsing

## Deliverables For The Next Phase
- Implement the app only after `docs/overview.md`, `docs/spec.md`, and `docs/dev.md` are accepted.
- If requirements change:
  - Update docs first
  - Then update implementation