# Вечан спомен · Eternal Memory

A design demonstration of a **digital parish memorial** for
[St. Archangel Gabriel Serbian Orthodox Parish](https://arhangelgavrilotoronto.com/)
in Richmond Hill, Ontario – built around **Saylavy Memory Pages**.

The idea: a parish already keeps its departed. It reads their names aloud on Zadušnice, serves a
Parastos on the fortieth day, and lights candles for them. This gives that practice a permanent
digital place – one where the story, the recorded voice and the photographs survive the family
albums, and where somebody in Belgrade or Vancouver can light a candle at 3am and have it reach
the diptych the priest reads from.

> **This is not the official parish website and is not endorsed by the parish.** Every person on
> the memorial wall is fictional. See [Demonstration data](#demonstration-data).

## Run it

No build step. Plain HTML, CSS and JavaScript.

```bash
npx http-server -p 4321 -c-1     # then open http://localhost:4321
```

Use a **no-cache** server while working on it. `npx serve` sends an ETag and no `Cache-Control`, so
browsers fall back to heuristic caching and will happily run a `script.js` from ten minutes ago
while you wonder why your change did nothing. `styles.css` and `script.js` are also loaded with a
`?v=` query in `index.html`; bump it when you change either.

Serve it rather than opening `index.html` from disk – the memorial wall fetches
`data/memorials.json`, which `file://` blocks. The page tells you so if that happens.

## What is in it

**The opening.** The emblem, then the name letter by letter, then the subtitle, then the six icons
of what is inside. A gold arch draws itself around all of it, and then the arch opens: it swallows
the screen while the wordmark rushes past you and the hero settles back from an oversize scale
behind it. You arrive through the door rather than at a splash screen, which is the point of using
the site's own motif for it.

About three seconds, skippable by clicking anywhere or pressing a key. `?intro=0` skips it,
`?intro=1` forces it back under reduced motion, and `?intro=hold` leaves it on screen to be looked
at. It is hidden by default in CSS and only shown once the script turns it on, so a JavaScript
failure cannot strand anyone behind a black screen.

**The memorial wall.** Each departed person is an arch – a portrait niche borrowed from the
iconostasis – filterable by Zadušnice list, founders, or recently added, and searchable by name or
year. Press `/` to jump to the search.

**Saylavy Memory Pages.** Opening an arch slides in the full page: the written life, the recorded
voice with a transcript, the photograph count, and a sealed time capsule where the family set one.
One-time purchase, no subscription – the Saylavy model, which is the whole reason it suits a
memorial rather than a social feed.

**Speak with them.** A memorial that holds a voice ought to answer when it is spoken to. Open any
arch and you can ask that person a question. They answer in the first person, out of their own
record: the life their family wrote, the recording they left, the lines they were known for. Four
suggested questions to start, free text after that, and every answer can be read aloud by the same
speech engine the prayers use.

There is **deliberately no language model behind it**. Not because one would not write prettier
sentences, but because a model asked about a dead man will always produce something, and a memorial
that quietly invents is worse than one that admits the record is short. So when a question falls
outside what was written down, the answer is *"That is not in what was written down for me, and I
will not invent it"* — followed by what it can talk about. The panel says so before you type a word.

Matching is two-tier: topic nouns beat conversational framing, so *"tell me about the church"* is
about the church rather than about telling. Serbian keywords are stemmed, so радио / радила /
радили / радите all reach the same answer.

**Timeline.** The dated spine of a life, following the structure of Saylavy's own
[Memory Page sample](https://saylavy.com/memory-page-sample) — birth, arrival, the things that
mattered, repose, and the day the family opened the page, which closes the timeline in gold.

Each page closes with a **This page on Saylavy** card, because the memorial is only as durable as
whatever holds it up. The card names the thing doing that: the page's Saylavy reference, its
blockchain anchor, which family holds it, the terms, and a link out to
[saylavy.com](https://saylavy.com/). The same statement sits at the top of the wall – *every page
on this wall is hosted and anchored by Saylavy* – so a visitor learns it where the pages are, not
only in the section that explains them.

**QR codes, which are the bridge back to the building.** A printed card stands by the candle stand:
scan it and the whole memorial opens on your phone. There is one code per person too, for a
forty-day notice or a grave marker, reachable from *QR code* on any Memory Page. Plus one each for
the prayers and the Parastos request.

They are real scannable SVGs, generated by `node tools/qr.mjs --base <your-url>`, at error
correction level H with a wide quiet zone, because these get printed on paper that will live in a
church, be thumbed, and be scanned in poor light. SVG rather than PNG for the same reason: a QR that
has been resampled is a QR that does not scan.

**Every person has an address.** `#milica-p` opens her Memory Page directly, so a family can send a
link to their own grandmother. Back closes the panel instead of leaving the site, closing clears the
address again, and each page has a *Copy link* button. Without this the Memory Page idea does not
really hold — a tribute you cannot send anybody is a private diary.

**The parish's own ask.** Their site leads with Donate, so this carries it too: in the visit
section, the super menu and the footer, pointing at their existing donation page. This is a proposal
to a parish, not only a shopfront for Saylavy.

**The way into Saylavy.** The last tile on the wall is not a person. It is a dashed empty arch, the
space for one, reading *Add someone to this wall*, and it goes to
`https://saylavy.com/auth/sign-in?redirect=/app`. Six routes lead there in total: that arch, the
Memory Page itself (*Open a page like this on Saylavy*, placed directly under the Saylavy card,
which is the moment somebody wants their own), the wall footer, the *Who holds what* call to action,
the super menu, and the site footer.

These open in the **same tab**, because signing in is a task you leave to do rather than a reference
you glance at. Change the two places listed under [Structure](#structure) to make them open in a new
tab instead.

**Who holds what.** The question every family asks second, answered in three cards: the **family**
owns the page and decides what is public, **Saylavy** hosts and anchors it and runs Proof of Life
and the time capsules, and the **parish** holds the remembrance – the arch, the candles, the name on
the Zadušnice list. The parish never holds the data.

**The super menu.** The whole site on one screen, opened from *Explore*. It leads with a three-step
path for a first visit – see who we remember, light a candle, see how a page works – then lays out
every destination in three groups with an icon and a line of explanation, and closes with the live
counts. It is the only menu control at any width; below 900px the inline nav links give way to it
entirely. A visitor should be able to open this and understand the memorial before scrolling
anywhere.

**The candle stand.** Light a candle for a name; it flickers on the stand with the others. In this
demo they persist in your browser only.

**A candle with photographic proof.** The one that matters if you are not in Ontario. A candle on a
screen is an intention; this orders a wax candle on the actual stand in Richmond Hill, lit by a
parishioner at the next Liturgy, photographed where it stands, and the picture sent back to you –
and onto the Memory Page of the person it was lit for, if they have one. Three options (a candle, a
large candle, a vigil lamp kept burning through the forty days), and a four-step track showing what
comes back. The Liturgy date is computed as the coming Sunday rather than written down. Nothing is
charged and nothing is sent – see [Demonstration data](#demonstration-data).

**Voices: prayers read aloud.** Six prayers the parish knows by heart, each in Cyrillic, in Latin
letters, and in English. The Latin column is there for the diaspora children who speak Serbian but
cannot read the alphabet. Оче наш, Трисвето, Царе небески, Богородице Дјево, Са светима покој, and
Вечан спомен, which is the acclamation this whole memorial is named after.

There are **no audio files**. The reading is done by the browser's own speech synthesis, which means
it works offline, costs nothing, and is unmistakably synthetic. The page says so rather than
implying a choir. If no Serbian voice is installed the buttons read the **English** instead and say
that too, because a Serbian text read by an English voice is worse than useless.

**Voices: the icons speak.** An icon is a record, not a picture. Three of the icons in the parish's
own iconostasis, cropped from their photograph, with what to actually look for: the **ΜΡ ΘΥ** beside
the Mother of God and the three stars on her veil; the cruciform halo on Christ carrying **Ο Ω Ν**,
*He Who Is*, written on no one else; and the Archangel Gabriel, who among all the angels is the one
sent to speak. Each can be read aloud as well.

**Days of remembrance.** The four Serbian Zadušnice with their reckoning rules – they follow Pascha
and the calendar, not a fixed date, so the page states the rule rather than inventing a date. Next
to it, a reckoner: enter a day of repose and it returns the third day, ninth day, fortieth day, six
months and one year, counted the Orthodox way, where the day of repose itself is the first day. The
next upcoming memorial is marked.

**Parastos request.** Name, day of repose, occasion, other names to commemorate, whether the parish
kitchen should prepare the koljivo, and whether the family wants a Memory Page opened. Opening a
Memory Page and clicking *Request a Parastos* carries the name and date into the form.

**Children and remembrance.** The part of the memorial that faces forward. Three Sunday school
groups by age, and then the two things a diaspora parish actually has to teach:

- **The Little Chronicler** – a child is given twelve oral-history questions and one older
  parishioner. They ask, they record, they bring it back, and the answers go into that person's
  Memory Page with the child credited as its chronicler. The deck tracks which questions have been
  asked, in the browser, so a child can work down the list over several weeks. Vojislav Kostić on
  the memorial wall did exactly this on his own, which is where the idea comes from.
- **The Azbuka** – all thirty letters of Serbian Cyrillic, one word each, drawn from the vocabulary
  a child actually meets in this church: Икона, Кољиво, Тамјан, Свећа, Бака.

Recordings stay the property of the family who gave them, and the page says so where a parent
would look for it.

**Bilingual.** A working EN / СРП toggle across the whole page, including the memorial entries,
the Little Chronicler questions, the reckoner output and the date formatting. The choice is
remembered.

## Structure

```
index.html            The page, all copy, both languages
styles.css            Design system and every component
script.js             Wall, Memory Pages, candles, prayers, reckoner, forms, lightbox
data/memorials.json   The six demonstration entries
assets/               Parish photographs and emblem, converted to webp
assets/portraits/     Empty. Faces go here (see Portraits)
assets/qr/            Generated, scannable. Regenerate with tools/qr.mjs
tools/generate-portraits.py  Generates six synthetic faces via Gemini
tools/portraits.mjs   Crops, converts and wires portraits into the data
tools/qr.mjs          Generates the QR codes for a given deployment URL
```

The QR codes encode absolute URLs, so they are **deployment specific**. After deploying, run
`node tools/qr.mjs --base https://your-url` and commit the regenerated `assets/qr/`, or the printed
cards will point at the wrong place.

The Saylavy sign-in URL lives in exactly two places, and both need changing together:

- `script.js` — the `SAYLAVY_SIGNIN` constant, used by the empty arch and the Memory Page button
- `index.html` — four literal `href`s, so those links still work if JavaScript does not

## Design

The palette is sampled from the parish's own site – burgundy `#721D2E`, gold `#E7AF23`, cream, and
Playfair Display over Inter – then carried into a candle-lit near-black for the memorial itself, so
that entering the wall feels like stepping from the daylight into the narthex and back out again.

Motifs come from the iconostasis in the parish photographs: the round arch as a portrait frame, the
gold hairline, the beeswax flame, the ☦ between sections.

Icons are one inline sprite of 24 stroked symbols, referenced as
`<svg class="i"><use href="#i-candle"/></svg>`, so every icon inherits its colour and line weight
from context. Sizing them in `em` off a small label lands them around 13px, which reads as clutter
rather than an icon – the small-label cases carry an absolute size instead.

### Art direction

The first pass looked like software. Symmetric card grids, a centred eyebrow over a centred heading
in every section, one border radius everywhere, and em dashes in every other sentence. Those are the
tells. What replaced them:

- **A third typeface.** Every label, date, price, reference and feast line is set in **JetBrains
  Mono**. Small caps in mono reads as art direction; the same words in the body sans read as a
  template. It is the single cheapest way out of the generic look.
- **Roman numerals** hanging beside each section mark, I to X, as in a printed office book. Set with
  `attr(data-n)` in CSS so the language pass cannot disturb them.
- **Drop caps** on the passages that carry a section, via `::first-letter`.
- **Film grain** over the whole page, one inline `feTurbulence` at 3.8% opacity.
- **Asymmetric heads** in the Voices section: title in the left six columns, standfirst dropped into
  the right five, against the centred heads elsewhere. Variety between sections is itself the point.
- **Tighter radii** (3 / 7 / 10px). The arch is now the only strongly curved shape in the design.
- **En dashes, not em dashes.** All 90 replaced.

Style direction came from the `ui-ux-pro-max` **Editorial Grid / Magazine** pattern. Its
`--design-system` query matched this brief to *Brutalism* with an Inter/slate/red palette, which
would have destroyed a palette taken from the parish's own site; that recommendation was not used.
The typography it returned independently matched what was already here, Playfair Display over Inter.

A few deliberate choices worth naming:

- **Portraits are wired but unpopulated.** The arches take real photographs; see
  [Portraits](#portraits). Until a family supplies one, the arch shows a gold monogram and the words
  *portrait pending*, which is also the honest state for a family that has no usable photograph.
  Nothing on the wall is a stock face or a face borrowed from the parish's own congregation
  photographs.
- **Gold is darkened on light backgrounds** (`--gold-dark`) because the parish gold reads at about
  2.6:1 on cream, which fails AA for small text.
- **Contact details are set in the sans face.** Playfair's hairline crossbar on `Đ`/`đ` disappears
  around 17px, and the priest's name has two of them.
- Keyboard accessible throughout, focus is trapped in the open Memory Page, `Escape` closes
  whatever is open, and `prefers-reduced-motion` is respected.
- Playfair's default **oldstyle figures** set digits at uneven heights, which looks like a bug in
  age ranges and counters, so those carry `lining-nums`.

One trap worth knowing if you extend this: the language pass rewrites `innerHTML` on every element
carrying `data-sr`. Put `data-sr` on **text-only** elements. If it wraps a node the script holds a
reference to, that reference is silently replaced and writes go to a detached element.

## Portraits

The wall is built for faces. There are two ways to fill it.

### Generated faces, for the demonstration

The six people are fictional, so their portraits have to be too. These are synthetic faces of people
who do not exist, which is the point: nobody real is shown as deceased.

```bash
pip install google-genai                       # already installed here
# put GEMINI_API_KEY=... in .env (gitignored) or ~/.claude/.env
python tools/generate-portraits.py --dry-run   # read the prompts first, costs nothing
python tools/generate-portraits.py --pro       # generate all six
node tools/portraits.mjs                       # crop, convert, wire in
```

Each prompt is built from that person's own entry: their age at repose, and one detail from the life
written for them, so the choir director looks like a choir director. All six share a single art
direction — one light, one backdrop, one lens — because six separately generated faces otherwise
look like six stock photos. A key is needed because generating images bills it, so the script never
assumes one.

### Real photographs, for a live parish

Drop one photograph per person into `assets/portraits/`, named after that person's `id` in
`data/memorials.json`, and run:

```bash
node tools/portraits.mjs
```

Each file is cropped to the 3:4 the arches use, **anchored 30% from the top** because faces sit high
in a portrait crop, converted to webp, and written into that person's `portrait` field. Nudge one
person's crop with `--top=milica-p:15`. Anyone without a file keeps the monogram, so the wall works
at every stage of being filled in.

Family photographs arrive as a century of mismatched snapshots: a 1950s studio print, a scanned
passport photo, someone's phone. Left alone they make the wall look like a noticeboard. So every
portrait gets **one shared treatment** — pulled toward grey, warmed slightly, darkened at the edges,
and vignetted into the arch — which makes thirty of them read as one wall. The face returns to full
colour when you hover it, and the Memory Page shows it nearly unmuted, because there the portrait is
the subject rather than one of a set.

Use only photographs the family has given you for this purpose. That is not a legal footnote; it is
the whole basis on which a parish can hold this material at all.

## Demonstration data

All six people on the memorial wall are **fictional**. Their names, dates, life stories, voice
transcripts and time capsules were written for this demonstration to show how a Memory Page reads
when it is full. No real parishioner is represented anywhere in this repository.

The Saylavy page references (`SAY-4821-0093`) and blockchain anchors are **invented**, like the
people they belong to. Every outbound link therefore goes to `saylavy.com` itself rather than to a
per-person URL – a link reading "open Milica's page" that resolved to a 404, or worse to a real
stranger's page, would be a lie dressed as a feature. The product it describes is real: Memory
Pages, Proof of Life, Time Capsules, blockchain anchoring and one-time purchase are Saylavy's, and
wiring the per-page links up is a matter of substituting real page URLs for these references.

The candle-with-proof flow **takes no payment and sends no email**. The prices are illustrative, the
confirmation is written on the page and nowhere else, and the "example of what arrives" is one of the
parish's own service photographs standing in for a photo that would be taken for you.

Congregation photographs from the parish site were deliberately **not** used for memorial
portraits – those show living, identifiable people, and placing them in a memorial would imply
something untrue about them. The three photographs used (the iconostasis, candles at a service, and
the church exterior) are the parish's own, taken from `arhangelgavrilotoronto.com` and included
only to illustrate this proposal. The two icon images in the Voices section are crops of that same
iconostasis photograph. The angel emblem is likewise the parish's. All of it will be removed on
request.

The prayer texts are the standard Serbian Orthodox ones and are **not** invented, and the notes on
the icons describe what is genuinely visible in the parish's own photograph. The one date carrying a
hedge is the Archangel's feast: the page tells you to confirm it with the office rather than
asserting how this parish keeps its patronal day.

## Credits

Built with [Saylavy](https://saylavy.com/) Memory Pages in mind – Memory Pages, Proof of Life and
Time Capsules are Saylavy's. Parish details, address, emblem and photographs belong to St. Archangel
Gabriel Serbian Orthodox Parish, Richmond Hill, Ontario.

Со светима покој.
