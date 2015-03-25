var isTest = false;
var hasAds = false;

var iadHeight = 0;
if (hasAds) {
    iadHeight = 32;
};

$(document).ready(function() {
    // Adjustments for iAd
    if (hasAds) {
        $('.footer').addClass('iadAdjustment');
        $('#settingsContent').addClass('iadAdjustment');
    }

    if (isTest) {
        TwitterAuth.init();
    } else {
        document.addEventListener("deviceready", onDeviceReady, false);
    };
});

// ---------------------------
// Login/Authentication
// ---------------------------

// Device Ready           
function onDeviceReady() {
    navigator.splashscreen.hide();

    if (checkConnection()) {
       TwitterAuth.init();
    } else {
        $.mobile.changePage($('#connectionErrorScreen'));
    }
};


function checkConnection() {
    var networkState = navigator.connection.type;

    if (networkState !== 'none') {
        return true;
    } else {
        return false;
    }
};

function recheckConnection() {
    if (checkConnection()) {
        $.mobile.changePage($('#adviceMain'));

        preLoaderM.reset();
        preLoaderV.reset();
    };
}

// Fires function on loading Login page
$(document).on( "pageshow", "#loginScreen", function() {
    $('#loginBtn').fadeIn('slow');
});

// Fires function on leaving Login page
$(document).on( "pagehide", "#loginScreen", function() {
    $('#loginBtn').hide();
});


// Globals
var oauth,
    requestParams,
    twitterKey = "twtrky",
    localStorage = window.localStorage, 
    iab = null,
    options = {
        consumerKey: '', // Twitter CONSUMER_KEY
        consumerSecret: '', // Twitter CONSUMER_SECRET
        //callbackUrl: 'http://google.com/'
    },
    preLoaderM, 
    preLoaderV,
    wisdomView,
    wisdomCollection;

    options.consumerKey = atob('');
    options.consumerSecret= atob('');

if (isTest) {
    options.callbackUrl = 'https://api.twitter.com';
} else {
    options.callbackUrl = 'https://google.com';
};

var infoIcon = {
    reveal: function() {
        $('#infoIcon').fadeTo(500, 1);
    }
};

// Twitter Object
var TwitterAuth = {
    init: function() {
        // If we have existing credentials...
        if (localStorage.getItem(twitterKey) !== null) {
            var lsData = JSON.parse(localStorage.getItem(twitterKey));
            oauth = OAuth(options);
            oauth.setAccessToken([lsData.accessTokenKey, lsData.accessTokenSecret]);

            successfulLogin();
        } else {
            $.mobile.changePage($('#loginScreen'));
        };
    },

    login: function() {
        oauth = OAuth(options);

        oauth.get('https://api.twitter.com/oauth/request_token',
            function(data) {
                requestParams = data.text;
                iab = window.open('https://api.twitter.com/oauth/authorize?' + data.text, '_blank', 'location=no');

                if (isTest) {
                    setTimeout(function() {
                        var myURL = iab.location.protocol + "//" + iab.location.host + iab.location.search;
                        TwitterAuth.success(myURL);
                        
                        iab.window.close();
                    }, 5500);
                } else {
                    iab.addEventListener('loadstart', TwitterAuth.success);
                };
            },

            function(data) {
                // There was a problem requesting the token.
            }
        );
    },

    success:function(loc){
        if (isTest === false) {
            loc = loc.url;
        };

        // Begin CTMU
        var domainTest = false;

        if (isTest === false) {
            if (loc.indexOf("https://www.google.com") >= 0) {
                domainTest = true;
            };
        };

        if (isTest === true) {
            if (loc.indexOf("https://api.twitter.com") >= 0) {
                domainTest = true;
            };
        }
        // End CTMU

        // Found callback URL
        if (domainTest) {
            iab.removeEventListener('loadstart', TwitterAuth.success);

            // Parse the returned URL
            var index, verifier = '';
            var params = loc.substr(loc.indexOf('?') + 1);
            params = params.split('&');
            for (var i = 0; i < params.length; i++) {
                var y = params[i].split('=');
                if(y[0] === 'oauth_verifier') {
                    verifier = y[1];
                }                      
            };

            oauth.get('https://api.twitter.com/oauth/access_token?oauth_verifier=' + verifier + '&' + requestParams,
                function(data) {
                    var accessParams = {};
                    var qvars_tmp = data.text.split('&');

                    for (var i = 0; i < qvars_tmp.length; i++) {
                       var y = qvars_tmp[i].split('=');
                        accessParams[y[0]] = decodeURIComponent(y[1]);
                    };

                    oauth.setAccessToken([accessParams.oauth_token, accessParams.oauth_token_secret]);

                    // Saving token of access in Local_Storage
                    var accessData = {};
                    accessData.accessTokenKey = accessParams.oauth_token;
                    accessData.accessTokenSecret = accessParams.oauth_token_secret;
                    accessData.verifier = verifier;

                    // Configuring Apps LOCAL_STORAGE
                    localStorage.setItem(twitterKey, JSON.stringify(accessData));

                    oauth.setVerifier(verifier);
                    oauth.get('https://api.twitter.com/1.1/account/verify_credentials.json?skip_status=true',
                        function(data) {
                            var entry = JSON.parse(data.text);
                            iab.close();
                            successfulLogin();
                        },

                        function(data) {
                            // Error
                        }
                    );
                },

                function(data) {
                    // Error
                }
            );
        } else {
        }
    }
};


function logOut() {
    localStorage.removeItem(twitterKey)
    $.mobile.changePage($('#loginScreen'));
};


function successfulLogin() {
    preLoaderM = new App.Models.Preloader;
    preLoaderV = new App.Views.Preloader({ model: preLoaderM });
    $.mobile.changePage($('#adviceMain'));

};

function failed(data) {
    // Fail
};


// ------------------------------------------------------------------------------------------------------------
// ============================================================================================================
// ------------------------------------------------------------------------------------------------------------

// ---------------------------
// Global App Settings
// ---------------------------
App = {
    Models: {},
    Views: {},
    Collections: {},
    Router: {}
};

template = function(id) {
    return _.template( $('#' + id).html() );
};


// ---------------------------
// Preloader
// masterPhraseArray and rejectionCriteriaArray are defined via adviceRules.js
// ---------------------------
App.Views.Preloader = Backbone.View.extend({
    tagName: 'div id="dataContainer"',

    initialize: function() {
        _.bindAll(this, 'selectPreloaderText', 'revealPreloader', 'fadePreloader', 'render');
        this.selectPreloaderText();
        this.render();

        this.model.on('change:tweetCount', function() {
            this.render();
        }, this);

        this.model.on('change:fullyLoaded', function() {
            if (this.model.get('fullyLoaded')) {
                this.fadePreloader();
            } else {
                // Reset has occurred
            };
        }, this);
    },

    selectPreloaderText: function() {
        var preloaderArray = [
            "Taking the auspices...", 
            "Observing the world...", 
            "Taking the auspices...", 
            "Reticulating splines...", 
            "The Internet knows all...",
            "Fortune hath many roads...", 
            "Dreams make no promises...", 
            "Fortune favors the brave...", 
            "Listening to the Internet...", 
            "Sorry about all the typos...",
            "No one saves us but ourselves...", 
            "There are no ordinary moments...", 
            "Always in motion is the future...", 
            "Free advice is often overpriced...", 
            "Things do not change; we change...", 
            "One cannot plan for the unexpected.", 
            "Advice from bots is still advice...", 
            "What you don't know, you don't miss...", 
            "All great changes are preceded by chaos...", 
            "Loading up advice from total strangers...", 
            "For time and the world do not stand still...", 
            "Looking to the <strike>sky</strike> SkyNet...",
            "People only see what they are prepared to see...", 
            "The past is always tense, the future perfect... ", 
            "You cannot change what you are, only what you do...", 
            "There is never a right time to do a difficult thing...", 
            "Who looks outside, dreams. Who looks inside awakens..."
        ];

        var randomPre = Math.floor(Math.random() * preloaderArray.length);
        preloaderText = preloaderArray[randomPre];

        var preloadBlock = $('#preloadWrapper .adviceText');
        preloadBlock.html(preloaderText);

        this.centerPreloader();
    },

    fadePreloader: function() {
        $('#preloadWrapper').fadeOut(550, function() {
            wisdomCollection = new App.Collections.Wisdom(adviceFromEveryoneArray);
            wisdomView = new App.Views.Wisdom({ collection: wisdomCollection });
            wisdomView.render();
        });
    },

    revealPreloader: function() {
        $('#meter span').css('width', '0%');
        $('#preloadWrapper').fadeTo(200, 1);

        var preloadBlock = $('#preloadWrapper .adviceText');
        var preloadWidth = preloadBlock.width();

        $('#meter').width(preloadWidth);
    },

    centerPreloader: function() {
        $('#preloadWrapper').css('opacity', 0.01);
        var preloadBlock = $('#preloadWrapper');
        var deviceWidth = window.innerWidth;

        if (hasAds) {
            var deviceHeight = window.innerHeight - iadHeight;
        } else {
            var deviceHeight = window.innerHeight;
        }      

        var preloadWidth = preloadBlock.width();
        var preloadHeight = preloadBlock.height() + 20; // Height + Padding of meter

        if ((preloadWidth !== 0) && (preloadHeight !== 0)) {
            preloadBlock.css('margin-top', (deviceHeight/2) - (preloadHeight/2));

            this.revealPreloader();
            this.model.set('isPopAndCentered', true);
        };
    },

    render: function() {
        var percentLoaded = Math.ceil( (this.model.get('tweetCount') / this.model.get('maxTweetCount')) * 100);

        if (percentLoaded >= 100) {
            percentLoaded = 100;
        };
        percentLoaded += "%";

        $('#meter span').animate({
            width: percentLoaded
        }, 15);


        if (this.model.get('isPopAndCentered') === false) {
            this.centerPreloader();
        };
    },

    reset: function() {
        this.selectPreloaderText();
        $('#preloadWrapper').show();

        this.render();
    }
});


App.Models.Preloader = Backbone.Model.extend({
    defaults: {
        tweetCount: 0,              // Counter
        maxTweetCount: 40,          // Total tweets
        perTopic: 4,                // Sets total amount of advice on each topic
        levenshteinThreshold: 25,   // Threshold for similarity matching
        fullyLoaded: false,         // All done?
        isPopAndCentered: false     // preload div contains content and centered?
    },

    initialize: function() {
        _.bindAll(this, 'checkMPALocalStorage', 'searchForAdvice', 'askForAdvice', 'parseAdvice', 'fisherYates', 'render');
        
        masterPhraseArray = new Array();
        this.checkMPALocalStorage();
        adviceSourceArray = new Array();
        adviceFromEveryoneArray = new Array();

        this.searchForAdvice();
    },

    checkMPALocalStorage: function() {
        var mapLocalExists = false;
        var masterPhraseArrayLS = localStorage.getItem('masterPhraseArrayLS');

        // Check to see if LS exists (ie first time)        
        if (masterPhraseArrayLS !== null) {
            // Check to see if LS exists, but is empty
            masterPhraseArray = JSON.parse(localStorage['masterPhraseArrayLS']);
            if (masterPhraseArray.length > 0) {
                mapLocalExists = true;
            };            
        };

        if (mapLocalExists) {
            // No action needed

            // Force LS for testing
            // masterPhraseArray = resetMasterPhraseArray();
        } else {
            // Master
            masterPhraseArray = resetMasterPhraseArray();
        };
    },

    searchForAdvice: function() {
        var randomVar = Math.floor(Math.random() * masterPhraseArray.length);
        var phrase = masterPhraseArray[randomVar][0];
        var grep = masterPhraseArray[randomVar][1];

        // Remove element from array;   
        masterPhraseArray.splice(randomVar, 1);

        // Update Local Storage
        localStorage["masterPhraseArrayLS"] = JSON.stringify(masterPhraseArray);

        // Talk to Twitter
        this.askForAdvice(phrase, grep);
    },

    getLevenshteinNum: function(s, t) {
        var d = []; //2d matrix

        // Step 1
        var n = s.length;
        var m = t.length;

        if (n == 0) return m;
        if (m == 0) return n;

        //Create an array of arrays in javascript (a descending loop is quicker)
        for (var i = n; i >= 0; i--) d[i] = [];

        // Step 2
        for (var i = n; i >= 0; i--) d[i][0] = i;
        for (var j = m; j >= 0; j--) d[0][j] = j;

        // Step 3
        for (var i = 1; i <= n; i++) {
            var s_i = s.charAt(i - 1);

            // Step 4
            for (var j = 1; j <= m; j++) {

                //Check the jagged ld total so far
                if (i == j && d[i][j] > 4) return n;

                var t_j = t.charAt(j - 1);
                var cost = (s_i == t_j) ? 0 : 1; // Step 5

                //Calculate the minimum
                var mi = d[i - 1][j] + 1;
                var b = d[i][j - 1] + 1;
                var c = d[i - 1][j - 1] + cost;

                if (b < mi) mi = b;
                if (c < mi) mi = c;

                d[i][j] = mi; // Step 6

                //Damerau transposition
                if (i > 1 && j > 1 && s_i == t.charAt(j - 2) && s.charAt(i - 2) == t_j) {
                    d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
                }
            }
        }
        // Step 7
        return d[n][m];
    },

    askForAdvice: function(phrase, grep) {
        var urlEncodedPhrase = '%22' + phrase.replace(/\s/g, '%20') + '%22';
        var coinToss = Math.floor(Math.random() * 100) + 1;
        // var advicePref = 'recent';  // mixed, recent, popular

        if ((coinToss%4) != 0) {
            var advicePref = 'recent';
        } else {
            var advicePref = 'popular';
        };
        var coinToss = Math.floor(Math.random() * 100) + 1;

        if ((coinToss%7) != 0) {          
            urlEncodedPhrase = '%22you%20will%22%20OR%20you%27ll%20OR%20he%27ll%20OR%20she%27ll%20OR%20they%27ll%20AND' + urlEncodedPhrase;
        };

        var url = 'https://api.twitter.com/1.1/search/tweets.json?result_type=' + advicePref + '&count=100&include_entities=false&lang=en&q=' + urlEncodedPhrase + '-RT';
        var _this = this;

        oauth.get(url, function(data) {
            // Check connectivity
            if (isTest == false) {
                if (checkConnection() == false) {
                    $.mobile.changePage($('#connectionErrorScreen'));
                    return;
                };
            };

            var resultsObjStat = JSON.parse(data.text).statuses;
            var rateLimitRemaining = data.responseHeaders['x-rate-limit-remaining'];
            var rateLimitReset = data.responseHeaders['x-rate-limit-reset'];

            if (rateLimitRemaining <= 0) {
                $.mobile.changePage($('#rateLimitScreen'));
                return;
            };

            _this.fisherYates(resultsObjStat);

            // Retrieve Model Attributes
            var tweetCountRef = _this.get('tweetCount');
            var maxTweetCountRef = _this.get('maxTweetCount');
            var perTopicRef = _this.get('perTopic');
            var levenshteinThresholdRef = _this.get('levenshteinThreshold');

            // Compare matches against "perTopic"
            var matches = 0;

            // Small array, to check for close matches
            var closeComparisonArray = new Array();

            $.each(resultsObjStat, function(index, tweet) {
                var tweetString = tweet.text;

                // Check tweet against grep
                if (tweetString.match(grep)) {

                    // Add cleaning rules here - no hashtags, RT, @, etc.
                    if (_this.parseAdvice(tweetString)) {

                        var alreadyExists = false;
                        var lowerTweet = tweetString.toLowerCase();

                        // Check if phrase exists in adviceSourceArray
                        for (i = 0; i < adviceSourceArray.length; i++) {
                            if (lowerTweet === ((adviceSourceArray[i]).text).toLowerCase()) {
                                alreadyExists = true;
                                return;
                            };


                            for (j = 0; j < closeComparisonArray.length; j++) {
                                if (_this.getLevenshteinNum(lowerTweet, closeComparisonArray[j].toLowerCase()) < levenshteinThresholdRef) {
                                    alreadyExists = true;
                                    return;                                    
                                };
                            };
                        };

                        // If not, add full Twitter object to source array
                        if (alreadyExists === false) {
                            adviceSourceArray.push(tweet);
                            closeComparisonArray.push(tweet.text);

                            // console.log(tweet.text);
                        };

                        // Increment counters
                        matches++;
                        tweetCountRef++;

                        // Update model attribute
                        _this.set('tweetCount', tweetCountRef);
                    }   
                };

                // If we have enough tweets for this topic, move on to the next.
                if (matches >= perTopicRef) {
                    return false;
                };

            });

            // Got enough yet? If not, and master phrase array still has items... go back for more.
            if ((tweetCountRef < maxTweetCountRef) && (masterPhraseArray.length > 0)) {
                _this.searchForAdvice();
            } else {
                // New array, removing duplicates based on text property
                 adviceFromEveryoneArray = _.uniq(adviceSourceArray, false, function(item) {
                    return item.text.toLowerCase();
                });
                   
                // Shuffle array                    
                _this.fisherYates(adviceFromEveryoneArray);
                _this.set('fullyLoaded', true);
            };
        });
    },

    // Shuffles array in-place
    fisherYates: function(array) {
        var i = array.length;
        if ( i == 0) {
            return false;
        };
        while ( --i ) {
            var j = Math.floor(Math.random() * (i+1));
            var tempi = array[i];
            var tempj = array[j];
            array[i] = tempj;
            array[j] = tempi;
        }
    },

    parseAdvice: function(tweet) {
        var rejectionCriteriaFound = 0;
        var lowerTweet = tweet.toLowerCase();

        // Look for matches to our rejection criteria
        for (i = 0; i < rejectionCriteriaArray.length; i++) {
            if (lowerTweet.indexOf(rejectionCriteriaArray[i]) != -1) {
                rejectionCriteriaFound++;
                return;
            }
        };

        if (/^[\000-\177]*$/.test(lowerTweet)) {
            // We're fine, all ascii
        } else {
            rejectionCriteriaFound++;
        };
        
        if (rejectionCriteriaFound > 0) {
            // Returns false if any rejection criteria matches are found
            return false;
        } else {
            // Check for bot structure
            var botPattern = /: [a-zA-Z0-9]+$/.test(lowerTweet);
            if (botPattern) {
                return false;
            } else {
                // Returns true if no rejection criteria found. All clear!
                return true;
            };
        };
    },


    render: function() {

    },

    reset: function() {
        this.set('tweetCount', 0);
        this.set('fullyLoaded', false);
        this.set('isPopAndCentered', false);

        // Exhaust the array before resetting
        if (masterPhraseArray.length === 0) {
            masterPhraseArray = resetMasterPhraseArray();
        };

        adviceSourceArray = new Array();
        adviceFromEveryoneArray = new Array();
        this.searchForAdvice();         
    }
});






// ---------------------------
// Singular Advice
// ---------------------------

// Advice Model
App.Models.Advice = Backbone.Model.extend({
    defaults: {
        author: 'Anonymous',
        adviceText: 'xxx',
        adviceDate: 'October 26, 1985',
        adviceTime: '1:15 AM',
        favorite: false
    }
});


// ---------------------------
// Wisdom (Multiple Advice)
// ---------------------------

// Wisdom Collection
App.Collections.Wisdom = Backbone.Collection.extend({
    model: App.Models.Advice
});

// Wisdom View
App.Views.Wisdom = Backbone.View.extend({
    tagName: 'div id="adviceContainer"',

    initialize: function() {
        _.bindAll(this, 'hideAdvice', 'determineNextAdvice', 'revealAdvice', 'render');
        this.currentAdvicePos = 0;
        this.currentTwitterID;
        $('#adviceWrapper').fadeTo(0,0);
    },

    render: function() {
        var currentAdvice = this.collection.at(this.currentAdvicePos).toJSON();  
        this.currentTwitterID = currentAdvice.id;

        // ---------------------------
        // PARSE DATA 
        // ---------------------------
        this.template = template('templateDefault');
        this.$el.html(this.template(currentAdvice));

        $('#adviceWrapper').append(this.$el);
        this.centerAdvice();
    },

    events: {
        'click': 'hideAdvice'
    },

    hideAdvice: function() {
        _this = this;
        $('#adviceWrapper').fadeTo(550, 0, function() {
            _this.determineNextAdvice();
        });
    },

    determineNextAdvice: function() {

        if (this.currentAdvicePos < (this.collection.length - 1)) {
            this.currentAdvicePos++;

            this.render();
        } else {
            // Reset counter
            this.currentAdvicePos = 0;
            this.reset();
        };
    },

    centerAdvice: function() {
        var adviceText = $('#adviceWrapper .adviceText');
        
        var deviceWidth = window.innerWidth;
        if (hasAds) {
            var deviceHeight = window.innerHeight - iadHeight;
        } else {
            var deviceHeight = window.innerHeight;
        }

        var adviceWidth = adviceText.width();
        var adviceHeight = adviceText.height();
    
        adviceText.css('margin-top', (deviceHeight/2) - (adviceHeight/2));
        adviceText.css('margin-left', (deviceWidth/2) - (adviceWidth/2));        
        
        this.revealAdvice();
    },

    revealAdvice: function() {
        infoIcon.reveal();

        $('#adviceWrapper').fadeTo(550, 1, function() {
        });
    },

    reset: function() {
        $('#infoIcon').fadeTo(0,0);

        $('#adviceContainer').fadeTo(550, 0, function() {
            this.remove();

            if (isTest) {
                preLoaderM.reset();
                preLoaderV.reset();                
            } else {
                if (checkConnection()) {
                    preLoaderM.reset();
                    preLoaderV.reset();
                } else {
                    $.mobile.changePage($('#connectionErrorScreen'));
                }
            }
        });
    }
});

 