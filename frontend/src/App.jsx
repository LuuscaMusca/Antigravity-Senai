import React, { useState, useEffect } from 'react';
import { LogOut, Sun, Moon, Sparkles } from 'lucide-react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';

const API_URL = 'http://localhost:5000';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [notesContent, setNotesContent] = useState('');
  const [dashboardData, setDashboardData] = useState({
    metrics: { total: 0, completedToday: 0, overdue: 0 },
    productivity: Array(7).fill(0).map((_, i) => ({ date: '', completed: 0 })),
    categoryStats: []
  });

  // Modal de tarefa
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  // Alerta global temporário
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });

  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
  };

  useEffect(() => {
    if (alert.show) {
      const timer = setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Aplicar tema
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLoginSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    showAlert(`Bem-vindo, ${newUser.name}!`, 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setTasks([]);
    setHabits([]);
    setNotesContent('');
    showAlert('Você saiu do sistema.', 'success');
  };

  // Função auxiliar para chamadas seguras e interceptação de expiração de token
  const authorizedFetch = async (url, options = {}) => {
    if (!token) return null;

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, { ...options, headers });
      if (response.status === 401 || response.status === 403) {
        // Limpar armazenamento e forçar logout
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken('');
        setUser(null);
        setTasks([]);
        setHabits([]);
        setNotesContent('');
        showAlert('Sua sessão expirou. Por favor, faça login novamente.', 'error');
        throw new Error('Sessão expirada');
      }
      return response;
    } catch (err) {
      if (err.message === 'Sessão expirada') {
        throw err;
      }
      console.error('Erro de conexão:', err);
      throw err;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setTasks([]);
    setHabits([]);
    setNotesContent('');
    showAlert('Você saiu do sistema.', 'success');
  };

  // Carregar dados iniciais do usuário
  const loadUserData = async () => {
    try {
      // 1. Carregar Tarefas
      const tasksRes = await authorizedFetch(`${API_URL}/api/tasks`);
      if (tasksRes && tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData);
      }

      // 2. Carregar Hábitos
      const habitsRes = await authorizedFetch(`${API_URL}/api/habits`);
      if (habitsRes && habitsRes.ok) {
        const habitsData = await habitsRes.json();
        setHabits(habitsData);
      }

      // 3. Carregar Notas
      const notesRes = await authorizedFetch(`${API_URL}/api/notes`);
      if (notesRes && notesRes.ok) {
        const notesData = await notesRes.json();
        setNotesContent(notesData.content || '');
      }

      // 4. Carregar Dados do Dashboard
      const dashRes = await authorizedFetch(`${API_URL}/api/dashboard`);
      if (dashRes && dashRes.ok) {
        const dashData = await dashRes.json();
        setDashboardData(dashData);
      }
    } catch (err) {
      if (err.message !== 'Sessão expirada') {
        console.error('Erro ao carregar dados do usuário:', err);
        showAlert('Erro ao sincronizar dados com o servidor.', 'error');
      }
    }
  };

  useEffect(() => {
    if (token) {
      loadUserData();
    }
  }, [token]);

  // Ações de Tarefa
  const handleSaveTask = async (taskData) => {
    try {
      if (taskData.id) {
        // Atualizar
        const res = await authorizedFetch(`${API_URL}/api/tasks/${taskData.id}`, {
          method: 'PUT',
          body: JSON.stringify(taskData)
        });

        if (res && !res.ok) throw new Error('Não foi possível atualizar a tarefa.');
        showAlert('Tarefa atualizada com sucesso!');
      } else {
        // Criar
        const res = await authorizedFetch(`${API_URL}/api/tasks`, {
          method: 'POST',
          body: JSON.stringify(taskData)
        });

        if (res && !res.ok) throw new Error('Não foi possível criar a tarefa.');
        showAlert('Tarefa criada com sucesso!');
      }

      // Recarregar tarefas e dados do dashboard
      loadUserData();
    } catch (err) {
      if (err.message !== 'Sessão expirada') {
        showAlert(err.message, 'error');
      }
    }
  };

  const handleToggleComplete = async (taskId, completed) => {
    try {
      const res = await authorizedFetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ completed })
      });

      if (res && !res.ok) throw new Error('Erro ao alterar status da tarefa.');
      loadUserData();
    } catch (err) {
      if (err.message !== 'Sessão expirada') {
        showAlert(err.message, 'error');
      }
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta tarefa?')) return;

    try {
      const res = await authorizedFetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (res && !res.ok) throw new Error('Erro ao excluir tarefa.');
      showAlert('Tarefa excluída.');
      loadUserData();
    } catch (err) {
      if (err.message !== 'Sessão expirada') {
        showAlert(err.message, 'error');
      }
    }
  };

  const handleEditTaskClick = (task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleAddTaskClick = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  // Ações de Hábito
  const handleAddHabit = async (name) => {
    try {
      const res = await authorizedFetch(`${API_URL}/api/habits`, {
        method: 'POST',
        body: JSON.stringify({ name })
      });

      if (res && !res.ok) throw new Error('Erro ao criar hábito.');
      showAlert('Hábito adicionado!');
      loadUserData();
    } catch (err) {
      if (err.message !== 'Sessão expirada') {
        showAlert(err.message, 'error');
      }
    }
  };

  const handleDeleteHabit = async (habitId) => {
    if (!window.confirm('Excluir este hábito permanentemente?')) return;

    try {
      const res = await authorizedFetch(`${API_URL}/api/habits/${habitId}`, {
        method: 'DELETE'
      });

      if (res && !res.ok) throw new Error('Erro ao excluir hábito.');
      showAlert('Hábito removido.');
      loadUserData();
    } catch (err) {
      if (err.message !== 'Sessão expirada') {
        showAlert(err.message, 'error');
      }
    }
  };

  const handleToggleHabit = async (habitId) => {
    try {
      const res = await authorizedFetch(`${API_URL}/api/habits/${habitId}/toggle`, {
        method: 'POST'
      });

      if (res && !res.ok) throw new Error('Erro ao atualizar hábito.');
      loadUserData();
    } catch (err) {
      if (err.message !== 'Sessão expirada') {
        showAlert(err.message, 'error');
      }
    }
  };

  // Bloco de Notas
  const handleSaveNotes = async (content) => {
    try {
      const res = await authorizedFetch(`${API_URL}/api/notes`, {
        method: 'PUT',
        body: JSON.stringify({ content })
      });

      if (res && !res.ok) throw new Error('Erro ao salvar notas.');
      // Atualizar o estado silenciosamente
      setNotesContent(content);
    } catch (err) {
      if (err.message !== 'Sessão expirada') {
        console.error('Erro ao salvar notas rápidas');
        throw err;
      }
    }
  };

  if (!token) {
    return <Auth onLoginSuccess={handleLoginSuccess} API_URL={API_URL} />;
  }

  return (
    <div className="app-container">
      {/* Barra de Navegação */}
      <header className="navbar">
        <div className="nav-brand">
          <Sparkles size={24} style={{ color: 'var(--primary)' }} />
          <span>LifePlanner</span>
        </div>

        <div className="nav-actions">
          <span className="user-welcome">Olá, {user?.name}</span>
          
          <button className="theme-toggle-btn" onClick={toggleTheme} title="Alternar tema">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          
          <button className="logout-btn" onClick={handleLogout} title="Sair do aplicativo">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="dashboard-content">
        {/* Painel do Dashboard (Esquerda) */}
        <Dashboard
          metrics={dashboardData.metrics}
          productivity={dashboardData.productivity}
          habits={habits}
          notes={notesContent}
          onAddHabit={handleAddHabit}
          onDeleteHabit={handleDeleteHabit}
          onToggleHabit={handleToggleHabit}
          onSaveNotes={handleSaveNotes}
          API_URL={API_URL}
        />

        {/* Lista de Tarefas (Direita) */}
        <TaskList
          tasks={tasks}
          onToggleComplete={handleToggleComplete}
          onEdit={handleEditTaskClick}
          onDelete={handleDeleteTask}
          onAddTaskClick={handleAddTaskClick}
        />
      </main>

      {/* Modal de Criação / Edição de Tarefas */}
      <TaskForm
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
      />

      {/* Alerta Notificação Global */}
      {alert.show && (
        <div className={`alert-notification alert-${alert.type}`}>
          {alert.message}
        </div>
      )}
    </div>
  );
}
