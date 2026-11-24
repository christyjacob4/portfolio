#!/bin/sh
# Generates -720 and -1280 JPEG variants of every blog cover (macOS sips).
# Usage: sh scripts/make-thumbs.sh
for f in public/blog/*/cover.jpg public/blog/*/header.png; do
  [ -f "$f" ] || continue
  base="${f%.*}"
  for w in 720 1280; do
    sips -Z $w -s format jpeg -s formatOptions 68 "$f" --out "$base-$w.jpg" >/dev/null
  done
done
