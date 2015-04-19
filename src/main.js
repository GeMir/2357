"use strict";

var SVG_WIDTH = window.innerWidth,
	SVG_HEIGHT = window.innerHeight,
	s = new Snap(SVG_WIDTH, SVG_HEIGHT),
	PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37],
	LARGEST_PRIME = PRIMES[PRIMES.length - 1],
	HOLE_COLUMNS = 7,
	HOLE_ROWS = PRIMES.length,
	SVG_CENTER_X = Math.floor(SVG_WIDTH / 2),
	SVG_CENTER_Y = Math.floor(SVG_HEIGHT / 2),
	LABEL_HEIGHT = 90,

	// Card settings

	PLACEHOLDER_RADIUS = 11,
	PLACEHOLDER_MARGIN = 4,

	CARD_WIDTH = 2 * HOLE_COLUMNS * (PLACEHOLDER_MARGIN + PLACEHOLDER_RADIUS),
	CARD_HEIGHT = HOLE_ROWS * 2 * (PLACEHOLDER_MARGIN + PLACEHOLDER_RADIUS) + LABEL_HEIGHT,
	CARD_FILL_COLOR = '#ffffff',
	CARD_STROKE_COLOR = 'none',
	CARD_STROKE_WIDTH = 0,
	CARD_BORDER_RADIUS = 14,
	CARD_FONT_FAMILY = 'Open Sans',
	CARD_FONT_STYLE = 'normal',
	STRIPE_HEIGHT = 2 * (PLACEHOLDER_MARGIN + PLACEHOLDER_RADIUS),
	STRIPE_COLORS = ['#e82941', '#ff6e00', '#00c049', '#1aa1e1', '#a2aaaf'],
	stripe_color_index = 0,
	PLACEHOLDER_FILL_COLOR = 'none',
	PLACEHOLDER_STROKE_COLOR = '#afafaf',
	PLACEHOLDER_FONT_COLOR = '#ffffff',
	PLACEHOLDER_FONT_STYLE = 'normal',
	PLACEHOLDER_STROKE_WIDTH = 0,
	PLACEHOLDER_FONT_SIZE = 14,
	PLACEHOLDER_OPACITY = 0.75,
	DELETE_BUTTON_MIN_RADIUS = 7,
	DELETE_BUTTON_MAX_RADIUS = 14,
	NEW_CARD_BUTTON_MIN_RADIUS = Math.floor(SVG_HEIGHT / 30),
	NEW_CARD_BUTTON_MAX_RADIUS = 40,
	NEW_CARD_BUTTON_MARGIN = 60,

	// Drawing settings

	CARD_MARGIN = 20,
	MOVING_TIME = 400,
	HEADLINE_FONT_FAMILY = 'Open Sans',
	HEADLINE_FONT_SIZE = '24px',
	HEADLINE_FONT_STYLE = 'normal',
	HEADLINE_COLOR = '#ffffff',
	headline = s.text(SVG_CENTER_X, -10, ''),
	title = '',

	// Main variables

	cards_array = [],
	result_ready = false,
	add_new_card_lock = false,
	//new_card_button = new NewCardButton(),
	result_card = new Card(1);

document.title = 'Primkarten';

console.log('------------------------------------');
console.log('Snap.svg version: 0.4.1');
console.log('------------------------------------');
console.log('SVG dimensions: ' + SVG_WIDTH + 'px × ' + SVG_HEIGHT + 'px');
console.log('SVG center: (' + SVG_CENTER_X + '; ' + SVG_CENTER_Y + ')');
console.log('------------------------------------');



/*
function stateMachine() {
	this.available_states = ['edit','gcd','lcm'];

	this.changeState = function(state) {
		this.current_state = state;
	}
}
*/

/**
 *
 * @param {number} number Number to format.
 * @param {number} length Desirable length.
 * @return {string} Formatted string of desirable length.
 */

function fillZeroes( number, length ) {

	var string = number;

	while (string.length < length) {
		string = '0' + string;
	}

    return string;
}

/**
 * Generates a random ID from 0001 to 1000.
 * @return {string} id
 */

function getID() {

	var id = fillZeroes(Math.floor((Math.random() * 1000) + 1), 4); // Ok as random ID?

	return id;
}

/**
 * Chooses next color from STRIPE_COLORS-array and shifts the stripe_color_index pointer.
 * @return {string} color
 */

function getColor() {

	var color = STRIPE_COLORS[stripe_color_index];

	stripe_color_index = (stripe_color_index + 1) % STRIPE_COLORS.length;

	return color;
}

/**
 * @param {number} number
 */

function killRedundantCards( number ) {
	if (cards_array.length > number) {
		for (var i = number; i < cards_array.length; i++) {
			cards_array[i].killIt();
		}
	}
}

/**
 *
 */

function cardsArrayToDecompositionsString() {
	var cards_as_string = '';

	for (var i = 0; i < cards_array.length; i++) {
		cards_as_string += 'Card ' + i + ': ' + decompositionToString(cards_array[i].prime_decomposition) + '\n';
	}

	return cards_as_string;
}

/**
* @param {string} id
*/

function deleteFromCardArray( id ) {

	for (var i = 0; i < cards_array.length; i++) {
		if (cards_array[i].id === id) {

			var x = cards_array.splice(i, 1);
			console.log('Card #' + id + ' was removed.');
		}
	}

}

/**
 * @param {boolean} value
 */

function setCardLock( value ) {

	for (var i = 0; i < cards_array.length; i++) {
		cards_array[i].is_editable = false;
	}
}

/**
 *
 * @param {object} decomposition A prime decomposition of a number.
 * @return {string} Formatted string of given length.
 */

function decompositionToString( decomposition ) {

	var string = '';

	for (var prime in decomposition) {
		string += prime+'^'+decomposition[prime]+' ';
	}

	return string;
}

/**
 * Calculates the value of a number using its prime decomposition.
 * @param {object} decomposition A prime decomposition of a number.
 * @return {number} value Value of a number.
 */

function decompositionToValue( decomposition ) {

	var value = 1;

	for (var prime in decomposition) {
		value *= Math.pow(prime, decomposition[prime]);
	}

	return value;
}

/**
 *
 * @param {string} h Message
 * @param {boolean} is_warning Message is a warning message
 */

function setHeadline( message, is_warning ) {

	if (is_warning) {
		var warn_bar = s.rect(0, 0, SVG_WIDTH, 5).attr({'fill':'#E82941', 'opacity': 0});
			warn_bar.animate({'opacity':1}, 150, mina.linear, function(){warn_bar.animate({'opacity':0}, 900, mina.linear);});
	}

	headline.remove();
	headline = s.text(SVG_CENTER_X, 50, message);
	headline.attr({'font-family':HEADLINE_FONT_FAMILY,
									'fill':HEADLINE_COLOR,
									'font-size':HEADLINE_FONT_SIZE,
									'font-style':HEADLINE_FONT_STYLE,
									'text-anchor':'middle',
									'dominant-baseline':'middle',
									'opacity':0});
	headline.animate({'opacity':1}, 300, mina.linear);

}

/**
 * Generates a shape string for a rectangle with two rounded corners at the bottom.
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {number} radius
 */

function roundedAtBottom( x, y, width, height, radius ) {
	return 'M' + x + ',' + y
		+ 'h' + (width)
		+ 'v' + (height - radius)
		+ 'a' + radius + ',' + radius + ' 0 0 1 ' + (-radius) + ',' + radius
		+ 'h' + (2 * radius - width)
		+ 'a' + radius + ',' + (-radius) + ' 0 0 1 ' + (-radius) + ',' + (-radius)
		+ 'Z';
}

/**
 * @param {string} text
 */

function drawOnscreenText ( text ) {

	var text_left = s.text(SVG_CENTER_X - 2.5 * CARD_WIDTH - 5 * CARD_MARGIN, SVG_CENTER_Y, text + ' von'),
		text_middle = s.text(SVG_CENTER_X - CARD_WIDTH + CARD_MARGIN, SVG_CENTER_Y, 'und'),
		text_right = s.text(SVG_CENTER_X + CARD_WIDTH / 2 + 4 * CARD_MARGIN, SVG_CENTER_Y, 'ist'),
		text_array = [text_left, text_middle, text_right];

	for (var i = 0; i < text_array.length; i++){
		text_array[i].attr({'fill':'#A3A3A3',
					'font-family':CARD_FONT_FAMILY,
					'font-style':'italic',
					'font-size':'40px',
					'text-anchor':'middle',
					'dominant-baseline':'middle'});
	}
}

/**
 * @param {number} value
 */

function primeDecompose( value ) {

	var decomposition = {};

	for (var i = 2; i <= value; i++) {
		while (value % i === 0) {
			if (decomposition[i] === undefined) {
				decomposition[i] = 1;
			} else {
				decomposition[i] = decomposition[i]+1;
			}
			value = value / i;
		}
	}

	return decomposition;
}

/**
 * @param {number} value
 */

function calculatePrimeDecomposition( value ) {

	var decomposition = {};

	for (var prime in MANY_PRIMES) {
		while (value % prime === 0) {
			if (decomposition[prime] === undefined) {
				decomposition[prime] = 1;
			} else {
				decomposition[prime] += 1;
			}
			value = value / prime;
		}
	}

	return decomposition;
}


/**
 * @param {number} first
 * @param {number} second
 */

function calculateIntersection( first, second ) {

	var intersection = {};

	for (var prime in first) {
		if (first[prime] !== undefined && second[prime] !== undefined) {
			if (first[prime] <= second[prime]) {
				intersection[prime] = first[prime];
			} else {
				intersection[prime] = second[prime];
			}
		}
	}

	return intersection;
}

/**
 * @param {object} map
 * @return {number}
 */

function dotsMapToValue( map ) {

	var value = 1;

	for (var prime in map) {
		for (var i = 0; i < map[prime].length; i++) {
			if (map[prime][i] === 1) {
				value *= prime;
			}
		}
	}

	return value;
}

/**
* @param {object} map
* @return {string}
*/

function dotsMapToString( map ) {

	var string = '';

	for (var prime in map) {

		string += fillZeroes(prime, 2) + ' ';

		for (var i = 0; i < map[prime].length; i++) {
			if (map[prime][i] === 1) {
				string += 'o';
			} else {
				string += '.';
			}
		}
		string += '\n';
	}

	return string;
};

/**
 * @param {object} decomposition
 * @param {object} result
 */

function calculateMissingValueGCD( decomposition, result ) {

	// ???

	var missing_decomposition = {};

	for (var prime in result) {
		if (result[prime] <= decomposition[prime]) {
			// Add all necessary prime factors (or more than necessary)
			missing_decomposition[prime] = result[prime];
		}
	}

	return decompositionToValue(missing_decomposition);
}

/**
 * @param {object} decomposition
 * @param {object} result
 * @return {object}
 */

function calculateReverseGreatestCommonDivisor( decomposition, result ) {

	var map = {'2':[2,2,2,2,2,2,2],
			   '3':[2,2,2,2,2,2,2],
			   '5':[2,2,2,2,2,2,2],
			   '7':[2,2,2,2,2,2,2],
			   '11':[2,2,2,2,2,2,2],
			   '13':[2,2,2,2,2,2,2],
			   '17':[2,2,2,2,2,2,2],
			   '19':[2,2,2,2,2,2,2],
			   '23':[2,2,2,2,2,2,2],
			   '29':[2,2,2,2,2,2,2],
			   '31':[2,2,2,2,2,2,2],
			   '37':[2,2,2,2,2,2,2]},
		gcd_object = {'value':1, 'map':map};

	// Mark impossible holes

	for (var prime in decomposition) {
		if (decomposition[prime] !== undefined &&
			result[prime] === undefined) { // Impossible row

			map[prime] = [3,3,3,3,3,3,3];
		}
		if (decomposition[prime] !== undefined &&
			result[prime] !== undefined &&
			decomposition[prime] > result[prime]) { // Impossible hole

			for (var i = result[prime]; i < HOLE_COLUMNS; i++) {
				map[prime][i] = 3;
			}
		}
	}

	// Mark necessary holes

	for (var prime in result) {
		for (var i = 0; i < result[prime]; i++) {
				map[prime][i] = 1;
		}
	}

	gcd_object.value = dotsMapToValue(map);

	return gcd_object;
}

/**
 * @param {object} decomposition
 * @param {object} result
 * @return {object}
 */

function calculateReverseLeastCommonMultiple( decomposition, result ) {

	var map = {'2':[3,3,3,3,3,3,3],
			   '3':[3,3,3,3,3,3,3],
			   '5':[3,3,3,3,3,3,3],
			   '7':[3,3,3,3,3,3,3],
			   '11':[3,3,3,3,3,3,3],
			   '13':[3,3,3,3,3,3,3],
			   '17':[3,3,3,3,3,3,3],
			   '19':[3,3,3,3,3,3,3],
			   '23':[3,3,3,3,3,3,3],
			   '29':[3,3,3,3,3,3,3],
			   '31':[3,3,3,3,3,3,3],
			   '37':[3,3,3,3,3,3,3]},
		lcm_object = {'value':1, 'map':map};

	// Mark possible holes

	for (var prime in result) {
		if (result[prime] !== undefined) {

			for (var i = 0; i < result[prime]; i++) {
				map[prime][i] = 2; // Possible hole
			}
		}
	}

	return lcm_object;
}

/**
 * Checks if one of the prime factors is too large (bigger than PRIMES[PRIMES.length-1])
 * @param {object} decomposition A prime decomposition of a number.
 * @return {boolean}
 */

function tooLargePrimeFactor( decomposition ) {

	var largest_prime_factor = 2;

	for (var prime in decomposition) {
		if (parseInt(prime, 10) > LARGEST_PRIME) {
			return true;
		}
	}

	return false;
}

/**
 * Checks if there are too many equal prime factors in given prime decompostion.
 * @param {number} threshold
 * @param {object} decomposition
 * @return {boolean}
 */

function tooManyEqualPrimeFactors( threshold, decomposition ) {

	for (var prime in decomposition) {
		if (decomposition[prime] > threshold)	{
			return true;
		}
	}
	return false;
}

/**
 * Calculates the prime decomposition of least common multiple (LCM) of two values,
 * using their prime decompositions.
 * @param {object} first First decomposition.
 * @param {object} second Second decomposition.
 * @return {object} Prime decomposition of LCM as an object.
 */

function calculateLeastCommonMultipleDecomposition( first, second ) {

	var lcm_decomposition = first;

	if (first === {}) {
		return second;
	}

	if (second === {}) {
		return first;
	}

	for (var prime in second) {
		if (lcm_decomposition[prime] === undefined || lcm_decomposition[prime] < second[prime]) {
			lcm_decomposition[prime] = second[prime];
		}
	}

	console.log('Least common multiple decomposition: ' + decompositionToString(lcm_decomposition));

	return lcm_decomposition;
}

/**
 * Card object.
 *
 * @constructor
 */

function Card( value ) {

	var that = this; // Bad style!?

	this.id = getID();

	this.value = value;

	this.x = 0;
	this.y = 0;

	this.opacity = 1;
	this.color = getColor();
	this.label_font_size = 32;

	this.is_removed = false;
	this.is_editable = true;
	this.is_result_card = false;

	this.prime_decomposition = primeDecompose(this.value);

	/* 12×7
	 *
	 * 0: no hole
	 * 1: a hole
	 * y: possible hole
	 * n: impossible hole
	 */

	this.dots_map = {'2':[0,0,0,0,0,0,0],
					 '3':[0,0,0,0,0,0,0],
					 '5':[0,0,0,0,0,0,0],
					 '7':[0,0,0,0,0,0,0],
					 '11':[0,0,0,0,0,0,0],
					 '13':[0,0,0,0,0,0,0],
					 '17':[0,0,0,0,0,0,0],
					 '19':[0,0,0,0,0,0,0],
					 '23':[0,0,0,0,0,0,0],
					 '29':[0,0,0,0,0,0,0],
					 '31':[0,0,0,0,0,0,0],
					 '37':[0,0,0,0,0,0,0]};

	this.card_group = s.group();
	this.mask_group = s.group();

	/**
	 * Adjusts the font size of cards label depending on value length.
	 */

	this.adjustFontSize = function() {

		var value_length = (this.value + '').length;

		// TODO Rewrite!

		if (value_length > 13) {
			this.label_font_size = 18;
		} else {
			if (value_length > 11) {
				this.label_font_size = 22;
			} else  {
				if (value_length > 9) {
					this.label_font_size = 24;
				} else {
					this.label_font_size = 32;
				}
			}
		}

		this.card_group.select('#label').animate({'font-size':this.label_font_size}, 200, mina.linear);
	}

	/**
	 * Updates card value using given prime decomposition.
	 * @param {object} decomposition
	 */

	this.updateValueUsingDecomposition = function( decomposition ) {

		var old_value = this.value;

		this.value = decompositionToValue(decomposition);

		console.log('Value updated: ' + old_value + ' → ' + this.value);
	}

	/**
	 * Updates card prime decomposition using given value.
	 * @param {number} value
	 */

	this.updatePrimeDecompositionUsingValue = function( value ) {

		var old_decomposition = this.prime_decomposition;

		this.prime_decomposition = primeDecompose(value);

		console.log('Prime decomposition updated: ' + decompositionToString(old_decomposition) + ' → ' + decompositionToString(this.prime_decomposition));
	}

	/**
	 * Updates dots map.
	 */

	this.updateDotsMap = function() {

		this.prime_decomposition = primeDecompose(this.value);

		for (var prime in this.prime_decomposition) {
			for (var i = 0; i < this.prime_decomposition[prime]; i++) {
				this.dots_map[prime][i] = 1;
			}
		}

		console.log('Card #' + this.id + ' dots map:\n' + dotsMapToString(this.dots_map));
	};

	/**
	 * Updates card value, the prime decomposition and label using card's dots_map.
	 */

	this.updateValueAndDecomposition = function() {

		var old_value = this.value,
			new_value = 1;

		for (var prime in this.dots_map) {
			for (var i = 0; i < this.dots_map[prime].length; i++) {
				if (this.dots_map[prime][i] === 1) {
					new_value *= prime;
				}
			}
		}

		this.value = new_value;
		this.adjustFontSize();
		this.prime_decomposition = primeDecompose(new_value);

		// Font size should be adjusted!

		var number_length = (this.value + '').length;

		this.card_group.select('#label').attr({'text':new_value});

		console.log('Card value updated: ' + old_value + ' → ' + new_value);

	};

	/*

	var dots = this.mask_group.selectAll('#r' + row + 'c' + column);

	if (dots.length === 0) {

	} else {
		console.log('Hole already exists!');
	}

	*/

	this.updateHolesMask = function() {

		for (var row = 0; row < HOLE_ROWS; row++) {
			for (var column = 0; column < HOLE_COLUMNS; column++) {

				if (this.dots_map[PRIMES[row]][column] === 1) { // 1 - hole, 0 - no hole

						var x = this.x + PLACEHOLDER_MARGIN + PLACEHOLDER_RADIUS + 2 * column * (PLACEHOLDER_MARGIN + PLACEHOLDER_RADIUS),
							y = this.y + PLACEHOLDER_MARGIN + PLACEHOLDER_RADIUS + 2 * row * (PLACEHOLDER_MARGIN + PLACEHOLDER_RADIUS),
							hole = s.circle(x, y, PLACEHOLDER_RADIUS);

							hole.attr({'stroke':'none',
										'fill':'#000000',
										'id':'r'+ row +'c'+ column,
										'class':'hole'});

							hole.appendTo(this.mask_group);


				}

			}
		}
	};

	/**
	 *
 	 * @param {number} row
 	 * @param {number} column
 	 * @param {boolean} true if new hole added
 	 */

	// Edit possible holes!!!

	this.editHole = function( row, column ) {

		if (this.dots_map[PRIMES[row]][column] === 0 &&
			(this.dots_map[PRIMES[row]][column - 1] === 1 || column === 0) &&
			(this.dots_map[PRIMES[row]][column + 1] === 0 || column === HOLE_COLUMNS - 1)) {

			var x = this.x + PLACEHOLDER_MARGIN + PLACEHOLDER_RADIUS + 2 * column * (PLACEHOLDER_MARGIN + PLACEHOLDER_RADIUS),
				y = this.y + PLACEHOLDER_MARGIN + PLACEHOLDER_RADIUS + 2 * row * (PLACEHOLDER_MARGIN + PLACEHOLDER_RADIUS),
				new_hole = s.circle(x, y, PLACEHOLDER_RADIUS);
				new_hole.attr({'stroke':'none', 'fill':'#000000', 'id':'r'+row+'c'+column, 'class':'hole'});
				new_hole.appendTo(that.mask_group);

				this.dots_map[PRIMES[row]][column] = 1;
				this.value = this.value * PRIMES[row];

				if (this.prime_decomposition[PRIMES[row]] === undefined) {
					this.prime_decomposition[PRIMES[row]] = 1;
				} else {
					this.prime_decomposition[PRIMES[row]] += 1;
				}

				var number_length = (this.value + '').length;
				this.card_group.select('#label').attr({'text':this.value});

			return true;

		} else {

			if (this.dots_map[PRIMES[row]][column] === 1 &&
				(this.dots_map[PRIMES[row]][column - 1] === 1 || column === 0) &&
				(this.dots_map[PRIMES[row]][column + 1] === 0 || column === HOLE_COLUMNS - 1)) {

				var hole_to_remove = this.mask_group.selectAll('#r' + row + 'c' + column);
					hole_to_remove.remove();

				this.dots_map[PRIMES[row]][column] = 0;
				this.value = this.value / PRIMES[row];

				if (this.prime_decomposition[PRIMES[row]] === undefined) {
					this.prime_decomposition[PRIMES[row]] = 1;
				} else {
					this.prime_decomposition[PRIMES[row]] += 1;
				}

				var number_length = (this.value + '').length;
				this.card_group.select('#label').attr({'text':this.value});

				return true;
			} else {

				// Clicked at wrong place

				return false;
			}
		}

	};

	/**
	 *
	 */
	/*
	this.invertMask = function() {

		var mask_body = this.mask_group.selectAll('#mask_body'),
			holes = this.mask_group.selectAll('.hole');

		mask_body.animate({'fill':'#000000'}, 500, mina.linear);

		for (var i = 0; i < holes.length; i++) {
			holes[i].animate({'fill':'#ffffff'}, 500, mina.linear);
		}
	};
	*/

	/**
	 * Removes the visual representation of the card.
	 */

	this.eraseIt = function() {

		this.card_group = s.group();
	}

	/**
	 * Draws the visual representation of the card, which contains (from top to down):
	 *
	 * this.card_group
	 *
	 *   Mask (this.mask_group)
	 *     - body
	 *     - hole(s)
	 *
	 *   Delete button (delete_button_group)
	 *     - body
	 *     - cross
	 *
	 *   Label
	 *
	 *   Placeholders: prime numbers, circles or crosses
	 *
	 *   Stripes
	 *
	 *   Body
	 */

	this.drawIt = function() {

		this.updateDotsMap(); // Needed?

		// Body

		var card_body = s.path(roundedAtBottom(this.x, this.y, CARD_WIDTH, CARD_HEIGHT, CARD_BORDER_RADIUS));
			card_body.attr({'stroke':'none', 'fill':CARD_FILL_COLOR, 'id':'card_body'});
			card_body.appendTo(this.card_group);

		// Stripes

		for (var i = 0; i < HOLE_ROWS; i++) {
			var opacity = 1 - i / (HOLE_ROWS + 1),
				stripe = s.rect(this.x, this.y + i * STRIPE_HEIGHT, CARD_WIDTH - CARD_STROKE_WIDTH, STRIPE_HEIGHT);
				stripe.attr({'stroke':'none',
								'strokeWidth':0,
								'fill':this.color,
								'opacity':opacity});
				stripe.appendTo(this.card_group);
		}

		// Placeholders

		for (var row = 0; row < PRIMES.length; row++) {
			for (var column = 0; column < HOLE_COLUMNS; column++) {

				var type = 'number';

				switch (this.dots_map[PRIMES[row]][column]) {

					case 0: { type = 'number'; break; }
					case 1: { type = 'number'; break; }
					case 2: { type = 'possible hole'; break; }
					case 3: { type = 'impossible hole'; break; }
				}

				var placeholder = new Placeholder(row, column, type);
					placeholder.body.appendTo(this.card_group);
					placeholder.drawIt();
			}
		}

		// Label

		var card_label = s.text(this.x + Math.floor(CARD_WIDTH/2),
								this.y + STRIPE_HEIGHT * HOLE_ROWS + Math.floor((CARD_HEIGHT - STRIPE_HEIGHT * HOLE_ROWS) / 2),
								this.value);
			card_label.attr({'id':'label',
								'font-family':CARD_FONT_FAMILY,
								'font-style':CARD_FONT_STYLE,
								'fill':'#516262',
								'font-size':this.label_font_size + 'px',
								'text-anchor':'middle',
								'dominant-baseline':'middle'});

			card_label.appendTo(this.card_group);

		// Delete button

		var delete_button_group = s.group(),
		 	button_body = s.circle(this.x + CARD_WIDTH, this.y, DELETE_BUTTON_MIN_RADIUS);
			button_body.attr({'fill':this.color});

 		var MARGIN = Math.floor(DELETE_BUTTON_MIN_RADIUS / 2),
			cross = s.path('M ' + (this.x + CARD_WIDTH - MARGIN) + ', ' + (this.y + MARGIN) +
							'L ' + (this.x + CARD_WIDTH + MARGIN) + ', ' + (this.y - MARGIN) +
							' M ' + (this.x + CARD_WIDTH - MARGIN) + ', ' + (this.y - MARGIN) +
							' L ' + (this.x + CARD_WIDTH + MARGIN) + ', ' + (this.y + MARGIN));
			cross.attr({'stroke':'#353535', 'stroke-width':1.25, 'stroke-linecap':'round'});

			button_body.appendTo(delete_button_group);
			cross.appendTo(delete_button_group);

		// Mask

		var mask_body = s.rect(this.x,
								this.y - (DELETE_BUTTON_MAX_RADIUS + 5),
								CARD_WIDTH + (DELETE_BUTTON_MAX_RADIUS + 5),
								CARD_HEIGHT + (DELETE_BUTTON_MAX_RADIUS + 5),
								0, 0);

			mask_body.attr({'fill':'#ffffff', 'id':'mask_body'});

			mask_body.appendTo(this.mask_group);


			this.updateHolesMask();


		this.card_group.attr({'mask':this.mask_group, 'opacity':this.opacity});

		/**
		 *
		 */

		function mouseOverDeleteButton( e ) {
			var factor = DELETE_BUTTON_MAX_RADIUS / DELETE_BUTTON_MIN_RADIUS;
			delete_button_group.animate({'transform':'S ' + factor + ', ' + factor}, 75, mina.linear);
		}

		/**
		 *
		 */

		function mouseOutDeleteButton( e ) {
			delete_button_group.animate({'transform':'S 1, 1'}, 75, mina.linear);
		}

		delete_button_group.attr({'cursor':'pointer'});
		delete_button_group.mouseover(mouseOverDeleteButton);
		delete_button_group.mouseout(mouseOutDeleteButton);
		delete_button_group.click(that.killIt);

		delete_button_group.appendTo(this.card_group);

	};

	/**
	 *
	 */

	this.moveIt = function( x, y, callback ) {
		this.card_group.animate({'transform':'t ' + x + ', ' + y}, MOVING_TIME, mina.linear, callback);
	};

	/**
	 * @param {function} callback
	 */

	this.hideIt = function( callback ) {
		if (this.card_group.attr('opacity') > 0) {
			this.card_group.animate({'opacity':0}, MOVING_TIME, mina.linear, callback);
		}
	};

	/**
	* @param {function} callback
	 */

	this.unhideIt = function( callback ) {
		if (this.card_group.attr('opacity') < 1) {
			this.card_group.animate({'opacity':1}, MOVING_TIME, mina.linear, callback);
		}
	};

	this.killIt = function() {

		if (that.is_editable) {
			that.hideIt(deleteFromCardArray(that.id));
		} else {
			setHeadline('Die Karte ist vom Löschen geschützt!', true);
			console.log('The card is protected!');
		}
	};

	// Deck object

	/*
	function Deck () {
		this.cards_array = [];

		this.push = function(card) {
			this.cards_array.push(card);
		}

		this.fillSpaces = function () {

		}
	}
	*/

	/**
 	 * Placeholder object.
	 * @constructor
 	 * @param {number} row
 	 * @param {number} column
	 * @param {number} type
 	 */

	function Placeholder( row, column, type ) {

		this.row = row;
		this.column = column;
		this.type = type;

		this.body = s.group();

		/**
		 * @param {object} e
		 */

		this.clickIt = function( e ) {

			//if (that.is_editable) {

				var clicked_row = parseInt(this.data('row'), 10),
					clicked_column = parseInt(this.data('column'), 10),
					success = true;

				console.log('Clicked: (' + clicked_row + '; ' + clicked_column + ')');

				success = that.editHole(clicked_row, clicked_column);

				if (success) {
					console.log(dotsMapToString(that.dots_map));
				} else {
					console.log('Wrong place!');
				}
			//}
		};

		/**
		 *
		 */

		this.drawIt = function() {

			var x = that.x + (2 * this.column + 1) * (PLACEHOLDER_MARGIN + PLACEHOLDER_RADIUS),
				y = that.y + (2 * this.row + 1) * (PLACEHOLDER_MARGIN + PLACEHOLDER_RADIUS);

			switch (this.type) {

				// Number (default placeholder)
				case 'number': {
					var placeholder = s.text(x, y, PRIMES[this.row]);

						placeholder.attr({'font-family':'Open Sans',
									'font-weight':'bold',
									'font-style':PLACEHOLDER_FONT_STYLE,
									'fill':PLACEHOLDER_FONT_COLOR,
									'font-size':PLACEHOLDER_FONT_SIZE + 'px',
									'text-anchor':'middle',
									'dominant-baseline':'middle',
									'opacity':PLACEHOLDER_OPACITY,
									'cursor':'pointer'});

						placeholder.data('row', this.row);
						placeholder.data('column', this.column);

						placeholder.click(this.clickIt);

						break;
				}

				// Circle (possible hole)
				case 'possible hole': {
					var placeholder = s.circle(x, y, PLACEHOLDER_RADIUS - 4);

						placeholder.attr({'stroke':'#fff',
									'stroke-width':2,
									'fill':'#fff',
									'fill-opacity':0,
									'opacity':PLACEHOLDER_OPACITY,
									'cursor':'pointer'});

						placeholder.data('row', this.row);
						placeholder.data('column', this.column);

						// Should be clickable!

						placeholder.click(this.clickIt);

						break;
				}

				// Cross (impossible hole)
				case 'impossible hole': {
					var MARGIN = PLACEHOLDER_RADIUS - 6,
						placeholder = s.path('M ' + (x - MARGIN) + ', ' + (y - MARGIN) +
									'L ' + (x + MARGIN) + ', ' + (y + MARGIN) +
									' M ' + (x - MARGIN) + ', ' + (y + MARGIN) +
									' L ' + (x + MARGIN) + ', ' + (y - MARGIN));

						placeholder.attr({'stroke':'#fff',
											'stroke-width':2,
											'stroke-linecap':'round',
											'opacity':PLACEHOLDER_OPACITY});

						placeholder.data('row', this.row);
						placeholder.data('column', this.column);

						// placeholder.click(this.clickIt);

						break;
				}
			}

			placeholder.appendTo(this.body);
		};
	}

}

/**
 * New card button object
 * @constructor
 */
function NewCardButton() {

	var that = this; // Bad style!?

	this.x = SVG_CENTER_X;
	this.y = SVG_CENTER_Y;
	this.new_card_button_group = s.group();

	/**
	 * Draws the new card button.
	 */

	this.drawIt = function() {

		var new_card_button = s.circle(this.x, this.y, NEW_CARD_BUTTON_MIN_RADIUS);
			new_card_button.attr({'fill':'#454545'});
			new_card_button.appendTo(this.new_card_button_group);

		var MARGIN = Math.floor(3 * NEW_CARD_BUTTON_MIN_RADIUS / 5),
			plus = s.path('M ' + (this.x - MARGIN) + ', ' + this.y +
							'h ' + 2 * MARGIN +
							' M ' + this.x + ', ' + (this.y - MARGIN) +
							' v ' + 2 * MARGIN);
			plus.attr({'stroke':'#ffffff', 'stroke-width':4, 'stroke-linecap':'round', 'opacity':0.5});
			plus.appendTo(this.new_card_button_group);

		this.new_card_button_group.attr({'cursor':'pointer'});
		this.new_card_button_group.click(clickNewCardButton);
		this.new_card_button_group.mouseover(mouseOverNewCardButton);
		this.new_card_button_group.mouseout(mouseOutNewCardButton);

	};

	/**
	 * Moves the new card button.
	 * @param {number} x
	 * @param {number} y
	 */

	this.moveIt = function( x, y ) {
		that.new_card_button_group.animate({'transform':'t ' + x + ', ' + y}, 250, mina.linear);
	};

	/**
	 * @param {object} e
	 */

	function mouseOverNewCardButton( e ) {
		var s = that.new_card_button_group.transform().localMatrix.toTransformString();
		that.new_card_button_group.animate({'transform':s+' S ' + 2 + ' ' + 2}, 75, mina.linear);
	}

	/**
	 * @param {object} e
	 */

	function mouseOutNewCardButton( e ) {
		var s = that.new_card_button_group.transform().localMatrix.toTransformString();
		that.new_card_button_group.animate({'transform':s+' S ' + 0.5 + ' ' + 0.5}, 75, mina.linear);
	}

	/**
	 * @param {object} e
	 */

	function clickNewCardButton( e ) {

		that.moveIt(CARD_WIDTH + CARD_MARGIN, 0);

		var new_card = new Card(1);
			new_card.x = Math.floor(SVG_CENTER_X - CARD_WIDTH / 2);
			new_card.y = Math.floor((SVG_HEIGHT - CARD_HEIGHT) / 2);
			cards_array.push(new_card);
			new_card.drawIt();

		for (var i = 0; i < cards_array.length-1; i++) {
			cards_array[i].moveIt(-Math.floor((cards_array.length - i - 1) * (CARD_WIDTH + CARD_MARGIN)), 0, 0);
		}

		//that.x += CARD_WIDTH + CARD_MARGIN;

	}

}


/**
 *
 */

function greatestCommonDivisorAnimation() {

	add_new_card_lock = true;

	if (cards_array.length > 1) {

		result_ready = false;

		if (result_card !== null) {
			result_card.killIt();
		}

		document.title = 'größter gemeinsamer Teiler';

		if (!result_ready) {
			setHeadline('größter gemeinsamer Teiler', false);
		} else {
			result_card.unhideIt();
		}

		for (var i = 0; i < cards_array.length; i++) {
			if (i === cards_array.length - 1) {
				cards_array[i].moveIt(-Math.floor((CARD_WIDTH + CARD_MARGIN)/2), 0, 0);
			} else {
				cards_array[i].moveIt(-Math.floor((CARD_WIDTH + CARD_MARGIN)/2), 0, 0);
			}
		}

		var intersection = cards_array[0].prime_decomposition;

		console.log('cards_array[0]: ' + decompositionToString(intersection));

		for (var i = 1; i < cards_array.length; i++) {
			console.log('cards_array[' + i + ']: ' + decompositionToString(cards_array[i].prime_decomposition));

			intersection = calculateIntersection(intersection, cards_array[i].prime_decomposition);
		}

		console.log('Intersection of '+cards_array.length+' cards: '+decompositionToString(intersection));

		var gcd_value = decompositionToValue(intersection);

		if (!result_ready) {
			result_ready = true;

			result_card = new Card(gcd_value);
			result_card.x = Math.floor(SVG_CENTER_X - CARD_WIDTH/2);
			result_card.y = Math.floor((SVG_HEIGHT - CARD_HEIGHT)/2);
			result_card.opacity = 0;
			result_card.drawIt();
			result_card.moveIt(Math.floor((CARD_WIDTH + CARD_MARGIN) / 2), 0, 0);
			result_card.unhideIt();

		}

		console.log('Greatest common divisor: ' + gcd_value);
	} else {
		setHeadline('Mindestens zwei Karten werden benötigt!', true);
		console.log('At least two cards are needed!');
	}
}



function leastCommonMultipleAnimation() {

	var title = 'kleinstes gemeinsames Vielfaches',
		lcm_decomposition = {},
		lcm_decomposition_string = '',
		lcm_value = 1;

	if (cards_array.length > 1) {

		document.title = title;
		setHeadline(title, false);

		add_new_card_lock = true;
		result_ready = false;
		setCardLock(true);

		if (result_card !== null) {
			result_card.killIt();
		}

		lcm_decomposition = cards_array[0].prime_decomposition;

		for (var i = 1; i < cards_array.length; i++) {
			lcm_decomposition = calculateLeastCommonMultipleDecomposition(lcm_decomposition, cards_array[i].prime_decomposition);
		}

		lcm_decomposition_string = decompositionToString(lcm_decomposition),
		lcm_value = decompositionToValue(lcm_decomposition_string);

		console.log('Least common multiple decomposition of ' + cards_array.length + ' cards: ' + lcm_decomposition_string);
		console.log('Least common multiple: ' + lcm_value);

		if (!result_ready) {
			result_ready = true;

			result_card = new Card(1);

			result_card.x = Math.floor(SVG_CENTER_X - CARD_WIDTH / 2);
			result_card.y = Math.floor((SVG_HEIGHT - CARD_HEIGHT) / 2);
			result_card.opacity = 0;
			result_card.drawIt();
			result_card.moveIt(Math.floor(CARD_WIDTH + CARD_MARGIN), 0, start);
			result_card.unhideIt();
		}

		var iteration = 0;

		function start() {
			for (var i = 0; i < cards_array.length; i++) {
				cards_array[i].eraseIt();
				cards_array[i].drawIt();
			}
			cards_array[iteration].moveIt(Math.floor(CARD_WIDTH + CARD_MARGIN), 0, transferHoles);
		}

		function transferHoles() {
			for (var prime in cards_array[iteration].dots_map) {
				for (var i = 0; i < HOLE_COLUMNS; i++) {
					if (cards_array[iteration].dots_map[prime][i] === 1) {
						result_card.dots_map[prime][i] = 1;
						result_card.updateValueAndDecomposition();
						result_card.updateHolesMask();
					}
				}
			}

			backwards();
		}

		function backwards() {
			//iteration++;
			if (iteration === cards_array.length - 1) {
				cards_array[iteration].moveIt(-Math.floor(CARD_WIDTH + CARD_MARGIN), 0);
			} else {
				cards_array[iteration].moveIt(0, 0, start);
				iteration++;
			}
		}
	} else {
		setHeadline('Mindestens zwei Karten werden benötigt!', true);
		console.log('At least two cards are needed!');
	}
}

/**
 *
 */

function reverseGreatestCommonDivisorAnimation() {

	if (cards_array.length > 1) {

		killRedundantCards(2);
		add_new_card_lock = true;
		setCardLock(true);

		document.title = 'größter gemeinsamer Teiler »rückwärts«';

		if (cards_array[0].value % cards_array[1].value === 0) {

			result_ready = false;

			if (result_card !== null) {
				result_card.killIt();
			}

			drawOnscreenText('ggT');

			cards_array[0].moveIt(-2 * (CARD_WIDTH - CARD_MARGIN), 0, 0);
			cards_array[1].moveIt(2 * (CARD_WIDTH - CARD_MARGIN), 0, 0);

			if (!result_ready) {

				setHeadline('größter gemeinsamer Teiler »rückwärts«', false);
				result_ready = true;

				var missing_gcd = calculateReverseGreatestCommonDivisor(cards_array[0].prime_decomposition,
																		cards_array[1].prime_decomposition);

				result_card = new Card(missing_gcd.value);
				result_card.is_result_card = true;
				result_card.dots_map = missing_gcd.map;

				result_card.x = Math.floor(SVG_CENTER_X - CARD_WIDTH / 2);
				result_card.y = Math.floor((SVG_HEIGHT - CARD_HEIGHT) / 2);
				result_card.is_editable = false;
				result_card.opacity = 0;
				result_card.drawIt();
				result_card.unhideIt();
			}

		} else {
			setHeadline('Die zweite Zahl teilt die erste nicht!', true);
			console.log('The second number is not a factor of the first number!');
		}
	} else {
		setHeadline('Mindestens zwei Karten werden benötigt!', true);
		console.log('At least two cards are needed!');
	}
}

/**
 *
 */

function reverseLeastCommonMultipleAnimation() {

	if (cards_array.length > 1) {

		killRedundantCards(2);
		add_new_card_lock = true;
		setCardLock(true);

		document.title = 'kleinstes gemeinsames Vielfaches »rückwärts«';

		if (cards_array[1].value % cards_array[0].value === 0) {

			result_ready = false;

			if (result_card !== null) {
				result_card.killIt();
			}

			drawOnscreenText('kgV');

			cards_array[0].moveIt(-2 * (CARD_WIDTH - CARD_MARGIN), 0, 0);
			cards_array[1].moveIt(2 * (CARD_WIDTH - CARD_MARGIN), 0, 0);

			if (!result_ready) {
				setHeadline('kleinstes gemeinsames Vielfaches »rückwärts«', false);
				result_ready = true;

				var missing_lcm = calculateReverseLeastCommonMultiple(cards_array[0].prime_decomposition,
																		cards_array[1].prime_decomposition);

				result_card = new Card(missing_lcm['value']);
				result_card.is_result_card = true;
				result_card.dots_map = missing_lcm['map'];
				result_card.x = Math.floor(SVG_CENTER_X - CARD_WIDTH / 2);
				result_card.y = Math.floor((SVG_HEIGHT - CARD_HEIGHT) / 2);
				result_card.is_editable = false;
				result_card.opacity = 0;
				result_card.drawIt();
				result_card.unhideIt();
			}

		} else {
			setHeadline('Die erste Zahl teilt die Zweite nicht!', true);
			console.log('The second number is not a multiple of the first number!');
		}
	} else {
		setHeadline('Mindestens zwei Karten werden benötigt!', true);
		console.log('At least two cards are needed!');
	}
}

/**
 *
 */

function removeLatestCardAnimation() {
	if (cards_array.length > 0) {
		if (cards_array[cards_array.length - 1].is_editable) {
			var card_to_kill = cards_array.pop();
				card_to_kill.killIt();
		} else {
			setHeadline('Die Karte ist vom Löschen geschützt!', true);
			console.log('The card is protected!');
		}
	} else {
		setHeadline('Keine Karten vorhanden!', true);
		console.log('No cards!');
	}
}

/**
 *
 */

/*
var mouse_x = SVG_CENTER_X,
	mouse_y = SVG_CENTER_Y,
	left_angle_in_radians = Math.atan((20 - SVG_CENTER_Y) / (20 - SVG_CENTER_X)),
	right_angle_in_radians = Math.atan((20 - SVG_CENTER_Y) / (50 - SVG_CENTER_X)),
	pupil_left = s.circle(20 + 4 * Math.cos(left_angle_in_radians),
						20 + 4 * Math.sin(left_angle_in_radians), 3).attr({'fill':'#000000'}),
	pupil_right = s.circle(50 + 4 * Math.cos(right_angle_in_radians),
					20 + 4 * Math.sin(right_angle_in_radians), 3).attr({'fill':'#000000'}),

	// Arc syntax: rx ry x-axis-rotation large-arc-flag sweep-flag x y
	smile = s.path('M 20 20 A 20 20 0 0 0 50 20').attr({'stroke':'#ffffff', 'stroke-width':1.5, 'fill':'none'});
*/

/**
 * A mascot with moving and blinking eyes.
 * @constructor
 */

/*
function Mascot() {

	this.left_eye_parameter = {'x':20, 'y':20, 'radius':7, 'fill':'#ffffff'};
	this.right_eye_parameter = {'x':50, 'y':20, 'radius':7, 'fill':'#ffffff'};

	this.left_pupil_parameter = {'x':20, 'y':20, 'radius':3, 'fill':'#000000'};
	this.right_pupil_parameter = {'x':20, 'y':20, 'radius':3, 'fill':'#000000'};

	this.drawIt = function() {

		this.left_eye = s.circle(this.left_eye_parameter.x,
									this.left_eye_parameter.y,
									this.left_eye_parameter.radius);
		this.left_eye.attr({'fill':this.left_eye_parameter.fill});
	}
}
*/

/**
 *
 */

/*
document.onmousemove = function( e ) {

	mouse_x = e.clientX;
	mouse_y = e.clientY;
	left_angle_in_radians = Math.atan((mouse_y) / (mouse_x));
	right_angle_in_radians = Math.atan((mouse_y) / (mouse_x));

	pupil_left.remove();
	pupil_right.remove();

	pupil_left = s.circle(20 + 4 * Math.cos(left_angle_in_radians),
					20 + 4 * Math.sin(left_angle_in_radians), 3).attr({'fill':'#000000'}),
	pupil_right = s.circle(50 + 4 * Math.cos(right_angle_in_radians),
					20 + 4 * Math.sin(right_angle_in_radians), 3).attr({'fill':'#000000'});

	//console.log('Mouse at (' + mouse_x + ' ; ' + mouse_y + ' )');
}
*/

window.onload = function( e ) {

	// new_card_button.drawIt();
	// var g = s.gradient("r(0.5, 0.5, 0.5)#5C5C5C-#232323");
	// var spotlight = s.circle(SVG_CENTER_X, SVG_HEIGHT, SVG_HEIGHT*0.7).attr({'fill':g});

	//var eye_ball_left = s.circle(20, 20, 7).attr({'fill':'#ffffff'}),
	//	eye_ball_right = s.circle(50, 20, 7).attr({'fill':'#ffffff'});
}

/**
 *
 */

window.onresize = function() {

	SVG_WIDTH = window.innerWidth;
	SVG_HEIGHT = window.innerHeight;
	SVG_CENTER_X = Math.floor(SVG_WIDTH / 2);
	SVG_CENTER_Y = Math.floor(SVG_HEIGHT / 2);

	s.remove();
	s = new Snap(SVG_WIDTH, SVG_HEIGHT);
}

/**
 *
 */

document.onkeypress = function ( e ) {

	if ( e.keyCode === 120 || e.charCode === 120 ) { // X
		removeLatestCardAnimation();
	}

	if ( e.keyCode === 103 || e.charCode === 103 ) { // G
		greatestCommonDivisorAnimation();
	}

	if ( e.keyCode === 107 || e.charCode === 107 ) { // K
		leastCommonMultipleAnimation();
	}

	if ( e.keyCode === 104 || e.charCode === 104 ) { // H
		reverseGreatestCommonDivisorAnimation();
	}

	if ( e.keyCode === 108 || e.charCode === 108 ) { // L
		reverseLeastCommonMultipleAnimation();
	}

	if ( (e.keyCode === 32 || e.charCode === 32 ) && result_ready ) { // Space

		for (var i = 0; i < cards_array.length; i++) {
			cards_array[i].moveIt((i-1)*(CARD_WIDTH+CARD_MARGIN), 0, 0);
			cards_array[i].unhideIt();
		}

		result_card.hideIt();
	}


}

/**
 *
 */

document.getElementById('new_value').onchange = function () {

	if (!add_new_card_lock)	{

		setHeadline('', false);

		var text_field = document.getElementById('new_value'),
			new_card_value = parseInt(text_field.value, 10);

		text_field.value = '';

		if (new_card_value > 0) {

			console.log('New value: ' + new_card_value);

			var decomposition = primeDecompose(new_card_value);

			console.log('Prime decomposition: ' + decompositionToString(decomposition));

			if (tooManyEqualPrimeFactors(HOLE_COLUMNS, decomposition)) {
				setHeadline('Mehr als ' + HOLE_COLUMNS + ' gleiche Primfaktoren!', true);
				console.log('More than ' + HOLE_COLUMNS + ' equal prime factors!');
			} else {

				if (!tooLargePrimeFactor(decomposition) || new_card_value === 1) {

					var new_card = new Card(new_card_value);
						new_card.x = Math.floor(SVG_CENTER_X - CARD_WIDTH / 2);
						new_card.y = Math.floor((SVG_HEIGHT - CARD_HEIGHT) / 2);

					cards_array.push(new_card);

					for (var i = 0; i < cards_array.length - 1; i++) {
						cards_array[i].moveIt(Math.floor((cards_array.length - i - 2) * (CARD_WIDTH + CARD_MARGIN)), 0, 0);
					}

					cards_array[cards_array.length - 1].drawIt();

					if (cards_array.length > 1) {
						new_card.moveIt(-1 * Math.floor((CARD_WIDTH + CARD_MARGIN)), 0, 0);
					}

				} else {
					setHeadline('Einer der Primfaktoren ist zu groß!', true);
					console.log('One of prime factors is too big!');
				}
			}
		} else {
			setHeadline('Die Zahl muss größer Null sein!', true);
			console.log('The number has to be positive!');
		}
	} else {
		setHeadline('Keine neuen Karten erlaubt!', true);
		console.log('No new cards are allowed!');
	}
}
