import React, { useState } from 'react';
import { 
  ArrowRight, 
  Edit, 
  Trash2, 
  Barcode, 
  DollarSign, 
  TrendingUp, 
  Boxes, 
  Truck, 
  Calendar, 
  Check, 
  Copy, 
  Scan, 
  Plus, 
  Minus,
  Hash,
  AlertCircle
} from 'lucide-react';
import { Product } from '../types';
import { ProductStorage } from '../utils/storage';

interface ProductDetailScreenProps {
  product: Product;
  onBack: () => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onScanThisProduct: (product: Product) => void;
  onStockUpdated: () => void;
}

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  product,
  onBack,
  onEdit,
  onDelete,
  onScanThisProduct,
  onStockUpdated,
}) => {
  const [currentProduct, setCurrentProduct] = useState<Product>(product);
  const [customStockInput, setCustomStockInput] = useState<string>(String(product.stock));
  const [isEditingStock, setIsEditingStock] = useState(false);
  const [copiedBarcode, setCopiedBarcode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const profit = currentProduct.sellingPrice - currentProduct.purchasePrice;
  const profitMargin = currentProduct.purchasePrice > 0 
    ? (profit / currentProduct.purchasePrice) * 100 
    : 0;

  const totalRetailVal = currentProduct.sellingPrice * currentProduct.stock;
  const totalCostVal = currentProduct.purchasePrice * currentProduct.stock;
  const totalPotentialProfit = totalRetailVal - totalCostVal;

  const handleStockDelta = (delta: number) => {
    const updated = ProductStorage.updateStock(currentProduct.id, delta);
    if (updated) {
      setCurrentProduct(updated);
      setCustomStockInput(String(updated.stock));
      onStockUpdated();
    }
  };

  const handleSaveCustomStock = () => {
    const val = parseInt(customStockInput, 10);
    if (!isNaN(val) && val >= 0) {
      const updated = ProductStorage.setStock(currentProduct.id, val);
      if (updated) {
        setCurrentProduct(updated);
        setIsEditingStock(false);
        onStockUpdated();
      }
    }
  };

  const handleCopyBarcode = () => {
    if (!currentProduct.barcode) return;
    navigator.clipboard.writeText(currentProduct.barcode);
    setCopiedBarcode(true);
    setTimeout(() => setCopiedBarcode(false), 2000);
  };

  const isLow = currentProduct.stock > 0 && currentProduct.stock <= 5;
  const isOut = currentProduct.stock === 0;

  return (
    <div className="max-w-4xl mx-auto pb-24 md:pb-12 space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs font-bold text-xs transition-colors flex items-center gap-1.5"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للمنتجات
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(currentProduct)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <Edit className="w-4 h-4 text-slate-600" />
            تعديل
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            حذف
          </button>
        </div>
      </div>

      {/* Main Product Card */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Product Media Column */}
          <div className="md:col-span-5 relative bg-slate-100 aspect-square md:aspect-auto">
            <img
              src={currentProduct.imagePath}
              alt={currentProduct.name}
              className="w-full h-full object-cover"
            />
            {/* Stock status pill */}
            <div className="absolute top-4 right-4">
              {isOut ? (
                <span className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-black shadow-md">
                  نفذ من المخزون
                </span>
              ) : isLow ? (
                <span className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-black shadow-md">
                  منخفض ({currentProduct.stock} فقط)
                </span>
              ) : (
                <span className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-md">
                  متوفر بالمخزن ({currentProduct.stock})
                </span>
              )}
            </div>

            {/* Quick scan trigger */}
            <div className="absolute bottom-4 right-4 left-4">
              <button
                onClick={() => onScanThisProduct(currentProduct)}
                className="w-full py-2.5 px-3 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Scan className="w-4 h-4 text-emerald-400" />
                فحص ومطابقة هذا المنتج بالكاميرا
              </button>
            </div>
          </div>

          {/* Product Overview & Specs Column */}
          <div className="md:col-span-7 p-6 sm:p-8 space-y-6">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {currentProduct.category}
              </span>
              <h1 className="text-2xl font-black text-slate-900 mt-1">
                {currentProduct.name}
              </h1>
              {currentProduct.notes && (
                <p className="text-xs text-slate-500 mt-2 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {currentProduct.notes}
                </p>
              )}
            </div>

            {/* Price & Margin Showcase */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">سعر البيع</span>
                <span className="text-xl font-black text-slate-900">{currentProduct.sellingPrice.toFixed(2)}</span>
                <span className="text-[10px] text-slate-500 mr-1">ر.س</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-bold block">سعر الشراء</span>
                <span className="text-xl font-bold text-slate-600">{currentProduct.purchasePrice.toFixed(2)}</span>
                <span className="text-[10px] text-slate-500 mr-1">ر.س</span>
              </div>

              <div>
                <span className="text-[10px] text-emerald-700 font-bold block">صافي الربح</span>
                <span className="text-xl font-black text-emerald-600">+{profit.toFixed(1)}</span>
                <span className="text-[10px] text-emerald-600 mr-1 font-bold">({profitMargin.toFixed(0)}%)</span>
              </div>
            </div>

            {/* Interactive Stock Management */}
            <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-emerald-950 block">إدارة الكمية والمخزون</span>
                <div className="text-2xl font-black text-emerald-900 mt-0.5">
                  {currentProduct.stock} <span className="text-xs font-normal">قطعة متوفرة</span>
                </div>
              </div>

              {isEditingStock ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={customStockInput}
                    onChange={(e) => setCustomStockInput(e.target.value)}
                    className="w-20 px-2 py-1.5 bg-white border border-emerald-300 rounded-lg text-sm font-bold text-center"
                  />
                  <button
                    onClick={handleSaveCustomStock}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
                  >
                    حفظ
                  </button>
                  <button
                    onClick={() => setIsEditingStock(false)}
                    className="px-2 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStockDelta(-1)}
                    disabled={currentProduct.stock <= 0}
                    className="w-10 h-10 rounded-xl bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100 flex items-center justify-center font-bold text-sm shadow-2xs disabled:opacity-40"
                    title="خصم 1 قطعة (تسجيل بيع)"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleStockDelta(1)}
                    className="w-10 h-10 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center font-bold text-sm shadow-sm"
                    title="زيادة 1 قطعة"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsEditingStock(true)}
                    className="px-3 py-2 rounded-xl bg-white border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100"
                  >
                    تعديل يدوي
                  </button>
                </div>
              )}
            </div>

            {/* Inventory Valuation Breakdown */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 block">إجمالي قيمة التكلفة</span>
                <strong className="text-slate-900 text-sm font-black">{totalCostVal.toFixed(2)} ر.س</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 block">إجمالي الربح المتوقع</span>
                <strong className="text-emerald-600 text-sm font-black">+{totalPotentialProfit.toFixed(2)} ر.س</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barcode & Visual Fingerprint Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Barcode className="w-5 h-5 text-emerald-600" />
          الباركود والبصمة الرقمية للتعرف البصري
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          {/* Barcode Visual Representation */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-2">
            <div className="h-14 flex items-center justify-center gap-1 overflow-hidden px-4">
              {/* Stylized Barcode Bars */}
              {(currentProduct.barcode || '6281001234567').split('').map((char, i) => {
                const width = (parseInt(char, 10) % 3) + 1;
                return (
                  <div
                    key={i}
                    style={{ width: `${width * 2}px` }}
                    className="h-full bg-slate-900 rounded-2xs"
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="font-mono text-sm font-bold tracking-widest text-slate-800">
                {currentProduct.barcode || 'لا يوجد باركود'}
              </span>
              {currentProduct.barcode && (
                <button
                  onClick={handleCopyBarcode}
                  className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
                  title="نسخ الباركود"
                >
                  {copiedBarcode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          {/* Perceptual Visual Hash Info */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <Hash className="w-4 h-4 text-slate-400" />
              <span>بصمة المشهد البصري (Perceptual Image Hash):</span>
            </div>
            <p className="font-mono text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 break-all leading-relaxed">
              {currentProduct.imageHash || 'لم يتم استخراج بصمة بصرية بعد'}
            </p>
            <p className="text-[11px] text-slate-500">
              تُستخدم هذه البصمة لمقارنة صور الكاميرا الحية بدقة واكتشاف المنتج المشابه تلقائياً حتى بدون توفر باركود.
            </p>
          </div>
        </div>
      </div>

      {/* Specifications & Metadata Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-black text-slate-900">المواصفات والبيانات الإضافية</h2>

        <div className="divide-y divide-slate-100 text-xs">
          {currentProduct.supplier && (
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500 font-medium">المورد / المصنع:</span>
              <strong className="text-slate-800 font-bold">{currentProduct.supplier}</strong>
            </div>
          )}

          {currentProduct.customFields && Object.entries(currentProduct.customFields).map(([key, val]) => (
            <div key={key} className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500 font-medium">{key}:</span>
              <strong className="text-slate-800 font-bold">{val}</strong>
            </div>
          ))}

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 font-medium">تاريخ الإضافة:</span>
            <span className="text-slate-700 font-mono">
              {new Date(currentProduct.createdAt).toLocaleDateString('ar-SA', { dateStyle: 'long' })}
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 font-medium">آخر تحديث:</span>
            <span className="text-slate-700 font-mono">
              {new Date(currentProduct.updatedAt).toLocaleDateString('ar-SA', { dateStyle: 'long' })}
            </span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-black text-slate-900">حذف هذا المنتج</h3>
              <p className="text-xs text-slate-500 mt-1">
                هل أنت متأكد من حذف &quot;{currentProduct.name}&quot; نهائياً؟
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  ProductStorage.deleteProduct(currentProduct.id);
                  onDelete(currentProduct.id);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
              >
                نعم، احذف
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
