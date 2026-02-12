window.HELP_IMPROVE_VIDEOJS = false;

var INTERP_BASE = "./static/interpolation/stacked";
var NUM_INTERP_FRAMES = 240;

var interp_images = [];
function preloadInterpolationImages() {
  for (var i = 0; i < NUM_INTERP_FRAMES; i++) {
    var path = INTERP_BASE + '/' + String(i).padStart(6, '0') + '.jpg';
    interp_images[i] = new Image();
    interp_images[i].src = path;
  }
}

function setInterpolationImage(i) {
  var image = interp_images[i];
  image.ondragstart = function() { return false; };
  image.oncontextmenu = function() { return false; };
  $('#interpolation-image-wrapper').empty().append(image);
}


$(document).ready(function() {
    // Check for click events on the navbar burger icon
    $(".navbar-burger").click(function() {
      // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
      $(".navbar-burger").toggleClass("is-active");
      $(".navbar-menu").toggleClass("is-active");

    });

    var options = {
			slidesToScroll: 1,
			slidesToShow: 3,
			loop: true,
			infinite: true,
			autoplay: false,
			autoplaySpeed: 3000,
    }

		// Initialize all div with carousel class
    var carousels = bulmaCarousel.attach('.carousel', options);

    // Loop on each carousel initialized
    for(var i = 0; i < carousels.length; i++) {
    	// Add listener to  event
    	carousels[i].on('before:show', state => {
    		console.log(state);
    	});
    }

    // Access to bulmaCarousel instance of an element
    var element = document.querySelector('#my-element');
    if (element && element.bulmaCarousel) {
    	// bulmaCarousel instance is available as element.bulmaCarousel
    	element.bulmaCarousel.on('before-show', function(state) {
    		console.log(state);
    	});
    }

    /*var player = document.getElementById('interpolation-video');
    player.addEventListener('loadedmetadata', function() {
      $('#interpolation-slider').on('input', function(event) {
        console.log(this.value, player.duration);
        player.currentTime = player.duration / 100 * this.value;
      })
    }, false);*/
    var $slider = $('#interpolation-slider');
    if ($slider.length) {
      preloadInterpolationImages();
      $slider.on('input', function(event) {
        setInterpolationImage(this.value);
      });
      setInterpolationImage(0);
      $slider.prop('max', NUM_INTERP_FRAMES - 1);
      bulmaSlider.attach();
    }

    var overlay = document.getElementById('lightbox-overlay');
    var overlayImg = document.getElementById('lightbox-image');
    var closeBtn = document.getElementById('lightbox-close');
    var zoomLevel = 1;
    var translateX = 0;
    var translateY = 0;
    var isDragging = false;
    var lastX = 0;
    var lastY = 0;

    var updateZoom = function () {
      overlayImg.style.transform = 'translate(' + translateX + 'px, ' + translateY + 'px) scale(' + zoomLevel + ')';
      overlayImg.style.cursor = zoomLevel === 1 ? 'zoom-in' : (isDragging ? 'grabbing' : 'grab');
    };

    var resetTransform = function () {
      zoomLevel = 1;
      translateX = 0;
      translateY = 0;
      isDragging = false;
      updateZoom();
    };

    if (overlay && overlayImg && closeBtn) {
      document.querySelectorAll('.js-lightbox-trigger').forEach(function(trigger) {
        trigger.addEventListener('click', function (event) {
          event.preventDefault();
          var src = trigger.getAttribute('data-lightbox-src');
          if (src) {
            overlayImg.src = src;
            resetTransform();
            overlay.classList.add('is-active');
          }
        });
      });
      var closeLightbox = function () {
        overlay.classList.remove('is-active');
        overlayImg.src = '';
        resetTransform();
      };

      closeBtn.addEventListener('click', closeLightbox);
      overlay.addEventListener('click', function (event) {
        if (event.target === overlay) {
          closeLightbox();
        }
      });
      document.addEventListener('keyup', function(event) {
        if (event.key === 'Escape') {
          closeLightbox();
        }
      });

      overlayImg.addEventListener('click', function(event) {
        event.stopPropagation();
        if (zoomLevel === 1) {
          zoomLevel = 2;
        } else {
          resetTransform();
          return;
        }
        updateZoom();
      });

      overlayImg.addEventListener('mousedown', function(event) {
        if (zoomLevel === 1) {
          return;
        }
        isDragging = true;
        lastX = event.clientX;
        lastY = event.clientY;
        overlayImg.style.cursor = 'grabbing';
        event.preventDefault();
        event.stopPropagation();
      });

      document.addEventListener('mousemove', function(event) {
        if (!isDragging) {
          return;
        }
        var deltaX = event.clientX - lastX;
        var deltaY = event.clientY - lastY;
        translateX += deltaX;
        translateY += deltaY;
        lastX = event.clientX;
        lastY = event.clientY;
        updateZoom();
      });

      document.addEventListener('mouseup', function() {
        if (isDragging) {
          isDragging = false;
          overlayImg.style.cursor = 'grab';
        }
      });

      overlayImg.addEventListener('wheel', function(event) {
        if (zoomLevel === 1) {
          return;
        }
        translateX -= event.deltaX;
        translateY -= event.deltaY;
        updateZoom();
        event.preventDefault();
      });
    }

})
