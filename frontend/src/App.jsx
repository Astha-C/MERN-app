import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';

// Registering the components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const App = () => {
  const [transactions, setTransactions] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [barChart, setBarChart] = useState([]);
  const [pieChart, setPieChart] = useState([]);
  const [month, setMonth] = useState('March');
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    const transRes = await axios.get(`http://localhost:3001/transactions?month=${month}&search=${search}`);
    const statRes = await axios.get(`http://localhost:3001/statistics?month=${month}`);
    const barRes = await axios.get(`http://localhost:3001/barchart?month=${month}`);
    const pieRes = await axios.get(`http://localhost:3001/piechart?month=${month}`);

    setTransactions(transRes.data);
    setStatistics(statRes.data);
    setBarChart(barRes.data);
    setPieChart(pieRes.data);
  };

  useEffect(() => {
    fetchData();
  }, [month, search]);

  const barData = {
    labels: barChart.map(item => item.range),
    datasets: [{
      label: 'Number of Items',
      data: barChart.map(item => item.count),
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
    }]
  };

  // Check pieChart data structure
  console.log(pieChart,"meowww");

  const pieData = {
    labels: pieChart.map(item => item._id), // Unique categories
    datasets: [{
      label: 'Categories',
      data: pieChart.map(item => item.count), // Counts of items in each category
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'], // Adjust colors as necessary
    }],
  };

  // Create chart refs
  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);

  useEffect(() => {
    let pieChartInstance; // Declare the pie chart instance variable
  
    // Check if the pieChartRef is available
    if (pieChartRef.current) {
      // If an instance already exists, destroy it to prevent reuse of the canvas
      if (pieChartInstance) {
        pieChartInstance.destroy(); // Clean up previous instance
      }
  
      // Initialize the pie chart
      pieChartInstance = new ChartJS(pieChartRef.current, {
        type: 'pie',
        data: pieData,   // Make sure pieData is correct here
        options: {
          responsive: true,
        },
      });
    }
  
    // Cleanup the chart when component unmounts or data updates
    return () => {
      if (pieChartInstance) {
        pieChartInstance.destroy();
      }
    };
  }, [pieData]);
  

  useEffect(() => {
    // Create bar chart
    if (barChartRef.current) {
      const barChartInstance = new ChartJS(barChartRef.current, {
        type: 'bar',
        data: barData,
        options: {
          responsive: true,
        },
      });
      return () => {
        barChartInstance.destroy(); // Cleanup
      };
    }
  }, [barData]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Transactions Table</h1>
      <div className="mb-4 flex flex-col md:flex-row md:items-center">
        <input
          type="text"
          placeholder="Search"
          className="border rounded p-2 mb-2 md:mb-0 md:mr-2"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="border rounded p-2"
        >
          {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month) => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>
      </div>

      <table className="min-w-full bg-white border border-gray-300 shadow-md rounded">
        <thead className="bg-gray-200">
          <tr>
            <th className="py-2 px-4 border">Product Title</th>
            <th className="py-2 px-4 border">Description</th>
            <th className="py-2 px-4 border">Price</th>
            <th className="py-2 px-4 border">Date</th>
            <th className="py-2 px-4 border">Category</th>
            <th className="py-2 px-4 border">Sold</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(tx => (
            <tr key={tx._id} className="hover:bg-gray-100">
              <td className="py-2 px-4 border">{tx.productTitle}</td>
              <td className="py-2 px-4 border">{tx.description}</td>
              <td className="py-2 px-4 border">${tx.price.toFixed(2)}</td>
              <td className="py-2 px-4 border">{new Date(tx.dateOfSale).toLocaleDateString()}</td>
              <td className="py-2 px-4 border">{tx.category}</td>
              <td className="py-2 px-4 border">{tx.sold ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-2xl font-semibold my-4">Statistics</h2>
      <div className="border rounded p-4 bg-gray-50 mb-4">
        <p>Total Amount: ${statistics.totalAmount?.toFixed(2)}</p>
        <p>Total Items Sold: {statistics.totalItems}</p>
        <p>Total Items Not Sold: {statistics.notSoldItems}</p>
      </div>

      <h2 className="text-2xl font-semibold my-4">Bar Chart (Price Range)</h2>
      <div className="mb-8">
        <canvas ref={barChartRef} />
      </div>

      <h2 className="text-2xl font-semibold my-4">Pie Chart (Categories)</h2>
      <div className="mb-8">
        <canvas ref={pieChartRef} />
      </div>
    </div>
  );
};

export default App;
