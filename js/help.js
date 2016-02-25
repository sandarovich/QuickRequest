$(document).ready(function(){
    var message = $( '.message' );
        if (message.length) {
            setTimeout( function() {
            message.fadeOut( 'slow' );
        }, 5000 );
    }
});