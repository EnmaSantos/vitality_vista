require('dotenv').config();
const express = require('express');
const { connectToDb } = require('./db');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

connectToDb().then(client => {
  app.locals.db = client.db('vitalityVista');
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}).catch(err => {
  console.error('Failed to connect to MongoDB', err);
  process.exit(1);
});