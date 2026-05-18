# IEA World Monitor — 毎日手動更新版

## 毎朝の更新手順（1コマンド）

ターミナルを開いて以下を実行するだけ：

```bash
cd ~/iea-world-monitor && claude "CLAUDE.mdの指示に従って本日の更新をしてください"
```

## 初回セットアップ（1回だけ）

```bash
bash setup-env.sh
```

Netlify Auth TokenとSite IDを入力してください。
取得場所：
- Auth Token: https://app.netlify.com → User settings → Applications → New access token
- Site ID: https://app.netlify.com → 対象サイト → Site configuration → General → Site ID
