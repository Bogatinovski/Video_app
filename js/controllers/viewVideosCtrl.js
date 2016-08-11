(function(){
    'use strict';
    angular.module("myApp").controller("ViewVideosCtrl", function($scope, $timeout, VideoService, $sce){
    $scope.playerReady = playerReady;
    $scope.video = VideoService.getVideo();
    $scope.videos = VideoService.getFragments();
    $scope.currentFragment;
    $scope.playMainVideo = playMainVideo; 
    $scope.playFragment = playFragment;
    $scope.onUpdateTime = onUpdateTime;
    $scope.next = next;
    $scope.previous = previous;
    $scope.isPlayingMainVideo = false;
    $scope.waitTimeBeforeNext = 3000;
    $scope.isLoadingVideo = false;
    $scope.filterValue = "";
    $scope.filterVideos = filterVideos;
    $scope.onHotkeyPressed = onHotkeyPressed;
    $scope.config = {
        sources: [],
        theme: "/node_modules/videogular-themes-default/videogular.css"
    };
        
    // Array of $timeout promise objects for the next and the previous functionality that waits 3 seconds before changing the video fragment
    // We use this promise objects to cancel the $timeout call on the destruction of the controller $scope.$on('$destroy')
    var timeoutCallbacks = [];

    function onHotkeyPressed(e){
        // Left
        if(e.which == 37){
            previous();
        }
        // Up
        else if(e.which == 38){
            previous();
        }
        // Right
        else if(e.which == 39){
            next();
        }
        // Down
        else if(e.which == 40){
            next();
        }
    }

    function playerReady($API){
        $scope.api = $API;

        if($scope.video.url){
            playMainVideo();

            $timeout(function(){
                $scope.endTime = $scope.api.totalTime/1000;
            }, 300);
        }
    }

    function playMainVideo(){
        $scope.api.stop();
        $scope.config.sources = [{src:$sce.trustAsResourceUrl($scope.video.url), type: "video/mp4"}];

        $scope.startTime = 0;
        $scope.endTime = $scope.api.totalTime/1000;
        $scope.isPlayingMainVideo = true;
        $scope.currentFragment = null;
        $timeout(function(){
            $scope.api.play();  
        }, 300);   
    }

    function playFragment(video){
        $scope.api.stop();
        $scope.config.sources = [{src:$sce.trustAsResourceUrl(video.url), type: "video/mp4"}];
        $scope.currentFragment = video;
        $scope.startTime = video.startTime;
        $scope.endTime = video.endTime;
        $scope.isPlayingMainVideo = false;
        $timeout(function(){
            $scope.api.play();
        }, 300);
    }

    function onUpdateTime($currentTime, $duration){
        if($scope.isPlayingMainVideo && $currentTime >= $duration && $scope.videos[0]){
            $scope.isLoadingVideo = true;
            $timeout(function(){
                playFragment($scope.videos[0]);
                $scope.isLoadingVideo = false;
            }, $scope.waitTimeBeforeNext);
            return;
        }
        else if(!$scope.isPlayingMainVideo && $scope.currentFragment && $currentTime >= $scope.currentFragment.endTime){
            next();
        }
    }

    // Plays the next video fragment from the playlist
    function next(){
        // Don't change the video if there already another video loading. Only change it after the 3 seconds period have passed
        if($scope.isLoadingVideo){
            return false;
        }
        
        var nextFragment;
        $scope.api.stop();
        
        // Find the fragments that are available in the playlist due to possible filtering
        var fragments = getFragmentsFromPlaylist();
 
        // Find the next fragment from the playlist that will be played
        if($scope.isPlayingMainVideo && fragments.length > 0 || !$scope.isPlayingMainVideo && !$scope.currentFragment && fragments.length >0 ){
            nextFragment = fragments[0];
        }
        else{
            nextFragment = VideoService.getNextFragment($scope.currentFragment, fragments);
        }

        // Show the loader animation
        $scope.isLoadingVideo = true;
        var promise = $timeout(function(){
            timeoutCallbacks.splice(timeoutCallbacks.indexOf(promise), 1);
            // Hide the loader animation
            $scope.isLoadingVideo = false;
            // If we found the next fragment that needs to be played - play it
            if(nextFragment){
                $scope.currentFragment = nextFragment;
                playFragment(nextFragment);
            }
            // Else play the main video
            else{
                $scope.currentFragment = null;
                playMainVideo();   
            }
        }, $scope.waitTimeBeforeNext);
        timeoutCallbacks.push(promise);
    }

    // Plays the previous video fragment from the playlist
    function previous(){
        // Don't change the video if there already another video loading. Only change it after the 3 seconds period have passed
        if($scope.isLoadingVideo){
            return false;
        }
        
        var previousFragment;
        $scope.api.stop();
        
        // Find the fragments that are available in the playlist due to possible filtering
        var fragments = getFragmentsFromPlaylist();

        // Find the previous fragment from the playlist that will be played
        if($scope.isPlayingMainVideo && fragments.length > 0){
            previousFragment = fragments[fragments.length - 1];
        }else if($scope.currentFragment){
            previousFragment = VideoService.getPreviousFragment($scope.currentFragment, fragments);
        }

        // Show the loader animation
        $scope.isLoadingVideo = true;
        var promise = $timeout(function(){
            timeoutCallbacks.splice(timeoutCallbacks.indexOf(promise), 1);
            // If we found the previous fragment that needs to be played - play it
            if(previousFragment){
                $scope.currentFragment = previousFragment;
                playFragment(previousFragment);
            }
            // Else play the main video
            else{
                $scope.currentFragment = null;
                playMainVideo();
            }

            // Hide the loader animation
            $scope.isLoadingVideo = false;
        }, $scope.waitTimeBeforeNext);
        timeoutCallbacks.push(promise);
    }
        
    function getFragmentsFromPlaylist(){
        // If we have nothing in the filter value return all the fragments
        if($scope.filterValue.length < 1){
            return VideoService.getFragments();
        }
        var result = [];
        var filters = $scope.filterValue.split(" ");
        for(var i=0; i<$scope.videos.length;i++){
            var video = $scope.videos[i];
            var isValid = false;
            for(var j=0; j<video.tags.length; j++){
                var tags = video.tags;

                for(var k=0; k<filters.length; k++){
                    if(tags[j].toLowerCase().indexOf(filters[k]) > -1){
                        result.push(video);
                        isValid = true;
                        break;
                    }
                }
                if(isValid)
                    break;
            }
        }
        return result;
    }

    function filterVideos(item){
        if($scope.filterValue.length > 0){
            for(var i=0; i<item.tags.length; i++){
                var filterTags = $scope.filterValue.split(" ");
                for(var j=0; j<filterTags.length; j++){
                    if(item.tags[i].toLowerCase().indexOf(filterTags[j].toLowerCase()) > -1){
                        return true;
                    }
                }
            }
            return false;
        }
        return true;
    }
        
        $scope.$on("$destroy", function(){
            for(var i=0; i<timeoutCallbacks.length; i++){
                $timeout.cancel(timeoutCallbacks[i]);
            }
        });
});
})();