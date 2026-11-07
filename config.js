/* ==========================================================================
   THE GIRL I WAS LOOKING FOR  —  config.js
   This is the file you edit to personalise the game.
   Names, music paths, photo paths, look of the characters, fictional app.
   ========================================================================== */

const CONFIG = {

  /* ---------- Title screen ---------- */
  title: "The Girl I Was Looking For",
  openingQuote: [
    "Sometimes you spend months looking for someone...",
    "only to realize the journey was leading you to them."
  ],
  startLabel: "START THE STORY",
  nextChapterLabel: "OUR NEXT CHAPTER →",
  toBeContinued: "To be continued...",
  dedication: "Made by Yahya, for Momna.",

  /* ---------- Photos ----------
     Put real photos in assets/images/ using the file names below.
     If a file is missing the game shows a soft placeholder frame instead.
     showPhotoPlaceholders:false  -> hides frames that have no photo at all.
     devHints:true                -> placeholder frames print their file name
                                     (handy while you add photos; keep OFF when sending) */
  showPhotoPlaceholders: true,
  devHints: false,

  /* Locked chapters unlock as you finish them. Set true to see every chapter
     in the Chapters menu from the start (good for testing). You can also open
     index.html?chapter=7 to jump straight to a chapter. */
  unlockAllChapters: false,
  images: {
    momna:   "assets/images/momna.jpg",
    memory1: "assets/images/memory1.jpg",
    memory2: "assets/images/memory2.jpg",
    memory3: "assets/images/memory3.jpg"
  },
  memoryCaptions: {
    memory1: "Where it all started.",
    memory2: "Somewhere in the middle of the wait.",
    memory3: "A day I never want to forget."
  },

  /* ---------- Music ----------
     Drop your own tracks in assets/music/ with these names (mp3/ogg/m4a all fine,
     just change the extension here). They loop and crossfade automatically.
     If a file is missing, a soft built-in ambient synth plays instead
     (generated live, nothing copyrighted). Set fallbackSynth:false for silence. */
  music: {
    volume: 0.55,
    fallbackSynth: true,
    tracks: {
      day:       "assets/music/day.mp3",        // school / bus / everyday
      emotional: "assets/music/emotional.mp3",  // missing her, rain, waiting
      mystery:   "assets/music/mystery.mp3",    // the wrong account, clues
      hopeful:   "assets/music/hopeful.mp3",    // families, friendship
      final:     "assets/music/final.mp3"       // the last scene
    }
  },

  /* ---------- Names shown in dialogue boxes ---------- */
  names: {
    yahya: "Yahya",
    momna: "Momna",
    momnaFriend: "Momna's Friend",
    friend1: "Yahya's Friend",
    friend2: "Another Friend",
    otherGirl: "Classmate",
    otherBoy: "The Other Boy",
    classBoy: "Boy from 9A",
    brother: "Momna's Brother",
    mother1: "Yahya's Mother",
    father: "Yahya's Father",
    mother2: "Momna's Mother",
    driver: "Bus Driver",

    // names used in the puzzles / fictional app
    momnaFull: "Momina Iftekhar",
    wrongFull: "Momina Tariq",
    thirdFull: "Momina (junior section)",
    uncle: "Iftekhar"
  },

  /* ---------- Character look (optional overrides) ----------
     Any key from art.js LOOKS can be overridden here, e.g.
     looks: { momna: { accent: "#9fd8c8" } }                               */
  looks: {},

  /* ---------- Fictional social app (100% local, not a real service) ---------- */
  social: {
    appName: "Gramly",
    // Chapter 3: the account that "looks right" (it belongs to the wrong girl)
    chapter3: {
      hint: "Your friend's message: \"Name is Momna. Pink flower photo. Bio says books · tea · sunsets.\"",
      results: [
        { handle: "momna.s_",   name: "Momna S.",     bio: "cricket · cars · chaos",       color: "#6fb6ff", posts: 41,  followers: 212 },
        { handle: "momina.t_",  name: "Momina Tariq", bio: "books · tea · sunsets",        color: "#ff8fb1", posts: 27,  followers: 158, flower: true, target: true },
        { handle: "momna_k",    name: "Momna K.",     bio: "no bio yet",                   color: "#9bd49b", posts: 3,   followers: 20 }
      ]
    },
    // Chapter 6: the correct account
    chapter6: {
      hint: "Clue: her father's name was Iftekhar. Her surname starts with I.",
      results: [
        { handle: "momina.t_",  name: "Momina Tariq",      bio: "already checked — not her",  color: "#ff8fb1", posts: 27, followers: 158, checked: true },
        { handle: "momna.s_",   name: "Momna S.",          bio: "cricket · cars · chaos",     color: "#6fb6ff", posts: 41, followers: 212 },
        { handle: "momina_i",   name: "Momina Iftekhar",   bio: "small joys ✦",               color: "#c3a6ff", posts: 12, followers: 96, target: true, photo: "momna" },
        { handle: "momina.k",   name: "Momina K.",         bio: "quiet · coffee · rain",      color: "#ffcf8a", posts: 18, followers: 130 }
      ]
    }
  },

  /* ---------- Chapter 7: the things you two learn about each other ----------
     PERSONALISE THESE. Each round, Yahya picks one of two questions and gets
     her answer. Replace the placeholder answers with real things she would say
     (her favourite food, what she does when it rains, her dream...). */
  getToKnow: [
    { options: [
      { t: "What do you do when you can't sleep?",         her: "I listen to the rain. Or read until my eyes give up." },
      { t: "What's your favourite part of the school day?", her: "The ten minutes before the first bell. Everyone is half asleep, and a little more honest." } ] },
    { options: [
      { t: "What's something that always makes you smile?", her: "Small things. Tea at the right temperature. A sky that turns pink without warning." },
      { t: "What's the best thing you ate this week?",      her: "My mother's cooking, always. Nothing else even competes." } ] },
    { options: [
      { t: "What do you want to do one day?",               her: "Go somewhere with mountains. And have a little shelf of books that are all mine." },
      { t: "What's a place you'd love to see?",             her: "Anywhere quiet, with a view. I'm not picky as long as it's peaceful." } ] }
  ],

  /* ---------- Puzzle clue texts (fictional placeholders — edit to match real life) ---------- */
  identityClues: [
    { text: "\"Momina Tariq goes home the other way. She's never even been in the courtyard.\"", rulesOut: "wrong" },
    { text: "\"The other Momina is two classes below. She's still in the junior section.\"",    rulesOut: "junior" },
    { text: "\"The girl you saw always laughs with her friend.\"",                                rulesOut: null }
  ]
};
