const express = require('express');
const router = express.Router();
const multer = require('multer')

const ConcertTicket = require('../models/ConcertTicket');
const ConcertExperience = require('../models/ConcertExperience');
const ConcertMemory = require('../models/ConcertMemory');

const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 10000000},
    fileFilter: (req, file, cb) => {
        cb(null, ['image', 'video'].includes(file.mimetype.split('/')[0]));
    }
})

router.post('/ticket', async(req, res) => {
    console.log('POST /ticket hit');
    console.log(req.body); // 👀 log incoming data
    try {
        const { artist, tour, date, venue, seatInfo } = req.body;

        const newTicket = new ConcertTicket({
            artist,
            tour,
            date,
            venue,
            seatInfo
        });

        await newTicket.save();
        console.log(newTicket._id); // ✅ Access the ID here
            // Automatically create a blank ConcertExperience (you can later let the user edit it)
        const newExperience = new ConcertExperience({
            concertTicket: newTicket._id,
            rating: null, // Optional
            memories: []
            // Omit userId/sharedWith if local-only
        });

        await newExperience.save();
        console.log('Experience created:', newExperience._id);
        res.status(201).json({ message: 'Concert ticket saved successfully!', concert: newTicket });
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
});

router.get('/all_tickets', async(req, res) => {
    console.log('fetching all tickets')
    try {
        const tickets = await ConcertTicket.find();
        console.log(tickets[0]._id);
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/ticket/:id', async (req, res) => {
    console.log('getting ticket info')

    try {
        const ticket = await ConcertTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.post('/experience', async (req, res) => {
    try {
        const { userId, ConcertTicket, rating, notes, photos, videos, sharedWith} = req.body;
        const experience = await ConcertExperience.create({
            userId, concertTicket, rating, notes, photos, videos, sharedWith
        });
        res.status(201).json(experience);
    } catch (error) {
        res.status(400).json({ error: error.message})
    }
});

router.get('/experience/user/:userId', async (req, res) => {
    try {
        const experiences = await ConcertExperience.find({userId: req.params.userId})
        .populate('concertTicket')
        // .populate('sharedWitth', 'username'); 
        res.json(experiences)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.get('experience/:id', async (req, res) => {
    try {
        const experience = await ConcertExperience.findById(req.params.id)
        .populate('concertTicket')
        // .populate('sharedWith', 'username')
        if (!experience) return res.status(404).json({message: 'experience not found'})
        res.json(experience)
    } catch (error) {
        res.status(500).json({error: error.message})
    }
});


// PUT /api/concerts/:id/playlist
router.put('/:id/playlist', async (req, res) => {
    const { id } = req.params;
    const { spotifyPlaylistId } = req.body;
    console.log(`adding playlist to concert ${id}`)
  

    // ✅ Parse the playlist ID from a full Spotify URL or plain ID
    const extractPlaylistId = (input) => {
        try {
        const url = new URL(input);
        if (!url.pathname.startsWith('/playlist/')) return null;
        return url.pathname.replace('/playlist/', '') + url.search;
        } catch {
        // Assume it's already a valid playlistId or partial ID
        return input;
        }
    };

    const parsedId = extractPlaylistId(spotifyPlaylistId);

    if (!parsedId) {
        return res.status(400).json({ error: 'Invalid Spotify playlist input' });
    }

    try {
        const experience = await ConcertExperience.findOne({ concertTicket: id });  
        if (!experience) return res.status(404).json({ error: 'Concert experience not found' });
        experience.spotifyPlaylistId = parsedId;
        await experience.save()
        res.json(experience);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
  });
  
  router.get('/:id/setlist', async (req, res) => {
    const id = req.params.id
    console.log('getting setlist for concert ticket', id)
    try {
        const experience = await ConcertExperience.findOne({ concertTicket: id });
        console.log('found experience', experience)
        if (!experience) return res.status(404).json({ message: 'Concert exp not found' });
        res.json({spotifyPlaylistId: experience.spotifyPlaylistId});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;