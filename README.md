## MY PROJECT RENDER:
https://squish-the-coach.onrender.com


## Squeesh The CockRoach
You just need to follow instruction/button on screen to play this game. You click on the cockroach image to earn points - each mouse click is one (1) point. At the end of each game, player can save their name and the players can view their ranking by clicking on "Ranking" button at the top-left corner and click "Game" button to go back to game.

- Goal of this application is for my self studying about web technologies. In the other hand, it's for other people to enjoy clicking and seek simple relaxation.

- The most challeng I face is design the routes and what data to save/ pass over the paths. The next challenge will be OAuthication and how to lead the user to a login page. The last challenge is how to save data for the moment of before and after user login. 

- I choose username/password login as an authentication because it seems easier to me. And I also use JWT as an authorization.

- I used tailwind for CSS framework for my "Login" page because tailwind have a really good document and it's simple to set up and use. 

- Middleware package that I use:
  + "express.json()": parses application/json request bodies into req.body

  + "express.urlencoded({ extended: true })": parses HTML form posts (application/x-www-form-urlencoded) into req.body

  + "express.static(path.join(__dirname, 'public'))": serves the static files (HTML/CSS/JS/images) from /public.

  + "app.use('/api/auth', require('./routes/auth'))": mounts your register/login endpoints as a sub-app.

  + verifyWebToken (custom): verifies a JWT signed with RS256 with a public key, on success sets req.user = { id }, otherwise responds 401 (used to protect /submit, /updateById, /deleteById). 

  + optionalAuth (custom): tries to verify the JWT. If it’s missing/invalid, it just continues without req.user (used on /ranking so unauthenticated requests return an empty list instead of an error).


## Acheivements
***Technical***
1) I implement OAuth authentication using username/password. Here is the two sets of username/password I already created for testing purpose

username: tester1
password: 12345

username: tester2
password: 12345

2) I deployed it successfully on Vercel. And here is the link: squish-the-cockroach.vercel.app

3) I get 100% for all tests requirement on PageSpeed (Google lighthouse)

