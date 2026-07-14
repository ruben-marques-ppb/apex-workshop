#!/usr/bin/env bash
# Download USDA FoodData Central — SR Legacy JSON.
# Docs: https://fdc.nal.usda.gov/download-datasets.html
set -euo pipefail

DATA_DIR="$(cd "$(dirname "$0")/.." && pwd)/data"
mkdir -p "$DATA_DIR"

URL="https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_json_2018-04.zip"
ZIP="$DATA_DIR/sr_legacy.zip"
JSON="$DATA_DIR/sr_legacy.json"

if [[ -f "$JSON" ]]; then
  echo "✓ $JSON already exists — nothing to do."
  exit 0
fi

echo "→ Downloading SR Legacy JSON from USDA..."
curl -fL --progress-bar "$URL" -o "$ZIP"

echo "→ Unzipping..."
unzip -o "$ZIP" -d "$DATA_DIR" >/dev/null

FOUND="$(find "$DATA_DIR" -maxdepth 1 -type f -name '*.json' | head -n1)"
if [[ -z "$FOUND" ]]; then
  echo "✗ No JSON file found after unzip. Contents:"
  ls -la "$DATA_DIR"
  exit 1
fi

if [[ "$FOUND" != "$JSON" ]]; then
  mv "$FOUND" "$JSON"
fi

rm -f "$ZIP"

echo "✓ USDA SR Legacy JSON ready at $JSON"
echo "  $(wc -c < "$JSON") bytes"
