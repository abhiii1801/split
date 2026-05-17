const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();

app.use(cors({
  origin: 'https://split-ecru.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const DATA_FILE = path.join(__dirname, 'data.json');

// Helper to read data
async function readData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data || '{}');
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.writeFile(DATA_FILE, '{}', 'utf8');
      return {};
    }
    throw err;
  }
}

// Helper to write data
async function writeData(data) {
  await fs.writeFile(
    DATA_FILE,
    JSON.stringify(data, null, 2),
    'utf8'
  );
}

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Split API running'
  });
});

// Create a group
app.post('/api/group', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Name is required'
      });
    }

    const data = await readData();

    let code;

    do {
      code = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
    } while (data[code]);

    data[code] = {
      code,
      name,
      createdAt: new Date().toISOString(),
      members: [],
      expenses: [],
      categories: [
        'Food',
        'Travel',
        'Accommodation',
        'Entertainment',
        'Other'
      ]
    };

    await writeData(data);

    res.json({ code });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get group data
app.get('/api/group/:code', async (req, res) => {
  try {
    const data = await readData();

    const group = data[req.params.code];

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

// Add a member
app.post('/api/group/:code/member', async (req, res) => {
  try {
    const { name } = req.body;
    const { code } = req.params;

    if (!name) {
      return res.status(400).json({
        error: 'Name is required'
      });
    }

    const data = await readData();

    const group = data[code];

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
      joinedAt: new Date().toISOString()
    });

    await writeData(data);

    res.json({ memberId });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Add an expense
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

    const data = await readData();

    const group = data[code];

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
      date: date || new Date().toISOString()
    });

    await writeData(data);

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

// Edit an expense
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

    const data = await readData();

    const group = data[code];

    if (!group) {
      return res.status(404).json({
        error: 'Group not found'
      });
    }

    const expenseIndex =
      group.expenses.findIndex(
        e => e.id === expenseId
      );

    if (expenseIndex === -1) {
      return res.status(404).json({
        error: 'Expense not found'
      });
    }

    group.expenses[expenseIndex] = {
      ...group.expenses[expenseIndex],
      title,
      amount: parseFloat(amount),
      category,
      payerId,
      splitType,
      splits,
      date:
        date ||
        group.expenses[expenseIndex].date
    };

    await writeData(data);

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

// Delete an expense
app.delete('/api/group/:code/expense/:expenseId', async (req, res) => {
  try {
    const { code, expenseId } = req.params;

    const data = await readData();

    const group = data[code];

    if (!group) {
      return res.status(404).json({
        error: 'Group not found'
      });
    }

    const expenseIndex =
      group.expenses.findIndex(
        e => e.id === expenseId
      );

    if (expenseIndex === -1) {
      return res.status(404).json({
        error: 'Expense not found'
      });
    }

    group.expenses.splice(expenseIndex, 1);

    await writeData(data);

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

// Add a category
app.post('/api/group/:code/category', async (req, res) => {
  try {
    const { category } = req.body;
    const { code } = req.params;

    if (!category) {
      return res.status(400).json({
        error: 'Category is required'
      });
    }

    const data = await readData();

    const group = data[code];

    if (!group) {
      return res.status(404).json({
        error: 'Group not found'
      });
    }

    if (!group.categories) {
      group.categories = [
        'Food',
        'Travel',
        'Accommodation',
        'Entertainment',
        'Other'
      ];
    }

    if (!group.categories.includes(category)) {
      group.categories.push(category);

      await writeData(data);
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

// Delete a category
app.delete('/api/group/:code/category/:categoryName', async (req, res) => {
  try {
    const { code, categoryName } = req.params;

    const data = await readData();

    const group = data[code];

    if (!group) {
      return res.status(404).json({
        error: 'Group not found'
      });
    }

    if (!group.categories) {
      group.categories = [
        'Food',
        'Travel',
        'Accommodation',
        'Entertainment',
        'Other'
      ];
    }

    group.categories =
      group.categories.filter(
        c => c !== categoryName
      );

    await writeData(data);

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