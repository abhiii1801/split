const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const Group = require('./models/Group');

const app = express();

app.use(cors({
  origin: 'https://split-ecru.vercel.app'
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected');
  })
  .catch((err) => {
    console.log(err);
  });

// Health Check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Split API running'
  });
});

// Create Group
app.post('/api/group', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Name is required'
      });
    }

    let code;

    do {
      code = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
    } while (await Group.findOne({ code }));

    const group = new Group({
      code,
      name
    });

    await group.save();

    res.json({ code });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get Group
app.get('/api/group/:code', async (req, res) => {
  try {
    const group = await Group.findOne({
      code: req.params.code
    });

    if (!group) {
      return res.status(404).json({
        error: 'Group not found'
      });
    }

    res.json(group);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Add Member
app.post('/api/group/:code/member', async (req, res) => {
  try {
    const { name } = req.body;
    const { code } = req.params;

    if (!name) {
      return res.status(400).json({
        error: 'Name is required'
      });
    }

    const group = await Group.findOne({ code });

    if (!group) {
      return res.status(404).json({
        error: 'Group not found'
      });
    }

    const memberId =
      'm_' + Math.random().toString(36).substring(2, 11);

    group.members.push({
      id: memberId,
      name,
      joinedAt: new Date()
    });

    await group.save();

    res.json({ memberId });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Add Expense
app.post('/api/group/:code/expense', async (req, res) => {
  try {
    const {
      title,
      amount,
      category,
      payerId,
      splitType,
      splits,
      date
    } = req.body;

    const { code } = req.params;

    const group = await Group.findOne({ code });

    if (!group) {
      return res.status(404).json({
        error: 'Group not found'
      });
    }

    const expenseId =
      'e_' + Math.random().toString(36).substring(2, 11);

    group.expenses.push({
      id: expenseId,
      title,
      amount: parseFloat(amount),
      category,
      payerId,
      splitType,
      splits,
      date: date || new Date()
    });

    await group.save();

    res.json({
      success: true,
      expenseId
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Update Expense
app.put('/api/group/:code/expense/:expenseId', async (req, res) => {
  try {
    const {
      title,
      amount,
      category,
      payerId,
      splitType,
      splits,
      date
    } = req.body;

    const { code, expenseId } = req.params;

    const group = await Group.findOne({ code });

    if (!group) {
      return res.status(404).json({
        error: 'Group not found'
      });
    }

    const expense = group.expenses.find(
      e => e.id === expenseId
    );

    if (!expense) {
      return res.status(404).json({
        error: 'Expense not found'
      });
    }

    expense.title = title;
    expense.amount = parseFloat(amount);
    expense.category = category;
    expense.payerId = payerId;
    expense.splitType = splitType;
    expense.splits = splits;
    expense.date = date || expense.date;

    await group.save();

    res.json({
      success: true
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Delete Expense
app.delete('/api/group/:code/expense/:expenseId', async (req, res) => {
  try {
    const { code, expenseId } = req.params;

    const group = await Group.findOne({ code });

    if (!group) {
      return res.status(404).json({
        error: 'Group not found'
      });
    }

    group.expenses = group.expenses.filter(
      e => e.id !== expenseId
    );

    await group.save();

    res.json({
      success: true
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Add Category
app.post('/api/group/:code/category', async (req, res) => {
  try {
    const { category } = req.body;
    const { code } = req.params;

    if (!category) {
      return res.status(400).json({
        error: 'Category is required'
      });
    }

    const group = await Group.findOne({ code });

    if (!group) {
      return res.status(404).json({
        error: 'Group not found'
      });
    }

    if (!group.categories.includes(category)) {
      group.categories.push(category);

      await group.save();
    }

    res.json({
      success: true,
      categories: group.categories
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Delete Category
app.delete('/api/group/:code/category/:categoryName', async (req, res) => {
  try {
    const { code, categoryName } = req.params;

    const group = await Group.findOne({ code });

    if (!group) {
      return res.status(404).json({
        error: 'Group not found'
      });
    }

    group.categories = group.categories.filter(
      c => c !== categoryName
    );

    await group.save();

    res.json({
      success: true,
      categories: group.categories
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});