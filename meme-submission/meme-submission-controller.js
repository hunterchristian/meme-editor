/**
 * Created by hunterhodnett on 4/28/15.
 */

(function ( factory ) {

    var angular     = window.angular;
    var jQuery      = require('../../../bower_components/jquery/dist/jquery.min.js');
    factory(angular, jQuery);

}( function( angular, $, undefined ) {
    "use strict";

    angular
        .module('MemeSubmission')
        .controller('MemeSubCtrl', function ($scope, $element, $http, $compile, $timeout, canvas, widgetConfig, loadingModal, memeUpload) {

            if (widgetConfig.errorMessage) {
                $element.hide();
                $element.after($compile('<div><label class="error">' + widgetConfig.errorMessage + '</label></div>')($scope));
                return;
            }

            initMemeImage(widgetConfig);

            // Wait for the meme image to load, then paint the meme image onto the canvas (by initializing the canvas)
            var memeCanvasObj;
            $('img.caption-image').load(function () {
                memeCanvasObj = new canvas({
                    settings: getCanvasSettings(),
                    domObj: $element.find('.meme-canvas'),
                    domObjCont: $element.find('.meme-canvas').parent(),
                    image: $element.find('img'),
                    wrapImage: true
                });
                $('textarea.caption').width($element.find('img').width() * 0.95);
            });

            function getOverlays() {

                var overlays = [];
                var topCaptionEl = $element.find('#topCaption div');
                var bottomCaptionEl = $element.find('#bottomCaption div');
                var topCaptionComponent = $element.find('#topCaption');
                var bottomCaptionComponent = $element.find('#bottomCaption');

                // Store the caption text objects in a global array so that we can keep our text rendering
                // functions modular (by not having to put DOM selectors into the text rendering functions)
                var fontsize1 = +topCaptionComponent.attr('fontsize');
                isNaN(fontsize1) && throwErr('invalid fontsize! Expected a number, observed NaN');
                overlays.push({
                    text: $scope.topCaption,
                    el: topCaptionEl,
                    fontsize: fontsize1
                });

                var fontsize2 = +bottomCaptionComponent.attr('fontsize');
                isNaN(fontsize2) && throwErr('invalid fontsize! Expected a number, observed NaN');
                overlays.push({
                    text: $scope.bottomCaption,
                    el: bottomCaptionEl,
                    fontsize: fontsize2
                });

                return overlays;
            }

            function throwErr() {
                throw new Error('error in meme-submission-controller.js: ' + msg);
            }

            // 1c. Scope variables
            $scope.topCaption = "";
            $scope.bottomCaption = "";

            // 1d. Scope functions
            /**
             * Checks the text value of the top and bottom functions and returns true if both are empty
             * @returns {boolean} - true if both inputs are empty
             */
            $scope.areInputsEmpty = function () {
                return !($scope.topCaption || $scope.bottomCaption);
            };

            /**
             * Renders the captions onto the meme image and uploads the image
             */
            $scope.uploadMeme = function () {

                // If a meme has been created already, then the canvas will be hidden, which will skew our
                // text position calculations. We un-hide it here for this reason.
                var memeCanvas = $element.find('.meme-canvas');
                memeCanvas.removeAttr('hidden');

                // Don't want the user clicking around while we're uploading their meme. openLoadingModal() returns
                // a modalInstance which we can use to close the modal.
                var submissionLoadingModal = loadingModal.openLoadingModal();

                // Re-draw the image, just in case it wasn't already drawn when we created the canvas object. (it
                // disappears when the app is loaded into an iframe for some reason)
                memeCanvasObj.drawImage($element.find('img'), true);

                var textOverlays = getOverlays();
                for (var i = 0, len = textOverlays.length; i < len; i++) {
                    memeCanvasObj.drawText(textOverlays[i]);
                }

                // The captions don't line up perfectly with the textareas, so hide the canvas to keep things looking nice
                memeCanvas.attr('hidden', 'true');

                var pngFile = memeCanvasObj.getCanvasAsImg();
                var description = $scope.topCaption + " _ " + $scope.bottomCaption;
                memeUpload.submitFileToTransloadit(pngFile, widgetConfig, submissionLoadingModal, description); // Want to dimiss the modal in an error callback if an error occurs, so we pass it to the API call
            };

            function initMemeImage(config) {

                var imageurl = config.photoCaptionURL || throwErr('photoCaptionURL could not be found in' +
                        ' widget config!');

                var imageEl = angular.element('<img class="caption-image" crossorigin="Anonymous" src="' +
                    imageurl + '" alt="Mock"/>');

                $element.find('#captionMeme').append(imageEl);
            }

            function getCanvasSettings() {
                return {
                    shadowBlur: 2,
                    lineWidth: 1,
                    shadowColor: "#000",
                    fillStyle: "#fff",
                    strokeStyle: "#000",
                    textBaseline: "alphabetic",
                    fontStyle: "impact"
                }
            }
        });
}));