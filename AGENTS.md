# Repository Guidelines

## Agent-Specific Instructions

Use English to think, and answer in Japanese.

## Project Structure & Module Organization

- アプリ本体は `src/` 配下です。`src/routes/` がファイルベースルーティング、`src/components/` が再利用コンポーネント、`src/styles.css` がグローバルスタイルです。
- ビルド成果物は Vite が `dist/` と `.output/` に生成します。静的アセットは `public/` に配置してください。
- 設定ファイルは `tsconfig.json`、`vite.config.ts`、`.cta.json` にまとまっています。新規設定は既存ファイルへ追記し、乱立を避けてください。

## Build, Test, and Development Commands

- `pnpm install` 依存関係のインストール。
- `pnpm dev` 開発サーバーを `http://localhost:3000` で起動。
- `pnpm build` クライアントと SSR バンドルを生成。
- `pnpm start` `.output/server/index.mjs` を使った本番相当の起動。
- `pnpm test` Vitest による単体テスト実行。

## Coding Style & Naming Conventions

- TypeScript + React 19 を採用。関数コンポーネントとフックスを基本とし、インデントはスペース 2 つを維持。
- ファイル名はキャメルケースまたはケバブケースで、ルートは `route-name.tsx`、コンポーネントは `ComponentName.tsx` を推奨。
- Tailwind CSS v4 を利用。ユーティリティクラスは JSX 内で完結させ、複雑なスタイルは `styles.css` に抽出。

## Testing Guidelines

- テストフレームワークは Vitest と Testing Library。テストファイルは対象と同じディレクトリに `*.test.ts(x)` で配置。
- DOM/コンポーネントは `@testing-library/react` を使用し、副作用は `vi.spyOn` で検証。
- カバレッジ目標は 80% 以上を目安にし、重要フロー（ルート遷移、サーバー関数）は最低 1 本の検証を追加。

## Commit & Pull Request Guidelines

- 現状コミット履歴は未整備のため、`feat:`, `fix:`, `chore:` などの Conventional Commits 準拠プレフィックスを推奨。
- PR では変更概要、検証手順（例: `pnpm build`, `pnpm test`）、関連 Issue のリンクを必ず記載。UI 変更時はスクリーンショットを添付してください。
- 大きな変更は分割コミットを徹底し、レビュアーが追いやすい差分を心掛けましょう。
