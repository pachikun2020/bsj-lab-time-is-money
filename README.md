# Time is Money 〜会議の値段可視化アプリ〜 | MERYDS BSJ LAB #001

日本語・English・简体中文を切り替えられる、会議の推定人件費カウンターです。日本（JPY）、米国（USD）、英国（GBP）、アイルランド（EUR）、中国（CNY）で計測可能です。日本は暫定単価、米英・アイルランドは職種別の時給中央値、中国は職種別の年収中央値から換算した時給目安を使います。表示言語と計算対象国は独立しています。公開ライセンスと公開URLは未決です。

This local QA build offers Japanese, English and Simplified Chinese. All five countries can run timers. Japan uses provisional rates; the US, UK and Ireland use occupational median hourly wages. China uses an annual occupational median divided by assumed annual hours. US and China use total participants, with no separate full-time/part-time rates.

## 目的
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
会議の目的・人数・表示設定・計算対象国・表示言語はこの端末のlocalStorageに保存します。終了後の成果確認とメモは保存せず、必要ならCSVを出力します。
この数字は会議に投入された推定コストであり、すべて「無駄だった」という意味ではありません。

## 次のステップ
- 毎回会議後に「意思決定した数／持ち帰りタスク／次回会議の必要性」を記録する別画面
- 予定時間と実時間の差、議題無し率、同じ人の不要な同席を数値化（個人監視はしない）
- 企業単位の集計は**利用者の同意・設計レビュー後**。初期版でクラウド連携しない
- GitHub OSS公開の前にアクセシビリティ/スマホ/オフライン/セキュリティの最終QA

## 注意
元の海外会議コストツールの構成を参考にした試作です。第三者素材・商標と権利は公開前に確認します。**未公開のプロトタイプ**です。

License: 未決（公開前に権利者が決定）
