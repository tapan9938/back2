import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import db from '../config/database.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, JPG, PNG) and PDFs are allowed!'));
    }
  }
});

// Get all certificates
router.get('/', (req, res) => {
  try {
    const certificates = db.prepare('SELECT * FROM certificates ORDER BY upload_date DESC').all();
    res.json(certificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// Upload certificate
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    const { category } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const id = uuidv4();
    const certificate = {
      id,
      name: file.originalname.replace(path.extname(file.originalname), ''),
      category: category || 'education',
      filename: file.filename,
      filepath: `/uploads/${file.filename}`
    };
    
    db.prepare(`
      INSERT INTO certificates (id, name, category, filename, filepath)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, certificate.name, certificate.category, certificate.filename, certificate.filepath);
    
    res.status(201).json({ message: 'Certificate uploaded successfully', certificate });
  } catch (error) {
    console.error('Error uploading certificate:', error);
    res.status(500).json({ error: 'Failed to upload certificate' });
  }
});

// Delete certificate
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    // Password protection
    if (password !== 'skyman') {
      return res.status(403).json({ error: 'Incorrect password' });
    }
    
    const certificate = db.prepare('SELECT * FROM certificates WHERE id = ?').get(id);
    
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    
    // Delete file from filesystem
    const filePath = path.join(__dirname, '../uploads', certificate.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete from database
    db.prepare('DELETE FROM certificates WHERE id = ?').run(id);
    
    res.json({ message: 'Certificate deleted successfully' });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    res.status(500).json({ error: 'Failed to delete certificate' });
  }
});

export default router;
