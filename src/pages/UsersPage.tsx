
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
import { PlusIcon, TrashIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const { users, addUser, deleteUser, formatCurrency, getUserPayments, currentMonth } = useApp();
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
  
  // Função para calcular o total de pagamentos de um usuário no mês atual
  const getUserTotalPayments = (userId: string): number => {
    const payments = getUserPayments(userId, currentMonth);
    return payments.reduce((total, payment) => total + payment.amount, 0);
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
                  <TableHead>Pagamentos</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatCurrency(getUserTotalPayments(user.id))}
                      </span>
                      <UserPaymentsDialog userId={user.id} userName={user.name} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => handleDeleteUser(user.id, user.name)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
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
