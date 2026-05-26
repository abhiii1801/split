import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGroup, calculateSettlements, getMember, addPayment, updatePayment, deletePayment } from '../utils/api';
import BottomNav from '../components/BottomNav';
import { ArrowRight, CheckCircle } from 'lucide-react';

export default function Settle() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [group, setGroup] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fromId: '', toId: '', amount: '', date: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const data = await getGroup(code);
        if (!data) {
          navigate('/');
        } else {
          setGroup(data);
          setTransactions(calculateSettlements(data));
        }
      } catch (err) {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [code, navigate]);

  if (loading) return <div className="page-content text-center mt-8 text-muted">Loading...</div>;
  if (!group) return null;

  return (
    <>
      <div className="page-content">
        <h1 className="text-xl font-bold mb-2">Settle Up</h1>
        <p className="text-sm text-muted mb-6">Suggested payments to minimize transactions</p>

        {transactions.length === 0 ? (
          <div className="text-center text-muted mt-8">
            <CheckCircle size={48} className="mx-auto mb-4 text-success opacity-80" style={{ display: 'block' }} />
            <p className="font-semibold text-lg">You're all settled up!</p>
            <p className="text-sm mt-2">No one owes anything.</p>
          </div>
        ) : (
          <div className="flex-col gap-4">
            {transactions.map((tx, idx) => {
              const fromName = getMember(group, tx.from)?.name || 'Unknown';
              const toName = getMember(group, tx.to)?.name || 'Unknown';
              return (
                <div key={idx} className="glass-card flex items-center justify-between">
                  <div className="flex-col">
                    <span className="font-semibold">{fromName}</span>
                    <span className="text-xs text-muted">owes</span>
                  </div>
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <ArrowRight size={16} />
                    <span>₹{tx.amount.toFixed(2)}</span>
                    <ArrowRight size={16} />
                  </div>
                  <div className="flex-col text-right">
                    <span className="font-semibold">{toName}</span>
                    <span className="text-xs text-muted">gets back</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Payments</h2>
            <button className="btn btn-sm" onClick={() => { setShowForm(s => !s); setEditingId(null); setForm({ fromId: '', toId: '', amount: '', date: '' }); }}>
              {showForm ? 'Close' : 'Add Payment'}
            </button>
          </div>

          {showForm && (
            <div className="glass-card p-3 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <select value={form.fromId} onChange={e => setForm({ ...form, fromId: e.target.value })}>
                  <option value="">Select payer</option>
                  {group.members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>

                <select value={form.toId} onChange={e => setForm({ ...form, toId: e.target.value })}>
                  <option value="">Select payee</option>
                  {group.members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>

                <input type="number" step="0.01" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="flex gap-2 mt-3">
                <button className="btn btn-primary" onClick={async () => {
                  if (!form.fromId || !form.toId || !form.amount) return;
                  try {
                    if (editingId) {
                      await updatePayment(code, editingId, { fromId: form.fromId, toId: form.toId, amount: parseFloat(form.amount), date: form.date });
                    } else {
                      await addPayment(code, { fromId: form.fromId, toId: form.toId, amount: parseFloat(form.amount), date: form.date });
                    }
                    const data = await getGroup(code);
                    setGroup(data);
                    setTransactions(calculateSettlements(data));
                    setShowForm(false);
                    setEditingId(null);
                    setForm({ fromId: '', toId: '', amount: '', date: '' });
                  } catch (err) {
                    // ignore for now
                  }
                }}>
                  {editingId ? 'Update' : 'Save'}
                </button>
                <button className="btn" onClick={() => { setShowForm(false); setEditingId(null); setForm({ fromId: '', toId: '', amount: '', date: '' }); }}>Cancel</button>
              </div>
            </div>
          )}

          <div className="flex-col gap-3">
            {(group.payments || []).map(p => {
              const fromName = getMember(group, p.fromId)?.name || 'Unknown';
              const toName = getMember(group, p.toId)?.name || 'Unknown';
              return (
                <div key={p.id} className="glass-card flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{fromName} → {toName}</div>
                    <div className="text-xs text-muted">₹{(p.amount || 0).toFixed(2)} • {new Date(p.date).toLocaleString()}</div>
                    {p.note && <div className="text-xs">{p.note}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn btn-ghost btn-sm" onClick={() => {
                      setEditingId(p.id);
                      setShowForm(true);
                      setForm({ fromId: p.fromId, toId: p.toId, amount: p.amount, date: p.date ? new Date(p.date).toISOString().slice(0,10) : '' });
                    }}>Edit</button>
                    <button className="btn btn-ghost btn-sm text-danger" onClick={async () => {
                      if (!window.confirm('Delete payment?')) return;
                      try {
                        await deletePayment(code, p.id);
                        const data = await getGroup(code);
                        setGroup(data);
                        setTransactions(calculateSettlements(data));
                      } catch (err) {}
                    }}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
