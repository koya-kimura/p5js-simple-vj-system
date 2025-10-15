#!/bin/bash
set -euo pipefail

export LC_ALL=C

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
TEMPLATE_FILE="${ROOT_DIR}/templates/sceneTemplate.ts"
SCENES_ROOT="${ROOT_DIR}/src/scenes"

if [ ! -f "${TEMPLATE_FILE}" ]; then
  echo "テンプレートファイルが見つかりません: ${TEMPLATE_FILE}" >&2
  exit 1
fi

CATEGORY_RAW="${1:-}"
SCENE_RAW="${2:-}"
if [ "$#" -gt 0 ]; then shift; fi
if [ "$#" -gt 0 ]; then shift; fi
DISPLAY_NAME_RAW="$*"

trim() {
  echo "$1" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//'
}

to_pascal() {
  local input="$1"
  local spaced
  spaced=$(echo "$input" | sed -E 's/([a-z0-9])([A-Z])/\1 \2/g' | sed -E 's/[^[:alnum:]]+/ /g')
  echo "$spaced" | awk '{
    for (i = 1; i <= NF; i++) {
      word = tolower($i);
      printf "%s", toupper(substr(word, 1, 1)) substr(word, 2)
    }
  }'
}

to_title_words() {
  local input="$1"
  local spaced
  spaced=$(echo "$input" | sed -E 's/([a-z0-9])([A-Z])/\1 \2/g' | sed -E 's/[^[:alnum:]]+/ /g')
  echo "$spaced" | awk '{
    for (i = 1; i <= NF; i++) {
      word = tolower($i);
      $i = toupper(substr(word, 1, 1)) substr(word, 2)
    }
    print $0
  }'
}

escape_sed() {
  echo "$1" | sed -e 's/[\/&#]/\\&/g'
}

validate_category() {
  local value="$1"
  if [ -z "$value" ]; then
    echo "カテゴリ名を入力してください。"
    return 1
  fi
  if [[ "$value" =~ ^/ || "$value" =~ /$ ]]; then
    echo "カテゴリ名の先頭と末尾にスラッシュは使用できません。"
    return 1
  fi
  if [[ "$value" =~ \.\. ]]; then
    echo "カテゴリ名に '..' は使用できません。"
    return 1
  fi
  if [[ "$value" =~ [^A-Za-z0-9/_-] ]]; then
    echo "カテゴリ名には英数字・ハイフン・アンダースコア・スラッシュのみ使用できます。"
    return 1
  fi
  IFS='/' read -r -a segments <<< "$value"
  for segment in "${segments[@]}"; do
    if [ -z "$segment" ]; then
      echo "スラッシュの前後は空にできません。"
      return 1
    fi
  done
  return 0
}

validate_scene() {
  local value="$1"
  if [ -z "$value" ]; then
    echo "シーンの基本名を入力してください。"
    return 1
  fi
  if [[ "$value" =~ [[:space:]] ]]; then
    echo "シーンの基本名に空白は使用できません。"
    return 1
  fi
  if [[ "$value" =~ / ]]; then
    echo "シーンの基本名にスラッシュは使用できません。"
    return 1
  fi
  if [[ "$value" =~ \.\. ]]; then
    echo "シーンの基本名に '..' は使用できません。"
    return 1
  fi
  if [[ "$value" =~ [^A-Za-z0-9_-] ]]; then
    echo "シーンの基本名には英数字・ハイフン・アンダースコアのみ使用できます。"
    return 1
  fi
  return 0
}

prompt_category() {
  local current="$(trim "$1")"
  while true; do
    if [ -z "$current" ]; then
      read -r -p "カテゴリ名（例: sky / texture / 新規カテゴリ）を入力してください: " current || exit 1
      current="$(trim "$current")"
    fi
    if validate_category "$current"; then
      echo "$current"
      return
    fi
    current=""
  done
}

prompt_scene() {
  local current="$(trim "$1")"
  while true; do
    if [ -z "$current" ]; then
      read -r -p "シーンの基本名（PascalCase 推奨、例: NebulaBloom）を入力してください: " current || exit 1
      current="$(trim "$current")"
    fi
    if validate_scene "$current"; then
      echo "$current"
      return
    fi
    current=""
  done
}

prompt_display_name() {
  local current="$(trim "$1")"
  if [ -n "$current" ]; then
    echo "$current"
    return
  fi
  read -r -p "表示名（空欄の場合は自動生成されます）を入力してください: " current || exit 1
  echo "$(trim "$current")"
}

echo "========================================"
echo "VJ シーン生成ツール (ctrl + c で中止できます)"

if [ -d "$SCENES_ROOT" ]; then
  existing_categories=$(find "$SCENES_ROOT" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | sort | tr '\n' ' ' | sed -e 's/  */ /g' -e 's/ $//')
  if [ -n "$existing_categories" ]; then
    echo "既存カテゴリ: ${existing_categories}"
  fi
fi

CATEGORY_RAW=$(prompt_category "${CATEGORY_RAW}")
SCENE_RAW=$(prompt_scene "${SCENE_RAW}")
DISPLAY_NAME_RAW=$(prompt_display_name "${DISPLAY_NAME_RAW}")

CATEGORY_PASCAL=$(to_pascal "$CATEGORY_RAW")
SCENE_PASCAL=$(to_pascal "$SCENE_RAW")

if [ -z "$CATEGORY_PASCAL" ]; then
  echo "カテゴリ名からクラス名を生成できませんでした。" >&2
  exit 1
fi

if [ -z "$SCENE_PASCAL" ]; then
  echo "シーン名からクラス名を生成できませんでした。" >&2
  exit 1
fi

CLASS_NAME="${CATEGORY_PASCAL}${SCENE_PASCAL}Scene"
CATEGORY_DIR="${SCENES_ROOT}/${CATEGORY_RAW}"
mkdir -p "$CATEGORY_DIR"

SCENE_FILE="${CATEGORY_DIR}/${CLASS_NAME}.ts"
if [ -f "$SCENE_FILE" ]; then
  echo "エラー: 既にファイルが存在します → ${SCENE_FILE}" >&2
  exit 1
fi

if [ -z "$DISPLAY_NAME_RAW" ]; then
  CATEGORY_TITLE=$(to_title_words "$CATEGORY_RAW")
  SCENE_TITLE=$(to_title_words "$SCENE_RAW")
  DISPLAY_NAME="${CATEGORY_TITLE} · ${SCENE_TITLE}"
else
  DISPLAY_NAME="$DISPLAY_NAME_RAW"
fi

SCENE_RELATIVE="${SCENE_FILE#${ROOT_DIR}/}"

RELATIVE_DIR="${CATEGORY_DIR#${ROOT_DIR}/src/}"
IFS='/' read -r -a PATH_SEGMENTS <<< "$RELATIVE_DIR"
RELATIVE_PREFIX=""
for segment in "${PATH_SEGMENTS[@]}"; do
  if [ -n "$segment" ]; then
    RELATIVE_PREFIX+="../"
  fi
done

CORE_IMPORT="${RELATIVE_PREFIX}core/IScene"
UTILS_IMPORT="${RELATIVE_PREFIX}utils/toggleUtils"

echo "----------------------------------------"
echo "カテゴリ: ${CATEGORY_RAW}"
echo "クラス名: ${CLASS_NAME}"
echo "表示名: ${DISPLAY_NAME}"
echo "出力先: ${SCENE_RELATIVE}"
echo "----------------------------------------"

read -r -p "この内容でファイルを生成しますか？ (y/N): " confirmation || exit 1
confirmation=$(echo "$confirmation" | tr '[:upper:]' '[:lower:]')
if [ "$confirmation" != "y" ] && [ "$confirmation" != "yes" ]; then
  echo "キャンセルしました。"
  exit 0
fi

escaped_class=$(escape_sed "$CLASS_NAME")
escaped_display=$(escape_sed "$DISPLAY_NAME")
escaped_core=$(escape_sed "$CORE_IMPORT")
escaped_utils=$(escape_sed "$UTILS_IMPORT")

sed \
  -e "s/__CLASS_NAME__/${escaped_class}/g" \
  -e "s/__DISPLAY_NAME__/${escaped_display}/g" \
  -e "s#__CORE_IMPORT__#${escaped_core}#g" \
  -e "s#__UTILS_IMPORT__#${escaped_utils}#g" \
  "${TEMPLATE_FILE}" > "${SCENE_FILE}"

echo "生成完了: ${SCENE_RELATIVE}"
echo "必要に応じて SceneLibrary.ts への登録を忘れずに行ってください。"

if command -v code >/dev/null 2>&1; then
  echo "VS Code でファイルを開きます..."
  code "${SCENE_FILE}"
else
  echo "補足: 'code' コマンドが見つからなかったため自動で開けませんでした。"
fi