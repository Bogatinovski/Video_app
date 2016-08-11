(function(){
    'use strict';
    
	angular.module("myApp").controller("EditVideosCtrl" ,function ($scope, $uibModal, $sce, $timeout, VideoService) {
        // The original full-length video that we are editing. Properties: { startTime:int, endTime:int, name:string }
        $scope.video = VideoService.getVideo();
  
        // Array of edited the clips (fragments). We keep this clips in the VideoService and that is where we get them from 
        $scope.videos = VideoService.getFragments();
        
        // This is just a reference to the video fragment that is currently playing
        $scope.currentFragment;
        
        // The startTime of the video in seconds
        $scope.startTime = 0;
        
        // The endTime of the video in seconds
        $scope.endTime = 0;
        
        // Boolean showing if we are playing the main video or we are playing a fragment. If true it means we are playing the main video. If false it means we are playing a fragment.
        $scope.isPlayingMainVideo = false;
        
        // The number of milliseconds that we wait before we automatically load the next video when the current video ends
        $scope.waitTimeBeforeNext = 3000;
        
        // This boolean is used for showing and hiding the loader animation
        $scope.isLoadingVideo = false;
        
        // The filter keyword for the fragments
        $scope.filterValue = "";
        
        // Boolean indication if the slider is initialized or not
        $scope.isSliderInitialized = false;
        
        // Array of $timeout promise objects for the next and the previous functionality that waits 3 seconds before changing the video fragment
        // We use this promise objects to cancel the $timeout call on the destruction of the controller $scope.$on('$destroy')
        var timeoutCallbacks = [];
        
        // Functions declarations
        $scope.uploadVideo = uploadVideo;
        $scope.playerReady = playerReady;
        $scope.playMainVideo = playMainVideo; 
        $scope.openSaveModal = openSaveModal;
        $scope.editFragment = editFragment;
        $scope.onSlide = onSlide;
        $scope.onStop = onStop;
        $scope.playFragment = playFragment;
        $scope.removeFragment = removeFragment;
        $scope.onUpdateTime = onUpdateTime;
        $scope.next = next;
        $scope.previous = previous;
        $scope.filterVideos = filterVideos;
        $scope.onHotkeyPressed = onHotkeyPressed;
        
        $scope.config = {
            sources: [],
            theme: "/node_modules/videogular-themes-default/videogular.css"
        };
        $scope.sliderApi = {};
        
        // Callback function that is called when we press some key on the keyboard. It is used for our custom 'hotkey' directive
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
            
            // Find the next fragment that will be played from the playlist
            if($scope.isPlayingMainVideo && fragments.length > 0 || !$scope.isPlayingMainVideo && !$scope.currentFragment && fragments.length >0 ){
                nextFragment = fragments[0];
            }
            else{
                nextFragment = VideoService.getNextFragment($scope.currentFragment, fragments);
            }
             
            // Show the loader animation
            $scope.isLoadingVideo = true;
            var promise = $timeout(function(){
                // Remove the promise object from our array of promise objects since we are executing the timeout callback
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
            // Add the promise object in our array of promise objects from timeout calls
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
                // Remove the promise object from our array of promise objects since we are executing the timeout callback
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
            // Add the promise object in our array of promise objects from timeout calls
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
        
        // Custom filter function that filters the fragments by their tag names. It can filter by multiple tags separated by one empty space.
        // Ex: "tag1 tag2" would find all fragments that have either tag1 or tag2 or both.
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
        
        // Callback function that is fired each time there is a progress on the video player. Basically it fires every second when a video is playing. This callback function is used in the 'videogular' directive
        // We use this callback to deretmine if the video that is currently playing ended by itself and if so, to automatically change to the next video after 3 seconds.
        function onUpdateTime($currentTime, $duration){
            // If we were playing the main video and it ended then automatically start the first fragment
            if($scope.isPlayingMainVideo && $currentTime >= $duration && $scope.videos[0]){
                $scope.isLoadingVideo = true;
                $timeout(function(){
                    playFragment($scope.videos[0]);
                    $scope.isLoadingVideo = false;
                }, $scope.waitTimeBeforeNext);
                return;
            }
            // If we were playing a fragment then automatically load and play the next fragment
            else if(!$scope.isPlayingMainVideo && $scope.currentFragment && $currentTime >= $scope.currentFragment.endTime){
                next();
            }
        }
        
        // Removes the fragment from the playlist
        function removeFragment(fragment){
            // If we are trying to remove the fragment that is currently playing we need to find the next fragment that will be automatically played
            if($scope.currentFragment && $scope.currentFragment.id == fragment.id){
                var nextFragment = VideoService.getNextFragment(fragment, $scope.videos);
                if(nextFragment){
                    playFragment(nextFragment);
                }else{
                    playMainVideo();   
                }
            }
            
            // Remove the fragment
            VideoService.removeFragment(fragment);
        }
        
        // Callback function that is called when we stop moving the markers from the slider. This is custom JQueryUI Event that we use in our slider directive
        function onStop(event, ui){
            // INCLUDE THE MEDIA FRAGMENTS IN THE URL so that the video starts and ends from where we set it through the slider
            var url = $scope.video.url + "#t="+$scope.startTime+","+$scope.endTime;
            // Load the video with the media fragments in the player
            $scope.config.sources = [{src:$sce.trustAsResourceUrl(url), type: "video/mp4"}];
            
            // Show the loader animation
            $scope.isLoadingVideo = true;
            $timeout(function(){
                // Hide the loader animation
                $scope.isLoadingVideo = false;
                
                // Play the video
                $scope.api.play();
            }, 300);
        }
        
        // Callback function that is called when we slide the slider with the mouse. We get the updated values from the slider and then assign them to our $scope variable so that we can use them later when we want to create new fragment 
        function onSlide(startTime, endTime){
            $scope.$apply(function(){
                $scope.startTime = startTime;
                $scope.endTime = endTime;
            });
        }
        
        function playFragment(video){
            $scope.api.stop();
            $scope.config.sources = [{src:$sce.trustAsResourceUrl(video.url), type: "video/mp4"}];
            $scope.currentFragment = video;
            
            $scope.startTime = video.startTime;
            $scope.endTime = video.endTime;
            $scope.sliderApi.setSliderValues(video.startTime, video.endTime);
            $scope.isPlayingMainVideo = false;
            $timeout(function(){
                $scope.api.play();
            }, 300);
        }
        
        // Opens the modal window for editing a fragment from our playlist. After the user fills out the form, and clicks OK the modal is closed and the fragment information is edited and finally it is saved in the storage
        function editFragment(video){
            // Pause the currently playing video
            $scope.api.pause();
            
            // Open the modal window
            var modalInstance = $uibModal.open({
                  animation: true,
                  templateUrl: '/partials/saveVideo.html',
                  controller: 'saveVideoCtrl',
                  size: 'md',
                  resolve: {
                     'startTime': function(){
                         return $scope.startTime;
                     },
                    'endTime': function(){
                        return $scope.endTime;
                    },
                    'video': function(){
                        return video;
                    }
                  }
            });
            
            // When the modal is closed save the fragment with the new data
            modalInstance.result.then(function (result) {
                // ADD THE MEDIA FRAGMENTS TO THE URL
                video.url = $scope.video.url + "#t="+result.startTime+","+result.endTime;
                video.tags = result.tags;
                $scope.sliderApi.setSliderValues(result.startTime, result.endTime);   
                playFragment(video);
                VideoService.updateFragment(video);
            });

        }
        
        // Opens the modal window for creating new fragment from the video.
        function openSaveModal(){
            var modalInstance = $uibModal.open({
                  animation: true,
                  templateUrl: '/partials/saveVideo.html',
                  controller: 'saveVideoCtrl',
                  size: 'md',
                  resolve: {
                     'startTime': function(){
                         return $scope.startTime;
                     },
                    'endTime': function(){
                        return $scope.endTime;
                    },
                      'video' : function(){
                          return null;
                      }
                  }
            });

            // After the modal is closed we add the fragment to our array of fragments and also save it in the storage
            modalInstance.result.then(function (video) {
                // ADD THE MEDIA FRAGMENTS TO THE URL OF THE VIDEO
                video.url = $scope.video.url + "#t="+video.startTime+","+video.endTime;
                $scope.sliderApi.setSliderValues(video.startTime, video.endTime);
                // This line do the job of adding and saving the fragment
                VideoService.addFragment(video);
                // After it is saved - play it in the video
                playFragment(video);
                // Reset the tags filter so that we see all fragment videos in the playlist including the newly added fragment
                $scope.filterValue = "";
            });
        }
        
        // Loads the main (full-length) video in the player and plays it
        function playMainVideo(){
            // This two lines are responsible for loading the video in the player
            $scope.api.stop();
            $scope.config.sources = [{src:$sce.trustAsResourceUrl($scope.video.url), type: "video/mp4"}];
            
            // Keep in the $scope the startTime and endTime values for the slider
            $scope.startTime = 0;
            $scope.endTime = $scope.api.totalTime/1000;
            
            // Update the slider values with the new values
            if($scope.sliderApi.setSliderValues && $scope.isSliderInitialized){
                $scope.sliderApi.setSliderValues(0, $scope.api.totalTime);   
            }
            
            $scope.isPlayingMainVideo = true;
            // We set the currentFragment to null because we are not playing any fragment currently. Instead we are playing the main video 
            $scope.currentFragment = null;
            
            // This line starts playing the video. It needs to be placed inside $timeout call because there is a small delay between when the video is loaded in the player and when it can be actually played
            $timeout(function(){
                $scope.api.play();  
            }, 300);
            
        }
        
        // Callback function which is executed when the video player is fully loaded. 
        // The first parameter is the API that we save in the $scope so that we can manipulate with the player when it is needed
        function playerReady($API){
            $scope.api = $API;

            if($scope.video.url){
                playMainVideo();
                // Initialize the slider with the appropriate values. We place this code inside $timeout because there a delay between when the video is loaded in the player and the player api is updated. We need it to be loaded so that we can access the api.totalTime 
                $timeout(function(){
                    $scope.endTime = $scope.api.totalTime/1000;
                    $scope.sliderApi.initializeSlider({
                        min:0,
                        max: $scope.api.totalTime,
                        step: 1,
                        // The first value in the array is the startTime (the left marker on the slider) and the second value is the endTime(the right marker on the slider)
                        values: [0, $scope.api.totalTime]
                    });
                    $scope.isSliderInitialized = true;
                }, 300);
            }
        }
        
        // Opens the modal window that allows us to enter url from a video and add that video as our primary video that we will edit later.
        // After filling the modal form and clicking OK it saves the video and resets all fragments that we have previously made from the old video
        function uploadVideo(){
            // Open the modal window. We are using the $uibModal directive from the UI Bootstrap library which is a angular.js wrapper for the bootstrap widgets. Read more on: https://angular-ui.github.io/bootstrap/
            var modalInstance = $uibModal.open({
                  animation: true,
                  templateUrl: '/partials/addVideo.html',
                  controller: 'addVideoCtrl',
                  size: 'md'
            });
            
            // After the user filled in the form, pressed OK and the modal closed this code is executed. In the callback we get the video object which we save
            modalInstance.result.then(function (video) {
                $scope.video = video;
                playMainVideo();
                
                // After we load the video in the player and play it we reset the slider values and then save the video in the storage
                $timeout(function(){
                    $scope.endTime = $scope.api.totalTime;
                    $scope.video.startTime = 0;
                    $scope.video.endTime = $scope.endTime;
                    // Save the video in the storage
                    VideoService.setVideo($scope.video);
                    // Since we uploaded new video we get the fragments for that video...But since the video was just uploaded VideoService.getFragments() returns empty array
                    $scope.videos = VideoService.getFragments();
                    
                    $scope.sliderApi.initializeSlider({
                        min:0,
                        max: $scope.endTime,
                        step: 1,
                        values: [$scope.startTime, $scope.api.totalTime]
                    });
                    $scope.isSliderInitialized = true;
                }, 400);
            });
        }
        
        // On the destruction of the controllers' scope remove any leftover promise objects from the timeout calls
        $scope.$on("$destroy", function(){
            for(var i=0; i<timeoutCallbacks.length; i++){
                $timeout.cancel(timeoutCallbacks[i]);
            }
        });
	});
})();

