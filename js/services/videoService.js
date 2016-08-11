'use strict';

// This service is used for all kind of manipulation with the videos data
myApp.service("VideoService", function (LocalStorage) {
    // The main video object
    var video = {};
    
    // The array with the video fragments from the main video
    var fragments = [];
    
    // Id that we assign to every fragment that we create
    var currentId = 0;
    
    loadDataFromLocalStorage();
    
    return {
       getVideo: function(){
           return video;
       },
        // Sets the video object and resets the currentId and the fragments that we had previously created
        setVideo: function(v){
            video = v;
            currentId = 0;
            fragments = [];
            LocalStorage.saveToLocalStorage("video", v);
            LocalStorage.saveToLocalStorage("currentId", currentId);
            LocalStorage.saveToLocalStorage("fragments", fragments);
        },
        getFragments: function(){
            return fragments;
        },
        // Add new fragment to the array of fragments and save it to the localStorage
        addFragment: function(f){
            f.id = ++currentId;
            fragments.push(f);
            LocalStorage.saveToLocalStorage("fragments", fragments);
            LocalStorage.saveToLocalStorage("currentId", currentId);
        },
        // Remove fragment from the array of fragments and save the array to the localStorage
        removeFragment: function(f){
            for(var i=0; i<fragments.length; i++){
                if(fragments[i].id == f.id){
                    fragments.splice(i, 1);
                    break;
                }
            }
            LocalStorage.saveToLocalStorage("fragments", fragments);
        },
        // Update fragment from the array of fragments and save the array to the localStorage
        updateFragment: function(f){
            for(var i=0; i<fragments.length; i++){
                if(fragments[i].id == f.id){
                    fragments[i] = f;
                    LocalStorage.saveToLocalStorage("fragments", fragments);
                    break;
                }
            }  
        },
        // Find the next fragment in the array for the given fragment as parameter 'f'
        getNextFragment: function(f, fragments){
            for(var i=0; i<fragments.length; i++){
                if(fragments[i].id == f.id && i<fragments.length-1){
                    return fragments[i+1];
                }
                else if(fragments[i].id == f.id && i == fragments.length -1){
                    return null;
                    //return fragments[0];
                }
            }
        },
        // Find the previous fragment in the array for the given fragment as parameter 'f'
        getPreviousFragment: function(f, fragments){
            if(fragments.length < 2){
                return null;
            }
            for(var i=0; i<fragments.length; i++){
                if(fragments[i].id == f.id){
                    return fragments[i-1];
                }
            }  
            return null;
        },
        // Remove all fragments. This function is actually never used anywhere
        removeAllFragments: function(){
            fragments = fragments.splice(0, fragments.length);
            LocalStorage.removeFromLocalStorage("fragments");
        },
        // Remove all data from the localStorage. This is also never used anywhere
        removeAllData: function(){
            LocalStorage.removeFromLocalStorage("video");
            LocalStorage.removeFromLocalStorage("fragments");
            LocalStorage.removeFromLocalStorage("currentId");
        }
    };
    
    // Populate our properties with the data that we are keeping in our localStorage
    function loadDataFromLocalStorage(){
        if(LocalStorage.getFromLocalStorage("video")){
            video = JSON.parse(LocalStorage.getFromLocalStorage("video"));
        }
        if(LocalStorage.getFromLocalStorage("currentId")){
            currentId = parseInt(LocalStorage.getFromLocalStorage("currentId"));
        }
        if(LocalStorage.getFromLocalStorage("fragments")){
            fragments = JSON.parse(LocalStorage.getFromLocalStorage("fragments"));
        }
    }
});