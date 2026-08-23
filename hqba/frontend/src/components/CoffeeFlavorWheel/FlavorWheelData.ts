export interface FlavorNode {
  name: string;
  name_ar: string;
  colour: string;
  definition?: string;
  children?: FlavorNode[];
}

// Arabic translation map for all flavors
// Map English name -> Arabic name
const arabicNames: Record<string, string> = {
  // ===== Main categories (9) =====
  'Fruity': 'فواكه',
  'Sour/Fermented': 'حامض/مختمر',
  'Green/Vegetative': 'نباتي/أخضر',
  'Other': 'أخرى',
  'Roasted': 'محمّص',
  'Spices': 'بهارات',
  'Nutty/Cocoa': 'مكسرات/كاكاو',
  'Sweet': 'حلو',
  'Floral': 'زهري',

  // ===== Fruity sub-categories =====
  'Berry': 'توت',
  'Dried fruit': 'فواكه مجففة',
  'Other fruit': 'فواكه أخرى',
  'Citrus fruit': 'حمضيات',
  // Fruity - Berry children
  'Blackberry': 'توت أسود',
  'Raspberry': 'توت العليق',
  'Blueberry': 'توت أزرق',
  'Strawberry': 'فراولة',
  // Fruity - Dried fruit children
  'Raisin': 'زبيب',
  'Prune': 'برقوق مجفف',
  // Fruity - Other fruit children
  'Coconut': 'جوز الهند',
  'Cherry': 'كرز',
  'Pomegranate': 'رمان',
  'Pineapple': 'أناناس',
  'Grape': 'عنب',
  'Apple': 'تفاح',
  'Peach': 'خوخ',
  'Pear': 'كمثرى',
  // Fruity - Citrus fruit children
  'Grapefruit': 'جريب فروت',
  'Orange': 'برتقال',
  'Lemon': 'ليمون',
  'Lime': 'ليمون أخضر',

  // ===== Sour/Fermented sub-categories =====
  'Sour': 'حامض',
  'Alcohol/Fermented': 'كحولي/مختمر',
  // Sour children
  'Sour aromatics': 'عطريات حامضة',
  'Acetic acid': 'حمض الخليك',
  'Butyric acid': 'حمض البيوتريك',
  'Isovaleric acid': 'حمض الإيزوفاليريك',
  'Citric acid': 'حمض الستريك',
  'Malic acid': 'حمض الماليك',
  // Alcohol/Fermented children
  'Winey': 'نبيذي',
  'Whiskey': 'ويسكي',
  'Fermented': 'مختمر',
  'Overripe': 'فاكهة ناضجة جداً',

  // ===== Green/Vegetative sub-categories =====
  'Olive oil': 'زيت زيتون',
  'Raw': 'خام',
  'Beany': 'بقولي',
  // Green/Vegetative children (inner "Green/Vegetative" already mapped above)
  'Under-ripe': 'غير ناضج',
  'Peapod': 'قرن البازلاء',
  'Fresh': 'طازج',
  'Dark green': 'أخضر داكن',
  'Vegetative': 'نباتي',
  'Hay-like': 'قشّي',
  'Herb-like': 'عشبي',

  // ===== Other sub-categories =====
  'Papery/Musty': 'ورقي/عفن',
  'Chemical': 'كيميائي',
  // Papery/Musty children
  'Stale': 'بايت',
  'Cardboard': 'كرتوني',
  'Papery': 'ورقي',
  'Woody': 'خشبي',
  'Moldy/Damp': 'متعفن/رطب',
  'Musty/Dusty': 'عفن/مغبّر',
  'Musty/Earthy': 'عفن/ترابي',
  'Animalic': 'حيواني',
  'Meaty/Brothy': 'لحمي/مرقي',
  'Phenolic': 'فينولي',
  // Chemical children
  'Bitter': 'مرّ',
  'Salty': 'مالح',
  'Medicinal': 'دوائي',
  'Petroleum': 'بترولي',
  'Skunky': 'نتن',
  'Rubber': 'مطاطي',

  // ===== Roasted sub-categories =====
  'Pipe tobacco': 'تبغ غليون',
  'Tobacco': 'تبغ',
  'Burnt': 'محترق',
  'Cereal': 'حبوب',
  // Burnt children
  'Acrid': 'حِرّيف',
  'Ashy': 'رمادي',
  'Smoky': 'دخاني',
  'Brown, Roast': 'بني محمّص',
  // Cereal children
  'Grain': 'حبوب',
  'Malt': 'شعير',

  // ===== Spices sub-categories =====
  'Pungent': 'لاذع',
  'Pepper': 'فلفل',
  'Brown spice': 'بهارات بنية',
  // Brown spice children
  'Anise': 'يانسون',
  'Nutmeg': 'جوزة الطيب',
  'Cinnamon': 'قرفة',
  'Clove': 'قرنفل',

  // ===== Nutty/Cocoa sub-categories =====
  'Nutty': 'مكسرات',
  'Cocoa': 'كاكاو',
  // Nutty children
  'Peanuts': 'فول سوداني',
  'Hazelnut': 'بندق',
  'Almond': 'لوز',
  // Cocoa children
  'Chocolate': 'شوكولاتة',
  'Dark chocolate': 'شوكولاتة داكنة',

  // ===== Sweet sub-categories =====
  'Brown sugar': 'سكر بني',
  'Vanilla': 'فانيلا',
  'Vanillin': 'فانيلين',
  'Overall sweet': 'حلاوة عامة',
  'Sweet Aromatics': 'عطريات حلوة',
  // Brown sugar children
  'Molasses': 'دبس',
  'Mapple syrup': 'شراب القيقب',
  'Caramelized': 'مكرمل',
  'Honey': 'عسل',

  // ===== Floral sub-categories =====
  'Black Tea': 'شاي أسود',
  // Floral children (inner "Floral" already mapped above)
  'Chamomile': 'بابونج',
  'Rose': 'ورد',
  'Jasmine': 'ياسمين',
};

// Function to process raw JSON and add Arabic names
function processNode(node: {
  name: string;
  colour: string;
  definition?: string;
  children?: Array<{
    name: string;
    colour: string;
    definition?: string;
    children?: unknown[];
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}): FlavorNode {
  return {
    name: node.name,
    name_ar: arabicNames[node.name] || node.name,
    colour: node.colour,
    definition: node.definition,
    children: node.children?.map((child) => processNode(child as typeof node)),
  };
}

// Import and process the data
import rawData from '@/data/coffee-flavor-wheel.json';

const jsonData = rawData as {
  data: Array<{
    name: string;
    colour: string;
    definition?: string;
    children?: unknown[];
    [key: string]: unknown;
  }>;
};

export const flavorWheelData: FlavorNode[] = jsonData.data.map((node) =>
  processNode(node as Parameters<typeof processNode>[0])
);
