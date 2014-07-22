
// global scoping for debugging

/*
var preview = document.getElementById('preview'),
	previewContext = preview.getContext('2d');
*/
var	canvas = document.getElementById('canvas'),
	//canvas2 = document.getElementById('canvas2'),
	context = canvas.getContext('2d'),
	//context2 = canvas2.getContext('2d'),
	reader = new FileReader(),
	img,
	imageData,
    pagesWide, pagesHigh,
	palettes = new Array(),
    pixel_counts = {}, // record the pixel count of RGB values, including merges
    num_pages;

var pixels_per_page = 50;  // draw a 50x50 image on each page

canvas.width = 1000;
canvas.height = 1000;
//canvas2.width = 1000;
//canvas2.height = 1000;


// Event handlers.........................................

window.onload = function() {
	// Check for the various File API support.
	if (window.File && window.FileReader && window.FileList && window.Blob) {
	  // Great success! All the File APIs are supported.
	} else {
	  alert('The File APIs are not fully supported in this browser.');
	}
	
	document.getElementById('ncolSlider').disabled = true;
	
	// bind file browser to HTML5 FileReader
	document.getElementById('inputFile').addEventListener('change', handleFileSelect, false);
}



function handleFileSelect(evt) {
    /*
    Handle file selected by browser dialog.
     */
	var files = evt.target.files; // FileList object
	var f = files[0];
	
	// Only process image files.
	if (!f.type.match('image/png') &&  !f.type.match('image/gif')) {
        alert('Sorry, this script will only process PNG or GIF-type files.  ' +
            'You attempted to process a file of type: ' + f.type);
		return;
	}
	
	reader.onload = fileReadComplete;
	reader.readAsDataURL(f);
}



// Read in the image file as a data URL and render in main canvas
function fileReadComplete (e) {
	img = new Image();
	img.src = e.target.result;
	
	(function() {
		if (img.complete){
            // clear HTML5 canvases
			canvas.width = canvas.width;
			//canvas2.width = canvas2.width;

            // need to draw image on canvas to access image data
			context.drawImage(img, 0, 0);
			
			imageData = context.getImageData(0, 0, img.width, img.height);

            // if image is too big, alert user
            if (imageData.width > 500 || imageData.height > 500) {
                canvas.width = canvas.width;
                alert('Sorry, this script will not process images greater than 500 ' +
                    'pixels wide or 500 pixels high.  ' +
                    'Your image is ' + imageData.width + ' x ' + imageData.height +
                    '.  You can download and modify the JS code and run it locally, but ' +
                    'performance will be slow.');
                return;
            }

			var numColours = Object.keys(getColours(imageData)).length;
			
			// reset canvases
			context.clearRect(0, 0, canvas.width, canvas.height);
			//context2.clearRect(0, 0, canvas2.width, canvas2.height);

			// generate RGB tree (clustering colours)
			palettes["rgb"] = makePalette(imageData);
			
			var modes = ["dmc", "anchor", "perler", "hama", "lego", "crayola"];
			
			for (var mi = 0; mi < modes.length; mi++) {
				palettes[modes[mi]] = new Array();
			}
			
			var keys, mapped, key, val, rgb, map;

            // map RGB tree to mode-specific palette
			for (var i = 2; i <= numColours; i++) {
				keys = Object.keys(palettes["rgb"][i]);
				mapped = new Array();
				
				for (var mi = 0; mi < modes.length; mi++) {
					palettes[modes[mi]][i] = new Array();
				}
				
				for (var j = 0; j < keys.length; j++) {
					key = keys[j].split(',').map(function(x){return+x;});
					val = palettes["rgb"][i][key];
					rgb = val.split(',').map(function(x){return+x;});
					
					for (var mi = 0; mi < modes.length; mi++) {
						map = lookupRGB(rgb[0], rgb[1], rgb[2], modes[mi]);
						palettes[modes[mi]][i][keys[j]] = [map.r, map.g, map.b].toString();
					}
				}
			}
			
			
			// set slider maximum
			document.getElementById('ncolSlider').disabled = false;
			document.getElementById('ncolSlider').max = numColours;
			document.getElementById('ncolSlider').value = numColours;
			document.getElementById('ncolState').innerHTML = numColours;
			sliderValue = numColours;

			// reset dropdown to RGB
			document.getElementById('dropdown').value = 'rgb';
			//colourKey.width = colourKey.width;

            // calculate the number of pages
            pagesWide = Math.ceil(imageData.width / pixels_per_page),
            pagesHigh = Math.ceil(imageData.height / pixels_per_page);

            num_pages = pagesWide * pagesHigh;  // set global variable
            $('#page_select option').remove(); // clear the select drop-down
            for (i = 1; i <= num_pages; i++) {
                $('#page_select').append('<option value="'+i+'">'+i+'</option>');
            }

            updateCanvas(numColours); // draw image
            updateColourKey(numColours); // generate first colour key
		} else {
			setTimeout(arguments.callee, 50);
		}
	})();
	
	
	
	
};

