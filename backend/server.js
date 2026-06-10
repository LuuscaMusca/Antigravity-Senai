const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { query } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret-key-life-planner';

app.use(cors());
app.use(express.json());

// Middleware de Autenticação JWT
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido ou expirado.' });
  }
}

// === ROTAS DE AUTENTICAÇÃO ===

// Cadastro de usuário
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  try {
    // Verificar se usuário existe
    const existingUser = await query.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Este e-mail já está em uso.' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Inserir usuário
    const result = await query.run(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    // Criar nota em branco padrão para o usuário
    await query.run('INSERT INTO notes (user_id, content) VALUES (?, ?)', [result.id, '']);

    res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
  } catch (err) {
    console.error('Erro no registro:', err);
    res.status(500).json({ error: 'Erro interno no servidor ao cadastrar usuário.' });
  }
});

// Login de usuário
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const user = await query.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ error: 'E-mail ou senha incorretos.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'E-mail ou senha incorretos.' });
    }

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, {
      expiresIn: '24h',
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno no servidor ao realizar login.' });
  }
});

// === ROTAS DE TAREFAS ===

// Buscar tarefas com filtros
app.get('/api/tasks', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { category, priority, completed, search, due_date } = req.query;

  let sql = 'SELECT * FROM tasks WHERE user_id = ?';
  const params = [userId];

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (priority) {
    sql += ' AND priority = ?';
    params.push(priority);
  }
  if (completed !== undefined) {
    sql += ' AND completed = ?';
    params.push(completed === 'true' ? 1 : 0);
  }
  if (due_date) {
    sql += ' AND due_date = ?';
    params.push(due_date);
  }
  if (search) {
    sql += ' AND (title LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY completed ASC, due_date ASC, created_at DESC';

  try {
    const tasks = await query.all(sql, params);
    res.json(tasks);
  } catch (err) {
    console.error('Erro ao buscar tarefas:', err);
    res.status(500).json({ error: 'Erro ao buscar tarefas.' });
  }
});

// Criar tarefa
app.post('/api/tasks', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { title, description, due_date, priority, category } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'O título é obrigatório.' });
  }

  try {
    const result = await query.run(
      `INSERT INTO tasks (user_id, title, description, due_date, priority, category, completed)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [userId, title, description || '', due_date || null, priority || 'medio', category || 'geral']
    );
    const newTask = await query.get('SELECT * FROM tasks WHERE id = ?', [result.id]);
    res.status(201).json(newTask);
  } catch (err) {
    console.error('Erro ao criar tarefa:', err);
    res.status(500).json({ error: 'Erro ao criar tarefa.' });
  }
});

// Atualizar tarefa
app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const taskId = req.params.id;
  const { title, description, due_date, priority, category, completed } = req.body;

  try {
    const existingTask = await query.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId]);
    if (!existingTask) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }

    let completedAt = existingTask.completed_at;
    if (completed !== undefined) {
      if (completed && !existingTask.completed) {
        // Obter data local no formato YYYY-MM-DD
        completedAt = new Date().toISOString().split('T')[0];
      } else if (!completed) {
        completedAt = null;
      }
    }

    await query.run(
      `UPDATE tasks
       SET title = ?, description = ?, due_date = ?, priority = ?, category = ?, completed = ?, completed_at = ?
       WHERE id = ? AND user_id = ?`,
      [
        title !== undefined ? title : existingTask.title,
        description !== undefined ? description : existingTask.description,
        due_date !== undefined ? due_date : existingTask.due_date,
        priority !== undefined ? priority : existingTask.priority,
        category !== undefined ? category : existingTask.category,
        completed !== undefined ? (completed ? 1 : 0) : existingTask.completed,
        completedAt,
        taskId,
        userId
      ]
    );

    const updatedTask = await query.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
    res.json(updatedTask);
  } catch (err) {
    console.error('Erro ao atualizar tarefa:', err);
    res.status(500).json({ error: 'Erro ao atualizar tarefa.' });
  }
});

// Excluir tarefa
app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const taskId = req.params.id;

  try {
    const result = await query.run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }
    res.json({ message: 'Tarefa excluída com sucesso.' });
  } catch (err) {
    console.error('Erro ao excluir tarefa:', err);
    res.status(500).json({ error: 'Erro ao excluir tarefa.' });
  }
});

// === ROTAS DE HÁBITOS ===

// Listar hábitos com log para uma determinada data
app.get('/api/habits', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const date = req.query.date || new Date().toISOString().split('T')[0]; // Padrão YYYY-MM-DD local

  try {
    const habits = await query.all(
      `SELECT h.*, 
              (SELECT completed FROM habit_logs WHERE habit_id = h.id AND date = ?) as completed
       FROM habits h
       WHERE h.user_id = ?`,
      [date, userId]
    );
    
    // Normalizar retorno de completed para boolean
    const habitsWithStatus = habits.map(h => ({
      ...h,
      completed: !!h.completed
    }));
    
    res.json(habitsWithStatus);
  } catch (err) {
    console.error('Erro ao listar hábitos:', err);
    res.status(500).json({ error: 'Erro ao obter hábitos.' });
  }
});

// Criar hábito
app.post('/api/habits', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Nome do hábito é obrigatório.' });
  }

  try {
    const result = await query.run('INSERT INTO habits (user_id, name) VALUES (?, ?)', [userId, name]);
    const newHabit = await query.get('SELECT * FROM habits WHERE id = ?', [result.id]);
    res.status(201).json({ ...newHabit, completed: false });
  } catch (err) {
    console.error('Erro ao criar hábito:', err);
    res.status(500).json({ error: 'Erro ao criar hábito.' });
  }
});

// Excluir hábito
app.delete('/api/habits/:id', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const habitId = req.params.id;

  try {
    // Validar propriedade
    const habit = await query.get('SELECT * FROM habits WHERE id = ? AND user_id = ?', [habitId, userId]);
    if (!habit) {
      return res.status(404).json({ error: 'Hábito não encontrado.' });
    }

    await query.run('DELETE FROM habits WHERE id = ?', [habitId]);
    res.json({ message: 'Hábito excluído com sucesso.' });
  } catch (err) {
    console.error('Erro ao excluir hábito:', err);
    res.status(500).json({ error: 'Erro ao excluir hábito.' });
  }
});

// Alternar status do hábito (Concluído / Pendente)
app.post('/api/habits/:id/toggle', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const habitId = req.params.id;
  const date = req.body.date || new Date().toISOString().split('T')[0];

  try {
    // Validar propriedade
    const habit = await query.get('SELECT * FROM habits WHERE id = ? AND user_id = ?', [habitId, userId]);
    if (!habit) {
      return res.status(404).json({ error: 'Hábito não encontrado.' });
    }

    const log = await query.get('SELECT * FROM habit_logs WHERE habit_id = ? AND date = ?', [habitId, date]);

    if (log) {
      // Se já existe, deleta (volta a ficar pendente)
      await query.run('DELETE FROM habit_logs WHERE id = ?', [log.id]);
      res.json({ completed: false });
    } else {
      // Se não existe, cria (marca como concluído)
      await query.run('INSERT INTO habit_logs (habit_id, date, completed) VALUES (?, ?, 1)', [habitId, date]);
      res.json({ completed: true });
    }
  } catch (err) {
    console.error('Erro ao alternar status do hábito:', err);
    res.status(500).json({ error: 'Erro ao alternar status do hábito.' });
  }
});

// === ROTAS DO BLOCO DE NOTAS ===

// Buscar bloco de notas
app.get('/api/notes', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    let note = await query.get('SELECT * FROM notes WHERE user_id = ?', [userId]);
    if (!note) {
      await query.run('INSERT INTO notes (user_id, content) VALUES (?, ?)', [userId, '']);
      note = { user_id: userId, content: '' };
    }
    res.json(note);
  } catch (err) {
    console.error('Erro ao buscar bloco de notas:', err);
    res.status(500).json({ error: 'Erro ao obter bloco de notas.' });
  }
});

// Atualizar bloco de notas
app.put('/api/notes', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { content } = req.body;

  try {
    await query.run(
      'UPDATE notes SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [content || '', userId]
    );
    res.json({ message: 'Notas salvas com sucesso!' });
  } catch (err) {
    console.error('Erro ao atualizar bloco de notas:', err);
    res.status(500).json({ error: 'Erro ao salvar notas.' });
  }
});

// === ROTA DO DASHBOARD ===

app.get('/api/dashboard', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    // 1. Total de tarefas ativas e concluídas
    const totalCountRow = await query.get(
      'SELECT COUNT(*) as total FROM tasks WHERE user_id = ?',
      [userId]
    );
    
    // 2. Concluídas hoje
    const completedTodayRow = await query.get(
      'SELECT COUNT(*) as completed_today FROM tasks WHERE user_id = ? AND completed = 1 AND completed_at = ?',
      [userId, todayStr]
    );

    // 3. Atrasadas (não concluídas e data limite menor que hoje)
    const overdueRow = await query.get(
      'SELECT COUNT(*) as overdue FROM tasks WHERE user_id = ? AND completed = 0 AND due_date < ?',
      [userId, todayStr]
    );

    // 4. Gráfico dos últimos 7 dias
    // Gerar lista dos últimos 7 dias locais
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split('T')[0]);
    }

    const productivity = [];
    for (const day of last7Days) {
      const row = await query.get(
        'SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND completed = 1 AND completed_at = ?',
        [userId, day]
      );
      // Formatando o dia para PT-BR
      const parts = day.split('-');
      const formattedDate = `${parts[2]}/${parts[1]}`;
      productivity.push({
        date: formattedDate,
        fullDate: day,
        completed: row.count || 0
      });
    }

    // 5. Total de tarefas por categoria (para dashboard visual)
    const categoryStats = await query.all(
      `SELECT category, COUNT(*) as count, SUM(completed) as completed_count 
       FROM tasks 
       WHERE user_id = ? 
       GROUP BY category`,
      [userId]
    );

    res.json({
      metrics: {
        total: totalCountRow.total || 0,
        completedToday: completedTodayRow.completed_today || 0,
        overdue: overdueRow.overdue || 0,
      },
      productivity,
      categoryStats
    });
  } catch (err) {
    console.error('Erro ao buscar dados do dashboard:', err);
    res.status(500).json({ error: 'Erro ao compilar dados do dashboard.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});
