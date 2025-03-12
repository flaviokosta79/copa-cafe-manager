import { User, Payment, Product, MonthlyBalance } from '@/types';
import * as fs from 'fs';
import * as path from 'path';

// Caminhos dos arquivos de dados
const DB_FOLDER = path.resolve(process.cwd(), 'db');
const USERS_FILE = path.join(DB_FOLDER, 'users.json');
const PAYMENTS_FILE = path.join(DB_FOLDER, 'payments.json');
const PRODUCTS_FILE = path.join(DB_FOLDER, 'products.json');
const MONTHLY_BALANCE_FILE = path.join(DB_FOLDER, 'monthly-balances.json');

// Garante que a pasta db existe
if (!fs.existsSync(DB_FOLDER)) {
  fs.mkdirSync(DB_FOLDER, { recursive: true });
}

// Funções auxiliares para trabalhar com arquivos
const readJsonFile = <T>(filePath: string): T[] => {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Erro ao ler o arquivo ${filePath}:`, error);
    return [];
  }
};

const writeJsonFile = <T>(filePath: string, data: T[]): void => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Erro ao escrever no arquivo ${filePath}:`, error);
  }
};

// Funções para gerenciar usuários
export const getUsers = (): User[] => {
  return readJsonFile<User>(USERS_FILE);
};

export const addUser = (user: User): void => {
  const users = getUsers();
  users.push(user);
  writeJsonFile(USERS_FILE, users);
};

export const updateUser = (updatedUser: User): void => {
  const users = getUsers();
  const index = users.findIndex(user => user.id === updatedUser.id);
  if (index !== -1) {
    users[index] = updatedUser;
    writeJsonFile(USERS_FILE, users);
  }
};

export const deleteUser = (userId: string): void => {
  const users = getUsers();
  writeJsonFile(USERS_FILE, users.filter(user => user.id !== userId));
};

// Funções para gerenciar pagamentos
export const getPayments = (): Payment[] => {
  return readJsonFile<Payment>(PAYMENTS_FILE);
};

export const addPayment = (payment: Payment): void => {
  const payments = getPayments();
  payments.push(payment);
  writeJsonFile(PAYMENTS_FILE, payments);
  
  // Atualize o saldo do usuário
  updateUserBalance(payment.userId);
  
  // Atualize o saldo mensal
  updateMonthlyBalance(payment.month);
};

export const deletePayment = (paymentId: string): void => {
  const payments = getPayments();
  const payment = payments.find(p => p.id === paymentId);
  
  if (payment) {
    writeJsonFile(PAYMENTS_FILE, payments.filter(p => p.id !== paymentId));
    
    // Atualize o saldo do usuário
    updateUserBalance(payment.userId);
    
    // Atualize o saldo mensal
    updateMonthlyBalance(payment.month);
  }
};

// Funções para gerenciar produtos
export const getProducts = (): Product[] => {
  return readJsonFile<Product>(PRODUCTS_FILE);
};

export const addProduct = (product: Product): void => {
  const products = getProducts();
  products.push(product);
  writeJsonFile(PRODUCTS_FILE, products);
  
  // Atualize o saldo mensal
  updateMonthlyBalance(product.month);
};

export const updateProduct = (updatedProduct: Product): void => {
  const products = getProducts();
  const index = products.findIndex(product => product.id === updatedProduct.id);
  
  if (index !== -1) {
    const oldProduct = products[index];
    products[index] = updatedProduct;
    writeJsonFile(PRODUCTS_FILE, products);
    
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
    writeJsonFile(PRODUCTS_FILE, products.filter(p => p.id !== productId));
    
    // Atualize o saldo mensal
    updateMonthlyBalance(product.month);
  }
};

// Funções para gerenciar saldos mensais
export const getMonthlyBalances = (): MonthlyBalance[] => {
  return readJsonFile<MonthlyBalance>(MONTHLY_BALANCE_FILE);
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
  
  const newBalance: MonthlyBalance = {
    month,
    totalPayments,
    totalProducts,
    balance: totalPayments - totalProducts // Removida a soma do saldo anterior
  };
  
  const balances = getMonthlyBalances();
  const index = balances.findIndex(balance => balance.month === month);
  
  if (index !== -1) {
    balances[index] = newBalance;
  } else {
    balances.push(newBalance);
  }
  
  writeJsonFile(MONTHLY_BALANCE_FILE, balances);
  
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

// Função para migrar dados do localStorage para os arquivos
export const migrateFromLocalStorage = (): void => {
  if (typeof window !== 'undefined') {
    try {
      // Migrar usuários
      const usersData = localStorage.getItem('copa-cafe-users');
      if (usersData) {
        writeJsonFile(USERS_FILE, JSON.parse(usersData));
      }
      
      // Migrar pagamentos
      const paymentsData = localStorage.getItem('copa-cafe-payments');
      if (paymentsData) {
        writeJsonFile(PAYMENTS_FILE, JSON.parse(paymentsData));
      }
      
      // Migrar produtos
      const productsData = localStorage.getItem('copa-cafe-products');
      if (productsData) {
        writeJsonFile(PRODUCTS_FILE, JSON.parse(productsData));
      }
      
      // Migrar saldos mensais
      const monthlyBalancesData = localStorage.getItem('copa-cafe-monthly-balance');
      if (monthlyBalancesData) {
        writeJsonFile(MONTHLY_BALANCE_FILE, JSON.parse(monthlyBalancesData));
      }
      
      console.log('Dados migrados com sucesso do localStorage para arquivos.');
    } catch (error) {
      console.error('Erro ao migrar dados do localStorage:', error);
    }
  }
};