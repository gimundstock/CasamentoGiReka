// ============================================================
// WEDDING CONTENT CONFIGURATION
// Edit this file to customize all wedding details.
// ============================================================

export const CONFIG = {
  // ── Couple ─────────────────────────────────────────────
  couple: {
    bride: 'Giovanna',
    groom: 'Renato',
    // Your PIX key: CPF, phone (+55...), email, or random key
    pixKey: 'PLACEHOLDER@email.com',
    // Instagram handles (optional, shown in Couple section)
    brideInstagram: '',
    groomInstagram: '',
  },

  // ── Contact ─────────────────────────────────────────────
  // Both emails receive a BCC of every gift purchase and RSVP.
  // Set these same addresses in apps-script/Code.gs → COUPLE_EMAILS.
  coupleEmails: ['gimundstock@gmail.com', 'rekanobre@gmail.com'],

  // ── Apps Script ─────────────────────────────────────────
  // Injected at build time from the VITE_APPSCRIPT_URL env var.
  // Local dev: set it in .env.local (gitignored).
  // CI/CD: set it as a GitHub Actions secret named VITE_APPSCRIPT_URL.
  // See .env.example for the template.
  appScriptUrl: import.meta.env.VITE_APPSCRIPT_URL ?? 'PLACEHOLDER_APPS_SCRIPT_URL',

  // ── Wedding Day ──────────────────────────────────────────
  wedding: {
    date: '2027-04-28', // ISO format YYYY-MM-DD
    time: '17h30',
    venue: 'Nome do Local',
    address: 'Endereço completo, Brasília, DF',
    mapsUrl: 'https://maps.google.com/?q=Brasilia',
    dresscode_pt: 'Traje social — tons terrosos e naturais',
    dresscode_en: 'Smart casual — earth tones and natural colours',
    rsvpDeadline: '2027-02-28', // ISO format YYYY-MM-DD
  },

  // ── Couple Story ─────────────────────────────────────────
  story: {
    // Array of story milestones shown in the Couple section
    milestones: [
      {
        year: '2019',
        title_pt: 'Primeiro encontro',
        title_en: 'First meeting',
        text_pt: 'Texto sobre como se conheceram...',
        text_en: 'Text about how they met...',
      },
      {
        year: '2022',
        title_pt: 'O pedido',
        title_en: 'The proposal',
        text_pt: 'Texto sobre o pedido de casamento...',
        text_en: 'Text about the proposal...',
      },
      {
        year: '2027',
        title_pt: 'A celebração',
        title_en: 'The celebration',
        text_pt: 'E agora chegou a hora de celebrar com todos vocês!',
        text_en: "And now it's time to celebrate with all of you!",
      },
    ],
  },

  // ── RSVP Dinner Menu Options ─────────────────────────────
  menuOptions: [
    { id: 'carne', pt: 'Carne', en: 'Meat' },
    { id: 'peixe', pt: 'Peixe', en: 'Fish' },
    { id: 'vegano', pt: 'Vegano', en: 'Vegan' },
  ],

  // ── Brasília City Guide ───────────────────────────────────
  cityGuide: {
    hotels: [
      {
        name: 'Hotel exemplo 1',
        description_pt: 'Descrição do hotel...',
        description_en: 'Hotel description...',
        stars: 4,
        priceRange: 'R$ 200–350/noite',
        url: '',
        address: 'Setor Hoteleiro Norte, Brasília',
      },
      {
        name: 'Hotel exemplo 2',
        description_pt: 'Descrição do hotel...',
        description_en: 'Hotel description...',
        stars: 3,
        priceRange: 'R$ 120–200/noite',
        url: '',
        address: 'Asa Sul, Brasília',
      },
    ],
    transport: [
      {
        type_pt: 'Aeroporto',
        type_en: 'Airport',
        description_pt:
          'O Aeroporto Internacional de Brasília (BSB) fica a aproximadamente 30 min do centro.',
        description_en:
          'Brasília International Airport (BSB) is about 30 min from the city centre.',
        icon: '✈️',
      },
      {
        type_pt: 'Uber / 99',
        type_en: 'Uber / 99',
        description_pt: 'Uber e 99 funcionam bem em Brasília. Recomendado para se locomover.',
        description_en: 'Uber and 99 work well in Brasília. Recommended for getting around.',
        icon: '🚗',
      },
      {
        type_pt: 'Metrô',
        type_en: 'Metro',
        description_pt: 'O metrô de Brasília cobre as principais regiões. Bilhete único R$ 5.',
        description_en: "Brasília's metro covers the main areas. Single ticket R$ 5.",
        icon: '🚇',
      },
    ],
    restaurants: [
      {
        name: 'Ricco Burger',
        cuisine_pt: 'Hamburguer artesanal',
        cuisine_en: 'Artisan burgers',
        description_pt:
          'Hamburgueria artesanal com o lema "Simples, honesto e memorável", conhecida pelos blends grelhados na brasa, pães brioche e molhos autorais. Eleita o Melhor Hambúrguer de Brasília pela Revista Encontro em 2024.',
        description_en:
          'Artisan burger spot known for its flame-grilled beef blends, brioche buns, and house-made sauces. Named best burger in Brasília by Revista Encontro in 2024.',
        priceRange: 'R$ 80–100/pessoa',
        address: 'Múltiplas unidades — Asa Sul, Asa Norte, Lago Sul e mais',
        url: '',
      },
      {
        name: 'Dog da Igrejinha',
        cuisine_pt: 'Cachorro-quente / lanchonete',
        cuisine_en: 'Hot dogs / casual snack bar',
        description_pt:
          'Fundado em 1995, o Dog da Igrejinha é uma instituição gastronômica de Brasília, famoso pelo cachorro-quente com pasta de alho, bacon, queijo e batata palha. Um ícone cultural da cidade com diversas unidades e presença no aeroporto.',
        description_en:
          'Founded in 1995, Dog da Igrejinha is a Brasília gastronomic institution famed for its hot dogs with signature garlic paste, bacon, cheese, and potato sticks. A true local icon with locations across the city including the international airport.',
        priceRange: 'R$ 20–40/pessoa',
        address: 'Unidade original: Entrequadra Sul 307/308, Asa Sul',
        url: '',
      },
      {
        name: 'Valentina Pizzaria',
        cuisine_pt: 'Pizzaria — massa fina, forno a lenha',
        cuisine_en: 'Pizzeria — thin crust, wood-fired oven',
        description_pt:
          'Em Brasília desde 2006, a Valentina é eleita repetidamente a melhor pizzaria da cidade. Oferece mais de 50 sabores de pizza de massa fina no estilo paulista, assada em forno a lenha, com opções vegetarianas e veganas.',
        description_en:
          "Open since 2006 and repeatedly voted the city's best pizzeria, Valentina serves over 50 flavors of thin-crust, Paulista-style pizza baked in a wood-fired oven, with vegetarian and vegan options.",
        priceRange: 'R$ 60–100/pessoa',
        address: 'Asa Norte: CLN 214 Bloco A — Asa Sul: CLS 310 Bloco A — Lago Sul',
        url: '',
      },
      {
        name: 'Pizzaria Dom Bosco',
        cuisine_pt: 'Pizzaria — pizza por fatia desde 1960',
        cuisine_en: 'Pizzeria — pizza by the slice since 1960',
        description_pt:
          'Fundada em 1960, a Dom Bosco é a mais antiga pizzaria de Brasília — inaugurada no mesmo ano da cidade — e ainda ocupa o endereço original na Asa Sul. O cardápio tem um único sabor: pizza de muçarela, vendida por fatia e acompanhada do tradicional mate gelado.',
        description_en:
          "Founded in 1960, Dom Bosco is Brasília's oldest pizzeria, open since the city's founding year and still at its original address in Asa Sul. Its menu has one offering: mozzarella pizza by the slice served with cold maté tea — a beloved cultural institution.",
        priceRange: 'R$ 10–20/pessoa',
        address: 'CLS 107 Bloco D, Loja 20, Asa Sul (unidade original)',
        url: '',
      },
      {
        name: 'NAU Frutos do Mar',
        cuisine_pt: 'Frutos do mar / culinária brasileira costeira',
        cuisine_en: 'Seafood / Brazilian coastal cuisine',
        description_pt:
          'Eleito repetidamente o melhor restaurante de frutos do mar de Brasília (Veja Brasília 2017–2019), o NAU impressiona pela vista panorâmica do Lago Paranoá e da Ponte JK. Cardápio com camarões, moquecas, peixes e frutos do mar variados.',
        description_en:
          'Repeatedly named the best seafood restaurant in Brasília (Veja Brasília 2017–2019), NAU impresses with panoramic views of Lago Paranoá and the JK Bridge. The menu features shrimp, moquecas, fish, and mixed seafood dishes.',
        priceRange: 'R$ 100–150/pessoa',
        address: 'Setor de Clubes Esportivos Sul, Trecho 2, Conj. 41 — às margens do Lago Paranoá',
        url: '',
      },
    ],
    tourism: [
      {
        name: 'Catedral Metropolitana',
        description_pt: 'Descrição a preencher.',
        description_en: 'Description to be filled.',
        address: 'Eixo Monumental, Brasília, DF',
        url: '',
      },
      {
        name: 'Congresso Nacional',
        description_pt: 'Descrição a preencher.',
        description_en: 'Description to be filled.',
        address: 'Praça dos Três Poderes, Brasília, DF',
        url: '',
      },
      {
        name: 'Torre de TV',
        description_pt: 'Descrição a preencher.',
        description_en: 'Description to be filled.',
        address: 'Eixo Monumental, Brasília, DF',
        url: '',
      },
      {
        name: 'Parque da Cidade Sarah Kubitschek',
        description_pt: 'Descrição a preencher.',
        description_en: 'Description to be filled.',
        address: 'Asa Sul, Brasília, DF',
        url: '',
      },
      {
        name: 'Memorial JK',
        description_pt: 'Descrição a preencher.',
        description_en: 'Description to be filled.',
        address: 'Eixo Monumental, Brasília, DF',
        url: '',
      },
    ],
  },

  // ── Gift Shop ─────────────────────────────────────────────
  // Add your gifts here. Each gift can have one or more cotas (shares).
  // Single-priced gift: one item in cotas array.
  // Multi-share gift: multiple items — guests can buy one or more shares.
  gifts: [
    {
      giftId: 'gift_001',
      name_pt: 'Jogo de Jantar',
      name_en: 'Dinnerware Set',
      description_pt: 'Jogo de jantar completo para 12 pessoas.',
      description_en: 'Complete dinnerware set for 12 people.',
      imageUrl: '/gifts/jantar.jpg',
      cotas: [
        {
          cotaId: 'cota_001_a',
          label_pt: 'Jogo de Jantar Completo',
          label_en: 'Full Dinnerware Set',
          price: 450,
        },
      ],
    },
    {
      giftId: 'gift_002',
      name_pt: 'Lua de Mel',
      name_en: 'Honeymoon',
      description_pt: 'Contribua para a nossa lua de mel inesquecível!',
      description_en: 'Contribute to our unforgettable honeymoon!',
      imageUrl: '/gifts/honeymoon.jpg',
      cotas: [
        {
          cotaId: 'cota_002_a',
          label_pt: 'Noite 1 — Hospedagem',
          label_en: 'Night 1 — Lodging',
          price: 500,
        },
        {
          cotaId: 'cota_002_b',
          label_pt: 'Noite 2 — Hospedagem',
          label_en: 'Night 2 — Lodging',
          price: 500,
        },
        {
          cotaId: 'cota_002_c',
          label_pt: 'Passeios e Aventuras',
          label_en: 'Tours & Adventures',
          price: 800,
        },
        {
          cotaId: 'cota_002_d',
          label_pt: 'Jantar Romântico',
          label_en: 'Romantic Dinner',
          price: 350,
        },
      ],
    },
    {
      giftId: 'gift_003',
      name_pt: 'Air Fryer',
      name_en: 'Air Fryer',
      description_pt: 'Fritadeira elétrica sem óleo, 5L.',
      description_en: 'Oil-free electric air fryer, 5L.',
      imageUrl: '/gifts/airfryer.jpg',
      cotas: [
        { cotaId: 'cota_003_a', label_pt: 'Air Fryer 5L', label_en: 'Air Fryer 5L', price: 380 },
      ],
    },
    {
      giftId: 'gift_004',
      name_pt: 'Jogo de Cama',
      name_en: 'Bed Linen Set',
      description_pt: 'Jogo de cama king size 300 fios, 4 peças.',
      description_en: 'King size bed linen set, 300 thread count, 4 pieces.',
      imageUrl: '/gifts/cama.jpg',
      cotas: [
        {
          cotaId: 'cota_004_a',
          label_pt: 'Jogo de Cama King',
          label_en: 'King Bed Linen Set',
          price: 320,
        },
      ],
    },
    {
      giftId: 'gift_005',
      name_pt: 'Reforma do Lar',
      name_en: 'Home Renovation',
      description_pt: 'Ajude a tornar nosso lar ainda mais especial.',
      description_en: 'Help make our home even more special.',
      imageUrl: '/gifts/reforma.jpg',
      cotas: [
        { cotaId: 'cota_005_a', label_pt: 'Cota R$ 100', label_en: 'R$ 100 Share', price: 100 },
        { cotaId: 'cota_005_b', label_pt: 'Cota R$ 100', label_en: 'R$ 100 Share', price: 100 },
        { cotaId: 'cota_005_c', label_pt: 'Cota R$ 100', label_en: 'R$ 100 Share', price: 100 },
        { cotaId: 'cota_005_d', label_pt: 'Cota R$ 100', label_en: 'R$ 100 Share', price: 100 },
        { cotaId: 'cota_005_e', label_pt: 'Cota R$ 100', label_en: 'R$ 100 Share', price: 100 },
      ],
    },
  ],
}

export type MenuOption = (typeof CONFIG.menuOptions)[number]
export type GiftConfig = (typeof CONFIG.gifts)[number]
export type CotaConfig = (typeof CONFIG.gifts)[number]['cotas'][number]
