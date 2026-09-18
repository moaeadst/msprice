import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  SlidersHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  PlusCircle, 
  Minus, 
  Barcode, 
  Download, 
  Upload, 
  RotateCcw, 
  LayoutGrid, 
  List, 
  AlertCircle,
  TrendingUp,
  Package,
  Check
} from 'lucide-react';
import { Product, FilterOptions } from '../types';
import { ProductStorage } from '../utils/storage';

interface ProductsListScreenProps {
  products: Product[];
  categories: string[];
  onSelectProduct: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onAddNewProduct: () => void;
  onProductsUpdated: () => void;
}

export const ProductsListScreen: React.FC<ProductsListScreenProps> = ({
  products,
  categories,
  onSelectProduct,
  onEditProduct,
  onAddNewProduct,
  onProductsUpdated,
}) => {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    searchQuery: '',
    category: 'all',
    stockFilter: 'all',
    sortBy: 'date_desc',
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Filter & Sort Logic
  const filteredProducts = products.filter((p) => {
    // Search query
    const q = filterOptions.searchQuery.toLowerCase().trim();
    if (q) {
      const matches = 
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.supplier.toLowerCase().includes(q) ||
        p.notes.toLowerCase().includes(q);
      if (!matches) return false;
    }

    // Category
    if (filterOptions.category !== 'all' && p.category !== filterOptions.category) {
      return false;
    }

    // Stock Filter
    if (filterOptions.stockFilter === 'in_stock' && p.stock <= 5) return false;
    if (filterOptions.stockFilter === 'low_stock' && (p.stock > 5 || p.stock === 0)) return false;
    if (filterOptions.stockFilter === 'out_of_stock' && p.stock > 0) return false;

    return true;
  }).sort((a, b) => {
    switch (filterOptions.sortBy) {
      case 'date_desc':
        return b.updatedAt - a.updatedAt;
      case 'date_asc':
        return a.createdAt - b.createdAt;
      case 'price_desc':
        return b.sellingPrice - a.sellingPrice;
      case 'price_asc':
        return a.sellingPrice - b.sellingPrice;
      case 'stock_desc':
        return b.stock - a.stock;
      case 'profit_desc':
        return (b.sellingPrice - b.purchasePrice) - (a.sellingPrice - a.purchasePrice);
      case 'name_asc':
        return a.name.localeCompare(b.name, 'ar');
      default:
        return 0;
    }
  });

  // Handle inline stock increment/decrement
  const handleStockDelta = (id: string, delta: number) => {
    ProductStorage.updateStock(id, delta);
    onProductsUpdated();
  };

  // Delete handler
  const handleDelete = (id: string) => {
    ProductStorage.deleteProduct(id);
    setDeleteConfirmId(null);
    onProductsUpdated();
  };

  // Export JSON handler
  const handleExport = () => {
    const json = ProductStorage.exportToJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_inventory_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON handler
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const ok = ProductStorage.importFromJson(text);
      if (ok) {
        setImportStatus('تم استيراد المنتجات بنجاح!');
        onProductsUpdated();
      } else {
        setImportStatus('تعذر قراءة ملف البيانات. يرجى التأكد من التنسيق.');
      }
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);
  };

  // Reset to default sample handler
  const handleResetToDefault = () => {
    if (confirm('هل أنت متأكد من رغبتك في استعادة بيانات المنتجات الافتراضية؟ سيتم استبدال البيانات الحالية.')) {
      ProductStorage.resetToDefault();
      onProductsUpdated();
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-6xl mx-auto">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" />
            قائمة المنتجات والمخزون
          </h1>
          <p className="text-xs text-slate-500">
            إدارة كافة المنتجات وتتبع الأسعار وتحديث الكميات فورياً
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="add-product-btn-catalog"
            onClick={onAddNewProduct}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            إضافة منتج جديد
          </button>

          {/* View mode toggle */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="عرض شبكي"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'list' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="عرض قائمة"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={filterOptions.searchQuery}
              onChange={(e) => setFilterOptions(prev => ({ ...prev, searchQuery: e.target.value }))}
              placeholder="ابحث بالاسم، الباركود، الفئة، أو المورد..."
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
            {filterOptions.searchQuery && (
              <button
                onClick={() => setFilterOptions(prev => ({ ...prev, searchQuery: '' }))}
                className="absolute left-3 top-2.5 text-[10px] text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded bg-slate-200"
              >
                مسح
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={filterOptions.sortBy}
              onChange={(e) => setFilterOptions(prev => ({ ...prev, sortBy: e.target.value as any }))}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="date_desc">الأحدث إضافة وتعديلاً</option>
              <option value="price_desc">سعر البيع: من الأعلى</option>
              <option value="price_asc">سعر البيع: من الأقل</option>
              <option value="profit_desc">الأكثر ربحاً (صافي)</option>
              <option value="stock_desc">المخزون: الأكثر وفرة</option>
              <option value="name_asc">الاسم (أ - ي)</option>
            </select>
          </div>
        </div>

        {/* Categories & Stock Status Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterOptions(prev => ({ ...prev, category: 'all' }))}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                filterOptions.category === 'all'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              الكل ({products.length})
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setFilterOptions(prev => ({ ...prev, category: c }))}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  filterOptions.category === c
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c} ({products.filter(p => p.category === c).length})
              </button>
            ))}
          </div>

          {/* Stock Condition */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterOptions(prev => ({ ...prev, stockFilter: 'all' }))}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                filterOptions.stockFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              كل الحالات
            </button>
            <button
              onClick={() => setFilterOptions(prev => ({ ...prev, stockFilter: 'in_stock' }))}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                filterOptions.stockFilter === 'in_stock' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              متوفر
            </button>
            <button
              onClick={() => setFilterOptions(prev => ({ ...prev, stockFilter: 'low_stock' }))}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                filterOptions.stockFilter === 'low_stock' ? 'bg-amber-100 text-amber-800' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              منخفض
            </button>
            <button
              onClick={() => setFilterOptions(prev => ({ ...prev, stockFilter: 'out_of_stock' }))}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                filterOptions.stockFilter === 'out_of_stock' ? 'bg-rose-100 text-rose-800' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              نافذ
            </button>
          </div>
        </div>
      </div>

      {/* Notification status if import succeeded/failed */}
      {importStatus && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          {importStatus}
        </div>
      )}

      {/* Products Grid / List View */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">لا توجد منتجات تطابق هذا البحث</h3>
            <p className="text-xs text-slate-500 mt-1">جرب تغيير معايير البحث أو تصفية الفئات</p>
          </div>
          <button
            onClick={() => setFilterOptions({ searchQuery: '', category: 'all', stockFilter: 'all', sortBy: 'date_desc' })}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            إلغاء كل التصفية
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const profit = product.sellingPrice - product.purchasePrice;
            const margin = product.purchasePrice > 0 ? (profit / product.purchasePrice) * 100 : 0;
            const isLow = product.stock > 0 && product.stock <= 5;
            const isOut = product.stock === 0;

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Image + Badge Header */}
                  <div className="relative aspect-16/10 bg-slate-100 overflow-hidden group">
                    <img
                      src={product.imagePath}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    
                    {/* Status Badge */}
                    <div className="absolute top-2.5 right-2.5">
                      {isOut ? (
                        <span className="px-2.5 py-1 rounded-lg bg-rose-600/90 backdrop-blur-xs text-white text-[11px] font-black shadow-xs">
                          نفذ من المخزون
                        </span>
                      ) : isLow ? (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/90 backdrop-blur-xs text-white text-[11px] font-black shadow-xs">
                          شارف على النفاد ({product.stock})
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-600/90 backdrop-blur-xs text-white text-[11px] font-black shadow-xs">
                          متوفر ({product.stock})
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {product.category}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3
                        onClick={() => onSelectProduct(product)}
                        className="text-sm font-black text-slate-900 hover:text-emerald-600 cursor-pointer line-clamp-1 transition-colors"
                      >
                        {product.name}
                      </h3>
                      {product.barcode && (
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 mt-1">
                          <Barcode className="w-3.5 h-3.5 text-slate-400" />
                          <span>{product.barcode}</span>
                        </div>
                      )}
                    </div>

                    {/* Price & Profit Row */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold">سعر البيع</div>
                        <div className="font-black text-slate-900 text-sm">{product.sellingPrice.toFixed(2)} ر.س</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-emerald-700 font-bold">الربح الصافي</div>
                        <div className="font-black text-emerald-600 text-sm">
                          +{profit.toFixed(1)} <span className="text-[10px]">({margin.toFixed(0)}%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Inline Stock Actions & Modifiers */}
                <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                  {/* Stock quick change */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleStockDelta(product.id, -1)}
                      disabled={product.stock <= 0}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center font-bold text-xs disabled:opacity-40"
                      title="بيع قطعة (-1)"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-black text-slate-800 px-1.5">{product.stock}</span>
                    <button
                      onClick={() => handleStockDelta(product.id, 1)}
                      className="w-7 h-7 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center font-bold text-xs"
                      title="زيادة المخزون (+1)"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onSelectProduct(product)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
                      title="عرض التفاصيل"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditProduct(product)}
                      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-white rounded-lg transition-colors"
                      title="تعديل المنتج"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(product.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
          {filteredProducts.map((product) => {
            const profit = product.sellingPrice - product.purchasePrice;
            const margin = product.purchasePrice > 0 ? (profit / product.purchasePrice) * 100 : 0;
            return (
              <div
                key={product.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={product.imagePath}
                    alt={product.name}
                    className="w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0 cursor-pointer"
                    onClick={() => onSelectProduct(product)}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {product.category}
                      </span>
                      {product.stock <= 5 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${product.stock === 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                          {product.stock === 0 ? 'نافذ' : 'منخفض'}
                        </span>
                      )}
                    </div>
                    <h4
                      onClick={() => onSelectProduct(product)}
                      className="text-xs sm:text-sm font-black text-slate-900 hover:text-emerald-600 cursor-pointer mt-0.5"
                    >
                      {product.name}
                    </h4>
                    <span className="text-[11px] font-mono text-slate-400">باركود: {product.barcode || '—'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <div className="text-xs sm:text-sm font-black text-slate-900">{product.sellingPrice.toFixed(2)} ر.س</div>
                    <div className="text-[10px] text-emerald-600 font-bold">ربح: +{profit.toFixed(1)} ({margin.toFixed(0)}%)</div>
                  </div>

                  {/* Stock */}
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => handleStockDelta(product.id, -1)}
                      disabled={product.stock <= 0}
                      className="w-6 h-6 rounded bg-white text-slate-700 flex items-center justify-center font-bold text-xs disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold text-slate-900 px-1">{product.stock}</span>
                    <button
                      onClick={() => handleStockDelta(product.id, 1)}
                      className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-xs"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onSelectProduct(product)}
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                      title="عرض التفاصيل"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditProduct(product)}
                      className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg"
                      title="تعديل"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(product.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-black text-slate-900">تأكيد حذف المنتج</h3>
              <p className="text-xs text-slate-500 mt-1">هل أنت متأكد من رغبتك في حذف هذا المنتج من الكتالوج؟ لا يمكن التراجع عن هذا الإجراء.</p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors"
              >
                نعم، احذف المنتج
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Database Tools / Backup & Restore Footer */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="text-slate-500 font-medium">
          إجمالي النتائج: <strong className="text-slate-900">{filteredProducts.length}</strong> من أصل {products.length} منتج
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors flex items-center gap-1.5"
            title="تصدير نسخة احتياطية من البيانات بصيغة JSON"
          >
            <Download className="w-3.5 h-3.5" />
            تصدير نسخة
          </button>

          <label className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            استيراد
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>

          <button
            onClick={handleResetToDefault}
            className="px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-medium transition-colors flex items-center gap-1"
            title="استعادة المنتجات التوضيحية الافتراضية"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            استعادة الافتراضي
          </button>
        </div>
      </div>
    </div>
  );
};
