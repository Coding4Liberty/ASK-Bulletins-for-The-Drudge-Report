/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * App ID for the skill
 */
var APP_ID = ""; 

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * https node module included to support the https request to Yahoo's YQL query service.
 */
var https = require('https');

/**
 * Get the headlines from http://drudgereport.com
 */
 
function getHeadlinesResponse(response) {
	 
	 makeHeadlineRequest(function headlineLoadedCallback(err, headlineResponse) {
		 
		var speechOutput; 
	
		var result = []; 
		
		if (err) {
			speechOutput = "Sorry, I am having trouble retrieving the latest headlines from The Druge Report. Please try again later.";
		} else {

			getNames(headlineResponse, "content"); 
			
			getNames(headlineResponse, "i"); 

			function getNames(obj, name) {

				for (var key in obj) {

					if (obj.hasOwnProperty(key)) {

						if ("object" == typeof(obj[key])) {
							
							getNames(obj[key], name); 
						

						} else if (key == name) {

							result.push(obj[key].toString());
						} 
					} 
				} 
			} 

			function removeExtra(result, extra) {
				
				var matchingString = result.indexOf(extra, matchingString); 
				
				while (matchingString !== -1) {
					result.splice(matchingString, 1); 
					matchingString = result.indexOf(extra); 
				} 
			} 

			removeExtra(result, "http://drudgereport.com");
			removeExtra(result, "http://drudgereport.com/robots.txt");
			
			function handleEscapeStrings() {
				
				var d = 0; 
				var end = result.length; 
				
				for (d; d < end; d++) {
					if (result[d].indexOf("\r") != -1) {
							
						var intermediaryResultArray = [];
						intermediaryResultArray = result[d].split("\r");
						result.splice.apply(result,[d,1].concat(intermediaryResultArray));
						
						end = result.length;
								
					}
				
				} 
				
				d = 0;
				end = result.length;
				
				for (d; d < end; d++) {
					if (result[d].indexOf("\n") != -1) {
						
						var intermediaryResultArray = [];
						intermediaryResultArray = result[d].split("\n");
						result.splice.apply(result,[d,1].concat(intermediaryResultArray));
						
						end = result.length; 
						
					} 
					
				} 
				
				d = 0;
				end = result.length;
				
				for (d; d < end; d++) {
					
					if (result[d] === undefined) {
						result.splice(d, 1); 
					} else if (result[d].toString() == "") {
						result.splice(d, 1); 
					} else if (result[d].toString() == null) {
						result.splice(d, 1); 
					}
					
				} 
				
			} 
			
			handleEscapeStrings(); 
			
			var intermediarySpeech;
			
			if (/^\s+$/.test(result.toString())) {
				intermediarySpeech = "<speak>An error has occurred. Please try again later. If you continue to receive this message, please contact the developer."
			} else {
				intermediarySpeech = "<speak>Here are the latest headlines from The Drudge Report: ";
				for (var c = 0; c < result.length; c++) {
					intermediarySpeech += "<p>" + result[c].toString() + "</p> <break time='1s'/>";
				}
				
			} 
			
			intermediarySpeech += ". That's all from The Drudge Report.</speak>";
			
			speechOutput = {
				speech: intermediarySpeech.toString(),
				type: AlexaSkill.speechOutputType.SSML
			} 
			
			response.tell(speechOutput);
			
		} 

	}); 
	 
} 

function makeHeadlineRequest(headlineLoadedCallback) {
	 
	var baseURL = "https://query.yahooapis.com/v1/public/yql?q=SELECT%20*%20FROM%20html%20WHERE%20url%3D%22http%3A%2F%2Fdrudgereport.com%22%20and%20xpath%3D%22%2F%2F*%5B%40id%3D'app_mainheadline'%5D%2Fcenter%7C%2F%2F*%5B%40id%3D'app_topstories'%5D%2Ftt%7C%2F%2F*%5B%40id%3D'app_col1'%5D%2Fcenter%2Ftable%2Ftbody%2Ftr%2Ftd%5B1%5D%2Ftt%22&format=json&_maxage=60&_nocache=";
	
	var currentTimeStamp = Date.now();
	
	var url = baseURL + currentTimeStamp; 
	
	https.get(url, function (res) {
        var headlineResponseString = '';
        console.log('Status Code: ' + res.statusCode);

        if (res.statusCode != 200) {
            headlineLoadedCallback(new Error("Non 200 Response"));
        }

        res.on('data', function (data) {
            headlineResponseString += data;
        });

        res.on('end', function () {
            var headlineResponseObject = JSON.parse(headlineResponseString);

            if (headlineResponseObject.error) {
                console.log("Drudge Report error: " + headlineResponseObject.error.message);
                headlineLoadedCallback(new Error(headlineResponseObject.error.message));
            } else {
                headlineLoadedCallback(null, headlineResponseObject);
            }
        });
    }).on('error', function (e) {
        console.log("Communications error: " + e.message);
        headlineLoadedCallback(new Error(e.message));
    });
	
} 

/**
 * DrudgeHeadlineRequester is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var DrudgeHeadlineRequester = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
DrudgeHeadlineRequester.prototype = Object.create(AlexaSkill.prototype);
DrudgeHeadlineRequester.prototype.constructor = DrudgeHeadlineRequester;

DrudgeHeadlineRequester.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("DrudgeHeadlineRequester onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

DrudgeHeadlineRequester.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("DrudgeHeadlineRequester onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    handleNewHeadlineRequest(response);
};

/**
 * Overridden to show that a subclass can override this function to teardown session state.
 */
DrudgeHeadlineRequester.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("DrudgeHeadlineRequester onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

DrudgeHeadlineRequester.prototype.intentHandlers = {
    "GetNewHeadlineIntent": function (intent, session, response) {
		console.log("new headline intent reached");
		handleNewHeadlineRequest(response);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        response.ask("You can ask Drudge to tell you the latest headlines, or, you can say exit... What can I help you with?", "What can I help you with?");
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    }
};

/**
 * Gets the latest headlines from The Drudge Report and returns them to the user.
 */
function handleNewHeadlineRequest(response) {
	
	getHeadlinesResponse(response); 
	
} 


exports.handler = function (event, context) {	
	
    var headlineRequester = new DrudgeHeadlineRequester();
	
    headlineRequester.execute(event, context);
};

