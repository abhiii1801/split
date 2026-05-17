import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGroup, addExpense, updateExpense } from '../utils/api';
import BottomNav from '../components/BottomNav';
import { PlusCircle, Save } from 'lucide-react';

export default function AddExpense() {
  const { code, expenseId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loadingGroup, setLoadingGroup] = useState(true);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [payerId, setPayerId] = useState('');
  const [splitType, setSplitType] = useState('EQUAL'); 
  const [exactSplits, setExactSplits] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const data = await getGroup(code);
        if (!data) {
          navigate('/');
        } else {
          setGroup(data);
          
          // Prepopulate splits structure
          const initialSplits = {};
          data.members.forEach(m => initialSplits[m.id] = '');
          setExactSplits(initialSplits);

          if (expenseId) {
            const exp = data.expenses.find(e => e.id === expenseId);
            if (exp) {
              setTitle(exp.title);
              setAmount(exp.amount.toString());
              setCategory(exp.category);
              setPayerId(exp.payerId);
              setSplitType(exp.splitType);
              if (exp.splitType === 'EXACT') {
                const splitsObj = {};
                data.members.forEach(m => {
                  splitsObj[m.id] = exp.splits[m.id] !== undefined ? exp.splits[m.id].toString() : '';
                });
                setExactSplits(splitsObj);
              }
            }
          } else {
            if (data.members.length > 0) setPayerId(data.members[0].id);
          }
        }
      } catch (err) {
        navigate('/');
      } finally {
        setLoadingGroup(false);
      }
    };
    fetchGroup();
  }, [code, expenseId, navigate]);

  const handleExactSplitChange = (id, val) => {
    setExactSplits({ ...exactSplits, [id]: val });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !amount || !payerId) {
      setError('Please fill all required fields');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Invalid amount');
      return;
    }

    let splits = {};
    if (splitType === 'EQUAL') {
      const splitAmount = numAmount / group.members.length;
      group.members.forEach(m => splits[m.id] = splitAmount);
    } else {
      let totalExact = 0;
      for (const val of Object.values(exactSplits)) {
        totalExact += parseFloat(val || 0);
      }
      if (Math.abs(totalExact - numAmount) > 0.01) {
        setError(`Exact splits total (${totalExact}) must equal total amount (${numAmount})`);
        return;
      }
      for (const [id, val] of Object.entries(exactSplits)) {
        splits[id] = parseFloat(val || 0);
      }
    }

    setSaving(true);
    try {
      if (expenseId) {
        await updateExpense(code, expenseId, {
          title,
          amount: numAmount,
          category,
          payerId,
          splitType,
          splits
        });
      } else {
        await addExpense(code, {
          title,
          amount: numAmount,
          category,
          payerId,
          splitType,
          splits
        });
      }
      navigate(`/group/${code}`);
    } catch (err) {
      setError('Failed to save expense');
      setSaving(false);
    }
  };

  if (loadingGroup) return <div className="page-content text-center mt-8 text-muted">Loading...</div>;
  if (!group) return null;

  return (
    <>
      <div className="page-content">
        <h1 className="text-xl font-bold mb-6">{expenseId ? 'Edit Expense' : 'Add Expense'}</h1>
        
        {error && <div className="text-danger mb-4 text-sm bg-danger text-center p-2 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <label className="input-label">Description</label>
          <input 
            type="text" 
            className="input-field" 
            placeholder="What was this for?" 
            value={title} onChange={e => setTitle(e.target.value)} 
          />

          <label className="input-label">Amount</label>
          <input 
            type="number" 
            className="input-field" 
            placeholder="0.00" 
            step="0.01"
            value={amount} onChange={e => setAmount(e.target.value)} 
          />

          <div className="flex gap-4 mb-4">
            <div className="w-full">
              <label className="input-label">Category</label>
              <select className="input-field" value={category} onChange={e => setCategory(e.target.value)}>
                {(group.categories || ['Food', 'Travel', 'Accommodation', 'Entertainment', 'Other']).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <label className="input-label">Paid By</label>
              <select className="input-field" value={payerId} onChange={e => setPayerId(e.target.value)}>
                {group.members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <label className="input-label">Split Type</label>
          <div className="flex mb-4 gap-2">
            <button 
              type="button"
              className={`w-full py-2 font-semibold ${splitType === 'EQUAL' ? 'text-primary border-b-2 border-primary' : 'text-muted'}`}
              onClick={() => setSplitType('EQUAL')}
              style={{ borderBottom: splitType === 'EQUAL' ? '2px solid var(--primary)' : '2px solid transparent' }}
            >
              Equally
            </button>
            <button 
              type="button"
              className={`w-full py-2 font-semibold ${splitType === 'EXACT' ? 'text-primary border-b-2 border-primary' : 'text-muted'}`}
              onClick={() => setSplitType('EXACT')}
              style={{ borderBottom: splitType === 'EXACT' ? '2px solid var(--primary)' : '2px solid transparent' }}
            >
              Exact Amounts
            </button>
          </div>

          {splitType === 'EXACT' && (
            <div className="glass-card mb-4">
              <h3 className="text-sm font-semibold mb-2 text-muted">Enter exact amount for each person:</h3>
              {group.members.map(m => (
                <div key={m.id} className="flex justify-between items-center mb-2">
                  <span>{m.name}</span>
                  <input 
                    type="number" 
                    className="input-field mb-0" 
                    style={{ width: '120px', padding: '8px' }}
                    placeholder="0.00" 
                    value={exactSplits[m.id]} 
                    onChange={e => handleExactSplitChange(m.id, e.target.value)} 
                  />
                </div>
              ))}
            </div>
          )}

          <button type="submit" className="btn-primary mt-4" disabled={saving}>
            {expenseId ? <Save size={20} /> : <PlusCircle size={20} />} 
            {saving ? ' Saving...' : (expenseId ? ' Update Expense' : ' Save Expense')}
          </button>
        </form>
      </div>
      <BottomNav />
    </>
  );
}
