var express = require('express');
var router = express.Router();
const Product = require('../models/productsModel');

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

router.get('/create_product',isAuthenticated(), (req,res)=>{
    res.render('./product/create', {error: null, layout: 'layouts/user-layout' });
});

router.post('/create_product',isAuthenticated(), (req, res) => {
    const { name, description, price } = req.body;
    const product = new Product({
        name,
        description,
        price
    });
    const validationError = product.validateSync();
    if (validationError) {
        res.render('./product/create', { error: validationError.errors });
    } else {
        product.save().then(() => {
                res.redirect('/products/retrieve_product');
            }).catch((error) => {
                console.error(error);
            });
    }
});

router.get('/retrieve_product',isAuthenticated(), (req, res) => {
    Product.find().then(data => {
      res.render('./product/retrieve',{data:data, layout: 'layouts/user-layout' })
    }).catch(error => {
      console.error(error);
    });  
});

router.get('/update_product/:id',isAuthenticated(), (req , res) =>{
    const productId = req.params.id;
   Product.findById(productId).lean().then(product =>{
        res.render('./product/update',{product:product,error: null, layout: 'layouts/user-layout'})
    }).catch(error => {
        console.error(error);
      });
});

router.post('/update_product/:id',isAuthenticated(), (req, res) => {
    const productId = req.params.id;
    const { name, description, price } = req.body;
    const product = new Product({ name, description, price })
    const validationError = product.validateSync();
    if (validationError) {
        // If there are validation errors, re-render the form with error messages
    res.render('./product/update', {product:product, error: validationError.errors});

    } else {
    Product.findByIdAndUpdate(
        productId,
        { name, description, price }
      )
        .then(() => {
          res.redirect('/products/retrieve_product'); // Redirect to the product list after updating
        })
        .catch(error => {
          console.error(error);
        });
    }
});

router.get('/delete_product/:id',isAuthenticated(), (req , res) =>{
    const productId = req.params.id;
   Product.findById(productId).then(product =>{
        res.render('./product/delete',{product:product, layout: 'layouts/user-layout'})
    }).catch(error => {
        console.error(error);
      });
});

router.post('/delete_product/:id',isAuthenticated(), (req, res) =>{
    const productId = req.params.id;
    Product.findByIdAndDelete(productId)
        .then(() => {
          res.redirect('/products/retrieve_product'); // Redirect to the product list after deleting
        })
        .catch(error => {
          console.error(error);
        });
});

router.get('/search_product',isAuthenticated(), (req, res) => {
  const query = req.query.q; // Get the search query from the query parameters
  // Perform a case-insensitive search on the 'name' field using regular expression
  Product.find({ name: { $regex: new RegExp('^' + query, 'i') } })
      .then(products => {
          res.render('./product/search', { products: products, query: query, layout: 'layouts/user-layout' });
      })
      .catch(error => {
          console.error(error);
          res.status(500).send('Internal Server Error');
      });
});



module.exports = router;


