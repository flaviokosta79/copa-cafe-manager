
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Payment, Product, MonthlyBalance } from '@/types';
import * as storageService from '@/services/storageService';
import { v4 as uuidv4 } from 'uuid';

interface AppContextType {
  // Estado
  users: User[];
  payments: Payment[];
  products: Product[];
  monthlyBalances: MonthlyBalance[];
  currentMonth: string;
  
  // Ações para usuários
  addUser: (name: string) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  
  // Ações para pagamentos
  addPayment: (userId: string, amount: number) => void;
  deletePayment: (paymentId: string) => void;
  
  // Ações para produtos
  addProduct: (name: string, price: number, quantity: number) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  
  // Ações para mês
  setCurrentMonth: (month: string) => void;
  
  // Utilitários
  formatMonth: (month: string) => string;
  formatCurrency: (value: number) => string;
  getUserById: (userId: string) => User | undefined;
  getMonthlyPaymentsTotal: (month: string) => number;
  getMonthlyProductsTotal: (month: string) => number;
  getUserPayments: (userId: string, month?: string) => Payment[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [monthlyBalances, setMonthlyBalances] = useState<MonthlyBalance[]>([]);
  const [currentMonth, setCurrentMonth] = useState(storageService.getCurrentMonth());

  // Carregar dados do localStorage no primeiro carregamento
  useEffect(() => {
    setUsers(storageService.getUsers());
    setPayments(storageService.getPayments());
    setProducts(storageService.getProducts());
    setMonthlyBalances(storageService.getMonthlyBalances());
  }, []);

  // Função para adicionar um novo usuário
  const addUser = (name: string) => {
    if (!name.trim()) return;
    
    const newUser: User = {
      id: uuidv4(),
      name,
      balance: 0
    };
    
    storageService.addUser(newUser);
    setUsers(storageService.getUsers());
  };

  // Função para atualizar um usuário
  const updateUser = (updatedUser: User) => {
    storageService.updateUser(updatedUser);
    setUsers(storageService.getUsers());
  };

  // Função para excluir um usuário
  const deleteUser = (userId: string) => {
    storageService.deleteUser(userId);
    setUsers(storageService.getUsers());
    
    // Atualize os pagamentos também
    const userPayments = payments.filter(p => p.userId === userId);
    userPayments.forEach(payment => {
      storageService.deletePayment(payment.id);
    });
    setPayments(storageService.getPayments());
    
    // Atualize os saldos mensais
    const affectedMonths = new Set(userPayments.map(p => p.month));
    affectedMonths.forEach(month => {
      storageService.updateMonthlyBalance(month);
    });
    setMonthlyBalances(storageService.getMonthlyBalances());
  };

  // Função para adicionar um novo pagamento
  const addPayment = (userId: string, amount: number) => {
    if (amount <= 0) return;
    
    const newPayment: Payment = {
      id: uuidv4(),
      userId,
      amount,
      date: new Date().toISOString(),
      month: currentMonth
    };
    
    storageService.addPayment(newPayment);
    setPayments(storageService.getPayments());
    
    // Atualize o saldo do usuário
    storageService.updateUserBalance(userId);
    setUsers(storageService.getUsers());
    
    // Atualize o saldo mensal
    storageService.updateMonthlyBalance(currentMonth);
    setMonthlyBalances(storageService.getMonthlyBalances());
  };

  // Função para excluir um pagamento
  const deletePayment = (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return;
    
    storageService.deletePayment(paymentId);
    setPayments(storageService.getPayments());
    
    // Atualize o saldo do usuário
    storageService.updateUserBalance(payment.userId);
    setUsers(storageService.getUsers());
    
    // Atualize o saldo mensal
    storageService.updateMonthlyBalance(payment.month);
    setMonthlyBalances(storageService.getMonthlyBalances());
  };

  // Função para adicionar um novo produto
  const addProduct = (name: string, price: number, quantity: number) => {
    if (!name.trim() || price <= 0 || quantity <= 0) return;
    
    const newProduct: Product = {
      id: uuidv4(),
      name,
      price,
      quantity,
      date: new Date().toISOString(),
      month: currentMonth
    };
    
    storageService.addProduct(newProduct);
    setProducts(storageService.getProducts());
    
    // Atualize o saldo mensal
    storageService.updateMonthlyBalance(currentMonth);
    setMonthlyBalances(storageService.getMonthlyBalances());
    
    // Atualize o saldo de todos os usuários
    users.forEach(user => {
      storageService.updateUserBalance(user.id);
    });
    setUsers(storageService.getUsers());
  };

  // Função para atualizar um produto
  const updateProduct = (updatedProduct: Product) => {
    const originalProduct = products.find(p => p.id === updatedProduct.id);
    
    storageService.updateProduct(updatedProduct);
    setProducts(storageService.getProducts());
    
    // Atualize o saldo mensal
    if (originalProduct && originalProduct.month !== updatedProduct.month) {
      storageService.updateMonthlyBalance(originalProduct.month);
    }
    storageService.updateMonthlyBalance(updatedProduct.month);
    setMonthlyBalances(storageService.getMonthlyBalances());
    
    // Atualize o saldo de todos os usuários
    users.forEach(user => {
      storageService.updateUserBalance(user.id);
    });
    setUsers(storageService.getUsers());
  };

  // Função para excluir um produto
  const deleteProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    storageService.deleteProduct(productId);
    setProducts(storageService.getProducts());
    
    // Atualize o saldo mensal
    storageService.updateMonthlyBalance(product.month);
    setMonthlyBalances(storageService.getMonthlyBalances());
    
    // Atualize o saldo de todos os usuários
    users.forEach(user => {
      storageService.updateUserBalance(user.id);
    });
    setUsers(storageService.getUsers());
  };

  // Função para obter um usuário pelo ID
  const getUserById = (userId: string): User | undefined => {
    return users.find(user => user.id === userId);
  };

  // Função para obter o total de pagamentos de um mês
  const getMonthlyPaymentsTotal = (month: string): number => {
    return payments
      .filter(payment => payment.month === month)
      .reduce((sum, payment) => sum + payment.amount, 0);
  };

  // Função para obter o total de produtos de um mês
  const getMonthlyProductsTotal = (month: string): number => {
    return products
      .filter(product => product.month === month)
      .reduce((sum, product) => sum + (product.price * product.quantity), 0);
  };

  // Função para obter os pagamentos de um usuário
  const getUserPayments = (userId: string, month?: string): Payment[] => {
    return payments
      .filter(payment => payment.userId === userId && (!month || payment.month === month))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const value = {
    users,
    payments,
    products,
    monthlyBalances,
    currentMonth,
    addUser,
    updateUser,
    deleteUser,
    addPayment,
    deletePayment,
    addProduct,
    updateProduct,
    deleteProduct,
    setCurrentMonth,
    formatMonth: storageService.formatMonth,
    formatCurrency: storageService.formatCurrency,
    getUserById,
    getMonthlyPaymentsTotal,
    getMonthlyProductsTotal,
    getUserPayments
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
