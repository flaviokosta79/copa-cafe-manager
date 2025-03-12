
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpIcon, ArrowDownIcon, DollarSign, ShoppingBag, Users, CreditCard } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { 
    users, 
    monthlyBalances, 
    formatMonth, 
    formatCurrency, 
    currentMonth, 
    setCurrentMonth,
    getMonthlyPaymentsTotal,
    getMonthlyProductsTotal
  } = useApp();
  
  // Encontrar o saldo do mês atual
  const currentMonthBalance = monthlyBalances.find(balance => balance.month === currentMonth);
  
  // Calcular totais para o mês atual
  const totalUsers = users.length;
  const totalPayments = getMonthlyPaymentsTotal(currentMonth);
  const totalProducts = getMonthlyProductsTotal(currentMonth);
  const balance = currentMonthBalance?.balance || 0;
  
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
            <div className="flex items-center">
              <Users className="mr-2 h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-bold">{totalUsers}</div>
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
            <CardTitle>Usuários e Saldos</CardTitle>
          </CardHeader>
          <CardContent>
            {users.length > 0 ? (
              <div className="space-y-2">
                {users.map(user => (
                  <div key={user.id} className="flex justify-between items-center p-2 border rounded">
                    <span>{user.name}</span>
                    <span className={user.balance >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {formatCurrency(user.balance)}
                    </span>
                  </div>
                ))}
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
