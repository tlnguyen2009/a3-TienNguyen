// FRONT-END (CLIENT) JAVASCRIPT HERE

// const submit = async function( event ) {
//   // stop form submission from trying to load
//   // a new .html page for displaying results...
//   // this was the original browser behavior and still
//   // remains to this day
//   event.preventDefault()
  
//   const input = document.querySelector( "#yourname" ),
//         json = { yourname: input.value },
//         body = JSON.stringify( json )

//   const response = await fetch( "/submit", {
//     method:"POST",
//     body 
//   })
//   //you can use .then(...) for these two down here
//   const text = await response.text()

//   console.log( "text:", text )
// }

window.onload = function() { //onload means when the page finish loading all HTML, it will run this function
  //Constant
  const COUNT_DOWN = 10;

  //Variables
  let score = 0;
  let timeLeft = COUNT_DOWN;
  let timerId = null;

  // Buttons for every game 
  const playButton = document.querySelector(".play-button");
  const pointButton = document.querySelector("#cockroach"); // click on cockroach image to get point
  const saveButton = document.querySelector(".save-button");
  const replayButton = document.querySelector(".replay-button");

  // pointButton.addEventListener("click", function(){
  //   console.log("point + 1");
  // })

  //cockroach images
  const COCKROACH_NORMAL_IMG = "Assets/normal_coackroach.png";
  const COCKROACH_SQUASHED_IMG = "Assets/squashed_cockroach.png";

  //Screen for each sections
  const firstSection = document.querySelector(".first-section");
  const gameSection = document.querySelector(".game-section");
  const lastSection = document.querySelector(".last-section");
  const rankingSection = document.querySelector(".ranking-section");

  //others
  const clockDisplay = document.querySelector(".clock");
  const scoreDisplay = document.querySelectorAll(".score");
  const nameInput = document.querySelector("#yourname");

  //---Buttons for navigation in nav-bar
  const backNav = document.querySelector(".nav-back");
  const rankingNav = document.querySelector(".nav-ranking");

  //---Display for navigation
  const scoreboardBody = document.querySelector("#scoreboard-body"); // id for the body of <table>, we just need to edit the body

  //show screen with "play" button
  const showPlayButtonScreen = function () {
    firstSection.style.display = 'flex';
    lastSection.style.display = 'none';
    gameSection.style.display = 'none';
    rankingSection.style.display = 'none';
  }

  //show ranking table screen
  const showRankingScreen = async function () {
    firstSection.style.display = 'none';
    lastSection.style.display = 'none';
    gameSection.style.display = 'none';
    rankingSection.style.display = 'flex';

    //then await to fetch data
    await fetchAndDisplayRanking(); 
  }

  // game name for data later
  const GAME_KEY = 'Squish-the-cockroach';

  // get token saved in the local storage
  function getToken() {
    return localStorage.getItem('token');
  }

  // a wrapper to add token for header + request for redirection to login page
  async function apiFetch(path, options = {}, { redirectOn401 = false } = {}) {
    const token = getToken();
    const isScoreSubmit = redirectOn401 && path === '/submit' && options.method === 'POST';

    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }; //if there is no header, it will be blank
    
    // if there is no token -> redirect user to log-in
    if (!token && redirectOn401) {
      if (isScoreSubmit) sessionStorage.setItem('pendingScore', options.body);
      const next = encodeURIComponent(location.pathname); //for come back to previous page later when done logging in
      location.href = `/login.html?next=${next}`;
      // for non-redirect cases, just throw so caller can show blank
      throw new Error('Not logged in');
    }
  
    
    if (token) headers.Authorization = `Bearer ${token}`; //add "Authorization" to carry Bearer token
    
    const res = await fetch(path, { ...options, headers: headers}); // fetching

    // Token expired/invalid ->fetch will return 401
    if (res.status === 401 && redirectOn401) {
      if (isScoreSubmit) sessionStorage.setItem('pendingScore', options.body);
      const next = encodeURIComponent(location.pathname); //for come back to previous page later when done logging in
      location.href = `/login.html?next=${next}`;
      // for non-redirect cases, just throw so caller can show blank
      throw new Error('Unauthorized');
    }
  
    return res;
  }

  //Main game function
  const startGame = function(){
    //reset score, time, gameActive every game
    score = 0;
    timeLeft = COUNT_DOWN; //seconds
    pointButton.src = COCKROACH_NORMAL_IMG;// Reset the cockroach image to the normal state at the start of every game.

    //update the displays on screen at that time
    scoreDisplay.forEach(scoreScreen => {
      scoreScreen.textContent = score;
    })
    clockDisplay.textContent = timeLeft;

    //only show game screen and hide the others
    firstSection.style.display = 'none';
    lastSection.style.display = 'none';
    gameSection.style.display = 'flex';
    rankingSection.style.display = 'none';

    // updateTimer function will be called automatically every 1000 milliseconds (1 second)
    // NOTICE: it will continue running until we stop manually, so don't forget to stop it when the game done
    timerId = setInterval(updateTimer, 1000);
  }

  //Update time function, this function will be called every one second
  const updateTimer = function() {
    timeLeft--;
    clockDisplay.textContent = timeLeft;

    //end game when it reaches 0
    if (timeLeft <= 0) {
      endGame();
    }
  }

  //increase score function
  const increaseScore = function() {
    score++;
    scoreDisplay.forEach(scoreScreen => {
      scoreScreen.textContent = score;
    })
  }

  //end game 
  const endGame = function () {
    //reset the "save" button from disable from last saving (Reading function submitScore() to be clearer)
    saveButton.disabled = false; // enable it 
    saveButton.textContent = "Save Score"; //change it back to save score
    nameInput.value = ''; //clear the last input 

    //show up the replay button in "last-section"
    firstSection.style.display = 'none';
    lastSection.style.display = 'flex';
    gameSection.style.display = 'none';
    rankingSection.style.display = 'none';

    //stop the timer interval
    clearInterval(timerId);
  }

  //when player wants to submit their score
  const submitScore = async function(event) {
    //stop the page reload when submitting the form
    event.preventDefault();

    //create a json
    const json = {
      playerName: nameInput.value,
      score: score,
      game: GAME_KEY,
    }

    const body = JSON.stringify(json) //stringify the json before sending through internet
    
    //disable buttons while fetching
    saveButton.disabled = true;
    replayButton.disabled = true;

    try {
      const res = await apiFetch('/submit', {
        method: 'POST',
        body: body,
      }, { redirectOn401: true }); // not logged in? go to /login.html
  
      //test how sever repond
      const text = await res.text(); // for testing
      console.log('server response:', text); // for testing
    } catch(err) {
      console.error("submit failed:", err);
    } finally {
      replayButton.disabled = false; //enable "replay" button
      saveButton.textContent = "DONE!" // change content of "Save Score" button to "DONE!"
    }
    
  }

  // fetch data from server and build table in html
  const fetchAndDisplayRanking = async function () {
    
    scoreboardBody.innerHTML = ''; //clear old table and read for new one

    try {
      const response = await apiFetch(`/ranking?game=${encodeURIComponent(GAME_KEY)}`, {}, { redirectOn401: false }); // GET by default
      const data = await response.json(); //convert string to json object, data will be an "array" because in server we define so!

      // If not logged in or no data, leave blank (do nothing)
      if (!Array.isArray(data) || data.length === 0) return;

      //loop through each data element from data array from backend
      data.forEach((thisPlayer, index) => {
        //create new row for each player
        const row = document.createElement('tr');
        //fill row element with <td>
        row.innerHTML = `
          <td>${index + 1}</td>
          <td class="player-name-cell"><span class="player-name">${thisPlayer.name}</span></td>
          <td>${thisPlayer.score}</td>
        `
      const cell = document.createElement('td');
      
      //create edit button
      const editButton = document.createElement('button');
      editButton.textContent = "Edit";
      editButton.className = "edit-button";
      editButton.onclick = () => {makeNameEditable(row, thisPlayer.name, thisPlayer.id)}; // row is this row's id

      //create a delete button for each row of data table (each player)
      const deleteButton = document.createElement('button');
      deleteButton.textContent = "Delete"; //add text
      deleteButton.className = "delete-button"; //add class
      deleteButton.onclick = () => {deletePlayer(thisPlayer.id)};
      
      cell.appendChild(editButton);
      cell.appendChild(deleteButton);
      row.appendChild(cell);
      scoreboardBody.appendChild(row);
    });
    } catch (err) {
      console.error("something wrong in fetchAndDisplayRanking()", err);
    } 
  }

  // edit name then request to change
  const makeNameEditable = function (row, oldName, playerId) {
    alert("ONLY 'Name' allowed to edit. Hit 'ENTER' to save changes!"); //Send an alert to tell user how to save change

    const nameSpan = row.querySelector('.player-name');

    const input = document.createElement('input');
    input.type = "text";
    input.value = oldName; //this will be new name later when user type in 
    input.className = "edit-input"; //for styling later

    //Listen to "Enter" key
    input.addEventListener('keydown', (event)=>{
      if(event.key === 'Enter') {
        event.preventDefault(); // Stop default form submission
        saveNewName(oldName, input.value, playerId); // function to process new name (save in BACK-END)
      }
    })

    nameSpan.replaceWith(input); //replace the <span> with the <input> (input) when it hears "click"
    input.focus(); //make the cursor focus inside the <input>
  }

  const saveNewName = async function (oldName, newName, playerId) {
    if(oldName === newName || !newName) { //if newName is the same as oldName and newName is blank
      fetchAndDisplayRanking(); //just reload the page, NO NEED to call backend
      return;
    }

    try {
      // await fetch('/update', {
      //   method: 'POST',
      //   headers: {'Content-Type' : 'application/json'},
      //   body: JSON.stringify({
      //     oldName: oldName, 
      //     newName: newName, 
      //     game: 'Squish-the-cockroach'
      //   })
      // });
      await apiFetch('/updateById', {
        method: 'POST',
        body: JSON.stringify({
          newName,
          playerId
        })
      }, { redirectOn401: true }
      )
    } catch (err) {
      console.error("somthing wrong with update input name", err);
    }

    await fetchAndDisplayRanking(); //refresh the table to show up new data fetched
  }

  // request to Delete a player to server
  const deletePlayer = async function (playerId) {
    //send request to "delete" a user to the server
    // await fetch("/delete", { 
    //   method: 'POST',
    //   headers: {'Content-Type' : 'application/json'},
    //   body: JSON.stringify({name: playerName}), //stringify an object contaning "name" before send to the server
    // })
    try {
      await apiFetch('/deleteById', {
        method: 'POST',
        body: JSON.stringify({playerId: playerId}),
      }, { redirectOn401: true });
    } catch (err) {
      console.error('deletePlayer() failed:', err);
    }

    //Then, show up a new table to new after delete by calling this fetchAndDisplayRanking() again to load and show new table
    await fetchAndDisplayRanking(); 
  }

  //eventListener to control the whole screen flow of the game
  backNav.addEventListener('click', showPlayButtonScreen); //play a new game
  rankingNav.addEventListener('click', showRankingScreen);

  playButton.addEventListener('click', startGame); //start the game when player hit "play" button
  replayButton.addEventListener('click', startGame); // start the game again when the player hits replay button
  // saveButton.addEventListener('click', submitScore); // submit the score 
  const saveForm = document.querySelector('.last-section form');
  saveForm.addEventListener('submit', submitScore); // submit the score 
  
  
  //cockroach image swap logic
  pointButton.addEventListener('mousedown', () => {
      pointButton.src = COCKROACH_SQUASHED_IMG;
  });

  pointButton.addEventListener('mouseup', () => {
    pointButton.src = COCKROACH_NORMAL_IMG;
  });

  pointButton.addEventListener('click', increaseScore); //increase score when player hit the button
}