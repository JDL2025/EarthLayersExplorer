/* =====================================================================
   EARTH EXPLORER — STOPS FOR "DIG STRAIGHT THROUGH" AND "JOURNEY TO THE CENTER"
   ---------------------------------------------------------------------
   depth: km below the surface where the stop is.
   For the far side of the Dig trip, "dist" is how far you have dug in total.
   {start} and {exit} are filled in with the place names automatically.
   icon: same icon names as layers.js
   ===================================================================== */
window.STOPS = [
  { depth: 0, icon: "drill", title: "Ready to dig!",
    text: "You are standing at {start}. Under your feet is the crust, Earth’s rocky outside. Let’s start digging!" },

  { depth: 0.1113, icon: "ruler", title: "Chicago’s lowest spot",
    text: "You have gone 111 meters (365 feet) down. That is as deep as the pumping station of Chicago’s Deep Tunnel. It is the lowest place in Chicago where people can go." },

  { depth: 0.4423, icon: "ruler", title: "As deep as the Willis Tower is tall",
    text: "You have gone 442 meters (1,451 feet) down. That is as deep as the Willis Tower in Chicago is tall!" },

  { depth: 0.828, icon: "ruler", title: "As deep as the world’s tallest building",
    text: "You have gone 828 meters (2,717 feet). That is the height of the Burj Khalifa in Dubai, the tallest building in the world." },

  { depth: 1.8, icon: "mountain", title: "As deep as the Grand Canyon",
    text: "You have gone about 1.8 km (6,000 feet). That is about as deep as the Grand Canyon in Arizona." },

  { depth: 3.7, icon: "wave", title: "As deep as the ocean, on average",
    text: "You have gone about 3.7 km (12,100 feet). That is how deep the ocean is on average." },

  { depth: 4.0, icon: "drill", title: "The deepest mines",
    text: "You have gone about 4 km (2.5 miles). The deepest mines in the world reach about this deep. They are gold mines in South Africa. The rock down here is about 150°F, so miners pump in ice to stay cool!" },

  { depth: 8.849, icon: "mountain", title: "As deep as Mount Everest is tall",
    text: "You have gone about 8.8 km (29,000 feet). That is as tall as Mount Everest, the tallest mountain on Earth!" },

  { depth: 10.9, icon: "wave", title: "As deep as the deepest ocean",
    text: "You have gone about 11 km (36,000 feet). That is as deep as the Challenger Deep, the deepest spot in the ocean. Jet planes fly about this high above the ground!" },

  { depth: 12.26, icon: "drill", title: "The deepest hole ever dug",
    text: "You have gone about 12.3 km (7.6 miles). This is as deep as the Kola Superdeep Borehole in Russia, the deepest hole ever drilled. The rock at the bottom was about 356°F, hotter than an oven! No person or machine has ever gone deeper." },

  { depth: 35, icon: "layers", title: "Goodbye crust, hello mantle!",
    text: "You have gone about 35 km (22 miles). Under most land, this is the bottom of the crust. Scientists call this boundary the Moho. Now you are in the mantle! (Under the oceans, the crust ends much sooner, only about 5 to 10 km down.)" },

  { depth: 42.2, icon: "gem", title: "A marathon straight down",
    text: "You have gone about 42 km (26 miles). That is the length of a marathon race! The rock around you is green mantle rock called peridotite." },

  { depth: 100, icon: "star", title: "As deep as space is high",
    text: "You have gone 100 km (62 miles). If you went 100 km straight UP, you would reach the edge of space!",
    adv: "This is about the bottom of the lithosphere, Earth’s stiff outer shell." },

  { depth: 150, icon: "taffy", title: "Soft, bendy rock",
    text: "You have gone about 150 km (93 miles). The rock here is hot, soft, and gooey, like warm taffy. Earth’s plates slide on top of this soft rock.",
    adv: "Scientists call this soft part of the mantle the asthenosphere." },

  { depth: 175, icon: "gem", title: "The diamond factory",
    text: "You have gone about 175 km (110 miles). Most diamonds form about 150 to 200 km down, deep under old continents. The huge squeeze turns carbon into diamond!" },

  { depth: 400, icon: "star", title: "As deep as the Space Station flies high",
    text: "You have gone about 400 km (250 miles). That is how high the International Space Station flies above Earth! Down here, the squeeze is so strong that the crystals in the rock change into new, tighter shapes." },

  { depth: 660, icon: "layers", title: "The lower mantle",
    text: "You have gone about 660 km (410 miles). That is about as far as driving from Chicago to Pittsburgh! The upper mantle ends here, and the lower mantle begins." },

  { depth: 1450, icon: "flame", title: "Halfway through the mantle",
    text: "You have gone about 1,450 km (900 miles). That is about as far as from Chicago to Denver. It is about 3,500°F here. That would melt iron at the surface! Down here, the mantle rock is thick and gooey, like honey." },

  { depth: 2900, icon: "drop", title: "Goodbye mantle, hello outer core!",
    text: "You have gone about 2,900 km (1,800 miles). That is about as far as from Chicago to Los Angeles. Splash! You just dropped into the outer core, an ocean of runny liquid metal." },

  { depth: 3300, icon: "wave", title: "An ocean of metal",
    text: "You have gone about 3,300 km (2,050 miles). All around you is liquid iron and nickel. The outer core holds more than 100 times as much liquid as all of Earth’s oceans put together!" },

  { depth: 4000, icon: "magnet", title: "Swimming in liquid iron",
    text: "You have gone about 4,000 km (2,500 miles). The liquid iron around you is slowly swirling. This moving metal makes Earth’s magnetic field!" },

  { depth: 4590, icon: "ruler", title: "As far as Chicago to Alaska",
    text: "You have gone about 4,590 km (2,850 miles). That is about as far as flying from Chicago to Anchorage, Alaska! The liquid iron here flows about 10 to 20 km (6 to 12 miles) every year. That is much faster than the mantle." },

  { depth: 5000, icon: "squeeze", title: "500 elephants on your fingernail",
    text: "You have gone about 5,000 km (3,100 miles). The squeeze here is more than 3 million times the air pressure at the surface. That is like about 500 elephants standing on one fingernail!" },

  { depth: 5150, icon: "iron", title: "The inner core",
    text: "You have gone about 5,150 km (3,200 miles). You just hit the inner core, a giant ball of solid metal. A scientist named Inge Lehmann discovered it in 1936!" },

  { depth: 5400, icon: "sun", title: "As hot as the Sun",
    text: "You have gone about 5,400 km (3,350 miles). It is about 10,000°F here. That is about as hot as the surface of the Sun!" },

  { depth: 5600, icon: "iron", title: "Super heavy metal",
    text: "You have gone about 5,600 km (3,480 miles). The metal here is packed so tightly that a one-gallon jug of it would weigh about 110 pounds. A gallon of milk weighs only about 8½ pounds!" },

  { depth: 5720, icon: "question", title: "A ball inside a ball?",
    text: "You have gone about 5,720 km (3,550 miles). Some scientists think the middle of the inner core is a little different from the rest, like a ball inside a ball. It would be about 1,300 km (800 miles) across. Scientists are still studying it!" },

  { depth: 6090, icon: "ruler", title: "As far as Chicago to Peru",
    text: "You have gone about 6,090 km (3,780 miles). That is about as far as flying from Chicago to Lima, Peru, in South America. The center is only about 280 km (175 miles) away!" },

  { depth: 6371, icon: "star", title: "The center of the Earth!", center: true,
    text: "You made it! You have gone 6,371 km (3,960 miles). That is about as far as flying from Chicago to London. It is about 10,000°F here, and the squeeze is about 3.6 million times the air pressure at the surface.",
    fun: "At the very center, you would float! Earth’s gravity would pull on you the same amount from every side." }
];

// Extra stops on the way back up the other side (Dig straight through only)
window.FAR_STOPS = [
  { dist: 7592, icon: "drop", title: "Leaving the inner core",
    text: "Now you are heading UP toward the other side of Earth! You are back in the liquid outer core." },
  { dist: 9852, icon: "layers", title: "Back in the mantle",
    text: "You left the core. Now you are climbing up through the thick, slowly flowing liquid rock of the mantle." },
  { dist: 12707, icon: "mountain", title: "Back in the crust",
    text: "You are back in the crust. Only about 35 km (22 miles) to go!" },
  { dist: 12742, icon: "star", title: "You pop out {exit}!", exit: true,
    text: "You dug 12,742 km (7,918 miles), all the way through Earth! That is about as far as flying from Chicago to Hong Kong.",
    fun: "If you jumped into a tunnel like this (with no air in it), gravity would pull you all the way through in about 38 minutes!" }
];

/* How hot it is and how hard the rock squeezes, at each depth.
   [depth in km, value]. The site fills in the numbers in between.
   Temperatures are °F (scientists’ best estimates — they change from place to place).
   Squeeze = how many times the air pressure at the surface. */
window.DEPTH_PROFILE = {
  temp: [[0, 59], [0.11, 60], [4, 151], [12.26, 356], [35, 1000], [100, 2370], [250, 2550], [410, 2730], [660, 2910],
         [1450, 3550], [2700, 4500], [2850, 6300], [2890, 7000], [5150, 9800], [6371, 10000]],
  squeeze: [[0, 1], [0.111, 12], [0.442, 45], [0.828, 85], [1.8, 480], [4, 1070], [8.85, 2350], [12.26, 3300], [35, 10000],
            [100, 31000], [250, 81000], [410, 136000], [660, 235000], [1450, 600000], [2890, 1340000], [4000, 2440000],
            [5150, 3250000], [6371, 3600000]]
};
