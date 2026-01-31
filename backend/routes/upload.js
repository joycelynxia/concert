const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ConcertExperience = require('../models/ConcertExperience');
const ConcertMemory = require('../models/ConcertMemory');
const ConcertTicket = require('../models/ConcertTicket');
const { uploadToS3, deleteFromS3, isS3Enabled } = require('../utils/s3');
const router = express.Router();

// Storage config: use memory storage for S3, disk storage for local fallback
const useS3 = isS3Enabled();
const storage = useS3
  ? multer.memoryStorage()
  : (() => {
      const photoDir = path.join(__dirname, '../uploads/photos');
      const videoDir = path.join(__dirname, '../uploads/videos');
      if (!fs.existsSync(photoDir)) fs.mkdirSync(photoDir, { recursive: true });
      if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });
      return multer.diskStorage({
        destination: (req, file, cb) => {
          const isVideo = file.mimetype.startsWith('video/');
          cb(null, isVideo ? 'uploads/videos' : 'uploads/photos');
        },
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname);
          cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
        },
      });
    })();

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB per file
  },
  fileFilter: (req, file, cb) => {
    const isMedia = ['image', 'video'].includes(file.mimetype.split('/')[0]);
    cb(null, isMedia);
  }
});


router.post('/:ticketId', upload.array('files', 10), async (req, res) => {
  const ticketId = req.params.ticketId;
  console.log('adding memory to ticket', ticketId);

  try {
    const experience = await ConcertExperience.findOne({ concertTicket: ticketId });
    if (!experience) return res.status(404).json({ error: 'Experience not found' });

    const memories = [];

    for (const file of req.files) {
      const type = file.mimetype.startsWith('video/')
        ? 'video'
        : file.mimetype.startsWith('image/')
        ? 'photo'
        : 'note';

      let content;
      if (useS3) {
        const ext = path.extname(file.originalname) || (type === 'video' ? '.mp4' : '.jpg');
        const key = `memories/${ticketId}/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        content = await uploadToS3(file.buffer, key, file.mimetype);
      } else {
        content = `/uploads/${type === 'video' ? 'videos' : 'photos'}/${file.filename}`;
      }

      const memory = new ConcertMemory({
        experience: experience._id,
        type,
        content,
        mimeType: file.mimetype,
      });

      await memory.save();
      experience.memories.push(memory._id);
      memories.push(memory);
      console.log(memory);
    }

    const note = req.body.note;
    if (note && note.trim() !== '') {
      const memory = new ConcertMemory({
        experience: experience._id,
        type: 'note',
        content: note,
        mimeType: 'text/plain'
      });

      await memory.save();
      experience.memories.push(memory._id);
      memories.push(memory)
      console.log(memory)
    }

    await experience.save();

    res.status(200).json({ message: 'Memories added', memories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});


// GET all memories for a specific concert experience
router.get('/get/:experienceId', async (req, res) => {
  try {
    console.log('fetching memories')
    const experience = await ConcertExperience.findOne({ concertTicket: req.params.experienceId })
      .populate('memories');

    if (!experience) {
      return res.status(404).json({ error: 'Experience not found' });
    }
    // console.log(experience.memories)
    res.status(200).json(experience.memories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch memories' });
  }
});

router.put('/:memoryID', async (req, res) => {
  try {
    console.log('updating memory');
    const { memoryID } = req.params;
    const { content } = req.body
    
    const memory = await ConcertMemory.findById(memoryID)
    if (!memory) return res.status(404).json({error:'memory not found'})
   
      if (memory.type !== 'note') {
      return res.status(400).json({error:'only notes can be edited'})
    }

    memory.content = content;
    await memory.save();

    res.json({message:'note updated', memory})
    } catch (err) {
      console.error('error updating note:', err);
      res.status(500).json({error:'server error'});
  }
});

router.delete('/:ticketID/:memoryID', async (req, res) => {
  const {ticketID, memoryID} = req.params;
  console.log('exp id:', ticketID, 'memoryID', memoryID)

  try {
    const exp = await ConcertExperience.findOne({concertTicket: ticketID});
    console.log('deleting memory from', exp)
    if (!exp) return res.status(404)

    const memory = await ConcertMemory.findById(memoryID);
    console.log('deleting memory', memory)
    if (!memory) return res.status(404).json({error: 'memory not found'})
    
    if (memory.type !== 'note' && memory.content) {
      if (memory.content.startsWith('http')) {
        await deleteFromS3(memory.content);
      } else {
        const filePath = path.join(__dirname, '..', memory.content);
        fs.unlink(filePath, (err) => {
          if (err) console.warn('failed to delete file', filePath);
          else console.log('Deleted file:', filePath);
        });
      }
    } 

    exp.memories = exp.memories.filter(id => id.toString() !== memoryID);
    await exp.save()
    
    await memory.deleteOne();
    res.json({message:'memory deleted'});
  } catch (err) {
    console.error('error deleting memory', err)
    res.status(500).json({error:'server error'})
  }
})

module.exports = router;
