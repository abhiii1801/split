export const createGroup = async (name) => {
  const res = await fetch('/api/group', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error('Failed to create group');
  return res.json();
};

export const getGroup = async (code) => {
  const res = await fetch(`/api/group/${code}`);
  if (!res.ok) return null;
  return res.json();
};

export const addMember = async (code, name) => {
  const res = await fetch(`/api/group/${code}/member`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error('Failed to add member');
  return res.json();
};

export const addExpense = async (code, expense) => {
  const res = await fetch(`/api/group/${code}/expense`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense)
  });
  if (!res.ok) throw new Error('Failed to add expense');
  return res.json();
};

export const updateExpense = async (code, expenseId, expense) => {
  const res = await fetch(`/api/group/${code}/expense/${expenseId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense)
  });
  if (!res.ok) throw new Error('Failed to update expense');
  return res.json();
};

export const deleteExpense = async (code, expenseId) => {
  const res = await fetch(`/api/group/${code}/expense/${expenseId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete expense');
  return res.json();
};

export const addCategory = async (code, category) => {
  const res = await fetch(`/api/group/${code}/category`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category })
  });
  if (!res.ok) throw new Error('Failed to add category');
  return res.json();
};

export const deleteCategory = async (code, categoryName) => {
  const res = await fetch(`/api/group/${code}/category/${encodeURIComponent(categoryName)}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete category');
  return res.json();
};


// Compute settlements locally based on the group data returned from API
export const calculateSettlements = (group) => {
  if (!group || !group.members || !group.expenses) return [];

  const balances = {};
  group.members.forEach(m => { balances[m.id] = 0; });

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

  const debtors = [];
  const creditors = [];

  for (const [memberId, balance] of Object.entries(balances)) {
    if (balance > 0.01) creditors.push({ memberId, amount: balance });
    else if (balance < -0.01) debtors.push({ memberId, amount: -balance });
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
      amount: amount
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
}

export const joinGroupLocal = (code, memberId) => {
  const myGroups = getMyGroups();
  const existing = myGroups.find(g => g.code === code);
  if (!existing) {
    myGroups.push({ code, memberId, joinedAt: new Date().toISOString() });
    localStorage.setItem('split_my_groups', JSON.stringify(myGroups));
  }
}

export const getMember = (group, memberId) => {
  if (!group || !group.members) return null;
  return group.members.find(m => m.id === memberId) || null;
}
