// This is middle man to verify token and userID

/*1/ token will be structured as HEADERS - PAYLOAD - TOKEN #
    HEADERS: contains "Authorization: Bearer <token series>" -> need to remove "Bearer" to retrieve the token string

    PAYLOAD: will contain designed info that needs to be saved and "iat" and "exp"
        {
            "_id": "123456",
            "iat": 1714053132,
            "exp": 1714139532
        } 

    TOKEN #: will be the token number
*/

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// // const publicKey = fs.readFileSync('./public.key', 'utf8');
// const publicKey = fs.readFileSync(path.resolve(__dirname, '..', 'public.key'), 'utf8');

const publicKey = (process.env.PUBLIC_KEY || '').replace(/\\n/g, '\n');

/* Verify token middleware function
- Verifies that a user is logged in and provides a valid token (Authentication only).
- Use this to protect a route and only allow logged-in users. But don’t care who the user is, just that they’re authenticated.*/
const verifyWebToken = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader) return res.status(401).json('Missing Authorization header');

    const token = authHeader.split(" ")[1]; // (1) Remove 'Bearer' From Authorization: Bear <token series>
    console.log(token); //testing 
    
    jwt.verify(token, publicKey, { algorithms: ['RS256'] }, (err, decodedTokenInfo) => { //if false -> err, otherwise, sucess-> give us a decode payload (named as decodedTokenInfo)
        // "decodedTokenInfo" here is payload like (1) or to make it simple, just care about {_id, isAdmin} from token before
        // FAIL
        if (err) {
            return res.status(403).json("Token invalid!");
        }
        // console.log(req); // testing print out whole request

        //SUCESS
        req.user = decodedTokenInfo; // "req.user" means creating a new property named "user" on "req" to save decoded token info (which is an object   ). We can use this "req.user" later like "req.user.id"
        next(); //pass to the whatever next function or http (get, post...) call it
    });
};

// if missing/invalid token; just skips attaching req.user and return []. Use it for the case if user doesn't log-in, they will see nothing other than basic html
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader) return next();

    const token = authHeader.split(" ")[1]; // (1) Remove 'Bearer' From Authorization: Bear <token series>
    console.log(token); //testing 

    jwt.verify(token, publicKey, { algorithms: ['RS256'] }, (err, decodedTokenInfo) => { //if false -> err, otherwise, sucess-> give us a decode payload (named as decodedTokenInfo)
        // "decodedTokenInfo" here is payload like (1) or to make it simple, just care about {_id, isAdmin} from token before
        // FAIL
        if (err) {
            return res.status(403).json("Token invalid!");
        }
        // console.log(req); // testing print out whole request

        //SUCESS
        req.user = decodedTokenInfo; // "req.user" means creating a new property named "user" on "req" to save decoded token info (which is an object   ). We can use this "req.user" later like "req.user.id"
        next(); //pass to the whatever next function or http (get, post...) call it
    });
}

const verifyTokenAndUserID = (req,res,next) =>{
    //verify web token first
    verifyWebToken(req,res,()=>{//then "next" function
        if(req.user.id === req.params.id) { //"req.user" is a human readable info saved from jwt function above and read (2) for "params"
            // res.status(200).json("your new profile info is saved") //will be conflict with other HTTP sending -> uncomment to know
            next();
        } else {
            res.status(403).json("This is not you, please verify yourself first!!!");
        }
    }) 
};

module.exports = {verifyWebToken, verifyTokenAndUserID, optionalAuth};