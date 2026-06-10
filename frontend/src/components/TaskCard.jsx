import React from 'react';
import { Edit2, Trash2, Calendar, AlertTriangle } from 'lucide-react';

export default function TaskCard({ task, onToggleComplete, onEdit, onDelete }) {
  const isOverdue = () => {
    if (task.completed || !task.due_date) return false;
    const today = new Date().toISOString().split('T')[0];
    return task.due_date < today;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className={`task-card priority-${task.priority} ${task.completed ? 'completed' : ''}`}>
      <div className="task-checkbox-wrapper">
        <input
          type="checkbox"
          className="task-checkbox"
          checked={!!task.completed}
          onChange={() => onToggleComplete(task.id, !task.completed)}
        />
      </div>

      <div className="task-body">
        <div className="task-title">{task.title}</div>
        {task.description && <p className="task-desc">{task.description}</p>}
        
        <div className="task-meta">
          <span className="task-tag tag-category">{task.category}</span>
          <span className={`task-tag tag-priority-${task.priority}`}>{task.priority}</span>
          
          {task.due_date && (
            <span className={`task-date ${isOverdue() ? 'overdue' : ''}`}>
              {isOverdue() ? <AlertTriangle size={12} /> : <Calendar size={12} />}
              {formatDate(task.due_date)}
              {isOverdue() && ' (Atrasada)'}
            </span>
          )}
        </div>
      </div>

      <div className="task-actions">
        <button className="task-action-btn" onClick={() => onEdit(task)} title="Editar Tarefa">
          <Edit2 size={14} />
        </button>
        <button className="task-action-btn delete" onClick={() => onDelete(task.id)} title="Excluir Tarefa">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
