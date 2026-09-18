import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  SwitchCamera, 
  Zap, 
  Upload, 
  Scan, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Minus, 
  ArrowRight, 
  ExternalLink,
  RefreshCw,
  Sparkles,
  Barcode,
  Eye,
  AlertCircle
} from 'lucide-react';
import { Product, ProductMatchResult } from '../types';
import { ImageHasher } from '../utils/imageHasher';
import { ProductStorage } from '../utils/storage';
import { sound } from '../utils/audio';

interface CameraScreenProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddNewWithImage: (imageDataUrl: string, imageHash: string, barcode?: string) => void;
  onStockUpdated: () => void;
}

export const CameraScreen: React.FC<CameraScreenProps> = ({
  products,
  onSelectProduct,
  onAddNewWithImage,
  onStockUpdated,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCapturedImage, setLastCapturedImage] = useState<string | null>(null);
  const [lastHash, setLastHash] = useState<string | null>(null);
  const [lastBarcode, setLastBarcode] = useState<string | null>(null);

  // Match result state
  const [matchResult, setMatchResult] = useState<ProductMatchResult | null>(null);
  const [noMatchFound, setNoMatchFound] = useState(false);
  const [recentCandidates, setRecentCandidates] = useState<ProductMatchResult[]>([]);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn('Camera access issue:', err);
      setCameraError('تعذر تشغيل الكاميرا. يرجى التأكد من إعطاء الصلاحية أو استخدام رفع صورة بدلاً من ذلك.');
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [facingMode]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [stream]);

  // Barcode detector continuous polling if supported
  useEffect(() => {
    if (!isScanning || matchResult || noMatchFound || !videoRef.current) return;

    let timer: number;
    let barcodeDetector: any = null;

    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        // @ts-ignore
        barcodeDetector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
        });
      } catch (e) {
        // ignore
      }
    }

    const checkBarcode = async () => {
      if (barcodeDetector && videoRef.current && videoRef.current.readyState >= 2) {
        try {
          const barcodes = await barcodeDetector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            if (rawValue) {
              handleFoundBarcode(rawValue);
              return;
            }
          }
        } catch {
          // ignore
        }
      }
      timer = window.setTimeout(checkBarcode, 600);
    };

    if (barcodeDetector) {
      timer = window.setTimeout(checkBarcode, 1000);
    }

    return () => clearTimeout(timer);
  }, [isScanning, matchResult, noMatchFound]);

  // Handle direct barcode match
  const handleFoundBarcode = (barcode: string) => {
    sound.playScanBeep();
    setLastBarcode(barcode);
    const matches = ProductStorage.matchProduct(undefined, barcode);
    if (matches.length > 0) {
      sound.playSuccessChime();
      setMatchResult(matches[0]);
      setRecentCandidates(matches.slice(1, 4));
      setIsScanning(false);
    } else {
      // Capture frame to let user add product with this barcode
      captureCurrentFrame(barcode);
    }
  };

  // Capture frame from video stream
  const captureCurrentFrame = (detectedBarcode?: string) => {
    const video = videoRef.current;
    if (!video) return;

    setIsProcessing(true);
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsProcessing(false);
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setLastCapturedImage(dataUrl);

    // Compute perceptual hash
    const hash = ImageHasher.generateFromCanvas(canvas);
    setLastHash(hash);

    // Evaluate matching
    const matches = ProductStorage.matchProduct(hash, detectedBarcode || lastBarcode || undefined);
    
    if (matches.length > 0 && (matches[0].similarity >= 65 || matches[0].matchType === 'barcode')) {
      sound.playSuccessChime();
      setMatchResult(matches[0]);
      setRecentCandidates(matches.slice(1, 4));
      setNoMatchFound(false);
    } else {
      sound.playScanBeep();
      setNoMatchFound(true);
      setMatchResult(null);
      setRecentCandidates(matches.slice(0, 3));
    }

    setIsProcessing(false);
    setIsScanning(false);
  };

  // Handle File Upload Scanner
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setLastCapturedImage(dataUrl);

      const hash = await ImageHasher.generateFromUrl(dataUrl);
      setLastHash(hash);

      const matches = ProductStorage.matchProduct(hash, undefined);
      if (matches.length > 0 && matches[0].similarity >= 65) {
        sound.playSuccessChime();
        setMatchResult(matches[0]);
        setRecentCandidates(matches.slice(1, 4));
        setNoMatchFound(false);
      } else {
        sound.playScanBeep();
        setNoMatchFound(true);
        setMatchResult(null);
        setRecentCandidates(matches.slice(0, 3));
      }
      setIsProcessing(false);
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };

  // Quick Demo Scanner button (for testing matching with an existing product)
  const testSampleMatch = (product: Product) => {
    setLastCapturedImage(product.imagePath);
    setLastHash(product.imageHash);
    setLastBarcode(product.barcode);

    sound.playSuccessChime();
    setMatchResult({
      product,
      similarity: 96,
      matchType: 'both',
      barcodeMatched: true,
    });
    setNoMatchFound(false);
    setIsScanning(false);
  };

  // Stock quick updater on match card
  const handleStockChange = (delta: number) => {
    if (!matchResult) return;
    const updated = ProductStorage.updateStock(matchResult.product.id, delta);
    if (updated) {
      setMatchResult({
        ...matchResult,
        product: updated,
      });
      onStockUpdated();
    }
  };

  // Reset scanner
  const handleResetScanner = () => {
    setMatchResult(null);
    setNoMatchFound(false);
    setLastCapturedImage(null);
    setLastHash(null);
    setLastBarcode(null);
    setIsScanning(true);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-4xl mx-auto">
      {/* Viewfinder Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Scan className="w-5 h-5 text-emerald-600" />
            المسح الضوئي الذكي
          </h1>
          <p className="text-xs text-slate-500">وجه الكاميرا نحو المنتج أو الباركود للتعرف المباشر</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch Camera */}
          <button
            id="switch-camera-btn"
            onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            title="تبديل الكاميرا الأمامية/الخلفية"
          >
            <SwitchCamera className="w-4 h-4" />
          </button>

          {/* Upload Image alternative */}
          <button
            id="upload-image-scan-btn"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            رفع صورة
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>

      {/* Camera Live Viewfinder Card */}
      <div className="relative aspect-4/3 sm:aspect-16/10 rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center">
        {/* Real-time Video */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Camera Error Message */}
        {cameraError && (
          <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center text-white z-20">
            <AlertCircle className="w-12 h-12 text-amber-400 mb-3" />
            <h3 className="text-base font-bold mb-1">تنبيه الكاميرا</h3>
            <p className="text-xs text-slate-300 max-w-sm mb-4 leading-relaxed">{cameraError}</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={startCamera}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                إعادة المحاولة
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                فحص عبر رفع صورة
              </button>
            </div>
          </div>
        )}

        {/* Viewfinder Target HUD Overlay */}
        {!matchResult && !noMatchFound && !cameraError && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
            {/* Target Box */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 border-2 border-emerald-500/40 rounded-2xl">
              {/* Corner Brackets */}
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg"></div>
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg"></div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg"></div>
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg"></div>

              {/* Animated Laser Scanline */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute top-0 animate-[scanline_2s_ease-in-out_infinite] shadow-[0_0_12px_#10b981]"></div>

              {/* Center Crosshair */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border border-emerald-400/30 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                </div>
              </div>
            </div>

            {/* Instruction pill */}
            <div className="mt-4 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              ضع المنتج أو الباركود داخل الإطار
            </div>
          </div>
        )}

        {/* Bottom Floating Scan Trigger Controls */}
        {!matchResult && !noMatchFound && !cameraError && (
          <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4 z-10">
            <button
              id="capture-and-scan-btn"
              onClick={() => captureCurrentFrame()}
              disabled={isProcessing}
              className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-900/40 flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Scan className="w-5 h-5" />
              {isProcessing ? 'جاري الفحص والتحليل...' : 'التقاط وفحص المنتج'}
            </button>
          </div>
        )}
      </div>

      {/* Match Result Modal / Card */}
      {matchResult && (
        <div className="bg-white rounded-3xl border-2 border-emerald-500 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-base">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <span>تم العثور على المنتج بنجاح!</span>
            </div>
            <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center gap-1.5">
              <span>{matchResult.similarity}% تطابق</span>
              <span className="text-[10px] text-emerald-600">
                ({matchResult.matchType === 'both' ? 'بصري + باركود' : matchResult.matchType === 'barcode' ? 'باركود' : 'بصري'})
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Product Image */}
            <div className="relative aspect-square sm:aspect-auto rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              <img
                src={matchResult.product.imagePath}
                alt={matchResult.product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Product Details & Economics */}
            <div className="sm:col-span-2 space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-400">{matchResult.product.category}</span>
                <h3 className="text-lg font-black text-slate-900">{matchResult.product.name}</h3>
                {matchResult.product.barcode && (
                  <div className="text-xs font-mono text-slate-500 mt-1 flex items-center gap-1.5">
                    <Barcode className="w-4 h-4 text-slate-400" />
                    <span>الباركود: {matchResult.product.barcode}</span>
                  </div>
                )}
              </div>

              {/* Price & Profit Breakdown */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold">سعر البيع</div>
                  <div className="text-base font-black text-slate-900">{matchResult.product.sellingPrice.toFixed(2)} ر.س</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold">سعر الشراء</div>
                  <div className="text-base font-bold text-slate-600">{matchResult.product.purchasePrice.toFixed(2)} ر.س</div>
                </div>
                <div>
                  <div className="text-[10px] text-emerald-700 font-bold">صافي الربح</div>
                  <div className="text-base font-black text-emerald-600">
                    +{(matchResult.product.sellingPrice - matchResult.product.purchasePrice).toFixed(1)} ر.س
                  </div>
                </div>
              </div>

              {/* Stock Management inside Scan Card */}
              <div className="flex items-center justify-between bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100">
                <div>
                  <div className="text-xs font-black text-emerald-950">المخزون الحالي</div>
                  <div className="text-xl font-black text-emerald-800">{matchResult.product.stock} <span className="text-xs font-medium">قطعة</span></div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="scan-stock-minus"
                    onClick={() => handleStockChange(-1)}
                    disabled={matchResult.product.stock <= 0}
                    className="w-9 h-9 rounded-xl bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100 flex items-center justify-center font-bold shadow-2xs disabled:opacity-40 transition-colors"
                    title="خصم قطعة (تسجيل بيع)"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <button
                    id="scan-stock-plus"
                    onClick={() => handleStockChange(1)}
                    className="w-9 h-9 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center font-bold shadow-sm transition-colors"
                    title="إضافة قطعة للمخزون"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  id="view-matched-product-btn"
                  onClick={() => onSelectProduct(matchResult.product)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  عرض التفاصيل الكاملة
                </button>

                <button
                  id="scan-another-product-btn"
                  onClick={handleResetScanner}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  مسح منتج آخر
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Match Found View */}
      {noMatchFound && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-lg text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <XCircle className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">لم يتم التعرف على المنتج</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              لم نعثر على تطابق كافٍ في قاعدة البيانات الحالية. يمكنك إضافة هذا المنتج الجديد وحفظ صورته وبصمته مباشرة.
            </p>
          </div>

          {lastCapturedImage && (
            <div className="inline-block p-1 bg-slate-100 rounded-xl border border-slate-200 max-w-xs">
              <img src={lastCapturedImage} alt="الصورة الملتقطة" className="w-32 h-32 object-cover rounded-lg mx-auto" />
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              id="add-scanned-product-btn"
              onClick={() => {
                if (lastCapturedImage && lastHash) {
                  onAddNewWithImage(lastCapturedImage, lastHash, lastBarcode || undefined);
                }
              }}
              className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة هذا المنتج للكتالوج
            </button>

            <button
              onClick={handleResetScanner}
              className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة المسح
            </button>
          </div>
        </div>
      )}

      {/* Demo Tester Quick-Cards (Helpful for instant testing without camera) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-800">تجربة سريعة (محاكاة مسح عينة من المخزون)</h3>
          </div>
          <span className="text-[11px] text-slate-500">انقر على أي منتج لتجربة آلية التعرف والنتائج</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {products.slice(0, 6).map(p => (
            <button
              key={p.id}
              onClick={() => testSampleMatch(p)}
              className="p-2 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-right transition-all flex items-center gap-2 group"
            >
              <img src={p.imagePath} alt={p.name} className="w-8 h-8 rounded-lg object-cover bg-slate-100 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold text-slate-800 truncate group-hover:text-emerald-700">{p.name}</div>
                <div className="text-[10px] text-emerald-600 font-semibold">{p.sellingPrice.toFixed(0)} ر.س</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
