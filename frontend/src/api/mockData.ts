export interface Category {
  id: string;
  name: string;
  icon: string;
  itemCount: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  categoryId: string;
  isVeg: boolean;
  discount?: string;
}

export const mockCategories: Category[] = [
  { id: 'all', name: 'All', icon: '🍽️', itemCount: 235 },
  { id: 'breakfast', name: 'Breakfast', icon: '🍳', itemCount: 19 },
  { id: 'soups', name: 'Soups', icon: '🥣', itemCount: 6 },
  { id: 'pasta', name: 'Pasta', icon: '🍝', itemCount: 14 },
  { id: 'main', name: 'Main Course', icon: '🍛', itemCount: 67 },
  { id: 'burgers', name: 'Burgers', icon: '🍔', itemCount: 13 },
];

export const mockProducts: Product[] = [
  {
    id: 'p1',
    name: 'Tasty Vegetable Salad Healthy Diet',
    price: 17.99,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80',
    categoryId: 'main',
    isVeg: true,
    discount: '20% Off'
  },
  {
    id: 'p2',
    name: 'Original Chess Meat Burger With Chips',
    price: 23.99,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80',
    categoryId: 'burgers',
    isVeg: false,
  },
  {
    id: 'p3',
    name: 'Tacos Salsa With Chickens Grilled',
    price: 14.99,
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=300&q=80',
    categoryId: 'main',
    isVeg: false,
  },
  {
    id: 'p4',
    name: 'Meat Sushi Maki With Tuna',
    price: 9.99,
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=300&q=80',
    categoryId: 'main',
    isVeg: false,
  },
  {
    id: 'p5',
    name: 'Fresh Orange Juice With Basil Seed',
    price: 12.99,
    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=300&q=80',
    categoryId: 'breakfast',
    isVeg: true,
  },
  {
    id: 'p6',
    name: 'Original Chess Burger With French Fries',
    price: 10.59,
    image: 'https://images.unsplash.com/photo-1594212691516-ac6e9bc662da?auto=format&fit=crop&w=300&q=80',
    categoryId: 'burgers',
    isVeg: false,
    discount: '20% Off'
  }
];
