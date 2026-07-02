# Mailline

Gmailに届いたメールを条件指定（宛先・件名ワード）でLINEに通知するGoogle Apps Scriptです。
LINE Notify終了後の代替として、自分のLINE公式アカウント（Messaging API）で動作します。

お問い合わせフォームの通知メールをLINEで受け取る用途を想定しています。

## 特徴

- サーバー不要・無料（Google Apps Scriptで動作）
- 通知対象の宛先アドレスを複数指定可能
- 件名に含まれるワードで通知条件を指定可能（OR条件）
- 5分ごとに自動チェック（間隔は変更可能）

## 対応メール

Gmailのみ（Gmail / Google Workspace / Gmailへ転送設定済みのアドレス）

## 事前準備

1. [LINE公式アカウント](https://www.lycbiz.com/jp/service/line-official-account/)を作成する（無料）
2. 管理画面から **Messaging API** を有効化する
3. [LINE Developersコンソール](https://developers.line.biz/console/)で **チャネルアクセストークン（長期）** を発行する
4. 同コンソールの「チャネル基本設定」で あなたのユーザーID**（Uから始まる文字列）を控える
5. 作成した公式アカウントを自分のLINEで 友だち追加 する

## 設置手順

1. [Google Apps Script](https://script.google.com/) で新規プロジェクトを作成
2. `mailline.gs` の内容を全文コピペ
3. コード冒頭の 設定エリア を書き換える

```javascript
// チャネルアクセストークン（長期）
const CHANNEL_ACCESS_TOKEN = 'xxxxx';

// 通知先のLINEユーザーID（Uから始まる文字列）
const LINE_USER_ID = 'Uxxxxx';

// 通知対象にする宛先メールアドレス（複数指定可・いずれかに一致で対象）
const TARGET_TO_ADDRESSES = [
  'yourname@gmail.com',
];

// 件名に含まれていたら通知するワード（いずれか含めば通知 = OR条件）
// 空配列 [] にすると、宛先が一致した全メールを通知
const SUBJECT_KEYWORDS = [
  'お問い合わせ',
];
```

4. 関数 `setup` を選択して実行（初回はGoogleの権限承認が必要）
   → 「LINE通知済み」ラベルの作成と、5分ごとの自動チェックが設定されます
5. 関数 `sendTestMessage` を実行し、LINEにテスト通知が届けば完了

## 注意事項

- Messaging APIの無料枠は 月200通 です。超過分は配信されないか、LINE公式アカウントの有料プランが必要になります（プランは各自の公式アカウント設定に依存します）
- 重複通知の防止は スレッド単位のラベル付与 で行っています。同一スレッドに届いた2通目以降のメールは通知されません（お問い合わせフォームは通常1通1スレッドのため実用上は問題ありません）
- チェック間隔・検索対象期間はコード内の `CHECK_INTERVAL_MINUTES` / `SEARCH_RANGE` で変更できます

## ライセンス

MIT License

## 免責

本スクリプトの利用により生じたいかなる損害についても、作者は責任を負いません。
LINE、LINE公式アカウント、Messaging APIはLINEヤフー株式会社の商標またはサービスです。本プロジェクトはLINEヤフー株式会社とは無関係の非公式ツールです。
