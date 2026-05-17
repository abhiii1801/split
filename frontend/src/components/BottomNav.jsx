import { Link, useLocation, useParams } from 'react-router-dom';
import { Home, PlusCircle, CheckCircle, PieChart, Users } from 'lucide-react';

export default function BottomNav() {
  const { code } = useParams();
  const location = useLocation();

  if (!code) return null;

  const isActive = (path) => location.pathname === `/group/${code}${path}`;

  return (
    <div className="bottom-nav">
      <Link to={`/group/${code}`} className={`nav-item ${isActive('') ? 'active' : ''}`}>
        <Home size={24} />
        <span>Feed</span>
      </Link>
      <Link to={`/group/${code}/add`} className={`nav-item ${isActive('/add') ? 'active' : ''}`}>
        <PlusCircle size={24} />
        <span>Add</span>
      </Link>
      <Link to={`/group/${code}/settle`} className={`nav-item ${isActive('/settle') ? 'active' : ''}`}>
        <CheckCircle size={24} />
        <span>Settle</span>
      </Link>
      <Link to={`/group/${code}/analytics`} className={`nav-item ${isActive('/analytics') ? 'active' : ''}`}>
        <PieChart size={24} />
        <span>Stats</span>
      </Link>
      <Link to={`/group/${code}/info`} className={`nav-item ${isActive('/info') ? 'active' : ''}`}>
        <Users size={24} />
        <span>Info</span>
      </Link>
    </div>
  );
}
