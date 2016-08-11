(function(){
   'use strict';
    
    // The controller used in the modal window for uploading new video
    angular.module("myApp").controller("addVideoCtrl" ,function ($scope, $uibModalInstance) {
         $scope.name = "Video Name";
         // Called when the user clicks OK to confirm the upload of the video
         $scope.ok = function () {
              var video = {url: $scope.url, name:$scope.name};
              $uibModalInstance.close(video);
          };

         // Called when the user clicks Cancel 
          $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
          };
    });
})();