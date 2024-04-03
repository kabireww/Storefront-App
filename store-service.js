const fs = require('fs');

var items = [];
var categories = [];


module.exports.initialize = function()
{
    return new Promise(function(resolve, reject)
    {
        try
        {
            fs.readFile('./data/items.json', function(err, data)
            {
                if(err) throw err;
                items = JSON.parse(data);
            });
            fs.readFile('./data/categories.json', function(err,data)
            {
                if(err) throw err;
                categories = JSON.parse(data);                
            });
        } catch(e) {
            reject("unable to read json file");
        }
        resolve("success to read json file");
    });
};

// Function to get all items
module.exports.getAllItems = function () {
    return new Promise(function (resolve, reject) {
      if (items.length === 0) {
        reject("No items returned");
      } else {
        resolve(items.slice()); // create a shallow copy of items
      }
    });
  };
  
   
  // Function to get all categories
  module.exports.getCategories = function () {
    return new Promise(function (resolve, reject) {
      if (categories.length === 0) {
        reject("No categories returned");
      } else {
        resolve(categories.slice()); // create a shallow copy of categories
      }
    });
  };

 // Function to add an item
 /* module.exports.addItem = function(itemData) {
    return new Promise((resolve, reject) => {
        // Set published property to false if undefined, otherwise set it to true
        itemData.published = itemData.published === undefined ? false : true;

        // Set id property to the length of the "items" array plus one
        itemData.id = items.length + 1;

        // Push the updated itemData object onto the "items" array
        items.push(itemData);

        // Resolve the promise with the updated itemData value
        resolve(itemData);
    });
  }; */

  // Function to add an item
module.exports.addItem = function(itemData) {
  return new Promise((resolve, reject) => {

      itemData.published = itemData.published === undefined ? false : true;


      itemData.id = items.length + 1;

      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      itemData.postDate = `${year}-${month}-${day}`;

      items.push(itemData);


      resolve(itemData);
  });
};


module.exports.getItemsByCategory = function(category) {
  return new Promise(function(resolve, reject) {
      const filteredItems = items.filter(item => item.category === parseInt(category));
      if (filteredItems.length > 0) {
          resolve(filteredItems);
      } else {
          reject("No results returned");
      }
  });
};


module.exports.getItemsByMinDate = function(minDateStr) {
  return new Promise(function(resolve, reject) {
      const filteredItems = items.filter(item => new Date(item.postDate) >= new Date(minDateStr));
      if (filteredItems.length > 0) {
          resolve(filteredItems);
      } else {
          reject("No results returned");
      }
  });
};

module.exports.getItemById = function(id) {
  return new Promise(function(resolve, reject) {
      const foundItem = items.find(item => item.id === parseInt(id));
      if (foundItem) {
          resolve(foundItem);
      } else {
          reject("No result returned");
      }
  });
};

module.exports.getPublishedItems = function () {
  return new Promise(function (resolve, reject) {
    const publishedItems = items.filter(item => item.published === true);

    if (publishedItems.length === 0) {
      reject("No published items returned");
    } else {
      resolve(publishedItems.slice()); 
    }
  });
};

module.exports.getPublishedItemsByCategory = function(category) {
  return new Promise(function(resolve, reject) {
      const publishedFilteredItems = items.filter(item => item.published === true && item.category === parseInt(category));

      if (publishedFilteredItems.length > 0) {
          resolve(publishedFilteredItems.slice()); 
      } else {
          reject("No published items returned for this category");
      }
  });
};
