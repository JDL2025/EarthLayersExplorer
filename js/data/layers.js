/* =====================================================================
   EARTH EXPLORER — LAYER CARDS
   ---------------------------------------------------------------------
   You can edit any text here right on GitHub (pencil icon → Commit).
   Keep the quote marks and commas the way they are.

   Each layer has:
     name, color, kind ("Main layer" or "Advanced layer"),
     short:   one big sentence at the top of the card
     paras:   2–3 short paragraphs
     gauges:  heat / squeeze / density / state  ->  [0–4 bars, "word"]
     points:  [ [icon, "Mini heading", "One or two sentences"], ... ]
              icons: mountain, wave, clock, flame, gem, squeeze, biggest, compass,
                     shield, drop, grow, spin, plates, quake, egg, magnet, sun,
                     rock, layers, question, ruler, iron, drill, star, aurora, taffy
     facts:   [ ["Label", "Value"], ... ]  (the list in the middle of the card)
     compare: "Compare it" box (sentences)
     know:    "How do we know?" box (sentences)
     myth:    optional ["Myth", "Truth"] box
     debate:  optional "Scientists are still debating" note
     video:   YouTube search words for the red video button
   Numbers: USGS, IRIS, NASA and the PREM model of Earth’s interior.
   ===================================================================== */
window.LAYERS = {
  crust: {
    name: "Crust", color: "#b98b62", kind: "Main layer",
    short: "The crust is the thin, rocky outside of Earth. It is the layer we live on.",
    paras: [
      "The crust is Earth’s outer skin. Mountains, oceans, and cities all sit on top of it.",
      "There are two kinds of crust. Continental crust is under the land. It is mostly a light-colored rock called granite. Oceanic crust is under the oceans. It is mostly a dark, heavy rock called basalt.",
      "The crust is the thinnest layer. If Earth were an apple, the crust would be about as thin as the apple’s skin."
    ],
    gauges: { heat: [1, "Up to 1,000°F"], squeeze: [1, "Low"], density: [1, "About 3× water"], state: [4, "Solid"] },
    points: [
      ["mountain", "Land crust", "Under the land, the crust is about 30 to 70 km (20 to 45 miles) thick. It is thickest under tall mountains."],
      ["wave", "Ocean crust", "Under the oceans, the crust is only about 5 to 10 km (3 to 6 miles) thick. It is thinner, but heavier."],
      ["clock", "Old and young", "Some land crust is about 4 billion years old. Most ocean crust is less than 200 million years old."]
    ],
    facts: [
      ["Where it is", "The very top layer"],
      ["How thick", "About 5–10 km under oceans; about 30–70 km under land"],
      ["Made of", "Solid rock, like granite and basalt"],
      ["Temperature", "Gets hotter as you go down. About 1,000°F at the bottom (even hotter in some places)."],
      ["Density", "About 3 times as dense as water"],
      ["Solid or liquid?", "Solid"],
      ["How much of Earth", "About 1% of all the space inside Earth"]
    ],
    compare: [
      "If Earth were a basketball, the crust under the oceans would be about as thin as a sheet of paper.",
      "The deepest hole people ever dug is about 12 km deep. It did not even make it halfway through the crust!"
    ],
    know: [
      "Scientists study rocks at the surface and drill deep holes.",
      "In 1909, a scientist named Andrija Mohorovičić noticed that earthquake waves speed up at a certain depth. He had found the bottom of the crust! Scientists call this boundary the Moho for short."
    ],
    video: "layers of the earth crust for kids"
  },

  mantle: {
    name: "Mantle", color: "#e0633a", kind: "Main layer",
    short: "The mantle is the thickest layer. It is made of hot, liquid rock that flows very, very slowly.",
    paras: [
      "The mantle is under the crust. It is about 2,900 km (1,800 miles) thick. That is about as far as driving from Chicago to Los Angeles!",
      "The mantle is liquid rock. In many places it is very thick, like honey, so it flows very slowly. It moves about as fast as your fingernails grow.",
      "Hot rock slowly rises, and cooler rock slowly sinks. This loop is called convection. Convection helps move the plates on Earth’s surface."
    ],
    gauges: { heat: [3, "1,000–7,000°F"], squeeze: [3, "High"], density: [2, "3–6× water"], state: [2, "Liquid (thick, like honey)"] },
    points: [
      ["flame", "Hotter and hotter", "Near the top, the mantle is about 1,000°F. Near the bottom, it is about 7,000°F."],
      ["gem", "Green rock", "Most of the mantle is a rock called peridotite. It is full of a green mineral called olivine."],
      ["biggest", "The biggest layer", "The mantle takes up about 84% of all the space inside Earth. That is more than all the other layers put together!"],
      ["layers", "Upper and lower", "Scientists split the mantle into two parts. The lower mantle starts about 660 km (410 miles) down."]
    ],
    facts: [
      ["Where it is", "Under the crust, down to about 2,900 km (1,800 miles)"],
      ["How thick", "About 2,900 km (1,800 miles)"],
      ["Made of", "Hot rock with lots of iron and magnesium (peridotite)"],
      ["Temperature", "About 1,000°F at the top to about 7,000°F at the bottom"],
      ["Density", "About 3 to 6 times as dense as water"],
      ["Solid or liquid?", "Liquid rock (thick, like honey)"],
      ["How much of Earth", "About 84% of all the space inside Earth"]
    ],
    compare: [
      "Think of a jar of thick honey. Tip it, and the honey slowly oozes. The mantle flows like that, but much, much slower.",
      "Mantle rock moves only a few centimeters (about 1 inch) a year."
    ],
    know: [
      "Volcanoes sometimes carry chunks of mantle rock up to the surface. These green rocks are peridotite.",
      "Shake waves (S waves) from earthquakes still travel through the mantle. Mantle rock is so thick and so squeezed that it acts like a soft solid when an earthquake shakes it."
    ],
    video: "earth mantle convection for kids"
  },

  outer: {
    name: "Outer core", color: "#f7a531", kind: "Main layer",
    short: "The outer core is a layer of liquid metal. It is mostly melted iron and nickel.",
    paras: [
      "The outer core is liquid metal. It is much runnier than the mantle. It flows easily, a lot like water. It is about 2,200 km (1,400 miles) thick.",
      "It is very hot, about 7,000°F to 10,000°F. That is hot enough to keep the metal melted.",
      "The liquid iron is always swirling. Moving iron makes Earth’s magnetic field. The magnetic field is like an invisible shield around Earth."
    ],
    gauges: { heat: [4, "7,000–10,000°F"], squeeze: [4, "Very high"], density: [3, "10–12× water"], state: [1, "Liquid"] },
    points: [
      ["compass", "Why compasses work", "A compass needle lines up with Earth’s magnetic field. That field is made in the outer core."],
      ["shield", "An invisible shield", "The magnetic field pushes away harmful particles that stream out from the Sun. This helps protect our air."],
      ["drop", "Liquid metal", "The outer core is squeezed very hard. But it is so hot that the metal still stays melted."]
    ],
    facts: [
      ["Where it is", "About 2,900 to 5,150 km (1,800 to 3,200 miles) down"],
      ["How thick", "About 2,200 km (1,400 miles)"],
      ["Made of", "Liquid iron and nickel"],
      ["Temperature", "About 7,000°F to 10,000°F"],
      ["Density", "About 10 to 12 times as dense as water"],
      ["Solid or liquid?", "Liquid"],
      ["How much of Earth", "About 15% of all the space inside Earth"]
    ],
    compare: [
      "The outer core is about as thick as the distance from Chicago to Phoenix, Arizona.",
      "Iron melts at about 2,800°F here at the surface. The outer core is more than twice that hot!"
    ],
    know: [
      "Shake waves (S waves) cannot travel through a runny liquid like the outer core. When an earthquake happens, S waves never reach the far side of Earth. The outer core stops them.",
      "Some space rocks (meteorites) are made of iron and nickel. They are leftovers from when planets formed, and they give clues about what cores are made of."
    ],
    video: "earth outer core magnetic field for kids"
  },

  inner: {
    name: "Inner core", color: "#ffe28a", kind: "Main layer",
    short: "The inner core is a solid ball of iron and nickel at the very center of Earth.",
    paras: [
      "The inner core is the hottest layer. It is about 10,000°F. That is about as hot as the surface of the Sun!",
      "It is so hot that the metal should melt. But the squeeze from all the layers above is so huge that the iron is pressed into a solid.",
      "The inner core is about 2,400 km (1,500 miles) across. That is about as far as from Chicago to Las Vegas."
    ],
    gauges: { heat: [4, "About 10,000°F"], squeeze: [4, "Highest"], density: [4, "About 13× water"], state: [4, "Solid"] },
    points: [
      ["squeeze", "Squeezed solid", "At the center, the squeeze is about 3.6 million times the air pressure you feel right now."],
      ["grow", "Slowly growing", "Earth is very slowly cooling. As it cools, liquid iron freezes onto the inner core. So the inner core is slowly getting bigger."],
      ["iron", "Heavier than lead", "Inner core metal is about 13 times as dense as water. That is denser than lead!"]
    ],
    facts: [
      ["Where it is", "About 5,150 km (3,200 miles) down, to the center"],
      ["Distance to the center", "About 6,371 km (3,960 miles)"],
      ["How wide", "About 2,400 km (1,500 miles) across"],
      ["Made of", "Solid iron and nickel"],
      ["Temperature", "About 10,000°F"],
      ["Density", "About 13 times as dense as water"],
      ["Solid or liquid?", "Solid"],
      ["How much of Earth", "Less than 1% of all the space inside Earth"]
    ],
    compare: [
      "The inner core is about 70% as wide as our Moon.",
      "The trip from the surface to the center is about 6,371 km (3,960 miles). That is about as far as flying from Chicago to London!"
    ],
    know: [
      "In 1936, a Danish scientist named Inge Lehmann studied earthquake waves. She noticed faint waves showing up where they were not supposed to be.",
      "She figured out that a solid inner core was bouncing them there. She discovered the inner core!"
    ],
    debate: "Does the inner core spin a little faster or a little slower than the rest of Earth? Studies disagree, and scientists are still working on it.",
    video: "earth inner core for kids"
  },

  lithosphere: {
    name: "Lithosphere", color: "#8fc3e8", kind: "Advanced layer", advanced: true,
    short: "The lithosphere is Earth’s stiff, rocky outer shell. It is the crust plus the very top of the mantle.",
    paras: [
      "Scientists sort Earth’s layers in two ways. One way is by what the layers are made of: crust, mantle, and core. The other way is by how the layers move.",
      "The lithosphere is the stiff outer layer. The very top of the mantle is cooler, so it is stiff too. The lithosphere cracks instead of bending. “Litho” means rock.",
      "The lithosphere is broken into giant pieces called tectonic plates. The plates fit together like a cracked eggshell."
    ],
    gauges: { heat: [2, "Up to 2,400°F"], squeeze: [1, "Low"], density: [1, "About 3× water"], state: [4, "Solid and stiff"] },
    points: [
      ["ruler", "How thick?", "It is about 100 km (60 miles) thick on average. It is thinner under oceans and thicker under old continents."],
      ["plates", "Plates ride on top", "The plates slide slowly over the soft layer below, called the asthenosphere."],
      ["quake", "Earthquakes", "When plates get stuck and then suddenly slip, we feel an earthquake."]
    ],
    facts: [
      ["Where it is", "From the surface to about 100 km (60 miles) down (it changes from place to place)"],
      ["Includes", "All of the crust + the stiff top part of the mantle"],
      ["How it acts", "Stiff and hard. It cracks instead of oozing."],
      ["Temperature", "Up to about 2,400°F at the bottom"],
      ["Solid or liquid?", "Solid"]
    ],
    compare: [
      "Think of a cracked hard-boiled egg. The cracked shell is like the lithosphere. The pieces of shell are like the plates."
    ],
    know: [
      "Scientists use GPS to measure the plates moving a few centimeters each year.",
      "Earthquake waves slow down when they reach the softer rock below the lithosphere."
    ],
    video: "lithosphere asthenosphere for kids"
  },

  asthenosphere: {
    name: "Asthenosphere", color: "#ff9a6e", kind: "Advanced layer", advanced: true,
    short: "The asthenosphere is a soft, gooey layer at the top of the mantle. Earth’s plates slide on top of it.",
    paras: [
      "The asthenosphere is the top part of the mantle, just under the lithosphere. “Astheno” means weak.",
      "It is very hot, soft rock. It bends and flows slowly, like warm taffy.",
      "A tiny bit of the rock here may be melted. This helps make it soft."
    ],
    gauges: { heat: [2, "About 2,400°F+"], squeeze: [2, "Medium"], density: [1, "About 3.3× water"], state: [2, "Soft, flows slowly"] },
    points: [
      ["ruler", "Where is it?", "It starts about 100 km (60 miles) down. It goes to about 250 km (155 miles) down."],
      ["taffy", "Soft and slippery", "Because it is soft, the stiff plates above can slide over it."],
      ["flame", "Magma maker", "Some of the magma for volcanoes forms near the top of the asthenosphere."]
    ],
    facts: [
      ["Where it is", "About 100 to 250 km (60 to 155 miles) down"],
      ["Part of", "The upper mantle"],
      ["How it acts", "Soft and gooey, like warm taffy"],
      ["Temperature", "About 2,400°F and hotter"],
      ["Solid or liquid?", "Soft rock that flows slowly"]
    ],
    compare: [
      "Picture a raft (a plate) resting on a thick, slow-moving pudding (the asthenosphere)."
    ],
    know: [
      "Earthquake waves slow down when they enter the asthenosphere. This tells scientists the rock there is hotter and softer."
    ],
    debate: "Where is the bottom of the asthenosphere? Some scientists say about 250 km down. Others think it goes deeper.",
    video: "asthenosphere for kids"
  }
};

// The order layers appear in lists
window.LAYER_ORDER = ["crust", "mantle", "outer", "inner"];
window.ADVANCED_ORDER = ["lithosphere", "asthenosphere"];
