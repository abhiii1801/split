import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGroup, getMyGroups, addCategory, deleteCategory, removeMember } from '../utils/api';
import BottomNav from '../components/BottomNav';
import { User, Copy, Check, Tag, Trash2, Plus, UserX } from 'lucide-react';

export default function Info() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [copied, setCopied] = useState(false);
  const [myMemberId, setMyMemberId] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [newCategory, setNewCategory] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  
  const [memberToRemove, setMemberToRemove] = useState(null);

  const fetchGroup = async () => {
    try {
      const data = await getGroup(code);
      if (!data) {
        navigate('/');
      } else {
        setGroup(data);
        const myGroups = getMyGroups();
        const current = myGroups.find(g => g.code === code);
        if (current) setMyMemberId(current.memberId);
      }
    } catch (err) {
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroup();
  }, [code, navigate]);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setAddingCategory(true);
    try {
      await addCategory(code, newCategory.trim());
      setNewCategory('');
      fetchGroup();
    } catch (err) {
      alert('Failed to add category');
    } finally {
      setAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (catName) => {
    if (window.confirm(`Are you sure you want to delete the category "${catName}"?`)) {
      try {
        await deleteCategory(code, catName);
        fetchGroup();
      } catch (err) {
        alert('Failed to delete category');
      }
    }
  };

  const confirmRemove = async (memberId, type) => {
    const msg = type === 'hard' 
      ? 'This will permanently remove them from all past transactions and recalculate settlements. Are you absolutely sure?'
      : 'This will hide them from future transactions, but preserve their history. Proceed?';
      
    if (window.confirm(msg)) {
      try {
        await removeMember(code, memberId, type);
        setMemberToRemove(null);
        fetchGroup();
      } catch (err) {
        alert('Failed to remove member');
      }
    }
  };

  if (loading) return <div className="page-content text-center mt-8 text-muted">Loading...</div>;
  if (!group) return null;

  const categories = group.categories || ['Food', 'Travel', 'Accommodation', 'Entertainment', 'Other'];

  return (
    <>
      <div className="page-content">
        <h1 className="text-xl font-bold mb-6">Group Info</h1>

        <div className="glass-card mb-6 text-center">
          <p className="text-sm text-muted mb-2">Invite friends using this code</p>
          <div className="flex justify-center items-center gap-4">
            <span className="text-3xl font-bold text-primary tracking-widest">{code}</span>
            <button onClick={copyCode} className="p-2" style={{ background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
              {copied ? <Check size={20} className="text-success" /> : <Copy size={20} className="text-primary" />}
            </button>
          </div>
        </div>

        <h2 className="text-lg font-semibold mb-4">Members ({group.members.length})</h2>
        <div className="flex-col gap-2 mb-8">
          {group.members.map(m => (
            <div key={m.id} className="glass-card py-3" style={{ marginBottom: '8px' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div style={{ background: 'var(--primary)', padding: '10px', borderRadius: '50%', opacity: m.isActive === false ? 0.5 : 1 }}>
                    <User size={20} color="white" />
                  </div>
                  <div>
                    <p className="font-semibold" style={{ opacity: m.isActive === false ? 0.5 : 1 }}>
                      {m.name} {m.id === myMemberId && <span className="text-xs text-primary ml-2">(You)</span>}
                      {m.isActive === false && <span className="text-xs text-danger ml-2">(Inactive)</span>}
                    </p>
                    <p className="text-xs text-muted">Joined: {new Date(m.joinedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                {m.id !== myMemberId && (
                  <button 
                    onClick={() => setMemberToRemove(memberToRemove === m.id ? null : m.id)}
                    className="p-2 text-muted hover:text-danger rounded-lg transition-colors"
                  >
                    <UserX size={18} />
                  </button>
                )}
              </div>
              
              {memberToRemove === m.id && (
                <div className="flex-col gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="text-xs font-semibold text-muted mb-1">Remove {m.name}?</p>
                  <button 
                    onClick={() => confirmRemove(m.id, 'soft')} 
                    className="btn-secondary w-full text-sm py-2 mb-2"
                  >
                    Remove from future only (Keep history)
                  </button>
                  <button 
                    onClick={() => confirmRemove(m.id, 'hard')} 
                    className="btn-tertiary text-danger w-full text-sm py-2"
                    style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}
                  >
                    Completely remove (Delete past data)
                  </button>
                  <button 
                    onClick={() => setMemberToRemove(null)} 
                    className="w-full text-xs text-muted mt-2"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <h2 className="text-lg font-semibold mb-4">Manage Categories</h2>
        <div className="glass-card flex-col gap-3">
          <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
            <input 
              type="text" 
              className="input-field mb-0" 
              style={{ padding: '10px' }}
              placeholder="New Category..." 
              value={newCategory} 
              onChange={e => setNewCategory(e.target.value)} 
            />
            <button type="submit" disabled={addingCategory} className="btn-primary" style={{ width: 'auto', padding: '10px 16px' }}>
              <Plus size={18} />
            </button>
          </form>

          <div className="flex flex-col gap-2">
            {categories.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-primary" />
                  <span className="font-medium text-sm">{cat}</span>
                </div>
                <button 
                  onClick={() => handleDeleteCategory(cat)} 
                  className="text-muted hover:text-danger p-1 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
      <BottomNav />
    </>
  );
}
