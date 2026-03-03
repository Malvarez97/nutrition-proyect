import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { professionalService } from '../../services/professional'
import { format } from 'date-fns'
import './AdminPatients.css'

export function AdminPatientsPage() {
  const { user } = useAuth()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('compliance_asc')
  const [editingNotes, setEditingNotes] = useState(null)
  const [notesValue, setNotesValue] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    professionalService
      .getPatients(user.id)
      .then(setPatients)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user?.id])

  const sorted = [...patients].sort((a, b) => {
    if (sortBy === 'compliance_asc') return a.compliance - b.compliance
    if (sortBy === 'compliance_desc') return b.compliance - a.compliance
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '')
    if (sortBy === 'weight_desc') return (b.weight || 0) - (a.weight || 0)
    return 0
  })

  const handleEditNotes = (p) => {
    setEditingNotes(p.id)
    setNotesValue(p.notes || '')
  }

  const handleSaveNotes = async () => {
    if (!editingNotes || !user?.id) return
    setSavingNotes(true)
    try {
      await professionalService.updatePatientNotes(user.id, editingNotes, notesValue)
      setPatients((prev) =>
        prev.map((p) =>
          p.id === editingNotes ? { ...p, notes: notesValue } : p
        )
      )
      setEditingNotes(null)
    } catch (e) {
      console.error(e)
    } finally {
      setSavingNotes(false)
    }
  }

  const statusLabel = (s) =>
    ({ activo: 'Activo', regular: 'Regular', bajo: 'Bajo' }[s] || s)

  if (loading) return <div className="admin-loading">Cargando pacientes...</div>

  if (patients.length === 0) {
    return (
      <div className="admin-empty">
        <h2>Sin pacientes</h2>
        <p>
          Creá un plan y asignalo a usuarios para que aparezcan aquí.
        </p>
        <Link to="/admin/planes" className="btn-primary">
          Ir a Planes
        </Link>
      </div>
    )
  }

  return (
    <div className="admin-patients">
      <header className="admin-page-header">
        <h1>Pacientes</h1>
        <div className="sort-control">
          <label>Ordenar por:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="compliance_asc">Menor cumplimiento primero</option>
            <option value="compliance_desc">Mayor cumplimiento primero</option>
            <option value="name">Nombre</option>
            <option value="weight_desc">Peso (mayor)</option>
          </select>
        </div>
      </header>

      <div className="patients-table-wrap">
        <table className="patients-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Edad</th>
              <th>Objetivo</th>
              <th>Peso actual</th>
              <th>Cumplimiento %</th>
              <th>Estado</th>
              <th>Notas</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link to={`/admin/pacientes/${p.id}`} className="patient-link">
                    {p.name || p.email || 'Sin nombre'}
                  </Link>
                </td>
                <td>{p.age ?? '–'}</td>
                <td>
                  {p.objective === 'weight_loss'
                    ? 'Pérdida peso'
                    : p.objective === 'muscle_gain'
                      ? 'Ganancia muscular'
                      : p.objective || '–'}
                </td>
                <td>{p.weight != null ? `${p.weight} kg` : '–'}</td>
                <td>
                  <span
                    className={`compliance compliance-${p.status}`}
                  >
                    {p.compliance}%
                  </span>
                </td>
                <td>{statusLabel(p.status)}</td>
                <td>
                  {editingNotes === p.id ? (
                    <div className="notes-edit">
                      <textarea
                        value={notesValue}
                        onChange={(e) => setNotesValue(e.target.value)}
                        rows={2}
                        placeholder="Notas internas..."
                      />
                      <div>
                        <button
                          onClick={handleSaveNotes}
                          disabled={savingNotes}
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingNotes(null)}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span
                      className="notes-preview"
                      onClick={() => handleEditNotes(p)}
                      title="Clic para editar"
                    >
                      {(p.notes || '–').slice(0, 30)}
                      {(p.notes || '').length > 30 && '…'}
                    </span>
                  )}
                </td>
                <td>
                  <Link to={`/admin/pacientes/${p.id}`} className="btn-link">
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
