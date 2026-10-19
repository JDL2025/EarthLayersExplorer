/* =====================================================================
   EARTH EXPLORER — "WATCH IT MOVE", "HOW DO WE KNOW?" AND TRIP CARDS
   ---------------------------------------------------------------------
   Same card parts as layers.js. Extra parts:
     group:  which heading it is listed under in Explore
     icon:   picture in the Explore list
     show:   what the 3D model does  (convection, core, quake, closeup-hotspot,
             closeup-magma, closeup-plates, journey, dig, none)
     where:  optional [lat, lon] — the globe turns to this place
     steps:  "How to use it" numbered steps (shown in a box)
     legend: color key [ [color, "meaning"], ... ]
   ===================================================================== */
window.TOPICS = {
  convection: {
    name: "Mantle convection", group: "Watch it move", icon: "loop", show: "convection",
    badge: "Watch it move",
    short: "Hot rock rises. Cooler rock sinks. Around and around it goes, very, very slowly.",
    paras: [
      "Convection is a loop of moving heat. You can see it in a pot of soup. Hot soup rises, cools at the top, and sinks again.",
      "The mantle does this too. Rock near the hot core warms up and slowly rises. Near the top, it cools and slowly sinks again.",
      "Remember: the mantle is thick liquid rock, like honey. It flows very slowly, only a few centimeters a year."
    ],
    legend: [["#ffd27a", "Hot rock rising"], ["#9a7bd6", "Cooler rock sinking"]],
    points: [
      ["clock", "Sped up a LOT!", "In this animation, every second is about 10 million years. A trip around one loop takes hundreds of millions of years."],
      ["plates", "Moving the plates", "The slow flow of the mantle helps drag Earth’s plates around on the surface."],
      ["flame", "Where does the heat come from?", "Some heat is left over from when Earth formed. More heat comes from radioactive atoms in the rocks."]
    ],
    know: [
      "Earthquake waves move faster through cold rock and slower through hot rock.",
      "Scientists use thousands of earthquakes to make 3D pictures of the mantle, a bit like a CT scan at the doctor. The pictures show hot rock rising and cold rock sinking."
    ],
    video: "mantle convection explained for kids"
  },

  hotspot: {
    name: "Hot spot volcanoes", group: "Watch it move", icon: "volcano", show: "closeup-hotspot", where: [19.4, -155.3],
    badge: "Watch it move",
    short: "A hot spot is a place where hot mantle rock rises and melts, making volcanoes.",
    paras: [
      "Under Hawaii, a plume of hot rock rises from deep in the mantle. Near the top, some of it melts into magma. The magma pushes up through the plate and builds a volcano.",
      "The hot spot stays in one place. But the Pacific Plate keeps moving northwest, about 3 to 4 inches (7 to 10 cm) a year.",
      "Each volcano gets carried away from the hot spot and goes quiet. Then a new volcano grows over the hot spot. This makes a chain of islands."
    ],
    facts: [
      ["Kauai", "About 4 to 6 million years old"],
      ["Oahu", "About 2 to 3½ million years old"],
      ["Maui", "About 1 million years old"],
      ["Big Island (Hawaii)", "Less than 1 million years old, and still growing!"],
      ["The next island", "Kamaʻehuakanaloa (once called Lōʻihi). It is still under the ocean."]
    ],
    compare: [
      "Yellowstone National Park also sits over a hot spot. It does not look like a mountain volcano, but it has hot springs and geysers like Old Faithful."
    ],
    know: [
      "Scientists measured the ages of rocks on each island. The farther an island is from the hot spot, the older its rocks are."
    ],
    video: "hawaii hot spot volcano island chain"
  },

  magma: {
    name: "Where magma comes from", group: "Watch it move", icon: "volcano2", show: "closeup-magma",
    badge: "Watch it move",
    short: "Magma forms near the top of the mantle. Then it rises up into volcanoes.",
    paras: [
      "Magma is melted rock under the ground. When it comes out of a volcano, we call it lava.",
      "Rock in the mantle is very hot. When hot mantle rock rises, the squeeze on it gets smaller. Then more of it melts and becomes runny magma.",
      "Magma is lighter than the rock around it, so it rises. It collects in a magma chamber under a volcano."
    ],
    points: [
      ["squeeze", "Less squeeze, more melting", "Rising rock gets squeezed less. With less squeeze, hot rock can melt."],
      ["drop", "Add water", "Water helps rock melt. This happens where one plate sinks under another and brings water down with it."],
      ["grow", "Lighter rock rises", "Magma is less dense than the rock around it. Like a bubble in water, it rises toward the surface."]
    ],
    myth: ["Lava comes all the way from Earth’s core.", "Lava comes from magma near the top of the mantle and in the crust, not from the core."],
    compare: [
      "Think of a slushy. It is mostly solid ice, with a little liquid between the crystals. Rock that is starting to melt is a bit like that."
    ],
    video: "how is magma formed for kids"
  },

  core: {
    name: "Earth’s magnetic shield", group: "Watch it move", icon: "magnet", show: "core",
    badge: "Watch it move",
    short: "Swirling liquid iron in the outer core makes Earth’s magnetic field. It is an invisible shield.",
    paras: [
      "The outer core is liquid iron. Heat from deep inside makes it churn and swirl.",
      "Moving iron makes electric currents. The currents make a magnetic field that reaches far out into space.",
      "The Sun blows out a stream of tiny particles called the solar wind. The magnetic field pushes most of it away from Earth, like an umbrella in the rain."
    ],
    legend: [["#7fd3ff", "Magnetic field lines"], ["#ffe08a", "Solar wind from the Sun"], ["#6dff9e", "Aurora (northern and southern lights)"]],
    points: [
      ["aurora", "Glowing skies", "Near the North and South Poles, some particles slip in. They make the sky glow green and pink. This is called an aurora."],
      ["compass", "Compasses", "A compass needle lines up with the magnetic field, so it points north."],
      ["spin", "It flips!", "Many times in Earth’s history, the north and south magnetic poles have switched places. The last flip was about 780,000 years ago."]
    ],
    know: [
      "Some rocks have tiny magnetic grains. When the rock forms, the grains line up with Earth’s field, like tiny frozen compasses.",
      "Scientists read these frozen compasses to learn about the field long ago."
    ],
    video: "earth magnetic field for kids"
  },

  quake: {
    name: "Earthquake Detective", group: "How do we know?", icon: "quake", show: "quake",
    badge: "How do we know?",
    short: "Earthquake waves are how scientists “see” inside Earth.",
    paras: [
      "When an earthquake happens, waves of energy race through the planet. Machines called seismographs record the waves all around the world.",
      "P waves (push waves) are faster. They can travel through solid rock AND liquid.",
      "S waves (shake waves) are slower. They travel through solid rock and through the thick, gooey mantle. They stop when they hit a runny liquid, like the outer core."
    ],
    steps: [
      "Tap the button that says Start the earthquake.",
      "Watch the waves race through Earth.",
      "Look for the places on the far side where no waves arrive.",
      "Tap the edge of the Earth to move the earthquake, then try again."
    ],
    legend: [["#62d6ff", "P waves (push waves)"], ["#ff8fd0", "S waves (shake waves)"]],
    points: [
      ["question", "The shadow zone", "S waves cannot get through the liquid outer core. So a big part of the far side gets no S waves at all. This is called a shadow zone."],
      ["wave", "Bending waves", "P waves bend when they enter the outer core. This leaves a ring on the far side where almost no P waves arrive."],
      ["star", "Super fast", "P waves travel more than 20 times faster than a jet plane."]
    ],
    know: [
      "In 1914, a scientist named Beno Gutenberg used the shadow zone to find the edge of the core. It is about 2,900 km down.",
      "In 1936, Inge Lehmann noticed faint P waves inside the shadow zone. That clue led her to discover the solid inner core."
    ],
    video: "earthquake waves shadow zone for kids"
  },

  know: {
    name: "How do we know what’s inside?", group: "How do we know?", icon: "question", show: "none",
    badge: "How do we know?",
    short: "No one has ever been to the mantle or the core. So how do scientists know what is down there? They use clues!",
    paras: [
      "Scientists are like detectives. They put many clues together to figure out what is inside Earth."
    ],
    points: [
      ["quake", "Clue 1: Earthquake waves", "Waves speed up, slow down, bend, or stop at each layer. This is the best clue we have."],
      ["rock", "Clue 2: Rocks from deep down", "Volcanoes sometimes bring up chunks of mantle rock. Diamonds come from deep in the mantle too."],
      ["iron", "Clue 3: Earth’s weight", "Earth is about twice as dense as the rocks at its surface. So something very heavy, like iron, must be in the middle."],
      ["star", "Clue 4: Space rocks", "Some meteorites are made of iron and nickel. They are leftover pieces from when planets formed."],
      ["squeeze", "Clue 5: Lab tests", "Scientists squeeze tiny bits of iron between two diamonds and heat them with lasers. This shows how iron acts deep inside Earth."],
      ["drill", "Clue 6: Drilling", "The deepest hole ever drilled is the Kola Superdeep Borehole in Russia. It is about 12 km deep. It took about 20 years to drill, and it got only about one third of the way through the crust there."]
    ],
    video: "how do we know what is inside the earth"
  },

  plates: {
    name: "Two ways to sort the layers", group: "Advanced layers", icon: "layers", show: "closeup-plates", advanced: true,
    badge: "Advanced",
    short: "Scientists sort Earth’s layers in two ways: by what they are made of, and by how they move.",
    paras: [
      "By what they are made of: crust, mantle, outer core, and inner core.",
      "By how they move: the lithosphere is stiff and breaks into plates. The asthenosphere under it is soft and bendy. The plates slide on top of it.",
      "The lithosphere is the crust PLUS the stiff top part of the mantle."
    ],
    legend: [["#8fc3e8", "Lithosphere (stiff)"], ["#ff9a6e", "Asthenosphere (soft)"]],
    know: [
      "Earthquake waves slow down in the soft asthenosphere. GPS shows the plates on top moving a few centimeters each year."
    ],
    video: "lithosphere vs asthenosphere"
  },

  journey: {
    name: "Journey to the center", group: "Trips", icon: "elevator", show: "journey",
    badge: "Trip",
    short: "Ride an elevator from the surface all the way to the center of Earth!",
    paras: [
      "Watch the box on the left. It shows how deep you are, how hot it is, and how hard the rock is squeezing you."
    ],
    steps: [
      "Drag the round button on the right side down to go deeper.",
      "Tap the down arrow to jump to the next stop. Tap the up arrow to go back up.",
      "Watch the depth, heat, and squeeze change as you go."
    ],
    points: [
      ["ruler", "How far is it?", "The center is about 6,371 km (3,960 miles) down. That is about as far as flying from Chicago to London!"]
    ],
    video: "journey to the center of the earth for kids"
  },

  dig: {
    name: "Dig straight through", group: "Trips", icon: "drill", show: "dig",
    badge: "Trip",
    short: "What if you dug a tunnel straight through Earth? Where would you come out?",
    paras: [
      "Tap anywhere on the globe to dig straight through from that spot. The dots show big cities, like Chicago. Tap a dot to start there!",
      "Then tap Start digging here, and then Start digging. Watch your tunnel zoom through the center of the Earth and see where you pop out!",
      "Of course, no one could really do this. It is far too hot, and the squeeze would crush any machine."
    ],
    video: "what if you dug a hole through the earth"
  }
};

// Order of headings and items in the Explore list
window.EXPLORE_GROUPS = [
  ["The main layers", ["crust", "mantle", "outer", "inner"]],
  ["Trips", ["journey", "dig"]],
  ["Watch it move", ["convection", "hotspot", "magma", "core"]],
  ["How do we know?", ["quake", "know"]],
  ["Advanced layers", ["lithosphere", "asthenosphere", "plates"]],
  ["Ancient Earth time machine", ["youngearth"]]
];
