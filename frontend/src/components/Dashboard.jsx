import React, { useState, useEffect } from 'react';
import { CheckSquare, Calendar, AlertCircle, Plus, Trash2, Heart, StickyNote, BarChart3, Save } from 'lucide-react';

export default function Dashboard({
  metrics,
  productivity,
  habits,
  notes,
  onAddHabit,
  onDeleteHabit,
  onToggleHabit,
  onSaveNotes,
  API_URL
}) {
  // Estado local para controle do formulário de hábito
  const [newHabitName, setNewHabitName] = useState('');
  // Estado local para o bloco de notas
  const [localNotes, setLocalNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState(''); // '', 'Salvando...', 'Salvo!'

  useEffect(() => {
    if (notes !== undefined) {
      setLocalNotes(notes);
    }
  }, [notes]);

  // Efeito para salvamento automático (debounce de 1 segundo)
  useEffect(() => {
    if (localNotes === notes) return; // Evita salvar o valor inicial

    setSaveStatus('Salvando...');
    const timer = setTimeout(() => {
      onSaveNotes(localNotes)
        .then(() => setSaveStatus('Salvo!'))
        .catch(() => setSaveStatus('Erro ao salvar'));
    }, 1000);

    return () => clearTimeout(timer);
  }, [localNotes]);

  const handleHabitSubmit = (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    onAddHabit(newHabitName);
    setNewHabitName('');
  };

  // Calcular o valor máximo para dimensionamento dinâmico do gráfico SVG
  const maxCompleted = Math.max(...productivity.map((p) => p.completed), 1);
  const chartHeight = 80;
  const chartWidth = 240;

  return (
    <div className="sidebar">
      {/* Bloco do Painel Geral de Métricas */}
      <div className="glass-card">
        <h3 className="card-title">
          <BarChart3 size={18} /> Meu Resumo
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {/* Total */}
          <div className="metric-card metric-total">
            <div className="metric-icon">
              <CheckSquare size={20} />
            </div>
            <div className="metric-info">
              <span className="metric-value">{metrics.total}</span>
              <span className="metric-label">Tarefas Criadas</span>
            </div>
          </div>

          {/* Feitas Hoje */}
          <div className="metric-card metric-today">
            <div className="metric-icon">
              <Calendar size={20} />
            </div>
            <div className="metric-info">
              <span className="metric-value">{metrics.completedToday}</span>
              <span className="metric-label">Concluídas Hoje</span>
            </div>
          </div>

          {/* Atrasadas */}
          <div className="metric-card metric-overdue">
            <div className="metric-icon">
              <AlertCircle size={20} />
            </div>
            <div className="metric-info">
              <span className="metric-value">{metrics.overdue}</span>
              <span className="metric-label">Atrasadas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Produtividade SVG */}
      <div className="glass-card">
        <h3 className="card-title">
          <BarChart3 size={18} /> Histórico Semanal
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Tarefas concluídas nos últimos 7 dias
        </p>
        <div className="chart-container">
          <svg className="chart-svg" viewBox={`0 0 ${chartWidth} 110`}>
            {productivity.map((day, idx) => {
              const barWidth = 22;
              const spacing = 10;
              const x = idx * (barWidth + spacing) + 12;
              // Altura da barra proporcional (máx de 70px)
              const height = (day.completed / maxCompleted) * chartHeight;
              const y = chartHeight - height + 15;

              return (
                <g key={day.fullDate || idx}>
                  {/* Valor acima da barra */}
                  <text x={x + barWidth / 2} y={y - 4} className="chart-value">
                    {day.completed}
                  </text>
                  {/* Barra */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={height}
                    className="chart-bar"
                  />
                  {/* Data abaixo da barra */}
                  <text x={x + barWidth / 2} y={chartHeight + 28} className="chart-label">
                    {day.date}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Habit Tracker */}
      <div className="glass-card">
        <h3 className="card-title">
          <Heart size={18} style={{ color: 'var(--urgente)' }} /> Hábitos Diários
        </h3>
        <div className="habit-tracker">
          <form onSubmit={handleHabitSubmit} className="habit-form">
            <input
              type="text"
              className="habit-input"
              placeholder="Novo hábito... (ex: Beber Água)"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0.5rem 0.8rem' }}>
              <Plus size={16} />
            </button>
          </form>

          <div className="habit-list">
            {habits.length > 0 ? (
              habits.map((habit) => (
                <div key={habit.id} className="habit-item">
                  <span className="habit-name" title={habit.name}>{habit.name}</span>
                  <div className="habit-controls">
                    <div
                      className={`habit-checkbox ${habit.completed ? 'completed' : ''}`}
                      onClick={() => onToggleHabit(habit.id, habit.completed)}
                    />
                    <button className="habit-delete-btn" onClick={() => onDeleteHabit(habit.id)} title="Excluir hábito">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem 0' }}>
                Nenhum hábito cadastrado ainda.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Brain Dump / Bloco de Notas Rápidas */}
      <div className="glass-card">
        <h3 className="card-title">
          <StickyNote size={18} /> Notas Rápidas
        </h3>
        <div className="quick-notes">
          <textarea
            className="notes-textarea"
            placeholder="Escreva pensamentos rápidos, ideias ou rascunhos aqui..."
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
          />
          <div className="notes-footer">
            <span style={{ fontStyle: 'italic', color: saveStatus === 'Erro ao salvar' ? 'var(--urgente)' : 'var(--text-secondary)' }}>
              {saveStatus}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Save size={12} /> Autosalvamento ativo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
