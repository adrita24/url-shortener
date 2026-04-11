const mongoose=require("mongoose");

const userSchema= new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    name: String,
    urlCount: {
        type: Number,
        default: 0
    },
    isPremium:{
        type: Boolean,
        deafult: false
    }
});

module.exports = mongoose.model("User", userSchema);