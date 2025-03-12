
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { PlusIcon, TrashIcon, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

const UserPaymentsDialog: React.FC<{ userId: string, userName: string }> = ({ userId, userName }) => {
  const { getUserPayments, formatCurrency, currentMonth } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  
  const payments = getUserPayments(userId, currentMonth);
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost">Pagamentos</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Pagamentos de {userName}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[400px] overflow-y-auto">
          {payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {new Date(payment.date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-4 text-muted-foreground">
              Nenhum pagamento registrado no mês atual.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const UsersPage: React.FC = () => {
  const { users, addUser, deleteUser, formatCurrency } = useApp();
  const [newUserName, setNewUserName] = useState('');
  const { toast } = useToast();
  
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUserName.trim()) {
      toast({
        title: "Nome inválido",
        description: "Por favor, informe um nome para o usuário.",
        variant: "destructive"
      });
      return;
    }
    
    addUser(newUserName);
    setNewUserName('');
    
    toast({
      title: "Usuário adicionado",
      description: `Usuário "${newUserName}" foi adicionado com sucesso.`
    });
  };
  
  const handleDeleteUser = (userId: string, userName: string) => {
    deleteUser(userId);
    
    toast({
      title: "Usuário removido",
      description: `Usuário "${userName}" foi removido com sucesso.`
    });
  };
  
  return (
    <Layout title="Usuários">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Adicionar Novo Usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddUser} className="flex gap-2">
            <Input
              placeholder="Nome do usuário"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">
              <PlusIcon className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead className="text-center">Pagamentos</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell className={user.balance >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {formatCurrency(user.balance)}
                    </TableCell>
                    <TableCell className="text-center">
                      <UserPaymentsDialog userId={user.id} userName={user.name} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <UserPaymentDialog userId={user.id} userName={user.name} />
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => handleDeleteUser(user.id, user.name)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-4 text-muted-foreground">
              Nenhum usuário cadastrado. Adicione um usuário usando o formulário acima.
            </p>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
};

export default UsersPage;
