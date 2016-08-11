(function(){
   'use strict';
    
    // The controller used in the modal windows for saving new video fragment
    angular.module("myApp").controller("saveVideoCtrl" ,function ($scope, $uibModalInstance, startTime, endTime, video) {

        // Remove tag from the array of tags
        $scope.removeTag = function(tag){
            var index = $scope.video.tags.indexOf(tag);
            if(index != -1){
                $scope.video.tags.splice(index, 1);
            }
        }

        // Add tag to the array of tags if ENTER is pressed
        $scope.onKeyUp = function($event){
            if($event.which == 13){
                if($scope.video.tags.indexOf($scope.tag) == -1){
                    $scope.video.tags.push($scope.tag);
                    $scope.tag = "";
                }
            }
        }

        // Initialize the data for the video fragment object that we are creating
            $scope.video = {
                name: video ? video.name : "",
                startTime: video ? video.startTime : startTime,
                endTime: video ? video.endTime : endTime,
                tags: video ? angular.copy(video.tags) : []
            };

            if(video){
                $scope.video.id = video.id;
            }

            // The new tag that we are entering 
            $scope.tag = "";

            // Confirm the creation of the video fragment. Called when the user presses OK
            $scope.ok = function () {
                $uibModalInstance.close($scope.video);
              };

            // Cancel the creation of the video fragment. Called when the user presses Cancel
              $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
              };
        });
})();