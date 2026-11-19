# BSJ LAB · Time is Money MCC ミーティングコストカウンター / MERYDS

正式製品名：Time is Money MCC ミーティングコストカウンター。BSJ LAB #001。MCCはMeeting Cost Counterの略です。全言語で製品名とこの略称の説明を共通にし、その他の説明文を翻訳します。

日本語・English・简体中文を切り替えられる、会議の推定人件費カウンターです。日本（JPY）、米国（USD）、英国（GBP）、アイルランド（EUR）、中国（CNY）で計測可能です。日本は固定の概算単価、米英・アイルランドは職種別の時給中央値、中国は職種別の年収中央値から換算した時給目安を使います。表示言語と計算対象国は独立しています。MITライセンスで初回公開を準備中です。一般公開URLは未決です。

This local QA build offers Japanese, English and Simplified Chinese. All five countries can run timers. Japan uses provisional rates; the US, UK and Ireland use occupational median hourly wages. China uses an annual occupational median divided by assumed annual hours. US and China use total participants, with no separate full-time/part-time rates.

## 目的

現在の検証候補は **v0.6.6-qa** です。初回一般公開を準備中です。ライセンスはMIT、著作権者は合同会社MERYDS（MERYDS LLC）です。個人の連絡先や認証付き検証URLを公開READMEへ載せない運用とします。

会議の推定人件費をリアルタイムに表示し、「その会議は必要か？」を考えるきっかけにする。社内利用者を監視・評価するツールではありません。

## 特徴
- 無料・登録不要・バックエンドなし・外部通信/解析SDKなし（公開時のホスティングアクセスログは別途管理）
- フルタイム人数とパートタイム人数だけから推定コストを計算
- 開始時に会議の目的（決定・共有・対話）を選び、終了時に成果を確認
- 途中停止・再開・リセット、全画面に近い投影モード
- CSVエクスポート、設定のローカル保存、PWAオフラインキャッシュ
- 個別社員の給与・氏名を扱わない

## 使い方
1. `index.html` を開くと基本機能が利用できます（Service Workerは file:// では無効）。
2. PWAのインストール・オフラインを利用するにはHTTPS（例: Cloudflare Pages）でディレクトリを公開します。
3. ローカル検証は `python3 -m http.server 8000` で起動し `http://localhost:8000` にアクセスします。
4. 内容・商標・ドメイン・利用規約を最終確認するまで本番公開はしません。
5. Language and country choice are stored on this device. Language changes do not convert currency. A running meeting locks its country until reset.

## 算定式
米国は[BLS OEWS May 2025](https://www.bls.gov/news.release/ocwage.t01.htm)のOffice and administrative support occupationsの時給中央値$22.81を使い、合計人数で計算します。
中国は[人社部・企業薪酬調査情報2024年、表1-1](https://www.mohrss.gov.cn/SYrlzyhshbzb/laodongguanxi_/fwyd/202506/t20250627_544623.html)の行政事務・補助職（301）の年収50分位値6.62万元＝66,200元を使用。週40時間×52週＝2,080時間（休日調整なしの仮定）で割ると約31.83元/時です。原表の年収は賞与・手当・残業代等を含みます。実測の時給中央値ではなく年収中央値からの目安として、合計人数で計算します。
日本はCE仮置きであり、統計中央値ではありません。英国は[ONS ASHE Table 14.6a 2025 revised](https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/datasets/occupation4digitsoc2010ashetable14)のAdministrative and secretarial occupations：フルタイム£15.81/時、パートタイム£14.03/時（残業代を除く中央値）。アイルランドは[CSO Structure of Earnings Survey 2022 表4.2](https://www.cso.ie/en/releasesandpublications/ep/p-ses/structureofearningssurvey2022/occupationandeducation/)のAdministrative & Secretarial職種：フルタイム€18.24/時、パートタイム€16.66/時。いずれもホワイトカラー全体の中央値ではありません。
`(フルタイム人数 × 2,500円/時 + パートタイム人数 × 1,500円/時) × (経過秒 ÷ 3600)`
フルタイムの固定単価には社会保険分を含む概算です。人数が計測中に変わる場合は、各区間の原価を積算します。
人数・表示設定・計算対象国・表示言語はこの端末のlocalStorageに保存します。目的区分・数値の計測状態・区間履歴はこのタブのsessionStorageに保存し、再読込時に復元します。会議の目的は新しい会議ごとに選択します。自由記入のメモと終了後の成果選択は保存せず、必要ならCSVを出力します。入力中の人数は欄を離れると計測へ反映され、それまでは直前に確定した人数を使います。CSVには人数と時給の区間履歴を付けます。
計測は端末の日時に基づくため、スリープ中も経過時間を含めます。計測中は日時を変更しないでください。iPhone実機で開始・一時停止・再開、画面ロック後の計測継続、CSV保存・開封を確認済みです。ホーム画面追加後のオフライン動作などは別途確認が必要です。
再読込で復元する計測が10分以上途切れている場合は、一時停止して、その間の時間を加算するか選びます。加算・除外の選択は区間CSVへ記録します。復元後の目的メモは入力し直せます。CSVの保存完了はブラウザから確認できないため、出力後もリセット・離脱前の確認を維持します。
この数字は会議に投入された推定コストであり、すべて「無駄だった」という意味ではありません。

## 次のステップ
- 毎回会議後に「意思決定した数／持ち帰りタスク／次回会議の必要性」を記録する別画面
- 予定時間と実時間の差、議題無し率、同じ人の不要な同席を数値化（個人監視はしない）
- 企業単位の集計は**利用者の同意・設計レビュー後**。初期版でクラウド連携しない
- GitHub OSS公開の前にアクセシビリティ/スマホ/オフライン/セキュリティの最終QA

## ローカルの配布候補作成（公開しない）

`python3 tools/build_release.py --out ../release-prep-20261118/candidate-02`で、許可したアプリ資産だけの検証用パッケージを作成できます。出力先が既にある場合は上書きしません。アプリ用11資産に加え、MITのLICENSE・素材記録・統計出典表記、Pages向けヘッダー案、404、robots.txtの合計17ファイルを含みます。社内資料・CSV・Git履歴・認証情報は含めません。

`python3 tools/serve_release.py --site ../release-prep-20261118/candidate-02/site --port 8782`は127.0.0.1だけで待ち受け、同じヘッダー案をローカルで検証します。Cloudflareへの配置やDNS変更は行いません。

ヘッダー案は検証専用ホストのルート配置を想定しています。BSJ LAB LPへそのまま混ぜないでください。noindexは検索抑止で、認証ではありません。検証用URLを外部に作る場合は、URL・アクセス制限を決めて別途承認が必要です。[Pagesのヘッダー仕様](https://developers.cloudflare.com/pages/configuration/headers/)、[HTMLと404の扱い](https://developers.cloudflare.com/pages/configuration/serving-pages/)を参照。

## 注意
元の海外会議コストツールの構成を参考にした試作です。第三者素材・商標と権利は公開前に確認します。**未公開のプロトタイプ**です。

License: [MIT](LICENSE) — Copyright (c) 2026 合同会社MERYDS (MERYDS LLC)。統計データは各提供元の条件に従います。商標権の許諾は含みません。

素材の出所と確認状況は [ASSETS.md](ASSETS.md)、単価の定義・出典・データ利用表記は [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) を参照してください。脆弱性の連絡は [SECURITY.md](SECURITY.md)、提案・寄稿は [CONTRIBUTING.md](CONTRIBUTING.md) に従ってください。
