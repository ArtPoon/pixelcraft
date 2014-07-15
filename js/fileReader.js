
// global scoping for debugging

/*
var preview = document.getElementById('preview'),
	previewContext = preview.getContext('2d');
*/
var	canvas = document.getElementById('canvas'),
	canvas2 = document.getElementById('canvas2'),
	context = canvas.getContext('2d'),
	context2 = canvas2.getContext('2d'),
	reader = new FileReader(),
	img,
	imageData,
	palettes = new Array();

canvas.width = 1000;
canvas.height = 1000;
canvas2.width = 1000;
canvas2.height = 1000;

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
        // FIXME: not very elegant - let's use a div tag instead
		context.font = '64px Helvetica';
		context.linewidth=1.0;
		context.fillstyle = 'cornflowerblue';
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.fillText('PNG or GIF only', canvas.width/2, canvas.height/2);
		//document.getElementById('output').innerHTML = "<p>Not an image file!</p>";
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
            // FIXME: why do this? to clear canvas?
			canvas.width = canvas.width;
			canvas2.width = canvas2.width;

            // need to draw image on canvas to access image data
			context.drawImage(img, 0, 0);
			
			imageData = context.getImageData(0, 0, img.width, img.height);
			var numColours = Object.keys(getColours(imageData)).length;
			
			// reset canvases
			context.clearRect(0, 0, canvas.width, canvas.height);
			context2.clearRect(0, 0, canvas2.width, canvas2.height);
			
			// pixels are in row-major order
			for (var i = 0, row = 0; row < imageData.height; row++) {
				for (var col = 0; col < imageData.width; col++) {
					if (imageData.data[i+3] == 0) {
						// do not draw transparent region
						i += 4;
						continue;
					}
					context.beginPath();
					context.rect(10*col, 10*row, 8, 8);
					context.fillStyle = 'rgb(' + [imageData.data[i], 
						imageData.data[i+1], imageData.data[i+2]].toString() + ')';
					context.fill();
					// no need to explicitly close path for rectangles
			
					i += 4;
				}
			}
			
			
			// generate palettes
			palettes["rgb"] = makePalette(imageData);
			
			var modes = ["dmc", "anchor", "perler", "hama", "lego", "crayola"];
			
			for (var mi = 0; mi < modes.length; mi++) {
				palettes[modes[mi]] = new Array();
			}
			
			var keys, mapped, key, val, rgb, map;
			
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
			
			// generate first colour key
			updateColorKey (numColours);
			
			// reset dropdown to RGB
			document.getElementById('dropdown').value = 'rgb';
			colourKey.width = colourKey.width;
		} else {
			setTimeout(arguments.callee, 50);
		}
	})();
	
	
	
	
};

