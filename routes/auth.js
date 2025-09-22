const router = require("express").Router();
const User = require("../models/User");
const CryptoJS = require("crypto-js");
const jwt = require('jsonwebtoken');

// Load RSA private key once
// const privateKey = fs.readFileSync('./private.key', 'utf8');

// convert \n to real newlines
const privateKey = (process.env.PRIVATE_KEY || '').replace(/\\n/g, '\n');

//Register -- using Postman to create a valid user for now
router.post("/register", async(req, res)=> {
    try {
        const { username, email, password, displayName } = req.body;
        if (!username || !email || !password) {
        return res.status(400).json('username, email, and password are required');
        }

        const newUser = new User(
            {
                username: username,
                email: email,
                password: CryptoJS.AES.encrypt(password, process.env.SEC_KEY).toString(), //encrypted password before saved to database
                displayName: displayName,
            }
        );
        const savedUser = await newUser.save(); //save new user to database
        res.status(201).json(savedUser); //201: successful added
    } catch (err) {
        res.status(500).json(err?.message);
        // console.log(err) //testing
    }
})

//Log in
router.post("/login", async(req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json('username and password are required');
        
        //finding username in database
        const foundUser = await User.findOne({username}); //returned user object info from mongoose
        if(!foundUser) return res.status(401).json("wrong username or password");

        //decrypt password in database to compare
        const bytes = CryptoJS.AES.decrypt(foundUser.password, process.env.SEC_KEY);
        const decryptPassword = bytes.toString(CryptoJS.enc.Utf8);

        // console.log(req.body.password); HTTPS will encrypt the info that send over it
        
        //password not matching
        if (decryptPassword !== req.body.password) return res.status(401).json("wrong username or password");
        
        //if everything matches (Successfully log-in) -> send back a token for user
        //grant a token (asynchronously using RSA) - to save data in "payload" in ecrypted form
        jwt.sign(
            { //payload
                id: String(foundUser._id)
            },
            privateKey,
            {algorithm: 'RS256', expiresIn: "1d"},
            (err,token) => { //when gain the token
                if (err)
                    return res.status(500).json("cannot do jwt. Signing error!");
                
                //object destructuring => extract password and others => NOT send the password
                const {password, ...others} = foundUser.toObject(); //"toObject()" helps filtered out unrelated info, get rid of it to see
                res.status(200).json({"user": others, "token": token}); //then, just sending others (NOT including password) + token (already encrypted). 
                
                // console.log("JWT token created:", token); //testing
            }
        );
    } catch(err) {
        res.status(500).json(err);
    }
})

module.exports = router;