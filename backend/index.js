// Import required modules at the top
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const Transaction = require('./models/Transaction'); // Your model

// Initialize express app
const app = express();
app.use(cors());
app.use(express.json()); // to handle json data

// Use your MongoDB connection string here
const dbURI = 'mongodb+srv://astharchaudhary2003:0l2ztbFpBa1AuybJ@cluster0.4ow5c.mongodb.net/mernproject?retryWrites=true&w=majority&appName=Cluster0';

// Connect to MongoDB
mongoose.connect(dbURI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Seed database
app.get('/seed', async (req, res) => {
  
  try {
    const { data } = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    await Transaction.insertMany(data);
    res.status(200).send('Database initialized with seed data');
  } catch (error) {
    res.status(500).send('Error initializing data');
  }
});

// API to get transactions with pagination and search
app.get('/transactions', async (req, res) => {
  const { page = 1, perPage = 10, search = '', month } = req.query;

  const query = {
    dateOfSale: {
      $gte: new Date(`${month} 1`),
      $lte: new Date(`${month} 31`)
    }
  };

  if (search) {
    query.$or = [
      { productTitle: new RegExp(search, 'i') },
      { description: new RegExp(search, 'i') },
      { price: parseFloat(search) }
    ];
  }

  try {
    const transactions = await Transaction.find(query)
      .skip((page - 1) * perPage)
      .limit(parseInt(perPage));
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching transactions' });
  }
});

// API for statistics
app.get('/statistics', async (req, res) => {
  const { month } = req.query;

  const query = {
    dateOfSale: { $gte: new Date(`${month} 1`), $lte: new Date(`${month} 31`) }
  };

  try {
    const totalSales = await Transaction.aggregate([
      { $match: query },
      { $group: { _id: null, totalAmount: { $sum: "$price" }, totalItems: { $sum: 1 } } }
    ]);

    const soldItems = await Transaction.countDocuments({ ...query, sold: true });
    const notSoldItems = await Transaction.countDocuments({ ...query, sold: false });

    res.status(200).json({
      totalAmount: totalSales[0]?.totalAmount || 0,
      totalItems: totalSales[0]?.totalItems || 0,
      soldItems,
      notSoldItems
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching statistics' });
  }
});

// API for bar chart (price range distribution)
app.get('/barchart', async (req, res) => {
  const { month } = req.query;

  const priceRanges = [
    { range: '0-100', min: 0, max: 100 },
    { range: '101-200', min: 101, max: 200 },
    { range: '201-300', min: 201, max: 300 },
    { range: '301-400', min: 301, max: 400 },
    { range: '401-500', min: 401, max: 500 },
    { range: '501-600', min: 501, max: 600 },
    { range: '601-700', min: 601, max: 700 },
    { range: '701-800', min: 701, max: 800 },
    { range: '801-900', min: 801, max: 900 },
    { range: '901-above', min: 901 }
  ];

  const results = [];

  for (const range of priceRanges) {
    const count = await Transaction.countDocuments({
      price: { $gte: range.min, $lte: range.max || Infinity },
      dateOfSale: { $gte: new Date(`${month} 1`), $lte: new Date(`${month} 31`) }
    });
    results.push({ range: range.range, count });
  }

  res.status(200).json(results);
});

// API for pie chart (unique categories)
app.get('/piechart', async (req, res) => {
  const { month } = req.query;

  const query = {
    dateOfSale: { $gte: new Date(`${month} 1`), $lte: new Date(`${month} 31`) }
  };

  try {
    const categories = await Transaction.aggregate([
      { $match: query },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    console.log(categories,"heelo")
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching pie chart data' });
  }
});

// API for combined data
app.get('/combined', async (req, res) => {
  try {
    const [transactions, statistics, barChart, pieChart] = await Promise.all([
      Transaction.find().lean(),
      Transaction.aggregate([{ $group: { _id: null, totalAmount: { $sum: "$price" }, totalItems: { $sum: 1 } } }]),
      Transaction.aggregate([{ $group: { _id: "$price", count: { $sum: 1 } } }]),
      Transaction.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }])
    ]);

    console.log(pieChart,"meoww")

    res.status(200).json({
      transactions,
      statistics: statistics[0],
      barChart,
      pieChart
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching combined data' });
  }
});

// Start the server
app.listen(3001, () => {
  console.log('Server is running on port 3001');
});
