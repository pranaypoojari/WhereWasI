/**
 * Comprehensive Catalog & Media Database for instant zero-latency autofill
 * across Movies, Anime, and TV Series.
 */

export const MEDIA_CATALOG = [
  // --- TV SERIES (IN-CATALOG & TOP GLOBAL) ---
  {
    title: "Stranger Things",
    type: "tv",
    slug: "stranger-things",
    inCatalog: true,
    platform: "Netflix",
    year: "2016-Present",
    genre: "Sci-Fi / Horror / Mystery",
    seasons: 4,
    tag: "Upside Down • Hawkins"
  },
  {
    title: "Mirzapur",
    titleHindi: "मिर्ज़ापुर",
    type: "tv",
    slug: "mirzapur",
    inCatalog: true,
    platform: "Prime Video",
    year: "2018-Present",
    genre: "Crime / Action / Drama",
    seasons: 3,
    tag: "Tripathi Raj • Kaleen Bhaiya"
  },
  {
    title: "Panchayat",
    titleHindi: "पंचायत",
    type: "tv",
    slug: "panchayat",
    inCatalog: true,
    platform: "Prime Video",
    year: "2020-Present",
    genre: "Comedy / Drama / Slice of Life",
    seasons: 3,
    tag: "Phulera Village • Sachiv Ji"
  },
  {
    title: "Breaking Bad",
    type: "tv",
    slug: "breaking-bad",
    inCatalog: true,
    platform: "Netflix",
    year: "2008-2013",
    genre: "Crime / Drama / Thriller",
    seasons: 5,
    tag: "Heisenberg • Albuquerque"
  },
  {
    title: "The Boys",
    type: "tv",
    slug: "the-boys",
    inCatalog: true,
    platform: "Prime Video",
    year: "2019-Present",
    genre: "Action / Satire / Superhero",
    seasons: 4,
    tag: "Homelander • Vought"
  },
  {
    title: "Game of Thrones",
    type: "tv",
    slug: "game-of-thrones",
    inCatalog: true,
    platform: "JioCinema / HBO",
    year: "2011-2019",
    genre: "Epic Fantasy / Drama",
    seasons: 8,
    tag: "Iron Throne • Winterfell"
  },
  {
    title: "The Family Man",
    titleHindi: "द फैमिली मैन",
    type: "tv",
    slug: "the-family-man",
    inCatalog: true,
    platform: "Prime Video",
    year: "2019-Present",
    genre: "Action / Espionage / Thriller",
    seasons: 2,
    tag: "TASC Agent • Srikant Tiwari"
  },
  {
    title: "Attack on Titan",
    type: "anime",
    slug: "attack-on-titan",
    inCatalog: true,
    platform: "Crunchyroll / Netflix",
    year: "2013-2023",
    genre: "Anime / Dark Fantasy / Action",
    seasons: 4,
    tag: "Shingeki no Kyojin • Scout Regiment"
  },
  {
    title: "House of the Dragon",
    type: "tv",
    platform: "JioCinema / HBO",
    year: "2022-Present",
    genre: "Action / Adventure / Fantasy",
    seasons: 2,
    tag: "Targaryen Civil War • Dance of the Dragons"
  },
  {
    title: "Better Call Saul",
    type: "tv",
    platform: "Netflix",
    year: "2015-2022",
    genre: "Crime / Legal Drama",
    seasons: 6,
    tag: "Jimmy McGill • Slippin' Jimmy"
  },
  {
    title: "Succession",
    type: "tv",
    platform: "JioCinema / HBO",
    year: "2018-2023",
    genre: "Drama / Satire",
    seasons: 4,
    tag: "Waystar Royco • Logan Roy"
  },
  {
    title: "The Last of Us",
    type: "tv",
    platform: "JioCinema / HBO",
    year: "2023-Present",
    genre: "Post-Apocalyptic / Drama",
    seasons: 1,
    tag: "Cordyceps • Joel & Ellie"
  },
  {
    title: "Chernobyl",
    type: "tv",
    platform: "JioCinema / HBO",
    year: "2019",
    genre: "Historical Drama / Thriller",
    seasons: 1,
    tag: "Prypiat 1986 • Legasov"
  },
  {
    title: "Dark",
    type: "tv",
    platform: "Netflix",
    year: "2017-2020",
    genre: "Sci-Fi / Mystery / Time Travel",
    seasons: 3,
    tag: "Winden • Sic Mundus Creatus Est"
  },
  {
    title: "Severance",
    type: "tv",
    platform: "Apple TV+",
    year: "2022-Present",
    genre: "Sci-Fi / Psychological Thriller",
    seasons: 1,
    tag: "Lumon Industries • Macrodata Refinement"
  },
  {
    title: "Asur: Welcome to Your Dark Side",
    type: "tv",
    platform: "JioCinema",
    year: "2020-Present",
    genre: "Mythological Crime Thriller",
    seasons: 2,
    tag: "Shubh • CBI Forensic Division"
  },
  {
    title: "Farzi",
    type: "tv",
    platform: "Prime Video",
    year: "2023-Present",
    genre: "Crime Thriller",
    seasons: 1,
    tag: "Sunny & Firoz • Supernotes"
  },
  {
    title: "Scam 1992: The Harshad Mehta Story",
    type: "tv",
    platform: "SonyLIV",
    year: "2020",
    genre: "Financial Biography / Drama",
    seasons: 1,
    tag: "Bombay Stock Exchange • The Big Bull"
  },
  {
    title: "Sacred Games",
    type: "tv",
    platform: "Netflix",
    year: "2018-2019",
    genre: "Crime / Noir / Thriller",
    seasons: 2,
    tag: "Ganesh Gaitonde • Sartaj Singh"
  },
  {
    title: "Peaky Blinders",
    type: "tv",
    platform: "Netflix / BBC",
    year: "2013-2022",
    genre: "Period Crime Drama",
    seasons: 6,
    tag: "Thomas Shelby • Birmingham Gangs"
  },
  {
    title: "The Bear",
    type: "tv",
    platform: "Disney+ Hotstar / FX",
    year: "2022-Present",
    genre: "Culinary Drama / Comedy",
    seasons: 3,
    tag: "Carmy Berzatto • Yes Chef!"
  },
  {
    title: "Squid Game",
    type: "tv",
    platform: "Netflix",
    year: "2021-Present",
    genre: "Survival Thriller / Korean Drama",
    seasons: 2,
    tag: "Red Light Green Light • 45.6 Billion Won"
  },
  {
    title: "Money Heist (La Casa de Papel)",
    type: "tv",
    platform: "Netflix",
    year: "2017-2021",
    genre: "Heist / Crime / Thriller",
    seasons: 5,
    tag: "The Professor • Royal Mint of Spain"
  },
  {
    title: "Wednesday",
    type: "tv",
    platform: "Netflix",
    year: "2022-Present",
    genre: "Fantasy / Mystery / Comedy",
    seasons: 1,
    tag: "Nevermore Academy • Thing"
  },
  {
    title: "The Witcher",
    type: "tv",
    platform: "Netflix",
    year: "2019-Present",
    genre: "Action / Dark Fantasy",
    seasons: 3,
    tag: "Geralt of Rivia • Ciri"
  },
  {
    title: "Loki",
    type: "tv",
    platform: "Disney+ Hotstar / Marvel",
    year: "2021-2023",
    genre: "Sci-Fi / Marvel Universe",
    seasons: 2,
    tag: "Time Variance Authority (TVA) • Glorious Purpose"
  },

  // --- ANIME SERIES & FILMS ---
  {
    title: "Death Note",
    type: "anime",
    platform: "Netflix / Crunchyroll",
    year: "2006-2007",
    genre: "Psychological Thriller / Supernatural",
    seasons: 1,
    tag: "Light Yagami (Kira) vs L"
  },
  {
    title: "Demon Slayer: Kimetsu no Yaiba",
    type: "anime",
    platform: "Crunchyroll / Netflix",
    year: "2019-Present",
    genre: "Action / Dark Fantasy / Supernatural",
    seasons: 4,
    tag: "Tanjiro & Nezuko • Hashira Training"
  },
  {
    title: "Jujutsu Kaisen",
    type: "anime",
    platform: "Crunchyroll / Netflix",
    year: "2020-Present",
    genre: "Dark Fantasy / Shonen",
    seasons: 2,
    tag: "Satoru Gojo • Shibuya Incident"
  },
  {
    title: "Naruto / Naruto Shippuden",
    type: "anime",
    platform: "Crunchyroll / Netflix",
    year: "2002-2017",
    genre: "Shonen / Ninja / Adventure",
    seasons: 21,
    tag: "Hidden Leaf Village • Akatsuki"
  },
  {
    title: "One Piece",
    type: "anime",
    platform: "Crunchyroll / Netflix",
    year: "1999-Present",
    genre: "Action / Adventure / Fantasy",
    seasons: 20,
    tag: "Monkey D. Luffy • Grand Line"
  },
  {
    title: "Fullmetal Alchemist: Brotherhood",
    type: "anime",
    platform: "Crunchyroll / Netflix",
    year: "2009-2010",
    genre: "Action / Dark Fantasy / Steampunk",
    seasons: 1,
    tag: "Edward & Alphonse Elric • Philosopher's Stone"
  },
  {
    title: "Chainsaw Man",
    type: "anime",
    platform: "Crunchyroll / Netflix",
    year: "2022-Present",
    genre: "Action / Dark Fantasy / Gore",
    seasons: 1,
    tag: "Denji • Makima • Public Safety"
  },
  {
    title: "Solo Leveling",
    type: "anime",
    platform: "Crunchyroll",
    year: "2024-Present",
    genre: "Action / Fantasy / Isekai",
    seasons: 1,
    tag: "Sung Jinwoo • Shadow Monarch"
  },
  {
    title: "Bleach: Thousand-Year Blood War",
    type: "anime",
    platform: "Disney+ / Hulu / Crunchyroll",
    year: "2022-Present",
    genre: "Supernatural / Action",
    seasons: 3,
    tag: "Ichigo Kurosaki • Quincy Empire"
  },
  {
    title: "Hunter x Hunter",
    type: "anime",
    platform: "Crunchyroll / Netflix",
    year: "2011-2014",
    genre: "Action / Adventure / Fantasy",
    seasons: 6,
    tag: "Gon & Killua • Chimera Ant Arc"
  },
  {
    title: "Vinland Saga",
    type: "anime",
    platform: "Netflix / Crunchyroll",
    year: "2019-Present",
    genre: "Historical Fiction / Viking Epic",
    seasons: 2,
    tag: "Thorfinn Karlsefni • Askeladd"
  },
  {
    title: "Spy x Family",
    type: "anime",
    platform: "Crunchyroll / Netflix",
    year: "2022-Present",
    genre: "Action / Comedy / Espionage",
    seasons: 2,
    tag: "Loid, Yor & Anya Forger • Operation Strix"
  },
  {
    title: "Cyberpunk: Edgerunners",
    type: "anime",
    platform: "Netflix",
    year: "2022",
    genre: "Sci-Fi / Cyberpunk / Action",
    seasons: 1,
    tag: "Night City • David Martinez & Lucy"
  },
  {
    title: "My Hero Academia",
    type: "anime",
    platform: "Crunchyroll / Netflix",
    year: "2016-Present",
    genre: "Superhero / Shonen",
    seasons: 7,
    tag: "Deku • All Might • U.A. High"
  },

  // --- POPULAR MOVIES & FILM FRANCHISES ---
  {
    title: "Inception",
    type: "movie",
    year: "2010",
    genre: "Sci-Fi / Heist / Psychological",
    tag: "Christopher Nolan • Dream within a dream"
  },
  {
    title: "Interstellar",
    type: "movie",
    year: "2014",
    genre: "Sci-Fi / Space Adventure / Drama",
    tag: "Gargantua Black Hole • Cooper & Murph"
  },
  {
    title: "Oppenheimer",
    type: "movie",
    year: "2023",
    genre: "Biographical Drama / History",
    tag: "Manhattan Project • Los Alamos Trinity Test"
  },
  {
    title: "The Dark Knight",
    type: "movie",
    year: "2008",
    genre: "Action / Crime / Drama",
    tag: "Batman vs Joker • Heath Ledger"
  },
  {
    title: "Dune: Part Two",
    type: "movie",
    year: "2024",
    genre: "Sci-Fi / Epic Adventure",
    tag: "Paul Atreides • Arrakis Sandworms"
  },
  {
    title: "Avengers: Endgame",
    type: "movie",
    year: "2019",
    genre: "Action / Sci-Fi / Superhero",
    tag: "Thanos Infinity Snap • Earth's Mightiest Heroes"
  },
  {
    title: "The Matrix",
    type: "movie",
    year: "1999",
    genre: "Sci-Fi / Cyberpunk / Action",
    tag: "Neo • Morpheus • Red or Blue Pill"
  },
  {
    title: "Fight Club",
    type: "movie",
    year: "1999",
    genre: "Drama / Psychological Thriller",
    tag: "Tyler Durden • Project Mayhem"
  },
  {
    title: "The Lord of the Rings: The Fellowship of the Ring",
    type: "movie",
    year: "2001",
    genre: "Fantasy / Epic Adventure",
    tag: "Frodo Baggins • Middle-earth One Ring"
  },
  {
    title: "Harry Potter and the Sorcerer's Stone",
    type: "movie",
    year: "2001",
    genre: "Fantasy / Adventure / Magic",
    tag: "Hogwarts School of Witchcraft and Wizardry"
  },
  {
    title: "Spider-Man: Across the Spider-Verse",
    type: "movie",
    year: "2023",
    genre: "Animation / Action / Sci-Fi",
    tag: "Miles Morales • Gwen Stacy • Multiverse"
  },
  {
    title: "Spirited Away",
    type: "movie",
    year: "2001",
    genre: "Anime / Fantasy / Studio Ghibli",
    tag: "Hayao Miyazaki • Chihiro & Haku"
  },
  {
    title: "Your Name (Kimi no Na wa)",
    type: "movie",
    year: "2016",
    genre: "Anime / Romance / Supernatural",
    tag: "Makoto Shinkai • Taki and Mitsuha"
  },
  {
    title: "RRR",
    type: "movie",
    year: "2022",
    genre: "Action / Period Drama / Epic",
    tag: "Alluri Sitarama Raju & Komaram Bheem"
  },
  {
    title: "K.G.F: Chapter 2",
    type: "movie",
    year: "2022",
    genre: "Action / Period Crime",
    tag: "Rocky Bhai • Kolar Gold Fields"
  },
  {
    title: "Baahubali: The Beginning",
    type: "movie",
    year: "2015",
    genre: "Action / Historical Epic",
    tag: "Mahishmati Kingdom • Why Kattappa Killed Baahubali"
  },
  {
    title: "Kalki 2898 AD",
    type: "movie",
    year: "2024",
    genre: "Sci-Fi / Mythological Epic",
    tag: "Bhairava • Ashwatthama • Kasi"
  },
  {
    title: "Stree 2",
    type: "movie",
    year: "2024",
    genre: "Horror Comedy",
    tag: "Chanderi Village • Sarkata Terror"
  },
  {
    title: "Animal",
    type: "movie",
    year: "2023",
    genre: "Action / Crime / Family Drama",
    tag: "Ranbir Kapoor • Father-Son Obsession"
  },
  {
    title: "Shutter Island",
    type: "movie",
    year: "2010",
    genre: "Psychological Thriller / Mystery",
    tag: "Teddy Daniels • Ashecliffe Hospital"
  },
  {
    title: "Parasite",
    type: "movie",
    year: "2019",
    genre: "Dark Comedy / Thriller",
    tag: "Bong Joon-ho • Kim Family Infiltration"
  }
];
