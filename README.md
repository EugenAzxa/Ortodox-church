# Вечан спомен · Eternal Memory

A design demonstration of a **digital parish memorial** for
[St. Archangel Gabriel Serbian Orthodox Parish](https://arhangelgavrilotoronto.com/)
in Richmond Hill, Ontario — built around **Saylavy Memory Pages**.

The idea: a parish already keeps its departed. It reads their names aloud on Zadušnice, serves a
Parastos on the fortieth day, and lights candles for them. This gives that practice a permanent
digital place — one where the story, the recorded voice and the photographs survive the family
albums, and where somebody in Belgrade or Vancouver can light a candle at 3am and have it reach
the diptych the priest reads from.

> **This is not the official parish website and is not endorsed by the parish.** Every person on
> the memorial wall is fictional. See [Demonstration data](#demonstration-data).

## Run it

No build step. Plain HTML, CSS and JavaScript.

```bash
npx serve -l 4321        # then open http://localhost:4321
# or
python3 -m http.server 4321
```

Serve it rather than opening `index.html` from disk — the memorial wall fetches
`data/memorials.json`, which `file://` blocks. The page tells you so if that happens.

## What is in it

**The memorial wall.** Each departed person is an arch — a portrait niche borrowed from the
iconostasis — filterable by Zadušnice list, founders, or recently added, and searchable by name or
year. Press `/` to jump to the search.

**Saylavy Memory Pages.** Opening an arch slides in the full page: the written life, the recorded
voice with a transcript, the photograph count, and a sealed time capsule where the family set one.
One-time purchase, no subscription — the Saylavy model, which is the whole reason it suits a
memorial rather than a social feed.

Each page closes with a **This page on Saylavy** card, because the memorial is only as durable as
whatever holds it up. The card names the thing doing that: the page's Saylavy reference, its
blockchain anchor, which family holds it, the terms, and a link out to
[saylavy.com](https://saylavy.com/). The same statement sits at the top of the wall — *every page
on this wall is hosted and anchored by Saylavy* — so a visitor learns it where the pages are, not
only in the section that explains them.

**Who holds what.** The question every family asks second, answered in three cards: the **family**
owns the page and decides what is public, **Saylavy** hosts and anchors it and runs Proof of Life
and the time capsules, and the **parish** holds the remembrance — the arch, the candles, the name on
the Zadušnice list. The parish never holds the data.

**The super menu.** The whole site on one screen, opened from *Explore*. It leads with a three-step
path for a first visit — see who we remember, light a candle, see how a page works — then lays out
every destination in three groups with an icon and a line of explanation, and closes with the live
counts. It is the only menu control at any width; below 900px the inline nav links give way to it
entirely. A visitor should be able to open this and understand the memorial before scrolling
anywhere.

**The candle stand.** Light a candle for a name; it flickers on the stand with the others. In this
demo they persist in your browser only.

**A candle with photographic proof.** The one that matters if you are not in Ontario. A candle on a
screen is an intention; this orders a wax candle on the actual stand in Richmond Hill, lit by a
parishioner at the next Liturgy, photographed where it stands, and the picture sent back to you —
and onto the Memory Page of the person it was lit for, if they have one. Three options (a candle, a
large candle, a vigil lamp kept burning through the forty days), and a four-step track showing what
comes back. The Liturgy date is computed as the coming Sunday rather than written down. Nothing is
charged and nothing is sent — see [Demonstration data](#demonstration-data).

**Days of remembrance.** The four Serbian Zadušnice with their reckoning rules — they follow Pascha
and the calendar, not a fixed date, so the page states the rule rather than inventing a date. Next
to it, a reckoner: enter a day of repose and it returns the third day, ninth day, fortieth day, six
months and one year, counted the Orthodox way, where the day of repose itself is the first day. The
next upcoming memorial is marked.

**Parastos request.** Name, day of repose, occasion, other names to commemorate, whether the parish
kitchen should prepare the koljivo, and whether the family wants a Memory Page opened. Opening a
Memory Page and clicking *Request a Parastos* carries the name and date into the form.

**Children and remembrance.** The part of the memorial that faces forward. Three Sunday school
groups by age, and then the two things a diaspora parish actually has to teach:

- **The Little Chronicler** — a child is given twelve oral-history questions and one older
  parishioner. They ask, they record, they bring it back, and the answers go into that person's
  Memory Page with the child credited as its chronicler. The deck tracks which questions have been
  asked, in the browser, so a child can work down the list over several weeks. Vojislav Kostić on
  the memorial wall did exactly this on his own, which is where the idea comes from.
- **The Azbuka** — all thirty letters of Serbian Cyrillic, one word each, drawn from the vocabulary
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
script.js             Wall, Memory Pages, candles, reckoner, forms, lightbox
data/memorials.json   The six demonstration entries
assets/               Parish photographs and emblem, converted to webp
```

## Design

The palette is sampled from the parish's own site — burgundy `#721D2E`, gold `#E7AF23`, cream, and
Playfair Display over Inter — then carried into a candle-lit near-black for the memorial itself, so
that entering the wall feels like stepping from the daylight into the narthex and back out again.

Motifs come from the iconostasis in the parish photographs: the round arch as a portrait frame, the
gold hairline, the beeswax flame, the ☦ between sections.

Icons are one inline sprite of 24 stroked symbols, referenced as
`<svg class="i"><use href="#i-candle"/></svg>`, so every icon inherits its colour and line weight
from context. Sizing them in `em` off a small label lands them around 13px, which reads as clutter
rather than an icon — the small-label cases carry an absolute size instead.

A few deliberate choices worth naming:

- **No stock faces.** Memory Pages for fictional people show a gold monogram in the arch and the
  words *portrait pending*. A placeholder is more honest than inventing a face for a person who
  does not exist.
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

## Demonstration data

All six people on the memorial wall are **fictional**. Their names, dates, life stories, voice
transcripts and time capsules were written for this demonstration to show how a Memory Page reads
when it is full. No real parishioner is represented anywhere in this repository.

The Saylavy page references (`SAY-4821-0093`) and blockchain anchors are **invented**, like the
people they belong to. Every outbound link therefore goes to `saylavy.com` itself rather than to a
per-person URL — a link reading "open Milica's page" that resolved to a 404, or worse to a real
stranger's page, would be a lie dressed as a feature. The product it describes is real: Memory
Pages, Proof of Life, Time Capsules, blockchain anchoring and one-time purchase are Saylavy's, and
wiring the per-page links up is a matter of substituting real page URLs for these references.

The candle-with-proof flow **takes no payment and sends no email**. The prices are illustrative, the
confirmation is written on the page and nowhere else, and the "example of what arrives" is one of the
parish's own service photographs standing in for a photo that would be taken for you.

Congregation photographs from the parish site were deliberately **not** used for memorial
portraits — those show living, identifiable people, and placing them in a memorial would imply
something untrue about them. The three photographs used (the iconostasis, candles at a service, and
the church exterior) are the parish's own, taken from `arhangelgavrilotoronto.com` and included
only to illustrate this proposal. The angel emblem is likewise the parish's. Both will be removed
on request.

## Credits

Built with [Saylavy](https://saylavy.com/) Memory Pages in mind — Memory Pages, Proof of Life and
Time Capsules are Saylavy's. Parish details, address, emblem and photographs belong to St. Archangel
Gabriel Serbian Orthodox Parish, Richmond Hill, Ontario.

Со светима покој.
