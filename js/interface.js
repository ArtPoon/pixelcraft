var	colourKey = document.getElementById('colourkey'),
	ckContext = colourkey.getContext('2d'),
	sliderValue;

colourKey.width=200;
colourKey.height=400;

ckContext.font = '12px helvetica, arial, sans-serif';
ckContext.linewidth=1.0;
ckContext.fillstyle = 'black';
ckContext.textAlign = 'left';
ckContext.textBaseline = 'top';

context2.font = '128px Palatino';
context2.linewidth = 1.0;
context2.fillStyle = "white";
//context2.textAlign = 'left';
//context2.textBaseline = 'middle';
//context2.fontWeight = 'light';

Object.values = function (obj) {
	/*
	Return a set of unique object property values. 
	*/
	var vals = [],
		val;
	var keys = Object.keys(obj);
	
	for (var i = 0; i < keys.length; i++) {
		val = obj[keys[i]];
		if (vals.indexOf(val) > -1) {
			continue;
		}
		vals.push(val);
	}
	return vals;
}




function updateNColoursFromSlider (value) {
	sliderValue = value;
	document.getElementById('ncolState').innerHTML = value;
	updateCanvas(value);
	updateColorKey(value);
}


function triggerSlider() {
	document.getElementById('ncolSlider').onchange();
}


function updateCanvas (value) {
	var rgbStr;
	var mode = document.getElementById('dropdown').value;
	
	for (var i = 0, row = 0; row < imageData.height; row++) {
		for (var col = 0; col < imageData.width; col++) {
			if (imageData.data[i+3] == 0) {
				i += 4;
				continue;
			}
			context.beginPath();
			context.rect(10*col, 10*row, 8, 8);
			
			rgbStr = [imageData.data[i], imageData.data[i+1], imageData.data[i+2]].toString();
			context.fillStyle = 'rgb(' + palettes[mode][value][rgbStr] + ')';
			context.fill();
			// no need to explicitly close path for rectangles
	
			i += 4;
		}
	}
}


function updateColorKey (value) {
	/*
	Map RGB values in the palette to those of some craft type,
	e.g., DMC floss, Perler beads, Lego, etc.  These will be 
	rendered in an HTML5 Canvas object as a color key.
	*/
	var mode = document.getElementById('dropdown').value;
	
	colourKey.width = colourKey.width; // clear
	
	if (mode != 'rgb') {
		var colours = Object.values(palettes["rgb"][value]);
		var rgb, map, row = 0;
		var mapped = [];
		
		for (var i = 0; i < colours.length; i++) {
			// from original colour space
			rgb = colours[i].split(',').map(function(x){return+x;});
			
			// mapped RGB value
			map = lookupRGB(rgb[0], rgb[1], rgb[2], mode);
			if (mapped.indexOf(map) > -1) {
				// already in colour key
				continue;
			}
			
			ckContext.beginPath();
			ckContext.rect(0, i*10+5, 8, 8);
			ckContext.fillStyle = 'rgb(' + [map.r, map.g, map.b].toString() + ')';
			ckContext.fill();
			
			ckContext.fillStyle = 'black';
			ckContext.fillText(map.index, 10, row*10+12);
			ckContext.strokeText(map.index, 10, row*10+12);
			ckContext.fillText(map.name, 50, row*10+12);
			ckContext.strokeText(map.name, 50, row*10+12);
			
			mapped.push(map);
			row++;
		}
	}	
}



function windowToCanvas(cv, x, y) {
	/*
	From David Geary, Core HTML5 Canvas
	
	returns mouse coordinates in window relative to canvas
	*/
	
	// returns canvas bounding box relative to window
	var bbox = cv.getBoundingClientRect();
	return {	x: x - bbox.left * (cv.width / bbox.width),
				y: y - bbox.top * (cv.height / bbox.height) };
}



function roundedRect(cornerX, cornerY, width, height, cornerRadius) {
	/*
	yet another example from David Geary's Core HTML5 Canvas
	*/
	if (width > 0) 	context2.moveTo(cornerX + cornerRadius, cornerY);
	else			context2.moveTo(cornerX - cornerRadius, cornerY);
	
	context2.arcTo(	cornerX + width, cornerY, 
					cornerX + width, cornerY + height,
					cornerRadius);
					
	context2.arcTo(	cornerX + width, cornerY + height, 
					cornerX, cornerY + height,
					cornerRadius);
					
	context2.arcTo(	cornerX, cornerY + height, 
					cornerX, cornerY,
					cornerRadius);
	
	if (width > 0) {
		context2.arcTo(	cornerX, cornerY, 
						cornerX + cornerRadius, cornerY,
						cornerRadius);
	} else {
		context2.arcTo(	cornerX, cornerY, 
						cornerX - cornerRadius, cornerY,
						cornerRadius);
	}
}


function drawRoundedRect (strokeStyle, fillStyle, cornerX, cornerY,
							width, height, cornerRadius) {
	context.beginPath();
	
	roundedRect(cornerX, cornerY, width, height, cornerRadius);
	
	context2.strokeStyle = strokeStyle;
	context2.fillStyle = fillStyle;
	
	context2.stroke();
	context2.fill();
	context2.closePath();
}

canvas2.onmousemove=function(e) {
	/*
	If mouse is over canvas, highlight the pixel square that 
	it overlaps.
	*/
	var loc = windowToCanvas(canvas2, e.clientX, e.clientY);
	
	
	// what is the nearest square?  canvas partitioned by 10's
	var sqr = {	x: Math.floor(loc.x / 10), 
				y: Math.floor(loc.y / 10) };
	
	//console.log(sqr.x, sqr.y); // debugging
	
	canvas2.width = canvas2.width;
	
	if (imageData && sqr.x < imageData.width && sqr.y < imageData.height) {	
		context2.beginPath();
		context2.rect(10*sqr.x-2, 10*sqr.y-2, 12, 12);
	
		context2.strokeStyle = 'rgb(0,0,0)';
		context2.stroke();
		context2.closePath();
	
		// draw a translucent box with info
		context2.beginPath();
		drawRoundedRect('white', 'rgba(0,0,0,0.5)', 10*sqr.x + 20, 10*sqr.y + 20, 200, 85, 15);
		context2.closePath();
		
		context2.font = '12px Courier New, Courier, monospace';
		context2.fillStyle = 'white';
		context2.fontWeight = 'lighter';
		context2.fillText('x: '+sqr.x, 10*sqr.x + 32, 10*sqr.y + 40);
		context2.fillText('y: '+sqr.y, 10*sqr.x + 32, 10*sqr.y + 52);
		//context2.strokeText('foo', 10*sqr.x + 40, 10*sqr.y + 40);
		
		var mode = document.getElementById('dropdown').value;
		var idx = 4 * (imageData.width * sqr.y + sqr.x);
		var rgbStr = [imageData.data[idx], imageData.data[idx+1], imageData.data[idx+2]].toString();
			
		if (palettes[mode][sliderValue].hasOwnProperty(rgbStr)) {
			if (mode == 'rgb') {
				var col = palettes['rgb'][sliderValue][rgbStr];
				var rgb = col.split(',').map(function(x){return+x;});
				context2.fillText('r: '+rgb[0], 10*sqr.x + 32, 10*sqr.y + 64);
				context2.fillText('g: '+rgb[1], 10*sqr.x + 32, 10*sqr.y + 76);
				context2.fillText('b: '+rgb[2], 10*sqr.x + 32, 10*sqr.y + 88);
			}
			else {
				var col = palettes[mode][sliderValue][rgbStr];
				var rgb = col.split(',').map(function(x){return+x;});
				var map = lookupRGB(rgb[0], rgb[1], rgb[2], mode);
				context2.fillText(map.index, 10*sqr.x + 32, 10*sqr.y + 64);
				context2.fillText(map.name, 10*sqr.x + 32, 10*sqr.y + 76);
			}
		}
	}
		
}


canvas2.onmouseout=function(e) {
	canvas2.width = canvas2.width;
}
