# Development Notes

## Goal of this document

This document captures the intended implementation direction for the MVP without writing application code yet. It is meant to reduce rework in the next phase.

## Recommended implementation approach

- Build a frontend-only web app.
- Use browser-native APIs where possible.
- Keep architecture simple and easy to run locally.

## Recommended technical direction

### Frontend

- Single-page web app
- Minimal state-driven UI
- No backend for MVP

Framework choice is still open. A lightweight React, Vue, Svelte, or even vanilla TypeScript implementation would all be viable. The key requirement is predictable state transitions around speech playback and countdown timing.

### Browser APIs

- CSV loading: file input plus bundled static CSV asset
- Speech: Web Speech API (`speechSynthesis`)
- Timing: `setInterval` or `requestAnimationFrame`-driven countdown logic

## Proposed data contract

Internal normalized prompt shape:

```ts
type Prompt = {
  id: string;
  textJa: string;
};
```

Notes:

- `id` can be derived from row index for MVP.
- Only `textJa` is required.

## Proposed feature breakdown

### 1. Data loading layer

- Load bundled CSV at app startup
- Parse CSV into normalized prompt list
- Accept user CSV upload and replace in-memory dataset
- Surface validation errors clearly

### 2. Round engine

- Choose a random prompt
- Reset round state
- Trigger Japanese speech
- Listen for speech completion event
- Start 60-second countdown
- Reveal source sentence at countdown end

### 3. UI layer

- Dataset status
- CSV upload action
- Start round action
- Current phase indicator
- Remaining countdown seconds
- Post-round Japanese reveal
- Error message area

## Proposed screen structure

- Header: app title and short training description
- Data section: bundled/custom CSV status and upload control
- Main practice panel: start button, phase indicator, timer
- Reveal section: hidden until countdown completes

## State transition sketch

```text
startup
  -> load bundled CSV
  -> idle

idle
  -> start round
  -> speaking

speaking
  -> speech end
  -> countdown
  -> speech error
  -> error

countdown
  -> timer reaches zero
  -> revealed

revealed
  -> start next round
  -> speaking

error
  -> recover by reloading data or retrying
  -> idle
```

## Implementation cautions

- Speech synthesis behavior differs by browser, so voice selection and playback completion handling should be isolated behind a small utility.
- Some browsers load voices asynchronously; the app should tolerate delayed voice availability.
- The round engine should always cancel any in-progress speech or timers before starting a fresh round.
- The hidden-text requirement is core to the product. Avoid UI designs that accidentally expose the prompt early.

## Suggested project conventions for implementation phase

- Keep core logic separated from presentation logic where practical.
- Centralize round state so speech and countdown are coordinated from one source of truth.
- Prepare for easy replacement of the CSV parser if the initial choice proves fragile.

## Minimum manual test checklist for later

1. Bundled CSV loads on first open.
2. Valid custom CSV replaces the active dataset.
3. Invalid or empty CSV shows a clear error.
4. Starting a round plays Japanese audio.
5. Timer begins only after playback completion.
6. Japanese text stays hidden during playback and countdown.
7. Japanese text appears when the countdown ends.
8. Starting another round fully resets the prior state.
