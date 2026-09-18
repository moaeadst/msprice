import React from 'react';
import { 
  Home, 
  Camera, 
  PlusCircle, 
  Package, 
  Scan, 
  Boxes
} from 'lucide-react';
import { ActiveTab } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  totalProducts: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, totalProducts }) => {
  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div 
            id="brand-logo"
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">ماسح المنتجات</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">Pro</span>
              </div>
              <p className="text-xs text-slate-500">التعرف البصري والباركود والمخزون</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              id="nav-tab-home"
              onClick={() => setActiveTab('home')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'home'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Home className="w-4 h-4" />
              الرئيسية
            </button>

            <button
              id="nav-tab-camera"
              onClick={() => setActiveTab('camera')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'camera'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Camera className="w-4 h-4" />
              الكاميرا والمسح
            </button>

            <button
              id="nav-tab-products"
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'products'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Package className="w-4 h-4" />
              قائمة المنتجات
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                {totalProducts}
              </span>
            </button>

            <button
              id="nav-tab-add"
              onClick={() => setActiveTab('add_product')}
              className={`mr-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center gap-2 ${
                activeTab === 'add_product'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              إضافة منتج
            </button>
          </nav>

          {/* Mobile Right Action */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              id="mobile-quick-scan"
              onClick={() => setActiveTab('camera')}
              className="p-2 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
              title="مسح سريع"
            >
              <Scan className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-3 shadow-lg">
        <div className="grid grid-cols-4 items-center">
          <button
            id="mobile-nav-home"
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center py-1 rounded-lg transition-colors ${
              activeTab === 'home' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[11px] mt-1">الرئيسية</span>
          </button>

          <button
            id="mobile-nav-camera"
            onClick={() => setActiveTab('camera')}
            className={`flex flex-col items-center justify-center py-1 rounded-lg transition-colors relative ${
              activeTab === 'camera' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <div className="relative">
              <Camera className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </div>
            <span className="text-[11px] mt-1">المسح</span>
          </button>

          <button
            id="mobile-nav-add"
            onClick={() => setActiveTab('add_product')}
            className={`flex flex-col items-center justify-center py-1 rounded-lg transition-colors ${
              activeTab === 'add_product' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            <span className="text-[11px] mt-1">إضافة</span>
          </button>

          <button
            id="mobile-nav-products"
            onClick={() => setActiveTab('products')}
            className={`flex flex-col items-center justify-center py-1 rounded-lg transition-colors relative ${
              activeTab === 'products' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-5 h-5" />
            <span className="text-[11px] mt-1">المنتجات</span>
            {totalProducts > 0 && (
              <span className="absolute top-0 right-2 px-1.5 py-0.2 bg-slate-200 text-slate-800 text-[10px] rounded-full font-bold">
                {totalProducts}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
};
