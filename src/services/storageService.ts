
import { User, Payment, Product, MonthlyBalance } from '@/types';

// Chaves para o localStorage
const USERS_KEY = 'copa-cafe-users';
const PAYMENTS_KEY = 'copa-cafe-payments';
const PRODUCTS_KEY = 'copa-cafe-products';
const MONTHLY_BALANCE_KEY = 'copa-cafe-monthly-balance';

// Funções auxiliares para trabalhar com localStorage
const getLocalStorage = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setLocalStorage = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Funções para gerenciar usuários
export const getUsers = (): User[] => {
  return getLocalStorage<User>(USERS_KEY);
};

export const addUser = (user: User): void => {
  const users = getUsers();
  users.push(user);
  setLocalStorage(USERS_KEY, users);
};

export const updateUser = (updatedUser: User): void => {
  const users = getUsers();
  const index = users.findIndex(user => user.id === updatedUser.id);
  if (index !== -1) {
    users[index] = updatedUser;
    setLocalStorage(USERS_KEY, users);
  }
};

export const deleteUser = (userId: string): void => {
  const users = getUsers();
  setLocalStorage(USERS_KEY, users.filter(user => user.id !== userId));
};

// Funções para gerenciar pagamentos
export const getPayments = (): Payment[] => {
  return getLocalStorage<Payment>(PAYMENTS_KEY);
};

export const addPayment = (payment: Payment): void => {
  const payments = getPayments();
  payments.push(payment);
  setLocalStorage(PAYMENTS_KEY, payments);
  
  // Atualize o saldo do usuário
  updateUserBalance(payment.userId);
  
  // Atualize o saldo mensal
  updateMonthlyBalance(payment.month);
};

export const deletePayment = (paymentId: string): void => {
  const payments = getPayments();
  const payment = payments.find(p => p.id === paymentId);
  
  if (payment) {
    setLocalStorage(PAYMENTS_KEY, payments.filter(p => p.id !== paymentId));
    
    // Atualize o saldo do usuário
    updateUserBalance(payment.userId);
    
    // Atualize o saldo mensal
    updateMonthlyBalance(payment.month);
  }
};

// Funções para gerenciar produtos
export const getProducts = (): Product[] => {
  return getLocalStorage<Product>(PRODUCTS_KEY);
};

export const addProduct = (product: Product): void => {
  const products = getProducts();
  products.push(product);
  setLocalStorage(PRODUCTS_KEY, products);
  
  // Atualize o saldo mensal
  updateMonthlyBalance(product.month);
};

export const updateProduct = (updatedProduct: Product): void => {
  const products = getProducts();
  const index = products.findIndex(product => product.id === updatedProduct.id);
  
  if (index !== -1) {
    const oldProduct = products[index];
    products[index] = updatedProduct;
    setLocalStorage(PRODUCTS_KEY, products);
    
    // Atualize o saldo mensal, se necessário
    if (oldProduct.month !== updatedProduct.month) {
      updateMonthlyBalance(oldProduct.month);
    }
    updateMonthlyBalance(updatedProduct.month);
  }
};

export const deleteProduct = (productId: string): void => {
  const products = getProducts();
  const product = products.find(p => p.id === productId);
  
  if (product) {
    setLocalStorage(PRODUCTS_KEY, products.filter(p => p.id !== productId));
    
    // Atualize o saldo mensal
    updateMonthlyBalance(product.month);
  }
};

// Funções para gerenciar saldos mensais
export const getMonthlyBalances = (): MonthlyBalance[] => {
  return getLocalStorage<MonthlyBalance>(MONTHLY_BALANCE_KEY);
};

export const getMonthlyBalance = (month: string): MonthlyBalance | undefined => {
  const balances = getMonthlyBalances();
  return balances.find(balance => balance.month === month);
};

export const updateMonthlyBalance = (month: string): void => {
  const payments = getPayments().filter(payment => payment.month === month);
  const products = getProducts().filter(product => product.month === month);
  
  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalProducts = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
  
  // Busque o saldo do mês anterior para calcular o acumulado
  const previousMonthBalance = getPreviousMonthBalance(month);
  
  const newBalance: MonthlyBalance = {
    month,
    totalPayments,
    totalProducts,
    balance: totalPayments - totalProducts + (previousMonthBalance?.balance || 0)
  };
  
  const balances = getMonthlyBalances();
  const index = balances.findIndex(balance => balance.month === month);
  
  if (index !== -1) {
    balances[index] = newBalance;
  } else {
    balances.push(newBalance);
  }
  
  setLocalStorage(MONTHLY_BALANCE_KEY, balances);
  
  // Atualize o próximo mês, se existir
  const nextMonth = getNextMonth(month);
  const nextMonthBalance = getMonthlyBalance(nextMonth);
  
  if (nextMonthBalance) {
    updateMonthlyBalance(nextMonth);
  }
};

// Funções auxiliares
export const updateUserBalance = (userId: string): void => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  
  if (user) {
    const payments = getPayments().filter(payment => payment.userId === userId);
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Calcular a parte proporcional dos produtos
    const products = getProducts();
    const totalProducts = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
    const userCount = users.length || 1; // Evita divisão por zero
    const userShare = totalProducts / userCount;
    
    user.balance = totalPaid - userShare;
    updateUser(user);
  }
};

// Obtém o saldo do mês anterior
const getPreviousMonthBalance = (month: string): MonthlyBalance | undefined => {
  const [year, monthNum] = month.split('-').map(Number);
  
  let prevYear = year;
  let prevMonth = monthNum - 1;
  
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }
  
  const prevMonthStr = `${prevYear}-${prevMonth.toString().padStart(2, '0')}`;
  return getMonthlyBalance(prevMonthStr);
};

// Obtém o próximo mês
const getNextMonth = (month: string): string => {
  const [year, monthNum] = month.split('-').map(Number);
  
  let nextYear = year;
  let nextMonth = monthNum + 1;
  
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }
  
  return `${nextYear}-${nextMonth.toString().padStart(2, '0')}`;
};

// Obtém o mês atual no formato "YYYY-MM"
export const getCurrentMonth = (): string => {
  const date = new Date();
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
};

// Formata o mês para exibição (ex: "2023-01" -> "Janeiro 2023")
export const formatMonth = (month: string): string => {
  const [year, monthNum] = month.split('-');
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
};

// Formata valor para moeda brasileira
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};
