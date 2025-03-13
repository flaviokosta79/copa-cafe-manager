import { User, Payment, Product, MonthlyBalance, MonthlyAmountConfig } from '@/types';

export const API_URL = 'https://copacafe.5cpa.com.br/api';

// Funções para gerenciar usuários
export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await fetch(`${API_URL}/users`);
    if (!response.ok) throw new Error('Falha ao obter usuários');
    return response.json();
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return [];
  }
};

export const addUser = async (user: User): Promise<User | null> => {
  try {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    if (!response.ok) throw new Error('Falha ao adicionar usuário');
    return response.json();
  } catch (error) {
    console.error('Erro ao adicionar usuário:', error);
    return null;
  }
};

export const updateUser = async (user: User): Promise<User | null> => {
  try {
    const response = await fetch(`${API_URL}/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    if (!response.ok) throw new Error('Falha ao atualizar usuário');
    return response.json();
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return null;
  }
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Falha ao excluir usuário');
    return true;
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return false;
  }
};

// Funções para gerenciar pagamentos
export const getPayments = async (): Promise<Payment[]> => {
  try {
    console.log('Fetching payments from API...');
    const response = await fetch(`${API_URL}/payments`);
    if (!response.ok) throw new Error('Falha ao obter pagamentos');
    const data = await response.json();
    console.log('Payments received from API:', data);
    return data;
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);
    return [];
  }
};

export const addPayment = async (payment: Payment): Promise<Payment | null> => {
  try {
    console.log('Adding payment to API:', payment);
    const response = await fetch(`${API_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payment)
    });
    if (!response.ok) throw new Error('Falha ao adicionar pagamento');
    const data = await response.json();
    console.log('Payment response from API:', data);
    return data;
  } catch (error) {
    console.error('Erro ao adicionar pagamento:', error);
    return null;
  }
};

export const deletePayment = async (paymentId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/payments/${paymentId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Falha ao excluir pagamento');
    return true;
  } catch (error) {
    console.error('Erro ao excluir pagamento:', error);
    return false;
  }
};

// Funções para gerenciar produtos
export const getProducts = async (): Promise<Product[]> => {
  try {
    const response = await fetch(`${API_URL}/products`);
    if (!response.ok) throw new Error('Falha ao obter produtos');
    return response.json();
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return [];
  }
};

export const addProduct = async (product: Product): Promise<Product | null> => {
  try {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (!response.ok) throw new Error('Falha ao adicionar produto');
    return response.json();
  } catch (error) {
    console.error('Erro ao adicionar produto:', error);
    return null;
  }
};

export const updateProduct = async (product: Product): Promise<Product | null> => {
  try {
    const response = await fetch(`${API_URL}/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (!response.ok) throw new Error('Falha ao atualizar produto');
    return response.json();
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return null;
  }
};

export const deleteProduct = async (productId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Falha ao excluir produto');
    return true;
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return false;
  }
};

// Funções para gerenciar saldos mensais
export const getMonthlyBalances = async (): Promise<MonthlyBalance[]> => {
  try {
    const response = await fetch(`${API_URL}/monthly-balances`);
    if (!response.ok) throw new Error('Falha ao obter saldos mensais');
    return response.json();
  } catch (error) {
    console.error('Erro ao buscar saldos mensais:', error);
    return [];
  }
};

export const updateMonthlyBalance = async (balance: MonthlyBalance): Promise<MonthlyBalance | null> => {
  try {
    const response = await fetch(`${API_URL}/monthly-balances`, {
      method: 'POST', // Usamos POST mesmo para atualizar, pois a API trata isso
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(balance)
    });
    if (!response.ok) throw new Error('Falha ao atualizar saldo mensal');
    return response.json();
  } catch (error) {
    console.error('Erro ao atualizar saldo mensal:', error);
    return null;
  }
};

// Função para limpar todos os saldos mensais
export const clearMonthlyBalances = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/monthly-balances/clear`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Falha ao limpar saldos mensais');
    return true;
  } catch (error) {
    console.error('Erro ao limpar saldos mensais:', error);
    return false;
  }
};

// Funções para gerenciar configuração de valor mensal
export const getMonthlyAmountConfigs = async (): Promise<MonthlyAmountConfig[]> => {
  try {
    const response = await fetch(`${API_URL}/monthly-amount-config`);
    if (!response.ok) throw new Error('Falha ao obter configurações de valor mensal');
    return response.json();
  } catch (error) {
    console.error('Erro ao buscar configurações de valor mensal:', error);
    return [];
  }
};

export const updateMonthlyAmountConfig = async (config: MonthlyAmountConfig): Promise<MonthlyAmountConfig | null> => {
  try {
    const response = await fetch(`${API_URL}/monthly-amount-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!response.ok) throw new Error('Falha ao atualizar configuração de valor mensal');
    return response.json();
  } catch (error) {
    console.error('Erro ao atualizar configuração de valor mensal:', error);
    return null;
  }
};

// Funções para gerenciar configurações do administrador
export const verifyAdminPassword = async (password: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/verify-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (!response.ok) throw new Error('Falha ao verificar senha de administrador');
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Erro ao verificar senha de administrador:', error);
    return false;
  }
};

export const getAdminConfig = async (): Promise<{ pix?: { key: string; type: 'cpf' | 'celular' | 'email' | 'aleatoria'; managerName: string } }> => {
  try {
    const response = await fetch(`${API_URL}/admin-config`);
    if (!response.ok) throw new Error('Falha ao obter configurações do administrador');
    return response.json();
  } catch (error) {
    console.error('Erro ao buscar configurações do administrador:', error);
    return { pix: { key: "", type: "cpf", managerName: "" } };
  }
};

export const updateAdminConfig = async (config: { pix: { key: string; type: 'cpf' | 'celular' | 'email' | 'aleatoria'; managerName: string } }): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/admin-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!response.ok) throw new Error('Falha ao atualizar configurações do administrador');
    return true;
  } catch (error) {
    console.error('Erro ao atualizar configurações do administrador:', error);
    return false;
  }
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

export function migrateFromLocalStorage() {
  throw new Error('Function not implemented.');
}
