# humming-renote

鼻歌を録音し、ピッチ検出で音程解析→五線譜表示するWebアプリ。

## 概要

マイク入力の鼻歌をリアルタイム解析、音高(周波数)を音名/MIDIノートに変換、五線譜として可視化する。作曲メモ・鼻歌採譜の補助ツール。

## 技術スタック

- **Next.js 16** (App Router / Static Export) / React 19 / TypeScript 5
- **Pitchy** - ピッチ検出(基本周波数推定、McLeod Pitch Method)
- **Web Audio API** - マイク入力取得(`getUserMedia` + `AudioWorklet`/`AnalyserNode`)
- **VexFlow** - 五線譜レンダリング(SVG)
- デプロイ: GitHub Pages(静的サイト)

## 機能要件

### 1. 録音

- マイク許可取得→録音開始/停止ボタン
- 録音中は波形/音量メーター表示

### 2. ピッチ検出

- `AudioContext`でマイク入力をバッファリング、一定間隔(例: 2048サンプル毎)でPitchyの`PitchDetector`に渡し基本周波数(Hz)とクラリティ(信頼度)を取得
- クラリティ閾値未満(無音・ノイズ)はノート化しない
- 周波数→MIDIノート番号→音名(例: A4, C#5)へ変換
- 連続する近似ピッチをまとめ1音符化(オンセット/オフセット検出、最短ノート長でフィルタ)

### 3. 採譜(音符化)

- 検出音列を時系列ノートイベント(音高・開始時刻・長さ)に変換
- テンポ未指定時は仮テンポ(例: 120BPM)でクオンタイズ、または検出テンポでクオンタイズ
- 音価は四分音符/八分音符などにスナップ

### 4. 楽譜表示

- VexFlowでノートイベント列を五線譜(ト音記号)にレンダリング
- 録音と同時にリアルタイム描画、または録音後まとめて描画(両対応が理想、まずは録音後表示から実装)

### 5. 再生・書き出し(拡張)

- 採譜結果をWeb Audio/MIDIで再生確認
- MusicXML / MIDIファイルエクスポート

## 画面構成

1. トップ画面: 録音開始/停止ボタン、音量メーター、リアルタイムピッチ表示(現在の音名/Hz)
2. 結果画面: 五線譜表示、再生ボタン、エクスポートボタン

## データフロー

```
マイク入力
  → Web Audio API (AudioContext, getUserMedia)
  → 音声バッファ (Float32Array)
  → Pitchy PitchDetector.findPitch()
  → { frequency, clarity }
  → 音名/MIDIノート変換 + クラリティフィルタ
  → ノートイベント列 (pitch, startTime, duration)
  → クオンタイズ
  → VexFlow描画データ (StaveNote[])
  → 五線譜SVG表示
```

## ノートイベント構造(案)

```ts
type NoteEvent = {
  midi: number // MIDIノート番号
  noteName: string // 例: "C4"
  startTime: number // 秒
  duration: number // 秒
  clarity: number // 0-1 検出信頼度
}
```

## 非機能要件

- ブラウザのみで完結(バックエンド不要、静的サイトとしてデプロイ)
- 対応ブラウザ: Web Audio API対応モダンブラウザ(Chrome/Edge/Safari最新版)
- マイク権限拒否時のエラーハンドリング必須

## 今後の課題

- ピッチ検出精度(ビブラート・裏声の揺れ吸収)
- テンポ推定・拍子推定の精度
- 和音非対応(単旋律のみ想定)
