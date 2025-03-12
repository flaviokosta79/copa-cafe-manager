
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from "@/components/ui/switch";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { DollarSign, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface UserPaymentStatus {
  [userId: string]: boolean;
}

const UserPaymentDialog: React.FC<{ userId: string, userName: string }> = ({ userId, userName }) => {
  const { addPayment, formatCurrency } = useApp();
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
    
    addPayment(userId, paymentAmount);
    setAmount('');
    setIsOpen(false);
    
    toast({
      title: "Pagamento registrado",
      description: `Pagamento de ${formatCurrency(paymentAmount)} para ${userName} foi registrado com sucesso.`
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
  const { users, getUserPayments, formatCurrency, currentMonth } = useApp();
  const [paymentStatus, setPaymentStatus] = useState<UserPaymentStatus>({});
  const { toast } = useToast();
  
  // Verificar usuários que já fizeram pagamentos no mês atual
  React.useEffect(() => {
    const newPaymentStatus: UserPaymentStatus = {};
    
    users.forEach(user => {
      const userPayments = getUserPayments(user.id, currentMonth);
      newPaymentStatus[user.id] = userPayments.length > 0;
    });
    
    setPaymentStatus(newPaymentStatus);
  }, [users, getUserPayments, currentMonth]);
  
  const handleTogglePaymentStatus = (userId: string, userName: string, currentStatus: boolean) => {
    setPaymentStatus(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
    
    toast({
      title: currentStatus ? "Pagamento desmarcado" : "Pagamento marcado",
      description: `${userName} foi ${currentStatus ? "desmarcado" : "marcado"} como ${currentStatus ? "não pago" : "pago"}.`
    });
  };
  
  // Função para calcular o total de pagamentos de um usuário no mês atual
  const getUserTotalPayments = (userId: string): number => {
    const payments = getUserPayments(userId, currentMonth);
    return payments.reduce((total, payment) => total + payment.amount, 0);
  };
  
  return (
    <Layout title="Pagamentos">
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
    </Layout>
  );
};

export default PaymentsPage;
