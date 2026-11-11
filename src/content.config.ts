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

  // ── PayPal (guests paying from abroad) ──────────────────
  // The couple's EU PayPal account charges in euros. The Client ID is public
  // and injected from VITE_PAYPAL_CLIENT_ID (.env.local / GitHub secret); the
  // Secret lives only in the Apps Script's Script Properties. Without a
  // Client ID the PayPal option is hidden and only PIX is offered.
  paypal: {
    clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID ?? '',
    currency: 'EUR',
    // Euros per real, fixed so prices don't move day to day. Each cota's
    // BRL price × this rate, rounded to whole euros, is what PayPal charges.
    eurPerBrl: 0.16,
  },

  // ── Wedding Day ──────────────────────────────────────────
  wedding: {
    date: '2027-06-05', // ISO format YYYY-MM-DD
    time: '15h30',
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
        year: '2016',
        title_pt: 'Primeira vista',
        title_en: 'First sight',
        text_pt:
          'Nossa história começou em 2016, na Universidade de Brasília. Entre as cansativas aulas de Design e Computação, nossos caminhos se cruzavam no Centro Acadêmico de Desenho Industrial, onde cada um se reunia com seus amigos. Entre encontros casuais, olhares trocados e uma boa dose de falta de iniciativa, foi só em 2019 que um match no Tinder deu o empurrãozinho que faltava para nossa história começar.',
        text_en:
          'Our story began in 2016, at the University of Brasília. Between long, tiring Design and Computer Science classes, our paths kept crossing at the Industrial Design student lounge, where each of us met up with our friends. After chance encounters, exchanged glances and a good dose of shyness on both sides, it took until 2019 for a Tinder match to give us the nudge we needed for our story to begin.',
        photo: 'couple3.jpg',
      },
      {
        year: '2019',
        title_pt: 'Primeiro encontro',
        title_en: 'First date',
        text_pt:
          'Depois de quatro meses de conversas e alguns imprevistos, nosso primeiro encontro finalmente aconteceu em uma festa junina! Giovanna tentou arrastar Renato para a quadrilha, sem sucesso. Mas conseguimos nossa primeira dança, com direito a uma pequena aula improvisada. A noite foi tão especial que, assim que Renato chegou em casa, já estava mandando mensagem para marcar o próximo encontro.',
        text_en:
          "After four months of talking and a few setbacks, our first date finally happened at a festa junina, Brazil's June festival! Giovanna tried to drag Renato into the quadrilha, the traditional square dance, with no luck. But we did get our first dance, complete with a little improvised lesson. The night was so special that, as soon as Renato got home, he was already texting to set up the next date.",
        photo: 'festa-junina.jpg',
      },
      {
        year: '2021',
        title_pt: 'Vida a dois',
        title_en: 'Life together',
        text_pt:
          'Depois de apenas um ano juntos, tomamos coragem para dar dois grandes passos: morar juntos e mudar de país! De malas prontas e corações cheios de sonhos, partimos para Milão, que se tornou nosso lar e ponto de partida para aventuras, descobertas e amizades incríveis. Anos depois, seguimos para Luxemburgo, onde continuamos construindo nossa vida e descobrindo que lar é onde estamos juntos.',
        text_en:
          'After just one year together, we found the courage to take two big steps: moving in together and moving abroad! Bags packed and hearts full of dreams, we left for Milan, which became our home and the starting point for adventures, discoveries and amazing friendships. Years later, we moved on to Luxembourg, where we keep building our life and learning that home is wherever we are together.',
        photo: 'milao.jpg',
      },
      {
        year: '2025',
        title_pt: 'O pedido',
        title_en: 'The proposal',
        text_pt:
          'Renato preparou o pedido durante uma viagem romântica a Maiorca, em um piquenique boho no alto de uma colina, com vista para o mar ao pôr do sol. Fingiu tirar uma foto de Giovanna olhando para o horizonte, enquanto escondia a aliança na própria mão. Quando ela se virou para conferir a foto, ele já estava de joelhos. Giovanna já desconfiava... mas isso não tornou o momento menos mágico. E, claro, ela disse sim!',
        text_en:
          "Renato planned the proposal during a romantic trip to Mallorca: a boho picnic on a hilltop, overlooking the sea at sunset. He pretended to take a photo of Giovanna gazing at the horizon while hiding the ring in his own hand. When she turned around to check the photo, he was already on one knee. Giovanna had her suspicions… but that didn't make the moment any less magical. And, of course, she said yes!",
        photo: 'proposta.jpg',
      },
      {
        year: '2027',
        title_pt: 'A celebração',
        title_en: 'The celebration',
        text_pt:
          'Depois de tantos encontros, aventuras e sonhos compartilhados, chegou a hora de celebrar um novo capítulo da nossa história! Estamos preparando cada detalhe com muito amor e carinho, sonhando com uma celebração acolhedora, cheia de alegria e afeto. Mais do que celebrar nossa união, queremos compartilhar esse momento com as famílias e os amigos que fazem parte da nossa história. Afinal, o amor é ainda mais bonito quando celebrado juntos.',
        text_en:
          "After so many encounters, adventures and shared dreams, it's time to celebrate a new chapter of our story! We are preparing every detail with love and care, dreaming of a warm celebration full of joy and affection. More than celebrating our union, we want to share this moment with the families and friends who are part of our story. After all, love is even more beautiful when celebrated together.",
        photo: 'couple.jpg',
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
      {
        name: 'Flat à Beira do Lago — Setor de Clubes Sul (Airbnb)',
        description_pt:
          'Apartamento inteiro de 51 m² com varanda e vista para o Lago Paranoá, para até 3 pessoas: um quarto, sofá-cama na sala e um banheiro. O prédio tem piscina, sauna, academia e jacuzzi. Nota 4,78 em mais de 580 avaliações no Airbnb. A cerca de 10 minutos da Esplanada dos Ministérios.',
        description_en:
          'An entire 51 m² apartment with a balcony and views over Lake Paranoá, sleeping up to 3: one bedroom, a sofa bed in the living room and one bathroom. The building has a pool, sauna, gym and jacuzzi. Rated 4.78 across 580+ reviews on Airbnb. About 10 minutes from the Esplanada dos Ministérios.',
        priceRange: '',
        priceRange_en: '',
        url: 'https://www.airbnb.com.br/rooms/17530522',
        address: 'Setor de Clubes Sul — Brasília, DF',
      },
      {
        name: 'Life Resort — Vista do Lago (Airbnb)',
        description_pt:
          'Flat inteiro para 2 pessoas no Setor Hoteleiro Norte, com varanda de frente para o lago, cozinha, Wi-Fi e uma vaga de garagem coberta gratuita. O resort tem piscina aquecida, restaurantes e mercadinho. Favorito dos hóspedes no Airbnb, nota 4,82 em mais de 460 avaliações.',
        description_en:
          'An entire flat for 2 in the North Hotel Sector, with a lakefront balcony, kitchen, Wi-Fi and one free covered parking space. The resort has a heated pool, restaurants and a convenience store. A guest favourite on Airbnb, rated 4.82 across 460+ reviews.',
        priceRange: '',
        priceRange_en: '',
        url: 'https://www.airbnb.com.br/rooms/9612462',
        address: 'Setor Hoteleiro Norte — Brasília, DF',
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
        name: 'IVV Swine Bar',
        cuisine_pt: 'Bar de vinhos',
        cuisine_en: 'Wine bar',
        description_pt:
          'O bar do irmão do Renato! Bar de vinhos descontraído na Asa Norte, com carta premiada. A cozinha gira em torno do porco, daí o "swine".',
        description_en:
          'Renato\'s brother\'s bar! A relaxed wine bar in Asa Norte with an award-winning list. The kitchen is built around pork, hence the "swine".',
        priceRange: '',
        priceRange_en: '',
        address: '314 Norte (CLN 314, Bloco B, Loja 21) — Brasília, DF',
        url: 'https://www.google.com/maps/search/?api=1&query=IVV+Swinebar+Bras%C3%ADlia',
      },
      {
        name: 'Don Durica',
        cuisine_pt: 'Self-service / comida caseira',
        cuisine_en: 'Home-style buffet',
        description_pt:
          'Restaurante self-service famoso pela variedade e pelo jeito de comida caseira: carnes, massas e muito mais. Às sextas e sábados tem feijoada.',
        description_en:
          'A buffet-style restaurant famous for its variety and home-cooked feel: meats, pasta and much more. Feijoada is served on Fridays and Saturdays.',
        priceRange: 'R$ 60–90/pessoa',
        priceRange_en: '~€10–15/person',
        address: 'CLN 201 — Asa Norte, Brasília, DF',
        url: 'https://www.google.com/maps/search/?api=1&query=Don+Durica+Bras%C3%ADlia',
      },
      {
        name: 'Xique Xique',
        cuisine_pt: 'Comida nordestina',
        cuisine_en: 'Northeastern Brazilian',
        description_pt:
          'Clássico nordestino de Brasília, famoso pela carne de sol, servida com feijão de corda, paçoca, macaxeira e manteiga de garrafa — o prato inteiro serve cerca de 3 pessoas.',
        description_en:
          'A Brasília Northeastern classic, famous for its carne de sol, served with feijão de corda, paçoca, cassava and clarified butter — the full dish feeds about 3 people.',
        priceRange: 'R$ 60–90/pessoa',
        priceRange_en: '~€10–15/person',
        address: 'SCLS 107, Bloco E, Loja 2 — Asa Sul (também na 708 Norte)',
        url: 'https://www.google.com/maps/search/?api=1&query=Xique+Xique+Bras%C3%ADlia',
      },
      {
        name: 'Mangai',
        cuisine_pt: 'Comida nordestina',
        cuisine_en: 'Northeastern Brazilian',
        description_pt: 'Self-service especializado em culinária do Nordeste, perto da Ponte JK.',
        description_en:
          'A buffet specialising in Northeastern Brazilian cuisine, close to the JK Bridge.',
        priceRange: 'R$ 60/kg',
        priceRange_en: '~€10/kg',
        address: 'Asa Sul, perto da Ponte JK — Brasília, DF',
        url: 'https://www.google.com/maps/search/?api=1&query=Mangai+Bras%C3%ADlia',
      },
      {
        name: 'NAU Frutos do Mar',
        cuisine_pt: 'Frutos do mar / culinária brasileira costeira',
        cuisine_en: 'Seafood / Brazilian coastal cuisine',
        description_pt:
          'Excelente restaurante de frutos do mar, com vista panorâmica do Lago Paranoá e da Ponte JK.',
        description_en:
          'An excellent seafood restaurant with a panoramic view of Lake Paranoá and the JK Bridge.',
        priceRange: 'R$ 100–150/pessoa',
        priceRange_en: '~€17–25/person',
        address: 'Setor de Clubes Esportivos Sul, Trecho 2, Conj. 41 — às margens do Lago Paranoá',
        url: 'https://www.google.com/maps/search/?api=1&query=NAU+Frutos+do+Mar+Bras%C3%ADlia',
      },
      {
        name: 'Coco Bambu',
        cuisine_pt: 'Frutos do mar',
        cuisine_en: 'Seafood',
        description_pt:
          'Rede cearense de frutos do mar com pratos generosos para dividir, especializada em camarões e peixes. O camarão internacional é uma boa pedida.',
        description_en:
          'A seafood chain from Ceará with generous dishes to share, specialising in shrimp and fish. The camarão internacional (shrimp and rice baked in a creamy sauce) is a good pick.',
        priceRange: 'R$ 140–160/pessoa',
        priceRange_en: '~€23–27/person',
        address: 'Brasília Shopping, ParkShopping e Ícone Parque — Brasília, DF',
        url: 'https://www.google.com/maps/search/?api=1&query=Coco+Bambu+Bras%C3%ADlia',
      },
      {
        name: 'Churrascaria Pampas',
        cuisine_pt: 'Churrascaria',
        cuisine_en: 'Steakhouse',
        description_pt:
          'Uma das churrascarias mais tradicionais de Brasília. O rodízio tem 33 variedades de carnes nobres, como picanha argentina e costela de boi premium.',
        description_en:
          "One of Brasília's best-known steakhouses. The rodízio offers 33 varieties of premium meat, such as Argentine picanha and prime beef ribs.",
        priceRange: 'R$ 60–70/pessoa',
        priceRange_en: '~€10–12/person',
        address: 'Estacionamento do Carrefour Sul — Brasília, DF',
        url: 'https://www.google.com/maps/search/?api=1&query=Churrascaria+Pampas+Bras%C3%ADlia+Carrefour+Sul',
      },
      {
        name: 'Costelão de Chão no CTG',
        cuisine_pt: 'Churrasco gaúcho',
        cuisine_en: 'Gaúcho barbecue',
        description_pt:
          'Costelão assado no chão, à moda gaúcha, no Centro de Tradições Gaúchas (CTG). Acontece uma vez por mês: confirme a data antes de ir.',
        description_en:
          'Beef ribs roasted over embers on the ground, gaúcho style, at the Centro de Tradições Gaúchas (CTG). It happens once a month — check the date before you go.',
        priceRange: 'R$ 60–100/pessoa',
        priceRange_en: '~€10–17/person',
        address: 'CTG — Brasília, DF',
        url: 'https://www.google.com/maps/search/?api=1&query=CTG+Bras%C3%ADlia+DF',
      },
      {
        name: 'Galeteria do Lago Norte',
        cuisine_pt: 'Galeteria',
        cuisine_en: 'Roast chicken house',
        description_pt:
          'Tradição do Sul do Brasil: rodízio de galeto assado, com massas, maionese, polenta e salada.',
        description_en:
          'A tradition from southern Brazil: a roast chicken rodízio, with pasta, potato mayonnaise, polenta and salad.',
        priceRange: 'R$ 55–75/pessoa',
        priceRange_en: '~€9–12/person',
        address: 'Lago Norte — Brasília, DF',
        url: 'https://www.google.com/maps/search/?api=1&query=Galeteria+Lago+Norte+Bras%C3%ADlia',
      },
      {
        name: 'Nazô',
        cuisine_pt: 'Japonês',
        cuisine_en: 'Japanese',
        description_pt:
          'O rodízio de comida japonesa preferido do Renato: excelentes peixes, muita variedade de peças e sem limite de quanto comer.',
        description_en:
          "Renato's favourite Japanese rodízio: excellent fish, a wide variety of pieces and no limit on how much you eat.",
        priceRange: 'R$ 90–140/pessoa',
        priceRange_en: '~€15–23/person',
        address: 'CLN 214, Loja 01 — Asa Norte, Brasília, DF',
        url: 'https://www.google.com/maps/search/?api=1&query=Naz%C3%B4+Japanese+Food+Bras%C3%ADlia',
      },
      {
        name: 'Valentina Pizzaria',
        cuisine_pt: 'Pizzaria — massa fina, forno a lenha',
        cuisine_en: 'Pizzeria — thin crust, wood-fired oven',
        description_pt:
          'A Valentina é eleita repetidamente a melhor pizzaria da cidade. Oferece mais de 50 sabores de pizza de massa fina no estilo paulista, assada em forno a lenha.',
        description_en:
          "Repeatedly voted the city's best pizzeria, Valentina serves over 50 flavours of thin-crust, São Paulo-style pizza baked in a wood-fired oven.",
        priceRange: 'R$ 60–100/pessoa',
        priceRange_en: '~€10–17/person',
        address: 'Asa Norte: CLN 214 Bloco A — Asa Sul: CLS 310 Bloco A — Lago Sul',
        url: 'https://www.google.com/maps/search/?api=1&query=Valentina+Pizzaria+Bras%C3%ADlia',
      },
      {
        name: 'Fausto & Manoel',
        cuisine_pt: 'Bar e restaurante',
        cuisine_en: 'Bar & restaurant',
        description_pt:
          'Bar tradicional de Brasília que também tem cardápio completo de restaurante: chope gelado, petiscos e pratos bem servidos para dividir. Costuma ser cheio e é ótimo para um happy hour.',
        description_en:
          'A traditional Brasília bar that also has a full restaurant menu: cold draught beer, and generous snacks and dishes to share. It is usually packed, and great for a happy hour.',
        priceRange: 'R$ 70–120/pessoa',
        priceRange_en: '~€12–20/person',
        address: 'Pontão do Lago Sul (SHIS QL 10, Lote 1/30) e Asa Sul — Brasília, DF',
        url: 'https://www.google.com/maps/search/?api=1&query=Fausto+e+Manoel+Bras%C3%ADlia',
      },
      {
        name: 'Libanus',
        cuisine_pt: 'Bar libanês',
        cuisine_en: 'Lebanese bar',
        description_pt:
          'Bar com forte tradição na culinária árabe, mas que também serve deliciosos grelhados brasileiros. Um excelente lugar para provar a parmegiana brasileira.',
        description_en:
          'A bar with a strong tradition in Arab cooking that also serves delicious Brazilian grills. A great place to try a Brazilian parmegiana (breaded steak under tomato sauce and melted cheese).',
        priceRange: 'R$ 40–70/pessoa',
        priceRange_en: '~€7–12/person',
        address: 'CLS 206, Bloco C, Loja 36 — Asa Sul, Brasília, DF',
        url: 'https://www.google.com/maps/search/?api=1&query=Libanus+Bras%C3%ADlia',
      },
      {
        name: 'Ricco Burger',
        cuisine_pt: 'Hamburguer artesanal',
        cuisine_en: 'Artisan burgers',
        description_pt:
          'Uma das nossas hamburguerias preferidas, com excelentes blends grelhados na brasa, molho artesanal e conservas. Para os amantes de doce, o milk-shake de pudim fecha com chave de ouro.',
        description_en:
          'One of our favourite burger places, with excellent flame-grilled blends, house-made sauce and pickles. If you have a sweet tooth, the pudim (Brazilian flan) milkshake is the perfect finish.',
        priceRange: 'R$ 80–100/pessoa',
        priceRange_en: '~€13–17/person',
        address: 'Múltiplas unidades — Asa Sul, Asa Norte, Lago Sul e mais',
        url: 'https://www.google.com/maps/search/?api=1&query=Ricco+Burger+Bras%C3%ADlia',
      },
      {
        name: 'Dog da Igrejinha',
        cuisine_pt: 'Cachorro-quente / lanchonete',
        cuisine_en: 'Hot dogs / casual snack bar',
        description_pt:
          'Uma instituição gastronômica de Brasília, com o melhor cachorro-quente da cidade. O nosso preferido é o duplo com molho (sem a pasta de atum).',
        description_en:
          'A Brasília institution, with the best hot dog in town. Our favourite is the double with sauce (without the tuna paste).',
        priceRange: 'R$ 20–40/pessoa',
        priceRange_en: '~€3–7/person',
        address: 'Unidade original: Entrequadra Sul 307/308, Asa Sul',
        url: 'https://www.google.com/maps/search/?api=1&query=Dog+da+Igrejinha+Bras%C3%ADlia',
      },
      {
        name: 'Pastel Mix',
        cuisine_pt: 'Pastelaria',
        cuisine_en: 'Pastry shop',
        description_pt:
          'Um excelente lugar para experimentar o pastel brasileiro. Pastelaria criativa, com muitos sabores, ótima para um lanche rápido e saboroso.',
        description_en:
          'A great place to try a Brazilian pastel (a crisp fried pastry with a filling). A creative pastel shop with plenty of flavours, great for a quick, tasty snack.',
        priceRange: 'R$ 20–35/pessoa',
        priceRange_en: '~€3–6/person',
        address: 'CLS 107, Bloco C, Loja 30 — Asa Sul, Brasília, DF',
        url: 'https://www.google.com/maps/search/?api=1&query=Pastel+Mix+Bras%C3%ADlia',
      },
      {
        name: 'Pizzaria Dom Bosco',
        cuisine_pt: 'Pizzaria — pizza por fatia desde 1960',
        cuisine_en: 'Pizzeria — pizza by the slice since 1960',
        description_pt:
          'Fundada em 1960, a Dom Bosco é a mais antiga pizzaria de Brasília e um ponto turístico. O cardápio tem um único sabor: pizza de muçarela, vendida por fatia e acompanhada do tradicional mate gelado.',
        description_en:
          "Brasília's own Spontini! Founded in 1960, Dom Bosco is the city's oldest pizzeria and a sight in itself. Its menu has one flavour: mozzarella pizza by the slice, served with the traditional iced mate tea.",
        priceRange: 'R$ 10–20/pessoa',
        priceRange_en: '~€2–3/person',
        address: 'CLS 107 Bloco D, Loja 20, Asa Sul (unidade original)',
        url: 'https://www.google.com/maps/search/?api=1&query=Pizzaria+Dom+Bosco+Bras%C3%ADlia',
      },
      {
        name: 'Café e um Chêro',
        cuisine_pt: 'Café',
        cuisine_en: 'Café',
        description_pt:
          'Cardápio de café e lanche da tarde bem brasileiro: cuscuz nordestino, tapioca, pão na chapa, bolos e muito mais, com bom cafezinho. No Maranhão, “dar um chêro” é uma forma carinhosa de demonstrar afeto.',
        description_en:
          'A very Brazilian coffee and afternoon-snack menu: Northeastern cuscuz, tapioca, pão na chapa (griddled bread), cakes and much more, with good coffee. In Maranhão, “dar um chêro” is an affectionate way to show care.',
        priceRange: 'R$ 25–50/pessoa',
        priceRange_en: '~€4–8/person',
        address: '109 Norte (CLN 109, Bloco C, Loja 37) e 107 Sul — Brasília, DF',
        url: 'https://www.google.com/maps/search/?api=1&query=Caf%C3%A9+e+um+Ch%C3%AAro+Bras%C3%ADlia',
      },
      {
        name: 'Casa de Biscoitos Mineiros',
        cuisine_pt: 'Lanche mineiro',
        cuisine_en: 'Minas-style snacks',
        description_pt:
          'Ótimo lugar para comer pão de queijo, tomar um cafezinho e sucos de fruta.',
        description_en:
          'A great spot for pão de queijo (cheese bread), a cafezinho and fresh fruit juices.',
        priceRange: 'R$ 20–40/pessoa',
        priceRange_en: '~€3–7/person',
        address: 'Várias unidades — Brasília, DF',
        url: 'https://www.google.com/maps/search/?api=1&query=Casa+de+Biscoitos+Mineiros+Bras%C3%ADlia',
      },
      {
        name: 'Sweet Cake',
        cuisine_pt: 'Confeitaria',
        cuisine_en: 'Bakery & sweets',
        description_pt:
          'Confeitaria tradicional de Brasília, há mais de 30 anos: bolos, tortas, doces finos, salgados e cafés. A religiosa de camarão é o prato preferido da Giovanna, e a nuvem de morango com chocolate é a sobremesa preferida do Renato.',
        description_en:
          "A Brasília bakery and sweets institution for over 30 years: cakes, tarts, fine sweets, savouries and coffee. The shrimp religiosa is Giovanna's favourite dish, and the strawberry-and-chocolate nuvem is Renato's favourite dessert.",
        priceRange: 'R$ 30–60/pessoa',
        priceRange_en: '~€5–10/person',
        address: 'Várias unidades — Lago Sul, Asa Norte, Asa Sul e Noroeste',
        url: 'https://www.google.com/maps/search/?api=1&query=Sweet+Cake+Bras%C3%ADlia',
      },
      {
        name: 'Labecca',
        cuisine_pt: 'Confeitaria e café',
        cuisine_en: 'Bakery & café',
        description_pt:
          'Confeitaria e café com várias unidades em Brasília. Nossas sugestões: a banofee e o bolo de rolo.',
        description_en:
          'A bakery and café with several branches in Brasília. Our suggestions: the banoffee and the bolo de rolo (Brazilian roll cake).',
        priceRange: 'R$ 25–50/pessoa',
        priceRange_en: '~€4–8/person',
        address: 'Várias unidades — Brasília, DF',
        url: 'https://www.google.com/maps/search/?api=1&query=Labecca+Bras%C3%ADlia',
      },
      {
        name: 'Açaí Puríssimo',
        cuisine_pt: 'Açaí',
        cuisine_en: 'Açaí',
        description_pt:
          'Para provar um açaí brasileiro: açaí na tigela com acompanhamentos à escolha, ótimo para refrescar entre um passeio e outro.',
        description_en:
          'To try a real Brazilian açaí: açaí bowls with toppings of your choice, ideal for cooling down between sights.',
        priceRange: 'R$ 20–40/pessoa',
        priceRange_en: '~€3–7/person',
        address: 'Várias unidades — Brasília, DF',
        url: 'https://www.google.com/maps/search/?api=1&query=A%C3%A7a%C3%AD+Pur%C3%ADssimo+Bras%C3%ADlia',
      },
    ],
    tourism: [
      {
        name: 'Catedral Metropolitana',
        description_pt:
          'Projetada por Oscar Niemeyer e inaugurada em 1970, a catedral tem 16 colunas curvas formando uma coroa ascendente. Destaques para o teto de vitrais coloridos de Marianne Peretti e os três anjos suspensos de Alfredo Ceschiatti.',
        description_en:
          "Designed by Oscar Niemeyer and inaugurated in 1970, the cathedral's 16 curved columns form an upward-sweeping crown. Highlights include Marianne Peretti's stained-glass ceiling and the three suspended angels by Alfredo Ceschiatti.",
        address: 'Esplanada dos Ministérios, Lote 12 — Brasília, DF',
        url: '',
      },
      {
        name: 'Congresso Nacional',
        description_pt:
          'Sede do poder legislativo, com a cúpula côncava da Câmara, a cúpula convexa do Senado e as torres gêmeas — ícone de Niemeyer e Lúcio Costa.',
        description_en:
          "Brazil's legislative seat, with the concave House dome, the convex Senate dome, and the twin towers — a Niemeyer & Lúcio Costa icon.",
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
        name: 'Ponte JK',
        description_pt:
          'Ponte sobre o Lago Paranoá, inaugurada em 2002, com três arcos de aço que se cruzam sobre o tabuleiro — um dos cartões-postais de Brasília, ainda mais bonita iluminada à noite.',
        description_en:
          "A bridge over Lake Paranoá, opened in 2002, with three steel arches crossing over the deck — one of Brasília's postcard views, even lovelier lit up at night.",
        address: 'Lago Sul / Lago Norte — Brasília, DF',
        url: '',
      },
      {
        name: 'Memorial JK',
        description_pt:
          'Mausoléu e museu dedicados a Juscelino Kubitschek, fundador de Brasília. A estátua de JK emoldurada pela nicha curva é um dos cartões-postais da cidade.',
        description_en:
          "Mausoleum and museum honoring Juscelino Kubitschek, Brasília's founder. The statue of JK framed by a curved niche is one of the city's signature images.",
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
        name: 'Igrejinha Nossa Senhora de Fátima',
        description_pt:
          'A primeira igreja de Brasília, projetada por Niemeyer em 1958, com azulejos de Athos Bulcão e um telhado em forma de chapéu. Pequena e encantadora, é uma das paradas obrigatórias do Plano Piloto.',
        description_en:
          "Brasília's first church, designed by Niemeyer in 1958, with Athos Bulcão tiles and a distinctive hat-shaped roof. Small and charming, it is one of the must-see stops in the Plano Piloto.",
        address: 'EQS 307/308 — Asa Sul, Brasília, DF',
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
          'Centro Cultural Banco do Brasil, com exposições, teatro, cinema e música em um prédio modernista de frente para o Lago Paranoá.',
        description_en:
          'The Banco do Brasil Cultural Centre, with exhibitions, theatre, cinema and music in a modernist building facing Lake Paranoá.',
        address: 'SCES Trecho 2, Lote 22 — Brasília, DF',
        url: '',
      },
      {
        name: 'Quadra Modelo (308 Sul)',
        description_pt:
          'A superquadra-modelo do plano de Lúcio Costa, com blocos residenciais baixos entre árvores, comércio local e a Igrejinha.',
        description_en:
          "The model superquadra of Lúcio Costa's plan, with low residential blocks among trees, local shops and the little church.",
        address: 'SQS 308 — Asa Sul, Brasília, DF',
        url: '',
      },
      {
        name: 'UnB — Campus Darcy Ribeiro',
        description_pt:
          'A Universidade de Brasília, criada em 1962, com o campus Darcy Ribeiro na Asa Norte. Um campus lindo, aberto e cheio de árvores, ótimo para passear. Foi lá que a Giovanna e o Renato se conheceram.',
        description_en:
          'The University of Brasília, founded in 1962, with the Darcy Ribeiro campus in the Asa Norte. A beautiful, open campus full of trees, lovely for a stroll. It is where Giovanna and Renato met.',
        address: 'Campus Darcy Ribeiro — Asa Norte, Brasília, DF',
        url: '',
      },
      {
        name: 'Festa Junina',
        description_pt:
          'Em junho, as festas juninas animam as igrejas da cidade, com quadrilha, comidas típicas, fogueira e muita música. Nossa data cai bem nessa época, então elas devem estar acontecendo. Foi numa festa junina que aconteceu o primeiro encontro do Renato e da Giovanna.',
        description_en:
          "In June, festas juninas liven up the city's churches, with square dancing, traditional food, bonfires and lots of music. Our date falls in that season, so they should be on. A festa junina is where Renato and Giovanna had their first date.",
        address: 'Igrejas de Brasília, DF',
        url: '',
      },
      {
        name: 'Chapada Imperial',
        description_pt:
          'Refúgio de natureza em Padre Bernardo (GO), a cerca de uma hora de Brasília: cachoeiras, piscinas naturais e trilhas entre o cerrado e a mata.',
        description_en:
          'A nature retreat in Padre Bernardo (GO), about an hour from Brasília: waterfalls, natural pools and trails through the cerrado and forest.',
        address: 'Padre Bernardo, GO',
        url: '',
      },
      {
        name: 'Pirenópolis',
        description_pt:
          'Cidade histórica de ruas de pedra e casarios coloridos, a cerca de 2h30 de Brasília. Centro histórico encantador, boa gastronomia e cachoeiras e rios nos arredores.',
        description_en:
          'A historic town of cobbled streets and colourful colonial houses, about 2.5 hours from Brasília. A charming old centre, good food, and waterfalls and rivers nearby.',
        address: 'Pirenópolis, GO',
        url: '',
      },
      {
        name: 'Chapada dos Veadeiros',
        description_pt:
          'Um dos destinos mais emblemáticos do cerrado, em Alto Paraíso de Goiás, a cerca de 3h30 de Brasília. Parque Nacional com cachoeiras, cânions, o Vale da Lua e trilhas de tirar o fôlego.',
        description_en:
          "One of the cerrado's most iconic destinations, in Alto Paraíso de Goiás, about 3.5 hours from Brasília. A national park of waterfalls, canyons, the Vale da Lua and breathtaking trails.",
        address: 'Alto Paraíso de Goiás, GO',
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
      giftId: 'gift_002',
      name_pt: 'Lua de Mel',
      name_en: 'Honeymoon',
      description_pt:
        'Contribua para a nossa lua de mel! Prometemos mandar fotos e só reclamar de sol demais.',
      description_en:
        'Chip in for our honeymoon! We promise to send photos and to complain only about too much sun.',
      imageUrl: '/gifts/honeymoon.webp',
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
        {
          cotaId: 'cota_002_e',
          label_pt: 'Cota da Lua de Mel',
          label_en: 'Honeymoon Share',
          price: 100,
        },
        {
          cotaId: 'cota_002_f',
          label_pt: 'Cota da Lua de Mel',
          label_en: 'Honeymoon Share',
          price: 100,
        },
        {
          cotaId: 'cota_002_g',
          label_pt: 'Cota da Lua de Mel',
          label_en: 'Honeymoon Share',
          price: 100,
        },
        {
          cotaId: 'cota_002_h',
          label_pt: 'Cota da Lua de Mel',
          label_en: 'Honeymoon Share',
          price: 100,
        },
      ],
    },
    {
      giftId: 'gift_003',
      name_pt: 'Air Fryer',
      name_en: 'Air Fryer',
      description_pt:
        'Fritadeira elétrica sem óleo, 5L. Tudo fica crocante, inclusive as nossas esperanças de cozinhar.',
      description_en:
        'Oil-free electric air fryer, 5L. Everything comes out crispy, including our hopes of learning to cook.',
      imageUrl: '/gifts/airfryer.webp',
      cotas: [
        { cotaId: 'cota_003_a', label_pt: 'Air Fryer 5L', label_en: 'Air Fryer 5L', price: 380 },
      ],
    },
    {
      giftId: 'gift_004',
      name_pt: 'Jogo de Cama',
      name_en: 'Bed Linen Set',
      description_pt:
        'Jogo de cama king 300 fios, 4 peças. O Renato jura que a cama king ainda é pequena.',
      description_en:
        'King size bed linen, 300 thread count, 4 pieces. Renato swears even a king bed is too small.',
      imageUrl: '/gifts/cama.webp',
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
      giftId: 'gift_006',
      name_pt: 'Jogo de Toalhas',
      name_en: 'Towel Set',
      description_pt: 'Toalhas macias e felpudas, para a gente sair do banho parecendo uma nuvem.',
      description_en:
        'Soft, fluffy bath towels, so we step out of the shower feeling like a cloud.',
      imageUrl: '/gifts/toalhas.webp',
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
      description_pt:
        'Tapetes para deixar o lar aconchegante e esconder aquela mancha que a gente não sabe de onde veio.',
      description_en: 'Rugs to make our home cozy and to hide that stain we cannot explain.',
      imageUrl: '/gifts/tapetes.webp',
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
      description_pt:
        'Ajude a gente a pedalar por Brasília numa bike elétrica — ladeira, só se for para baixo!',
      description_en: 'Help us ride around Brasília on an electric bike — uphill is optional!',
      imageUrl: '/gifts/bike.webp',
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
      description_pt:
        'Suporte e banquinho para o nosso piano, para a gente tocar sem dor nas costas (e sem desafinar a paciência dos vizinhos).',
      description_en:
        'A stand and bench for our piano, so we can play without back pain (and without testing the neighbours’ patience).',
      imageUrl: '/gifts/piano.webp',
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
      description_pt:
        'Um banco de madeira para a nossa casa, onde todo mundo vai deixar a mochila e a bolsa.',
      description_en: 'A wooden bench for our home, where everyone will drop their bag and jacket.',
      imageUrl: '/gifts/banco.webp',
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
      description_pt:
        'Estante de madeira para os nossos livros e lembranças — e para disfarçar a bagunça atrás.',
      description_en:
        'A wooden bookshelf for our books and keepsakes — and to hide the mess behind them.',
      imageUrl: '/gifts/estante.webp',
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
      description_pt:
        'Tapete para o escritório, para a cadeira com rodinhas deslizar sem arranhar o piso.',
      description_en:
        'A rug for the office, so the rolling chair glides without scratching the floor.',
      imageUrl: '/gifts/tapete-escritorio.webp',
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
      description_pt:
        'Tapete para receber as visitas no hall — as sapatilhas ficam do lado de fora, combinado?',
      description_en: 'A rug to welcome guests in the hall — shoes stay outside, deal?',
      imageUrl: '/gifts/tapete-hall.webp',
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
      description_pt:
        'Espelho para o hall: o último olhar antes de sair de casa e o primeiro “nossa, tô bem?”.',
      description_en:
        'A mirror for the hall: the last look before leaving and the first “do I look okay?”.',
      imageUrl: '/gifts/espelho-hall.webp',
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
      description_pt:
        'Um jantar a dois para celebrar o começo da nossa vida juntos, sem ninguém olhando o celular (prometido).',
      description_en:
        'A dinner for two to celebrate the start of our life together, with nobody on their phone (promised).',
      imageUrl: '/gifts/jantar-romantico.webp',
      cotas: [
        {
          cotaId: 'cota_015_a',
          label_pt: 'Jantar Romântico',
          label_en: 'Romantic Dinner',
          price: 350,
        },
      ],
    },
    {
      giftId: 'gift_016',
      name_pt: 'Massagens',
      name_en: 'Massages',
      description_pt:
        'Uma massagem relaxante para o casal se recuperar depois de tanta festa (e de montar móvel).',
      description_en:
        'A relaxing massage for the couple to recover after so much partying (and assembling furniture).',
      imageUrl: '/gifts/massagens.webp',
      cotas: [
        {
          cotaId: 'cota_016_a',
          label_pt: 'Massagem',
          label_en: 'Massage',
          price: 250,
        },
        {
          cotaId: 'cota_016_b',
          label_pt: 'Massagem',
          label_en: 'Massage',
          price: 250,
        },
        {
          cotaId: 'cota_016_c',
          label_pt: 'Massagem',
          label_en: 'Massage',
          price: 250,
        },
      ],
    },
    {
      giftId: 'gift_017',
      name_pt: 'Hotel da Noite de Núpcias',
      name_en: 'Wedding Night Hotel',
      description_pt:
        'Uma noite de hotel para começar o casamento em grande estilo — ninguém vai estar acordado para ver, mas vai ser lindo.',
      description_en:
        'A hotel night to start the marriage in style — nobody will be awake to see it, but it will be lovely.',
      imageUrl: '/gifts/hotel.webp',
      cotas: [
        {
          cotaId: 'cota_017_a',
          label_pt: 'Hotel da Noite de Núpcias',
          label_en: 'Wedding Night Hotel',
          price: 400,
        },
        {
          cotaId: 'cota_017_b',
          label_pt: 'Hotel da Noite de Núpcias',
          label_en: 'Wedding Night Hotel',
          price: 400,
        },
      ],
    },
    {
      giftId: 'gift_018',
      name_pt: 'Primeira Classe na Volta',
      name_en: 'First Class Home',
      description_pt:
        'Para voltar da lua de mel com poltrona que deita e champanhe. Sonhar não custa nada!',
      description_en:
        'To fly home from the honeymoon with a lie-flat seat and champagne. Dreaming is free!',
      imageUrl: '/gifts/primeira-classe.webp',
      cotas: [
        {
          cotaId: 'cota_018_a',
          label_pt: 'Cota da Primeira Classe',
          label_en: 'First Class Share',
          price: 300,
        },
        {
          cotaId: 'cota_018_b',
          label_pt: 'Cota da Primeira Classe',
          label_en: 'First Class Share',
          price: 300,
        },
        {
          cotaId: 'cota_018_c',
          label_pt: 'Cota da Primeira Classe',
          label_en: 'First Class Share',
          price: 300,
        },
        {
          cotaId: 'cota_018_d',
          label_pt: 'Cota da Primeira Classe',
          label_en: 'First Class Share',
          price: 300,
        },
        {
          cotaId: 'cota_018_e',
          label_pt: 'Cota da Primeira Classe',
          label_en: 'First Class Share',
          price: 300,
        },
        {
          cotaId: 'cota_018_f',
          label_pt: 'Cota da Primeira Classe',
          label_en: 'First Class Share',
          price: 300,
        },
      ],
    },
    {
      giftId: 'gift_019',
      name_pt: 'Cadeira de Escritório para o Reka',
      name_en: 'Office Chair for Reka',
      description_pt:
        'Uma cadeira confortável para o Renato trabalhar sem dor nas costas — e sem desculpa para levantar.',
      description_en:
        'A comfortable chair so Renato can work without a sore back — and without an excuse to get up.',
      imageUrl: '/gifts/cadeira-escritorio.webp',
      cotas: [
        {
          cotaId: 'cota_019_a',
          label_pt: 'Cadeira de Escritório',
          label_en: 'Office Chair',
          price: 400,
        },
        {
          cotaId: 'cota_019_b',
          label_pt: 'Cadeira de Escritório',
          label_en: 'Office Chair',
          price: 400,
        },
        {
          cotaId: 'cota_019_c',
          label_pt: 'Cadeira de Escritório',
          label_en: 'Office Chair',
          price: 400,
        },
      ],
    },
    {
      giftId: 'gift_020',
      name_pt: 'Faca Japonesa',
      name_en: 'Japanese Knife',
      description_pt:
        'Uma faca japonesa afiadíssima para cozinhar com precisão. O Renato promete não demonstrar o fio com o dedo.',
      description_en:
        'A razor-sharp Japanese knife for cooking with precision. Renato promises not to test the edge with his finger.',
      imageUrl: '/gifts/faca-japonesa.webp',
      cotas: [
        {
          cotaId: 'cota_020_a',
          label_pt: 'Faca Japonesa',
          label_en: 'Japanese Knife',
          price: 600,
        },
      ],
    },
    {
      giftId: 'gift_021',
      name_pt: 'Churrasqueira',
      name_en: 'Barbecue Grill',
      description_pt:
        'Para os domingos de churrasco com família e amigos. A Gi coordena a carne, o Renato coordena o fogo (e a fumaça).',
      description_en:
        'For Sunday barbecues with family and friends. Gi manages the meat, Renato manages the fire (and the smoke).',
      imageUrl: '/gifts/churrasqueira.webp',
      cotas: [
        {
          cotaId: 'cota_021_a',
          label_pt: 'Cota da Churrasqueira',
          label_en: 'Grill Share',
          price: 500,
        },
        {
          cotaId: 'cota_021_b',
          label_pt: 'Cota da Churrasqueira',
          label_en: 'Grill Share',
          price: 500,
        },
        {
          cotaId: 'cota_021_c',
          label_pt: 'Cota da Churrasqueira',
          label_en: 'Grill Share',
          price: 500,
        },
      ],
    },
    {
      giftId: 'gift_022',
      name_pt: 'Batedeira KitchenAid',
      name_en: 'KitchenAid Stand Mixer',
      description_pt:
        'A batedeira dos sonhos para bolos, massas e muitas receitas novas — e para a gente fingir que é confeiteiro.',
      description_en:
        'The dream stand mixer for cakes, doughs and lots of new recipes — and for pretending we are pastry chefs.',
      imageUrl: '/gifts/batedeira.webp',
      cotas: [
        {
          cotaId: 'cota_022_a',
          label_pt: 'Cota da Batedeira KitchenAid',
          label_en: 'KitchenAid Share',
          price: 750,
        },
        {
          cotaId: 'cota_022_b',
          label_pt: 'Cota da Batedeira KitchenAid',
          label_en: 'KitchenAid Share',
          price: 750,
        },
        {
          cotaId: 'cota_022_c',
          label_pt: 'Cota da Batedeira KitchenAid',
          label_en: 'KitchenAid Share',
          price: 750,
        },
        {
          cotaId: 'cota_022_d',
          label_pt: 'Cota da Batedeira KitchenAid',
          label_en: 'KitchenAid Share',
          price: 750,
        },
        {
          cotaId: 'cota_022_e',
          label_pt: 'Cota da Batedeira KitchenAid',
          label_en: 'KitchenAid Share',
          price: 750,
        },
        {
          cotaId: 'cota_022_f',
          label_pt: 'Cota da Batedeira KitchenAid',
          label_en: 'KitchenAid Share',
          price: 750,
        },
      ],
    },
    {
      giftId: 'gift_023',
      name_pt: 'Panela Le Creuset',
      name_en: 'Le Creuset Pot',
      description_pt:
        'Uma panela para a vida inteira, daquelas que a gente deixa de herança (e tem briga por ela).',
      description_en: 'A pot for life, the kind you leave as an inheritance (and fight over).',
      imageUrl: '/gifts/panela-ferro.webp',
      cotas: [
        {
          cotaId: 'cota_023_a',
          label_pt: 'Cota da Panela Le Creuset',
          label_en: 'Le Creuset Share',
          price: 500,
        },
        {
          cotaId: 'cota_023_b',
          label_pt: 'Cota da Panela Le Creuset',
          label_en: 'Le Creuset Share',
          price: 500,
        },
        {
          cotaId: 'cota_023_c',
          label_pt: 'Cota da Panela Le Creuset',
          label_en: 'Le Creuset Share',
          price: 500,
        },
        {
          cotaId: 'cota_023_d',
          label_pt: 'Cota da Panela Le Creuset',
          label_en: 'Le Creuset Share',
          price: 500,
        },
      ],
    },
    {
      giftId: 'gift_024',
      name_pt: 'Mini Le Creuset',
      name_en: 'Mini Le Creuset',
      description_pt:
        'Uma mini Le Creuset para repor a que quebrou. A gente não vai falar quem foi, mas ele sabe.',
      description_en:
        'A mini Le Creuset to replace the one that broke. We will not say who did it, but he knows.',
      imageUrl: '/gifts/mini-panela.webp',
      cotas: [
        {
          cotaId: 'cota_024_a',
          label_pt: 'Mini Le Creuset',
          label_en: 'Mini Le Creuset',
          price: 700,
        },
      ],
    },
    {
      giftId: 'gift_025',
      name_pt: 'Panelas Sem Cabo e Mini Frigideira',
      name_en: 'Detachable-Handle Pans & Mini Skillet',
      description_pt:
        'Panelas sem cabo, mini frigideira e uma tampa grande de panela: a cozinha agradece, o armário também.',
      description_en:
        'Detachable-handle pans, a mini skillet and a big pot lid: the kitchen is grateful, and so is the cupboard.',
      imageUrl: '/gifts/panelas.webp',
      cotas: [
        {
          cotaId: 'cota_025_a',
          label_pt: 'Kit de Panelas',
          label_en: 'Pan Set',
          price: 600,
        },
      ],
    },
    {
      giftId: 'gift_026',
      name_pt: 'Potes de Vidro',
      name_en: 'Glass Containers',
      description_pt:
        'Potes de vidro para organizar a cozinha e esconder as sobras (e os brigadeiros).',
      description_en:
        'Glass containers to organise the kitchen and hide the leftovers (and the brigadeiros).',
      imageUrl: '/gifts/potes.webp',
      cotas: [
        {
          cotaId: 'cota_026_a',
          label_pt: 'Potes de Vidro',
          label_en: 'Glass Containers',
          price: 250,
        },
      ],
    },
    {
      giftId: 'gift_027',
      name_pt: 'Robô de Lavar Janela',
      name_en: 'Window-Cleaning Robot',
      description_pt:
        'Porque ninguém gosta de lavar janela. O robô vai fazer isso e a gente só fica olhando, orgulhoso.',
      description_en:
        'Because nobody likes washing windows. The robot will do it while we watch, proudly.',
      imageUrl: '/gifts/robo-janela.webp',
      cotas: [
        {
          cotaId: 'cota_027_a',
          label_pt: 'Cota do Robô de Lavar Janela',
          label_en: 'Window Robot Share',
          price: 450,
        },
        {
          cotaId: 'cota_027_b',
          label_pt: 'Cota do Robô de Lavar Janela',
          label_en: 'Window Robot Share',
          price: 450,
        },
      ],
    },
    {
      giftId: 'gift_028',
      name_pt: 'Forno de Pizza Ooni',
      name_en: 'Ooni Pizza Oven',
      description_pt:
        'Para as noites de pizza caseira, no melhor estilo napolitano. A massa pode não sair redonda, mas vai sair gostosa.',
      description_en:
        'For homemade pizza nights, Neapolitan style. The dough may not come out round, but it will come out tasty.',
      imageUrl: '/gifts/forno-pizza.webp',
      cotas: [
        {
          cotaId: 'cota_028_a',
          label_pt: 'Cota do Forno de Pizza',
          label_en: 'Pizza Oven Share',
          price: 500,
        },
        {
          cotaId: 'cota_028_b',
          label_pt: 'Cota do Forno de Pizza',
          label_en: 'Pizza Oven Share',
          price: 500,
        },
        {
          cotaId: 'cota_028_c',
          label_pt: 'Cota do Forno de Pizza',
          label_en: 'Pizza Oven Share',
          price: 500,
        },
        {
          cotaId: 'cota_028_d',
          label_pt: 'Cota do Forno de Pizza',
          label_en: 'Pizza Oven Share',
          price: 500,
        },
        {
          cotaId: 'cota_028_e',
          label_pt: 'Cota do Forno de Pizza',
          label_en: 'Pizza Oven Share',
          price: 500,
        },
        {
          cotaId: 'cota_028_f',
          label_pt: 'Cota do Forno de Pizza',
          label_en: 'Pizza Oven Share',
          price: 500,
        },
      ],
    },
    {
      giftId: 'gift_029',
      name_pt: 'Um Ano de Cápsulas Nespresso',
      name_en: 'A Year of Nespresso Capsules',
      description_pt:
        'Um ano de cafezinhos para o Renato, que não vive sem o dele. Sem cápsula, ele vira outra pessoa.',
      description_en:
        'A year of coffee for Renato, who cannot live without his. Without a capsule he turns into someone else.',
      imageUrl: '/gifts/capsulas.webp',
      cotas: [
        {
          cotaId: 'cota_029_a',
          label_pt: 'Cápsulas de um Mês',
          label_en: 'One Month of Capsules',
          price: 125,
        },
        {
          cotaId: 'cota_029_b',
          label_pt: 'Cápsulas de um Mês',
          label_en: 'One Month of Capsules',
          price: 125,
        },
        {
          cotaId: 'cota_029_c',
          label_pt: 'Cápsulas de um Mês',
          label_en: 'One Month of Capsules',
          price: 125,
        },
        {
          cotaId: 'cota_029_d',
          label_pt: 'Cápsulas de um Mês',
          label_en: 'One Month of Capsules',
          price: 125,
        },
        {
          cotaId: 'cota_029_e',
          label_pt: 'Cápsulas de um Mês',
          label_en: 'One Month of Capsules',
          price: 125,
        },
        {
          cotaId: 'cota_029_f',
          label_pt: 'Cápsulas de um Mês',
          label_en: 'One Month of Capsules',
          price: 125,
        },
        {
          cotaId: 'cota_029_g',
          label_pt: 'Cápsulas de um Mês',
          label_en: 'One Month of Capsules',
          price: 125,
        },
        {
          cotaId: 'cota_029_h',
          label_pt: 'Cápsulas de um Mês',
          label_en: 'One Month of Capsules',
          price: 125,
        },
        {
          cotaId: 'cota_029_i',
          label_pt: 'Cápsulas de um Mês',
          label_en: 'One Month of Capsules',
          price: 125,
        },
        {
          cotaId: 'cota_029_j',
          label_pt: 'Cápsulas de um Mês',
          label_en: 'One Month of Capsules',
          price: 125,
        },
        {
          cotaId: 'cota_029_k',
          label_pt: 'Cápsulas de um Mês',
          label_en: 'One Month of Capsules',
          price: 125,
        },
        {
          cotaId: 'cota_029_l',
          label_pt: 'Cápsulas de um Mês',
          label_en: 'One Month of Capsules',
          price: 125,
        },
      ],
    },
    {
      giftId: 'gift_030',
      name_pt: 'Estoque de Tapioca para a Gi',
      name_en: 'Tapioca Stock for Gi',
      description_pt:
        'Para a despensa da Giovanna nunca ficar sem tapioca. É uma emergência nacional.',
      description_en: 'So Giovanna’s pantry never runs out of tapioca. It is a national emergency.',
      imageUrl: '/gifts/tapioca.webp',
      cotas: [
        {
          cotaId: 'cota_030_a',
          label_pt: 'Pacote de Tapioca',
          label_en: 'Tapioca Pack',
          price: 50,
        },
        {
          cotaId: 'cota_030_b',
          label_pt: 'Pacote de Tapioca',
          label_en: 'Tapioca Pack',
          price: 50,
        },
        {
          cotaId: 'cota_030_c',
          label_pt: 'Pacote de Tapioca',
          label_en: 'Tapioca Pack',
          price: 50,
        },
        {
          cotaId: 'cota_030_d',
          label_pt: 'Pacote de Tapioca',
          label_en: 'Tapioca Pack',
          price: 50,
        },
        {
          cotaId: 'cota_030_e',
          label_pt: 'Pacote de Tapioca',
          label_en: 'Tapioca Pack',
          price: 50,
        },
        {
          cotaId: 'cota_030_f',
          label_pt: 'Pacote de Tapioca',
          label_en: 'Tapioca Pack',
          price: 50,
        },
      ],
    },
    {
      giftId: 'gift_031',
      name_pt: 'Fundo para o Próximo Jogo do Renato',
      name_en: 'Renato’s Next Game Fund',
      description_pt:
        'Um fundo para o próximo jogo ou console que o Renato vai querer comprar. Ele diz que é o último. Não é.',
      description_en:
        'A fund for the next game or console Renato is going to want to buy. He says it is the last one. It is not.',
      imageUrl: '/gifts/jogo.webp',
      cotas: [
        {
          cotaId: 'cota_031_a',
          label_pt: 'Cota do Fundo de Jogos',
          label_en: 'Game Fund Share',
          price: 100,
        },
        {
          cotaId: 'cota_031_b',
          label_pt: 'Cota do Fundo de Jogos',
          label_en: 'Game Fund Share',
          price: 100,
        },
        {
          cotaId: 'cota_031_c',
          label_pt: 'Cota do Fundo de Jogos',
          label_en: 'Game Fund Share',
          price: 100,
        },
        {
          cotaId: 'cota_031_d',
          label_pt: 'Cota do Fundo de Jogos',
          label_en: 'Game Fund Share',
          price: 100,
        },
        {
          cotaId: 'cota_031_e',
          label_pt: 'Cota do Fundo de Jogos',
          label_en: 'Game Fund Share',
          price: 100,
        },
        {
          cotaId: 'cota_031_f',
          label_pt: 'Cota do Fundo de Jogos',
          label_en: 'Game Fund Share',
          price: 100,
        },
        {
          cotaId: 'cota_031_g',
          label_pt: 'Cota do Fundo de Jogos',
          label_en: 'Game Fund Share',
          price: 100,
        },
        {
          cotaId: 'cota_031_h',
          label_pt: 'Cota do Fundo de Jogos',
          label_en: 'Game Fund Share',
          price: 100,
        },
      ],
    },
    {
      giftId: 'gift_032',
      name_pt: 'Fundo do Cachorro',
      name_en: 'Dog Fund',
      description_pt:
        'Ração, veterinário e tudo o que for preciso para o futuro membro da família — que, claro, vai mandar em casa.',
      description_en:
        'Food, vet visits and everything the future family member will need — who will, of course, run the house.',
      imageUrl: '/gifts/cachorro.webp',
      cotas: [
        {
          cotaId: 'cota_032_a',
          label_pt: 'Cota do Fundo do Cachorro',
          label_en: 'Dog Fund Share',
          price: 100,
        },
        {
          cotaId: 'cota_032_b',
          label_pt: 'Cota do Fundo do Cachorro',
          label_en: 'Dog Fund Share',
          price: 100,
        },
        {
          cotaId: 'cota_032_c',
          label_pt: 'Cota do Fundo do Cachorro',
          label_en: 'Dog Fund Share',
          price: 100,
        },
        {
          cotaId: 'cota_032_d',
          label_pt: 'Cota do Fundo do Cachorro',
          label_en: 'Dog Fund Share',
          price: 100,
        },
        {
          cotaId: 'cota_032_e',
          label_pt: 'Cota do Fundo do Cachorro',
          label_en: 'Dog Fund Share',
          price: 100,
        },
        {
          cotaId: 'cota_032_f',
          label_pt: 'Cota do Fundo do Cachorro',
          label_en: 'Dog Fund Share',
          price: 100,
        },
        {
          cotaId: 'cota_032_g',
          label_pt: 'Cota do Fundo do Cachorro',
          label_en: 'Dog Fund Share',
          price: 100,
        },
        {
          cotaId: 'cota_032_h',
          label_pt: 'Cota do Fundo do Cachorro',
          label_en: 'Dog Fund Share',
          price: 100,
        },
        {
          cotaId: 'cota_032_i',
          label_pt: 'Cota do Fundo do Cachorro',
          label_en: 'Dog Fund Share',
          price: 100,
        },
        {
          cotaId: 'cota_032_j',
          label_pt: 'Cota do Fundo do Cachorro',
          label_en: 'Dog Fund Share',
          price: 100,
        },
      ],
    },
    {
      giftId: 'gift_033',
      name_pt: 'Fundo de Utensílios de Café do Renato',
      name_en: 'Renato’s Coffee Gear Fund',
      description_pt:
        'Um fundo para o próximo utensílio de café que o Renato vai querer: prensa, moedor, cafeteira… a lista não acaba.',
      description_en:
        'A fund for the next coffee gadget Renato is going to want: press, grinder, brewer… the list never ends.',
      imageUrl: '/gifts/utensilios-cafe.webp',
      cotas: [
        {
          cotaId: 'cota_033_a',
          label_pt: 'Cota do Fundo de Café',
          label_en: 'Coffee Fund Share',
          price: 100,
        },
        {
          cotaId: 'cota_033_b',
          label_pt: 'Cota do Fundo de Café',
          label_en: 'Coffee Fund Share',
          price: 100,
        },
        {
          cotaId: 'cota_033_c',
          label_pt: 'Cota do Fundo de Café',
          label_en: 'Coffee Fund Share',
          price: 100,
        },
        {
          cotaId: 'cota_033_d',
          label_pt: 'Cota do Fundo de Café',
          label_en: 'Coffee Fund Share',
          price: 100,
        },
        {
          cotaId: 'cota_033_e',
          label_pt: 'Cota do Fundo de Café',
          label_en: 'Coffee Fund Share',
          price: 100,
        },
        {
          cotaId: 'cota_033_f',
          label_pt: 'Cota do Fundo de Café',
          label_en: 'Coffee Fund Share',
          price: 100,
        },
        {
          cotaId: 'cota_033_g',
          label_pt: 'Cota do Fundo de Café',
          label_en: 'Coffee Fund Share',
          price: 100,
        },
        {
          cotaId: 'cota_033_h',
          label_pt: 'Cota do Fundo de Café',
          label_en: 'Coffee Fund Share',
          price: 100,
        },
      ],
    },
    {
      giftId: 'gift_034',
      name_pt: 'Fundo para a Giovanna Visitar Jojo e Olivia',
      name_en: 'Fund for Giovanna to Visit Jojo and Olivia',
      description_pt:
        'Para a Giovanna matar a saudade e ir visitar a Jojo e a Olivia — com direito a abraço e muita conversa.',
      description_en:
        'So Giovanna can cure the homesickness and go visit Jojo and Olivia — hugs and long chats included.',
      imageUrl: '/gifts/visita.webp',
      cotas: [
        {
          cotaId: 'cota_034_a',
          label_pt: 'Cota da Viagem',
          label_en: 'Trip Share',
          price: 150,
        },
        {
          cotaId: 'cota_034_b',
          label_pt: 'Cota da Viagem',
          label_en: 'Trip Share',
          price: 150,
        },
        {
          cotaId: 'cota_034_c',
          label_pt: 'Cota da Viagem',
          label_en: 'Trip Share',
          price: 150,
        },
        {
          cotaId: 'cota_034_d',
          label_pt: 'Cota da Viagem',
          label_en: 'Trip Share',
          price: 150,
        },
        {
          cotaId: 'cota_034_e',
          label_pt: 'Cota da Viagem',
          label_en: 'Trip Share',
          price: 150,
        },
        {
          cotaId: 'cota_034_f',
          label_pt: 'Cota da Viagem',
          label_en: 'Trip Share',
          price: 150,
        },
        {
          cotaId: 'cota_034_g',
          label_pt: 'Cota da Viagem',
          label_en: 'Trip Share',
          price: 150,
        },
        {
          cotaId: 'cota_034_h',
          label_pt: 'Cota da Viagem',
          label_en: 'Trip Share',
          price: 150,
        },
      ],
    },
    {
      giftId: 'gift_035',
      name_pt: 'Panela de Pressão Elétrica',
      name_en: 'Electric Pressure Cooker',
      description_pt:
        'Para a gente conseguir fazer feijão na gringa — porque a saudade de casa tem gosto de feijão no caldo.',
      description_en:
        'So we can make proper Brazilian beans abroad — because homesickness tastes like bean broth.',
      imageUrl: '/gifts/panela-pressao.webp',
      cotas: [
        {
          cotaId: 'cota_035_a',
          label_pt: 'Cota da Panela de Pressão',
          label_en: 'Pressure Cooker Share',
          price: 250,
        },
        {
          cotaId: 'cota_035_b',
          label_pt: 'Cota da Panela de Pressão',
          label_en: 'Pressure Cooker Share',
          price: 250,
        },
        {
          cotaId: 'cota_035_c',
          label_pt: 'Cota da Panela de Pressão',
          label_en: 'Pressure Cooker Share',
          price: 250,
        },
      ],
    },
  ],
}

export type MenuOption = (typeof CONFIG.menuOptions)[number]
export type GiftConfig = (typeof CONFIG.gifts)[number]
export type CotaConfig = (typeof CONFIG.gifts)[number]['cotas'][number]
