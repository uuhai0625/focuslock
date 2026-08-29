# Chrome Web Store 申請用テキスト

申請フォームにコピー&ペーストして使う下書き集。UIがja/en両対応のため、ストア説明文も日英両方用意。

## 簡単な説明(132文字以内)

**日本語:**
```
集中したい時間だけサイトをロックする買い切り型フォーカス拡張機能。合言葉によるロック・スケジュール自動ブロックに対応、月額課金なし。
```

**English:**
```
Lock distracting sites only when you want to focus. Passphrase lock, scheduled auto-block, one-time purchase — no subscription.
```

## 詳細な説明

**日本語:**
```
FocusLockは、集中したい時間だけ特定のサイトをブロックできるChrome拡張機能です。手動でのON/OFFに加え、タイマー付きの「集中セッション」、曜日・時間帯を指定した自動ブロックにも対応しています。

■ こんな方におすすめ
・作業中についSNSやニュースサイトを開いてしまう
・無料のサイトブロック拡張機能を使っているが、自分に甘くてすぐ解除してしまう
・スマホの集中モードだけでは抜け道が多くて意味がない
・Freedomのような高額なサブスクリプションには抵抗がある

■ 特長:合言葉によるロック機能
集中セッション中に「早く終了する」を押しても、事前に自分で設定した合言葉を入力しないと終了できません。無料のブロッカーにありがちな「ワンクリックで簡単に解除できてしまう」問題に対し、思いとどまるための一手間を加えています。

■ 使い方
1. ツールバーのアイコンをクリックしてブロックしたいサイトを登録
2. 「今すぐブロック」でON/OFF、または集中セッション(買い切り版)を開始
3. 詳細設定画面で合言葉やスケジュールを登録

■ 無料版でできること
・ブロック対象サイトの登録・削除
・手動でのブロックON/OFF

■ 買い切り版でできること(300円・一度きりのお支払い、サブスクリプションではありません)
・集中セッション(25分・50分・90分のタイマー+合言葉ロック)
・スケジュール(曜日・時間帯を指定した自動ブロック)
・利用統計

■ 大切なお断り
FocusLockは、拡張機能自体の無効化・アンインストールを技術的に防ぐことはできません(これはブラウザ拡張機能全般の制約です)。あくまで「無料のブロッカーより思いとどまりやすくする」ためのツールとしてご利用ください。

■ プライバシーとデータの扱い
登録したブロック対象サイト・スケジュール・合言葉・統計は外部サーバーへ送信されず、すべてブラウザのローカルに保存されます。決済処理のみ、ExtensionPay(Stripe)を経由して行われます。
```

**English:**
```
FocusLock is a Chrome extension that blocks distracting sites only for the time you choose. On top of a simple manual on/off toggle, it offers timed "focus sessions" and automatic blocking on a schedule you set.

■ Who it's for
- You keep opening social media or news sites while trying to work
- You've tried free site blockers, but you just click "disable" the moment you feel like it
- Phone focus modes have too many loopholes to actually help
- Paid subscriptions like Freedom feel like overkill for what you need

■ The key feature: a passphrase lock
Pressing "End early" during a focus session isn't enough on its own — you have to type the passphrase you set for yourself first. This adds real friction against the "one click and you're out" problem free blockers don't solve.

■ How to use it
1. Click the toolbar icon and add the sites you want to block
2. Toggle "Block now" for manual blocking, or start a focus session (paid)
3. Set a passphrase and/or a schedule in the advanced settings

■ Free
- Add/remove sites to block
- Manual block on/off

■ Paid (¥300 one-time purchase, not a subscription)
- Focus sessions (25/50/90 min timers with passphrase lock)
- Scheduled auto-blocking by day and time
- Usage stats

■ Being upfront
FocusLock can't technically prevent you from disabling or uninstalling the extension itself — no browser extension can. Think of it as a tool that makes giving in meaningfully harder than a free blocker, not an unbreakable lock.

■ Privacy
Your block list, schedule, passphrase, and stats are stored only in your browser and never sent to any server. Payment is handled entirely by ExtensionPay (Stripe).
```

## 単一の目的(Single purpose)の説明

ユーザーが指定したWebサイトへのアクセスを、タイマー・スケジュール・手動指定に基づいてブロックし、集中を支援するためのツール。

## 権限の使用理由(Permissions justification、審査フォーム用)

**storage**
> Stores the user's block list, schedule, passphrase, and usage stats locally using chrome.storage.local. No data is transmitted to any external server.

**alarms**
> Used to track when an active focus session should end, and to periodically check whether a user-configured scheduled blocking window is currently active.

**declarativeNetRequest**
> Used to detect navigation to a site the user has added to their block list and redirect it to the extension's own local block screen (blocked.html). This API is never used to read page content or collect browsing data.

**host_permissions (`<all_urls>`)**
> FocusLock lets users block any website of their own choosing, added at runtime through the extension's popup. Because the set of sites to block is entirely user-defined and not known in advance, the declarativeNetRequest redirect rules must be able to match navigation to arbitrary domains, which requires host permissions across all sites. This permission is used exclusively to detect navigation to sites the user has explicitly added to their own block list and to redirect that navigation to the extension's local block screen. It is never used to read, collect, or transmit the content of any page, including pages that are not on the user's block list.

## プライバシーポリシーURL

https://uuhai0625.github.io/focuslock/privacy.html (2026-08-30公開、`PRIVACY.md`を`privacy.html`化してGitHub Pagesで公開、リポジトリ`uuhai0625/focuslock`)

## スクリーンショット(2026-08-30撮影完了)

Chrome Web Storeは1280x800または640x400のスクリーンショットを1〜5枚要求。SnapFolioと同じ理由(拡張機能の自ページはclaude-in-chromeの「別の拡張機能」制限でスクリーンショット取得不可)でユーザーが手動撮影、Claude側はWin+Shift+S直後のOSクリップボードから画像を保存する方式で対応(チャットに貼り付けられた画像はOSクリップボードと同期しないため、切り取った直後に保存する必要がある点に注意)。

1. [x] popup画面(無料版、ブロック対象サイト一覧・買い切り誘導ボタン)
2. [x] popup画面(合言葉ロック、「合言葉が違います」のエラー表示)
3. [x] 詳細設定画面(スケジュール設定・統計)
4. [x] ブロック画面(blocked.html、🔒アイコン)

元スクリーンショット(`store_screenshots/03_popup_idle_free_upgrade.png`等)に加え、`compose.py`(Pillow)でブランドカラー(青→紫グラデーション、アイコンと同系統)の背景に白いカード状で配置した1280x800版(`store_01_popup_free.png`〜`store_04_blocked_page.png`)を生成済み。ブロック画面のみ既に完成された暗色デザインのため、カード合成でなく中央クロップ+リサイズで1280x800化。

## カテゴリ・言語

- カテゴリ: 生産性(Productivity)
- 言語: 日本語・英語(拡張機能UIをi18n対応済み、ブラウザの言語設定に応じて自動切替。Chrome Web Store側のストア掲載情報も両言語で登録)
