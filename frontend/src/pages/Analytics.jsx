import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGroup, getMember } from '../utils/api';
import BottomNav from '../components/BottomNav';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Analytics() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const data = await getGroup(code);
        if (!data) navigate('/');
        else setGroup(data);
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

  // Process data for charts
  const expensesByCategory = {};
  const expensesByPerson = {};

  group.expenses.forEach(exp => {
    // By Category
    if (!expensesByCategory[exp.category]) expensesByCategory[exp.category] = 0;
    expensesByCategory[exp.category] += parseFloat(exp.amount);

    // By Person (who paid)
    const payerName = getMember(group, exp.payerId)?.name || 'Unknown';
    if (!expensesByPerson[payerName]) expensesByPerson[payerName] = 0;
    expensesByPerson[payerName] += parseFloat(exp.amount);
  });

  const categoryData = Object.keys(expensesByCategory).map(key => ({
    name: key,
    value: expensesByCategory[key]
  }));

  const personData = Object.keys(expensesByPerson).map(key => ({
    name: key,
    amount: expensesByPerson[key]
  }));

  return (
    <>
      <div className="page-content">
        <h1 className="text-xl font-bold mb-6">Analytics</h1>

        {group.expenses.length === 0 ? (
          <p className="text-center text-muted mt-8">No expenses to analyze yet.</p>
        ) : (
          <>
            <div className="glass-card mb-6">
              <h2 className="text-lg font-semibold mb-4 text-center">Expenses by Category</h2>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <RechartsPieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-main)' }} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card mb-6">
              <h2 className="text-lg font-semibold mb-4 text-center">Who Paid the Most</h2>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <BarChart data={personData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                    <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-main)' }} />
                    <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </>
  );
}
