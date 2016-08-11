'use strict';

// Service that allows us to keep data in the localStorage
myApp.service("LocalStorage", function(){
    return {
        // Gets the data from the local storage for the given key parameter
        getFromLocalStorage: function(key) {
          return localStorage.getItem(key);
        },
        // Saves the data 'data' to the local storage for the given 'key'
        saveToLocalStorage: function(key, data) {
            localStorage.setItem(key, JSON.stringify(data));
        },
        // Removes the data from the local storage for the given 'key' parameter
        removeFromLocalStorage: function(key) {
            localStorage.removeItem(key);
        }  
    };
});