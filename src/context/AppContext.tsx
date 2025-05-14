import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Sale, Notification, User } from '../types';
import { generateId } from '../utils/formatters';
import mockData from '../data/mockData';

interface AppContextType {
  products: Product[];
  sales: Sale[];
  notifications: Notification[];
  currentUser: User | null;
  users: User[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  addSale: (sale: Omit<Sale, 'id' | 'date'>) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (user: User) => Promise<void>;
  addUser: (userData: Omit<User, 'id'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const loadData = () => {
      const storedProducts = localStorage.getItem('erp_products');
      const storedSales = localStorage.getItem('erp_sales');
      const storedNotifications = localStorage.getItem('erp_notifications');
      const storedUser = localStorage.getItem('erp_currentUser');
      const storedUsers = localStorage.getItem('erp_users');

      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      } else {
        setProducts(mockData.products);
        localStorage.setItem('erp_products', JSON.stringify(mockData.products));
      }

      if (storedSales) {
        setSales(JSON.parse(storedSales));
      } else {
        setSales(mockData.sales);
        localStorage.setItem('erp_sales', JSON.stringify(mockData.sales));
      }

      if (storedNotifications) {
        setNotifications(JSON.parse(storedNotifications));
      } else {
        setNotifications(mockData.notifications);
        localStorage.setItem('erp_notifications', JSON.stringify(mockData.notifications));
      }

      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      } else {
        setUsers(mockData.users);
        localStorage.setItem('erp_users', JSON.stringify(mockData.users));
      }

      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user && user.id) {
          setCurrentUser(user);
        }
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('erp_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('erp_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('erp_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('erp_users', JSON.stringify(users));
  }, [users]);

  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...productData,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setProducts([...products, newProduct]);
  };

  const updateProduct = (updatedProduct: Product) => {
    const updated = products.map((product) =>
      product.id === updatedProduct.id
        ? { ...updatedProduct, updatedAt: new Date() }
        : product
    );
    setProducts(updated);
  };

  const deleteProduct = (id: string) => {
    setProducts(products.filter((product) => product.id !== id));
  };

  const addSale = (saleData: Omit<Sale, 'id' | 'date'>) => {
    const newSale: Sale = {
      ...saleData,
      id: generateId(),
      date: new Date(),
    };
    setSales([...sales, newSale]);

    const updatedProducts = [...products];
    saleData.products.forEach((item) => {
      const productIndex = updatedProducts.findIndex((p) => p.id === item.productId);
      if (productIndex !== -1) {
        const product = updatedProducts[productIndex];
        const newQuantity = product.quantity - item.quantity;
        updatedProducts[productIndex] = {
          ...product,
          quantity: newQuantity,
          updatedAt: new Date(),
        };

        if (newQuantity <= product.threshold && newQuantity > 0) {
          const notification: Notification = {
            id: generateId(),
            title: 'Low Stock Alert',
            message: `${product.name} is running low on stock (${newQuantity} remaining)`,
            type: 'warning',
            read: false,
            date: new Date(),
          };
          setNotifications([notification, ...notifications]);
        } else if (newQuantity <= 0) {
          const notification: Notification = {
            id: generateId(),
            title: 'Out of Stock Alert',
            message: `${product.name} is now out of stock!`,
            type: 'error',
            read: false,
            date: new Date(),
          };
          setNotifications([notification, ...notifications]);
        }
      }
    });
    
    setProducts(updatedProducts);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const user = users.find((u) => u.email === email);
      
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('erp_currentUser', JSON.stringify(user));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('erp_currentUser');
  };

  const updateUser = async (user: User): Promise<void> => {
    const updatedUsers = users.map(u => 
      u.id === user.id ? user : u
    );
    setUsers(updatedUsers);
    
    if (currentUser && user.id === currentUser.id) {
      setCurrentUser(user);
      localStorage.setItem('erp_currentUser', JSON.stringify(user));
    }
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: generateId(),
    };
    setUsers([...users, newUser]);
  };

  return (
    <AppContext.Provider
      value={{
        products,
        sales,
        notifications,
        currentUser,
        users,
        addProduct,
        updateProduct,
        deleteProduct,
        addSale,
        markNotificationAsRead,
        clearNotifications,
        login,
        logout,
        updateUser,
        addUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};