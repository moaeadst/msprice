import { Product, ProductMatchResult, InventoryStats } from '../types';
import { ImageHasher } from './imageHasher';

const STORAGE_KEY = 'product_scanner_inventory_v1';

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'زيت زيتون بكر ممتاز 500 مل',
    sellingPrice: 38.5,
    purchasePrice: 24.0,
    imagePath: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80',
    imageHash: '1111000011110000110011001100110010101010101010100101010101010101111100001111000011001100110011001010101010101010010101010101010111110000111100001100110011001100101010101010101001010101010101011111000011110000110011001100110010101010101010100101010101010101_8a47b39c58d2',
    category: 'أغذية وتموينات',
    barcode: '6281001234567',
    notes: 'عصرة أولى على البارد، من مزارع الجوف',
    supplier: 'شركة الجوف الزراعية',
    stock: 24,
    customFields: { 'الحجم': '500 مل', 'بلد المنشأ': 'المملكة العربية السعودية', 'تاريخ الانتهاء': '2027-12' },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
  },
  {
    id: 'prod-2',
    name: 'سماعات بلوتوث لاسلكية Pro',
    sellingPrice: 185.0,
    purchasePrice: 110.0,
    imagePath: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=80',
    imageHash: '0000111100001111001100110011001101010101010101011010101010101010000011110000111100110011001100110101010101010101101010101010101000001111000011110011001100110011010101010101010110101010101010100000111100001111001100110011001101010101010101011010101010101010_111111222222',
    category: 'إلكترونيات',
    barcode: '6282009876543',
    notes: 'عازل ضوضاء نشط ANC مع بطارية تدوم 30 ساعة',
    supplier: 'مؤسسة التقنية الحديثة',
    stock: 12,
    customFields: { 'اللون': 'أسود مطفي', 'الضمان': 'سنتين', 'المنفذ': 'Type-C' },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
  },
  {
    id: 'prod-3',
    name: 'قهوة عربية فاخرة بالهيل 250 جم',
    sellingPrice: 42.0,
    purchasePrice: 25.0,
    imagePath: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&auto=format&fit=crop&q=80',
    imageHash: '1100110011001100111100001111000010101010101010100101010101010101110011001100110011110000111100001010101010101010010101010101010111001100110011001111000011110000101010101010101001010101010101011100110011001100111100001111000010101010101010100101010101010101_753642864753',
    category: 'مشروبات وبن',
    barcode: '6283004561230',
    notes: 'خلطة القصيم المحمصة بدرجة شقراء مع زعفران وهيل هندي',
    supplier: 'محامص التراث الذهبي',
    stock: 35,
    customFields: { 'الوزن': '250 جرام', 'درجة التحميص': 'وسط شقراء' },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: 'prod-4',
    name: 'شاحن جداري سريع GaN 65W',
    sellingPrice: 95.0,
    purchasePrice: 52.0,
    imagePath: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&auto=format&fit=crop&q=80',
    imageHash: '1010101010101010110011001100110011110000111100000000111100001111101010101010101011001100110011001111000011110000000011110000111110101010101010101100110011001100111100001111000000001111000011111010101010101010110011001100110011110000111100000000111100001111_ffffff333333',
    category: 'إلكترونيات',
    barcode: '6284007890124',
    notes: 'ثلاثة منافذ (2 USB-C + 1 USB-A) يدعم تقنية PD و QC',
    supplier: 'مؤسسة التقنية الحديثة',
    stock: 4, // low stock test
    customFields: { 'القوة': '65 واط', 'التقنية': 'GaN III', 'الضمان': 'سنتين' },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    id: 'prod-5',
    name: 'عسل سدر بلدي طبيعي 1 كجم',
    sellingPrice: 240.0,
    purchasePrice: 160.0,
    imagePath: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=80',
    imageHash: '1111111100000000111100001111000010101010101010100101010101010101111111110000000011110000111100001010101010101010010101010101010111111111000000001111000011110000101010101010101001010101010101011111111100000000111100001111000010101010101010100101010101010101_b83c94d94b72',
    category: 'أغذية وتموينات',
    barcode: '6285003216548',
    notes: 'مفحوص مخبرياً ونقي 100% بدون إضافات',
    supplier: 'مناحل الجنوب الفاخرة',
    stock: 18,
    customFields: { 'الوزن': '1 كيلوجرام', 'المصدر': 'أودية الجنوب' },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  },
  {
    id: 'prod-6',
    name: 'دفتر ملاحظات وتخطيط جلدي فاخر',
    sellingPrice: 35.0,
    purchasePrice: 18.0,
    imagePath: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
    imageHash: '0011001100110011110011001100110001010101010101011010101010101010001100110011001111001100110011000101010101010101101010101010101000110011001100111100110011001100010101010101010110101010101010100011001100110011110011001100110001010101010101011010101010101010_453532453532',
    category: 'مستلزمات مكتبية',
    barcode: '6286006549871',
    notes: 'ورق سميك 120 جرام غير نافذ للحبر مع غلاف مقوى ومسطرة مرجعية',
    supplier: 'قرطاسية الإبداع',
    stock: 0, // out of stock test
    customFields: { 'الحجم': 'A5', 'عدد الصفحات': '180 صفحة', 'اللون': 'بني داكن' },
    createdAt: Date.now() - 1000 * 60 * 60 * 12,
    updatedAt: Date.now() - 1000 * 60 * 60 * 12,
  },
];

export class ProductStorage {
  static getProducts(): Product[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        this.saveProducts(INITIAL_PRODUCTS);
        return INITIAL_PRODUCTS;
      }
      return JSON.parse(stored);
    } catch {
      return INITIAL_PRODUCTS;
    }
  }

  static saveProducts(products: Product[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (e) {
      console.error('Failed to save products to localStorage', e);
    }
  }

  static getProductById(id: string): Product | undefined {
    const products = this.getProducts();
    return products.find(p => p.id === id);
  }

  static addOrUpdateProduct(product: Product): Product {
    const products = this.getProducts();
    const existingIdx = products.findIndex(p => p.id === product.id);
    const now = Date.now();

    const finalized: Product = {
      ...product,
      updatedAt: now,
      createdAt: product.createdAt || now,
      sellingPrice: Number(product.sellingPrice) || 0,
      purchasePrice: Number(product.purchasePrice) || 0,
      stock: Math.max(0, parseInt(String(product.stock), 10) || 0),
    };

    if (existingIdx >= 0) {
      products[existingIdx] = finalized;
    } else {
      products.unshift(finalized);
    }

    this.saveProducts(products);
    return finalized;
  }

  static deleteProduct(id: string): boolean {
    const products = this.getProducts();
    const filtered = products.filter(p => p.id !== id);
    if (filtered.length !== products.length) {
      this.saveProducts(filtered);
      return true;
    }
    return false;
  }

  static updateStock(id: string, delta: number): Product | undefined {
    const products = this.getProducts();
    const product = products.find(p => p.id === id);
    if (!product) return undefined;

    product.stock = Math.max(0, product.stock + delta);
    product.updatedAt = Date.now();
    this.saveProducts(products);
    return product;
  }

  static setStock(id: string, newStock: number): Product | undefined {
    const products = this.getProducts();
    const product = products.find(p => p.id === id);
    if (!product) return undefined;

    product.stock = Math.max(0, newStock);
    product.updatedAt = Date.now();
    this.saveProducts(products);
    return product;
  }

  static getCategories(): string[] {
    const products = this.getProducts();
    const categories = new Set<string>();
    products.forEach(p => {
      if (p.category && p.category.trim()) categories.add(p.category.trim());
    });
    return Array.from(categories).sort();
  }

  static getStats(): InventoryStats {
    const products = this.getProducts();
    let totalStockUnits = 0;
    let totalInventoryValue = 0;
    let totalRetailValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    const cats = new Set<string>();

    products.forEach(p => {
      const stock = p.stock || 0;
      totalStockUnits += stock;
      totalInventoryValue += (p.purchasePrice || 0) * stock;
      totalRetailValue += (p.sellingPrice || 0) * stock;
      if (stock === 0) {
        outOfStockCount++;
      } else if (stock <= 5) {
        lowStockCount++;
      }
      if (p.category) cats.add(p.category);
    });

    return {
      totalProducts: products.length,
      totalStockUnits,
      totalInventoryValue,
      totalRetailValue,
      potentialProfit: totalRetailValue - totalInventoryValue,
      lowStockCount,
      outOfStockCount,
      categoriesCount: cats.size,
    };
  }

  /**
   * Searches by Barcode or Visual Image Hash
   */
  static matchProduct(hash?: string, barcode?: string): ProductMatchResult[] {
    const products = this.getProducts();
    const results: ProductMatchResult[] = [];

    for (const p of products) {
      let barcodeMatched = false;
      if (barcode && p.barcode && p.barcode.trim() === barcode.trim()) {
        barcodeMatched = true;
      }

      let similarity = 0;
      if (hash && p.imageHash) {
        similarity = ImageHasher.similarity(hash, p.imageHash);
      }

      if (barcodeMatched && similarity >= 65) {
        results.push({ product: p, similarity: Math.max(98, similarity), matchType: 'both', barcodeMatched: true });
      } else if (barcodeMatched) {
        results.push({ product: p, similarity: 100, matchType: 'barcode', barcodeMatched: true });
      } else if (similarity >= 60) {
        results.push({ product: p, similarity, matchType: 'visual' });
      }
    }

    // Sort by match quality (highest similarity first)
    results.sort((a, b) => b.similarity - a.similarity);
    return results;
  }

  static resetToDefault(): Product[] {
    this.saveProducts(INITIAL_PRODUCTS);
    return INITIAL_PRODUCTS;
  }

  static exportToJson(): string {
    const products = this.getProducts();
    return JSON.stringify(products, null, 2);
  }

  static importFromJson(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed) && parsed.length > 0) {
        this.saveProducts(parsed);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
