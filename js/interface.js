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
    } else if (key == '1') { // upper-left quadrant
        ctx.fillRect(x, y, half, half);
    } else if (key == '2') {
        ctx.fillRect(x+half, y, half, half);
    } else if (key == '3') {
        ctx.fillRect(x+half, y+half, half, half);
    } else if (key == '4') {
        ctx.fillRect(x, y+half, half, half);
    }
}


function decoratePixelPDF(doc, x, y, key, rgbStr) {
    /*
    Decorate pixel on PDF using jsPDF.
     */
    var half = pixel_width/2.,
        shim = pixel_width/8.,
        hypo = Math.sqrt(2) * half,
        rgb = rgbStr.split(',').map(function(x) {return+x;});
        invcol = invertColour(rgbStr),
        invrgb = invcol.split(',').map(function(x) {return+x;});

    doc.setLineWidth(1.5);
    doc.setDrawColor(invrgb[0], invrgb[1], invrgb[2]);
    doc.setFillColor(invrgb[0], invrgb[1], invrgb[2]);
    if (key === '0') {
        doc.circle(x+half, y+half, 0.6*half, 'F');
    } else if (key === 'o') {
        doc.circle(x+half, y+half, 0.6*half, 'D');
    } else if (key === 'D') {
        doc.circle(x+half, y+half, 0.8*half, 'F');
        doc.setFillColor(rgb[0], rgb[1], rgb[2]);
        doc.rect(x, y, half, pixel_width, 'F');
    } else if (key === 'U') {
        doc.circle(x+half, y+half, 0.8*half, 'F');
        doc.setFillColor(rgb[0], rgb[1], rgb[2]);
        doc.rect(x, y, pixel_width, half, 'F');
    } else if (key === '^') { // semi-circle up
        doc.circle(x+half, y+half, 0.8*half, 'F');
        doc.setFillColor(rgb[0], rgb[1], rgb[2]);
        doc.rect(x, y+half, pixel_width, half, 'F');
    } else if (key === 'd') { // semi-circle left
        doc.circle(x+half, y+half, 0.8*half, 'F');
        doc.setFillColor(rgb[0], rgb[1], rgb[2]);
        doc.rect(x+half, y, half, pixel_width, 'F');
    } else if (key === 'v') { // triangle down
        doc.triangle(x+shim, y+shim, x+pixel_width-shim, y+shim, x+half, y+half, 'F');
    } else if (key === 'A') { // triangle up
        doc.triangle(x+shim, y+pixel_width-shim, x+pixel_width-shim, y+pixel_width-shim, x+half, y+half, 'F');
    } else if (key === '+') {
        doc.lines([[pixel_width-2*shim, 0]], x+shim, y+half);
        doc.lines([[0, pixel_width-2*shim]], x+half, y+shim);
    } else if (key === '-') {
        doc.lines([[pixel_width-2*shim, 0]], x+shim, y+half);
    } else if (key === '|') {
        doc.lines([[0, pixel_width-2*shim]], x+half, y+shim);
    } else if (key === '/') {
        doc.lines([[hypo, -hypo]], x+shim, y+pixel_width-shim);
    } else if (key === '\\') {
        doc.lines([[hypo, hypo]], x+shim, y+shim);
    } else if (key === 'x') {
        doc.lines([[hypo, -hypo]], x+shim, y+pixel_width-shim);
        doc.lines([[hypo, hypo]], x+shim, y+shim);
    } else if (key === '1') {  // upper left quadrant fill
        doc.rect(x, y, half, half, 'F');
    } else if (key === '2') {
        doc.rect(x+half, y, half, half, 'F');
    } else if (key === '3') {
        doc.rect(x+half, y+half, half, half, 'F');
    } else if (key === '4') {
        doc.rect(x, y+half, half, half, 'F');
    }
}


function updateNColoursFromSlider () {
	sliderValue = $('#ncolSlider').val();
	document.getElementById('ncolState').innerHTML = sliderValue;
	updateCanvas(sliderValue);
	//updateColorKey(sliderValue);
}


function triggerSlider() {
    /*
    When drop-down is changed, trigger event handler of slider.
     */
	document.getElementById('ncolSlider').onchange();
    if (imageData === undefined) {
        // no image loaded
        return;
    }
    var sliderValue = $('#ncolSlider').val();
    updateColourKey(sliderValue);
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
            context.fillStyle = 'rgb(' + map.r + ',' + map.g + ',' + map.b + ')';
        }

        x = pixels_per_page * pixel_step + 2*pixel_margin + pixels_per_page / pixels_per_grid * grid_step;
        y = pixel_margin + legend_step * i;

        context.fillRect(x, y, pixel_width, pixel_width);
        if ($('#decorate_pixel_checkbox').prop('checked')) {
            v = cache[keys[i]];
            decoratePixel(context, x, y, v['dec'], v['inv']);
        }

        context.fillStyle = '#000000';
        if (mode === 'rgb') {
            context.fillText(colours[i], x + pixel_step, y + pixel_width - 1);
        }
        else {
            context.fillText(map.index + ' ' + map.name, x + pixel_step, y + pixel_width - 1);
        }
        colour_key.push(map);
    }
}


function exportPDF() {
    /*
    use jsPDF (http://parall.ax/products/jspdf) to generate a multipage
    PDF based on objects being displayed in HTML5 Canvas.
    Client-side generated PDF is saved using browser download interface.
     */

    // initialize PDF document
    var doc = new jsPDF('landscape', 'pt', 'letter');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);

    var mapped, rgb,
	    mode = document.getElementById('dropdown').value,
	    x, y,
        decorate_keys = 'v1A-dU^o+2D03/4\\|';

    // cache colour inversions and decoration keys
    var i,  // counter
        key,
        value = $('#ncolSlider').val(),
        cache = {},
        keys = Object.keys(palettes[mode][value]);

    for (i = 0; i < keys.length; i++) {
        key = keys[i];
        cache[key] = {};
        cache[key]['inv'] = invertColour(palettes[mode][value][key]);
        cache[key]['dec'] = decorate_keys[i];
    }

    // write each page to PDF
    var page, origin_x, origin_y,
        v, row = 0, col = 0;

    for (page = 0; page < num_pages; page++) {
        if (page > 0) {
            doc.addPage(); // next page
        }

        origin_x = pixels_per_page * Math.floor(page / pagesWide),
        origin_y = pixels_per_page * (page % pagesWide);

        // draw pixel grid
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

                // draw pixel
                if (mode === 'rgb') {
                    doc.setFillColor(imageData.data[i], imageData.data[i+1], imageData.data[i+2]);
                } else {
                    mapped = lookupRGB(imageData.data[i], imageData.data[i+1], imageData.data[i+2], mode);
                    doc.setFillColor(mapped.r, mapped.g, mapped.b);
                }

                doc.rect(x, y, pixel_width, pixel_width, 'F');

                if ($('#decorate_pixel_checkbox').prop('checked')) {
                    // original colour
                    key = [imageData.data[i], imageData.data[i+1], imageData.data[i+2]].toString();
                    v = cache[key];
                    decoratePixelPDF(doc, x, y, v['dec'], key);
                }
            }
        }

        // draw legend
        var colour_key = [],
            colours = Object.values(palettes['rgb'][value]),
            map;

        for (i = 0; i < colours.length; i++) {
            // from original colour space
            rgb = colours[i].split(',').map(function(x){return+x;});
            if (mode === 'rgb') {
                doc.setFillColor(rgb[0], rgb[1], rgb[2]);
            } else {
                map = lookupRGB(rgb[0], rgb[1], rgb[2], mode);
                if (colour_key.indexOf(map) > -1) {
                    // already in colour key
                    continue;
                }
                doc.setFillColor(map.r, map.g, map.b);
            }

            x = pixels_per_page * pixel_step + 2*pixel_margin + pixels_per_page / pixels_per_grid * grid_step;
            y = pixel_margin + legend_step * i;

            doc.rect(x, y, pixel_width, pixel_width, 'F');
            if ($('#decorate_pixel_checkbox').prop('checked')) {
                v = cache[keys[i]];
                decoratePixelPDF(doc, x, y, v['dec'], colours[i]);
            }
            doc.text(map.index + ' ' + map.name, x + pixel_step, y + pixel_width - 1);
            colour_key.push(map);
        }
    }

    doc.save('export.pdf');
}


function updateColourKey (value) {
    /*
     Map RGB values in the palette to those of some craft type,
     e.g., DMC floss, Perler beads, Lego, etc.  These will be
     rendered in an HTML5 Canvas object as a color key.
     */
    var mode = document.getElementById('dropdown').value;

    //colourKey.width = colourKey.width; // clear
    $('#colour_key_table tbody tr').remove(); // clear table

    if (mode === 'rgb') {
        return;
    }
    var colours = Object.values(palettes["rgb"][value]);
    var htmlStr, rgb, map, row = 0;
    var mapped = [];
    var hexval = '';

    for (var i = 0; i < colours.length; i++) {
        // from original colour space
        rgb = colours[i].split(',').map(function (x) {return+x;});

        // RGB value mapped to another palette
        map = lookupRGB(rgb[0], rgb[1], rgb[2], mode);
        if (mapped.indexOf(map) > -1) {
            // already in colour key
            continue;
        }

        // make color swatch - translate rgb tuple to hex string
        htmlStr = '<tr><td width="15" bgcolor="#';
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
        htmlStr += '"></td>'

        htmlStr += '<td>' + map.index + '</td>';
        htmlStr += '<td>' + map.name + '</td>';
        htmlStr += '<td>' + pixel_counts[colours[i]] + '</td></tr>';

        $('#colour_key_table tbody').append(htmlStr);

        mapped.push(map);
        row++;
    }
}
