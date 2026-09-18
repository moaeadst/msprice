export interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  purchasePrice: number;
  imagePath: string; // Base64 data URL or web image URL
  imageHash: string; // Perceptual fingerprint string
  category: string;
  barcode: string;
  notes: string;
  supplier: string;
  stock: number;
  customFields: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

export interface ProductMatchResult {
  product: Product;
  similarity: number; // 0 - 100
  matchType: 'barcode' | 'visual' | 'both';
  barcodeMatched?: boolean;
}

export type ActiveTab = 'home' | 'camera' | 'add_product' | 'products' | 'detail' | 'edit';

export interface FilterOptions {
  searchQuery: string;
  category: string;
  stockFilter: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  sortBy: 'date_desc' | 'date_asc' | 'price_desc' | 'price_asc' | 'profit_desc' | 'stock_desc' | 'name_asc';
}

export interface InventoryStats {
  totalProducts: number;
  totalStockUnits: number;
  totalInventoryValue: number; // sum(purchasePrice * stock)
  totalRetailValue: number; // sum(sellingPrice * stock)
  potentialProfit: number; // totalRetailValue - totalInventoryValue
  lowStockCount: number; // stock <= 5
  outOfStockCount: number; // stock === 0
  categoriesCount: number;
}
