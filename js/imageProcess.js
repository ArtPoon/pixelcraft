/*
pixelcraft
imageProcess.js
The MIT License (MIT)

Copyright (c) 2013 Art F Y Poon

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

var pixel_counts = {};

function getColours(imageData) {
	// returns an associative array (JS object) where each key is
	// a unique colour in the image and each value is the number of
	// pixels using that colour.
	
	var allColours = new Array();
	
	// generate pairwise distance matrix in RGB color space
	for (var i = 0, row = 0; row < imageData.height; row++) {
		for (var col = 0; col < imageData.width; col++) {
			if (imageData.data[i+3] == 0) {
				// ignore transparent colours
				i += 4;
				continue;
			}
			var rgbStr = [imageData.data[i], imageData.data[i+1], imageData.data[i+2]].toString();
			i += 4;
			
			if (allColours.hasOwnProperty(rgbStr)) {
				allColours[rgbStr] += 1;
			} else {
				allColours[rgbStr] = 1;
			}
		}
	}
	// to get list of all keys, use
	// var keys = Object.keys(allColours);
	return allColours;
}


function rgbMatrix(allColours) {
	// generate Euclidean distance pairwise matrix for vector of colours
	var colours = Object.keys(allColours);
	var mat = new Array();
	var rgb1, rgb2;
	
	for (var i = 0; i < colours.length; i++) {
		rgb1 = colours[i].split(',').map(function(x){return+x;});
		var row = new Array();
		for (var j = 0; j < colours.length; j++) {
			rgb2 = colours[j].split(',').map(function(x){return+x;});
			row.push(Math.sqrt(Math.pow(rgb1[0]-rgb2[0],2) + Math.pow(rgb1[1]-rgb2[1],2) + Math.pow(rgb1[2]-rgb2[2],2)));
		}
		mat.push(row);
	}
	return mat;
}


Array.prototype.minUpperTri = function () {
	// locate minimum value in upper-triagonal
	var min_val = this[0][1];
	var min_row = 0, 
		min_col = 1;
	for (var row = 0; row < this.length-1; row++) {
		for (var col = row + 1; col < this.length; col++) {
			if (this[row][col] < min_val) {
				min_val = this[row][col];
				min_row = row;
				min_col = col;
			}
		}
	}
	return [min_row, min_col];
}



Array.prototype.pairGroup = function (idx1, idx2) {
    /*
    Unweighted pair group clustering method with arithmetic mean.
    Acting on a pairwise distance matrix (symmetric with zero diagonal).
    Appends a new row to a matrix (stored as an Array of rows) by
    taking the arithmetic mean of two rows indexed by idx1 and idx2.

    TODO: make a weighted version of this based on pixel counts
     */

	// extract rows
	var row1 = this.splice(idx1,1)[0],
		row2 = this.splice(idx2-1,1)[0],
		newrow = new Array();
	
	// create new row from arithmetic mean
	for (var i = 0; i < row1.length; i++) {
		if (i == idx1 || i == idx2) { 
			// skip entries corresponding to dropped columns
			continue; 
		}
		newrow.push((row1[i] + row2[i]) / 2.0);
	}
	newrow.push(0); // zero diagonal
	
	// append this new row as a column to previous rows
    var r;
	for (r = 0; r < this.length; r++) {
		this[r].push(newrow[r]);
	}
	
	this.push(newrow); // append new row to bottom
}



function makePalette (imageData) {
	/*
		We need to generate lookup tables to map from the 'n'
		RGB values in the original image to 'm' RGB values 
		where we use a clustering function to map n -> m.

		Returns an Array of length n-1 indexed by m.
		 Each element holds an Array mapping from n->m.

		Sets global variable pixel_counts with count of
		 each RGB value.  This assumes that every RGB value
		 produced by clustering values in the original image
		 is unique!
	*/
	
	var allColours = getColours(imageData);
	var mat = rgbMatrix(allColours);
	
	var palette = new Array();		// stores the results
	var tree = new Array();	// tracks which nodes are related
	var colours = Object.keys(allColours);
	var ncolours = colours.length;
	var mx2col = new Array();		// map from distance matrix to colours
	var i; // counter
	var indices,
		key1, key2,
		rgb1, rgb2;
	var newKey = new Array(3);
	
	var nextColours = new Array();

    pixel_counts = {};  // reset Array

    // manual deep copy to initialize arrays
	for (i = 0; i < ncolours; i++) {
        key1 = colours[i];
		nextColours[key1] = key1; // maps n->n
        pixel_counts[key1] = allColours[key1]; // transfer count of original RGB
 		mx2col.push(i);
		tree.push(i);
	}
	palette[mat.length] = nextColours;

	while (mat.length > 2) {
		// row and column of minimum distance
		indices = mat.minUpperTri();
		
		// update distance matrix (shrinks by 1)
		mat.pairGroup(indices[0], indices[1]);
		
		// calculate colour of merged node
		key1 = colours[mx2col[indices[0]]];
		key2 = colours[mx2col[indices[1]]];
		rgb1 = key1.split(',').map(function(x){return+x;});
		rgb2 = key2.split(',').map(function(x){return+x;});
		for (i = 0; i < 3; i++) {
			newKey[i] = Math.round((rgb1[i] + rgb2[i]) / 2.);
		}
		
		// append to end (preserve original 'n' colours)
		colours.push(newKey.toString());

        // pixel count of new colour is sum of children
        pixel_counts[newKey] = pixel_counts[key1] + pixel_counts[key2];
		
		// update map
		tree[mx2col[indices[0]]] = tree.length;
		tree[mx2col[indices[1]]] = tree.length;
		for (i = 0; i < tree.length; i++) {
			if (tree[i] == mx2col[indices[0]] || 
				tree[i] == mx2col[indices[1]]) {
				tree[i] = tree.length;
			}
		}
		tree.push(tree.length);
		
		
		// update index to reflect shrinking matrix
		mx2col.splice(indices[0], 1);
		mx2col.splice(indices[1]-1, 1);
		mx2col.push(tree.length-1);
		
		// attach deep copy to palette
		nextColours = new Array();
		for (i = 0; i < ncolours; i++) {
			nextColours[colours[i]] = colours[tree[i]];
		}
		palette[mat.length] = nextColours;
	}
	
	return palette;
}


function getPixelCounts(imageData) {
    var allColours = getColours(imageData),
        colours = Object.keys(allColours),
        pixel_counts, // result
        i, // counter
        key;

    // deep copy to transfer counts in original image
    for (i = 0; i < colours.length; i++) {
        key = colours[i];
        pixel_counts[key] = allColours[key];
    }


    return pixel_counts;
}



