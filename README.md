新しい TanStack アプリへようこそ！

# はじめに

このアプリケーションを実行するには、次のコマンドを実行します。

```bash
pnpm install
pnpm start
```

# 本番ビルド

本番用のビルドを作成するには、以下を実行します。

```bash
pnpm build
```

## テスト

このプロジェクトはテストに [Vitest](https://vitest.dev/) を使用しています。テストの実行は次の通りです。

```bash
pnpm test
```

## スタイリング

このプロジェクトはスタイリングに [Tailwind CSS](https://tailwindcss.com/) を利用しています。

## ルーティング

このプロジェクトは [TanStack Router](https://tanstack.com/router) を採用しています。初期設定ではファイルベースルーティングとなっており、`src/routes` ディレクトリ内のファイルがルートとして扱われます。

### ルートの追加

新しいルートを追加したい場合は、`./src/routes` ディレクトリに新しいファイルを作成するだけで構いません。

TanStack がルートファイルの内容を自動的に生成してくれます。

ルートが 2 つ以上になったら、`Link` コンポーネントを使ってページ間を遷移できます。

### リンクの追加

SPA（Single Page Application）として遷移させるには、`@tanstack/react-router` から `Link` コンポーネントをインポートします。

```tsx
import { Link } from "@tanstack/react-router";
```

あとは任意の JSX 内で次のように使用します。

```tsx
<Link to="/about">About</Link>
```

これで `/about` ルートへ遷移するリンクが作成されます。

`Link` コンポーネントの詳細は [Link のドキュメント](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent) を参照してください。

### レイアウトの利用

ファイルベースルーティングのレイアウトは `src/routes/__root.tsx` に配置されています。ルートコンポーネントに追加した要素は、すべてのルートで共有されます。ルートごとのコンテンツは、JSX 内で `<Outlet />` コンポーネントを使用した場所に表示されます。

以下はヘッダーを含むレイアウトの例です。

```tsx
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import { Link } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <>
      <header>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
        </nav>
      </header>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
})
```

`<TanStackRouterDevtools />` コンポーネントは必須ではないため、レイアウトに表示したくない場合は削除できます。

レイアウトに関する詳細は [Layouts のドキュメント](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts) を確認してください。

## データフェッチ

アプリケーションでデータを取得する方法はいくつかあります。サーバーからデータを取得するには TanStack Query を利用できますし、ルートが表示される前にデータを読み込むための `loader` 機能を TanStack Router に組み込むこともできます。

例を見てみましょう。

```tsx
const peopleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/people",
  loader: async () => {
    const response = await fetch("https://swapi.dev/api/people");
    return response.json() as Promise<{
      results: {
        name: string;
      }[];
    }>;
  },
  component: () => {
    const data = peopleRoute.useLoaderData();
    return (
      <ul>
        {data.results.map((person) => (
          <li key={person.name}>{person.name}</li>
        ))}
      </ul>
    );
  },
});
```

`loader` を使えば、データフェッチの処理を大幅に簡略化できます。詳細は [Loader のドキュメント](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters) を参照してください。

### React Query

React Query はルートローディングの補完または代替として非常に優れています。アプリケーションへの組み込みも簡単です。

まず依存関係を追加します。

```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

次にクエリクライアントとプロバイダーを作成します。`main.tsx` に配置することを推奨します。

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ...

const queryClient = new QueryClient();

// ...

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
```

必要に応じて、TanStack Query Devtools をルートルートに追加することもできます。

```tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <ReactQueryDevtools buttonPosition="top-right" />
      <TanStackRouterDevtools />
    </>
  ),
});
```

これで `useQuery` を使ってデータを取得できるようになります。

```tsx
import { useQuery } from "@tanstack/react-query";

import "./App.css";

function App() {
  const { data } = useQuery({
    queryKey: ["people"],
    queryFn: () =>
      fetch("https://swapi.dev/api/people")
        .then((res) => res.json())
        .then((data) => data.results as { name: string }[]),
    initialData: [],
  });

  return (
    <div>
      <ul>
        {data.map((person) => (
          <li key={person.name}>{person.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
```

React Query の使い方は [React Query のドキュメント](https://tanstack.com/query/latest/docs/framework/react/overview) を参照してください。

## 状態管理

React アプリケーションでは状態管理が必要になることがよくあります。React の状態管理にはさまざまな選択肢がありますが、TanStack Store はプロジェクトの出発点として優れた選択肢です。

まず TanStack Store を依存関係に追加します。

```bash
pnpm add @tanstack/store
```

次に、`src/App.tsx` にシンプルなカウンターを実装してみましょう。

```tsx
import { useStore } from "@tanstack/react-store";
import { Store } from "@tanstack/store";
import "./App.css";

const countStore = new Store(0);

function App() {
  const count = useStore(countStore);
  return (
    <div>
      <button onClick={() => countStore.setState((n) => n + 1)}>
        Increment - {count}
      </button>
    </div>
  );
}

export default App;
```

TanStack Store の利点のひとつは、状態から別の状態を導出できる点です。導出した状態は基となる状態が更新されると自動的に更新されます。

導出状態を使ってカウントを 2 倍にする例を見てみましょう。

```tsx
import { useStore } from "@tanstack/react-store";
import { Store, Derived } from "@tanstack/store";
import "./App.css";

const countStore = new Store(0);

const doubledStore = new Derived({
  fn: () => countStore.state * 2,
  deps: [countStore],
});
doubledStore.mount();

function App() {
  const count = useStore(countStore);
  const doubledCount = useStore(doubledStore);

  return (
    <div>
      <button onClick={() => countStore.setState((n) => n + 1)}>
        Increment - {count}
      </button>
      <div>Doubled - {doubledCount}</div>
    </div>
  );
}

export default App;
```

ここでは `Derived` クラスを使い、別のストアから導出された新しいストアを作成しています。`Derived` クラスの `mount` メソッドを呼び出すと、導出ストアの更新が開始されます。

導出ストアを作成したら、`useStore` フックを使って通常のストアと同じように `App` コンポーネントで利用できます。

TanStack Store の詳しい使い方は [TanStack Store のドキュメント](https://tanstack.com/store/latest) を参照してください。

# デモファイル

`demo` で始まるファイルは安全に削除できます。導入済みの機能を試すためのスタート地点として用意されています。

# さらに学ぶ

TanStack の各種プロダクトについては [TanStack のドキュメント](https://tanstack.com) を参照してください。
