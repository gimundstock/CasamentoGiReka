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
    date: '2027-06-05', // ISO format YYYY-MM-DD
    time: '17h30',
    venue: 'Clube do Congresso',
    address: 'SHIN QI 16 Área Especial, Brasília - DF, 71530-200',
    mapsUrl:
      'https://maps.google.com/?q=Clube+do+Congresso+SHIN+QI+16+Área+Especial+Lago+Norte+Brasília+DF+71530-200',
    dresscode_pt: 'Passeio completo',
    dresscode_en: 'Cocktail attire',
    rsvpDeadline: '2027-02-28', // ISO format YYYY-MM-DD
  },

  // ── Couple Story ─────────────────────────────────────────
  // Each milestone has a paired photo shown in the Meet-the-Couple
  // hero. Add a milestone here and drop a matching image in
  // public/photos/ — the hero's reel scales with the array.
  story: {
    milestones: [
      {
        year: '2019',
        title_pt: 'Primeiro encontro',
        title_en: 'First meeting',
        text_pt: 'Texto sobre como se conheceram...',
        text_en: 'Text about how they met...',
        photo: 'couple.jpg',
      },
      {
        year: '2022',
        title_pt: 'O pedido',
        title_en: 'The proposal',
        text_pt: 'Texto sobre o pedido de casamento...',
        text_en: 'Text about the proposal...',
        photo: 'couple2.jpg',
      },
      {
        year: '2027',
        title_pt: 'A celebração',
        title_en: 'The celebration',
        text_pt: 'E agora chegou a hora de celebrar com todos vocês!',
        text_en: "And now it's time to celebrate with all of you!",
        photo: 'couple3.jpg',
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
        priceRange: 'R$ 550–850/noite',
        priceRange_en: '~€90–140/night',
        url: '',
        address: 'SHN Quadra 05, Bloco J — Asa Norte',
      },
      {
        name: 'Kubitschek Plaza Hotel',
        description_pt:
          'Clássico renovado no Setor Hoteleiro Norte, com apartamentos espaçosos, piscina coberta e restaurante no topo. Ótima base para explorar o Eixo Monumental.',
        description_en:
          'Renovated classic in the North Hotel Sector with spacious rooms, an indoor pool, and a rooftop restaurant. Great base for exploring the Monumental Axis.',
        priceRange: 'R$ 380–600/noite',
        priceRange_en: '~€65–100/night',
        url: '',
        address: 'SHN Quadra 02, Bloco E — Asa Norte',
      },
      {
        name: 'Meliá Brasil 21',
        description_pt:
          'Hotel internacional dentro do complexo Brasil 21, no Setor Hoteleiro Sul, com shopping, restaurantes, academia e spa no próprio prédio. Próximo ao Parque da Cidade.',
        description_en:
          'International hotel inside the Brasil 21 complex in the South Hotel Sector, with shopping, dining, gym, and spa on site. Close to Parque da Cidade.',
        priceRange: 'R$ 400–650/noite',
        priceRange_en: '~€65–110/night',
        url: '',
        address: 'SHS Quadra 06, Conj. A, Bloco D — Asa Sul',
      },
      {
        name: 'Ibis Styles Brasília Aeroporto',
        description_pt:
          'Opção econômica ao lado do Aeroporto Internacional (BSB), com café da manhã incluso e shuttle para o terminal. Ideal para chegadas tarde ou voos cedo.',
        description_en:
          'Budget option next to Brasília International Airport (BSB), with breakfast included and a shuttle to the terminal. Ideal for late arrivals or early flights.',
        priceRange: 'R$ 220–340/noite',
        priceRange_en: '~€35–55/night',
        url: '',
        address: 'Av. Eixo Sul, Lote 6 — Lago Sul (próximo ao BSB)',
      },
      {
        name: 'Brasília Palace Hotel',
        description_pt:
          'O primeiro hotel de Brasília, projetado por Oscar Niemeyer e inaugurado em 1958, à beira do Lago Paranoá. Totalmente restaurado, une arquitetura modernista histórica a um serviço cinco estrelas.',
        description_en:
          "Brasília's first hotel, designed by Oscar Niemeyer and opened in 1958 on the shore of Lake Paranoá. Fully restored, it pairs historic modernist architecture with five-star service.",
        priceRange: 'a partir de R$ 370/noite',
        priceRange_en: 'from ~€60/night',
        url: '',
        address: 'Setor de Hotéis e Turismo Norte — Asa Norte, Brasília, DF',
      },
    ],
    transport: [
      {
        type_pt: 'Aeroporto',
        type_en: 'Airport',
        description_pt:
          'O Aeroporto Internacional Juscelino Kubitschek (BSB) fica a cerca de 15 minutos do Plano Piloto. O Uber está disponível 24h em frente ao desembarque.',
        description_en:
          'Brasília International Airport (BSB) is about 15 minutes from the Plano Piloto (City center). Uber is available 24/7 right at the arrivals exit.',
        icon: '✈️',
      },
      {
        type_pt: 'Uber',
        type_en: 'Uber',
        description_pt:
          'O Uber funciona muito bem em Brasília, com tempo de espera curto e tarifas razoáveis. Nossa principal recomendação para quem não vai alugar carro — cobre aeroporto, hotéis, restaurantes e o local do casamento.',
        description_en:
          'Uber works great in Brasília, with short wait times and fair fares. Our top pick if you are not renting a car — covers the airport, hotels, restaurants, and the wedding venue.',
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
        priceRange_en: '~€13–17/person',
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
        priceRange_en: '~€3–7/person',
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
        priceRange_en: '~€10–17/person',
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
        priceRange_en: '~€2–3/person',
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
        priceRange_en: '~€17–25/person',
        address: 'Setor de Clubes Esportivos Sul, Trecho 2, Conj. 41 — às margens do Lago Paranoá',
        url: '',
      },
      {
        name: 'Fausto & Manuel',
        cuisine_pt: 'Restaurante',
        cuisine_en: 'Restaurant',
        description_pt: 'Uma das nossas indicações em Brasília para quem quer sentar e comer bem.',
        description_en: 'One of our picks in Brasília for a proper sit-down meal.',
        priceRange: '',
        priceRange_en: '',
        address: 'Brasília, DF',
        url: '',
      },
      {
        name: 'Sweet Cake',
        cuisine_pt: 'Confeitaria',
        cuisine_en: 'Bakery & sweets',
        description_pt: 'Para a hora do café ou da sobremesa: bolos e doces que valem a parada.',
        description_en: 'For coffee or dessert time: cakes and sweets worth a stop.',
        priceRange: '',
        priceRange_en: '',
        address: 'Brasília, DF',
        url: '',
      },
      {
        name: 'Açaí Puríssimo',
        cuisine_pt: 'Açaí',
        cuisine_en: 'Açaí',
        description_pt:
          'Açaí na tigela para refrescar o calor de Brasília — uma pausa leve entre um passeio e outro.',
        description_en:
          'Açaí bowls to cool down in the Brasília heat — a light break between sights.',
        priceRange: '',
        priceRange_en: '',
        address: 'Brasília, DF',
        url: '',
      },
      {
        name: 'Don Durica',
        cuisine_pt: 'Restaurante',
        cuisine_en: 'Restaurant',
        description_pt: 'Mais uma indicação nossa para comer bem na cidade.',
        description_en: 'Another of our picks for a good meal in the city.',
        priceRange: '',
        priceRange_en: '',
        address: 'Brasília, DF',
        url: '',
      },
      {
        name: 'Pastel Mix',
        cuisine_pt: 'Pastelaria',
        cuisine_en: 'Pastry shop',
        description_pt: 'Pastéis para um lanche rápido e saboroso entre um passeio e outro.',
        description_en: 'Pastéis for a quick, tasty snack between sights.',
        priceRange: '',
        priceRange_en: '',
        address: 'Brasília, DF',
        url: '',
      },
      {
        name: 'Café e um Chero',
        cuisine_pt: 'Café',
        cuisine_en: 'Café',
        description_pt: 'Um café para a pausa da tarde, com bom cafezinho e algo para beliscar.',
        description_en:
          'A café for the afternoon break, with good coffee and something to nibble on.',
        priceRange: '',
        priceRange_en: '',
        address: 'Brasília, DF',
        url: '',
      },
      {
        name: 'Xique Xique',
        cuisine_pt: 'Restaurante',
        cuisine_en: 'Restaurant',
        description_pt: 'Mais uma indicação nossa para uma refeição com sabor de Brasília.',
        description_en: 'Another of our picks for a meal with a Brasília flavour.',
        priceRange: '',
        priceRange_en: '',
        address: 'Brasília, DF',
        url: '',
      },
      {
        name: 'Galeteria do Lago Norte',
        cuisine_pt: 'Galeteria',
        cuisine_en: 'Roast chicken house',
        description_pt:
          'Galeto assado, no estilo da casa, à beira do Lago Norte — bom para almoçar em grupo.',
        description_en:
          'Roast chicken, house style, in the Lago Norte area — good for a group lunch.',
        priceRange: '',
        priceRange_en: '',
        address: 'Lago Norte — Brasília, DF',
        url: '',
      },
      {
        name: 'Mangai',
        cuisine_pt: 'Comida nordestina',
        cuisine_en: 'Northeastern Brazilian',
        description_pt:
          'Sabores do Nordeste num buffet farto, com pratos regionais para provar de tudo um pouco — uma boa pedida para o almoço.',
        description_en:
          'Flavours of the Brazilian Northeast in a generous buffet, with regional dishes to sample a bit of everything — a good lunch option.',
        priceRange: 'R$ 60/kg',
        priceRange_en: '~€10/kg',
        address: 'Brasília, DF',
        url: '',
      },
      {
        name: 'Coco Bambu',
        cuisine_pt: 'Frutos do mar',
        cuisine_en: 'Seafood',
        description_pt:
          'Restaurante de frutos do mar com pratos para dividir, camarões e peixes, num ambiente amplo — boa opção para um jantar em grupo.',
        description_en:
          'A seafood restaurant with shareable dishes, shrimp and fish in a spacious setting — a good option for a group dinner.',
        priceRange: 'R$ 140–160/pessoa',
        priceRange_en: '~€23–27/person',
        address: 'Brasília, DF',
        url: '',
      },
      {
        name: 'Santé',
        cuisine_pt: 'Restaurante',
        cuisine_en: 'Restaurant',
        description_pt: 'Mais uma indicação nossa para uma boa refeição em Brasília.',
        description_en: 'Another of our picks for a good meal in Brasília.',
        priceRange: '',
        priceRange_en: '',
        address: 'Brasília, DF',
        url: '',
      },
      {
        name: 'Avenida Paulista',
        cuisine_pt: 'Restaurante',
        cuisine_en: 'Restaurant',
        description_pt: 'Mais uma indicação nossa para comer bem na cidade.',
        description_en: 'Another of our picks for a good meal in the city.',
        priceRange: '',
        priceRange_en: '',
        address: 'Brasília, DF',
        url: '',
      },
      {
        name: 'Libanus',
        cuisine_pt: 'Culinária libanesa',
        cuisine_en: 'Lebanese',
        description_pt:
          'Culinária libanesa tradicional, com esfihas, quibes, homus e outros pratos árabes para dividir à mesa.',
        description_en:
          'Traditional Lebanese cooking, with esfihas, kibbeh, hummus and other Middle Eastern dishes to share at the table.',
        priceRange: '',
        priceRange_en: '',
        address: 'Brasília, DF',
        url: '',
      },
      {
        name: 'Nazô',
        cuisine_pt: 'Restaurante',
        cuisine_en: 'Restaurant',
        description_pt: 'Mais uma indicação nossa para comer bem na cidade.',
        description_en: 'Another of our picks for a good meal in the city.',
        priceRange: '',
        priceRange_en: '',
        address: 'Brasília, DF',
        url: '',
      },
      {
        name: 'Churrascaria Pampas',
        cuisine_pt: 'Churrascaria',
        cuisine_en: 'Steakhouse',
        description_pt:
          'Churrascaria de rodízio, com carnes servidas à mesa e buffet — boa pedida para quem quer provar o churrasco brasileiro.',
        description_en:
          'A rodízio steakhouse, with meats carved at the table and a buffet — a good pick for anyone who wants to try Brazilian barbecue.',
        priceRange: 'R$ 60–70/pessoa',
        priceRange_en: '~€10–12/person',
        address: 'Brasília, DF',
        url: '',
      },
      {
        name: 'Costelão de Chão no CTG',
        cuisine_pt: 'Churrasco gaúcho',
        cuisine_en: 'Gaúcho barbecue',
        description_pt:
          'Costelão assado no chão, à moda gaúcha, no Centro de Tradições Gaúchas. Acontece uma vez por mês — confirme a data antes de ir.',
        description_en:
          'Beef ribs roasted over embers on the ground, gaúcho style, at the Centro de Tradições Gaúchas (CTG). It happens once a month — please check the date before you go.',
        priceRange: '',
        priceRange_en: '',
        address: 'CTG — Brasília, DF',
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
      {
        name: 'Chapada Imperial',
        description_pt:
          'Refúgio de natureza em Padre Bernardo (GO), a cerca de uma hora de Brasília: cachoeiras, piscinas naturais e trilhas entre o cerrado e a mata. Um bate-volta fácil para quem quer respirar fora da cidade.',
        description_en:
          'A nature retreat in Padre Bernardo (GO), about an hour from Brasília: waterfalls, natural pools and trails through the cerrado and forest. An easy day trip for anyone who wants a break from the city.',
        address: 'Padre Bernardo, GO',
        url: '',
      },
      {
        name: 'Chapada dos Veadeiros',
        description_pt:
          'Um dos destinos mais emblemáticos do cerrado, em Alto Paraíso de Goiás, a cerca de 3h30 de Brasília. Parque Nacional com cachoeiras, cânions, o Vale da Lua e trilhas de tirar o fôlego. Vale pelo menos uma noite na região.',
        description_en:
          "One of the cerrado's most iconic destinations, in Alto Paraíso de Goiás, about 3.5 hours from Brasília. A national park of waterfalls, canyons, the Vale da Lua and breathtaking trails. Worth at least one night in the area.",
        address: 'Alto Paraíso de Goiás, GO',
        url: '',
      },
      {
        name: 'Pirenópolis',
        description_pt:
          'Cidade histórica de ruas de pedra e casarios coloridos, a cerca de 2h30 de Brasília. Centro histórico encantador, boa gastronomia e cachoeiras e rios nos arredores — ótimo para um fim de semana.',
        description_en:
          'A historic town of cobbled streets and colourful colonial houses, about 2.5 hours from Brasília. A charming old centre, good food, and waterfalls and rivers nearby — great for a weekend.',
        address: 'Pirenópolis, GO',
        url: '',
      },
      {
        name: 'Pontão do Lago Sul',
        description_pt:
          'Complexo de lazer à beira do Lago Paranoá, com restaurantes, bares e uma das vistas mais bonitas do pôr do sol da cidade. Ótimo para um fim de tarde ou jantar com vista para o lago. Foi também onde o Renato pediu a Giovanna em namoro.',
        description_en:
          "A leisure complex on the shore of Lake Paranoá, with restaurants, bars and one of the city's best sunset views. Ideal for a late afternoon or a dinner overlooking the lake. It is also where Renato asked Giovanna to be his girlfriend.",
        address: 'SHIS QL 10, Lago Sul — Brasília, DF',
        url: '',
      },
      {
        name: 'CCBB Brasília',
        description_pt:
          'Centro Cultural Banco do Brasil, com exposições, teatro, cinema e música em um prédio modernista de frente para o Lago Paranoá. Vale conferir a programação antes da visita.',
        description_en:
          'The Banco do Brasil Cultural Centre, with exhibitions, theatre, cinema and music in a modernist building facing Lake Paranoá. Worth checking the programme before you visit.',
        address: 'SCES Trecho 2, Lote 22 — Brasília, DF',
        url: '',
      },
      {
        name: 'Ponte JK',
        description_pt:
          'Ponte sobre o Lago Paranoá, inaugurada em 2002, com três arcos de aço que se cruzam sobre o tabuleiro — um dos cartões-postais de Brasília, ainda mais bonita iluminada à noite.',
        description_en:
          "A bridge over Lake Paranoá, opened in 2002, with three steel arches crossing over the deck — one of Brasília's postcard views, even lovelier lit up at night.",
        address: 'Lago Sul / Lago Norte — Brasília, DF',
        url: '',
      },
      {
        name: 'Festa Junina',
        description_pt:
          'Em junho, as festas juninas animam as igrejas da cidade, com quadrilha, comidas típicas, fogueira e muita música. Nossa data cai bem nessa época, então elas devem estar acontecendo — e, mais perto do casamento, atualizamos aqui com o calendário. Foi numa festa junina que aconteceu o primeiro encontro do Renato e da Giovanna.',
        description_en:
          "In June, festas juninas liven up the city's churches, with square dancing, traditional food, bonfires and lots of music. Our date falls in that season, so they should be on — and closer to the wedding we will update this with the calendar. A festa junina is where Renato and Giovanna had their first date.",
        address: 'Igrejas de Brasília, DF',
        url: '',
      },
      {
        name: 'Igrejinha Nossa Senhora de Fátima',
        description_pt:
          'A primeira igreja de Brasília, projetada por Niemeyer em 1958, com azulejos de Athos Bulcão e um telhado em forma de chapéu. Pequena e encantadora, é uma das paradas obrigatórias do Plano Piloto.',
        description_en:
          "Brasília's first church, designed by Niemeyer in 1958, with Athos Bulcão tiles and a distinctive hat-shaped roof. Small and charming, it is one of the must-see stops in the Plano Piloto.",
        address: 'EQS 307/308 — Asa Sul, Brasília, DF',
        url: '',
      },
      {
        name: 'Quadra Modelo (308 Sul)',
        description_pt:
          'A superquadra-modelo do plano de Lúcio Costa, com blocos residenciais baixos entre árvores, comércio local e a Igrejinha. Dá uma boa ideia de como é morar no Plano Piloto — vale uma caminhada.',
        description_en:
          "The model superquadra of Lúcio Costa's plan, with low residential blocks among trees, local shops and the little church. It gives a good sense of what living in the Plano Piloto is like — worth a walk.",
        address: 'SQS 308 — Asa Sul, Brasília, DF',
        url: '',
      },
      {
        name: 'UnB — Campus Darcy Ribeiro',
        description_pt:
          'A Universidade de Brasília, criada em 1962, com o campus Darcy Ribeiro na Asa Norte: o Minhocão, o Instituto Central de Ciências e o lago. Um campus lindo, aberto e cheio de árvores, ótimo para passear. Foi lá que a Giovanna e o Renato se conheceram.',
        description_en:
          'The University of Brasília, founded in 1962, with the Darcy Ribeiro campus in the Asa Norte: the long Minhocão building, the Central Institute of Sciences and the lake. A beautiful, open campus full of trees, lovely for a stroll. It is where Giovanna and Renato met.',
        address: 'Campus Darcy Ribeiro — Asa Norte, Brasília, DF',
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
    {
      giftId: 'gift_006',
      name_pt: 'Jogo de Toalhas',
      name_en: 'Towel Set',
      description_pt: 'Jogo de toalhas de banho macias e felpudas.',
      description_en: 'Soft, fluffy bath towel set.',
      imageUrl: '/gifts/toalhas.jpg',
      cotas: [
        {
          cotaId: 'cota_006_a',
          label_pt: 'Jogo de Toalhas',
          label_en: 'Towel Set',
          price: 350,
        },
      ],
    },
    {
      giftId: 'gift_007',
      name_pt: 'Tapetes para Casa',
      name_en: 'Home Rugs',
      description_pt: 'Tapetes para deixar nosso lar mais aconchegante.',
      description_en: 'Rugs to make our home cozier.',
      imageUrl: '/gifts/tapetes.jpg',
      cotas: [
        {
          cotaId: 'cota_007_a',
          label_pt: 'Tapetes para Casa',
          label_en: 'Home Rugs',
          price: 450,
        },
      ],
    },
    {
      giftId: 'gift_008',
      name_pt: 'Bike Elétrica',
      name_en: 'Electric Bike',
      description_pt: 'Ajude a gente a pedalar por Brasília em uma bike elétrica!',
      description_en: 'Help us ride around Brasília on an electric bike!',
      imageUrl: '/gifts/bike.jpg',
      cotas: [
        {
          cotaId: 'cota_008_01',
          label_pt: 'Cota R$ 100',
          label_en: 'R$ 100 Share',
          price: 100,
        },
        {
          cotaId: 'cota_008_02',
          label_pt: 'Cota R$ 100',
          label_en: 'R$ 100 Share',
          price: 100,
        },
        {
          cotaId: 'cota_008_03',
          label_pt: 'Cota R$ 100',
          label_en: 'R$ 100 Share',
          price: 100,
        },
        {
          cotaId: 'cota_008_04',
          label_pt: 'Cota R$ 100',
          label_en: 'R$ 100 Share',
          price: 100,
        },
        {
          cotaId: 'cota_008_05',
          label_pt: 'Cota R$ 100',
          label_en: 'R$ 100 Share',
          price: 100,
        },
        {
          cotaId: 'cota_008_06',
          label_pt: 'Cota R$ 100',
          label_en: 'R$ 100 Share',
          price: 100,
        },
        {
          cotaId: 'cota_008_07',
          label_pt: 'Cota R$ 100',
          label_en: 'R$ 100 Share',
          price: 100,
        },
        {
          cotaId: 'cota_008_08',
          label_pt: 'Cota R$ 100',
          label_en: 'R$ 100 Share',
          price: 100,
        },
        {
          cotaId: 'cota_008_09',
          label_pt: 'Cota R$ 100',
          label_en: 'R$ 100 Share',
          price: 100,
        },
        {
          cotaId: 'cota_008_10',
          label_pt: 'Cota R$ 100',
          label_en: 'R$ 100 Share',
          price: 100,
        },
        {
          cotaId: 'cota_008_11',
          label_pt: 'Cota R$ 100',
          label_en: 'R$ 100 Share',
          price: 100,
        },
        {
          cotaId: 'cota_008_12',
          label_pt: 'Cota R$ 100',
          label_en: 'R$ 100 Share',
          price: 100,
        },
        {
          cotaId: 'cota_008_13',
          label_pt: 'Cota R$ 100',
          label_en: 'R$ 100 Share',
          price: 100,
        },
        {
          cotaId: 'cota_008_14',
          label_pt: 'Cota R$ 100',
          label_en: 'R$ 100 Share',
          price: 100,
        },
        {
          cotaId: 'cota_008_15',
          label_pt: 'Cota R$ 100',
          label_en: 'R$ 100 Share',
          price: 100,
        },
        {
          cotaId: 'cota_008_16',
          label_pt: 'Cota R$ 100',
          label_en: 'R$ 100 Share',
          price: 100,
        },
        {
          cotaId: 'cota_008_17',
          label_pt: 'Cota R$ 100',
          label_en: 'R$ 100 Share',
          price: 100,
        },
        {
          cotaId: 'cota_008_18',
          label_pt: 'Cota R$ 100',
          label_en: 'R$ 100 Share',
          price: 100,
        },
        {
          cotaId: 'cota_008_19',
          label_pt: 'Cota R$ 100',
          label_en: 'R$ 100 Share',
          price: 100,
        },
        {
          cotaId: 'cota_008_20',
          label_pt: 'Cota R$ 100',
          label_en: 'R$ 100 Share',
          price: 100,
        },
        {
          cotaId: 'cota_008_21',
          label_pt: 'Cota R$ 100',
          label_en: 'R$ 100 Share',
          price: 100,
        },
        {
          cotaId: 'cota_008_22',
          label_pt: 'Cota R$ 100',
          label_en: 'R$ 100 Share',
          price: 100,
        },
        {
          cotaId: 'cota_008_23',
          label_pt: 'Cota R$ 100',
          label_en: 'R$ 100 Share',
          price: 100,
        },
        {
          cotaId: 'cota_008_24',
          label_pt: 'Cota R$ 100',
          label_en: 'R$ 100 Share',
          price: 100,
        },
        {
          cotaId: 'cota_008_25',
          label_pt: 'Cota R$ 100',
          label_en: 'R$ 100 Share',
          price: 100,
        },
        {
          cotaId: 'cota_008_26',
          label_pt: 'Cota R$ 100',
          label_en: 'R$ 100 Share',
          price: 100,
        },
        {
          cotaId: 'cota_008_27',
          label_pt: 'Cota R$ 100',
          label_en: 'R$ 100 Share',
          price: 100,
        },
        {
          cotaId: 'cota_008_28',
          label_pt: 'Cota R$ 100',
          label_en: 'R$ 100 Share',
          price: 100,
        },
        {
          cotaId: 'cota_008_29',
          label_pt: 'Cota R$ 100',
          label_en: 'R$ 100 Share',
          price: 100,
        },
        {
          cotaId: 'cota_008_30',
          label_pt: 'Cota R$ 100',
          label_en: 'R$ 100 Share',
          price: 100,
        },
      ],
    },
    {
      giftId: 'gift_009',
      name_pt: 'Suporte e Banquinho de Piano',
      name_en: 'Piano Stand and Bench',
      description_pt: 'Suporte e banquinho para o nosso piano.',
      description_en: 'Stand and bench for our piano.',
      imageUrl: '/gifts/piano.jpg',
      cotas: [
        {
          cotaId: 'cota_009_a',
          label_pt: 'Suporte e Banquinho de Piano',
          label_en: 'Piano Stand and Bench',
          price: 600,
        },
      ],
    },
    {
      giftId: 'gift_010',
      name_pt: 'Banco de Madeira',
      name_en: 'Wooden Bench',
      description_pt: 'Banco de madeira para a nossa casa.',
      description_en: 'A wooden bench for our home.',
      imageUrl: '/gifts/banco.jpg',
      cotas: [
        {
          cotaId: 'cota_010_a',
          label_pt: 'Banco de Madeira',
          label_en: 'Wooden Bench',
          price: 300,
        },
      ],
    },
    {
      giftId: 'gift_011',
      name_pt: 'Estante de Madeira',
      name_en: 'Wooden Bookshelf',
      description_pt: 'Estante de madeira para os nossos livros e lembranças.',
      description_en: 'A wooden bookshelf for our books and keepsakes.',
      imageUrl: '/gifts/estante.jpg',
      cotas: [
        {
          cotaId: 'cota_011_a',
          label_pt: 'Estante de Madeira',
          label_en: 'Wooden Bookshelf',
          price: 400,
        },
      ],
    },
    {
      giftId: 'gift_012',
      name_pt: 'Tapete para o Escritório',
      name_en: 'Office Rug',
      description_pt: 'Tapete para deixar o nosso escritório mais aconchegante.',
      description_en: 'A rug to make our office cozier.',
      imageUrl: '/gifts/tapete-escritorio.jpg',
      cotas: [
        {
          cotaId: 'cota_012_a',
          label_pt: 'Tapete para o Escritório',
          label_en: 'Office Rug',
          price: 300,
        },
      ],
    },
    {
      giftId: 'gift_013',
      name_pt: 'Tapete para o Hall',
      name_en: 'Hall Rug',
      description_pt: 'Tapete para receber as visitas no hall de entrada.',
      description_en: 'A rug to welcome guests in our entrance hall.',
      imageUrl: '/gifts/tapete-hall.jpg',
      cotas: [
        {
          cotaId: 'cota_013_a',
          label_pt: 'Tapete para o Hall',
          label_en: 'Hall Rug',
          price: 300,
        },
      ],
    },
    {
      giftId: 'gift_014',
      name_pt: 'Espelho para o Hall',
      name_en: 'Hall Mirror',
      description_pt: 'Espelho para o hall de entrada da nossa casa.',
      description_en: 'A mirror for the entrance hall of our home.',
      imageUrl: '/gifts/espelho-hall.jpg',
      cotas: [
        {
          cotaId: 'cota_014_a',
          label_pt: 'Espelho para o Hall',
          label_en: 'Hall Mirror',
          price: 400,
        },
      ],
    },
    {
      giftId: 'gift_015',
      name_pt: 'Jantar Romântico',
      name_en: 'Romantic Dinner',
      description_pt: 'Um jantar a dois para celebrar o começo da nossa vida juntos.',
      description_en: 'A dinner for two to celebrate the start of our life together.',
      imageUrl: '/gifts/jantar-romantico.jpg',
      cotas: [
        {
          cotaId: 'cota_015_a',
          label_pt: 'Jantar Romântico',
          label_en: 'Romantic Dinner',
          price: 350,
        },
      ],
    },
  ],
}

export type MenuOption = (typeof CONFIG.menuOptions)[number]
export type GiftConfig = (typeof CONFIG.gifts)[number]
export type CotaConfig = (typeof CONFIG.gifts)[number]['cotas'][number]
