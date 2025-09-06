export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  phone: string;
  address: string;
  bio: string;
  joinedDate: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  imageUrl: string;
  sellerId: string;
  sellerName: string;
  createdAt: string;
  isAvailable: boolean;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  addedAt: string;
}

export interface Purchase {
  id: string;
  products: Array<{
    product: Product;
    quantity: number;
    priceAtPurchase: number;
  }>;
  totalAmount: number;
  purchaseDate: string;
  buyerId: string;
}

export type Category = 
  | 'Electronics'
  | 'Clothing'
  | 'Furniture'
  | 'Books'
  | 'Sports'
  | 'Home & Garden'
  | 'Toys'
  | 'Automotive'
  | 'Other';