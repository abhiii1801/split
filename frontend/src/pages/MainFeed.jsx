import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getGroup, deleteExpense } from '../utils/api';
import BottomNav from '../components/BottomNav';
import { 
  Receipt, Clock, Tag, Edit2, Trash2, Copy, Check, Plus, 
  Users, Compass, Home, Film, Sparkles, Coffee, Calendar, ChevronDown, Filter
} from 'lucide-react';

const CATEGORY_COLORS = {
  Food: { bg: '#fef3c7', text: '#d97706', icon: Coffee },
  Travel: { bg: '#e0f2fe', text: '#0284c7', icon: Compass },
  Accommodation: { bg: '#ecfdf5', text: '#059669', icon: Home },
  Entertainment: { bg: '#f3e8ff', text: '#7c3aed', icon: Film },
  Other: { bg: '#f1f5f9', text: '#475569', icon: Sparkles }
};

export default function MainFeed() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  // Filters and Sort State
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState('Today');
  const [sortOrder, setSortOrder] = useState('Newest First');
  
  const [showFilters, setShowFilters] = useState(false);
  // Custom Month specific
  const [customMonth, setCustomMonth] = useState('');

  const fetchGroup = async () => {
    try {
      const data = await getGroup(code);
      if (!data) {
        navigate('/');
      } else {
        setGroup(data);
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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(code, expenseId);
        fetchGroup();
      } catch (err) {
        alert('Failed to delete expense');
      }
    }
  };

  if (loading) return <div className="page-content text-center mt-8 text-muted">Loading...</div>;
  if (!group) return <div className="page-content text-center mt-8 text-danger">Error loading group</div>;

  
  // Dynamic Categories from Group or default
  const groupCategories = group.categories || ['Food', 'Travel', 'Accommodation', 'Entertainment', 'Other'];
  const categoriesList = ['All', ...groupCategories];

  // Date Filtering Logic
  const getFilteredExpenses = () => {
    let result = group.expenses;

    // 1. Category Filter
    if (categoryFilter !== 'All') {
      result = result.filter(e => e.category === categoryFilter);
    }

    // 2. Time Filter
    const now = new Date();
    if (timeFilter === 'Today') {
      result = result.filter(e => {
        const d = new Date(e.date);
        return d.toDateString() === now.toDateString();
      });
    } else if (timeFilter === 'This Week') {
      // rough this week
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter(e => new Date(e.date) >= oneWeekAgo);
    } else if (timeFilter === 'This Month') {
      result = result.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (timeFilter === 'Last Month') {
      const lastMonthDate = new Date();
      lastMonthDate.setMonth(now.getMonth() - 1);
      result = result.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear();
      });
    } else if (timeFilter === 'Custom Month' && customMonth) {
      // customMonth is yyyy-mm
      const [y, m] = customMonth.split('-');
      result = result.filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === parseInt(y) && d.getMonth() === (parseInt(m) - 1);
      });
    }

    // 3. Sort Order
    result = result.sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      if (sortOrder === 'Newest First') return timeB - timeA;
      return timeA - timeB; // Oldest First
    });

    return result;
  };

  const filteredExpenses = getFilteredExpenses();
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

  return (
    <>
      <div className="page-content" style={{ padding: '24px 20px 100px 20px' }}>
        
        {/* Modern Dashboard Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Dashboard</span>
            <h1 className="text-2xl font-bold" style={{ letterSpacing: '-0.5px' }}>{group.name}</h1>
          </div>
          
          <button 
            onClick={handleCopyCode} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border"
            style={{ 
              backgroundColor: 'var(--bg-card)', 
              borderColor: 'var(--border)', 
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <span>Code: <strong className="text-main">{code}</strong></span>
            {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
          </button>
        </div>

        {/* Premium Fintech Total Card */}
        <div className="mb-6" style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative bubbles */}
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', bottom: '-30px', left: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.8)' }}>Total Group Spend</p>
          <h2 className="text-3xl font-extrabold mt-1" style={{ letterSpacing: '-1px', color: '#ffffff' }}>₹{totalExpenses.toFixed(2)}</h2>

          <div className="flex gap-4 mt-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            <div className="flex items-center gap-2">
              <div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px', borderRadius: '8px' }}>
                <Users size={16} color="#ffffff" />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>Members</p>
                <p className="text-sm font-semibold" style={{ color: '#ffffff' }}>{group.members.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px', borderRadius: '8px' }}>
                <Receipt size={16} color="#ffffff" />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>Transactions</p>
                <p className="text-sm font-semibold" style={{ color: '#ffffff' }}>{group.expenses.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Horizontal Scroll */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Categories</p>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 pt-1" style={{ scrollbarWidth: 'none', margin: '0 -4px', padding: '4px' }}>
            {categoriesList.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className="px-5 py-2.5 rounded-full font-semibold transition-all"
                style={{
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  backgroundColor: categoryFilter === cat ? 'var(--primary)' : 'var(--bg-card)',
                  color: categoryFilter === cat ? '#ffffff' : 'var(--text-main)',
                  border: `1px solid ${categoryFilter === cat ? 'var(--primary)' : 'var(--border)'}`,
                  boxShadow: categoryFilter === cat ? '0 4px 12px rgba(59, 130, 246, 0.3)' : '0 2px 4px rgba(0,0,0,0.02)',
                  transform: categoryFilter === cat ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Activities Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg" style={{ letterSpacing: '-0.3px' }}>Activities</h2>
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ 
              backgroundColor: showFilters ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-card)', 
              border: `1px solid ${showFilters ? 'var(--primary)' : 'var(--border)'}`,
              color: showFilters ? 'var(--primary)' : 'var(--text-muted)',
              transition: 'all 0.2s'
            }}
          >
            <Filter size={12} />
            Filter & Sort {timeFilter !== 'All Time' && `(${timeFilter})`}
          </button>
        </div>

        {/* Collapsible Filter Panel */}
        {showFilters && (
          <div className="mb-6 glass-card" style={{ padding: '16px', animation: 'fadeIn 0.2s ease-in-out' }}>
            <div className="flex-col gap-4">
              <div>
                <label className="input-label">Sort Order</label>
                <div className="flex gap-2">
                  <button onClick={() => setSortOrder('Newest First')} className={`px-4 py-2 rounded-lg text-xs font-medium w-full`} style={{ backgroundColor: sortOrder === 'Newest First' ? '#eff6ff' : '#f1f5f9', border: sortOrder === 'Newest First' ? '1px solid #bfdbfe' : '1px solid transparent', color: sortOrder === 'Newest First' ? 'var(--primary)' : 'var(--text-muted)' }}>Newest First</button>
                  <button onClick={() => setSortOrder('Oldest First')} className={`px-4 py-2 rounded-lg text-xs font-medium w-full`} style={{ backgroundColor: sortOrder === 'Oldest First' ? '#eff6ff' : '#f1f5f9', border: sortOrder === 'Oldest First' ? '1px solid #bfdbfe' : '1px solid transparent', color: sortOrder === 'Oldest First' ? 'var(--primary)' : 'var(--text-muted)' }}>Oldest First</button>
                </div>
              </div>
              
              <div style={{ marginTop: '12px' }}>
                <label className="input-label">Time Frame</label>
                <select className="input-field mb-2" value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
                  <option value="All Time">All Time</option>
                  <option value="Today">Today</option>
                  <option value="This Week">This Week</option>
                  <option value="This Month">This Month</option>
                  <option value="Last Month">Last Month</option>
                  <option value="Custom Month">Custom Month</option>
                </select>
                
                {timeFilter === 'Custom Month' && (
                  <input 
                    type="month" 
                    className="input-field mb-0" 
                    value={customMonth} 
                    onChange={e => setCustomMonth(e.target.value)} 
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Expenses List */}
        {filteredExpenses.length === 0 ? (
          <div className="text-center text-muted mt-4 py-10 glass-card">
            <Receipt size={40} className="mx-auto mb-3 opacity-30" style={{ display: 'block' }} />
            <p className="font-semibold text-sm">No transactions found</p>
            <p className="text-xs mt-1">Try adjusting your filters or add a new expense.</p>
          </div>
        ) : (
          <div className="flex-col gap-3">
            {filteredExpenses.map((exp) => {
              const payer = group.members.find(m => m.id === exp.payerId)?.name || 'Unknown';
              const catConfig = CATEGORY_COLORS[exp.category] || { bg: '#f1f5f9', text: '#475569', icon: Sparkles };
              const CatIcon = catConfig.icon;

              return (
                <div key={exp.id} className="glass-card" style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  position: 'relative',
                  marginBottom: '12px'
                }}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      {/* Modern Round Icon */}
                      <div style={{
                        backgroundColor: catConfig.bg,
                        color: catConfig.text,
                        padding: '10px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <CatIcon size={20} />
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>{exp.title}</h3>
                        <p className="text-xs text-muted mt-0.5">{new Date(exp.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>

                    <span className="font-extrabold text-base text-main">₹{parseFloat(exp.amount).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center pt-3" style={{
                    borderTop: '1px solid var(--border)',
                    fontSize: '12px'
                  }}>
                    <span className="text-muted">
                      Paid by <strong className="text-main" style={{ color: 'var(--text-main)' }}>{payer}</strong> 
                      <span className="text-muted font-normal"> · {exp.splitType === 'EQUAL' ? 'Split equally' : 'Custom'}</span>
                    </span>

                    {/* Actions: Edit & Delete */}
                    <div className="flex gap-2">
                      <Link 
                        to={`/group/${code}/edit/${exp.id}`} 
                        className="p-1.5 rounded-lg text-muted hover:text-primary transition-colors"
                        style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)' }}
                      >
                        <Edit2 size={12} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(exp.id)}
                        className="p-1.5 rounded-lg text-muted hover:text-danger transition-colors"
                        style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </>
  );
}
