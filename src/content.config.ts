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
        name: 'B Hotel Brasília',
        description_pt:
          'Boutique 5 estrelas no Setor Hoteleiro Norte, com rooftop panorâmico, piscina aquecida e decoração contemporânea. A poucos minutos a pé da Esplanada dos Ministérios.',
        description_en:
          'Five-star boutique in the North Hotel Sector with a panoramic rooftop, heated pool, and contemporary design. A short walk from the Esplanada dos Ministérios.',
        stars: 5,
        priceRange: 'R$ 550–850/noite',
        url: '',
        address: 'SHN Quadra 05, Bloco J — Asa Norte',
      },
      {
        name: 'Kubitschek Plaza Hotel',
        description_pt:
          'Clássico renovado no Setor Hoteleiro Norte, com apartamentos espaçosos, piscina coberta e restaurante no topo. Ótima base para explorar o Eixo Monumental.',
        description_en:
          'Renovated classic in the North Hotel Sector with spacious rooms, an indoor pool, and a rooftop restaurant. Great base for exploring the Monumental Axis.',
        stars: 4,
        priceRange: 'R$ 380–600/noite',
        url: '',
        address: 'SHN Quadra 02, Bloco E — Asa Norte',
      },
      {
        name: 'Meliá Brasil 21',
        description_pt:
          'Hotel internacional dentro do complexo Brasil 21, no Setor Hoteleiro Sul, com shopping, restaurantes, academia e spa no próprio prédio. Próximo ao Parque da Cidade.',
        description_en:
          'International hotel inside the Brasil 21 complex in the South Hotel Sector, with shopping, dining, gym, and spa on site. Close to Parque da Cidade.',
        stars: 4,
        priceRange: 'R$ 400–650/noite',
        url: '',
        address: 'SHS Quadra 06, Conj. A, Bloco D — Asa Sul',
      },
      {
        name: 'Ibis Styles Brasília Aeroporto',
        description_pt:
          'Opção econômica ao lado do Aeroporto Internacional (BSB), com café da manhã incluso e shuttle para o terminal. Ideal para chegadas tarde ou voos cedo.',
        description_en:
          'Budget option next to Brasília International Airport (BSB), with breakfast included and a shuttle to the terminal. Ideal for late arrivals or early flights.',
        stars: 3,
        priceRange: 'R$ 220–340/noite',
        url: '',
        address: 'Av. Eixo Sul, Lote 6 — Lago Sul (próximo ao BSB)',
      },
    ],
    transport: [
      {
        type_pt: 'Aeroporto',
        type_en: 'Airport',
        description_pt:
          'O Aeroporto Internacional Juscelino Kubitschek (BSB) fica a cerca de 15 minutos do Plano Piloto. Táxi, Uber e 99 estão disponíveis 24h em frente ao desembarque.',
        description_en:
          'Brasília International Airport (BSB) is about 15 minutes from the Plano Piloto. Taxi, Uber, and 99 are available 24/7 right at the arrivals exit.',
        icon: '✈️',
      },
      {
        type_pt: 'Uber / 99',
        type_en: 'Uber / 99',
        description_pt:
          'Uber e 99 funcionam muito bem em Brasília, com tempo de espera curto e tarifas razoáveis. Nossa principal recomendação para quem não vai alugar carro — cobre aeroporto, hotéis, restaurantes e o local do casamento.',
        description_en:
          'Uber and 99 work great in Brasília, with short wait times and fair fares. Our top pick if you are not renting a car — covers the airport, hotels, restaurants, and the wedding venue.',
        icon: '🚗',
      },
      {
        type_pt: 'Aluguel de carro',
        type_en: 'Car rental',
        description_pt:
          'Brasília é uma cidade feita para carros, com avenidas largas e estacionamento abundante. Se pretendem explorar os arredores (Pirenópolis, Chapada dos Veadeiros), vale a pena alugar — Localiza, Movida e Unidas têm balcões no aeroporto.',
        description_en:
          'Brasília is built for cars, with wide avenues and plenty of free parking. If you plan to explore nearby destinations (Pirenópolis, Chapada dos Veadeiros), renting is worth it — Localiza, Movida, and Unidas have counters at the airport.',
        icon: '🚙',
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
        description_pt:
          'Projetada por Oscar Niemeyer e inaugurada em 1970, a catedral tem 16 colunas curvas formando uma coroa ascendente. Destaques para o teto de vitrais coloridos de Marianne Peretti e os três anjos suspensos de Alfredo Ceschiatti. Entrada gratuita.',
        description_en:
          "Designed by Oscar Niemeyer and inaugurated in 1970, the cathedral's 16 curved columns form an upward-sweeping crown. Highlights include Marianne Peretti's stained-glass ceiling and the three suspended angels by Alfredo Ceschiatti. Free entry.",
        address: 'Esplanada dos Ministérios, Lote 12 — Brasília, DF',
        url: '',
      },
      {
        name: 'Congresso Nacional',
        description_pt:
          'Sede do poder legislativo, com a cúpula côncava da Câmara, a cúpula convexa do Senado e as torres gêmeas — ícone de Niemeyer e Lúcio Costa. Visitas guiadas gratuitas aos finais de semana (agendamento pelo site do Congresso).',
        description_en:
          "Brazil's legislative seat, with the concave House dome, the convex Senate dome, and the twin towers — a Niemeyer & Lúcio Costa icon. Free guided tours on weekends (book via the Congresso website).",
        address: 'Praça dos Três Poderes — Brasília, DF',
        url: '',
      },
      {
        name: 'Torre de TV',
        description_pt:
          'Torre de 224 m projetada por Lúcio Costa, com mirante gratuito a 75 m de altura e vista 360° do Plano Piloto. Aos finais de semana, a feira de artesanato na base é parada obrigatória.',
        description_en:
          'A 224 m tower by Lúcio Costa with a free observation deck at 75 m offering 360° views of the Plano Piloto. The weekend craft fair at the base is a must-stop.',
        address: 'Eixo Monumental — Brasília, DF',
        url: '',
      },
      {
        name: 'Parque da Cidade Sarah Kubitschek',
        description_pt:
          'Um dos maiores parques urbanos do mundo, com cerca de 420 hectares e paisagismo de Burle Marx. Pistas de corrida e ciclismo, kartódromo, lagos artificiais e muito verde no coração da cidade.',
        description_en:
          "One of the world's largest urban parks at ~420 hectares, with landscaping by Burle Marx. Running and cycling paths, a go-kart track, artificial lakes, and lush greenery right in the middle of the city.",
        address: 'Asa Sul — Brasília, DF',
        url: '',
      },
      {
        name: 'Memorial JK',
        description_pt:
          'Mausoléu e museu dedicados a Juscelino Kubitschek, fundador de Brasília. A estátua de JK emoldurada pela nicha curva é um dos cartões-postais da cidade; o museu reúne objetos pessoais, carros e documentos do presidente.',
        description_en:
          "Mausoleum and museum honoring Juscelino Kubitschek, Brasília's founder. The statue of JK framed by a curved niche is one of the city's signature images; the museum holds personal belongings, cars, and documents.",
        address: 'Eixo Monumental Oeste — Brasília, DF',
        url: '',
      },
      {
        name: 'Santuário Dom Bosco',
        description_pt:
          'Igreja de cubos de concreto com vitrais azuis em 12 tons que filtram a luz de maneira impressionante — uma das experiências visuais mais marcantes da cidade, especialmente no fim da tarde.',
        description_en:
          "A church of concrete cubes with twelve shades of blue stained glass that filter the light dramatically — one of the city's most striking visual experiences, especially in the late afternoon.",
        address: 'SEPS 702/902, Conj. A — Asa Sul, Brasília, DF',
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
