// Categorías, tallas, estados y colores (estructura igual a Vinted)
export const SIZES = {
  ropa: ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "Talla única"],
  zapatos: ["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12", "13", "14"],
  ninos: ["0-3 meses", "3-6 meses", "6-12 meses", "12-18 meses", "18-24 meses", "2T", "3T", "4T", "5", "6", "7", "8", "10", "12", "14", "16"],
  ninoszap: ["0C", "1C", "2C", "3C", "4C", "5C", "6C", "7C", "8C", "9C", "10C", "11C", "12C", "13C", "1Y", "2Y", "3Y", "4Y", "5Y", "6Y", "7Y"],
};
export const SECTIONS = [
  { k: "mujer", n: "Mujer", subs: [["Ropa", "ropa"], ["Zapatos", "zapatos"], ["Bolsos"], ["Accesorios"], ["Belleza"]] },
  { k: "hombre", n: "Hombre", subs: [["Ropa", "ropa"], ["Zapatos", "zapatos"], ["Accesorios"], ["Cuidado personal"]] },
  { k: "disenador", n: "Diseñador", subs: [["Ropa de mujer", "ropa"], ["Ropa de hombre", "ropa"], ["Zapatos", "zapatos"], ["Bolsos"], ["Accesorios"]] },
  { k: "ninos", n: "Niños", subs: [["Ropa de niña", "ninos"], ["Ropa de niño", "ninos"], ["Zapatos", "ninoszap"], ["Juguetes"], ["Bebé"], ["Útiles escolares"]] },
  { k: "casa", n: "Casa", subs: [["Textiles"], ["Decoración"], ["Cocina y mesa"], ["Celebraciones"], ["Herramientas"]] },
  { k: "electronica", n: "Electrónica", subs: [["Celulares"], ["Computadoras"], ["Tabletas"], ["Videojuegos y consolas"], ["Audio y audífonos"], ["Cámaras"], ["Accesorios"]] },
  { k: "entretenimiento", n: "Entretenimiento", subs: [["Libros"], ["Música"], ["Películas"]] },
  { k: "hobbies", n: "Hobbies y coleccionables", subs: [["Cartas coleccionables"], ["Juegos de mesa"], ["Rompecabezas"], ["Instrumentos musicales"], ["Arte y manualidades"], ["Coleccionables"]] },
  { k: "deportes", n: "Deportes", subs: [["Ropa deportiva", "ropa"], ["Calzado deportivo", "zapatos"], ["Ciclismo"], ["Fitness"], ["Playa y deportes acuáticos"], ["Deportes de equipo"], ["Camping"]] },
  { k: "mascotas", n: "Mascotas", subs: [["Perros"], ["Gatos"], ["Otras mascotas"]] },
];
export const sectionName = (k) => SECTIONS.find((s) => s.k === k)?.n || "";
export function sizeTypeFor(section, sub) {
  const s = SECTIONS.find((x) => x.k === section);
  return s?.subs.find((x) => x[0] === sub)?.[1] || null;
}
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
export const BRANDS = ["Nike", "Adidas", "Jordan", "Puma", "New Balance", "Converse", "Vans", "Reebok", "Under Armour", "Lululemon", "Zara", "H&M", "Shein", "Forever 21", "Old Navy", "Gap", "Levi's", "American Eagle", "Hollister", "Abercrombie & Fitch", "Tommy Hilfiger", "Calvin Klein", "Ralph Lauren", "Guess", "Michael Kors", "Coach", "Kate Spade", "Steve Madden", "Skechers", "Crocs", "Champion", "The North Face", "Carter's", "Disney", "Apple", "Samsung", "Sony", "Nintendo"];
