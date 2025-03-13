import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Payment, Product, MonthlyBalance } from '@/types';
import * as apiService from '@/services/apiService';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

interface AppContextType {
  // Estado
  users: User[];
  payments: Payment[];
  products: Product[];
  monthlyBalances: MonthlyBalance[];
  currentMonth: string;
  isLoading: boolean;
  
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
  
  // Ações admin
  resetAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [monthlyBalances, setMonthlyBalances] = useState<MonthlyBalance[]>([]);
  const [currentMonth, setCurrentMonth] = useState(apiService.getCurrentMonth());
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Carregar dados do servidor no primeiro carregamento
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        console.log('Iniciando carregamento de dados...');
        
        // Inicializa o mês atual se não estiver definido
        if (!currentMonth) {
          const initialMonth = apiService.getCurrentMonth();
          setCurrentMonth(initialMonth);
        }
        
        const [usersData, paymentsData, productsData, balancesData] = await Promise.all([
          apiService.getUsers(),
          apiService.getPayments(),
          apiService.getProducts(),
          apiService.getMonthlyBalances()
        ]);

        // Se não houver saldos mensais e houver dados, inicializa com o mês atual
        if (balancesData.length === 0 && (usersData.length > 0 || productsData.length > 0)) {
          const initialBalance = {
            month: currentMonth,
            totalPayments: 0,
            totalProducts: 0,
            balance: 0
          };
          await apiService.updateMonthlyBalance(initialBalance);
          balancesData.push(initialBalance);
        }

        console.log('Dados carregados:', {
          users: usersData.length,
          payments: paymentsData,
          products: productsData.length,
          balances: balancesData.length
        });

        setUsers(usersData);
        setPayments(paymentsData);
        setProducts(productsData);
        setMonthlyBalances(balancesData);
        
        // Tente migrar dados do localStorage se ainda não existirem no servidor
        if (usersData.length === 0 && productsData.length === 0 && paymentsData.length === 0) {
          console.log('Nenhum dado encontrado, tentando migrar do localStorage...');
          await migrateFromLocalStorage();
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados. Verifique se o servidor está rodando.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Função para migrar dados do localStorage para os arquivos
  const migrateFromLocalStorage = async () => {
    try {
      await apiService.migrateFromLocalStorage();
      
      // Check if data exists after migration
      const usersExist = (await apiService.getUsers()).length > 0;
      if (usersExist) {
        const [usersData, paymentsData, productsData, balancesData] = await Promise.all([
          apiService.getUsers(),
          apiService.getPayments(),
          apiService.getProducts(),
          apiService.getMonthlyBalances()
        ]);

        setUsers(usersData);
        setPayments(paymentsData);
        setProducts(productsData);
        setMonthlyBalances(balancesData);
        
        toast({
          title: "Dados migrados com sucesso",
          description: "Os dados foram migrados do armazenamento local para arquivos no servidor."
        });
      }
    } catch (error) {
      console.error("Erro ao migrar dados:", error);
    }
  };

  // Função para adicionar um novo usuário
  const addUser = async (name: string) => {
    if (!name.trim()) return;
    
    const newUser: User = {
      id: uuidv4(),
      name,
      balance: 0
    };
    
    try {
      const addedUser = await apiService.addUser(newUser);
      if (addedUser) {
        const updatedUsers = await apiService.getUsers();
        setUsers(updatedUsers);
      }
    } catch (error) {
      console.error("Erro ao adicionar usuário:", error);
      toast({
        title: "Erro ao adicionar usuário",
        description: "Não foi possível adicionar o usuário. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Função para atualizar um usuário
  const updateUser = async (updatedUser: User) => {
    try {
      await apiService.updateUser(updatedUser);
      const updatedUsers = await apiService.getUsers();
      setUsers(updatedUsers);
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      toast({
        title: "Erro ao atualizar usuário",
        description: "Não foi possível atualizar o usuário. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Função para excluir um usuário
  const deleteUser = async (userId: string) => {
    try {
      // Primeiro, exclua os pagamentos do usuário
      const userPayments = payments.filter(p => p.userId === userId);
      for (const payment of userPayments) {
        await apiService.deletePayment(payment.id);
      }
      
      // Agora exclua o usuário
      const success = await apiService.deleteUser(userId);
      
      if (!success) {
        throw new Error("Falha ao excluir usuário");
      }
      
      // Atualize o estado local imediatamente para uma UI mais responsiva
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      setPayments(prevPayments => prevPayments.filter(payment => payment.userId !== userId));
      
      // Limpe qualquer resíduo no localStorage (para evitar problemas de sincronização)
      if (typeof localStorage !== 'undefined') {
        try {
          const oldUsers = JSON.parse(localStorage.getItem('copa-cafe-users') || '[]');
          const filteredOldUsers = oldUsers.filter(user => user.id !== userId);
          localStorage.setItem('copa-cafe-users', JSON.stringify(filteredOldUsers));
        } catch (storageError) {
          console.error("Erro ao limpar localStorage:", storageError);
        }
      }
      
      // Depois atualize os dados do servidor
      const [updatedUsers, updatedPayments, updatedBalances] = await Promise.all([
        apiService.getUsers(),
        apiService.getPayments(),
        apiService.getMonthlyBalances()
      ]);
      
      // Atualize o estado com os dados do servidor
      setUsers(updatedUsers);
      setPayments(updatedPayments);
      setMonthlyBalances(updatedBalances);
      
      // Se não restarem mais usuários ou produtos, limpe os saldos mensais
      if (updatedUsers.length === 0 && products.length === 0) {
        await apiService.clearMonthlyBalances();
        setMonthlyBalances([]);
      }
      
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso."
      });
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      toast({
        title: "Erro ao excluir usuário",
        description: "Não foi possível excluir o usuário. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Função para adicionar um novo pagamento
  const addPayment = async (userId: string, amount: number) => {
    if (amount <= 0) return;
    
    const newPayment: Payment = {
      id: uuidv4(),
      userId,
      amount,
      date: new Date().toISOString(),
      month: currentMonth
    };
    
    try {
      await apiService.addPayment(newPayment);
      
      // Atualize o estado
      const [updatedPayments, updatedUsers, updatedBalances] = await Promise.all([
        apiService.getPayments(),
        apiService.getUsers(),
        apiService.getMonthlyBalances()
      ]);
      
      setPayments(updatedPayments);
      setUsers(updatedUsers);
      setMonthlyBalances(updatedBalances);
    } catch (error) {
      console.error("Erro ao adicionar pagamento:", error);
      toast({
        title: "Erro ao adicionar pagamento",
        description: "Não foi possível registrar o pagamento. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Função para excluir um pagamento
  const deletePayment = async (paymentId: string) => {
    try {
      const payment = payments.find(p => p.id === paymentId);
      if (!payment) {
        throw new Error("Pagamento não encontrado");
      }
      
      const success = await apiService.deletePayment(paymentId);
      
      if (!success) {
        throw new Error("Falha ao excluir pagamento");
      }
      
      // Atualize o estado local imediatamente para uma UI mais responsiva
      setPayments(prevPayments => prevPayments.filter(p => p.id !== paymentId));
      
      // Limpe qualquer resíduo no localStorage (para evitar problemas de sincronização)
      if (typeof localStorage !== 'undefined') {
        try {
          const oldPayments = JSON.parse(localStorage.getItem('copa-cafe-payments') || '[]');
          const filteredOldPayments = oldPayments.filter(p => p.id !== paymentId);
          localStorage.setItem('copa-cafe-payments', JSON.stringify(filteredOldPayments));
        } catch (storageError) {
          console.error("Erro ao limpar localStorage:", storageError);
        }
      }
      
      // Depois atualize os dados do servidor
      const [updatedPayments, updatedUsers, updatedBalances] = await Promise.all([
        apiService.getPayments(),
        apiService.getUsers(),
        apiService.getMonthlyBalances()
      ]);
      
      // Atualize o estado com os dados do servidor
      setPayments(updatedPayments);
      setUsers(updatedUsers);
      setMonthlyBalances(updatedBalances);
      
      toast({
        title: "Pagamento excluído",
        description: "O pagamento foi excluído com sucesso."
      });
    } catch (error) {
      console.error("Erro ao excluir pagamento:", error);
      toast({
        title: "Erro ao excluir pagamento",
        description: "Não foi possível excluir o pagamento. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Função para adicionar um novo produto
  const addProduct = async (name: string, price: number, quantity: number) => {
    if (!name.trim() || price <= 0 || quantity <= 0) return;
    
    const newProduct: Product = {
      id: uuidv4(),
      name,
      price,
      quantity,
      date: new Date().toISOString(),
      month: currentMonth
    };
    
    try {
      await apiService.addProduct(newProduct);
      
      // Atualize o estado
      const [updatedProducts, updatedUsers, updatedBalances] = await Promise.all([
        apiService.getProducts(),
        apiService.getUsers(),
        apiService.getMonthlyBalances()
      ]);
      
      setProducts(updatedProducts);
      setUsers(updatedUsers);
      setMonthlyBalances(updatedBalances);
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      toast({
        title: "Erro ao adicionar produto",
        description: "Não foi possível adicionar o produto. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Função para atualizar um produto
  const updateProduct = async (updatedProduct: Product) => {
    try {
      await apiService.updateProduct(updatedProduct);
      
      // Atualize o estado
      const [updatedProducts, updatedUsers, updatedBalances] = await Promise.all([
        apiService.getProducts(),
        apiService.getUsers(),
        apiService.getMonthlyBalances()
      ]);
      
      setProducts(updatedProducts);
      setUsers(updatedUsers);
      setMonthlyBalances(updatedBalances);
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      toast({
        title: "Erro ao atualizar produto",
        description: "Não foi possível atualizar o produto. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Função para excluir um produto
  const deleteProduct = async (productId: string) => {
    try {
      // Primeiro encontre o produto para utilizá-lo em caso de erro
      const product = products.find(p => p.id === productId);
      if (!product) {
        throw new Error("Produto não encontrado");
      }
      
      // Tente excluir o produto
      const success = await apiService.deleteProduct(productId);
      
      if (!success) {
        throw new Error("Falha ao excluir produto");
      }
      
      // Atualize o estado local imediatamente para uma UI mais responsiva
      setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
      
      // Limpe qualquer resíduo no localStorage (para evitar problemas de sincronização)
      if (typeof localStorage !== 'undefined') {
        try {
          const oldProducts = JSON.parse(localStorage.getItem('copa-cafe-products') || '[]');
          const filteredOldProducts = oldProducts.filter(p => p.id !== productId);
          localStorage.setItem('copa-cafe-products', JSON.stringify(filteredOldProducts));
        } catch (storageError) {
          console.error("Erro ao limpar localStorage:", storageError);
        }
      }
      
      // Depois atualize os dados do servidor
      const [updatedProducts, updatedUsers, updatedBalances] = await Promise.all([
        apiService.getProducts(),
        apiService.getUsers(),
        apiService.getMonthlyBalances()
      ]);
      
      // Atualize o estado com os dados do servidor
      setProducts(updatedProducts);
      setUsers(updatedUsers);
      setMonthlyBalances(updatedBalances);
      
      // Se não restarem mais produtos ou usuários, limpe os saldos mensais
      if (updatedProducts.length === 0 && users.length === 0) {
        await apiService.clearMonthlyBalances();
        setMonthlyBalances([]);
      }
      
      toast({
        title: "Produto excluído",
        description: "O produto foi excluído com sucesso."
      });
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      toast({
        title: "Erro ao excluir produto",
        description: "Não foi possível excluir o produto. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Função para obter um usuário pelo ID
  const getUserById = (userId: string): User | undefined => {
    return users.find(user => user.id === userId);
  };

  // Função para obter o total de pagamentos de um mês
  const getMonthlyPaymentsTotal = (month: string): number => {
    // Verificação explícita para garantir que o array existe e não está vazio
    if (!payments || payments.length === 0) {
      console.log("Array de pagamentos vazio ou indefinido, retornando 0");
      return 0;
    }
    
    // Filtrar e calcular a soma
    const filteredPayments = payments.filter(payment => payment.month === month);
    console.log(`Pagamentos para o mês ${month}:`, filteredPayments);
    
    return filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  };
  
  // Função para obter o total de produtos de um mês
  const getMonthlyProductsTotal = (month: string): number => {
    // Verificação explícita para garantir que o array existe e não está vazio
    if (!products || products.length === 0) {
      console.log("Array de produtos vazio ou indefinido, retornando 0");
      return 0;
    }
    
    // Filtrar e calcular a soma
    const filteredProducts = products.filter(product => product.month === month);
    console.log(`Produtos para o mês ${month}:`, filteredProducts);
    
    return filteredProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);
  };

  // Função para obter os pagamentos de um usuário
  const getUserPayments = (userId: string, month?: string): Payment[] => {
    console.log(`Buscando pagamentos para usuário ${userId}${month ? ` no mês ${month}` : ''}`);
    console.log('Array completo de pagamentos:', payments);
    
    const filteredPayments = payments
      .filter(payment => {
        const matchesUser = payment.userId === userId;
        const matchesMonth = !month || payment.month === month;
        console.log(`Verificando pagamento ${payment.id}:`, {
          userId: payment.userId,
          month: payment.month,
          matchesUser,
          matchesMonth,
          amount: payment.amount
        });
        return matchesUser && matchesMonth;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    console.log('Pagamentos filtrados:', filteredPayments);
    return filteredPayments;
  };

  const value = {
    users,
    payments,
    products,
    monthlyBalances,
    currentMonth,
    isLoading,
    addUser,
    updateUser,
    deleteUser,
    addPayment,
    deletePayment,
    addProduct,
    updateProduct,
    deleteProduct,
    setCurrentMonth,
    formatMonth: apiService.formatMonth,
    formatCurrency: apiService.formatCurrency,
    getUserById,
    getMonthlyPaymentsTotal,
    getMonthlyProductsTotal,
    getUserPayments
  };

  const resetAllData = async () => {
    try {
      const response = await fetch(`${apiService.API_URL}/reset-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Falha ao resetar dados');

      // Limpar estados
      setUsers([]);
      setPayments([]);
      setProducts([]);
      setMonthlyBalances([]);

      // Limpar localStorage
      localStorage.removeItem('copa-cafe-users');
      localStorage.removeItem('copa-cafe-payments');
      localStorage.removeItem('copa-cafe-products');
      localStorage.removeItem('copa-cafe-monthly-balance');
      localStorage.removeItem('copa-cafe-monthly-amount-config');

      toast({
        title: "Dados resetados com sucesso",
        description: "Todos os dados foram limpos do servidor e do armazenamento local."
      });
    } catch (error) {
      console.error('Erro ao resetar dados:', error);
      toast({
        title: "Erro ao resetar dados",
        description: "Ocorreu um erro ao tentar limpar os dados.",
        variant: "destructive"
      });
    }
  };

  return (
    <AppContext.Provider value={{
      users,
      payments,
      products,
      monthlyBalances,
      currentMonth,
      isLoading,
      addUser,
      updateUser,
      deleteUser,
      addPayment,
      deletePayment,
      addProduct,
      updateProduct,
      deleteProduct,
      setCurrentMonth,
      formatMonth: apiService.formatMonth,
      formatCurrency: apiService.formatCurrency,
      getUserById,
      getMonthlyPaymentsTotal,
      getMonthlyProductsTotal,
      getUserPayments,
      resetAllData,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
