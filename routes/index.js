var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const { validationResult ,check } = require('express-validator');
const {validateEmail,validatePassword} = require('./customValidators')
const User = require('../models/userModel');

const isAuthenticated = (allowedDomain) => (req, res, next) => {
  // Check if the user session exists and contains userEmail
  if (req.session && req.session.userEmail) {
    const userEmail = req.session.userEmail;

    // Log userEmail to check its value
    console.log('User email:', userEmail);

    // Check if allowedDomain is provided and if userEmail ends with it
    if (!allowedDomain || userEmail.endsWith(allowedDomain)) {
      // User is authenticated and has the allowed email domain or no domain is specified, proceed to the next middleware
      return next();
    } else {
      // User doesn't have the allowed email domain, redirect to an unauthorized page
      return res.status(403).send('unauthorized'); // 403 Forbidden status
    }
  }

  // Log if userEmail is not set
  console.log('User email not found in session:', req.session);

  // User is not authenticated, redirect to the login page
  res.redirect('/login');
};

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'MedStore' });
});

router.get('/signup', (req, res)=>{
  res.render('signup-form',{message:null,error:null})
})

router.post('/signup', (req, res)=>{
  const { fname, lname, email, password, confirmPassword } = req.body;
  const user = new User({ fname,lname,email,password })
  const validationError = user.validateSync();
 
  // Check if the password and confirm password match
  if (password !== confirmPassword) {
    return res.render('signup-form',{message:'Password and Confirm Password must match',error:null});
  }

   // Check all fields are not empty
  if (validationError){

    return res.render('signup-form',{message:null,error:validationError.errors});

  }

  // Custom validation for password
  if (req.body.password && req.body.password.length < 8) {
    return res.render('signup-form', { message: 'Password should be at least 8 characters long', error: null });
  }

  // Check if the username is already taken
  User.findOne({ email })
    .then(existingUser => {
      if (existingUser) {
        return res.render('signup-form',{message:'Email already taken',error:null});
      }else{
          //hash the password using bcrypt
         return bcrypt.hash(password,10)
      }
    }).then(hashedPassword => {

     // Create a signup user in MongoDB
     const signupUser = new User({ fname, lname, email, password:hashedPassword });
     return signupUser.save();


    }).then(() => {
      // Redirect to a success page or login page
      res.redirect('/login');
    }).catch(error => {
      console.error(error);
   
    });

});

router.get('/login', (req, res) => {
  res.render('login',{ errors: [],message:null })
});

router.post('/login', [
  // Add custom validation that required/imported
    validateEmail,
    validatePassword
  ], function (req, res) {
    // Access the validation errors from the request object
    const errors = req.validationErrors || [];
 
    // Validate the request
    const validationResultErrors = validationResult(req);
    if (!validationResultErrors.isEmpty()) {
      // Merge the errors from validation result into the existing errors
      errors.push(...validationResultErrors.array());
    }
 
    if (errors.length > 0) {
      // There are validation errors, render the form with errors
      res.render('login', { errors, message:null });
    } else {
      const { email, password } = req.body;
      let foundUser; // Declare foundUser here
 
      User.findOne({ email })
      .then(user => {
        console.log(user);
        if (!user) {
          return res.render('login', { message: 'Incorrect Email Address.',errors: [] });
        }
        foundUser = user; // Assign user to foundUser
        return bcrypt.compare(password, user.password);
      })
      .then(isPasswordValid => {
        if (!isPasswordValid) {
          return res.render('login', { message: 'Incorrect password.',errors: [] });
        }
 
        // Set user's ID and email in the session
        req.session.userId = foundUser._id;
        req.session.userEmail = foundUser.email;
        res.render('home',{fname: foundUser.fname, layout: 'layouts/user-layout' });
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('Internal Server Error');
      });
    }
});

router.get('/home', isAuthenticated(), (req,res)=>{
  const { fname, lname, email, password, confirmPassword } = req.body;
  const user = new User({ fname,lname,email,password })
  foundUser = user; // Assign user to foundUser
  res.render('home',{fname: foundUser.fname, layout: 'layouts/user-layout' });
});


//route for logout
router.get('/logout' ,(req,res)=>{
  req.session.destroy((err) =>{
    if (err){
      console.log(err);
      res.send('Error')
    }else{
      res.redirect('/')
    }
  });
});



module.exports = router;

