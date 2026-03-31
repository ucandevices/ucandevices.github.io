/*!
 * Start Bootstrap - Creative Bootstrap Theme (http://startbootstrap.com)
 * Code licensed under the Apache License v2.0.
 * For details, see http://www.apache.org/licenses/LICENSE-2.0.
 */

(function($) {
    "use strict"; // Start of use strict

    // Smooth-scroll to the hash on page load (e.g., arriving from another page
    // via index.html#contact). Reset to top first so we animate from the top
    // instead of just nudging the browser's auto-jump by the navbar offset.
    if (window.location.hash) {
        var $hashTarget = $(window.location.hash);
        if ($hashTarget.length) {
            $(window).scrollTop(0);
            setTimeout(function() {
                $('html, body').stop().animate({
                    scrollTop: ($hashTarget.offset().top - 50)
                }, 1250, 'easeInOutExpo');
            }, 50);
        }
    }

    // jQuery for page scrolling feature - requires jQuery Easing plugin
    // Delegated because the navbar is injected later via Angular ng-include.
    $(document).on('click', 'a.page-scroll', function(event) {
        var href = $(this).attr('href') || '';
        var hashIndex = href.indexOf('#');
        if (hashIndex === -1) return;

        var path = href.substring(0, hashIndex);
        var hash = href.substring(hashIndex);
        var currentPage = window.location.pathname.split('/').pop() || 'index.html';
        if (path && path !== currentPage) return;

        var $target = $(hash);
        if (!$target.length) return;

        $('html, body').stop().animate({
            scrollTop: ($target.offset().top - 50)
        }, 1250, 'easeInOutExpo');
        event.preventDefault();
    });

    // Highlight the top nav as scrolling occurs
    $('body').scrollspy({
        target: '.navbar-fixed-top',
        offset: 51
    })

    // Closes the Responsive Menu on Menu Item Click
    $('.navbar-collapse ul li a').click(function() {
        $('.navbar-toggle:visible').click();
    });

    // Fit Text Plugin for Main Header
    $("h1").fitText(
        1.2, {
            minFontSize: '35px',
            maxFontSize: '65px'
        }
    );

    // Offset for Main Navigation
    $('#mainNav').affix({
        offset: {
            top: 100
        }
    })

    // Initialize WOW.js Scrolling Animations
    new WOW().init();

})(jQuery); // End of use strict
