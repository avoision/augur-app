// ===========================
// Vars
// ===========================
var appInit = true,
    clickable = false,
    isTest = false,
    hasAds = false,
    visionsURL = "https://s3-us-west-2.amazonaws.com/avoision-augur/visions.json",
    visions = [];

var iadHeight = 0;

if (hasAds) {
    iadHeight = 32;
};

// ===========================
// Init
// ===========================
$(document).ready(function() {

    // Adjustments for iAd
    if (hasAds) {
        $('.footer').addClass('iadAdjustment');
    }



    // Set click functionality
    $('#vision').click(function() {
        showNextVision();
    });

    // $.mobile.changePage($('#first'));
    // document.addEventListener("deviceready", onDeviceReady, false);
});


// Device Ready           
function onDeviceReady() {
    console.log('ready');
    navigator.splashscreen.hide();

    if (checkConnection()) {
        
        $.mobile.changePage($('#preload'));
        // preLoaderM.reset();
        // preLoaderV.reset();
       
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
    };
}


// ===========================
// Home Screen
// ===========================
// On arriving at first screen
$(document).on( "pageshow", "#home", function() {
    $.mobile.changePage($('#adviceMain'));
});


// ===========================
// Advice Main: Preloader
// ===========================
// On arriving at adviceMain screen
$(document).on( "pageshow", "#adviceMain", function() {
    if (appInit) {
        appInit = false;
        selectPreloaderText();
    };
});


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

    centerPreloader();
    
}


centerPreloader = function() {
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

    preloadBlock.css('margin-top', (deviceHeight/2) - (preloadHeight/2));

    revealPreloader();
};


revealPreloader = function() {
    $('#preloadWrapper').fadeTo(200, 1, function() {
        getVisionsData();
    });
};


getVisionsData = function() {
    visions = [];

    $.getJSON( visionsURL, function( data ) {
        console.log('>>> Data received!');
        $.each( data, function( i, item ) {
            visions.push(data[i].tweet);
        });

        // Randomize it up!
        visions = _.shuffle(visions);
        fadePreloader();
    });
};


fadePreloader = function()  {
    $('#preloadWrapper').fadeOut(550, function() {
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
                clickable = true;
            });            
        })
    } else {
        alert("no more visions!");
    }
};


centerAdvice = function() {
    var adviceText = $('#vision');
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
};


// ===========================
// Info
// ===========================
$(document).on( "pageshow", "#info", function() {
   $('#twitterIcon').fadeIn(500);
});







