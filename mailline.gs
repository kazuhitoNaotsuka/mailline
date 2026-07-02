/**
 * =====================================================
 * Mailline — Gmail → LINE 通知スクリプト（Google Apps Script）
 * =====================================================
 * 指定した宛先アドレスに届いたメールのうち、件名に指定ワードを
 * 含むものをLINE公式アカウント（Messaging API）でプッシュ通知します。
 *
 * 【対応メール】Gmailのみ（Gmail / Google Workspace / Gmailへ転送設定済みのアドレス）
 *
 * 【事前準備】
 * 1. LINE公式アカウントを作成し、Messaging APIを有効化
 * 2. LINE Developersコンソールで「チャネルアクセストークン（長期）」を発行
 * 3. 自分のユーザーID（Uから始まる文字列）を確認
 *    （LINE Developersコンソール > チャネル基本設定 > あなたのユーザーID）
 * 4. 作成した公式アカウントを自分のLINEで友だち追加
 *
 * 【設置手順】
 * 1. Google Apps Script（script.google.com）で新規プロジェクト作成
 * 2. このコードを全文コピペ
 * 3. 下の「設定エリア」を書き換える
 * 4. 関数「setup」を選択して1回実行（初回は権限承認が必要）
 *    → ラベル作成と5分ごとの自動チェックが設定されます
 * 5. 関数「sendTestMessage」を実行してLINEにテスト通知が届けば完了
 */

// =====================================================
// ▼▼▼ 設定エリア（ここだけ書き換えてください） ▼▼▼
// =====================================================

// チャネルアクセストークン（長期）
const CHANNEL_ACCESS_TOKEN = 'ここにチャネルアクセストークンを貼り付け';

// 通知先のLINEユーザーID（Uから始まる文字列）
const LINE_USER_ID = 'ここにユーザーIDを貼り付け';

// 通知対象にする宛先メールアドレス（複数指定可・いずれかに一致で対象）
// ※Gmailで受信できるアドレスのみ対象（Gmail / Google Workspace / Gmailへ転送設定済みのアドレス）
const TARGET_TO_ADDRESSES = [
  'yourname@gmail.com',
  // 'info@your-domain.com', // Google Workspaceまたは転送設定済みの独自ドメインも可
];

// 件名に含まれていたら通知するワード（複数指定可・いずれか含めば通知 = OR条件）
// 空配列 [] にすると、宛先が一致した全メールを通知します
const SUBJECT_KEYWORDS = [
  'お問い合わせ',
  // '資料請求',
];

// =====================================================
// ▲▲▲ 設定エリアここまで ▲▲▲
// =====================================================

const PROCESSED_LABEL = 'LINE通知済み'; // 通知済みメールに付くラベル名
const CHECK_INTERVAL_MINUTES = 5;        // チェック間隔（分）
const SEARCH_RANGE = 'newer_than:2d';    // 検索対象期間（直近2日）

/**
 * 初期セットアップ（最初に1回だけ実行してください）
 */
function setup() {
  // ラベル作成
  if (!GmailApp.getUserLabelByName(PROCESSED_LABEL)) {
    GmailApp.createLabel(PROCESSED_LABEL);
  }
  // 既存トリガーを削除してから再作成（重複防止）
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'checkMailAndNotify') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('checkMailAndNotify')
    .timeBased()
    .everyMinutes(CHECK_INTERVAL_MINUTES)
    .create();
  Logger.log('セットアップ完了：' + CHECK_INTERVAL_MINUTES + '分ごとにメールをチェックします');
}

/**
 * テスト通知（設定確認用）
 */
function sendTestMessage() {
  sendLinePush('【テスト】Gmail→LINE通知の設定が完了しました');
}

/**
 * メールをチェックしてLINEに通知（トリガーから自動実行）
 */
function checkMailAndNotify() {
  const query = buildSearchQuery();
  const threads = GmailApp.search(query, 0, 20);
  if (threads.length === 0) return;

  const label = GmailApp.getUserLabelByName(PROCESSED_LABEL);

  threads.forEach(function (thread) {
    const message = thread.getMessages()[thread.getMessageCount() - 1];
    const text =
      '📩 メールが届きました\n' +
      '───────────\n' +
      '件名：' + message.getSubject() + '\n' +
      '差出人：' + message.getFrom() + '\n' +
      '宛先：' + message.getTo() + '\n' +
      '受信：' + Utilities.formatDate(message.getDate(), 'Asia/Tokyo', 'M/d HH:mm');
    sendLinePush(text);
    thread.addLabel(label); // 通知済みラベルを付与（重複通知防止）
  });
}

/**
 * Gmail検索クエリを組み立てる
 */
function buildSearchQuery() {
  const toPart = 'to:(' + TARGET_TO_ADDRESSES.join(' OR ') + ')';
  let query = toPart + ' -label:' + PROCESSED_LABEL + ' ' + SEARCH_RANGE;
  if (SUBJECT_KEYWORDS.length > 0) {
    const kw = SUBJECT_KEYWORDS.map(function (k) {
      return '"' + k + '"';
    }).join(' OR ');
    query += ' subject:(' + kw + ')';
  }
  return query;
}

/**
 * LINE Messaging APIでプッシュ送信
 */
function sendLinePush(text) {
  const url = 'https://api.line.me/v2/bot/message/push';
  const payload = {
    to: LINE_USER_ID,
    messages: [{ type: 'text', text: text }],
  };
  const params = {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + CHANNEL_ACCESS_TOKEN },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };
  const res = UrlFetchApp.fetch(url, params);
  if (res.getResponseCode() !== 200) {
    Logger.log('LINE送信エラー: ' + res.getContentText());
  }
}
