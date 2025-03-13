const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;
const NODE_ENV = process.env.NODE_ENV || 'development';
// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Servir arquivos estáticos apenas em ambiente de produção
if (NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
}

// Configuração da pasta de banco de dados
const DB_FOLDER = path.join(__dirname, 'db');
if (!fs.existsSync(DB_FOLDER)) {
  fs.mkdirSync(DB_FOLDER, { recursive: true });
}

// Caminhos dos arquivos
const USERS_FILE = path.join(DB_FOLDER, 'users.json');
const PAYMENTS_FILE = path.join(DB_FOLDER, 'payments.json');
const PRODUCTS_FILE = path.join(DB_FOLDER, 'products.json');
const MONTHLY_BALANCE_FILE = path.join(DB_FOLDER, 'monthly-balances.json');
// Adicionar novo caminho para o arquivo de configuração de valor mensal
const MONTHLY_AMOUNT_CONFIG_FILE = path.join(DB_FOLDER, 'monthly-amount-config.json');
// Adicionar novo caminho para o arquivo de configuração de administrador
const ADMIN_CONFIG_FILE = path.join(DB_FOLDER, 'admin-config.json');

// Funções auxiliares para manipular arquivos
const readJsonFile = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Erro ao ler o arquivo ${filePath}:`, error);
    return [];
  }
};

const writeJsonFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Erro ao escrever no arquivo ${filePath}:`, error);
    return false;
  }
};

// Rota para exibir todas as rotas disponíveis na API
app.get('/api', (req, res) => {
  res.json({
    message: 'API do Copa Café Manager',
    version: '1.0.0',
    availableRoutes: {
      users: {
        GET: '/api/users',
        POST: '/api/users',
        PUT: '/api/users/:id',
        DELETE: '/api/users/:id'
      },
      payments: {
        GET: '/api/payments',
        POST: '/api/payments',
        DELETE: '/api/payments/:id'
      },
      products: {
        GET: '/api/products',
        POST: '/api/products',
        PUT: '/api/products/:id',
        DELETE: '/api/products/:id'
      },
      monthlyBalances: {
        GET: '/api/monthly-balances',
        POST: '/api/monthly-balances'
      },
      migration: {
        POST: '/api/migrate-from-localstorage'
      },
      auth: {
        POST: '/api/verify-admin'
      }
    }
  });
});

// Nova rota para obter configurações do administrador (sem a senha)
app.get('/api/admin-config', (req, res) => {
  try {
    // Leia o arquivo de configuração do administrador
    let adminConfig = {};
    if (fs.existsSync(ADMIN_CONFIG_FILE)) {
      const data = fs.readFileSync(ADMIN_CONFIG_FILE, 'utf8');
      adminConfig = JSON.parse(data);
      
      // Se não tiver configuração de PIX, inicializa com valores padrão
      if (!adminConfig.pix) {
        adminConfig.pix = { key: "", type: "cpf" };
      }
      // Se tiver só a string do PIX, converte para o novo formato
      else if (typeof adminConfig.pix === 'string') {
        adminConfig.pix = { key: adminConfig.pix, type: "cpf" };
      }
      
      // Retorna uma cópia sem a senha
      const { adminPassword, ...safeConfig } = adminConfig;
      res.json(safeConfig);
    } else {
      res.json({ pix: { key: "", type: "cpf" } });
    }
  } catch (error) {
    console.error('Erro ao obter configurações do administrador:', error);
    res.status(500).json({ error: 'Erro interno ao obter configurações' });
  }
});

// Nova rota para atualizar configurações do administrador
app.post('/api/admin-config', (req, res) => {
  try {
    const { pix } = req.body;
    
    // Valida o tipo do PIX
    const validTypes = ['cpf', 'celular', 'email', 'aleatoria'];
    if (!pix || !pix.key || !pix.type || !validTypes.includes(pix.type)) {
      return res.status(400).json({ error: 'Configuração de PIX inválida' });
    }
    
    // Leia o arquivo de configuração do administrador
    let adminConfig = {};
    if (fs.existsSync(ADMIN_CONFIG_FILE)) {
      const data = fs.readFileSync(ADMIN_CONFIG_FILE, 'utf8');
      adminConfig = JSON.parse(data);
    } else {
      adminConfig = { adminPassword: "abc123" };
    }
    
    // Atualize a configuração do PIX
    adminConfig.pix = pix;
    
    // Salve as alterações
    if (writeJsonFile(ADMIN_CONFIG_FILE, adminConfig)) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Falha ao salvar as configurações' });
    }
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(500).json({ error: 'Erro interno ao atualizar configurações' });
  }
});

// Remover a rota antiga de update-pix que não é mais necessária
// app.post('/api/update-pix', ...);

// Nova rota para verificar senha de administrador
app.post('/api/verify-admin', (req, res) => {
  try {
    const { password } = req.body;
    
    // Leia o arquivo de configuração do administrador
    let adminConfig = {};
    if (fs.existsSync(ADMIN_CONFIG_FILE)) {
      const data = fs.readFileSync(ADMIN_CONFIG_FILE, 'utf8');
      adminConfig = JSON.parse(data);
    } else {
      // Se o arquivo não existir, cria com a senha padrão
      adminConfig = { adminPassword: "abc123" };
      writeJsonFile(ADMIN_CONFIG_FILE, adminConfig);
    }
    
    // Verifica a senha
    const isValid = password === adminConfig.adminPassword;
    
    res.json({ success: isValid });
  } catch (error) {
    console.error('Erro ao verificar senha de administrador:', error);
    res.status(500).json({ error: 'Erro interno ao verificar senha' });
  }
});

// Rotas para usuários
app.get('/api/users', (req, res) => {
  const users = readJsonFile(USERS_FILE);
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const users = readJsonFile(USERS_FILE);
  const newUser = req.body;
  users.push(newUser);
  
  if (writeJsonFile(USERS_FILE, users)) {
    res.status(201).json(newUser);
  } else {
    res.status(500).json({ error: 'Falha ao salvar o usuário' });
  }
});

app.put('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const users = readJsonFile(USERS_FILE);
  const index = users.findIndex(user => user.id === userId);
  
  if (index !== -1) {
    users[index] = req.body;
    
    if (writeJsonFile(USERS_FILE, users)) {
      res.json(users[index]);
    } else {
      res.status(500).json({ error: 'Falha ao atualizar o usuário' });
    }
  } else {
    res.status(404).json({ error: 'Usuário não encontrado' });
  }
});

app.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  console.log(`Tentando excluir usuário com ID: ${userId}`);
  
  const users = readJsonFile(USERS_FILE);
  console.log(`Total de usuários antes da exclusão: ${users.length}`);
  
  const filteredUsers = users.filter(user => user.id !== userId);
  console.log(`Total de usuários após filtro: ${filteredUsers.length}`);
  
  if (writeJsonFile(USERS_FILE, filteredUsers)) {
    console.log(`Usuário excluído com sucesso: ${userId}`);
    res.json({ success: true });
  } else {
    console.error(`Erro ao excluir usuário: ${userId}`);
    res.status(500).json({ error: 'Falha ao excluir o usuário' });
  }
});

// Rotas para pagamentos
app.get('/api/payments', (req, res) => {
  const payments = readJsonFile(PAYMENTS_FILE);
  res.json(payments);
});

app.post('/api/payments', (req, res) => {
  const payments = readJsonFile(PAYMENTS_FILE);
  const newPayment = req.body;
  payments.push(newPayment);
  
  if (writeJsonFile(PAYMENTS_FILE, payments)) {
    res.status(201).json(newPayment);
  } else {
    res.status(500).json({ error: 'Falha ao salvar o pagamento' });
  }
});

app.delete('/api/payments/:id', (req, res) => {
  const paymentId = req.params.id;
  console.log(`Tentando excluir pagamento com ID: ${paymentId}`);
  
  const payments = readJsonFile(PAYMENTS_FILE);
  console.log(`Total de pagamentos antes da exclusão: ${payments.length}`);
  
  const filteredPayments = payments.filter(payment => payment.id !== paymentId);
  console.log(`Total de pagamentos após filtro: ${filteredPayments.length}`);
  
  if (writeJsonFile(PAYMENTS_FILE, filteredPayments)) {
    console.log(`Pagamento excluído com sucesso: ${paymentId}`);
    res.json({ success: true });
  } else {
    console.error(`Erro ao excluir pagamento: ${paymentId}`);
    res.status(500).json({ error: 'Falha ao excluir o pagamento' });
  }
});

// Rotas para produtos
app.get('/api/products', (req, res) => {
  const products = readJsonFile(PRODUCTS_FILE);
  res.json(products);
});

app.post('/api/products', (req, res) => {
  const products = readJsonFile(PRODUCTS_FILE);
  const newProduct = req.body;
  products.push(newProduct);
  
  if (writeJsonFile(PRODUCTS_FILE, products)) {
    res.status(201).json(newProduct);
  } else {
    res.status(500).json({ error: 'Falha ao salvar o produto' });
  }
});

app.put('/api/products/:id', (req, res) => {
  const productId = req.params.id;
  const products = readJsonFile(PRODUCTS_FILE);
  const index = products.findIndex(product => product.id === productId);
  
  if (index !== -1) {
    products[index] = req.body;
    
    if (writeJsonFile(PRODUCTS_FILE, products)) {
      res.json(products[index]);
    } else {
      res.status(500).json({ error: 'Falha ao atualizar o produto' });
    }
  } else {
    res.status(404).json({ error: 'Produto não encontrado' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  const productId = req.params.id;
  console.log(`Tentando excluir produto com ID: ${productId}`);
  
  const products = readJsonFile(PRODUCTS_FILE);
  console.log(`Total de produtos antes da exclusão: ${products.length}`);
  
  const filteredProducts = products.filter(product => product.id !== productId);
  console.log(`Total de produtos após filtro: ${filteredProducts.length}`);
  
  if (writeJsonFile(PRODUCTS_FILE, filteredProducts)) {
    console.log(`Produto excluído com sucesso: ${productId}`);
    res.json({ success: true });
  } else {
    console.error(`Erro ao excluir produto: ${productId}`);
    res.status(500).json({ error: 'Falha ao excluir o produto' });
  }
});

// Rotas para saldos mensais
app.get('/api/monthly-balances', (req, res) => {
  const balances = readJsonFile(MONTHLY_BALANCE_FILE);
  res.json(balances);
});

app.post('/api/monthly-balances', (req, res) => {
  const balances = readJsonFile(MONTHLY_BALANCE_FILE);
  const newBalance = req.body;
  
  const index = balances.findIndex(balance => balance.month === newBalance.month);
  if (index !== -1) {
    balances[index] = newBalance;
  } else {
    balances.push(newBalance);
  }
  
  if (writeJsonFile(MONTHLY_BALANCE_FILE, balances)) {
    res.status(201).json(newBalance);
  } else {
    res.status(500).json({ error: 'Falha ao salvar o saldo mensal' });
  }
});

// Nova rota para limpar todos os saldos mensais
app.post('/api/monthly-balances/clear', (req, res) => {
  console.log('Limpando todos os saldos mensais');
  if (writeJsonFile(MONTHLY_BALANCE_FILE, [])) {
    console.log('Saldos mensais limpos com sucesso');
    res.json({ success: true });
  } else {
    console.error('Erro ao limpar saldos mensais');
    res.status(500).json({ error: 'Falha ao limpar saldos mensais' });
  }
});

// Rotas para configuração de valor mensal
app.get('/api/monthly-amount-config', (req, res) => {
  const configs = readJsonFile(MONTHLY_AMOUNT_CONFIG_FILE);
  res.json(configs);
});

app.post('/api/monthly-amount-config', (req, res) => {
  const configs = readJsonFile(MONTHLY_AMOUNT_CONFIG_FILE);
  const newConfig = req.body;
  
  const index = configs.findIndex(config => config.month === newConfig.month);
  if (index !== -1) {
    configs[index] = newConfig;
  } else {
    configs.push(newConfig);
  }
  
  if (writeJsonFile(MONTHLY_AMOUNT_CONFIG_FILE, configs)) {
    res.status(201).json(newConfig);
  } else {
    res.status(500).json({ error: 'Falha ao salvar a configuração do valor mensal' });
  }
});

// Rota para resetar todos os dados
app.post('/api/reset-data', (req, res) => {
  try {
    // Limpar todos os arquivos de dados
    writeJsonFile(USERS_FILE, []);
    writeJsonFile(PAYMENTS_FILE, []);
    writeJsonFile(PRODUCTS_FILE, []);
    writeJsonFile(MONTHLY_BALANCE_FILE, []);
    writeJsonFile(MONTHLY_AMOUNT_CONFIG_FILE, {});
    
    res.json({ success: true, message: 'Todos os dados foram resetados com sucesso' });
  } catch (error) {
    console.error('Erro ao resetar dados:', error);
    res.status(500).json({ error: 'Falha ao resetar os dados' });
  }
});

// Rota de fallback para SPA - apenas em modo de produção
if (NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  // Em desenvolvimento, retorna um JSON para rotas não encontradas
  app.use((req, res) => {
    res.status(404).json({
      error: 'Rota não encontrada',
      note: 'Você está no ambiente de desenvolvimento. Para acessar a interface, use http://localhost:8080'
    });
  });
}

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} em modo ${NODE_ENV}`);
  console.log(`API disponível em: http://localhost:${PORT}/api`);
  if (NODE_ENV === 'development') {
    console.log(`Interface web disponível em: http://localhost:8080`);
  } else {
    console.log(`Interface web disponível em: http://localhost:${PORT}`);
  }
});