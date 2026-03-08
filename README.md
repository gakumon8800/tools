# 賃貸トラブル診断ツール

質問に回答すると、賃貸トラブル時に必要な「管理会社対応レベル（高・中・低）」を表示する静的Webアプリです。

## ファイル構成

- `index.html` : 画面UI
- `styles.css` : スタイル
- `script.js` : 診断ロジック

## ローカル起動

```bash
python3 -m http.server 8000
```

ブラウザで `http://localhost:8000` にアクセスしてください。

## 公開方法（GitHub Pages）

1. このリポジトリをGitHubへpush
2. GitHubの **Settings > Pages** を開く
3. **Build and deployment** で `Deploy from a branch` を選択
4. Branch を `main`（または利用ブランチ） / Folder を `/ (root)` に設定
5. 数分待つと公開URLが表示されます

静的ファイルのみで構成されるため、そのままNetlifyやVercelにも配置可能です。
