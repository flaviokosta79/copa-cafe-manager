import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpIcon, ArrowDownIcon, DollarSign, ShoppingBag, Users, CreditCard, CheckCircle, XCircle } from 'lucide-react';

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
  
  // Debug: Imprimir estado inicial
  console.log('Estado inicial:', {
    users: users.length,
    payments: payments.length,
    products: products.length,
    monthlyBalances: monthlyBalances.length,
    currentMonth
  });

  // Verificar se há dados ativos no sistema
  const hasActiveData = users.length > 0 || payments.length > 0;
  console.log('hasActiveData:', hasActiveData);
  
  // Encontrar o saldo do mês atual (apenas se houver dados ativos)
  const currentMonthBalance = monthlyBalances.find(balance => balance.month === currentMonth);
  console.log('currentMonthBalance:', currentMonthBalance);
  
  // Calcular totaais diretamente dos pagamentos e produtos
  console.log('Calculando totais...');
  console.log('Array de pagamentos:', JSON.stringify(payments, null, 2));
  
  const totalPayments = payments
    .filter(payment => {
      const isCurrentMonth = payment.month === currentMonth;
      console.log(`Verificando pagamento ${payment.id}:`, {
        month: payment.month,
        currentMonth,
        isCurrentMonth,
        amount: payment.amount
      });
      return isCurrentMonth;
    })
    .reduce((sum, payment) => {
      console.log(`Somando pagamento ${payment.id}:`, payment.amount);
      return sum + payment.amount;
    }, 0);

  console.log('Total final de pagamentos:', totalPayments);

  const totalProducts = products
    .filter(product => {
      const isCurrentMonth = product.month === currentMonth;
      console.log(`Verificando produto ${product.id}:`, {
        month: product.month,
        currentMonth,
        isCurrentMonth,
        total: product.price * product.quantity
      });
      return isCurrentMonth;
    })
    .reduce((sum, product) => {
      console.log(`Somando produto ${product.id}:`, product.price * product.quantity);
      return sum + (product.price * product.quantity);
    }, 0);

  console.log('Total final de produtos:', totalProducts);

  // Calcular totais diretamente dos pagamentos e produtos
  const totalUsers = users.length;
  console.log('Total de usuários:', totalUsers);
  
  const payingUsers = users.filter(user => {
    const hasPayments = getUserPayments(user.id, currentMonth).length > 0;
    console.log(`Verificando pagamentos do usuário ${user.id}:`, {
      name: user.name,
      hasPayments,
      payments: getUserPayments(user.id, currentMonth)
    });
    return hasPayments;
  }).length;
  
  console.log('Usuários pagantes:', payingUsers);
  const nonPayingUsers = totalUsers - payingUsers;
  console.log('Usuários não pagantes:', nonPayingUsers);

  // Calcular o saldo com base nos totais calculados
  const balance = totalPayments - totalProducts;
  console.log('Saldo final:', balance);
  
  // Lista de meses disponíveis (atuais e anteriores)
  const availableMonths = Array.from(new Set([
    ...monthlyBalances.map(balance => balance.month),
    currentMonth
  ])).sort().reverse();

  return (
    <Layout title="Dashboard">
      <div className="mb-4 flex justify-end">
        <Select value={currentMonth} onValueChange={setCurrentMonth}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione o mês" />
          </SelectTrigger>
          <SelectContent>
            {availableMonths.map(month => (
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
              Saldo Total
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
      </div>
    </Layout>
  );
};

export default Dashboard;
