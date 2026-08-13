# Portraits

One photograph per person, named after their `id` in `data/memorials.json`:

    milica-p.jpg
    dragoljub-j.png
    jelena-m.webp

Then, from the project root:

    node tools/portraits.mjs

Each file is cropped to the 3:4 the arches use, anchored high for the face,
converted to webp, and written into that person's `portrait` field. Anyone
without a file keeps the gold monogram.

To move the crop up or down for one person:

    node tools/portraits.mjs --top=milica-p:15

Only use photographs the family has given you for this purpose.
