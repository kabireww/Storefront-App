/*********************************************************************************
*  WEB322 – Assignment 03
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part 
*  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Kabir Donda Student ID: 140630229 Date: 15 February,2024

*  Cyclic Web App URL: 
* 
*  GitHub Repository URL: https://github.com/kabireww/Storefront-App
*
********************************************************************************/ 
const express = require("express")
const exphbs = require('express-handlebars');
const Handlebars = require('handlebars'); // Import Handlebars module

const app = express() 
const HTTP_PORT = process.env.PORT || 8080;

// Register the safeHTML helper
Handlebars.registerHelper('safeHTML', function(options) {
  return new Handlebars.SafeString(options.fn(this));
});

// Middleware function for setting active routes and viewing categories
app.use(function(req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.)/, "") : route.replace(/\/(.)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
})

// Set up Handlebars engine with custom helpers
const hbs = exphbs.create({ 
  extname: ".hbs",
  helpers: {
    navLink: function (url, options) {
      return (
        '<li class="nav-item"><a ' +
        (url == app.locals.activeRoute ? ' class="nav-link active" ' : ' class="nav-link" ') +
        ' href="' +
        url +
        '">' +
        options.fn(this) +
        "</a></li>"
      );
    },
    equal: function (lvalue, rvalue, options) {
      if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
      if (lvalue != rvalue) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    }
  }
});

app.engine('hbs', hbs.engine); 
app.set('view engine', 'hbs');


const path = require('path');
const storeService = require('./store-service');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');


cloudinary.config({ 
  cloud_name: 'dlktxcibp', 
  api_key: '787174983966466', 
  api_secret: 'FbFv2Dea5uBBD8mNkii_L2O6mi0',
  secure: true
});

const upload = multer(); 

// Define route POST /items/add
app.post('/items/add', upload.single('featureImage'), (req, res) => {
  if (req.file) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    async function uploadToCloudinary(req) {
      try {
        let result = await streamUpload(req);
        console.log(result);
        processItem(result.secure_url);
      } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        processItem('');
      }
    }

    uploadToCloudinary(req);
  } else {
    processItem('');
  }

  function processItem(imageUrl) {
    
    // Get current server time
    const currentDate = new Date();
// Format date as YYYY-MM-DD
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  const postDate = `${year}-${month}-${day}`;


    req.body.featureImage = imageUrl;
    req.body.postDate = postDate;

    // Convert category to integer
    req.body.category = parseInt(req.body.category);

    // Add a new store item.
    storeService.addItem(req.body)    
      .then(() => {
        // Redirect the user to the /items route after successfully adding the store item.
        res.redirect('/items');
      })
      .catch(error => {
        console.error('Error adding item:', error);
        // Send a 500 status code with an error message to the client if an error occurs.
        res.status(500).send('Error adding item');
      });
  }
});

// Serve static files from the 'public' folder
app.use(express.static("public"));

// Redirect "/" route to "/about"
app.get('/', (req, res) => {
    res.redirect('/shop');
  });

// Route setting for "/about"
app.get('/about', (req, res) => {
   res.render('about');
  });

// Route setting for "/items/add"
app.get('/items/add', (req, res) => {
  res.render('addItem');
});

app.get("/shop", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "post" objects
    let items = [];

    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category
      items = await storeService.getPublishedItemsByCategory(req.query.category);
    } else {
      // Obtain the published "items"
      items = await storeService.getPublishedItems();
    }

    // sort the published items by postDate
    items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // get the latest post from the front of the list (element 0)
    let post = items[0];

    // store the "items" and "post" data in the viewData object (to be passed to the view)
    viewData.items = items;
    viewData.post = post;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await storeService.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  // render the "shop" view with all of the data (viewData)
  res.render("shop", { data: viewData });
});

app.get('/shop/:id', async (req, res) => {

  // Declare an object to store properties for the view
  let viewData = {};

  try{

      // declare empty array to hold "item" objects
      let items = [];

      // if there's a "category" query, filter the returned posts by category
      if(req.query.category){
          // Obtain the published "posts" by category
          items = await storeService.getPublishedItemsByCategory(req.query.category);
      }else{
          // Obtain the published "posts"
          items = await storeService.getPublishedItems();
      }

      // sort the published items by postDate
      items.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

      // store the "items" and "item" data in the viewData object (to be passed to the view)
      viewData.items = items;

  }catch(err){
      viewData.message = "no results";
  }

  try{
      // Obtain the item by "id"
      viewData.post = await storeService.getItemById(req.params.id);
  }catch(err){
      viewData.message = "no results"; 
  }

  try{
      // Obtain the full list of "categories"
      let categories = await storeService.getCategories();

      // store the "categories" data in the viewData object (to be passed to the view)
      viewData.categories = categories;
  }catch(err){
      viewData.categoriesMessage = "no results"
  }

  // render the "shop" view with all of the data (viewData)
  res.render("shop", {data: viewData})
});
  
// Route setting for "/items"
app.get('/items', (req, res) => {
     // Extract query parameters
     const { category, minDate } = req.query;

     // Check if category query parameter is present
     if (category) {
         // Filter items by category using storeService
         storeService.getItemsByCategory(category)
             .then(data => res.render("items", { items: data })) 
             .catch(err => res.render("posts", { message: "no results" })); 
     }
     // Check if minDate query parameter is present
     else if (minDate) {
         // Filter items by minimum date using storeService
         storeService.getItemsByMinDate(minDate)
             .then(data => res.render("items", { items: data })) 
             .catch(err => res.render("posts", { message: "no results" })); 
     }
     // If no query parameters are present, return all items
     else {
         storeService.getAllItems()
             .then(data => res.render("items", { items: data })) 
             .catch(err => res.render("posts", { message: "no results" })); 
     }
  });

  // Route setting for "/item/value"
app.get('/item/:id', (req, res) => {
  const itemId = req.params.id;

  // Get item by id using storeService
  storeService.getItemById(itemId)
      .then(item => {
          if (item) {
              res.json(item);
          } else {
              res.status(404).json({ message: 'Item not found' });
          }
      })
      .catch(err => res.status(500).json({ message: err }));
});


 // Route setting for "/categories"
 app.get('/categories', (req, res) => {
    storeService.getCategories()
        .then(data => res.render("categories", { categories: data }))
        .catch(err => res.render("categories", { message: "no results" }));
  });

  
  // Unmatched route - 404 error
  app.use(function(req, res) {
    //res.status(404).sendFile(path.join(__dirname, '/views/404.html'));   
    res.render('404');
  })


//setup http server to listen on HTTP_PORT
app.listen(HTTP_PORT, onHttpStart);

function onHttpStart() {
    console.log("Express http server listening on: " + HTTP_PORT);
    
    // Initialize the storeService
    return storeService.initialize()
        .then(function (data) {
            console.log(data);
        })
        .catch(function (err) {
            console.log(err);
        });
}