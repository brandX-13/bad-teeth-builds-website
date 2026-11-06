# Bad Teeth Builds website

Static HTML/CSS for the Bad Teeth Builds website. No framework, package installation,
external scripts, analytics, embeds or payment processing are required.

## Local preview

From PowerShell:

~~~powershell
Set-Location 'C:\Users\beau7\bad-teeth-builds-website'
python -m http.server 8080 --bind 127.0.0.1
~~~

Open http://127.0.0.1:8080/ in a browser. Stop the server with Ctrl+C.
The homepage also opens directly as a local file. No build step is needed.

## Validation

~~~powershell
node scripts/check-site.mjs
git diff --check
~~~

The checker verifies protected-page and original-image hashes, image attributes,
local links, unique anchor targets and the absence of third-party page resources.
Desktop/mobile browser checks are separate from these static checks.

## Original assets

The homepage references the original banner and coil-cover photograph directly,
without cropping, filters, re-encoding or altering their artwork. All five supplied
JPEG files remain unchanged in assets/. The three full-motorcycle photographs
are retained as original assets but are not displayed on the homepage.

| Actual filename in assets/ | Inspected content |
| --- | --- |
| ChatGPT Image Nov 3, 2026, 02_59_40 PM.jpg | Official Bad Teeth Builds OG banner; 1536 × 864 |
| ChatGPT Image Nov 3, 2026, 02_59_25 PM.jpg | Low-angle front three-quarter Trixie photograph; 1536 × 1152 |
| ChatGPT Image Nov 3, 2026, 02_59_08 PM.jpg | Front three-quarter Trixie photograph; 1536 × 1152 |
| ChatGPT Image Nov 3, 2026, 02_59_16 PM.jpg | Opposite-side three-quarter Trixie photograph; 1536 × 1152 |
| ChatGPT Image Nov 3, 2026, 02_59_32 PM.jpg | Fitted BTB custom coil-cover detail; 1536 × 1152 |

The provided filenames are preserved. Natural colors within the photographs are
unchanged. Industrial scratches, red accents and mechanical decoration use CSS
around the original artwork.

## Content boundaries

The four series cards link directly to their owner-supplied YouTube playlists.
The main YouTube buttons and channel links retain:
https://youtube.com/@brandx-design

No episode titles, playlist IDs, sponsors, endorsements, prices or store links
have been invented. The app is described as not publicly released. Merchandise
is marked Coming Soon. Image and font resources load locally; YouTube receives
navigation only when a visitor follows a channel or playlist link.

privacy/index.html, support/index.html, CNAME and GitHub Pages configuration are
unchanged. No mobile-app repository files are used.

Local implementation does not publish changes. Staging, commits, pushes and
deployment require separate owner approval.
