const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const concertRoutes = require('./routes/concert')
const uploadRoutes = require('./routes/upload')
const authRoutes = require('./routes/auth')
const eventWatcherRoutes = require('./routes/eventWatcher')
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// middleware
app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/concerts', concertRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/eventWatcher', eventWatcherRoutes)

app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend connected successfully!' });
  });

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, '127.0.0.1', () => {
    console.log(`server running at http://127.0.0.1:${PORT}`);
});
