import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Link as LinkIcon, 
  Barcode, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Sparkles, 
  DollarSign, 
  Boxes, 
  Check, 
  AlertCircle,
  Hash,
  Eye,
  RefreshCw
} from 'lucide-react';
import { Product } from '../types';
import { ImageHasher } from '../utils/imageHasher';
import { ProductStorage } from '../utils/storage';

interface AddProductScreenProps {
  editProduct?: Product | null;
  initialImageData?: {
    imagePath: string;
    imageHash: string;
    barcode?: string;
  } | null;
  categories: string[];
  onSaveSuccess: (product: Product) => void;
  onCancel: () => void;
}

export const AddProductScreen: React.FC<AddProductScreenProps> = ({
  editProduct,
  initialImageData,
  categories,
  onSaveSuccess,
  onCancel,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [name, setName] = useState(editProduct?.name || '');
  const [sellingPrice, setSellingPrice] = useState<string>(editProduct ? String(editProduct.sellingPrice) : '');
  const [purchasePrice, setPurchasePrice] = useState<string>(editProduct ? String(editProduct.purchasePrice) : '');
  const [category, setCategory] = useState(editProduct?.category || (categories[0] || 'أغذية وتموينات'));
  const [newCategoryMode, setNewCategoryMode] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [barcode, setBarcode] = useState(editProduct?.barcode || initialImageData?.barcode || '');
  const [stock, setStock] = useState<string>(editProduct ? String(editProduct.stock) : '10');
  const [supplier, setSupplier] = useState(editProduct?.supplier || '');
  const [notes, setNotes] = useState(editProduct?.notes || '');
  
  // Custom fields
  const [customFields, setCustomFields] = useState<Array<{ key: string; value: string }>>(() => {
    if (editProduct?.customFields) {
      return Object.entries(editProduct.customFields).map(([key, value]) => ({ key, value }));
    }
    return [{ key: 'الحجم / السعة', value: '' }];
  });

  // Image states
  const [imagePath, setImagePath] = useState(editProduct?.imagePath || initialImageData?.imagePath || '');
  const [imageHash, setImageHash] = useState(editProduct?.imageHash || initialImageData?.imageHash || '');
  const [isHashing, setIsHashing] = useState(false);

  // Camera modal state for quick snapshot
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Error validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto calculate profit
  const sellNum = parseFloat(sellingPrice) || 0;
  const costNum = parseFloat(purchasePrice) || 0;
  const profit = sellNum - costNum;
  const profitMargin = costNum > 0 ? (profit / costNum) * 100 : 0;

  // Process image for hashing whenever imagePath changes
  const processImageForHash = async (src: string) => {
    if (!src) return;
    setIsHashing(true);
    try {
      const hash = await ImageHasher.generateFromUrl(src);
      setImageHash(hash);
    } catch {
      // fallback
    } finally {
      setIsHashing(false);
    }
  };

  // Open quick snapshot camera
  const handleStartCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('تعذر فتح الكاميرا، يرجى استخدام رفع صورة من الملفات.');
      setIsCameraOpen(false);
    }
  };

  const handleCaptureFromCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setImagePath(dataUrl);
      const hash = ImageHasher.generateFromCanvas(canvas);
      setImageHash(hash);
    }
    handleCloseCamera();
  };

  const handleCloseCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  // Handle image upload from file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setImagePath(dataUrl);
      processImageForHash(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Generate random Barcode
  const handleGenerateBarcode = () => {
    const prefix = '628'; // Saudi / Arab GS1 prefix
    let rest = '';
    for (let i = 0; i < 10; i++) {
      rest += Math.floor(Math.random() * 10);
    }
    setBarcode(prefix + rest);
  };

  // Custom field management
  const handleAddCustomField = () => {
    setCustomFields(prev => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveCustomField = (index: number) => {
    setCustomFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleCustomFieldChange = (index: number, field: 'key' | 'value', val: string) => {
    setCustomFields(prev => {
      const updated = [...prev];
      updated[index][field] = val;
      return updated;
    });
  };

  // Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'اسم المنتج مطلوب';
    if (!sellingPrice || isNaN(sellNum) || sellNum < 0) newErrors.sellingPrice = 'يرجى إدخال سعر بيع صحيح';
    if (purchasePrice === '' || isNaN(costNum) || costNum < 0) newErrors.purchasePrice = 'يرجى إدخال سعر شراء صحيح';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Convert custom fields array to Map object
    const customFieldsObj: Record<string, string> = {};
    customFields.forEach(cf => {
      if (cf.key.trim() && cf.value.trim()) {
        customFieldsObj[cf.key.trim()] = cf.value.trim();
      }
    });

    const finalCategory = newCategoryMode && customCategory.trim() 
      ? customCategory.trim() 
      : category;

    const newProduct: Product = {
      id: editProduct ? editProduct.id : `prod-${Date.now()}`,
      name: name.trim(),
      sellingPrice: sellNum,
      purchasePrice: costNum,
      imagePath: imagePath.trim() || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80',
      imageHash: imageHash || '1100110011001100_753642864753',
      category: finalCategory,
      barcode: barcode.trim(),
      notes: notes.trim(),
      supplier: supplier.trim(),
      stock: parseInt(stock, 10) || 0,
      customFields: customFieldsObj,
      createdAt: editProduct ? editProduct.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    const saved = ProductStorage.addOrUpdateProduct(newProduct);
    onSaveSuccess(saved);
  };

  return (
    <div className="max-w-3xl mx-auto pb-24 md:pb-12 space-y-6">
      {/* Screen Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-600" />
            {editProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}
          </h1>
          <p className="text-xs text-slate-500">
            {editProduct 
              ? `تعديل البيانات والأسعار للمنتج: ${editProduct.name}`
              : 'التقط صورة، سجل السعر واحسب الأرباح تلقائياً في المخزون'}
          </p>
        </div>

        <button
          onClick={onCancel}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
          title="إلغاء والعودة"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Capture & Visual Fingerprint Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-800">صورة المنتج وبصمة التعرف البصري</h2>
            {imageHash && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold flex items-center gap-1">
                <Hash className="w-3 h-3 text-emerald-600" />
                تم توليد البصمة الرقمية
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            {/* Image Preview Box */}
            <div className="relative aspect-square rounded-2xl bg-slate-100 border border-dashed border-slate-300 overflow-hidden flex flex-col items-center justify-center group">
              {imagePath ? (
                <>
                  <img src={imagePath} alt="معاينة المنتج" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleStartCamera}
                      className="p-2 bg-white text-slate-800 rounded-lg hover:bg-slate-100 text-xs font-bold"
                      title="إعادة التقاط"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 bg-white text-slate-800 rounded-lg hover:bg-slate-100 text-xs font-bold"
                      title="رفع من الجهاز"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center mx-auto mb-2">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-slate-500 font-medium">لم يتم اختيار صورة</span>
                </div>
              )}
            </div>

            {/* Photo Action Buttons */}
            <div className="sm:col-span-2 space-y-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  id="btn-photo-camera"
                  onClick={handleStartCamera}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  التقط صورة بالكاميرا
                </button>

                <button
                  type="button"
                  id="btn-photo-upload"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  رفع من الهاتف / الجهاز
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Or Web Image URL */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 mb-1 block">أو رابط صورة عبر الويب (URL)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={imagePath.startsWith('data:') ? '' : imagePath}
                    onChange={(e) => {
                      setImagePath(e.target.value);
                      processImageForHash(e.target.value);
                    }}
                    placeholder="https://example.com/product.jpg"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                  {imagePath && !imagePath.startsWith('data:') && (
                    <button
                      type="button"
                      onClick={() => processImageForHash(imagePath)}
                      className="p-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200"
                      title="إعادة فحص بصمة الرابط"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Visual Hash fingerprint display */}
              {imageHash && (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-500 flex items-center justify-between">
                  <span className="truncate max-w-xs">بصمة المشهد: {imageHash.slice(0, 32)}...</span>
                  <span className="text-[10px] text-emerald-600 font-sans font-bold">جاهز للمطابقة البصرية</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Basic Information Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-black text-slate-800">المعلومات الأساسية للمنتج</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                اسم المنتج <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="product-name-input"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                }}
                placeholder="مثال: زيت زيتون بكر ممتاز 500 مل"
                className={`w-full px-4 py-3 bg-slate-50 rounded-xl border text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                  errors.name ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'
                }`}
              />
              {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
            </div>

            {/* Category Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">الفئة / التصنيف</label>
                <button
                  type="button"
                  onClick={() => setNewCategoryMode(!newCategoryMode)}
                  className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold"
                >
                  {newCategoryMode ? 'اختيار من الفئات الحالية' : '+ إضافة فئة جديدة'}
                </button>
              </div>

              {newCategoryMode ? (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="اكتب اسم الفئة الجديدة..."
                  className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="عام وغير مصنف">عام وغير مصنف</option>
                </select>
              )}
            </div>

            {/* Barcode */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">رقم الباركود</label>
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                >
                  <Barcode className="w-3 h-3" />
                  توليد باركود تلقائي
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="مثال: 6281001234567"
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                />
                <Barcode className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing & Profit Calculation Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              الأسعار وحساب الأرباح التلقائي
            </h2>
            <span className="text-xs text-slate-500">العملة: ريال سعودي (ر.س)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Purchase Price (Cost) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                سعر الشراء (التكلفة) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={purchasePrice}
                  onChange={(e) => {
                    setPurchasePrice(e.target.value);
                    if (errors.purchasePrice) setErrors(prev => ({ ...prev, purchasePrice: '' }));
                  }}
                  placeholder="0.00"
                  className={`w-full pl-12 pr-4 py-2.5 bg-slate-50 rounded-xl border text-sm font-bold text-slate-900 focus:outline-none ${
                    errors.purchasePrice ? 'border-rose-400' : 'border-slate-200 focus:border-emerald-500'
                  }`}
                />
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">ر.س</span>
              </div>
              {errors.purchasePrice && <p className="text-xs text-rose-500 mt-1">{errors.purchasePrice}</p>}
            </div>

            {/* Selling Price */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                سعر البيع للعميل <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={sellingPrice}
                  onChange={(e) => {
                    setSellingPrice(e.target.value);
                    if (errors.sellingPrice) setErrors(prev => ({ ...prev, sellingPrice: '' }));
                  }}
                  placeholder="0.00"
                  className={`w-full pl-12 pr-4 py-2.5 bg-slate-50 rounded-xl border text-sm font-bold text-slate-900 focus:outline-none ${
                    errors.sellingPrice ? 'border-rose-400' : 'border-slate-200 focus:border-emerald-500'
                  }`}
                />
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">ر.س</span>
              </div>
              {errors.sellingPrice && <p className="text-xs text-rose-500 mt-1">{errors.sellingPrice}</p>}
            </div>

            {/* Stock Quantity */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                الكمية المتوفرة (المخزون)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="0"
                  className="w-full pl-12 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">قطعة</span>
              </div>
            </div>
          </div>

          {/* Live Profit & Margin Indicator Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <div className="text-[11px] text-slate-500 font-bold">صافي ربح القطعة</div>
              <div className={`text-xl font-black ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {profit >= 0 ? `+${profit.toFixed(2)}` : profit.toFixed(2)} <span className="text-xs">ر.س</span>
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-500 font-bold">نسبة هامش الربح</div>
              <div className={`text-xl font-black ${profitMargin >= 30 ? 'text-emerald-600' : profitMargin >= 10 ? 'text-amber-600' : 'text-rose-600'}`}>
                {profitMargin.toFixed(1)}%
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <div className="text-[11px] text-slate-500 font-bold">إجمالي ربح الكمية بالمخزون</div>
              <div className="text-xl font-black text-slate-900">
                {(profit * (parseInt(stock, 10) || 0)).toFixed(2)} <span className="text-xs">ر.س</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Details (Supplier & Custom Fields) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-800">بيانات المورد والحقول المخصصة</h2>
            <button
              type="button"
              onClick={handleAddCustomField}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              إضافة حقل مخصص
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم المورد أو الشركة</label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="مثال: شركة التوزيع المتحدة"
                className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">ملاحظات داخلية</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مكان التخزين، توصيات الاستخدام، إلخ"
                className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Dynamic Key/Value custom fields */}
          {customFields.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-600 block mb-2">الحقول الإضافية (مثل: الوزن، اللون، المقاس، الصلاحية):</span>
              {customFields.map((cf, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={cf.key}
                    onChange={(e) => handleCustomFieldChange(idx, 'key', e.target.value)}
                    placeholder="اسم الحقل (مثال: اللون)"
                    className="w-1/3 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    value={cf.value}
                    onChange={(e) => handleCustomFieldChange(idx, 'value', e.target.value)}
                    placeholder="القيمة (مثال: أسود مطفي)"
                    className="flex-1 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomField(idx)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit & Cancel Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            id="save-product-submit-btn"
            className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
          >
            <Save className="w-4 h-4" />
            {editProduct ? 'حفظ التعديلات' : 'حفظ المنتج في الكتالوج'}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition-colors"
          >
            إلغاء
          </button>
        </div>
      </form>

      {/* Snapshot Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl p-5 max-w-lg w-full space-y-4 shadow-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                التقاط صورة المنتج
              </h3>
              <button onClick={handleCloseCamera} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 pointer-events-none border-2 border-emerald-500/40 m-6 rounded-xl flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border border-emerald-400/50"></div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCaptureFromCamera}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                التقاط واعتماد هذه الصورة
              </button>
              <button
                type="button"
                onClick={handleCloseCamera}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-xl"
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
