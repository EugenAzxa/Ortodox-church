#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate synthetic portraits for the memorial wall.

The six people on the wall are fictional, so their portraits have to be too.
These are generated faces of people who do not exist. Nobody real is depicted
as deceased, which is the whole reason for doing it this way rather than using
the parish's own congregation photographs or a stock library.

Requires:
    pip install google-genai
    GEMINI_API_KEY in the environment, or in ~/.claude/.env

Usage:
    python tools/generate-portraits.py                 # all six
    python tools/generate-portraits.py --only milica-p # just one
    python tools/generate-portraits.py --pro           # better, slower model

Then wire them in:
    node tools/portraits.mjs
"""

import argparse
import json
import os
import sys
from pathlib import Path

# This project sits under a path containing Cyrillic, and the Windows console
# defaults to cp1252, so printing the project path raises UnicodeEncodeError.
for stream in (sys.stdout, sys.stderr):
    try:
        stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "memorials.json"
OUT = ROOT / "assets" / "portraits"

FLASH = "gemini-2.5-flash-image"
PRO = "gemini-3-pro-image-preview"


def load_env():
    """Same .env order the design skill uses."""
    for path in (ROOT / ".env",
                 Path.home() / ".claude" / "skills" / ".env",
                 Path.home() / ".claude" / ".env"):
        if path.exists():
            for line in path.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


# One shared art direction, so six separately generated faces read as one wall
# rather than six stock photos.
DIRECTION = (
    "Documentary memorial portrait photograph. Head and shoulders, centred, "
    "filling the frame. Soft directional window light from camera left with "
    "gentle falloff. Plain warm grey backdrop, a little darker at the edges. "
    "85mm lens look. Natural skin with age plainly visible: lines, pores, "
    "thinning hair, no retouching and no smoothing. Calm composed expression, "
    "mouth closed, dignified, not smiling for a camera. Muted colour with a "
    "warm cast. Fine film grain. Plain modest clothing with no logos or "
    "legible markings. No text, no watermark, no border, no frame, no props. "
    "This is a synthetic portrait of a person who does not exist; it must not "
    "resemble any real, living or public person."
)

# Per person: sex, and the detail that makes the face belong to this life.
FLAVOUR = {
    "milica-p": ("woman", "who ran a church kitchen for thirty years; a headscarf "
                          "resting back on her shoulders, practical worn hands"),
    "dragoljub-j": ("man", "a retired bricklayer; broad hands, weathered face, "
                           "plain collared shirt buttoned to the top"),
    "jelena-m": ("woman", "a church choir director; short grey hair, spectacles on "
                          "a chain, an attentive listening expression"),
    "stanoje-r": ("man", "a church reader and bell-ringer; neat side parting, dark "
                         "cardigan over a shirt, quiet bearing"),
    "radmila-v": ("woman", "a Sunday school teacher; soft grey curls, a warm patient "
                           "half-smile, plain cardigan"),
    "vojislav-k": ("man", "a parish treasurer born in Canada to Serbian parents; "
                          "closely trimmed grey beard, spectacles, plain jacket"),
}


def age_at_repose(entry):
    born = int(entry["born"][:4])
    died = int(entry["died"][:4])
    return died - born


def build_prompt(entry):
    sex, detail = FLAVOUR.get(entry["id"], ("person", "a parishioner"))
    age = age_at_repose(entry)
    return (
        f"A portrait of a fictional Serbian {sex}, approximately {age} years old, "
        f"{detail}. {DIRECTION}"
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="generate a single entry by id")
    ap.add_argument("--pro", action="store_true", help="use the higher quality model")
    ap.add_argument("--dry-run", action="store_true",
                    help="print the prompts and exit, without calling the API")
    args = ap.parse_args()

    data_preview = json.loads(DATA.read_text(encoding="utf-8"))
    if args.dry_run:
        for entry in data_preview["entries"]:
            if args.only and entry["id"] != args.only:
                continue
            print(f"--- {entry['id']}  ({entry['name']}, {age_at_repose(entry)}) ---")
            print(build_prompt(entry))
            print()
        return 0

    load_env()
    key = os.environ.get("GEMINI_API_KEY")

    if not key:
        print("No GEMINI_API_KEY found.\n")
        print("Add it to one of these, then run this again:")
        print(f"  {Path.home() / '.claude' / '.env'}")
        print(f"  {ROOT / '.env'}   (this one is gitignored)\n")
        print("  GEMINI_API_KEY=your-key-here\n")
        print("A key is at https://aistudio.google.com/apikey . Generating six")
        print("images bills that key, which is why this script does not assume one.")
        return 1

    try:
        from google import genai
        from google.genai import types
    except ImportError:
        print("The google-genai package is missing. Install it with:\n")
        print("  pip install google-genai\n")
        return 1

    data = json.loads(DATA.read_text(encoding="utf-8"))
    entries = data["entries"]
    if args.only:
        entries = [e for e in entries if e["id"] == args.only]
        if not entries:
            print(f"No entry with id {args.only!r}.")
            return 1

    OUT.mkdir(parents=True, exist_ok=True)
    client = genai.Client(api_key=key)
    model = PRO if args.pro else FLASH
    print(f"Model: {model}\n")

    made = 0
    for entry in entries:
        prompt = build_prompt(entry)
        target = OUT / f"{entry['id']}.png"
        print(f"  {entry['name']} ({age_at_repose(entry)}) -> {target.name}")
        try:
            result = client.models.generate_content(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE"],
                    image_config=types.ImageConfig(aspect_ratio="3:4"),
                ),
            )
            saved = False
            for part in result.candidates[0].content.parts:
                blob = getattr(part, "inline_data", None)
                if blob and blob.data:
                    target.write_bytes(blob.data)
                    saved = True
                    made += 1
                    break
            if not saved:
                print("      no image came back for this one")
        except Exception as exc:                      # noqa: BLE001 - report and continue
            print(f"      failed: {exc}")

    print(f"\n{made} portrait(s) written to assets/portraits/.")
    if made:
        print("Now crop, convert and wire them in:\n\n  node tools/portraits.mjs\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
