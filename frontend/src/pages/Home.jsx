import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGroup, getGroup, joinGroupLocal, getMyGroups, addMember } from '../utils/api';
import { Plus, LogIn, Users } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('join');
  const [groupName, setGroupName] = useState('');
  const [userName, setUserName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [myGroups, setMyGroups] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMyGroups(getMyGroups());
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

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode || !joinName) {
      setError('Please fill all fields');
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
      
      let member = group.members.find(m => m.name.toLowerCase() === joinName.toLowerCase());
      let memberId;
      if (member) {
        memberId = member.id;
      } else {
        const res = await addMember(joinCode, joinName);
        memberId = res.memberId;
      }

      joinGroupLocal(joinCode, memberId);
      navigate(`/group/${joinCode}`);
    } catch (err) {
      setError('Error joining group');
      setLoading(false);
    }
  };

  const openGroup = (code) => {
    navigate(`/group/${code}`);
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
            onClick={() => { setActiveTab('join'); setError(''); }}
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
          <form onSubmit={handleJoin} className="flex-col">
            <label className="input-label">6-Digit Group Code</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. 123456" 
              value={joinCode} 
              onChange={(e) => setJoinCode(e.target.value)}
              maxLength={6}
            />
            <label className="input-label">Your Name</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Enter your name" 
              value={joinName} 
              onChange={(e) => setJoinName(e.target.value)}
            />
            <button type="submit" className="btn-primary mt-4" disabled={loading}>
              <LogIn size={20} /> {loading ? 'Joining...' : 'Join'}
            </button>
          </form>
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
              <div key={i} className="glass-card flex items-center justify-between mb-2" onClick={() => openGroup(g.code)} style={{ cursor: 'pointer' }}>
                <div>
                  <h3 className="font-semibold text-primary">Code: {g.code}</h3>
                  <p className="text-xs text-muted">Joined: {new Date(g.joinedAt).toLocaleDateString()}</p>
                </div>
                <div className="btn-secondary" style={{ width: 'auto', padding: '8px 12px' }}>
                  Open
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
