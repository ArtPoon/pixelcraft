//var	colourKey = document.getElementById('colourkey'),
//	ckContext = colourkey.getContext('2d'),
var	sliderValue;

//colourKey.width=300;
//colourKey.height=400;

var legend_step = 15,
    pixel_step = 11,
    pixel_width = 10,
    grid_step = 2,
    pixels_per_grid = 10,
    pixel_margin = 20;

/*
ckContext.font = '12px helvetica, arial, sans-serif';
ckContext.linewidth = 1.0;
ckContext.fillstyle = 'black';
ckContext.textAlign = 'left';
ckContext.textBaseline = 'top';
*/


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
    var step = 64;
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
	//updateColorKey(sliderValue);
}


function triggerSlider() {
	document.getElementById('ncolSlider').onchange();
}


function updateCanvas (value) {
    /*
    Redraw pixels on canvas given the number of colours as set
    by slider (value).  Display only one 50x50 page at a time.
     */
	var rgbStr, mapped;
	var mode = document.getElementById('dropdown').value;
	var x, y;
    var decorate_keys = 'v1A-dU^o+2D03/4\\|';

    // clear canvas
    canvas.width = canvas.width;

    // FIXME: adjust values for each page
    var page = $('#page_select').val() - 1,
        origin_x = pixels_per_page * Math.floor(page / pagesWide),
        origin_y = pixels_per_page * (page % pagesWide);

    // cache colour inversions and decoration keys
    var i;  // counter
    var key;
    var cache = {};
    var keys = Object.keys(palettes[mode][value]);
    for (i = 0; i < keys.length; i++) {
        key = keys[i];
        cache[key] = {};
        cache[key]['inv'] = invertColour(palettes[mode][value][key]);
        cache[key]['dec'] = decorate_keys[i];
    }

    // loop through image data pixel-by-pixel
    var v, row, col;
	for (row = origin_x; row < origin_x + pixels_per_page; row++) {
        if (row >= imageData.height) {
            // past limit of image
            break;
        }
		for (col = origin_y; col < origin_y + pixels_per_page; col++) {
            if (col >= imageData.width) {
                // past end of row in image
                break;
            }
            // imageData.data is a vector indexed as (row*ncol + col)
            i = 4 * (row * imageData.width + col);
            // skip transparent pixels
			if (imageData.data[i+3] == 0) {
				continue;
			}

            // adjust row, col to canvas
            x = pixel_margin + (col % pixels_per_page) * pixel_step + Math.floor(col / pixels_per_grid) * grid_step;
            y = pixel_margin + (row % pixels_per_page) * pixel_step + Math.floor(row / pixels_per_grid) * grid_step;

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
		}
	}

    // now draw colour key
    var colour_key = [];
    var colours = Object.values(palettes['rgb'][value]);
    var rgb, map;

    context.font = '12px helvetica, arial, sans-serif';
    for (i = 0; i < colours.length; i++) {
        // from original colour space
        rgb = colours[i].split(',').map(function(x){return+x;});

        if (mode === 'rgb') {
            context.fillStyle = 'rgb(' + colours[i] + ')';
        } else {
            // RGB value mapped to another palette
            map = lookupRGB(rgb[0], rgb[1], rgb[2], mode);
            if (colour_key.indexOf(map) > -1) {
                // already in colour key
                continue;
            }

            x = pixels_per_page * pixel_step + pixel_margin;
            y = pixel_margin + legend_step * i;

            context.fillStyle = 'rgb('+map.r+','+map.g+','+map.b+')';
            context.fillRect(x, y, pixel_width, pixel_width);

            context.fillStyle = '#000000';
            context.fillText(map.index + ' ' + map.name, x + pixel_step, y + pixel_width - 1);
        }



        colour_key.push(map);
    }
}


function updateColorKey (value) {
	/*
	Map RGB values in the palette to those of some craft type,
	e.g., DMC floss, Perler beads, Lego, etc.  These will be 
	rendered in an HTML5 Canvas object as a color key.
	*/
	var mode = document.getElementById('dropdown').value;
	
	//colourKey.width = colourKey.width; // clear
	
	if (mode === 'rgb') {
        return;
    }
    var colours = Object.values(palettes["rgb"][value]);
    var htmlStr, rgb, map, row = 0;
    var mapped = [];


    $('#colour_key_table tbody tr').remove(); // clear table
    colourKey.width = pixel_width;
    colourKey.height = pixel_width * colours.length;

    var hexval = '';
    for (var i = 0; i < colours.length; i++) {
        // from original colour space
        rgb = colours[i].split(',').map(function(x){return+x;});

        // RGB value mapped to another palette
        map = lookupRGB(rgb[0], rgb[1], rgb[2], mode);
        if (mapped.indexOf(map) > -1) {
            // already in colour key
            continue;
        }



        // make color swatch - translate rgb tuple to hex string
        // TODO: draw pixel marks onto colourkey canvas nested in table
        ckContext.fillStyle('#990000');
        ckContext.fillRect(0, 0, 10, 10);
        /*
        htmlStr += '<td width="15" bgcolor="#';
        hexval = (map.r).toString(16); // red
        if (hexval.length < 2) {
            htmlStr += '0'
        }
        htmlStr += hexval;
        hexval = (map.g).toString(16); // green
        if (hexval.length < 2) {
            htmlStr += '0'
        }
        htmlStr += hexval;
        hexval = (map.b).toString(16); // blue
        if (hexval.length < 2) {
            htmlStr += '0'
        }
        htmlStr += hexval;
        htmlStr += '">'

        // pixel decorations - how can we do this?
        htmlStr += '</td>';
        */

        htmlStr = '<tr></tr><td>' + map.index + '</td>';
        htmlStr += '<td>' + map.name + '</td>';
        htmlStr += '<td>' + pixel_counts[colours[i]] + '</td>';

        // TODO: give pixel count of this colour

        htmlStr += '</tr>';

        $('#colour_key_table tbody').append(htmlStr);

        mapped.push(map);
        row++;
    }
}

