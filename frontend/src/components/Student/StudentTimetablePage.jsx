import { useState, useEffect } from 'react';
import { api, PERIODS } from '../../services/api';
import { Edit2, Trash2, X, Plus, Calendar, Clock, MapPin, User } from 'lucide-react';

export default function StudentTimetablePage() {
  const [timetable, setTimetable] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalSlot, setModalSlot] = useState(null); // { dayOrder, period }
  const [selectedSubjectCode, setSelectedSubjectCode] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [ttData, subjData] = await Promise.all([
        api.getTimetable().catch(() => ({ timetable: {} })),
        api.getSubjects().catch(() => ({ subjects: [] })),
      ]);
      let subjList = subjData.subjects || [];
      if (subjList.length === 0) {
        subjList = [
          { subjectCode: 'CS501', subjectName: 'Cloud Computing & AWS', building: 'Main Block', roomNumber: 'Room 101' },
          { subjectCode: 'CS502', subjectName: 'Deep Learning & AI', building: 'Lab Block', roomNumber: 'Lab 3' },
          { subjectCode: 'CS503', subjectName: 'Distributed Systems', building: 'Tech Tower', roomNumber: 'Hall B' },
        ];
      }
      setTimetable(ttData.timetable || {});
      setSubjects(subjList);
    } catch (err) {
      console.error('Error loading timetable:', err);
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(dayOrder, period) {
    const existing = timetable[dayOrder]?.[period];
    setSelectedSubjectCode(existing ? existing.subjectCode : '');
    setModalSlot({ dayOrder, period });
  }

  async function handleSaveSlot(e) {
    e.preventDefault();
    if (!modalSlot) return;

    const subj = subjects.find(s => s.subjectCode === selectedSubjectCode);
    if (!subj) return;

    try {
      await api.setSlot({
        dayOrder: modalSlot.dayOrder,
        period: modalSlot.period,
        subjectCode: subj.subjectCode,
        subjectName: subj.subjectName,
        className: subj.className,
        section: subj.section,
        teacherName: subj.teacherName,
        building: subj.building,
        roomNumber: subj.roomNumber,
      });
      setModalSlot(null);
      loadData();
    } catch (err) {
      console.error('Save slot error:', err);
    }
  }

  async function handleClearSlot() {
    if (!modalSlot) return;
    try {
      await api.deleteSlot(modalSlot.dayOrder, modalSlot.period);
      setModalSlot(null);
      loadData();
    } catch (err) {
      console.error('Clear slot error:', err);
    }
  }

  const days = ['1', '2', '3', '4', '5'];
  const colorMap = {
    CS201: 'color-1',
    CS401: 'color-2',
    CS501: 'color-1',
    CS502: 'color-2',
    CS503: 'color-3',
    CS601: 'color-1',
    CS701: 'color-2',
    CS801: 'color-3',
    CS901: 'color-1',
  };

  if (loading) {
    return (
      <div className="page-enter" style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Personal Timetable</h1>
          <p className="page-subtitle">Editable Day Order 1 to 5 grid schedule (08:00 to 17:00). Tap any cell to edit swapped classes/rooms.</p>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div className="timetable-grid">
          {/* Header Row */}
          <div className="timetable-header">TIME</div>
          {days.map(d => (
            <div key={d} className="timetable-header">DAY ORDER {d}</div>
          ))}

          {/* Periods */}
          {PERIODS.map(p => (
            <div key={p.period} style={{ display: 'contents' }}>
              <div className="timetable-time">
                <div>
                  <div style={{ fontWeight: 700 }}>Period {p.period}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{p.start} - {p.end}</div>
                </div>
              </div>

              {days.map(d => {
                const slot = timetable[d]?.[String(p.period)];
                const colorClass = slot ? (colorMap[slot.subjectCode] || 'color-1') : '';
                return (
                  <div
                    key={d}
                    className="timetable-cell"
                    onClick={() => openEditModal(d, String(p.period))}
                  >
                    {slot ? (
                      <div className={`timetable-pill ${colorClass}`}>
                        <div className="timetable-pill-sub">{slot.subjectCode}</div>
                        <div className="timetable-pill-class">{slot.roomNumber || slot.subjectName}</div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>+ Edit</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Edit Slot Modal */}
      {modalSlot && (
        <div className="modal-overlay" onClick={() => setModalSlot(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                Edit Slot (Day Order {modalSlot.dayOrder}, Period {modalSlot.period})
              </h3>
              <button className="modal-close" onClick={() => setModalSlot(null)}><X size={16} /></button>
            </div>

            <form onSubmit={handleSaveSlot}>
              <div className="form-group">
                <label className="form-label">Select Subject / Class</label>
                <select
                  className="form-select"
                  value={selectedSubjectCode}
                  onChange={e => setSelectedSubjectCode(e.target.value)}
                  required
                >
                  <option value="">-- Choose Subject --</option>
                  {subjects.map(s => (
                    <option key={s.subjectCode} value={s.subjectCode}>
                      {s.subjectCode} - {s.subjectName} ({s.teacherName || ''} • {s.roomNumber || ''})
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
                <div>
                  {timetable[modalSlot.dayOrder]?.[modalSlot.period] && (
                    <button type="button" className="btn btn-danger btn-sm" onClick={handleClearSlot}>
                      <Trash2 size={14} /> Clear Slot
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setModalSlot(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Slot Change</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
