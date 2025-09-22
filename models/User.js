// Schema for a user
const mongoose = require("mongoose");

const UserSchema = mongoose.Schema (
    {
        username: {type: String, required: true, unique: true},
        email: {type: String, required: true, unique: true},
        password: {type: String, required: true},
        displayName: {type: String},
    },
    { timestamps: true } //auto add createdAt and updatedAt
);

module.exports = mongoose.model("User", UserSchema);