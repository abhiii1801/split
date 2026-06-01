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
// This preserves direct payback obligations: each non-payer owes the payer for that expense.
// It does not net chain transactions across multiple payers/creditors.
// Example: if A paid for B/C and B paid for A/B, A owes B and B owes C separately.
export const calculateSettlements = (group) => {
  if (!group || !group.members || !group.expenses) return [];

  const debtMap = {};

  const addDebt = (fromId, toId, amount) => {
    if (!fromId || !toId || fromId === toId || amount <= 0) return;
    const reverseAmount = debtMap[toId]?.[fromId] || 0;
    if (reverseAmount > 0) {
      if (reverseAmount > amount) {
        debtMap[toId][fromId] = reverseAmount - amount;
        return;
      }
      if (Math.abs(reverseAmount - amount) < 0.01) {
        delete debtMap[toId][fromId];
        return;
      }
      delete debtMap[toId][fromId];
      amount -= reverseAmount;
    }

    debtMap[fromId] ||= {};
    debtMap[fromId][toId] = (debtMap[fromId][toId] || 0) + amount;
  };

  const reduceDebt = (fromId, toId, amount) => {
    if (!fromId || !toId || fromId === toId || amount <= 0) return;
    const current = debtMap[fromId]?.[toId] || 0;
    if (current >= amount) {
      debtMap[fromId][toId] = current - amount;
      if (debtMap[fromId][toId] < 0.01) {
        delete debtMap[fromId][toId];
      }
    } else {
      const leftover = amount - current;
      if (current > 0) {
        delete debtMap[fromId][toId];
      }
      addDebt(toId, fromId, leftover);
    }
  };

  group.expenses.forEach(exp => {
    if (!exp || !exp.splits) return;
    for (const [memberId, rawAmount] of Object.entries(exp.splits)) {
      const amount = parseFloat(rawAmount) || 0;
      if (memberId !== exp.payerId && amount > 0) {
        addDebt(memberId, exp.payerId, amount);
      }
    }
  });

  if (group.payments && Array.isArray(group.payments)) {
    group.payments.forEach(p => {
      const amt = parseFloat(p.amount) || 0;
      reduceDebt(p.fromId, p.toId, amt);
    });
  }

  const transactions = [];

  for (const [fromId, owes] of Object.entries(debtMap)) {
    for (const [toId, amount] of Object.entries(owes)) {
      if (amount > 0.01) {
        transactions.push({ from: fromId, to: toId, amount });
      }
    }
  }

  transactions.sort((a, b) => b.amount - a.amount || a.from.localeCompare(b.from) || a.to.localeCompare(b.to));

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