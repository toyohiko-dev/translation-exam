# Overview

## What this app is

This project is a personal web app for interpretation practice. Its core training value is to simulate the pressure of hearing a Japanese sentence once, then immediately producing an English interpretation without relying on reading.

The app reads practice material from CSV, chooses a sentence at random, speaks it aloud in Japanese, waits until playback is complete, starts a 60-second answering window, and then reveals the original Japanese sentence after time is up.

## Why this exists

In interpretation practice, it is not enough to quietly read a prompt and translate it. The important load comes from:

- listening in real time
- retaining meaning in short-term memory
- producing an English response under time pressure

This MVP is intentionally narrow so the core exercise loop can be used quickly and repeatedly.

## Target user

- Primary user: the repository owner
- Usage style: solo practice on desktop or mobile browser
- Environment: modern browser with Japanese speech synthesis support preferred

## Core user flow

1. Open the app.
2. Load the default CSV or import a custom CSV.
3. Start a practice round.
4. Hear one randomly selected Japanese sentence.
5. After playback finishes, use the 60-second countdown to interpret aloud.
6. When the timer ends, view the original Japanese sentence.
7. Start the next round.

## Product principles

- Listening first: the Japanese sentence should not be visible before answer time ends.
- Fast repetition: starting the next round should require minimal effort.
- Simple operation: one person should be able to use it without setup beyond opening the app and optionally loading a CSV.
- Local-first MVP: no accounts, cloud sync, or backend dependency.

## Assumed content model

For MVP, each CSV row contains one Japanese sentence to be spoken. Additional columns may be tolerated later, but the initial design should only require a single Japanese text field.

## Success criteria for MVP

- The app can load practice data from CSV.
- A bundled initial CSV is available so the app works immediately.
- A random Japanese sentence is spoken successfully.
- The 60-second countdown begins only after speech playback finishes.
- The original Japanese sentence is revealed only after the countdown ends.
