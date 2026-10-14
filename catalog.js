// Catálogo con la misma estructura que Vinted (EE. UU.): categoría › subcategoría › tipo.
// Nodo: [nombre, gruposDeTalla | null, hijos?]. Los grupos de talla se heredan hacia abajo.

const half = (a, b) => { const r = []; for (let x = a; x <= b; x += 0.5) r.push(String(x)); return r; };
const range = (a, b, step = 1, pre = "") => { const r = []; for (let x = a; x <= b; x += step) r.push(pre + x); return r; };

export const SIZE_GROUPS = {
  w_top: ["Tallas de mujer", ["XXXS", "XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL", "Talla única"]],
  w_num: ["Tallas numéricas de mujer", ["00", "0", ...range(2, 24, 2)]],
  w_pants: ["Pantalones de mujer", range(23, 36, 1, "W")],
  w_shoes: ["Zapatos de mujer", half(5, 12)],
  m_top: ["Tallas de hombre", ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL", "6XL", "7XL", "8XL", "Talla única"]],
  m_pants: ["Pantalones de hombre", range(26, 44, 1, "W")],
  m_shoes: ["Zapatos de hombre", [...half(6, 13), "14", "15"]],
  k_clothes: ["Ropa de niños", ["0-3 meses", "3-6 meses", "6-12 meses", "12-18 meses", "18-24 meses", "2T", "3T", "4T", "5", "6", "7", "8", "10", "12", "14", "16"]],
  k_shoes: ["Zapatos de niños", ["0C", "1C", "2C", "3C", "4C", "5C", "6C", "7C", "8C", "9C", "10C", "11C", "12C", "13C", "1Y", "2Y", "3Y", "4Y", "5Y", "6Y", "7Y"]],
  u_top: ["Tallas", ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "Talla única"]],
  u_shoes: ["Calzado", half(5, 13)],
};

const W = ["w_top", "w_num"], WB = ["w_top", "w_num", "w_pants"], M = ["m_top"], MB = ["m_top", "m_pants"];
const leaves = (...names) => names.map((n) => [n]);

export const TREE = [
  ["Mujer", null, [
    ["Ropa", W, [
      ["Vestidos", null, leaves("Minivestidos", "Vestidos midi", "Vestidos largos", "Vestidos de fiesta", "Vestidos casuales")],
      ["Tops y camisetas", null, leaves("Camisetas", "Blusas", "Crop tops", "Tank tops", "Bodysuits", "Camisas")],
      ["Suéteres y sudaderas", null, leaves("Sudaderas con capucha", "Sudaderas", "Suéteres", "Cárdigans")],
      ["Abrigos y chaquetas", null, leaves("Chaquetas", "Chaquetas de mezclilla", "Abrigos", "Chalecos", "Rompevientos")],
      ["Jeans", WB, leaves("Jeans rotos", "Skinny jeans", "Jeans rectos", "Jeans anchos", "Mom jeans", "Jeans acampanados")],
      ["Pantalones", WB, leaves("Leggings", "Joggers", "Pantalones de vestir", "Pantalones anchos", "Pantalones cargo")],
      ["Faldas", null, leaves("Minifaldas", "Faldas midi", "Faldas largas")],
      ["Shorts", WB, leaves("Shorts de mezclilla", "Shorts deportivos", "Shorts casuales")],
      ["Enterizos y monos"],
      ["Conjuntos"],
      ["Trajes de baño", null, leaves("Bikinis", "Trajes de baño enteros", "Salidas de playa")],
      ["Ropa deportiva", null, leaves("Leggings deportivos", "Sostenes deportivos", "Tops deportivos", "Shorts deportivos")],
      ["Ropa interior y de dormir", null, leaves("Sostenes", "Ropa interior", "Pijamas", "Batas")],
      ["Maternidad"],
      ["Disfraces y ropa especial"],
    ]],
    ["Zapatos", ["w_shoes"], leaves("Tenis", "Sandalias", "Tacones", "Botas", "Zapatos planos", "Chancletas", "Mocasines")],
    ["Bolsos", null, leaves("Carteras", "Bolsos de mano", "Tote bags", "Bandoleras", "Mochilas", "Riñoneras", "Clutches", "Billeteras")],
    ["Accesorios", null, [
      ["Joyería", null, leaves("Collares", "Aretes", "Pulseras", "Anillos")],
      ["Gafas de sol"], ["Relojes"], ["Gorras y sombreros"], ["Correas"], ["Accesorios para el pelo"], ["Bufandas"],
    ]],
    ["Belleza", null, leaves("Maquillaje", "Cuidado de la piel", "Perfumes", "Cuidado del cabello", "Uñas")],
  ]],
  ["Hombre", null, [
    ["Ropa", M, [
      ["Jeans", MB, leaves("Jeans rotos", "Skinny jeans", "Jeans slim fit", "Jeans rectos")],
      ["Abrigos y chaquetas", null, leaves("Chaquetas", "Abrigos", "Chalecos", "Rompevientos")],
      ["Tops y camisetas", null, leaves("Camisetas", "Camisas", "Polos", "Tank tops")],
      ["Trajes y blazers", MB, leaves("Trajes", "Blazers", "Pantalones de traje")],
      ["Suéteres y sudaderas", null, leaves("Sudaderas con capucha", "Sudaderas", "Suéteres", "Cárdigans")],
      ["Pantalones", MB, leaves("Chinos", "Joggers", "Pantalones cargo", "Pantalones de vestir")],
      ["Shorts", MB, leaves("Shorts deportivos", "Shorts cargo", "Shorts de mezclilla", "Shorts casuales")],
      ["Medias y ropa interior"],
      ["Ropa de dormir"],
      ["Trajes de baño"],
      ["Ropa deportiva", null, leaves("Camisetas deportivas", "Shorts deportivos", "Pantalones deportivos", "Chaquetas deportivas")],
      ["Disfraces y ropa especial"],
    ]],
    ["Zapatos", ["m_shoes"], leaves("Tenis", "Botas", "Sandalias y chancletas", "Zapatos de vestir", "Mocasines", "Zapatos deportivos")],
    ["Accesorios", null, leaves("Gorras y sombreros", "Gafas de sol", "Relojes", "Joyería", "Correas", "Billeteras", "Mochilas y bolsos")],
    ["Cuidado personal", null, leaves("Perfumes y colonias", "Cuidado de la piel", "Cuidado del cabello", "Afeitado")],
  ]],
  ["Niños", null, [
    ["Ropa de niña", ["k_clothes"], leaves("Bebé", "Tops y camisetas", "Vestidos", "Pantalones y shorts", "Abrigos", "Trajes de baño", "Pijamas", "Conjuntos")],
    ["Ropa de niño", ["k_clothes"], leaves("Bebé", "Tops y camisetas", "Pantalones y shorts", "Abrigos", "Trajes de baño", "Pijamas", "Conjuntos")],
    ["Zapatos", ["k_shoes"], leaves("Zapatos de niña", "Zapatos de niño")],
    ["Juguetes", null, leaves("Muñecas", "Peluches", "LEGO y bloques", "Carritos", "Juegos educativos", "Juguetes de exterior")],
    ["Artículos de bebé", null, leaves("Coches", "Asientos de carro", "Cunas y muebles", "Alimentación", "Baño")],
    ["Útiles escolares", null, leaves("Mochilas", "Loncheras", "Útiles")],
  ]],
  ["Casa", null, [
    ["Textiles", null, leaves("Ropa de cama", "Toallas", "Cortinas", "Cojines", "Alfombras")],
    ["Decoración", null, leaves("Cuadros", "Espejos", "Velas", "Plantas artificiales", "Relojes de pared", "Floreros")],
    ["Cocina y mesa", null, leaves("Ollas y sartenes", "Vajilla", "Vasos y copas", "Utensilios", "Pequeños electrodomésticos")],
    ["Muebles"],
    ["Celebraciones y fiestas"],
    ["Herramientas y jardín"],
  ]],
  ["Electrónica", null, [
    ["Celulares", null, leaves("Celulares", "Fundas y accesorios")],
    ["Computadoras", null, leaves("Laptops", "Computadoras de mesa", "Monitores", "Accesorios de computadora")],
    ["Tabletas y lectores"],
    ["Videojuegos y consolas", null, leaves("Consolas", "Videojuegos", "Controles y accesorios")],
    ["Audio", null, leaves("Audífonos", "Bocinas", "Tocadiscos")],
    ["Cámaras"],
    ["TV y video"],
    ["Relojes inteligentes"],
    ["Cargadores y cables"],
  ]],
  ["Libros y medios", null, [
    ["Libros", null, leaves("Ficción", "No ficción", "Infantiles", "Cómics y manga", "Libros de texto")],
    ["Música", null, leaves("Vinilos", "CDs")],
    ["Películas", null, leaves("DVD", "Blu-ray")],
  ]],
  ["Hobbies y coleccionables", null, [
    ["Cartas coleccionables", null, leaves("Pokémon", "Cartas deportivas", "Otras cartas")],
    ["Juegos de mesa"], ["Rompecabezas"], ["Instrumentos musicales"], ["Arte y manualidades"],
    ["Coleccionables", null, leaves("Figuras", "Monedas y sellos", "Recuerdos")],
  ]],
  ["Deportes", null, [
    ["Ropa deportiva", ["u_top"]],
    ["Calzado deportivo", ["u_shoes"]],
    ["Ciclismo"], ["Fitness y gimnasio"],
    ["Playa y deportes acuáticos", null, leaves("Surf", "Snorkel y buceo", "Kayak y paddle")],
    ["Deportes de equipo", null, leaves("Baloncesto", "Béisbol", "Fútbol", "Voleibol")],
    ["Camping y senderismo"], ["Golf"], ["Pesca"], ["Boxeo y artes marciales"],
  ]],
];

// Clave en la base de datos para cada sección principal
const KEYS = { "Mujer": "mujer", "Hombre": "hombre", "Niños": "ninos", "Casa": "casa", "Electrónica": "electronica", "Libros y medios": "entretenimiento", "Hobbies y coleccionables": "hobbies", "Deportes": "deportes" };
export const SECTIONS = TREE.map(([n]) => ({ k: KEYS[n], n }));
const OLD = { disenador: "Diseñador", mascotas: "Mascotas" };
export const sectionName = (k) => SECTIONS.find((s) => s.k === k)?.n || OLD[k] || "";
export const sectionKey = (name) => KEYS[name] || "";

// Nodo en una ruta de nombres, ej. ["Hombre","Ropa","Jeans"]
export function nodeAt(path) {
  let list = TREE, node = null;
  for (const name of path) {
    node = list.find((x) => x[0] === name);
    if (!node) return null;
    list = node[2] || [];
  }
  return node;
}
export const childrenAt = (path) => (path.length ? nodeAt(path)?.[2] || [] : TREE);
export const isLeaf = (path) => path.length > 0 && !(nodeAt(path)?.[2]?.length);
// Grupos de talla que aplican (el más específico gana)
export function sizeGroupsFor(path) {
  let list = TREE, groups = null;
  for (const name of path || []) {
    const node = list.find((x) => x[0] === name);
    if (!node) break;
    if (node[1]) groups = node[1];
    list = node[2] || [];
  }
  return groups || [];
}
// Todas las hojas, para la búsqueda de categorías
export const ALL_LEAVES = (() => {
  const out = [];
  const walk = (list, path) => list.forEach((n) => { const p = [...path, n[0]]; n[2]?.length ? walk(n[2], p) : out.push(p); });
  walk(TREE, []);
  return out;
})();
// Grupos de talla por género, para Personalización
export const GENDER_GROUPS = {
  mujer: [["w_top", "w_num"], ["w_pants"], ["w_shoes"]].flat(),
  hombre: ["m_top", "m_pants", "m_shoes"],
  ninos: ["k_clothes", "k_shoes"],
};

export const PARCELS = [
  ["S", "Pequeño", "Para cosas que caben en un sobre grande.", 3.5],
  ["M", "Mediano", "Para cosas que caben en una caja de zapatos.", 4.5],
  ["L", "Grande", "Para cosas que caben en una caja de mudanza.", 7.99],
];

export const CONDS = [
  ["Nuevo con etiquetas", "Nuevo, sin usar y con las etiquetas puestas."],
  ["Nuevo sin etiquetas", "Nuevo y sin usar, pero ya no tiene etiquetas."],
  ["Muy bueno", "Se usó pocas veces y no tiene defectos."],
  ["Bueno", "Se usó, con señales ligeras de uso. Descríbelas."],
  ["Satisfactorio", "Se usó mucho y tiene defectos visibles. Descríbelos."],
];
export const COLORS = [
  ["Negro", "#1b1b1b"], ["Blanco", "#ffffff"], ["Gris", "#9a9a9a"], ["Beige", "#e3d3b6"], ["Marrón", "#7a4b2a"],
  ["Rojo", "#d32f2f"], ["Rosa", "#f48fb1"], ["Naranja", "#fb8c00"], ["Amarillo", "#fdd835"], ["Verde", "#43a047"],
  ["Azul", "#1e66d0"], ["Azul marino", "#1a2a5a"], ["Morado", "#8e44ad"], ["Dorado", "#c9a227"], ["Plateado", "#c0c0c0"], ["Multicolor", "conic-gradient(red,orange,yellow,green,blue,purple,red)"],
];
export const MATERIALS = ["Algodón", "Mezclilla", "Poliéster", "Lino", "Seda", "Lana", "Cuero", "Piel sintética", "Nylon", "Spandex", "Otro"];
export const BRANDS = ["Nike", "Adidas", "Zara", "Shein", "H&M", "Jordan", "Lululemon", "Levi's", "Bershka", "Pull & Bear", "Puma", "New Balance", "Converse", "Vans", "Reebok", "Under Armour", "Forever 21", "Old Navy", "Gap", "American Eagle", "Hollister", "Abercrombie & Fitch", "Tommy Hilfiger", "Calvin Klein", "Ralph Lauren", "Guess", "Michael Kors", "Coach", "Kate Spade", "Steve Madden", "Skechers", "Crocs", "Champion", "The North Face", "Diesel", "Amiri", "Supreme", "Fashion Nova", "Princess Polly", "Free People", "Urban Outfitters", "Carter's", "Disney", "Apple", "Samsung", "Sony", "Nintendo"];
