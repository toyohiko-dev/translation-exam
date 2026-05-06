# 開発メモ

## このドキュメントの役割

このファイルは、現在の実装状況と技術構成を記録するためのものです。
仕様の正本は `docs/spec.md` を参照してください。

## 現在の構成

- 静的Webアプリ
- `package.json` なし
- npm 前提の開発構成ではない
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
- Google翻訳を開く直前の日本文コピー
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
- Google翻訳ボタンは `window.open(url, "_blank", "noopener,noreferrer")` を使う
- Google翻訳URLは `https://translate.google.com/?sl=ja&tl=en&text=ENCODED_TEXT&op=translate` 形式
- 翻訳対象テキストは `appState.currentPrompt?.textJa` を優先し、空なら `revealedJapanese.textContent` を使う
- Google翻訳を開く直前に `navigator.clipboard.writeText` で日本文コピーを試みる
- クリップボードコピーに失敗しても Google翻訳起動は継続し、`console.warn` のみ出す

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
- スマホ実機では、ブラウザや端末設定により Google翻訳アプリへ遷移する可能性がある

## ローカル確認方法

- `file://` 直開きではなく、静的ファイルを配信できるローカルサーバー経由で確認する
- 例:
  - VS Code の Live Server 拡張を使う
  - 任意の簡易HTTPサーバーでこのディレクトリを配信する
- `package.json` がないため、`npm run dev` や `npm run build` は前提にしない

## 公開メモ

- このプロジェクトは静的HTML/JS/CSS構成のため、Vercel へは静的サイトとして公開できる
- 公開時にビルドコマンドは不要
- ルートディレクトリの `index.html` を起点に、そのまま配信する前提

## 実装と照合して未確認の点

- ブラウザごとの音声品質差
- 一部ブラウザでの `speechSynthesis` の挙動差
- 実機での最終的な手動確認の網羅性
