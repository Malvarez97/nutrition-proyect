import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { plansService } from '../../services/plans'
import { professionalService } from '../../services/professional'
import './AdminPlans.css'

export function AdminPlansPage() {
  const { user } = useAuth()
  const [plans, setPlans] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [assignModal, setAssignModal] = useState(null)
  const [newTitle, setNewTitle] = useState('')
  const [newVersion, setNewVersion] = useState('1.0')
  const [selectedUser, setSelectedUser] = useState('')
  const [creating, setCreating] = useState(false)
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      plansService.getByProfessional(user.id),
      professionalService.getUsersForAssignment(user.id)
    ])
      .then(([plansData, usersData]) => {
        setPlans(plansData)
        setUsers(usersData)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user?.id])

  const loadAssignments = async (planId) => {
    const data = await plansService.getAssignments(planId)
    setAssignModal((prev) => (prev?.id === planId ? { ...prev, assignments: data } : prev))
  }

  const handleCreatePlan = async (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const plan = await plansService.create(user.id, newTitle.trim(), newVersion)
      setPlans((prev) => [plan, ...prev])
      setModal(false)
      setNewTitle('')
      setNewVersion('1.0')
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  const handleAssign = async () => {
    if (!assignModal || !selectedUser) return
    setAssigning(true)
    try {
      await plansService.assignUser(assignModal.id, selectedUser)
      await loadAssignments(assignModal.id)
      setSelectedUser('')
    } catch (err) {
      console.error(err)
    } finally {
      setAssigning(false)
    }
  }

  const handleUnassign = async (planId, userId) => {
    try {
      await plansService.unassignUser(planId, userId)
      await loadAssignments(planId)
    } catch (err) {
      console.error(err)
    }
  }

  const handleUpdateVersion = async (planId) => {
    const newVer = prompt('Nueva versión (ej: 1.1):')
    if (!newVer) return
    try {
      const updated = await plansService.updateVersion(planId, newVer)
      setPlans((prev) => prev.map((p) => (p.id === planId ? updated : p)))
    } catch (err) {
      console.error(err)
    }
  }

  const assignedIds = new Set((assignModal?.assignments || []).map((a) => a.user_id))
  const availableUsers = users.filter((u) => !assignedIds.has(u.id))

  if (loading) return <div className="admin-loading">Cargando planes...</div>

  return (
    <div className="admin-plans">
      <header className="admin-page-header">
        <h1>Planes</h1>
        <button className="btn-primary" onClick={() => setModal(true)}>
          + Crear plan
        </button>
      </header>

      <div className="plans-list">
        {plans.map((plan) => (
          <div key={plan.id} className="plan-card">
            <div className="plan-header">
              <h3>{plan.title}</h3>
              <span className="plan-version">v{plan.version}</span>
              <button
                className="btn-version"
                onClick={() => handleUpdateVersion(plan.id)}
                title="Cambiar versión"
              >
                Versión
              </button>
            </div>
            <div className="plan-actions">
              <button
                className="btn-assign"
                onClick={async () => {
                  const assignments = await plansService.getAssignments(plan.id)
                  setAssignModal({ ...plan, assignments })
                  setSelectedUser('')
                }}
              >
                Asignar paciente
              </button>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="admin-empty">
          <p>Creá tu primer plan para asignar a pacientes.</p>
          <button className="btn-primary" onClick={() => setModal(true)}>
            Crear plan
          </button>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Nuevo plan</h2>
            <form onSubmit={handleCreatePlan}>
              <div className="form-group">
                <label>Título</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej: Plan pérdida de peso"
                  required
                />
              </div>
              <div className="form-group">
                <label>Versión</label>
                <input
                  type="text"
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  placeholder="1.0"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setModal(false)}>
                  Cancelar
                </button>
                <button type="submit" disabled={creating}>
                  {creating ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {assignModal && (
        <div className="modal-overlay" onClick={() => setAssignModal(null)}>
          <div className="modal-content assign-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Asignar a {assignModal.title}</h2>

            <div className="form-group">
              <label>Añadir paciente</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                disabled={availableUsers.length === 0}
              >
                <option value="">
                  {availableUsers.length === 0
                    ? 'Todos asignados'
                    : 'Seleccionar...'}
                </option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email} {u.email ? `(${u.email})` : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAssign}
                disabled={!selectedUser || assigning}
              >
                Asignar
              </button>
            </div>

            <div className="assignments-list">
              <strong>Pacientes asignados:</strong>
              {(assignModal.assignments || []).map((a) => (
                <div key={a.user_id} className="assignment-row">
                  <span>{a.profiles?.name || a.profiles?.email || 'Usuario'}</span>
                  <button
                    className="btn-unassign"
                    onClick={() => handleUnassign(assignModal.id, a.user_id)}
                  >
                    Quitar
                  </button>
                </div>
              ))}
              {(!assignModal.assignments || assignModal.assignments.length === 0) && (
                <p className="no-data">Sin asignaciones</p>
              )}
            </div>

            <button
              className="btn-close"
              onClick={() => setAssignModal(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
