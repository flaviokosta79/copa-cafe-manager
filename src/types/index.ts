export interface User {
  id: string;
  name: string;
  balance: number; // Saldo atual (positivo = crédito, negativo = débito)
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  date: string;
  month: string; // formato "YYYY-MM"
}

export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  date: string;
  month: string; // formato "YYYY-MM"
}

export interface MonthlyBalance {
  month: string; // formato "YYYY-MM" 
  totalPayments: number;
  totalProducts: number;
  balance: number; // Diferença entre pagamentos e produtos
}

export interface MonthlyAmountConfig {
  month: string;
  amount: number;
}
