# Portraits

Faces for the memorial wall go here, one per person, named after that person's
`id` in `data/memorials.json`:

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

## Where the faces come from

For the demonstration, generate synthetic ones. The people are fictional, so
their faces must be too:

    python tools/generate-portraits.py --dry-run    # review the prompts
    python tools/generate-portraits.py --pro        # generate

For a live parish, use only photographs the family has given you for this
purpose. Do not use the congregation photographs from the parish website: those
are living, identifiable people, and an invented death date attached to a real
face is a lie about that person.
