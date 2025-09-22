// const http = require( "http" ),
//       fs   = require( "fs" ),
//       // IMPORTANT: you must run `npm install` in the directory for this assignment
//       // to install the mime library if you"re testing this on your local machine.
//       // However, Glitch will install it automatically by looking in your package.json
//       // file.
//       mime = require( "mime" ),
//       dir  = "public/",
//       port = 3000

// //This array will save data as objects
// const scoreData = [];

// const server = http.createServer( function( request,response ) {
//   if( request.method === "GET" ) {
//     handleGet( request, response )    
//   }else if( request.method === "POST" ){
//     handlePost( request, response ) 
//   }
// })

// // GET method
// const handleGet = function( request, response ) {
//   const filename = dir + request.url.slice( 1 ); // remove the first "/" like "/about/us" will be ""about/us"" 

//   if( request.url === "/" ) { //for sending file
//     sendFile( response, "public/index.html" )
//   }
//   else if (request.url === "/ranking") { //for sending data
//     response.writeHead(200, "OK", {"Content-Type": "application/json"});
//     response.end(JSON.stringify(scoreData)); //send the data array in string
//   }
//   else{
//     sendFile( response, filename )
//   }
// }

// //POST method
// const handlePost = function( request, response ) {
//   let dataString = ""

//   request.on( "data", function( data ) { // "on" listening data coming from http
//       dataString += data 
//   })

//   request.on( "end", function() { // "end" activate when the last chunk of data arrived
//     if (request.url === "/submit") {
//       //parse the string data into object
//       const newScoreData = JSON.parse( dataString ); //
//       // console.log( newScoreData); //testing

//       scoreData.push({
//         name: newScoreData.yourname,
//         score: newScoreData.score,
//       });

//       //sort data for ranking
//       scoreData.sort((a, b) => b.score - a.score);

//       console.log(scoreData)

//       response.writeHead( 200, "OK", {"Content-Type": "text/plain" })
//       response.end("Score submitted successfully!")
//     } 
//     else if ( request.url === "/delete" ) { //handle "delete"
//       const data = JSON.parse( dataString );
//       const nameToDelete = data.name;
      
//       // We use the .filter() method to create a new array containing everyone EXCEPT the player whose name matches the one to delete.
//       const newData = scoreData.filter(player => player.name !== nameToDelete);
      
//       // A safe way to update the original array is to clear it and push the new data. 
//       // https://stackoverflow.com/questions/30640771/i-want-to-replace-all-values-with-another-array-values-both-arrays-are-in-same
//       scoreData.length = 0; // Clear the original array
//       scoreData.push.apply(scoreData, newData); // Push new data back
      
//       console.log(`Deleted ${nameToDelete}. New scoreData:`, scoreData); //for testing
//       response.writeHead( 200, "OK", {"Content-Type": "text/plain" });
//       response.end("Player deleted");
//     }
//     else if (request.url === "/update") { //handle "update"
//       const data = JSON.parse(dataString);
//       const oldName = data.oldName;
//       const newName = data.newName;

//       //find the player
//       const playerToUpdate = scoreData.find(player => player.name === oldName);
//       playerToUpdate.name = newName; // update that player's name
//       response.writeHead('200', "OK", {"Content-Type":"text/plain"});
//       response.end("Player updated successfully");
//     }
//   })
// }

// const sendFile = function( response, filename ) {
//    const type = mime.getType( filename ) 

//    fs.readFile( filename, function( err, content ) {

//      // if the error = null, then we"ve loaded the file successfully
//      if( err === null ) {

//        // status code: https://httpstatuses.com
//        response.writeHeader( 200, { "Content-Type": type })
//        response.end( content )

//      }
//      else {

//        // file not found, error code 404
//        response.writeHeader( 404 )
//        response.end( "404 Error: File Not Found" )

//      }
//    })
// }

// server.listen( process.env.PORT || port );

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