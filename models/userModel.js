const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fname: {
        type: String,
        required: [true, 'Firstname Field is required']
    },
    lname: {
        type: String,
        required: [true, 'Lastname Field is required']
    },
    email: {
        type: String,
        required: [true, 'Email Field is required']
    },
    password: {
        type: String,
        required:[true, 'Password fields is required'],
        minlength: [8, 'atleast 8 characters required']
    },

});

const User = mongoose.model('User', userSchema);

module.exports = User;