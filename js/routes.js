'use strict';

var myApp = angular.module('myApp', ['ngRoute', 
            // Ui.Bootstrap is used for the modal windows
            'ui.bootstrap',
            // We include this modules to be able to use the video player library.
            // For more info about the video player go here: http://www.videogular.com/
            "ngSanitize",
			"com.2fdevs.videogular",
			"com.2fdevs.videogular.plugins.controls",
			"com.2fdevs.videogular.plugins.overlayplay",
			"com.2fdevs.videogular.plugins.poster"]);

myApp.config(function($routeProvider) {
    // This is the route for the the editing videos
    $routeProvider.when(
    	'/view1', 
    	{
    		templateUrl: 'partials/partial1.html', 
    		controller: 'EditVideosCtrl'
    	});
    // This is the route for the preview-only videos
    $routeProvider.when(
    	'/view2', 
    	{
    		templateUrl: 'partials/partial2.html', 
    		controller: 'ViewVideosCtrl'
    	});
    $routeProvider.otherwise(
        {
            redirectTo: '/view1'
        }); 
});
