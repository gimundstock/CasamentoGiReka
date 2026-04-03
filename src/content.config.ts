// ============================================================
// WEDDING CONTENT CONFIGURATION
// Edit this file to customize all wedding details.
// ============================================================

export const CONFIG = {
  // ── Couple ─────────────────────────────────────────────
  couple: {
    bride: 'Ana',
    groom: 'Bruno',
    // Your PIX key: CPF, phone (+55...), email, or random key
    pixKey: 'PLACEHOLDER@email.com',
    // Instagram handles (optional, shown in Couple section)
    brideInstagram: '',
    groomInstagram: '',
  },

  // ── Contact ─────────────────────────────────────────────
  // Email that receives a BCC of every gift purchase and RSVP
  coupleEmail: 'PLACEHOLDER@email.com',

  // ── Apps Script ─────────────────────────────────────────
  // Paste your deployed Apps Script Web App URL here
  appScriptUrl: 'PLACEHOLDER_APPS_SCRIPT_URL',

  // ── Wedding Day ──────────────────────────────────────────
  wedding: {
    date: '2025-12-06', // ISO format YYYY-MM-DD
    time: '17h00',
    venue: 'Nome do Local',
    address: 'Endereço completo, Brasília, DF',
    mapsUrl: 'https://maps.google.com/?q=Brasilia',
    dresscode_pt: 'Traje social — tons terrosos e naturais',
    dresscode_en: 'Smart casual — earth tones and natural colours',
    rsvpDeadline: '2025-11-01', // ISO format YYYY-MM-DD
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
        year: '2025',
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
    { id: 'vegetariano', pt: 'Vegetariano', en: 'Vegetarian' },
    { id: 'infantil', pt: 'Menu Infantil', en: "Children's Menu" },
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
        name: 'Restaurante exemplo',
        cuisine_pt: 'Brasileiro contemporâneo',
        cuisine_en: 'Contemporary Brazilian',
        description_pt: 'Descrição do restaurante...',
        description_en: 'Restaurant description...',
        priceRange: 'R$ 60–120/pessoa',
        address: 'Asa Norte, Brasília',
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
