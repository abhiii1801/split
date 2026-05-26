import axios from 'axios';

const api = axios.create({
  baseURL: 'https://split-1-pxfa.onrender.com/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const createGroup = async (name) => {
  const res = await api.post('/group', { name });
  return res.data;
};

export const getGroup = async (code) => {
  try {
    const res = await api.get(`/group/${code}`);
    return res.data;
  } catch {
    return null;
  }
};

export const addMember = async (code, name) => {
  const res = await api.post(`/group/${code}/member`, { name });
  return res.data;
};

export const addExpense = async (code, expense) => {
  const res = await api.post(`/group/${code}/expense`, expense);
  return res.data;
};

export const addPayment = async (code, payment) => {
  const res = await api.post(`/group/${code}/payment`, payment);
  return res.data;
};

export const updatePayment = async (code, paymentId, payment) => {
  const res = await api.put(`/group/${code}/payment/${paymentId}`, payment);
  return res.data;
};

export const deletePayment = async (code, paymentId) => {
  const res = await api.delete(`/group/${code}/payment/${paymentId}`);
  return res.data;
};

export const updateExpense = async (code, expenseId, expense) => {
  const res = await api.put(`/group/${code}/expense/${expenseId}`, expense);
  return res.data;
};

export const deleteExpense = async (code, expenseId) => {
  const res = await api.delete(`/group/${code}/expense/${expenseId}`);
  return res.data;
};

export const addCategory = async (code, category) => {
  const res = await api.post(`/group/${code}/category`, { category });
  return res.data;
};

export const deleteCategory = async (code, categoryName) => {
  const res = await api.delete(
    `/group/${code}/category/${encodeURIComponent(categoryName)}`
  );
  return res.data;
};

// Compute settlements locally based on the group data returned from API
export const calculateSettlements = (group) => {
  if (!group || !group.members || !group.expenses) return [];

  const balances = {};
  group.members.forEach(m => {
    balances[m.id] = 0;
  });

  group.expenses.forEach(exp => {
    if (balances[exp.payerId] !== undefined) {
      balances[exp.payerId] += parseFloat(exp.amount);
    }

    for (const [memberId, amount] of Object.entries(exp.splits)) {
      if (balances[memberId] !== undefined) {
        balances[memberId] -= parseFloat(amount);
      }
    }
  });

  // Apply person-to-person payments to balances (payments reduce outstanding balances)
  if (group.payments && Array.isArray(group.payments)) {
    group.payments.forEach(p => {
      const amt = parseFloat(p.amount) || 0;
      if (balances[p.fromId] !== undefined) balances[p.fromId] += amt;
      if (balances[p.toId] !== undefined) balances[p.toId] -= amt;
    });
  }

  const debtors = [];
  const creditors = [];

  for (const [memberId, balance] of Object.entries(balances)) {
    if (balance > 0.01) {
      creditors.push({ memberId, amount: balance });
    } else if (balance < -0.01) {
      debtors.push({ memberId, amount: -balance });
    }
  }

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transactions = [];

  let d = 0;
  let c = 0;

  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d];
    const creditor = creditors[c];

    const amount = Math.min(debtor.amount, creditor.amount);

    transactions.push({
      from: debtor.memberId,
      to: creditor.memberId,
      amount
    });

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.01) d++;
    if (creditor.amount < 0.01) c++;
  }

  return transactions;
};

// Local device storage for joined groups
export const getMyGroups = () => {
  const myGroups = localStorage.getItem('split_my_groups');
  return myGroups ? JSON.parse(myGroups) : [];
};

export const joinGroupLocal = (code, memberId) => {
  const myGroups = getMyGroups();

  const existing = myGroups.find(g => g.code === code);

  if (!existing) {
    myGroups.push({
      code,
      memberId,
      joinedAt: new Date().toISOString()
    });

    localStorage.setItem(
      'split_my_groups',
      JSON.stringify(myGroups)
    );
  }
};

export const getMember = (group, memberId) => {
  if (!group || !group.members) return null;

  return group.members.find(m => m.id === memberId) || null;
};