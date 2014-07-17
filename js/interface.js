var	colourKey = document.getElementById('colourkey'),
	//ckContext = colourkey.getContext('2d'),
	sliderValue;

colourKey.width=200;
colourKey.height=400;

var pixel_step = 12,
    pixel_width = 10;

/*
ckContext.font = '12px helvetica, arial, sans-serif';
ckContext.linewidth=1.0;
ckContext.fillstyle = 'black';
ckContext.textAlign = 'left';
ckContext.textBaseline = 'top';
*/

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
};


function invertColour (rgbStr) {
    /*
    Convert an RGB string ("r,g,b") to another RGB
     value that is distant in colour space.
     */
    var step = 50;
    var rgb = rgbStr.split(',').map(function(x) {return+x;});
    var invRgbStr = '',
        invRgb;
    for (var i = 0; i < 3; i++) {
        invRgb = rgb[i] + ((rgb[i] < 128) ? step : -step);
        invRgbStr += invRgb.toString();
        if (i < 2) {
            invRgbStr += ',';
        }
    }
    return invRgbStr;
}

function decoratePixel (ctx, x, y, key, invcol) {
    /*
    Decorate pixel on HTML5 Canvas with some shape to distinguish
    between similar colours.
    Arguments:
        ctx = HTML5 Canvas context
        x = left of pixel square
        y = top of pixel square
        key = ASCII indicating which shape to draw ('0oDU^dvA+-|/\1234')
        invcol = tuple of RGB values as comma-delimited string
     */
    var half = pixel_width/2.,
        shim = pixel_width/8.,
        pi = Math.PI;

    ctx.beginPath();
    ctx.fillStyle = 'rgb(' + invcol + ')';
    ctx.strokeStyle = 'rgb(' + invcol + ')';
    if (key === '0') { // filled circle
        ctx.arc(x+half, y+half, 0.6*half, 0, 2*pi, true);
        ctx.fill();
    } else if (key === 'o') { // open circle
        ctx.arc(x+half, y+half, 0.6*half, 0, 2*pi, true);
        ctx.stroke();
    } else if (key === 'D') { // semicircle right
        ctx.arc(x+half, y+half, 0.8*half, -.5*pi, .5*pi, false); // clockwise
        ctx.fill();
    } else if (key === 'U') { // semicircle down
        ctx.arc(x+half, y+half, 0.8*half, 0, pi, false); // clockwise
        ctx.fill();
    } else if (key === '^') { // semicircle up
        ctx.arc(x+half, y+half, 0.8*half, 0, pi, true); // anti-clockwise
        ctx.fill();
    } else if (key === 'd') { // semicircle left
        ctx.arc(x+half, y+half, 0.8*half, -.5*pi, .5*pi, true); // anti-clockwise
        ctx.fill();
    } else if (key === 'v') { // triangle down
        ctx.moveTo(x+half, y+half);
        ctx.lineTo(x+pixel_width-shim, y+shim);
        ctx.lineTo(x+shim, y+shim);
        ctx.lineTo(x+half, y+half);
        ctx.fill();
    } else if (key === 'A') { // triangle up
        ctx.moveTo(x+half, y+half);
        ctx.lineTo(x+pixel_width-shim, y+pixel_width-shim);
        ctx.lineTo(x+shim, y+pixel_width-shim);
        ctx.lineTo(x+half, y+half);
        ctx.fill();
    } else if (key === '+') {
        ctx.moveTo(x+shim, y+half);
        ctx.lineTo(x+pixel_width-shim, y+half);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x+half, y+shim);
        ctx.lineTo(x+half, y+pixel_width-shim);
        ctx.stroke();
    } else if (key === '-') {
        ctx.moveTo(x+shim, y+half);
        ctx.lineTo(x+pixel_width-shim, y+half);
        ctx.stroke();
    } else if (key === '|') {
        ctx.moveTo(x+half, y+shim);
        ctx.lineTo(x+half, y+pixel_width-shim);
        ctx.stroke();
    } else if (key == '/') {
        ctx.moveTo(x+shim, y+pixel_width-shim);
        ctx.lineTo(x+pixel_width-shim, y+shim);
        ctx.stroke();
    } else if (key == '\\') {
        ctx.moveTo(x+shim, y+shim);
        ctx.lineTo(x+pixel_width-shim, y+pixel_width-shim);
        ctx.stroke();
    } else if (key == 'x') {
        ctx.moveTo(x+shim, y+pixel_width-shim);
        ctx.lineTo(x+pixel_width-shim, y+shim);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x+shim, y+shim);
        ctx.lineTo(x+pixel_width-shim, y+pixel_width-shim);
        ctx.stroke();
    } else if (key == '1') { // upper-right quadrant
        ctx.fillRect(x, y, half, half);
    } else if (key == '2') {
        ctx.fillRect(x+half, y, half, half);
    } else if (key == '3') {
        ctx.fillRect(x+half, y+half, half, half);
    } else if (key == '4') {
        ctx.fillRect(x, y+half, half, half);
    }
}


function updateNColoursFromSlider () {
	sliderValue = $('#ncolSlider').val();
	document.getElementById('ncolState').innerHTML = sliderValue;
	updateCanvas(sliderValue);
	updateColorKey(sliderValue);
}


function triggerSlider() {
	document.getElementById('ncolSlider').onchange();
}


function updateCanvas (value) {
    /*
    Redraw pixels on canvas given the number of colours as set
    by slider (value).
     */
	var rgbStr, mapped;
	var mode = document.getElementById('dropdown').value;
	var x, y;
    var decorate_keys = 'v1A-dU^o+23D0/4\\|';

    // cache colour inversions and decoration keys
    var i, key;
    var cache = {};
    var keys = Object.keys(palettes[mode][value]);
    for (i = 0; i < keys.length; i++) {
        key = keys[i];
        cache[key] = {};
        cache[key]['inv'] = invertColour(palettes[mode][value][key]);
        cache[key]['dec'] = decorate_keys[i];
    }

    // loop through image data pixel-by-pixel
    var v;
	for (i = 0, row = 0; row < imageData.height; row++) {
		for (var col = 0; col < imageData.width; col++) {
			if (imageData.data[i+3] == 0) {
				i += 4;
				continue;
			}
            x = pixel_step * col;
            y = pixel_step * row;

			context.beginPath();
			context.rect(x, y, pixel_width, pixel_width);
			
			rgbStr = [imageData.data[i], imageData.data[i+1], imageData.data[i+2]].toString();
            mapped = palettes[mode][value][rgbStr];
			context.fillStyle = 'rgb(' + mapped + ')';
			context.fill(); // no need to explicitly close path for rectangles

            // decorate pixel?
            if ($('#decorate_pixel_checkbox').prop('checked')) {
                v = cache[rgbStr];
                decoratePixel(context, x, y, v['dec'], v['inv']);
            }

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
	
	if (mode === 'rgb') {
        return;
    }
    var colours = Object.values(palettes["rgb"][value]);
    var rgb, map, row = 0;
    var mapped = [];

    // clear table
    $('#colour_key_table tbody tr').remove();


    for (var i = 0; i < colours.length; i++) {
        // from original colour space
        rgb = colours[i].split(',').map(function(x){return+x;});

        // mapped RGB value
        map = lookupRGB(rgb[0], rgb[1], rgb[2], mode);
        if (mapped.indexOf(map) > -1) {
            // already in colour key
            continue;
        }

        htmlStr = '<tr>';

        // make color swatch
        htmlStr += '<td width="15" bgcolor="#';
        htmlStr += (map.r).toString(16);
        htmlStr += (map.g).toString(16);
        htmlStr += (map.b).toString(16);
        htmlStr += '"></td>';

        htmlStr += '<td>' + map.index + '</td>';
        htmlStr += '<td>' + map.name + '</td>';
        htmlStr += '</tr>';

        $('#colour_key_table tbody').append(htmlStr);

        /*
        ckContext.beginPath();
        ckContext.rect(0, i*10+5, 8, 8);
        ckContext.fillStyle = 'rgb(' + [map.r, map.g, map.b].toString() + ')';
        ckContext.fill();

        ckContext.fillStyle = 'black';
        ckContext.fillText(map.index, 10, row*10+12);
        ckContext.strokeText(map.index, 10, row*10+12);
        ckContext.fillText(map.name, 50, row*10+12);
        ckContext.strokeText(map.name, 50, row*10+12);
        */

        mapped.push(map);
        row++;
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
	var sqr = {	x: Math.floor(loc.x / pixel_step),
				y: Math.floor(loc.y / pixel_step) };
	
	//console.log(sqr.x, sqr.y); // debugging
	
	canvas2.width = canvas2.width;
	
	if (imageData && sqr.x < imageData.width && sqr.y < imageData.height) {
        var mode = document.getElementById('dropdown').value;

		context2.beginPath();
		context2.rect(pixel_step*sqr.x-1, pixel_step*sqr.y-1, pixel_width+2, pixel_width+2);
	
		context2.strokeStyle = 'rgb(0,0,0)';
		context2.stroke();
		context2.closePath();
	
		// draw a translucent box with info
		context2.beginPath();
        if (mode === 'rgb') {
            drawRoundedRect('white', 'rgba(0,0,0,0.5)', pixel_step * (sqr.x + 1), pixel_step * (sqr.y + 1), 80, 85, 15);
        } else {
            drawRoundedRect('white', 'rgba(0,0,0,0.5)', pixel_step * (sqr.x + 1), pixel_step * (sqr.y + 1), 200, 85, 15);
        }
		context2.closePath();

        // report pixel coordinates in box
		context2.font = '12px Courier New, Courier, monospace';
		context2.fillStyle = 'white';
		context2.fontWeight = 'lighter';
		context2.fillText('x: '+sqr.x, pixel_step*(sqr.x+2), pixel_step*(sqr.y+2.5));
		context2.fillText('y: '+sqr.y, pixel_step*(sqr.x+2), pixel_step*(sqr.y+3.5));
		//context2.strokeText('foo', 10*sqr.x + 40, 10*sqr.y + 40);

        // retrieve pixel info
		var idx = 4 * (imageData.width * sqr.y + sqr.x);
		var rgbStr = [imageData.data[idx], imageData.data[idx+1], imageData.data[idx+2]].toString();

        // report pixel RGB or colour map
        var col, rgb, map;
		if (palettes[mode][sliderValue].hasOwnProperty(rgbStr)) {
			if (mode == 'rgb') {
				col = palettes['rgb'][sliderValue][rgbStr];
				rgb = col.split(',').map(function(x){return+x;});
				context2.fillText('r: '+rgb[0], pixel_step*(sqr.x+2), pixel_step*(sqr.y + 4.5));
				context2.fillText('g: '+rgb[1], pixel_step*(sqr.x+2), pixel_step*(sqr.y + 5.5));
				context2.fillText('b: '+rgb[2], pixel_step*(sqr.x+2), pixel_step*(sqr.y + 6.5));
			}
			else {
				col = palettes[mode][sliderValue][rgbStr];
				rgb = col.split(',').map(function(x){return+x;});
				map = lookupRGB(rgb[0], rgb[1], rgb[2], mode);
				context2.fillText(map.index, pixel_step*(sqr.x+2), pixel_step*(sqr.y + 4.5));
				context2.fillText(map.name, pixel_step*(sqr.x+2), pixel_step*(sqr.y + 5.5));
			}
		}
	}
		
}


canvas2.onmouseout=function(e) {
	canvas2.width = canvas2.width;
}
