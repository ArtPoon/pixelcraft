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
	// later make a weighted version of this, will require
	// pixel colour counts
	var theCol = new Array(),
		theRow,
		r, dump;
	
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
	
	// extract columns by looping over remaining rows
	// just re-use means calculated above
	for (r = 0; r < this.length; r++) {
		x1 = this[r].splice(idx1,1)[0];
		x2 = this[r].splice(idx2-1,1)[0];
		this[r].push(newrow[r]); // append to end of row
	}
	
	this.push(newrow); // append new row to bottom
}



function makePalette (imageData) {
	/*
		We need to generate lookup tables to map from the 'n'
		RGB values in the original image to 'm' RGB values 
		where we use a clustering function to map n -> m.
	*/
	
	var allColours = getColours(imageData);
	var mat = rgbMatrix(allColours);
	
	var palette = new Array();		// stores the results
	var tree = new Array();	// tracks which nodes are related
	var colours = Object.keys(allColours);
	var ncolours = colours.length;
	var mx2col = new Array();		// map from distance matrix to colours
	
	var indices, 
		key1, key2,
		rgb1, rgb2;
	var newKey = new Array(3);
	
	// manual deep copy
	var nextColours = new Array();
	for (var i = 0; i < ncolours; i++) {
		nextColours[colours[i]] = colours[i];
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
		for (var i = 0; i < 3; i++) {
			newKey[i] = Math.round((rgb1[i] + rgb2[i]) / 2.);
		}
		
		// append to end (preserve original 'n' colours)
		colours.push(newKey.toString());
		
		
		// update map
		tree[mx2col[indices[0]]] = tree.length;
		tree[mx2col[indices[1]]] = tree.length;
		for (var i = 0; i < tree.length; i++) {
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
		var nextColours = new Array();
		for (var i = 0; i < ncolours; i++) {
			nextColours[colours[i]] = colours[tree[i]];
		}
		palette[mat.length] = nextColours;
	}
	
	return palette;
}





