/**
 * Created by hunterhodnett on 5/28/15.
 */

(function ( factory ) {

    var angular = window.angular;
    var jQuery  = require('../../../bower_components/jquery/dist/jquery.min.js');
    factory(angular, jQuery);

}( function( angular, $, undefined ) {

    angular
        .module('MemeSubmission')
        .service('memeUpload', function($http, transloadit) {

            this.submitFileToTransloadit = function(file, config, loadingModal, description) {

                var parameters = config.transloaditSignatureData;
                var signature = config.transloaditSignature;
                // Array of custom parameters we want to send with the submission for our own tracking purposes
                var fieldsArr = [
                    { name: 'contestId',                            value: config.contestId },
                    { name: 'submissionQueueParentId',              value: config.submissionQueueParentId },
                    { name: 'userGeneratedContestSubmissionTypeId', value: config.userGeneratedContestSubmissionType },
                    { name: 'totalCount',                           value: 1 },
                    { name: 'description',                          value: description }
                ];

                var transloaditXHR = new transloadit({
                    params: parameters,

                    signature: signature,

                    successCb: function (results) {
                        transloaditFileUploadComplete(JSON.stringify(results), loadingModal, config);
                        console.log(results);
                        // Loading modal is dismissed once we redirect the user (in redirectSubmission())
                    },

                    errorCb: function (error) {
                        console.log(error);
                        if(loadingModal) {
                            loadingModal.dismiss();
                        }
                    }
                });

                transloaditXHR.uploadFile(file, fieldsArr);
            };

            /**
             * Called when Transloadit is finished processing our file. Creates a sql record that is needed for
             * the UGC image processing workflow, see Brad Davis or Kenneth Garza for more info (05/19/15)
             * If the request is successful, the user will be redirected into the old UGC workflow.
             * @param transloaditData - Stringified JSON response from Transloadit containing data about our file
             * submission
             * @param submissionLoadingModal - loadingModal to be dismissed once the redirect to the submission page occurs
             */
            function transloaditFileUploadComplete(transloaditData, loadingModal, config) {
                var req = {
                    method: 'POST',
                    url: config.baseUrl + config.contestInstanceShortId + '/UGC/TransloaditFileUploadComplete',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    transformRequest: function(obj) {
                        var str = [];
                        for(var p in obj)
                            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                        return str.join("&");
                    },
                    data: {
                        transloadit: transloaditData
                    }
                };

                $http(req)
                    .success(function() {
                        redirectSubmission();
                        console.log('successfully posted to ' + req.url);
                        console.dir(req.data);
                    })
                    .error(function() {
                        console.log('error posting to ' + req.url);
                        console.dir(req.data);
                        loadingModal.dismiss();
                    });
            }

            /**
             * Guide user back into the old UGC workflow by posting to the Submission page. The response from a post
             * to /UGC/Submission will be a redirect to the submission details page.
             */
            function redirectSubmission() {
                $("#photoCaptionSubmit").submit();
            }
        });
}));