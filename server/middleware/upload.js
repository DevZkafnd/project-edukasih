const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Timestamp + Original Extension (to prevent duplicate names)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File Filter (Images, Videos, & Documents)
const fileFilter = (req, file, cb) => {
  // Allow images, videos, and documents
  const allowedTypes = /jpeg|jpg|png|webp|mp4|mkv|webm|avi|mov|pdf|doc|docx|xls|xlsx|ppt|pptx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  // Allow image/*, video/*, and application/* (for docs)
  const mimetype = /image|video|application/.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung! (Hanya Gambar, Video, PDF, Office Docs)'));
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // Limit 100MB
});

module.exports = upload;
