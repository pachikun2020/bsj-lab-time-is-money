# Time is Money — Meeting Cost Counter | MERYDS BSJ LAB #001

日本語・Englishを画面右上で切り替えられる、会議の推定人件費カウンターです。表示言語を変えても通貨は円、単価は日本向けの固定概算値のままです。公開ライセンスと公開URLは未決です。

This prototype estimates meeting labor cost using fixed Japanese rates in yen. Switch between Japanese and English in the header. Language switching does not convert currency or localize labor rates. No public URL or open-source license has been approved.

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
5. Language choice is stored on this device. The English interface translates descriptions, controls, and CSV headings; monetary amounts stay in JPY.

## 算定式
`(フルタイム人数 × 2,500円/時 + パートタイム人数 × 1,500円/時) × (経過秒 ÷ 3600)`
フルタイムの固定単価には社会保険分を含む概算です。人数が計測中に変わる場合は、各区間の原価を積算します。
会議の目的・人数・表示設定はこの端末のlocalStorageに保存します。終了後の成果確認とメモは保存せず、必要ならCSVを出力します。
この数字は会議に投入された推定コストであり、すべて「無駄だった」という意味ではありません。

## 次のステップ
- 毎回会議後に「意思決定した数／持ち帰りタスク／次回会議の必要性」を記録する別画面
- 予定時間と実時間の差、議題無し率、同じ人の不要な同席を数値化（個人監視はしない）
- 企業単位の集計は**利用者の同意・設計レビュー後**。初期版でクラウド連携しない
- GitHub OSS公開の前にアクセシビリティ/スマホ/オフライン/セキュリティの最終QA

## 注意
元の海外会議コストツールの構成を参考にした試作です。第三者素材・商標と権利は公開前に確認します。**未公開のプロトタイプ**です。

License: 未決（公開前に権利者が決定）
