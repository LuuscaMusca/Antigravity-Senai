import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function TaskForm({ isOpen, onClose, onSave, taskToEdit }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medio');
  const [category, setCategory] = useState('geral');
  const [error, setError] = useState('');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setDueDate(taskToEdit.due_date || '');
      setPriority(taskToEdit.priority || 'medio');
      setCategory(taskToEdit.category || 'geral');
    } else {
      setTitle('');
      setDescription('');
      setDueDate('');
      setPriority('medio');
      setCategory('geral');
    }
    setError('');
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('O título da tarefa é obrigatório.');
      return;
    }
    onSave({
      id: taskToEdit ? taskToEdit.id : undefined,
      title,
      description,
      due_date: dueDate || null,
      priority,
      category
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{taskToEdit ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="alert-notification alert-error" style={{ position: 'static', margin: 0, animation: 'none' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="task-title">Título da Tarefa *</label>
            <input
              id="task-title"
              type="text"
              className="form-control"
              placeholder="Ex: Revisar relatório financeiro"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="task-desc">Descrição (Opcional)</label>
            <textarea
              id="task-desc"
              className="form-control"
              placeholder="Detalhes sobre o que precisa ser feito..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="task-date">Data Limite</label>
              <input
                id="task-date"
                type="date"
                className="form-control"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="task-category">Categoria</label>
              <select
                id="task-category"
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="geral">Geral</option>
                <option value="trabalho">Trabalho</option>
                <option value="casa">Casa</option>
                <option value="estudos">Estudos</option>
                <option value="saude">Saúde</option>
                <option value="financeiro">Financeiro</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Prioridade</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                className={`btn btn-secondary ${priority === 'baixa' ? 'tag-priority-baixa' : ''}`}
                style={{
                  padding: '0.6rem',
                  fontSize: '0.85rem',
                  borderColor: priority === 'baixa' ? 'var(--baixa)' : 'var(--border-color)',
                  opacity: priority === 'baixa' ? 1 : 0.6
                }}
                onClick={() => setPriority('baixa')}
              >
                Baixa
              </button>
              <button
                type="button"
                className={`btn btn-secondary ${priority === 'medio' ? 'tag-priority-medio' : ''}`}
                style={{
                  padding: '0.6rem',
                  fontSize: '0.85rem',
                  borderColor: priority === 'medio' ? 'var(--medio)' : 'var(--border-color)',
                  opacity: priority === 'medio' ? 1 : 0.6
                }}
                onClick={() => setPriority('medio')}
              >
                Média
              </button>
              <button
                type="button"
                className={`btn btn-secondary ${priority === 'urgente' ? 'tag-priority-urgente' : ''}`}
                style={{
                  padding: '0.6rem',
                  fontSize: '0.85rem',
                  borderColor: priority === 'urgente' ? 'var(--urgente)' : 'var(--border-color)',
                  opacity: priority === 'urgente' ? 1 : 0.6
                }}
                onClick={() => setPriority('urgente')}
              >
                Urgente
              </button>
            </div>
          </div>

          <div className="modal-footer" style={{ marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Salvar Tarefa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
