import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, CartItem, Purchase, Category } from '../types';
import { useAuth } from './AuthContext';

interface AppContextType {
  products: Product[];
  cart: CartItem[];
  purchases: Purchase[];
  searchQuery: string;
  selectedCategory: Category | 'All';
  addProduct: (product: Omit<Product, 'id' | 'sellerId' | 'sellerName' | 'createdAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  purchaseCart: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: Category | 'All') => void;
  getUserProducts: () => Product[];
  getFilteredProducts: () => Product[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');

  useEffect(() => {
    const savedProducts = localStorage.getItem('ecofinds_products');
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    } else {
      // Initialize with sample data
      const sampleProducts: Product[] = [
        {
          id: '1',
          title: 'Vintage MacBook Pro 2019',
          description: 'Excellent condition MacBook Pro, perfect for students or professionals. Includes charger.',
          category: 'Electronics',
          price: 899,
          imageUrl: 'https://images.pexels.com/photos/18105/pexels-photo.jpg',
          sellerId: 'sample_user',
          sellerName: 'John Doe',
          createdAt: new Date().toISOString(),
          isAvailable: true,
        },
        {
          id: '2',
          title: 'Designer Leather Jacket',
          description: 'Genuine leather jacket in great condition. Size M. Perfect for fall season.',
          category: 'Clothing',
          price: 125,
          imageUrl: 'https://images.pexels.com/photos/1124465/pexels-photo-1124465.jpeg',
          sellerId: 'sample_user2',
          sellerName: 'Jane Smith',
          createdAt: new Date().toISOString(),
          isAvailable: true,
        },
        {
          id: '3',
          title: 'Wooden Coffee Table',
          description: 'Beautiful handcrafted wooden coffee table. Minor scratches but sturdy.',
          category: 'Furniture',
          price: 85,
          imageUrl: 'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg',
          sellerId: 'sample_user3',
          sellerName: 'Mike Johnson',
          createdAt: new Date().toISOString(),
          isAvailable: true,
        },
      ];
      setProducts(sampleProducts);
      localStorage.setItem('ecofinds_products', JSON.stringify(sampleProducts));
    }

    const savedCart = localStorage.getItem('ecofinds_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    const savedPurchases = localStorage.getItem('ecofinds_purchases');
    if (savedPurchases) {
      setPurchases(JSON.parse(savedPurchases));
    }
  }, []);

  const addProduct = (productData: Omit<Product, 'id' | 'sellerId' | 'sellerName' | 'createdAt'>) => {
    if (!currentUser) return;

    const newProduct: Product = {
      ...productData,
      id: Date.now().toString(),
      sellerId: currentUser.id,
      sellerName: currentUser.username,
      createdAt: new Date().toISOString(),
      isAvailable: true,
    };

    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    localStorage.setItem('ecofinds_products', JSON.stringify(updatedProducts));
  };

  const updateProduct = (id: string, productData: Partial<Product>) => {
    const updatedProducts = products.map(product =>
      product.id === id ? { ...product, ...productData } : product
    );
    setProducts(updatedProducts);
    localStorage.setItem('ecofinds_products', JSON.stringify(updatedProducts));
  };

  const deleteProduct = (id: string) => {
    const updatedProducts = products.filter(product => product.id !== id);
    setProducts(updatedProducts);
    localStorage.setItem('ecofinds_products', JSON.stringify(updatedProducts));
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    let updatedCart: CartItem[];

    if (existingItem) {
      updatedCart = cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      const newCartItem: CartItem = {
        id: Date.now().toString(),
        product,
        quantity: 1,
        addedAt: new Date().toISOString(),
      };
      updatedCart = [...cart, newCartItem];
    }

    setCart(updatedCart);
    localStorage.setItem('ecofinds_cart', JSON.stringify(updatedCart));
  };

  const removeFromCart = (productId: string) => {
    const updatedCart = cart.filter(item => item.product.id !== productId);
    setCart(updatedCart);
    localStorage.setItem('ecofinds_cart', JSON.stringify(updatedCart));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('ecofinds_cart');
  };

  const purchaseCart = () => {
    if (!currentUser || cart.length === 0) return;

    const newPurchase: Purchase = {
      id: Date.now().toString(),
      products: cart.map(item => ({
        product: item.product,
        quantity: item.quantity,
        priceAtPurchase: item.product.price,
      })),
      totalAmount: cart.reduce((total, item) => total + item.product.price * item.quantity, 0),
      purchaseDate: new Date().toISOString(),
      buyerId: currentUser.id,
    };

    const updatedPurchases = [...purchases, newPurchase];
    setPurchases(updatedPurchases);
    localStorage.setItem('ecofinds_purchases', JSON.stringify(updatedPurchases));

    // Mark products as unavailable
    const purchasedProductIds = cart.map(item => item.product.id);
    const updatedProducts = products.map(product =>
      purchasedProductIds.includes(product.id) ? { ...product, isAvailable: false } : product
    );
    setProducts(updatedProducts);
    localStorage.setItem('ecofinds_products', JSON.stringify(updatedProducts));

    clearCart();
  };

  const getUserProducts = (): Product[] => {
    if (!currentUser) return [];
    return products.filter(product => product.sellerId === currentUser.id);
  };

  const getFilteredProducts = (): Product[] => {
    let filtered = products.filter(product => product.isAvailable);

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const value = {
    products,
    cart,
    purchases,
    searchQuery,
    selectedCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    addToCart,
    removeFromCart,
    clearCart,
    purchaseCart,
    setSearchQuery,
    setSelectedCategory,
    getUserProducts,
    getFilteredProducts,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};