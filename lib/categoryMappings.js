// Zentrale Kategorie-Mappings: ListSync-Kategorie → Vinted / Kleinanzeigen / eBay
//
// vinted:        Pfad-Array für hierarchisches Durchklicken  (split by " – " reicht)
// kleinanzeigen: { haupt, unter } – Hauptkategorie + optionale Unterkategorie
// ebay:          { id } – eBay-Kategorie-ID (https://www.ebay.de/sl/list?category=ID)

const CATEGORY_MAPPINGS = {

  // ── DAMEN ────────────────────────────────────────────────────────────────────

  'Damen': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Damenmode' },
    ebay: { id: '63861' },
  },
  'Damen – Kleidung': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Damenmode' },
    ebay: { id: '63861' },
  },
  'Damen – Kleidung – Jacken & Mäntel': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Damenmode' },
    ebay: { id: '63862' },
  },
  'Damen – Kleidung – Pullover & Strickpullover': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Damenmode' },
    ebay: { id: '63864' },
  },
  'Damen – Kleidung – Blazer & Anzüge': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Damenmode' },
    ebay: { id: '3002' },
  },
  'Damen – Kleidung – Kleider': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Damenmode' },
    ebay: { id: '63861' },
  },
  'Damen – Kleidung – Röcke': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Damenmode' },
    ebay: { id: '63861' },
  },
  'Damen – Kleidung – Skorts': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Damenmode' },
    ebay: { id: '63861' },
  },
  'Damen – Kleidung – Tops & T-Shirts': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Damenmode' },
    ebay: { id: '63861' },
  },
  'Damen – Kleidung – Jeans': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Damenmode' },
    ebay: { id: '11554' },
  },
  'Damen – Kleidung – Hosen & Leggings': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Damenmode' },
    ebay: { id: '63861' },
  },
  'Damen – Kleidung – Shorts': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Damenmode' },
    ebay: { id: '63861' },
  },
  'Damen – Kleidung – Jumpsuits & Playsuits': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Damenmode' },
    ebay: { id: '63861' },
  },
  'Damen – Kleidung – Bademode': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Damenmode' },
    ebay: { id: '63861' },
  },
  'Damen – Kleidung – Unterwäsche & Nachtwäsche': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Damenmode' },
    ebay: { id: '63863' },
  },
  'Damen – Kleidung – Umstandskleidung': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Damenmode' },
    ebay: { id: '63861' },
  },
  'Damen – Kleidung – Activewear': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Damenmode' },
    ebay: { id: '137084' },
  },
  'Damen – Kleidung – Kostüme & Besonderes': {
    kleinanzeigen: { haupt: 'Freizeit', unter: 'Kostüme & Verkleidung' },
    ebay: { id: '63861' },
  },
  'Damen – Schuhe': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Damenschuhe' },
    ebay: { id: '63889' },
  },
  'Damen – Schuhe – Ballerinas': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Damenschuhe' },
    ebay: { id: '63889' },
  },
  'Damen – Schuhe – Stiefel': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Damenschuhe' },
    ebay: { id: '63889' },
  },
  'Damen – Schuhe – Absatzschuhe': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Damenschuhe' },
    ebay: { id: '63889' },
  },
  'Damen – Schuhe – Sportschuhe': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Damenschuhe' },
    ebay: { id: '63889' },
  },
  'Damen – Schuhe – Sneaker': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Damenschuhe' },
    ebay: { id: '63889' },
  },
  'Damen – Schuhe – Sandalen': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Damenschuhe' },
    ebay: { id: '63889' },
  },
  'Damen – Taschen': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Taschen & Accessoires' },
    ebay: { id: '169291' },
  },
  'Damen – Taschen – Handtaschen': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Taschen & Accessoires' },
    ebay: { id: '169291' },
  },
  'Damen – Taschen – Rucksäcke': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Taschen & Accessoires' },
    ebay: { id: '169291' },
  },
  'Damen – Taschen – Portemonnaies': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Taschen & Accessoires' },
    ebay: { id: '169291' },
  },
  'Damen – Accessoires': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Taschen & Accessoires' },
    ebay: { id: '4251' },
  },
  'Damen – Accessoires – Schmuck': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Uhren & Schmuck' },
    ebay: { id: '281' },
  },
  'Damen – Accessoires – Uhren': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Uhren & Schmuck' },
    ebay: { id: '14324' },
  },
  'Damen – Accessoires – Sonnenbrillen': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Taschen & Accessoires' },
    ebay: { id: '4251' },
  },
  'Damen – Accessoires – Hüte & Mützen': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Taschen & Accessoires' },
    ebay: { id: '4251' },
  },
  'Damen – Beauty': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Kosmetik & Wellness' },
    ebay: { id: '26395' },
  },
  'Damen – Beauty – Make-up': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Kosmetik & Wellness' },
    ebay: { id: '26395' },
  },
  'Damen – Beauty – Parfums': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Kosmetik & Wellness' },
    ebay: { id: '180345' },
  },

  // ── DESIGNERARTIKEL ──────────────────────────────────────────────────────────

  'Designerartikel': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Damenmode' },
    ebay: { id: '63861' },
  },
  'Designerartikel – Designerartikel für Damen': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Damenmode' },
    ebay: { id: '63861' },
  },
  'Designerartikel – Designerartikel für Damen – Designertaschen': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Taschen & Accessoires' },
    ebay: { id: '169291' },
  },
  'Designerartikel – Designerartikel für Damen – Designerschuhe': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Damenschuhe' },
    ebay: { id: '63889' },
  },
  'Designerartikel – Designerartikel für Damen – Designerkleidung': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Damenmode' },
    ebay: { id: '63861' },
  },
  'Designerartikel – Designerartikel für Herren': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Herrenmode' },
    ebay: { id: '57988' },
  },
  'Designerartikel – Designerartikel für Herren – Designerschuhe': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Herrenschuhe' },
    ebay: { id: '93427' },
  },
  'Designerartikel – Designerartikel für Herren – Designerkleidung': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Herrenmode' },
    ebay: { id: '57988' },
  },

  // ── HERREN ───────────────────────────────────────────────────────────────────

  'Herren': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Herrenmode' },
    ebay: { id: '57988' },
  },
  'Herren – Kleidung': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Herrenmode' },
    ebay: { id: '57988' },
  },
  'Herren – Kleidung – Jeans': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Herrenmode' },
    ebay: { id: '11483' },
  },
  'Herren – Kleidung – Jacken & Mäntel': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Herrenmode' },
    ebay: { id: '57988' },
  },
  'Herren – Kleidung – Tops & T-Shirts': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Herrenmode' },
    ebay: { id: '57988' },
  },
  'Herren – Kleidung – Anzüge & Blazer': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Herrenmode' },
    ebay: { id: '3001' },
  },
  'Herren – Kleidung – Pullover & Sweater': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Herrenmode' },
    ebay: { id: '57988' },
  },
  'Herren – Kleidung – Hosen': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Herrenmode' },
    ebay: { id: '57988' },
  },
  'Herren – Kleidung – Shorts': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Herrenmode' },
    ebay: { id: '57988' },
  },
  'Herren – Kleidung – Unterwäsche & Socken': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Herrenmode' },
    ebay: { id: '57988' },
  },
  'Herren – Kleidung – Nachtwäsche': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Herrenmode' },
    ebay: { id: '57988' },
  },
  'Herren – Kleidung – Badebekleidung': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Herrenmode' },
    ebay: { id: '57988' },
  },
  'Herren – Kleidung – Sportartikel': {
    kleinanzeigen: { haupt: 'Sport & Camping', unter: 'Sportbekleidung' },
    ebay: { id: '137084' },
  },
  'Herren – Kleidung – Spezielle Kleidung': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Herrenmode' },
    ebay: { id: '57988' },
  },
  'Herren – Schuhe': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Herrenschuhe' },
    ebay: { id: '93427' },
  },
  'Herren – Schuhe – Stiefel': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Herrenschuhe' },
    ebay: { id: '93427' },
  },
  'Herren – Schuhe – Sportschuhe': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Herrenschuhe' },
    ebay: { id: '93427' },
  },
  'Herren – Schuhe – Sneaker': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Herrenschuhe' },
    ebay: { id: '93427' },
  },
  'Herren – Schuhe – Sandalen': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Herrenschuhe' },
    ebay: { id: '93427' },
  },
  'Herren – Accessoires': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Taschen & Accessoires' },
    ebay: { id: '15322' },
  },
  'Herren – Accessoires – Taschen & Rucksäcke': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Taschen & Accessoires' },
    ebay: { id: '169291' },
  },
  'Herren – Accessoires – Schmuck': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Uhren & Schmuck' },
    ebay: { id: '281' },
  },
  'Herren – Accessoires – Uhren': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Uhren & Schmuck' },
    ebay: { id: '14324' },
  },
  'Herren – Accessoires – Sonnenbrillen': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Taschen & Accessoires' },
    ebay: { id: '15322' },
  },
  'Herren – Körper- & Gesichtspflege': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Kosmetik & Wellness' },
    ebay: { id: '26395' },
  },

  // ── KINDER ───────────────────────────────────────────────────────────────────

  'Kinder': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Kinderkleidung & -accessoires' },
    ebay: { id: '171146' },
  },
  'Kinder – Mädchen': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Kinderkleidung & -accessoires' },
    ebay: { id: '171146' },
  },
  'Kinder – Mädchen – Babykleidung (Mädchen)': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Babykleidung & -accessoires' },
    ebay: { id: '171146' },
  },
  'Kinder – Mädchen – Schuhe': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Kinderscbuhe' },
    ebay: { id: '57929' },
  },
  'Kinder – Mädchen – Outerwear': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Kinderkleidung & -accessoires' },
    ebay: { id: '171146' },
  },
  'Kinder – Mädchen – Pullover und Jäckchen': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Kinderkleidung & -accessoires' },
    ebay: { id: '171146' },
  },
  'Kinder – Mädchen – Shirts, Tops & Blusen': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Kinderkleidung & -accessoires' },
    ebay: { id: '171146' },
  },
  'Kinder – Mädchen – Kleider': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Kinderkleidung & -accessoires' },
    ebay: { id: '171146' },
  },
  'Kinder – Mädchen – Röcke': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Kinderkleidung & -accessoires' },
    ebay: { id: '171146' },
  },
  'Kinder – Mädchen – Hosen & Shorts': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Kinderkleidung & -accessoires' },
    ebay: { id: '171146' },
  },
  'Kinder – Mädchen – Sportkleidung': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Kinderkleidung & -accessoires' },
    ebay: { id: '171146' },
  },
  'Kinder – Mädchen – Accessoires': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Kinderkleidung & -accessoires' },
    ebay: { id: '171146' },
  },
  'Kinder – Mädchen – Badekleidung': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Kinderkleidung & -accessoires' },
    ebay: { id: '171146' },
  },
  'Kinder – Mädchen – Unterwäsche & Socken': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Kinderkleidung & -accessoires' },
    ebay: { id: '171146' },
  },
  'Kinder – Mädchen – Nachtwäsche': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Kinderkleidung & -accessoires' },
    ebay: { id: '171146' },
  },
  'Kinder – Jungs': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Kinderkleidung & -accessoires' },
    ebay: { id: '171147' },
  },
  'Kinder – Jungs – Babykleidung (Jungs)': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Babykleidung & -accessoires' },
    ebay: { id: '171147' },
  },
  'Kinder – Jungs – Schuhe': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Kinderschuhe' },
    ebay: { id: '57929' },
  },
  'Kinder – Jungs – Outerwear': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Kinderkleidung & -accessoires' },
    ebay: { id: '171147' },
  },
  'Kinder – Jungs – Pullover & Jäckchen': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Kinderkleidung & -accessoires' },
    ebay: { id: '171147' },
  },
  'Kinder – Jungs – Shirts, Tops & Hemden': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Kinderkleidung & -accessoires' },
    ebay: { id: '171147' },
  },
  'Kinder – Jungs – Hosen & Shorts': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Kinderkleidung & -accessoires' },
    ebay: { id: '171147' },
  },
  'Kinder – Jungs – Sportartikel': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Kinderkleidung & -accessoires' },
    ebay: { id: '171147' },
  },
  'Kinder – Jungs – Accessoires': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Kinderkleidung & -accessoires' },
    ebay: { id: '171147' },
  },
  'Kinder – Jungs – Badekleidung': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Kinderkleidung & -accessoires' },
    ebay: { id: '171147' },
  },
  'Kinder – Jungs – Unterwäsche': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Kinderkleidung & -accessoires' },
    ebay: { id: '171147' },
  },
  'Kinder – Jungs – Nachtwäsche': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Kinderkleidung & -accessoires' },
    ebay: { id: '171147' },
  },
  'Kinder – Spielzeug': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Spielzeug' },
    ebay: { id: '220' },
  },
  'Kinder – Spielzeug – Puppen & Zubehör': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Spielzeug' },
    ebay: { id: '19069' },
  },
  'Kinder – Spielzeug – Autos, Züge & sonstige Fahrzeuge': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Spielzeug' },
    ebay: { id: '19071' },
  },
  'Kinder – Spielzeug – Stofftiere': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Spielzeug' },
    ebay: { id: '19069' },
  },
  'Kinder – Spielzeug – Lernspielzeug': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Spielzeug' },
    ebay: { id: '220' },
  },
  'Kinder – Kinderwagen, Tragen & Autositze': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Kinderwagen, Buggys & Tragen' },
    ebay: { id: '100218' },
  },
  'Kinder – Möbel & Deko': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Kinderzimmer-Möbel & -Accessoires' },
    ebay: { id: '11700' },
  },
  'Kinder – Baden & Wickeln': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Baby-Ausstattung' },
    ebay: { id: '100218' },
  },
  'Kinder – Stillen & Füttern': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Baby-Ausstattung' },
    ebay: { id: '100218' },
  },
  'Kinder – Gesundheit & Schwangerschaft': {
    kleinanzeigen: { haupt: 'Familie, Kind & Baby', unter: 'Schwangerschaft & Stillzeit' },
    ebay: { id: '100218' },
  },

  // ── ELEKTRONIK ───────────────────────────────────────────────────────────────

  'Elektronik': {
    kleinanzeigen: { haupt: 'Elektronik', unter: '' },
    ebay: { id: '293' },
  },
  'Elektronik – Smartphones': {
    kleinanzeigen: { haupt: 'Elektronik', unter: 'Handys & Mobiltelefone' },
    ebay: { id: '15032' },
  },
  'Elektronik – Laptops & Computer': {
    kleinanzeigen: { haupt: 'Elektronik', unter: 'PCs, Laptops & Zubehör' },
    ebay: { id: '58058' },
  },
  'Elektronik – Tablets': {
    kleinanzeigen: { haupt: 'Elektronik', unter: 'Tablet-PCs & Zubehör' },
    ebay: { id: '171485' },
  },
  'Elektronik – Kopfhörer': {
    kleinanzeigen: { haupt: 'Elektronik', unter: 'Audio & HiFi' },
    ebay: { id: '293' },
  },
  'Elektronik – Kameras': {
    kleinanzeigen: { haupt: 'Elektronik', unter: 'Kameras & Camcorder' },
    ebay: { id: '625' },
  },
  'Elektronik – Spielekonsolen': {
    kleinanzeigen: { haupt: 'Elektronik', unter: 'Videospiele & Konsolen' },
    ebay: { id: '1249' },
  },

  // ── SPORT ────────────────────────────────────────────────────────────────────

  'Sport': {
    kleinanzeigen: { haupt: 'Sport & Camping', unter: '' },
    ebay: { id: '888' },
  },
  'Sport & Outdoor': {
    kleinanzeigen: { haupt: 'Sport & Camping', unter: '' },
    ebay: { id: '888' },
  },
  'Sport – Fahrräder': {
    kleinanzeigen: { haupt: 'Sport & Camping', unter: 'Fahrräder & Zubehör' },
    ebay: { id: '7294' },
  },
  'Sport – Fitnessgeräte': {
    kleinanzeigen: { haupt: 'Sport & Camping', unter: 'Fitnessgeräte' },
    ebay: { id: '15273' },
  },
  'Sport – Wintersport': {
    kleinanzeigen: { haupt: 'Sport & Camping', unter: 'Wintersport' },
    ebay: { id: '888' },
  },

  // ── HOME & LIVING ────────────────────────────────────────────────────────────

  'Home': {
    kleinanzeigen: { haupt: 'Haus & Garten', unter: '' },
    ebay: { id: '11700' },
  },
  'Home & Living': {
    kleinanzeigen: { haupt: 'Haus & Garten', unter: '' },
    ebay: { id: '11700' },
  },
  'Home – Möbel': {
    kleinanzeigen: { haupt: 'Haus & Garten', unter: 'Möbel' },
    ebay: { id: '3197' },
  },
  'Home – Deko': {
    kleinanzeigen: { haupt: 'Haus & Garten', unter: 'Dekoration & Bild' },
    ebay: { id: '10033' },
  },
  'Home – Haushalt': {
    kleinanzeigen: { haupt: 'Haushaltsgeräte & Möbel', unter: '' },
    ebay: { id: '20625' },
  },
  'Home – Bettwäsche': {
    kleinanzeigen: { haupt: 'Haus & Garten', unter: 'Bettwäsche & Schlafzimmer' },
    ebay: { id: '11700' },
  },

  // ── UNTERHALTUNG ─────────────────────────────────────────────────────────────

  'Unterhaltung': {
    kleinanzeigen: { haupt: 'Musik, Filme & Bücher', unter: '' },
    ebay: { id: '11232' },
  },
  'Unterhaltung – Bücher': {
    kleinanzeigen: { haupt: 'Musik, Filme & Bücher', unter: 'Bücher & Zeitschriften' },
    ebay: { id: '267' },
  },
  'Unterhaltung – Musik': {
    kleinanzeigen: { haupt: 'Musik, Filme & Bücher', unter: 'Musik-CDs & Vinyl' },
    ebay: { id: '11233' },
  },
  'Unterhaltung – Filme': {
    kleinanzeigen: { haupt: 'Musik, Filme & Bücher', unter: 'Filme & DVDs' },
    ebay: { id: '11232' },
  },
  'Unterhaltung – Spiele': {
    kleinanzeigen: { haupt: 'Freizeit', unter: 'Spiele & Gesellschaftsspiele' },
    ebay: { id: '233' },
  },
  'Unterhaltung – Instrumente': {
    kleinanzeigen: { haupt: 'Musik, Filme & Bücher', unter: 'Musikinstrumente' },
    ebay: { id: '619' },
  },

  // ── BEAUTY ───────────────────────────────────────────────────────────────────

  'Beauty': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Kosmetik & Wellness' },
    ebay: { id: '26395' },
  },
  'Beauty – Make-up': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Kosmetik & Wellness' },
    ebay: { id: '26395' },
  },
  'Beauty – Parfums': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Kosmetik & Wellness' },
    ebay: { id: '180345' },
  },
  'Beauty – Haarpflege': {
    kleinanzeigen: { haupt: 'Mode & Beauty', unter: 'Kosmetik & Wellness' },
    ebay: { id: '26395' },
  },

  // ── HAUSTIERE ────────────────────────────────────────────────────────────────

  'Haustiere': {
    kleinanzeigen: { haupt: 'Tiere', unter: '' },
    ebay: { id: '1281' },
  },
  'Haustiere – Hunde': {
    kleinanzeigen: { haupt: 'Tiere', unter: 'Hunde' },
    ebay: { id: '20744' },
  },
  'Haustiere – Katzen': {
    kleinanzeigen: { haupt: 'Tiere', unter: 'Katzen' },
    ebay: { id: '20737' },
  },

  // ── SONSTIGES ────────────────────────────────────────────────────────────────

  'Sonstiges': {
    kleinanzeigen: { haupt: 'Verschiedenes', unter: '' },
    ebay: { id: '99' },
  },
}

// ── Lookup-Funktionen ─────────────────────────────────────────────────────────

function getMappingForCategory(category) {
  if (!category) return null

  // 1. Exakter Match
  if (CATEGORY_MAPPINGS[category]) return CATEGORY_MAPPINGS[category]

  // 2. Längster-Prefix-Match (genauester Fallback)
  const keys = Object.keys(CATEGORY_MAPPINGS).sort((a, b) => b.length - a.length)
  for (const key of keys) {
    if (category.startsWith(key + ' – ') || category === key) {
      return CATEGORY_MAPPINGS[key]
    }
  }

  // 3. Erstes Segment (Top-Level)
  const first = category.split(' – ')[0]
  return CATEGORY_MAPPINGS[first] || null
}

function getKleinanzeigenCategory(category) {
  const m = getMappingForCategory(category)
  return m?.kleinanzeigen || null
}

function getEbayCategoryId(category) {
  const m = getMappingForCategory(category)
  return m?.ebay?.id || null
}

// Gibt den Vinted-Klick-Pfad als Array zurück (= category.split(' – '))
function getVintedPath(category) {
  if (!category || category === 'Sonstiges') return []
  return category.split(' – ').map(s => s.trim()).filter(Boolean)
}

// ── Export (Node.js / Next.js) ───────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CATEGORY_MAPPINGS, getMappingForCategory, getKleinanzeigenCategory, getEbayCategoryId, getVintedPath }
}
