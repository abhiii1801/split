import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import MainFeed from './pages/MainFeed';
import AddExpense from './pages/AddExpense';
import Info from './pages/Info';
import Settle from './pages/Settle';
import Analytics from './pages/Analytics';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/group/:code" element={<MainFeed />} />
          <Route path="/group/:code/add" element={<AddExpense />} />
          <Route path="/group/:code/edit/:expenseId" element={<AddExpense />} />
          <Route path="/group/:code/info" element={<Info />} />
          <Route path="/group/:code/settle" element={<Settle />} />
          <Route path="/group/:code/analytics" element={<Analytics />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
