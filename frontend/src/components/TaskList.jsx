import React, { useState } from 'react';
import { Plus, Search, Filter, CheckCircle2 } from 'lucide-react';
import TaskCard from './TaskCard';

export default function TaskList({ tasks, onToggleComplete, onEdit, onDelete, onAddTaskClick }) {
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending'); // Padrão: mostrar pendentes primeiro
  const [dateFilter, setDateFilter] = useState('');

  const filteredTasks = tasks.filter((task) => {
    // Busca por título ou descrição
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(search.toLowerCase()));

    // Filtro de prioridade
    const matchesPriority = priorityFilter === '' || task.priority === priorityFilter;

    // Filtro de categoria
    const matchesCategory = categoryFilter === '' || task.category === categoryFilter;

    // Filtro de status
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && !task.completed) ||
      (statusFilter === 'completed' && task.completed);

    // Filtro de data limite
    const matchesDate = dateFilter === '' || task.due_date === dateFilter;

    return matchesSearch && matchesPriority && matchesCategory && matchesStatus && matchesDate;
  });

  return (
    <div className="tasks-panel">
      <div className="panel-header">
        <h2 className="panel-title">Minhas Tarefas</h2>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={onAddTaskClick}>
          <Plus size={18} /> Nova Tarefa
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar tarefas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          title="Filtro de Status"
        >
          <option value="pending">Pendentes</option>
          <option value="completed">Concluídas</option>
          <option value="all">Todas as Tarefas</option>
        </select>

        <select
          className="filter-select"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          title="Filtro de Prioridade"
        >
          <option value="">Todas Prioridades</option>
          <option value="urgente">Urgente</option>
          <option value="medio">Média</option>
          <option value="baixa">Baixa</option>
        </select>

        <select
          className="filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          title="Filtro de Categoria"
        >
          <option value="">Todas Categorias</option>
          <option value="geral">Geral</option>
          <option value="trabalho">Trabalho</option>
          <option value="casa">Casa</option>
          <option value="estudos">Estudos</option>
          <option value="saude">Saúde</option>
          <option value="financeiro">Financeiro</option>
        </select>

        <input
          type="date"
          className="filter-select"
          style={{ width: 'auto' }}
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          title="Filtrar por data limite"
        />

        {(search || priorityFilter || categoryFilter || statusFilter !== 'pending' || dateFilter) && (
          <button
            className="btn btn-secondary"
            style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
            onClick={() => {
              setSearch('');
              setPriorityFilter('');
              setCategoryFilter('');
              setStatusFilter('pending');
              setDateFilter('');
            }}
          >
            Limpar Filtros
          </button>
        )}
      </div>

      <div className="tasks-list">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        ) : (
          <div className="empty-state glass-card">
            <CheckCircle2 size={40} className="empty-state-icon" style={{ color: 'var(--text-secondary)' }} />
            <h3>Nenhuma tarefa encontrada</h3>
            <p>Não há tarefas que correspondam aos filtros selecionados. Crie uma nova tarefa para começar!</p>
          </div>
        )}
      </div>
    </div>
  );
}
