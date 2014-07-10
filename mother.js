var Mother = (function ($) {
	var mom = {},
		position, //current character position
		message, //current full messages
		newestTweetID = "391196397673803776", //id of most recent tweet
		msg_queue = [], //IDs of tweets waiting to be displayed
		msg_archive = {}, //all tweets, stored by ID
		tweetInt, //holder for tweet check setinterval
		msgTO; //holder for message settimeouts
	
	//default for sponsor shout outs
	var sponsor_queue = [
		[["request beer sponsor"],["lagunitas brewing company"]],
		];
		
	//default for movie references
	var movie_queue = [
		[["request clarification on", "science inability to neutralize alien"], ["unable to clarify"]],
		];

	//retrieve new tweets
	function tweetCheck() {
		$.getJSON("twitter.php", { url: "statuses/mentions_timeline.json?since_id="+newestTweetID+"&count=50" }, function(data) { logTweets(data) } );
	}
	
	//callback of tweetCheck to process JSON of tweets
	function logTweets(data) {
		//add new tweets to archive if no errors are returned
		if (!data.errors) {
			for (var i in data) {
				//if the tweet doesn't already exist
				if (!msg_archive[data[i].id_str]) {
					msg_archive[data[i].id_str] = data[i];
					msg_queue.push(data[i].id_str);
					//store largest ID in newestTweetID
					if (data[i].id > parseInt(newestTweetID) && data[i].id_str != newestTweetID) newestTweetID = data[i].id_str;
				}
			}
		}
	}
	
	//prepare tweet data for console
	function processTweet(data) {
		return [[ "receiving transmission" ], [
		"type : tweet",
		"handle : "+data.user.screen_name,
		"name : "+data.user.name,
		"location : "+data.user.location,
		"message : "+data.text,
		/* "profile : "+data.user.description, */
		"date : "+data.created_at.substr(0,20),
		]];
	}
	
	//display tweet by id
	function displayTweet(id) {
		updateConsole(processTweet(msg_archive[id]));
		//strip out _normal to display full size pic
		$("#image img").attr("src", msg_archive[id].user.profile_image_url.replace("_normal",""));
		//slowly show avatar to simulate slow loading speed
		$("#image").delay(2500).slideDown(4000, "linear");
	}
	
	//text is multidimensional array: 2 blocks of multiple lines of text
	function updateConsole(text) {
		position = { block: 0, line: 0, character: 0};
		message = text;
		$("#message").empty();
		nextChar();
	}
	
	//build message one line at a time
	function nextChar() {
	
		//start new message block
		if (position.character == 0 && position.line == 0) {
			$("#message").append("<div>");
		}
		//new message
		if (position.character == 0) {
			$("#message div:last-child").append("<p>");
		}
		
		//increment character position
		position.character++;
		
		//new line
		if (position.character > message[position.block][position.line].length) {
			position.line++;
			position.character = 0;
			
			//last line of block has been displayed and needs to be underlined
			if (position.line == message[position.block].length) {
				position.block++;
				position.line = 0;
				$("#message > div:last-child p:last-child").css("text-decoration","underline");
				//there is another block
				if (position.block < message.length) {
					msgTO = setTimeout(nextChar, 2000);
				//queue next message
				} else {
					msgTO = setTimeout(mom.nextMessage, 20000);
				}
			} else {
				//display next character
				msgTO = setTimeout(nextChar, 30);
			}
		} else {
			//display next character
			$("#message div:last-child p:last-child").text(message[position.block][position.line].substr(0,position.character));
			msgTO = setTimeout(nextChar, 30);
		}
	}

	mom.clearConsole = function() {
		$("#message").empty();
		$("#image").hide();
	}
	
	mom.nextMessage = function() {
		mom.clearConsole();
		clearTimeout(msgTO);
		//display new tweets as a priority
		if (msg_queue.length > 0) {
			displayTweet(msg_queue.shift());
		} else { //randomly pick old message
			//combine sponsors, movie refs, tweet IDs
			var pool = sponsor_queue.concat(movie_queue, Object.keys(msg_archive));
			var pick = pool[Math.floor(Math.random() * pool.length)];
			//array is sponsor or movie ref
			if (Array.isArray(pick)) {
				updateConsole(pick);
			} else { //string is tweet ID
				displayTweet(pick);
			}
		}
	}

	mom.start = function () {
		tweetCheck();
		tweetInt = setInterval(tweetCheck, 68000);
		mom.nextMessage();
	};
	
	mom.stop = function() {
		clearInterval(tweetInt);
		clearTimeout(msgTO);
	}

	return mom;
}(jQuery));