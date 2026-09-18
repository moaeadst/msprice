import React, { useState } from 'react';
import { 
  Scan, 
  PlusCircle, 
  Package, 
  Search, 
  TrendingUp, 
  AlertTriangle, 
  FolderTree, 
  ArrowLeft,
  DollarSign,
  Sparkles,
  ChevronLeft,
  Barcode
} from 'lucide-react';
import { Product, InventoryStats, ActiveTab } from '../types';

interface HomeScreenProps {
  products: Product[];
  stats: InventoryStats;
  categories: string[];
  setActiveTab: (tab: ActiveTab) => void;
  onSelectProduct: (product: Product) => void;
  onQuickSearchSelect: (product: Product) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  products,
  stats,
  categories,
  setActiveTab,
  onSelectProduct,
  onQuickSearchSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = searchQuery.trim()
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery)
      )
    : [];

  const recentProducts = [...products]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 6);

  const lowStockProducts = products.filter(p => p.stock <= 5);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Hero Welcome & Quick Action Bar */}
      <section className="bg-gradient-to-l from-emerald-700 via-emerald-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            نظام مسح المنتجات الذكي
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mb-2 tracking-tight">
            مرحباً بك في ماسح المنتجات
          </h1>
          <p className="text-emerald-100/80 text-sm sm:text-base leading-relaxed mb-6">
            مسح مباشر عبر كاميرا الجوال، التعرف البصري بالبصمة الرقمية للصور، قراءة الباركود، وحساب فوري للأرباح والمخزون.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="hero-start-scan"
              onClick={() => setActiveTab('camera')}
              className="px-5 py-3 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-sm shadow-md transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Scan className="w-4 h-4 text-emerald-600" />
              ابدأ المسح بالكاميرا
            </button>

            <button
              id="hero-add-product"
              onClick={() => setActiveTab('add_product')}
              className="px-5 py-3 rounded-xl bg-emerald-600/60 hover:bg-emerald-600 text-white font-semibold text-sm border border-emerald-400/30 transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              إضافة منتج جديد
            </button>
          </div>
        </div>
      </section>

      {/* Quick Search */}
      <div className="relative">
        <div className="relative flex items-center">
          <input
            id="home-quick-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم، الفئة، أو رقم الباركود..."
            className="w-full pl-4 pr-11 py-3.5 bg-white rounded-2xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 shadow-xs text-sm"
          />
          <Search className="w-5 h-5 text-slate-400 absolute right-4 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-4 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded-md"
            >
              مسح
            </button>
          )}
        </div>

        {/* Live Search Results Dropdown */}
        {searchQuery.trim() && (
          <div className="mt-2 bg-white rounded-2xl border border-slate-200 shadow-lg p-3 space-y-2 z-30">
            <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-500">
              <span>نتائج البحث ({searchResults.length})</span>
            </div>
            {searchResults.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                لا يوجد منتج مطابق لـ &quot;{searchQuery}&quot;
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {searchResults.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onQuickSearchSelect(p);
                      setSearchQuery('');
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 cursor-pointer transition-colors"
                  >
                    <img
                      src={p.imagePath}
                      alt={p.name}
                      className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 truncate">{p.name}</h4>
                      <p className="text-[11px] text-slate-500 truncate">{p.category} | باركود: {p.barcode}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-black text-emerald-600">{p.sellingPrice.toFixed(2)} ر.س</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">المخزون: {p.stock}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">إجمالي المنتجات</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.totalProducts}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{stats.totalStockUnits} قطعة في المستودع</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">قيمة المخزون</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.totalInventoryValue.toLocaleString('ar-SA')} <span className="text-xs font-medium">ر.س</span></div>
            <div className="text-[11px] text-blue-600 mt-0.5">سعر التكلفة الإجمالي</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">الأرباح المتوقعة</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600">+{stats.potentialProfit.toLocaleString('ar-SA')} <span className="text-xs font-medium">ر.س</span></div>
            <div className="text-[11px] text-emerald-700 mt-0.5">هامش ربح إجمالي متاح</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">تنبيهات المخزون</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-600">{stats.lowStockCount + stats.outOfStockCount}</div>
            <div className="text-[11px] text-amber-700 mt-0.5">{stats.outOfStockCount} نافذ / {stats.lowStockCount} منخفض</div>
          </div>
        </div>
      </section>

      {/* Low Stock Warning Banner if any */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">يوجد منتجات شارفت على النفاد</h3>
              <p className="text-xs text-amber-700">تحقق من المنتجات التي تقل كميتها عن 5 قطع لطلب شحنة جديدة</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('products')}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 shrink-0 transition-colors"
          >
            عرض المنتجات
          </button>
        </div>
      )}

      {/* Recent Products Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-600"></div>
            <h2 className="text-lg font-black text-slate-900">أحدث المنتجات</h2>
          </div>
          <button
            onClick={() => setActiveTab('products')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            عرض الكل ({products.length})
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {recentProducts.map((p) => {
            const profit = p.sellingPrice - p.purchasePrice;
            const margin = p.purchasePrice > 0 ? (profit / p.purchasePrice) * 100 : 0;
            return (
              <div
                key={p.id}
                onClick={() => onSelectProduct(p)}
                className="bg-white rounded-2xl border border-slate-200 p-2.5 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 mb-2">
                  <img
                    src={p.imagePath}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                    المخزون: {p.stock}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-medium truncate block">{p.category}</span>
                  <h3 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                    {p.name}
                  </h3>
                  
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black text-slate-900">{p.sellingPrice.toFixed(2)} ر.س</div>
                      <div className="text-[9px] text-emerald-600 font-semibold">ربح: {profit.toFixed(1)} (+{margin.toFixed(0)}%)</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Categories Overview */}
      {categories.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">الفئات المتاحة</h2>
            <span className="text-xs text-slate-500">{categories.length} فئات نشطة</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const count = products.filter(p => p.category === c).length;
              return (
                <button
                  key={c}
                  onClick={() => setActiveTab('products')}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-600 text-xs font-bold transition-all shadow-2xs flex items-center gap-2"
                >
                  <FolderTree className="w-3.5 h-3.5 text-slate-400" />
                  {c}
                  <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
