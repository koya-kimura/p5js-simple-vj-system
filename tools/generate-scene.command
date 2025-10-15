#!/bin/bash

# Usage: ./generate-scene.command <SceneName>

if [ -z "$1" ]; then
  echo "Error: No scene name provided."
  echo "Usage: ./generate-scene.command <SceneName>"
  exit 1
fi

SCENE_NAME="$1"
CLASS_NAME="${SCENE_NAME}Scene"
SCENE_FILE="src/scenes/${CLASS_NAME}.ts"
TEMPLATE_FILE="templates/sceneTemplate.ts"

if [ -f "$SCENE_FILE" ]; then
  echo "Error: Scene file '$SCENE_FILE' already exists."
  exit 1
fi

sed \
  -e "s/__CLASS_NAME__/${CLASS_NAME}/g" \
  -e "s/__DISPLAY_NAME__/${SCENE_NAME}/g" \
  "$TEMPLATE_FILE" > "$SCENE_FILE"

chmod +x "$SCENE_FILE"
echo "Scene '$SCENE_NAME' created at '$SCENE_FILE'."