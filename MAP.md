# TanStack Start + Cloudflare プロジェクト

## 📁 ディレクトリ構造

```text
.
├── .vscode                      # VSCode設定ファイル
├── dist                         # ビルド出力ディレクトリ
│   ├── client                   # → クライアントサイドビルド出力
│   │   └── assets               # → 静的アセット（CSS、JS、画像など）
│   └── server                   # → サーバーサイドビルド出力
│       ├── .vite                # → Viteメタデータ
│       └── assets               # → サーバー用アセット
├── public                       # 静的ファイル（そのままコピーされる）
│   ├── favicon.ico
│   ├── logo192.png
│   ├── logo512.png
│   ├── manifest.json
│   └── robots.txt
├── src                          # ソースコードのルートディレクトリ
│   ├── components               # → 再利用可能なReactコンポーネント
│   │   └── Header.tsx           # → ヘッダーコンポーネント
│   ├── routes                   # → TanStack Routerのページ定義（ファイルベースルーティング）
│   │   ├── __root.tsx           # → ルートレイアウト、全ページ共通のHTML構造
│   │   ├── index.tsx            # → トップページ（/）
│   │   ├── api.demo-names.ts    # → APIエンドポイント（/api/demo-names）
│   │   ├── demo.start.api-request.tsx  # → API使用例ページ
│   │   └── demo.start.server-funcs.tsx # → サーバー関数デモページ
│   ├── router.tsx               # → ルーター設定とインスタンス作成
│   ├── styles.css               # → グローバルスタイル
│   ├── logo.svg                 # → ロゴファイル
│   └── routeTree.gen.ts         # → TanStack Routerが自動生成するルート定義
├── types                        # → TypeScript型定義ディレクトリ
│   └── env.d.ts                 # → カスタム環境変数・バインディング型定義
├── .cta.json                    # CTA設定ファイル
├── .gitignore                   # Git除外設定
├── AGENTS.md                    # エージェント設定ドキュメント
├── MAP.md                       # このファイル（プロジェクト構造説明）
├── package.json                 # 依存関係とスクリプト定義
├── pnpm-lock.yaml              # pnpm依存関係ロックファイル
├── README.md                    # プロジェクト説明
├── tsconfig.json               # TypeScript設定
├── vite.config.ts              # Vite + Cloudflare設定
├── worker-configuration.d.ts   # Wrangler自動生成のCloudflare型定義
└── wrangler.jsonc              # Cloudflare Workers設定ファイル

6 directories, 20 files
```

## 🎯 主要ディレクトリの役割

### `/src/routes/` - ページとAPI定義
- **ファイルベースルーティング**: ファイル名がURLパスになる
- **`__root.tsx`**: 全ページ共通のレイアウト（HTML構造、devtools設定）
- **`index.tsx`**: トップページコンポーネント
- **`api.*.ts`**: サーバーサイドAPIエンドポイント
- **使用方法**: 新しいページは`routes/`下にファイルを追加するだけ

### `/src/components/` - 再利用可能コンポーネント
- **Reactコンポーネント**: ページ間で共有される部品
- **使用方法**: `import Header from '../components/Header'`でインポート

### `/types/` - TypeScript型定義
- **`env.d.ts`**: カスタム環境変数やCloudflareバインディング型
- **使用方法**: TanStack Start + Cloudflare用の型拡張

### `/dist/` - ビルド出力
- **`client/`**: ブラウザ用の静的ファイル
- **`server/`**: Cloudflare Workers用のサーバーコード
- **自動生成**: `pnpm build`で作成される

## 🚀 Cloudflare設定ファイル

### `wrangler.jsonc`
- Cloudflare Workers設定
- デプロイ時の動作を制御
- `@tanstack/react-start/server-entry`をエントリーポイントに指定

### `worker-configuration.d.ts`
- Wranglerが自動生成するTypeScript型定義
- Cloudflareバインディング（KV、R2、D1など）の型情報
- `pnpm run cf-typegen`で更新

### `vite.config.ts`
- Cloudflare互換ビルド設定
- `@cloudflare/vite-plugin`でWorkers環境に最適化
- `target: 'cloudflare-module'`でCloudflare向けビルド

## 📝 開発フロー

1. **開発開始**: `pnpm dev`
2. **ページ追加**: `src/routes/`下にファイル作成
3. **コンポーネント作成**: `src/components/`下に追加
4. **ビルド**: `pnpm build`
5. **デプロイ**: `pnpm deploy`

## 🔧 主要スクリプト

- `pnpm dev` - 開発サーバー起動
- `pnpm build` - Cloudflare向けビルド
- `pnpm deploy` - Cloudflareにデプロイ
- `pnpm run cf-typegen` - Cloudflare型定義生成
