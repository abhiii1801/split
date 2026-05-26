const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

const ExpenseSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  title: String,
  amount: Number,
  category: String,
  payerId: String,
  splitType: String,
  splits: {
    type: Object,
    default: {}
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const PaymentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  fromId: String,
  toId: String,
  amount: Number,
  note: String,
  date: {
    type: Date,
    default: Date.now
  }
});

const GroupSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },

  name: {
    type: String,
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  members: {
    type: [MemberSchema],
    default: []
  },

  expenses: {
    type: [ExpenseSchema],
    default: []
  },

  payments: {
    type: [PaymentSchema],
    default: []
  },

  categories: {
    type: [String],
    default: [
      'Food',
      'Travel',
      'Accommodation',
      'Entertainment',
      'Other'
    ]
  }
});

module.exports = mongoose.model('Group', GroupSchema);