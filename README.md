# Earth Explorer

A 3D model of the Earth that students can open up to learn about the layers inside our planet. It's made for 7th-grade science on school iPads, as a companion to Mars Explorer.

- **Three ways to open the Earth** (buttons at the top):
  - **Cutaway** has a wedge cut out, like a textbook picture. This is the starting view.
  - **Slice** cuts the Earth in half so you can see all the rings.
  - **Peel** peels the layers off one at a time, like an onion.
- **Layer cards.** Tap any layer, or its name, to open a card. Each card has a picture, four gauges (Heat, Squeeze, Density, Solid or liquid), short facts, a *Compare it* box, and a *How do we know?* box. There are four main layers (crust, mantle, outer core, inner core) and two **advanced layers** (lithosphere and asthenosphere). Turn the advanced layers on under **Show**.
- **Easy view / True scale** switch in the menu bar. Easy view draws the crust much thicker so students can see it and tap it. True scale shows the real sizes, where the crust is a thin line.
- **Trips:**
  - **Journey to the center:** drag an elevator down to the center. A box shows the depth, heat, squeeze, and drive time as you go.
  - **Dig straight through:** tap anywhere on the globe (dots mark big cities, like Chicago) and dig a tunnel through the Earth. There are 33 stops, like "As deep as the Willis Tower is tall" and "The deepest hole ever dug," and at the end students see where they pop out.
- **Watch it move:**
  - mantle convection (slow loops of hot rock rising and cooler rock sinking)
  - hot spot volcanoes (Hawaii)
  - where magma comes from
  - Earth's magnetic shield (swirling iron, field lines, solar wind, auroras)
- **Earthquake Detective:** an earthquake sends P waves and S waves through the Earth. Seismographs around the edge light up when the waves arrive, and the **shadow zones** appear on the far side. That's how scientists found the liquid outer core.
- **Ancient Earth time machine** (blue button under the title): 7 stops from 4.6 billion years ago to today. Students watch the Earth form, iron sink to make the core, the Moon-making crash, the first crust and oceans, the magnetic shield, and the inner core freezing. Each stop has four gauges (Heat, Layers, Water, Shield) for a data table.
- **Live Quake Tracker** box (bottom right): real earthquakes from the last day, from the U.S. Geological Survey. Tap **More** to see the biggest ones. Tap any earthquake in the list to fly to it on the globe.
- **4 guided tours**, **Search**, and a **How to explore** help box that opens the first time.
- **No ads, no logins, no tracking.** It's all plain files you own.

---

## Put it on GitHub Pages (about 10 minutes, no coding)

This folder is small: about 30 files and less than 3 MB. Everything the site needs is inside it, including the 3D engine.

1. Sign in at **github.com**.
2. Click **+** (top right) → **New repository**. Name it `EarthExplorer`. Choose **Public**, then click **Create repository**.
3. On the next page, click the link that says **uploading an existing file**.
4. Unzip `EarthExplorer.zip` on your computer and open the `EarthExplorer` folder. Select **everything inside it** (`index.html`, `README.md`, `.nojekyll`, and the `assets`, `css`, `js`, and `lib` folders) and drag it all onto the GitHub page. Chrome works best for dragging folders.
   - Don't drag the `EarthExplorer` folder itself, only what's inside it. `index.html` must end up at the top level of the repository.
   - On a Mac, `.nojekyll` is hidden. Press **Command + Shift + .** (period) in Finder to show hidden files. If it doesn't upload, the site still works without it.
5. Wait until every file shows in the list, then click the green **Commit changes** button.
6. Go to **Settings** (tab at the top of the repository) → **Pages** (left menu). Under *Branch*, pick **main** and **/ (root)**, then click **Save**.
7. Wait 1–2 minutes and refresh the Pages screen. A box will show your link: `https://jdl2025.github.io/EarthExplorer/`

**Check it worked:** open the link. You should see the Earth with a wedge cut out. If you only see the README text, `index.html` probably landed inside a subfolder. Upload the files again from *inside* the `EarthExplorer` folder.

**On the iPads:** open the link in Safari, tap the **Share** button → **Add to Home Screen**. The site then opens full screen like an app. It needs **iPadOS 15 or newer**. (To check, go to Settings → General → About.)

**Good to know:** the site has to be opened from its web link. Double-clicking `index.html` on your computer won't work, because browsers block 3D programs that are opened as plain files.

**Changes later:** this repository is separate from Mars Explorer, so nothing here can affect that site. For future changes, I'll put new features in a `test` folder first (like Mars's time-machine test), so you can check them on an iPad before they replace the main site.

---

## Customizing

| What you want to change | Where |
|---|---|
| Layer card text, facts, gauges, comparisons, video searches | `js/data/layers.js` |
| Cards for the animations, Earthquake Detective, and trips | `js/data/topics.js` |
| The stops on *Dig straight through* and *Journey to the center*, and the heat and squeeze numbers | `js/data/stops.js` |
| Place names used to say where you start and pop out, and the hometown (Chicago) | `js/data/places.js` |
| Guided tours | `js/data/tours.js` |
| Ancient Earth time machine stops | `js/data/youngearth.js` |
| Colors and fonts | `css/app.css` (the list at the top) |

You can edit files right on GitHub: open the file → pencil icon → make your change → **Commit changes**. The site updates in about a minute. Keep the quote marks and commas the way they are.

**To turn off the Ancient Earth time machine:** in `index.html`, delete the line that loads `js/data/youngearth.js` (it has a comment above it). Nothing else changes.

---

## Things to know

- **Easy view is not to scale.** In Easy view, the crust is drawn about 15 times thicker than it really is, and the lithosphere and asthenosphere are thicker too. The cores are drawn at their real sizes. The About screen (under **Show**) explains this, and the True scale button shows the real sizes.
- **The inside of the Earth can't be photographed.** It's drawn as a model using scientists' numbers: the PREM model of Earth's interior, USGS, and IRIS. Temperatures are best estimates, rounded, in °F. The earthquake wave paths are calculated from a simplified version of real wave speeds, so the shadow zones land in about the right places.
- **The Live Quake Tracker needs the internet.** It loads live data from earthquake.usgs.gov. If the school network blocks that site, the box says "No connection" and everything else still works.
- **How the site describes the mantle:** the mantle cards call it liquid rock, sometimes thick like honey, to match how it's taught in class. Earthquake Detective and the asthenosphere card describe it as soft and gooey, so the S-wave evidence for the liquid outer core still makes sense. All of this text is in `js/data/layers.js`, `js/data/topics.js`, and `js/data/stops.js` if you ever want to change it.
- **Animations are sped up.** Convection shows about 10 million years per second, and the earthquake shows about 85 seconds of real time per second. The cards say so.
- **Older iPads:** if animations run slowly, the site automatically draws fewer pixels to keep things smooth.

---

## Credits

- Picture of Earth: NASA Blue Marble, NASA Earth Observatory (public domain).
- Earthquake data: U.S. Geological Survey.
- 3D engine: Three.js r170 (MIT license, in `lib/`).
- Fonts: Atkinson Hyperlegible (Braille Institute) and Big Shoulders Display, both under the SIL Open Font License.
- Science numbers: USGS, IRIS, NASA, the PREM Earth model, and the sources named on each card.

Earth Explorer is an independent classroom project. It was not made by or endorsed by NASA, USGS, or any other agency.
