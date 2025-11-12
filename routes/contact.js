import express from 'express';
import { createTransport } from 'nodemailer';
import dotenv from 'dotenv';
import db from '../config/database.js';

dotenv.config();

const router = express.Router();

// Configure nodemailer - FIXED import
const transporter = createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send contact form
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `Portfolio Contact from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Increment view count
router.post('/view', (req, res) => {
  try {
    db.prepare('UPDATE views SET count = count + 1, last_updated = CURRENT_TIMESTAMP WHERE id = 1').run();
    const result = db.prepare('SELECT count FROM views WHERE id = 1').get();
    res.json({ count: result.count });
  } catch (error) {
    console.error('Error updating view count:', error);
    res.status(500).json({ error: 'Failed to update view count' });
  }
});

// Get view count
router.get('/views', (req, res) => {
  try {
    const result = db.prepare('SELECT count FROM views WHERE id = 1').get();
    res.json({ count: result.count });
  } catch (error) {
    console.error('Error fetching view count:', error);
    res.status(500).json({ error: 'Failed to fetch view count' });
  }
});

export default router;
