import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGroup, getGroup, joinGroupLocal, getMyGroups, addMember, removeGroupLocal } from '../utils/api';
import { Plus, LogIn, Users, Trash2 } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('join');
  const [groupName, setGroupName] = useState('');
  const [userName, setUserName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [groupToJoin, setGroupToJoin] = useState(null);
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const [myGroups, setMyGroups] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadGroups = () => {
    setMyGroups(getMyGroups());
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!groupName || !userName) {
      setError('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const { code } = await createGroup(groupName);
      const { memberId } = await addMember(code, userName);
      joinGroupLocal(code, memberId);
      navigate(`/group/${code}`);
    } catch (err) {
      setError(err.message || 'Error creating group');
      setLoading(false);
    }
  };

  const handleFindGroup = async (e) => {
    e.preventDefault();
    if (!joinCode) {
      setError('Please enter a group code');
      return;
    }
    setLoading(true);
    try {
      const group = await getGroup(joinCode);
      if (!group) {
        setError('Group not found');
        setLoading(false);
        return;
      }
      setGroupToJoin(group);
      setError('');
    } catch (err) {
      setError('Error finding group');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinAsMember = (memberId) => {
    joinGroupLocal(joinCode, memberId, dontAskAgain);
    navigate(`/group/${joinCode}`);
  };

  const handleJoinAsNew = async () => {
    if (!joinName.trim()) {
      setError('Please enter your name');
      return;
    }
    setLoading(true);
    try {
      const res = await addMember(joinCode, joinName.trim());
      joinGroupLocal(joinCode, res.memberId, dontAskAgain);
      navigate(`/group/${joinCode}`);
    } catch (err) {
      setError('Error adding member');
      setLoading(false);
    }
  };

  const handleRemoveGroup = (e, code) => {
    e.stopPropagation();
    if (window.confirm('Remove this group from your recent list? (Does not delete the group data)')) {
      removeGroupLocal(code);
      loadGroups();
    }
  };

  const openGroup = async (g) => {
    if (g.dontAskAgain) {
      navigate(`/group/${g.code}`);
    } else {
      setJoinCode(g.code);
      setActiveTab('join');
      setDontAskAgain(false);
      setLoading(true);
      try {
        const group = await getGroup(g.code);
        if (group) {
          setGroupToJoin(group);
        } else {
          setError('Group not found');
        }
      } catch (err) {
        setError('Error finding group');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh', paddingBottom: '20px' }}>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2 text-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Users size={32} /> Split App
        </h1>
        <p className="text-muted">Settle expenses with friends easily.</p>
      </div>

      <div className="glass-card mb-8">
        <div className="flex mb-4 gap-2">
          <button 
            className={`w-full py-2 font-semibold ${activeTab === 'join' ? 'text-primary border-b-2 border-primary' : 'text-muted'}`}
            onClick={() => { setActiveTab('join'); setError(''); setGroupToJoin(null); }}
            style={{ borderBottom: activeTab === 'join' ? '2px solid var(--primary)' : '2px solid transparent' }}
          >
            Join Group
          </button>
          <button 
            className={`w-full py-2 font-semibold ${activeTab === 'create' ? 'text-primary border-b-2 border-primary' : 'text-muted'}`}
            onClick={() => { setActiveTab('create'); setError(''); }}
            style={{ borderBottom: activeTab === 'create' ? '2px solid var(--primary)' : '2px solid transparent' }}
          >
            Create Group
          </button>
        </div>

        {error && <p className="text-danger text-sm text-center mb-4">{error}</p>}

        {activeTab === 'join' ? (
          !groupToJoin ? (
            <form onSubmit={handleFindGroup} className="flex-col">
              <label className="input-label">6-Digit Group Code</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. 123456" 
                value={joinCode} 
                onChange={(e) => setJoinCode(e.target.value)}
                maxLength={6}
              />
              <button type="submit" className="btn-primary mt-4" disabled={loading}>
                <LogIn size={20} /> {loading ? 'Finding...' : 'Find Group'}
              </button>
            </form>
          ) : (
            <div className="flex-col gap-3">
              <h3 className="font-semibold text-center mb-4">Join <span className="text-primary">{groupToJoin.name}</span> as:</h3>
              <div className="flex-col gap-2 max-h-60 overflow-y-auto pr-2">
                {groupToJoin.members.filter(m => m.isActive !== false).map(m => (
                  <button 
                    key={m.id} 
                    className="btn-secondary w-full justify-start py-3"
                    onClick={() => handleJoinAsMember(m.id)}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-2 my-2">
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
                <div className="text-xs text-muted font-semibold uppercase">OR</div>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
              </div>

              <input 
                type="text" 
                className="input-field mb-0" 
                placeholder="New member name" 
                value={joinName} 
                onChange={(e) => setJoinName(e.target.value)}
              />
              <label className="flex items-center gap-2 mt-4 mb-6 text-sm text-muted px-1">
                <input 
                  type="checkbox" 
                  checked={dontAskAgain} 
                  onChange={e => setDontAskAgain(e.target.checked)} 
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                Don't ask me again for this group
              </label>

              <button 
                className="btn-primary w-full" 
                onClick={handleJoinAsNew}
                disabled={loading}
              >
                <Plus size={20} /> Join as New Member
              </button>
              <button 
                className="btn-secondary w-full mt-2 text-sm text-muted border-transparent bg-transparent hover:bg-black/5" 
                onClick={() => setGroupToJoin(null)}
              >
                Cancel
              </button>
            </div>
          )
        ) : (
          <form onSubmit={handleCreate} className="flex-col">
            <label className="input-label">Group Name</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. Goa Trip" 
              value={groupName} 
              onChange={(e) => setGroupName(e.target.value)}
            />
            <label className="input-label">Your Name</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Enter your name" 
              value={userName} 
              onChange={(e) => setUserName(e.target.value)}
            />
            <button type="submit" className="btn-primary mt-4" disabled={loading}>
              <Plus size={20} /> {loading ? 'Creating...' : 'Create Group'}
            </button>
          </form>
        )}
      </div>

      {myGroups.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4">Recent Groups</h2>
          {myGroups.map((g, i) => {
            return (
              <div key={i} className="glass-card flex items-center justify-between mb-2" onClick={() => openGroup(g)} style={{ cursor: 'pointer' }}>
                <div>
                  <h3 className="font-semibold text-primary">Code: {g.code}</h3>
                  <p className="text-xs text-muted">Joined: {new Date(g.joinedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="btn-secondary" style={{ width: 'auto', padding: '8px 12px' }}>
                    Open
                  </div>
                  <button 
                    onClick={(e) => handleRemoveGroup(e, g.code)}
                    className="p-2 text-muted hover:text-danger rounded-lg transition-colors"
                    style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)' }}
                    title="Remove from recent"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
