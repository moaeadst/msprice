/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ActiveTab, Product, InventoryStats } from './types';
import { ProductStorage } from './utils/storage';
import { Navbar } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { CameraScreen } from './components/CameraScreen';
import { ProductsListScreen } from './components/ProductsListScreen';
import { AddProductScreen } from './components/AddProductScreen';
import { ProductDetailScreen } from './components/ProductDetailScreen';
import { CheckCircle, Info } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    totalProducts: 0,
    totalStockUnits: 0,
    totalInventoryValue: 0,
    totalRetailValue: 0,
    potentialProfit: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    categoriesCount: 0,
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Scanned image passed when creating a new product from camera
  const [scannedImageData, setScannedImageData] = useState<{
    imagePath: string;
    imageHash: string;
    barcode?: string;
  } | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Reload products and stats
  const refreshData = () => {
    const prods = ProductStorage.getProducts();
    const st = ProductStorage.getStats();
    const cats = ProductStorage.getCategories();
    setProducts(prods);
    setStats(st);
    setCategories(cats);

    // Keep selected product in sync if it's currently open
    if (selectedProduct) {
      const updated = prods.find(p => p.id === selectedProduct.id);
      if (updated) setSelectedProduct(updated);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Handlers for switching screens
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setActiveTab('detail');
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setActiveTab('edit');
  };

  const handleAddNewProduct = () => {
    setEditingProduct(null);
    setScannedImageData(null);
    setActiveTab('add_product');
  };

  const handleAddNewFromScan = (imagePath: string, imageHash: string, barcode?: string) => {
    setEditingProduct(null);
    setScannedImageData({ imagePath, imageHash, barcode });
    setActiveTab('add_product');
  };

  const handleSaveSuccess = (savedProduct: Product) => {
    refreshData();
    setSelectedProduct(savedProduct);
    setActiveTab('detail');
    showToast(editingProduct ? 'تم تحديث بيانات المنتج بنجاح!' : 'تمت إضافة المنتج الجديد إلى الكتالوج!');
    setEditingProduct(null);
    setScannedImageData(null);
  };

  const handleDeleteProduct = (id: string) => {
    refreshData();
    setActiveTab('products');
    setSelectedProduct(null);
    showToast('تم حذف المنتج من قاعدة البيانات.');
  };

  const handleScanThisProduct = (product: Product) => {
    setActiveTab('camera');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Navbar Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'add_product') {
            handleAddNewProduct();
          } else {
            setActiveTab(tab);
          }
        }}
        totalProducts={products.length}
      />

      {/* Main Screen Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6">
        {activeTab === 'home' && (
          <HomeScreen
            products={products}
            stats={stats}
            categories={categories}
            setActiveTab={setActiveTab}
            onSelectProduct={handleSelectProduct}
            onQuickSearchSelect={handleSelectProduct}
          />
        )}

        {activeTab === 'camera' && (
          <CameraScreen
            products={products}
            onSelectProduct={handleSelectProduct}
            onAddNewWithImage={handleAddNewFromScan}
            onStockUpdated={refreshData}
          />
        )}

        {activeTab === 'products' && (
          <ProductsListScreen
            products={products}
            categories={categories}
            onSelectProduct={handleSelectProduct}
            onEditProduct={handleEditProduct}
            onAddNewProduct={handleAddNewProduct}
            onProductsUpdated={refreshData}
          />
        )}

        {(activeTab === 'add_product' || activeTab === 'edit') && (
          <AddProductScreen
            editProduct={activeTab === 'edit' ? editingProduct : null}
            initialImageData={scannedImageData}
            categories={categories}
            onSaveSuccess={handleSaveSuccess}
            onCancel={() => {
              if (activeTab === 'edit' && selectedProduct) {
                setActiveTab('detail');
              } else {
                setActiveTab('products');
              }
            }}
          />
        )}

        {activeTab === 'detail' && selectedProduct && (
          <ProductDetailScreen
            product={selectedProduct}
            onBack={() => setActiveTab('products')}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onScanThisProduct={handleScanThisProduct}
            onStockUpdated={refreshData}
          />
        )}
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
