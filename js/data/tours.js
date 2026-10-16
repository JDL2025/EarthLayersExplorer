/* =====================================================================
   EARTH EXPLORER — GUIDED TOURS
   Each tour visits cards in order. Use the ids from layers.js and topics.js.
   ===================================================================== */
window.TOURS = [
  { emoji: "🌍", name: "Meet the Layers",
    text: "Visit all four main layers, from the crust to the inner core.",
    stops: ["crust", "mantle", "outer", "inner"] },
  { emoji: "🔥", name: "Heat on the Move",
    text: "See how heat moves rock, makes magma, builds volcanoes, and powers Earth’s shield.",
    stops: ["convection", "magma", "hotspot", "core"] },
  { emoji: "🔎", name: "How Do We Know?",
    text: "Be a detective! Find out how scientists learned what is inside Earth.",
    stops: ["know", "quake", "inner", "mantle"] },
  { emoji: "🧩", name: "Advanced: Plates and the Soft Layer",
    text: "Meet the lithosphere and the asthenosphere, and see how plates move.",
    stops: ["plates", "lithosphere", "asthenosphere", "convection"] }
];
