require('dotenv').config();

const path = require('path');
const mongoose = require('mongoose');
const express = require('express');  

const User = require('./models/User');
const Score = require('./models/Score');

const {verifyWebToken, verifyTokenAndUserID, optionalAuth} = require('./routes/verification');

const app = express();
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
        .then(()=>{console.log("Connected to server successfully!")})
        .catch((err)=>{console.log(err)
});

//middleware
app.use(express.json()); //parse JSON string to object
app.use(express.urlencoded({ extended: true })); //parse encoded data to object, mostly for submit "form"

app.use(express.static(path.join(__dirname, 'public'))); // serve static file

// --- Routes ---

// Auth routes for register/login later
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// GET "/" is handled by express.static automatically.
// This is an explicit way to do it, BUT IT NEVER REACHED because of reason above.
// app.get('/', (_req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

//SUBMIT SCORE -----------------------
app.post('/submit', verifyWebToken, async(req, res) => { //verifyWebToken helps extracting and pushing req.user to request
  try {
    const { playerName, score, game } = req.body;

    //checking form of the variables in body
    if (typeof playerName !== 'string' || playerName.trim() === '') {
      return res.status(400).send('playerName required');
    }
    const numScore = Number(score);
    if (!Number.isFinite(numScore)) {
      return res.status(400).send('score must be a number');
    }

    //create Score data
    await Score.create({
      owner: req.user.id, //<--this will be extract from the token req.user saved from jwt.verify() - in routes/ verification.js
      playerName: playerName,
      score: score,
      game: game,
    });

    res.status(200).send('Score submitted successfully!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error submitting score')
  }
});

//RANKING: sorted right in database ----------------------
app.get('/ranking', optionalAuth, async(req, res)=>{ //optionalAuth helps extracting and pushing req.user to request
  try {
    const gamePara = req.query.game;
    const limitPara = Math.min(Number(req.query.limit) || 20, 20); //limit max 20 data

    // if (!req.user || !req.user.id) return res.status(401).send('Unauthorized');
    
    // case 1: If not logged in, return blank list
    if (!req.user || !req.user.id) {
      return res.status(200).json([]); // show nothing when not logged in
    }

    // case 2: otherwise, if user logged in
    const scores = await Score.find({owner: req.user.id, game: gamePara})
      .sort({ score: -1, createdAt: -1 }) //sorted descendantly
      .limit(limitPara)
      .select('_id playerName score') // _id, playerName and score
      .lean() // returns plain JavaScript objects

    //putting into an "array" before sending data
    const payload = scores.map(s => ({id: String(s._id), name: s.playerName, score: s.score })); //we have to stringify the objecctID from Mongodb, look at the database to know more about objectID
    res.status(200).json(payload);
  } catch (e) {
    console.error(e);
    res.status(500).send('Server error fetching ranking');
  }
});

//UPDATE--------------------
app.post('/updateById', verifyWebToken, async(req, res)=> { //verifyWebToken helps extracting and pushing req.user to request
  const {newName, playerId } = req.body;
  if (!newName) return res.status(400).send('New names required');

  // const filter = { owner: req.user.id, playerName: oldName }; //find all data match that old name, //Fix this later with turn_id
  // if (game) filter.game = game;

  // //this will make all rows have that name will be changed to old name, we leave it like this and will be refactor later
  // await Score.updateMany(filter, { $set: { playerName: newName.trim().slice(0, 40) } }); //UPDATE more specific later
  await Score.updateOne(
    { _id: playerId, owner: req.user.id },
    { $set: { playerName: newName.trim().slice(0, 40) } }
  );
  res.status(200).send('Player updated successfully');
});

//DELETE-----------------------
app.post('/deleteById', verifyWebToken, async (req, res) => { //verifyWebToken helps extracting and pushing req.user to request
  const { playerId} = req.body;
  if (!playerId) return res.status(400).send('playerId required');

  //fix this later with turn_ID, otherwise it will delete all rows having the same name
  await Score.deleteOne({ _id: playerId, owner: req.user.id });
  res.status(200).send('Player entries deleted');
});



app.listen(PORT, ()=>{
  console.log(`Back end is running at port ${PORT}`);
});