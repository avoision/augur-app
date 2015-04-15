// ===========================
// Vars
// ===========================
var appInit = true,
    clickable = false,
    isTest = false,
    testCounter = 0,
    visionsURL = "https://s3-us-west-2.amazonaws.com/avoision-augur/visions.json",
    meterPadding = 20,
    visionPadding = 20,
    visions = [];


// ===========================
// Init
// ===========================
$(document).ready(function() {
    // Set click functionality
    $('#vision').click(function() {
        showNextVision();
    });

    document.addEventListener("deviceready", onDeviceReady, false);
});

// Device Ready           
function onDeviceReady() {
    $(window).bind('orientationchange', orientationChange);
    // navigator.splashscreen.hide();
    
    if (checkConnection()) {
        $.mobile.changePage($('#adviceMain'));
    } else {
        $.mobile.changePage($('#connectionErrorScreen'));
    }
};

function checkConnection() {
    var networkState = navigator.connection.type;

    if (networkState !== 'none') {
        console.log('connected');
        return true;
    } else {
        return false;
    }
};

function recheckConnection() {
    if (checkConnection()) {
        $.mobile.changePage($('#adviceMain'));
    };
}


// ===========================
// Orientation
// ===========================
function orientationChange(e) {
    if (e.orientation) {    
        centerAdvice();
        centerPreloader(false);
    };
};


// ===========================
// Advice Main: Preloader
// ===========================
// On arriving at adviceMain screen
$(document).on( "pageshow", "#adviceMain", function() {
    console.log('arrived at adviceMain');
    if (appInit) {
        appInit = false;
        checkforVisions();
    };
});

checkforVisions = function() {
    var localVisions = localStorage.getItem('visions');

    if (localVisions != null) {
        visions = JSON.parse(localVisions);
        console.log(visions.length);

        clickable = true;
        showNextVision();
        showInfoIcon();

    } else {
        selectPreloaderText();
    }
};

selectPreloaderText = function() {
    var preloaderArray = [
        "Observing the world.", 
        "Reticulating splines.", 
        "Fortune hath many roads.", 
        "Dreams make no promises.", 
        "Fortune favors the brave.", 
        "Eavesdropping on the Internet.", 
        "Sorry about all the typos.",
        "No one saves us but ourselves.", 
        "There are no ordinary moments.", 
        "Always in motion is the future.", 
        "Free advice is often overpriced.", 
        "Things do not change; we change.", 
        "One cannot plan for the unexpected.", 
        "Advice from bots is still advice.", 
        "What you don't know, you don't miss.", 
        "All great changes are preceded by chaos.", 
        "Loading up advice from total strangers.", 
        "For time and the world do not stand still.", 
        "People only see what they are prepared to see.", 
        "The past is always tense, the future perfect.", 
        "You cannot change what you are, only what you do.", 
        "There is never a right time to do a difficult thing.", 
        "Who looks outside, dreams. Who looks inside, awakens."
    ];
    var randomPre = Math.floor(Math.random() * preloaderArray.length),
        preloaderText = preloaderArray[randomPre];

    var preloadBlock = $('#preloadWrapper .adviceText');
    preloadBlock.html(preloaderText);

    centerPreloader(true);    
}

centerPreloader = function(triggerReveal) {
    $('#preloadWrapper').css('opacity', 0.01);
    var preloadBlock = $('#preloadWrapper');
    var deviceWidth = window.innerWidth;
    var deviceHeight = window.innerHeight;

    var preloadWidth = preloadBlock.width();
    var preloadHeight = preloadBlock.height(); // Height + Padding of meter

    preloadBlock.css('margin-top', (deviceHeight/2) - (preloadHeight/2));

    if (triggerReveal) {
        revealPreloader();
    };
};

revealPreloader = function() {
    $('#preloadWrapper').fadeTo(200, 1, function() {
        getVisionsData();
    });
};

getVisionsData = function() {
    visions = [];

    if (checkConnection()) {
        $.getJSON( visionsURL, function( data ) {
            // console.log('>>> Data received!');
            $.each( data, function( i, item ) {
                visions.push(data[i].tweet);
            });

            // Randomize it up!
            visions = _.shuffle(visions);

            // Save to LS
            localStorage.setItem('visions', JSON.stringify(visions));
            fadePreloader();
        });
    } else {
        $.mobile.changePage($('#connectionErrorScreen'));
    };
};

fadePreloader = function()  {
    $('#preloadWrapper').fadeOut(550, function() {
        $(this).hide();
        clickable = true;
        showNextVision();
        showInfoIcon();
    });
};


// ===========================
// Advice Main: Icons
// ===========================
showInfoIcon = function() {
    $('#infoIcon').fadeIn(500);
};


// ===========================
// Advice Main: Visions
// ===========================
showNextVision = function() {
    if (isTest) { 
        testCounter++; 

        if (testCounter == 5) {
            testCounter = 0;
            $('#infoIcon').fadeOut(500);
            $('#vision').fadeTo(500, 0, function() {
                $(this).hide();
                clickable = false;
                selectPreloaderText();
            });
            return;
        };
    };
    
    if (clickable) {
        clickable = false;
    } else {
        return;
    };

    if (visions.length > 0) {
        $('#vision').fadeTo(500, 0, function() {
            $('#vision').html(visions[0]);
            centerAdvice();
            $('#vision').fadeTo(500, 1, function() {
                visions.shift();

                // Save to LocalStorage at intervals
                if (visions.length > 100) {
                    if ((visions.length % 5) == 0) {
                        localStorage.setItem('visions', JSON.stringify(visions));
                    };
                } else {
                    localStorage.setItem('visions', JSON.stringify(visions));
                };

                clickable = true;
            });
        });
    } else {
        // No more visions
        $('#infoIcon').fadeOut(500);
        $('#vision').fadeTo(500, 0, function() {
            $(this).hide();
            clickable = false;
            selectPreloaderText();
        });
    };
};

centerAdvice = function() {
    var adviceText = $('#vision');
    var deviceWidth = window.innerWidth;
    var deviceHeight = window.innerHeight;

    var adviceWidth = adviceText.width();
    var adviceHeight = adviceText.height() + visionPadding;

    adviceText.css('margin-top', (deviceHeight/2) - (adviceHeight/2));
    adviceText.css('margin-left', (deviceWidth/2) - (adviceWidth/2));
};


// ===========================
// Info
// ===========================
$(document).on( "pageshow", "#info", function() {
   $('#twitterIcon').fadeIn(500);
});