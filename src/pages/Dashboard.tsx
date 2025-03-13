import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpIcon, ArrowDownIcon, DollarSign, ShoppingBag, Users, CreditCard, CheckCircle, XCircle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as apiService from '@/services/apiService';
import { PixConfig } from '@/types';

const PIX_TYPE_LABELS = {
  cpf: 'CPF',
  celular: 'Celular',
  email: 'Email',
  aleatoria: 'Chave Aleatória'
};

const Dashboard: React.FC = () => {
  const { 
    users, 
    products,
    payments,
    monthlyBalances, 
    formatMonth, 
    formatCurrency, 
    currentMonth, 
    setCurrentMonth,
    getUserPayments
  } = useApp();
  const { toast } = useToast();
  const [pixConfig, setPixConfig] = useState<PixConfig>({ key: '', type: 'cpf' });

  // Debug: Imprimir estado inicial
  console.log('Estado inicial:', {
    users: users.length,
    payments: payments.length,
    products: products.length,
    monthlyBalances: monthlyBalances.length,
    currentMonth
  });

  // Carregar configuração do PIX
  useEffect(() => {
    const loadPixConfig = async () => {
      const adminConfig = await apiService.getAdminConfig();
      if (adminConfig.pix) {
        setPixConfig(adminConfig.pix);
      }
    };
    loadPixConfig();
  }, []);

  // Cálculos
  const totalUsers = users.length;
  const payingUsers = users.filter(user => getUserPayments(user.id, currentMonth).length > 0).length;
  const nonPayingUsers = totalUsers - payingUsers;
  const totalPayments = payments
    .filter(payment => payment.month === currentMonth)
    .reduce((acc, curr) => acc + curr.amount, 0);
  const totalProducts = products
    .filter(product => product.month === currentMonth)
    .reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  const balance = totalPayments - totalProducts;

  // Ordenar meses em ordem decrescente
  const sortedMonths = [...monthlyBalances]
    .sort((a, b) => b.month.localeCompare(a.month))
    .map(mb => mb.month);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixConfig.key);
    toast({
      description: "Chave PIX copiada para a área de transferência!"
    });
  };

  return (
    <Layout title="Dashboard">
      <div className="mb-6">
        <Select
          value={currentMonth}
          onValueChange={setCurrentMonth}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione o mês" />
          </SelectTrigger>
          <SelectContent>
            {sortedMonths.map(month => (
              <SelectItem key={month} value={month}>
                {formatMonth(month)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <div className="flex items-center">
                <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="text-2xl font-bold">{totalUsers}</div>
              </div>
              <div className="flex items-center mt-2">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                <div className="text-sm">Pagantes: <span className="font-medium">{payingUsers}</span></div>
              </div>
              <div className="flex items-center mt-1">
                <XCircle className="mr-2 h-4 w-4 text-red-500" />
                <div className="text-sm">Não pagantes: <span className="font-medium">{nonPayingUsers}</span></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Recebido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="mr-2 h-4 w-4 text-green-500" />
              <div className="text-2xl font-bold">{formatCurrency(totalPayments)}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total em Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ShoppingBag className="mr-2 h-4 w-4 text-red-500" />
              <div className="text-2xl font-bold">{formatCurrency(totalProducts)}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Restante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CreditCard className="mr-2 h-4 w-4" />
              <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(balance)}
                {balance >= 0 ? 
                  <ArrowUpIcon className="inline ml-2 h-4 w-4 text-green-500" /> : 
                  <ArrowDownIcon className="inline ml-2 h-4 w-4 text-red-500" />
                }
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Usuários e Status</CardTitle>
          </CardHeader>
          <CardContent>
            {users.length > 0 ? (
              <div className="space-y-2">
                {users.map(user => {
                  const hasPaid = getUserPayments(user.id, currentMonth).length > 0;
                  return (
                    <div key={user.id} className="flex justify-between items-center p-2 border rounded">
                      <span>{user.name}</span>
                      <span className={hasPaid ? 'text-green-500 flex items-center' : 'text-red-500 flex items-center'}>
                        {hasPaid ? (
                          <>Pago <CheckCircle className="ml-1 h-4 w-4" /></>
                        ) : (
                          <>Pendente <XCircle className="ml-1 h-4 w-4" /></>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum usuário cadastrado.</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Saldo dos Últimos Meses</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyBalances.length > 0 ? (
              <div className="space-y-2">
                {monthlyBalances
                  .sort((a, b) => b.month.localeCompare(a.month))
                  .slice(0, 5)
                  .map(monthBalance => (
                    <div key={monthBalance.month} className="flex justify-between items-center p-2 border rounded">
                      <span>{formatMonth(monthBalance.month)}</span>
                      <span className={monthBalance.balance >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {formatCurrency(monthBalance.balance)}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum histórico disponível.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chave PIX do Gerente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4 p-4 border rounded">
              <div className="flex items-center gap-2">
                <span className="text-lg text-muted-foreground">{PIX_TYPE_LABELS[pixConfig.type]}:</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-medium">{pixConfig.key}</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCopyPix}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copiar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
