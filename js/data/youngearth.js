/* =====================================================================
   EARTH EXPLORER — ANCIENT EARTH TIME MACHINE
   ---------------------------------------------------------------------
   The story students step through, oldest first. Each stop has:
     date, dateShort (timeline label), short (timeline caption), title, lead
     gauges: heat / layers / water / shield -> [0–4, "word"]
     points: [ [icon, "Mini heading", "One or two sentences"], ... ]
     clue:   "How do we know?" box
     debate: optional "Scientists are still debating" note
     globe:  what the 3D Earth looks like (you don't need to change these)
   ===================================================================== */
window.YOUNG_EARTH = {
  intro: {
    title: "Ancient Earth",
    lead: "Earth did not always have layers. Let’s travel back in time and watch how Earth got its crust, mantle, and core!",
    points: [
      ["question", "How big is a billion?", "A billion is a thousand millions. Earth is about 4.5 billion years old. If Earth’s whole life were one 24-hour day, dinosaurs would show up about an hour before midnight. Humans would show up in the last few seconds!"],
      ["clock", "How to use the time machine", "Tap Next at the bottom of each card, or tap a date on the timeline. Watch the Earth change as you travel through time."],
      ["layers", "Watch the inside", "Part of the Earth is cut away, so you can see the inside change too."]
    ],
    start: "Start at the beginning"
  },

  stops: [
    {
      id: "rocks", date: "About 4.6 billion years ago", dateShort: "4.6 B", short: "Rocks clump", title: "Rocks Clump and Heat Up",
      lead: "Earth formed from dust and rocks circling the young Sun. Rocks crashed and clumped together, and Earth grew bigger and hotter.",
      gauges: { heat: [3, "Very hot"], layers: [0, "All mixed up"], water: [1, "Trapped in rocks"], shield: [0, "Off"] },
      points: [
        ["star", "Space rocks everywhere", "Rocks of every size slammed into the growing Earth. Every crash made heat."],
        ["layers", "All mixed up", "At first, metal and rock were jumbled together. Earth had no layers yet."],
        ["clock", "How old is Earth?", "Earth is about 4.5 billion years old. That is 4,500 million years!"]
      ],
      clue: "Scientists measure tiny “atom clocks” inside very old rocks and meteorites. They show that Earth and the other planets formed about 4.5 billion years ago.",
      globe: { size: 0.82, today: 0, dark: 0.55, ocean: 0, sort: 0, magma: 0.35, inner: 0, meteors: true }
    },
    {
      id: "iron", date: "About 4.5 billion years ago", dateShort: "4.5 B", short: "Iron sinks", title: "Heavy Iron Sinks",
      lead: "Baby Earth got so hot that much of it melted. Heavy iron sank to the middle and made the core. Lighter rock floated up.",
      gauges: { heat: [4, "Melted"], layers: [2, "Sorting"], water: [1, "Steam"], shield: [0, "Off"] },
      points: [
        ["iron", "Heavy goes down", "Iron is heavier than rock. In melted Earth, drops of iron sank toward the center, like stones sinking in a pond."],
        ["layers", "Layers form", "This sorting gave Earth its layers: a heavy metal core in the middle, with lighter rock around it."],
        ["flame", "Why so hot?", "Heat came from crashing space rocks, from radioactive atoms, and even from the sinking iron itself."]
      ],
      clue: "Scientists compare Earth’s rocks with meteorites. Rocks near Earth’s surface have much less iron than most meteorites. The missing iron must have sunk into the core.",
      globe: { size: 1, today: 0, dark: 0, ocean: 0, sort: [0, 1], magma: 1, inner: 0 }
    },
    {
      id: "moon", date: "About 4.5 billion years ago", dateShort: "4.5 B", short: "The Moon forms", title: "A Giant Crash Makes the Moon",
      lead: "A planet about the size of Mars crashed into young Earth. The crash blasted rock into space. That rock came together to make our Moon.",
      gauges: { heat: [4, "Melted again"], layers: [3, "Core + mantle"], water: [1, "Steam"], shield: [0, "Off"] },
      points: [
        ["star", "A giant crash", "Scientists call the planet that hit Earth Theia. The crash melted much of Earth all over again."],
        ["moon", "Hello, Moon!", "Bits of rock from the crash circled Earth like a ring. Over time, they clumped together to make the Moon."],
        ["wave", "A sea of melted rock", "After the crash, Earth was covered by an ocean of glowing melted rock, called a magma ocean."]
      ],
      clue: "Moon rocks brought back by Apollo astronauts are almost the same as rocks from Earth’s mantle. This clue suggests the Moon was made from Earth material.",
      debate: "Scientists are still working out the details of the giant crash, like how big Theia was and how fast it hit.",
      globe: { size: 1, today: 0, dark: 0, ocean: 0, sort: 1, magma: 1, inner: 0, theia: true }
    },
    {
      id: "crust", date: "About 4.4 billion years ago", dateShort: "4.4 B", short: "First crust", title: "The First Crust and Oceans",
      lead: "Earth slowly cooled. The outside hardened into the first crust. Steam in the air cooled and fell as rain, filling the first oceans.",
      gauges: { heat: [2, "Cooling"], layers: [3, "Crust, mantle, core"], water: [3, "First oceans"], shield: [1, "Maybe"] },
      points: [
        ["rock", "A rocky skin", "As the magma ocean cooled, its top hardened into dark rock. It is a bit like the skin that forms on cooling hot chocolate."],
        ["drop", "The first rain", "Steam from volcanoes cooled into clouds. It rained and rained, and water filled the low places."],
        ["clock", "The oldest crystals", "Tiny crystals called zircons, found in Australia, are about 4.4 billion years old. They are the oldest bits of Earth ever found."]
      ],
      clue: "Some of those 4.4-billion-year-old zircon crystals hold chemical clues that liquid water was around when they formed.",
      debate: "Scientists still debate exactly when the first oceans formed, but many think it was very early.",
      globe: { size: 1, today: 0, dark: 1, ocean: 0.7, sort: 1, magma: 0, inner: 0, moon: true }
    },
    {
      id: "shield", date: "About 3.7 billion years ago", dateShort: "3.7 B", short: "A magnetic shield", title: "Earth Gets a Shield",
      lead: "Swirling liquid iron in the core made a magnetic field. It became an invisible shield that helped protect Earth’s air and water.",
      gauges: { heat: [1, "Warm"], layers: [3, "Crust, mantle, liquid core"], water: [4, "Oceans"], shield: [3, "On"] },
      points: [
        ["magnet", "An invisible shield", "Moving liquid iron in the outer core made Earth’s magnetic field."],
        ["shield", "Protecting the air", "The field pushed away the solar wind from the Sun. This helped Earth keep its air and water."],
        ["drop", "Life begins", "By about 3.5 billion years ago, tiny living things lived in Earth’s oceans."]
      ],
      clue: "Rocks in Greenland that are about 3.7 billion years old have tiny magnetic grains. The grains recorded Earth’s magnetic field. They are the oldest clear evidence of the shield.",
      debate: "Some scientists think the shield may be even older, but they are still debating the evidence.",
      globe: { size: 1, today: 0, dark: 1, ocean: 1, sort: 1, magma: 0, inner: 0, moon: true, field: true }
    },
    {
      id: "inner", date: "About 1 billion years ago", dateShort: "1.0 B", short: "Inner core forms", title: "The Inner Core Freezes",
      lead: "Deep in the center, Earth slowly cooled. Liquid iron began to freeze into a solid ball: the inner core.",
      gauges: { heat: [1, "Mild"], layers: [4, "Four main layers"], water: [4, "Oceans"], shield: [4, "Strong"] },
      points: [
        ["iron", "Freezing iron", "The huge squeeze at the center helped iron turn solid, even though it was still super hot."],
        ["grow", "Still growing", "The inner core is still slowly growing today, as Earth keeps cooling."],
        ["magnet", "A stronger shield?", "As the inner core grew, it helped stir the outer core. This may have made the magnetic shield stronger."]
      ],
      clue: "Magnetic grains in old rocks show times when the field was weaker or stronger. These clues help scientists guess when the inner core started to form.",
      debate: "Scientists still debate when the inner core began to freeze. Guesses range from about half a billion to more than 2 billion years ago.",
      globe: { size: 1, today: 0.35, dark: 1, ocean: 1, sort: 1, magma: 0, inner: [0, 1], moon: true, field: true }
    },
    {
      id: "today", date: "Today", dateShort: "Now", short: "Earth today", title: "Earth Today",
      lead: "Today, Earth has four main layers: the crust, the mantle, the liquid outer core, and the solid inner core.",
      gauges: { heat: [1, "Just right"], layers: [4, "Four main layers"], water: [4, "Oceans"], shield: [4, "On"] },
      points: [
        ["layers", "Still changing", "The mantle still slowly flows, the plates still move, and the inner core still grows."],
        ["shield", "Still protected", "The magnetic shield still protects our air."],
        ["drop", "Home sweet home", "Liquid water, air, and a magnetic shield make Earth a great home for life."]
      ],
      clue: "Earthquake waves show us all four layers today. Try Earthquake Detective to see how!",
      globe: { size: 1, today: 1, dark: 1, ocean: 1, sort: 1, magma: 0, inner: 1, moon: true, field: true }
    }
  ]
};
