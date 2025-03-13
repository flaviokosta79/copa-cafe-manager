import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { DollarSign, CheckCircle, History, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import * as apiService from '@/services/apiService';
import { MonthlyAmountConfig, PixConfig, PixKeyType } from '@/types';

interface UserPaymentStatus {
  [userId: string]: boolean;
}

const UserPaymentDialog: React.FC<{ userId: string, userName: string }> = ({ userId, userName }) => {
  const { addPayment, formatCurrency } = useApp();
  const { checkAdminPermission } = useAuth();
  const [amount, setAmount] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const paymentAmount = parseFloat(amount);
    
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, informe um valor positivo.",
        variant: "destructive"
      });
      return;
    }
    
    checkAdminPermission(() => {
      addPayment(userId, paymentAmount);
      setAmount('');
      setIsOpen(false);
      
      toast({
        title: "Pagamento registrado",
        description: `Pagamento de ${formatCurrency(paymentAmount)} para ${userName} foi registrado com sucesso.`
      });
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline">
          <DollarSign className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Pagamento para {userName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label htmlFor="amount" className="text-sm font-medium">
              Valor do Pagamento (R$)
            </label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full">Registrar Pagamento</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const PaymentsPage: React.FC = () => {
  const { users, getUserPayments, formatCurrency, currentMonth, formatMonth, addPayment, deletePayment } = useApp();
  const { checkAdminPermission } = useAuth();
  const [paymentStatus, setPaymentStatus] = useState<UserPaymentStatus>({});
  const [monthlyAmount, setMonthlyAmount] = useState<string>('');
  const [configuredAmount, setConfiguredAmount] = useState<number>(0);
  const [monthlyConfigs, setMonthlyConfigs] = useState<MonthlyAmountConfig[]>([]);
  const [pixConfig, setPixConfig] = useState<PixConfig>({ 
    key: '',
    type: 'cpf',
    managerName: ''
  });
  const { toast } = useToast();

  // Carregar configurações de valor mensal e PIX ao montar o componente
  useEffect(() => {
    const loadConfigs = async () => {
      const configs = await apiService.getMonthlyAmountConfigs();
      setMonthlyConfigs(configs);
      
      // Se existe uma configuração para o mês atual, use-a
      const currentConfig = configs.find(config => config.month === currentMonth);
      if (currentConfig) {
        setConfiguredAmount(currentConfig.amount);
        setMonthlyAmount(currentConfig.amount.toFixed(2));
      }

      // Carregar chave PIX
      const adminConfig = await apiService.getAdminConfig();
      if (adminConfig.pix) {
        setPixConfig(adminConfig.pix);
      }
    };
    
    loadConfigs();
  }, [currentMonth]);

  React.useEffect(() => {
    const newPaymentStatus: UserPaymentStatus = {};
    
    users.forEach(user => {
      const userPayments = getUserPayments(user.id, currentMonth);
      newPaymentStatus[user.id] = userPayments.length > 0;
    });
    
    setPaymentStatus(newPaymentStatus);
  }, [users, getUserPayments, currentMonth]);

  const handleTogglePaymentStatus = (userId: string, userName: string, currentStatus: boolean) => {
    checkAdminPermission(() => {
      const newStatus = !currentStatus;
      setPaymentStatus(prev => ({
        ...prev,
        [userId]: newStatus
      }));
  
      if (newStatus) {
        // Se o status está mudando para "Pago", adiciona um pagamento do valor mensal configurado
        if (configuredAmount > 0) {
          // Primeiro verificamos se já existe um pagamento para este mês
          const userPayments = getUserPayments(userId, currentMonth);
          
          // Se não houver pagamentos ou o total for diferente do valor configurado
          // então registramos um novo pagamento
          const totalPaid = userPayments.reduce((total, payment) => total + payment.amount, 0);
          if (userPayments.length === 0 || totalPaid !== configuredAmount) {
            // Se já existe algum pagamento, removemos para não duplicar
            if (userPayments.length > 0) {
              userPayments.forEach(payment => {
                deletePayment(payment.id);
              });
            }
            
            // Adicionamos o pagamento com o valor mensal configurado
            addPayment(userId, configuredAmount);
            
            toast({
              title: "Pagamento registrado",
              description: `Pagamento de ${formatCurrency(configuredAmount)} para ${userName} foi registrado.`
            });
          }
        } else {
          toast({
            title: "Valor mensal não configurado",
            description: "Configure um valor mensal antes de marcar como pago.",
            variant: "destructive"
          });
        }
      } else {
        // Se o status está mudando para "Pendente", remove todos os pagamentos do mês atual
        const userPayments = getUserPayments(userId, currentMonth);
        userPayments.forEach(payment => {
          deletePayment(payment.id);
        });
  
        toast({
          title: "Pagamentos removidos",
          description: `Os pagamentos de ${userName} foram removidos.`
        });
      }
    });
  };

  const getUserTotalPayments = (userId: string): number => {
    const payments = getUserPayments(userId, currentMonth);
    return payments.reduce((total, payment) => total + payment.amount, 0);
  };

  const handleMonthlyAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const numericValue = value ? parseInt(value) / 100 : 0;
    setMonthlyAmount(numericValue.toFixed(2));
  };

  const handleApplyMonthlyAmount = async () => {
    const amount = parseFloat(monthlyAmount);
    if (!isNaN(amount) && amount > 0) {
      checkAdminPermission(async () => {
        // Salvar a configuração no servidor
        const newConfig: MonthlyAmountConfig = {
          month: currentMonth,
          amount: amount
        };
        
        const savedConfig = await apiService.updateMonthlyAmountConfig(newConfig);
        if (savedConfig) {
          setConfiguredAmount(amount);
          
          // Atualizar a lista de configurações
          const configs = await apiService.getMonthlyAmountConfigs();
          setMonthlyConfigs(configs);
          
          toast({
            title: "Valor mensal configurado",
            description: `O valor mensal foi configurado para ${formatCurrency(amount)}`
          });
        }
      });
    } else {
      toast({
        title: "Valor inválido",
        description: "Por favor, informe um valor válido maior que zero.",
        variant: "destructive"
      });
    }
  };

  const handleUpdatePixKey = async () => {
    if (!pixConfig.key.trim()) {
      toast({
        title: "Chave PIX inválida",
        description: "Por favor, informe uma chave PIX válida.",
        variant: "destructive"
      });
      return;
    }

    checkAdminPermission(async () => {
      const success = await apiService.updateAdminConfig({
        pix: pixConfig
      });
      if (success) {
        toast({
          title: "Chave PIX atualizada",
          description: "A chave PIX foi atualizada com sucesso."
        });
      } else {
        toast({
          title: "Erro ao atualizar chave PIX",
          description: "Não foi possível atualizar a chave PIX. Tente novamente.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <Layout title="Pagamentos">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Chave PIX do Gerente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="managerName">Nome do Gerente</Label>
                  <Input
                    id="managerName"
                    value={pixConfig.managerName}
                    onChange={(e) => setPixConfig(prev => ({ ...prev, managerName: e.target.value }))}
                    placeholder="Nome completo do gerente"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pixKey">Chave PIX</Label>
                  <Input
                    id="pixKey"
                    value={pixConfig.key}
                    onChange={(e) => setPixConfig(prev => ({ ...prev, key: e.target.value }))}
                    placeholder="Digite a chave PIX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pixType">Tipo de Chave</Label>
                  <Select
                    value={pixConfig.type}
                    onValueChange={(value: PixKeyType) => setPixConfig(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de chave" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="celular">Celular</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="aleatoria">Chave Aleatória</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={handleUpdatePixKey}
                disabled={!pixConfig.key || !pixConfig.managerName}
              >
                Salvar Configurações do PIX
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Valor Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  type="text"
                  placeholder="0,00"
                  value={monthlyAmount}
                  onChange={handleMonthlyAmountChange}
                  className="pl-9"
                />
              </div>
              <Button 
                onClick={handleApplyMonthlyAmount}
                variant="secondary"
              >
                Aplicar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Valores Mensais
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyConfigs.length > 0 ? (
              <div className="space-y-2">
                {monthlyConfigs
                  .sort((a, b) => b.month.localeCompare(a.month))
                  .map(config => (
                    <div key={config.month} className="flex justify-between items-center p-2 border rounded">
                      <span>{formatMonth(config.month)}</span>
                      <span className="font-medium">
                        {formatCurrency(config.amount)}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-2">
                Nenhum valor mensal configurado.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {users.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Switch
                            checked={paymentStatus[user.id] || false}
                            onCheckedChange={() => 
                              handleTogglePaymentStatus(
                                user.id,
                                user.name,
                                paymentStatus[user.id] || false
                              )
                            }
                            className="mr-2"
                          />
                          <span className={paymentStatus[user.id] ? "text-green-500" : "text-red-500"}>
                            {paymentStatus[user.id] ? "Pago" : "Pendente"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(getUserTotalPayments(user.id))}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <UserPaymentDialog userId={user.id} userName={user.name} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-4 text-muted-foreground">
                Nenhum usuário cadastrado. Adicione um usuário na aba Usuários.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PaymentsPage;
