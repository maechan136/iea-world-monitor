#!/bin/bash
# Netlifyの認証情報を環境変数に登録するスクリプト
# 初回のみ実行してください

echo "NETLIFY_AUTH_TOKENを入力してください:"
read -s NETLIFY_AUTH_TOKEN_INPUT
echo "NETLIFY_SITE_IDを入力してください:"
read NETLIFY_SITE_ID_INPUT

SHELL_RC="$HOME/.zshrc"
if [ "$SHELL" = "/bin/bash" ]; then
  SHELL_RC="$HOME/.bash_profile"
fi

echo "" >> $SHELL_RC
echo "# IEA World Monitor" >> $SHELL_RC
echo "export NETLIFY_AUTH_TOKEN=$NETLIFY_AUTH_TOKEN_INPUT" >> $SHELL_RC
echo "export NETLIFY_SITE_ID=$NETLIFY_SITE_ID_INPUT" >> $SHELL_RC

source $SHELL_RC
echo "✅ 環境変数を登録しました"
