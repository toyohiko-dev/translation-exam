# 開発メモ

## このドキュメントの役割

このファイルは、現在の実装状況と技術構成を記録するためのものです。
仕様の正本は `docs/spec.md` を参照してください。

## 現在の構成

- 静的Webアプリ
- ファイル構成
  - `index.html`
  - `styles.css`
  - `script.js`
  - `data/`
  - `docs/`

## 使用技術

- HTML
- CSS
- プレーンなJavaScript
- ブラウザ標準API
  - `fetch`
  - `SpeechSynthesis`
  - `localStorage`
  - `navigator.clipboard`

## 現在実装されている機能

- 初期CSVの読み込み
- カスタムCSVの読み込み
- `japanese` 列をもとにした問題データの取り込み
- `title` が空の場合の自動タイトル付与
- `answer_english` の取り込み
- 未出題問題からのランダム出題
- 日本語音声の読み上げ
- 読み上げ終了後の60秒カウントダウン
- 回答後の日本文表示
- 模範英文がある場合の表示
- Google翻訳を補助確認として開く操作
- 同じ問題の再読み上げ
- 前の問題への移動
- 一時停止 / 再開
- 進捗表示
- 進捗リセット
- 初期CSVの進捗を `localStorage` に保存

## 現在のデータの扱い

- 初期CSVのパス: `data/interpreter_practice_questions.csv`
- カスタムCSVは読み込み後、そのタブのメモリ上でのみ保持する
- カスタムCSV本文は `localStorage` に保存しない
- `localStorage` に保存しているのは、初期CSVの出題済みID一覧のみ

## 実装メモ

- CSV仕様の正本は `docs/spec.md`
- `script.js` の `parseCsv` は、ヘッダーありCSVとヘッダーなしCSVの両方を扱う
- 日本文列のヘッダーとして `japanese` / `ja` / `text` を受ける実装になっている
- 300文字を超える日本文がある場合は警告表示するが、読み込み自体は止めない

## 現在の状態管理

- `idle`
- `speaking`
- `answering`
- `finished`
- `error`

加えて、一時停止は `phase` とは別に `paused` で管理している。

## 現在の制約

- 録音は未実装
- 音声認識は未実装
- AI採点は未実装
- バックエンド、DB、ログインは未実装

## 実装と照合して未確認の点

- ブラウザごとの音声品質差
- 一部ブラウザでの `speechSynthesis` の挙動差
- 実機での最終的な手動確認の網羅性
