'use strict';

/*
    Usage: <div hotkeys hotkeys-pressed='onHotkeyPressed(event)'></div>
        Attributes:
        - hotkeys-pressed: callback function that is called when the user presses any key on the keyboard.
*/
myApp.directive('hotkeys', function ($timeout) {
    return {
        restrict:'A',
        scope: { 
        	hotkeyPressed: '&'
        },
        link:function (scope, element, attrs, ctrl) {
            // We bind the JQuery keyup event on the document object
            $(document).keyup(handler);
            
            scope.$on("$destroy", function(){
                $(document).unbind("keyup", handler);
            });
            
            function handler(e){
                scope.hotkeyPressed({event: e});
            }
        }
    }
});