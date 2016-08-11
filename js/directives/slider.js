"use strict";

/*
    Usage: <div slider slider-api='api' on-slide='onSlide(startTime, endTime)' on-stop='onStop(event, ui)'></div>
    Attributes:
        - slider-api: empty object from the controller that we attach functions to from inside of the directive so that we are able to call private directive's functions from the controller.
        - on-slide: callback function which is called when we move the slider with the mouse so that we are able to get the values of the slider.
        - on-stop: callback function which is called when we stop moving the slider. This is custom event from the JQueryUI slider widget
*/
myApp.directive('slider', function ($timeout) {
    return {
        restrict:'A',
        scope: { 
        	sliderApi: '=',
            onSlide: '&',
            onStop: '&'
        },
        link:function (scope, element, attrs, ctrl) {
            // Watch when the empty object at which we will attach the api functions is created in the controller
            var watch = scope.$watch("sliderApi", function(newVal, oldVal){
                if(newVal){
                    // If the object was created in the controller attach the api functions to it and destroy the watch since we only attach them once
                    watch();
                    
                    // initializeSlider is called when we want to initialize the slider the first time our video is loaded
                    scope.sliderApi.initializeSlider = function(options){
                        options.slide = function(event, ui){
                            scope.onSlide({startTime: ui.values[0]/1000, endTime: ui.values[1]/1000});
                        };
                        options.stop = function(event, ui){
                            scope.onStop({event:event, ui:ui});
                        }
                        $(element).slider(options);
                    }
                    
                    // setSliderValues is called when we want to update the values for the slider from the controller.
                    scope.sliderApi.setSliderValues = function(startTime, endTime){
                        $(element).slider("values", 0, startTime*1000);
                        $(element).slider("values", 1, endTime*1000);
                    }
                }
            });
        }
    }
});
