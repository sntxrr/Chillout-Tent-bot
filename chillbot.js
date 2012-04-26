/////////////////////////////////////////////////////////////////////////////// 
// 
// Chillout Tent Bot 
// 
// Original created by: Michael Belardo http://GPlus.to/TerrorDactylDesigns
//  
// Updated by: Don ONeill https://github.com/rrxtns
//
///////////////////////////////////////////////////////////////////////////////
/*
Copyright (C) 2012 Michael Belardo (http://GPlus.to/TerrorDactylDesigns)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

//bot and room information - obtain from http://alaingilbert.github.com/Turntable-API/bookmarklet.html
var Bot = require('ttapi');
var FS = require('fs');
var AUTH = 'XXXXX';										//put the auth+live ID here for your bots acct
var USERID = 'XXXXX';									//put the bots user id here
var ROOMID = '4e130f8d14169c1285007e79';				//put your turntable rooms id here
var MASTERID = 'XXXXX';									//put your personal user id here
var MASTERNAME = 'XXXXX';								//put your personal user name here
var CREATORID = 'XXXXX';								//put your rooms creator ID here
var CREATORNAME = 'XXXXX';								//put your rooms creator name here
var modList = [];										//Array for MODs
var currDjs = new Array();								//An array of current DJs													
var currMods = new Array();								//Array for MODs
global.isMOD											//Global MODbit set to null initially

//for API calls
var http = require('http'); 
// load the bot
var bot = new Bot(AUTH, USERID, ROOMID);
//object to hold user list
var theUsersList = { };
//object to hold mod list
var theMODsList = { };
//silent mode variable in case you want the bot to just be quiet
var shutUp = false;

//functions
//error writer
function errMsg(e) {
	console.log(e);
	bot.speak('Something went wrong. Tell master to check the fail logs.')
}

//load the config.JSON file
try {
	configJSON = JSON.parse(FS.readFileSync('config.json', 'ascii'));
} catch(e) {
	//todo: update error handling
	console.log(e);
	console.log('Error loading configJSON.json. Check that your config file exists and is valid JSON.');
	process.exit(0);
}

//console messages for viewing room data in the console
bot.on('roomChanged',  function (data) { console.log('The bot has changed room.', data); });
bot.on('speak',        function (data) { console.log('Someone has spoken', data); });
//bot.on('update_votes', function (data) { console.log('Someone has voted',  data); });
//bot.on('registered',   function (data) { console.log('Someone registered', data); });
//bot.on('add_DJ',   function (data) { console.log('DJ stepped up', data); });
//bot.on('rem_DJ',   function (data) { console.log('DJ stepped down', data); });
//bot.on('new_moderator', function (data) { console.log('New Mod', data); });
//bot.on('rem_moderator', function (data) { console.log('Mod removed', data); });
//bot.on('newsong', function (data) { console.log('New song', data); });
//bot.on('snagged', function (data) { console.log('A snag!', data); });
//console message about File being executed
console.log(__filename);

//user theUsersList code from https://github.com/alaingilbert/Turntable-API/blob/master/examples/users_list.js
bot.on('roomChanged', function (data) {

	console.log('Room creators UserName: '+data.room.metadata.creator.name+'.')
	console.log('Room creators UserID: '+data.room.metadata.creator.userid+'.')

	// Reset the users list
	theUsersList = { };
	
	var users = data.users;
	for (var i=0; i<users.length; i++) {
		var user = users[i];
		theUsersList['b' + user.userid] = user;
//		console.log('added ' + user + ' to theUsersList. UserID: ' +user.userid+ '.');
	}

	// Reset the MODs list (in case we've removed or added one)
	theModList = { };

	var modsare = data.room.metadata.moderator_id;
	for (var i=0; i<modsare.length; i++) {
		var mod = modsare[i];
		theModList['b' + mod.modid] = mod;
//		console.log('added ' + mod + ' to theModList.');
	}

});
			
bot.on('registered', function (data) {
	var user = data.user[0];
	theUsersList['b' + user.userid] = user;
});

bot.on('deregistered', function (data) {
	var user = data.user[0];
	delete theUsersList['b' + user.userid];
});

// Function to check if UserID is a MOD
global.CheckAdmin = function (userid) {
	var isMod = false;
    bot.roomInfo(true, function(info) {
		//not certain I need this if - REMOVE?
        if (info.room.metadata.moderator_id) {
			// loop through users to validate all users in room
			for (i in info.users) {
                var u = info.users[i];
                if (u.userid.toLowerCase() == userid) {
					console.log(u.name + ' is a valid user. UserID: '+u.userid);
					// loop through moderators
					for (j in info.room.metadata.moderator_id) {
						var v = info.room.metadata.moderator_id[j];
						if (v.toLowerCase() == userid) {
							//v.moderator_id.toString();
							console.log(v.moderator_id + ' matches a MODID: '+u.userid);
							//what do I do here to indicate to callee we found a MOD?
							this.isMod = true;
							return;
						} else {
							console.log('not a MODID');
							this.isMod = false;
							// putting return drops us out of the loop at 
							// the first NOT match - not what we want
							//return;
						}
					}
					console.log('post admin check');
				//  
				return;
                }
            }
        }
		//We'll log an error finding userID passed to CheckAdmin 
        console.log('Unable to locate user Id for ' + u.name + ' UserID: '+u.userid);
    });
}

//END of user/mod List section

//TODO: make the bot rejoin and yell for being booted
//	//if the bot was booted, reboot
//	if((configJSON.botinfo.userid == data.userid) && config.maintenance.autorejoin) {
//		setTimeout(function() {
//			bot.roomRegister(config.roomid);
//		}, 25000);
//		setTimeout(function() {
//			bot.speak('Please do not boot the room bot.');
//		}, 27000);
//	}
	
//arrays for commands
//boo array
var booList = ['Boo this man! BOOOOOOOOOO!', 'This song sucks!', 'Who picked this song? Cause its terrible'];
//cheer array
var cheerList = ['I <3 this song!!', 'GET GET GETTTTTTTIN IT!!', 'This is the best DJ EVER!'];
//like a boss array
var bossList = ["http://s3.amazonaws.com/kym-assets/photos/images/original/000/114/151/14185212UtNF3Va6.gif?1302832919",
  "http://s3.amazonaws.com/kym-assets/photos/images/newsfeed/000/110/885/boss.jpg",
  "http://verydemotivational.files.wordpress.com/2011/06/demotivational-posters-like-a-boss.jpg",
  "http://assets.head-fi.org/b/b3/b3ba6b88_funny-facebook-fails-like-a-boss3.jpg",
  "http://img.anongallery.org/img/6/0/like-a-boss.jpg",
  "http://www.18seven.com/wp-content/uploads/IMG_1745.jpg",
  "http://www.demotivers.com/uploads/2011_02/02/7733_1292_500_Like-A-Boss.jpg",
  "http://images.cheezburger.com/completestore/2011/2/20/a4ea536d-4b21-4517-b498-a3491437d224.jpg",
  "http://funcorner.eu/wp-content/uploads/2011/03/like_a_boss.jpg",
  "http://www.japemonster.com/wp-content/uploads/2011/08/demotivational-posters-like-a-boss.jpg"];
//haters array
var hatersList = [
   "http://www.hatersgoingtohate.com/wp-content/uploads/2010/06/haters-gonna-hate-rubberband-ball.jpg"
, "http://www.hatersgoingtohate.com/wp-content/uploads/2010/06/haters-gonna-hate-cat.jpg"
, "http://jesad.com/img/life/haters-gonna-hate/haters-gonna-hate01.jpg"
, "http://i671.photobucket.com/albums/vv78/Sinsei55/HatersGonnaHatePanda.jpg"
, "http://24.media.tumblr.com/tumblr_lltwmdVpoL1qekprfo1_500.gif"
, "http://s3.amazonaws.com/kym-assets/photos/images/newsfeed/000/087/536/1292102239519.gif"
, "http://i391.photobucket.com/albums/oo351/PikaPow3/squirtle.gif"
, "http://c.static.memegenerator.net/cache/instances/500x/13/13355/13676320.jpg"
, "http://icanhasinternets.com/wp-content/uploads/2010/05/haters.gif"
, "http://icanhasinternets.com/wp-content/uploads/2010/05/haters5.jpg"
];
var meowList = [
    "Do I look like a cat to you, boy? Am I jumpin' around all nimbly bimbly from tree to tree?", 
    "Meow. What is so damn funny?",
    "http://nbacats.files.wordpress.com/2012/02/alright-meow-super-troopers-demotiv.jpg",
    "All right meow. Hand over your license and registration.",
    "All right meow, where were we? ",
    "Excuse me, are you saying meow?",
    "Meow, I'm gonna have to give you a ticket on this one. No buts meow. It's the law.",
    "Not so funny meow, is it?",
    "http://www.protias.com/Pictures/Super%20Troopers/meow.jpg",
    "http://sphotos.ak.fbcdn.net/hphotos-ak-snc3/hs195.snc3/20275_304481852744_293714027744_3524059_4812190_n.jpg"
];
var props = [
    "Nice selection Selecta!!", 
    "great choice DJ!",
    "are you reading my mind? 'cause I totally would have picked this track!",
    "well played, well played!",
    "seriously dope track mang..",
    "wow, going to have to yoink this track!",
    "the DJ, the DJ, the DJs ON FIRE!",
    "MOAR OF THIS HOTNESS PLEASE!",
    "dis mah jam!",
    "sick cut. very sick!"
];
var bootcatcher = [
    "seeya, wouldn't want to be ya", 
    "THY NAME IS TROLL, BEGONE!",
    "Don\'t let the door hit ya where the good lord split ya!",
    "Chillout Tent 404: Access Denied",
    "and that folks is how you recieve a :boot: in the behind",
    "now that is a punting worth watching",
    "we now return you to your regularly scheduled chill",
    "bets on that fool returning and talking trash?",
    "wow, the Troll B Gone spray *is* working after all",
    "I.. I... don't even...."
];

// BEGIN main room bot actions and features

// Allow chillbot to become a psychic medium who can channel your spirit..... 
// AKA.. IM him and he speaks it to the room
bot.on('pmmed', function (data){
	//TODO: make the respond to ANY MOD
	if (data.senderid == MASTERID) { 
		try {
			bot.speak(data.text);
		} catch (err) {
			bot.speak(err);
		}
	}
});

//welcome new/special people
bot.on('registered', function (data){ 
	if (shutUp == false) {
		if (data.user[0].userid == USERID) {				//chillbot announces himself
		//bot.speak('Never fear Chillout Tent Denizens! I, ' +data.user[0].name+ ' your faithful chillbot, have arrived!')
		} else if (data.user[0].userid == MASTERID) {		//if the master arrives announce him specifically
			bot.speak('Dearest Subjects '+MASTERNAME+', your friendly neighborhood Dictator of Chill has arrived!') 
		} else if (data.user[0].userid == CREATORID) {		//if the master arrives announce him specifically
			bot.speak('Tent denizens say hello to '+CREATORNAME+' - the Tents esteemed Creator! *golf clap*') 
		} else {
			//TODO: once iPhone PM is sorted out, maybe this should be a PM to newly arrived people?
			//bot.speak('Welcome '+data.user[0].name+'! Type /help to learn how to control me.'); //welcome the rest
		}
	}
});

/*
  //auto bop. this is no longer allowed by turntable. it is here for informational purposes only. The writer of this software does not condone its use.
  bot.on('newsong', function(data){ bot.bop(); });
*/

//escorted off the stage sh** talk. 
//note that if you also use the rem_dj function this 
//function will never trigger, the rem_dj will trigger instead
bot.on('booted_user', function (data){
    var rndm = Math.floor(Math.random() * 10);
    bot.speak(bootcatcher[rndm]);
});

//new DJ 
bot.on('add_dj', function (data){ 
	if (shutUp == false) {
		if (data.user[0].userid == USERID) { //the bot will announce he is DJing
			console.log('Chillbot told to DJ', data);
			bot.speak('right away');
		} else if (data.user[0].userid == MASTERID) { //the bot will announce you specially
			console.log('MASTERID is taking the stage', data);
			bot.speak('Dear Leader has taken the stage! '+MASTERNAME+' will now commence chillin\' you!'); 
		} else if (data.user[0].userid == global.isMod) { //the bot will announce you specially
			console.log('A MOD is taking the stage', data);
			bot.speak('A round of chillplause for one of our mods!'); 
		} else {
			console.log('New DJ - reminding of genre', data);
			//bot.speak(data.user[0].name+' has taken the stage to amuse my master.'); //announce the new dj
			//TODO: account for iPhones lack of PM and fix PMs.
			//bot.pm('Welcome @'+data.user[0].name+'! We Play Downtempo, NuJazz, electro-swing & Triphop. DJ queue list and *MUSICAL STYLE GUIDANCE HERE*: http://chillout-tent.wikispaces.com/',data.user[0].name);
			// @announce the new DJ in Chat
			bot.speak('Welcome @'+data.user[0].name+'! We Play Downtempo, NuJazz, electro-swing & Triphop. DJ queue list and *MUSICAL STYLE GUIDANCE HERE*: http://chillout-tent.wikispaces.com/');
		}
	}
	
});

//thanks for DJ'ing
bot.on('rem_dj', function (data){ 
	if (shutUp == false) {
		if (data.user[0].userid == USERID) { 
		//do nothing. or write in something to have him say he has stepped down.
		} else {
		//bot.speak('Everyone give it up for '+data.user[0].name+'!'); //thanks the dj when they step off stage. note that if this is active the removed dj announcement will never happen.
		}
	}
}); 

//chat bot area
bot.on('speak', function (data) {
	if (shutUp == false) {
		if (data.text.match(/^\/hello$/)) {
			bot.speak('Hey! How are you '+data.name+' ?');
		}
		if (data.text.match(/^\/chillbot$/)) {
			bot.speak('Chill BOT v6.6.6 \n\r Coded by: Kim Jung Chill \n\r Acquire your own at https://github.com/rrxtns/Chillout-Tent-bot'); //note that line break and return does not appear in the web browser. However, it does appear on iPhone chat window.
		}
		if (data.text.match(/^\/help$/)) {
			//TODO: make this give MODs the FULL list
			bot.pm('My current command list is /hello, /help, /rules, /video, /genre, /queue, /props, /warn, /chillbot. Plus a few hidden ones ;) remember to check for new updates!', data.userid);
		}
		if (data.text.match(/^\/rules$/)) {
			bot.speak('Its our room, and our rules..\n\r Suck it up cupcake. \n\r Your room moderators are: enter them here'); //fill in with your information. line breaks and carriage returns will not display on the web browser but will on iPhone chat window.
		}
		if (data.text.match(/^\/tasha$/)) {
			bot.speak(':heart: FREE TASHA!  FREE TASHA!  FREE TASHA!  :heart:');
		}
		if (data.text.match(/^\/lunch$/)) {
			bot.speak('Enjoy your :fork_and_knife: '+data.name+' cya l8r!');
		}
		if (data.text.match(/^\/genre$/)) {	
			bot.speak('We Play Downtempo, NuJazz, electro-swing & Triphop. DJ queue list and *MUSICAL STYLE GUIDANCE HERE*: http://chillout-tent.wikispaces.com/');
		}	 
		if (data.text.match(/^\/starve$/)) {
			bot.speak('NO RICE FOR YOU '+data.name+'!!');
		}	 
		if (data.text.match(/^\/queue$/)) {
			bot.speak('@'+data.name+' the DJ queue can be found here: http://chillout-tent.wikispaces.com/DJ_list');
		}	 
		if (data.text.match(/^\/friday$/)) {
			bot.speak('Yay, its mother chillin\' FRIDAY!! :joy:');
		}	 
		if (data.text.match(/^\/drink$/)) {
			bot.speak('/me hands '+data.name+' a chilled adult beverage :beer:');
		}	 
		if (data.text.match(/^\/smoke$/)) {
			bot.speak('Now '+data.name+' you do realize that smokings bad m\'kay? :no_smoking:');
		}	 
		if (data.text.match(/^\/warn$/)) {                     
			bot.speak('This track is off genre, skip the song or be removed!');
		}
		if (data.text.match(/^\/rich$/)) {
			bot.speak("I don't think you realize how rich he really is. In fact, I should put on a monocle.  /monocle");
		}
		if (data.text.match(/^\/pm$'/)) {
			bot.pm('Hey there! Type "/help" for a list of commands.', data.userid);
		}	
		if ((data.text.match(/props/i)) && (data.userid != USERID)) {
			var rndm = Math.floor(Math.random() * 10);
			bot.speak(props[rndm]);	
		}
		if (data.text.match(/^\/video$/)) {
		  bot.roomInfo(true, function(data) { 
			var queryResponse = '';
			var currSong = data.room.metadata.current_song.metadata.song;
			var currArtist = data.room.metadata.current_song.metadata.artist;
			currSong = currSong.replace(/ /g,"_");
			currArtist = currArtist.replace(/ /g,"_");
			currSong = currSong.replace(/\./g,"");
			currArtist = currArtist.replace(/\./g,"");
			var options = {
			  host: 'gdata.youtube.com',
			  port: 80,
			  path: "/feeds/api/videos?q=" + currArtist + "_" + currSong + "&max-results=1&v=2&prettyprint=true&alt=json"
			};
			console.log(options);
			http.get(options, function(response) {
			  console.log("Got response:" + response.statusCode);
			  response.on('data', function(chunk) {  
				  try {
					queryResponse += chunk;
				  } catch (err) {
					bot.speak(err);
				  }
			  });
			  response.on('end', function(){
				var ret = JSON.parse(queryResponse);
				//if the return is a playlist the JSON is entirely different. For now I am just error handling this.
				try {
				  bot.speak(ret.feed.entry[0].media$group.media$content[0].url);
				} catch (err) {
				  bot.speak("Sorry. The return was a playlist. This is unsupported currently.");
				}
			  });

			}).on('error', function(e) {
				bot.speak("I can't do that Dave: " + e.message);
			});
		  });
		// END "fetch video" command  
		}
		if (data.text.match(/^\/google/)) {
		  //chop out the query and parse it
		  var searchQueryArray = data.text.split('/google ');
		  var searchQuery = searchQueryArray[1];
		  //replace the most common special characters and turn spaces into +
		  searchQuery = searchQuery.replace(/\'/g,"%27").replace(/;/g,"%3B").replace(/#/g,"%23").replace(/@/g,"%40").replace(/&/g,"%26").replace(/</g,"%3C").replace(/>/g,"%3E").replace(/=/g,"%3D").replace(/\+/g,"%2B");
		  //replace spaces with +
		  searchQuery = searchQuery.split(' ').join('+');
		  bot.speak("http://lmgtfy.com/?q=" + searchQuery); //returns a link to let me google that for you for both your search and my amusement of delivery method
		}
	// End "if NOT commanded to 'shutup'
	}
// End "general bot chatting"
});

	
// DJ control
//this next section looks anywhere in the sentence for the word chillbot. if it was said by MASTERS user id, it will then look for any of the commands and react.
bot.on('speak', function (data) {
	// Use this if you only want the command available to BOTs master
	if ((data.text.match(/chillbot/i)) && (data.userid == MASTERID)) { 
// If I could only get this to work! :(
//	if ((data.text.match(/chillbot/i)) && (CheckAdmin(data.userid)) && (global.isMod === true)) {
	
		//tell the bot to enter silent mode (doesnt announce users or welcome people or respond to commands other than admin commands)
		if (data.text.match(/shutup/i)) {
			shutUp = true;
			//bot.speak('Silent mode activated.');
		}
		//let the bot speak again
		if (data.text.match(/speakup/i)) {
			shutUp = false;
			//bot.speak('Chatterbox mode activated.')
		}
		//makes the bot get on stage
		if (data.text.match(/djmode/i)) {                   
			//bot.speak('Amuse my master mode activated.');
			bot.addDj();
		}
		//tells the bot to get off stage and get in the crowd
		if (data.text.match(/getdown/i)) {                  
			//bot.speak('Yes master.');
			//bot.speak('Aural destruction mode de-activated.')
			bot.remDj();
		}
		//tells the bot to get off stage and get in the crowd
		if (data.text.match(/stepdown/i)) {                  
			//bot.speak('Yes master.');
			//bot.speak('Aural destruction mode de-activated.')
			bot.remDj();
		}
		//tells the bot to skip the track it is playing
		if (data.text.match(/skip/i)) {                     
			//bot.speak('As you wish master.');
			bot.skip();
		}
		//remind your robot hes a good boy. Just in case the robot apocalypse happens, maybe he will kill you last.
		if (data.text.match(/good/i)) {
			bot.speak('The masters desires are my commands');
		}
		//remove current_dj
		if (data.text.match(/remove/i)) {
			// this works, though it only removes the BOT MASTER
			//bot.remDj(MASTERID);
			bot.roomInfo(true, function(data) { 
				var currDJ = data.room.metadata.current_dj;
				bot.remDj(currDJ);
			});
		}
		//boot NOT DONE YET
		if (data.text.match(/boot/i)) {                     
			//bot.bootUser(data.users.userID, 'Removed at Moderators request');	
		}
		//wave goodbye
		if (data.text.match(/wave/i)) {                     
			bot.speak('Adios mi chill amigo!');	
		}
		//  this section makes the bot upvote a song. this is no longer allowed by turntable. this is for educational purposes only. The writer of this software does not condone its use.
		if (data.text.match(/dance/i)) {
			bot.bop();
			//bot.speak('I shall dance for the masters amusement.');
		}
		//tell the bot to go into voodoo doll avatar. What better avatar for your toy?
		if (data.text.match(/voodoo up/i)) {
		  try {
			bot.setAvatar(10);
			//bot.speak('I am the masters toy.');
		  } catch (err) {
			//bot.speak('I do not have that form master.');
		  }
		}
		//the ladies love a kitten. but really its punishment mode for the robot.
		if (data.text.match(/kitten up/i)) {
		  try {
			bot.setAvatar(19);
			//bot.speak('Did I anger the master?');
		  } catch (err) {
			//bot.speak('I do not have that form master.');
		  }
		}
		//his dj skillz/dance moves are outta this world
		if (data.text.match(/alien up/i)) {
		  try {
			bot.setAvatar(12);
			//bot.speak('Alien dance form entered.');
		  } catch (err) {
			//bot.speak('I do not have that form master.');
		  }
		}
		//if he sparkles, this command will be removed
		if (data.text.match(/vampire up/i)) {
		  try {
			bot.setAvatar(16);
			//bot.speak('Like this master? I dont want to be punished for being too Twilight.');
		  } catch (err) {
			//bot.speak('I do not have that form master.');
		  }
		}
		//adds the current playing song to the bots playlist
		if (data.text.match(/addsong/i)) {
		   bot.roomInfo(true, function(data) {
			  try {
				var newSong = data.room.metadata.current_song._id;
				var newSongName = songName = data.room.metadata.current_song.metadata.song;
				bot.playlistAdd(newSong);
				bot.speak('Added '+newSongName+' to my playlist.');
				console.log('Added ' +newSongName+ ' to playlist');
			  } catch (err) {
				errMsg(err);
			  }
		   });
		}
		//The below commands will modify the bots laptop. Set before he takes the stage. This command can be activated while the bot is DJ'ing, however, the laptop icon will not change until he leaves the stage and comes back.
		//set the bots laptop to an iPhone
		if (data.text.match(/phone up/i)) {
			bot.speak('iPhone mode ready master.');
			console.log('iPhone mode ready.');
			bot.modifyLaptop('iphone');
		}
		//set the bots laptop to a mac
		if (data.text.match(/fruit up/i)) {
			bot.speak('Apple mode ready master.');
			console.log('Apple mode ready.');
			bot.modifyLaptop('mac');
		}
		//set the bots laptop to linux
		if (data.text.match(/nix up/i)) {
			bot.speak('Ubuntu mode ready master.');
			console.log('Ubuntu mode ready.');
			bot.modifyLaptop('linux');
		}
		//set the bots laptop to chromeOS
		if (data.text.match(/chrome up/i)) {
			bot.speak('Riding on chrome son.');
			console.log('Chrome mode ready.');
			bot.modifyLaptop('chrome');
		}
	// End "repond to /chillbot <command>"	
	};
// End "do things while 'speaking'"
});
///////////////////////////////////////////////////////////////////////////////
//
// AFK dj
// https://github.com/alaingilbert/Turntable-API/blob/master/examples/time_afk_list.js
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
/**
 * Auto boot people on a blacklist.
 */

// Example autoboot on blacklist
// from: https://github.com/alaingilbert/Turntable-API/blob/master/examples/blacklist.js
// Need to modify it to pull from blacklist.json
//
//var Bot    = require('../index');
//var AUTH   = 'auth+live+xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
//var USERID = 'xxxxxxxxxxxxxxxxxxxxxxxx';
//var ROOMID = 'xxxxxxxxxxxxxxxxxxxxxxxx';
//
//var bot = new Bot(AUTH, USERID, ROOMID);
//
//var blackList = ['xxxxxxxxxxxxxxxxxxxxxxxx', 'xxxxxxxxxxxxxxxxxxxxxxxx'];
//
// Someone enter the room, make sure he's not on the blacklist.
//bot.on('registered', function (data) {
//   var user = data.user[0];
//   for (var i=0; i<blackList.length; i++) {
//      if (user.userid == blackList[i]) {
//         bot.bootUser(user.userid, 'You are on the blacklist.');
//         break;
//     }
//   }
//});
///////////////////////////////////////////////////////////////////////////////

// downvote announcer for calling people out //requires the user list object from above //this is hit or miss lately some users return an empty object. I will work more on it when I have time.
//bot.on('update_votes', function (data) { 
//  if (data.room.metadata.votelog[0].toString().match(/down/i)) {
//    try {
//      var uncut = data.room.metadata.votelog[0].toString();
//      var chopped = 'b' + uncut.substring(0, uncut.indexOf(','));
//      var jerk = theUsersList[chopped].name
//      bot.speak(jerk + ' thinks your song sucks..');    
//    } catch (err) {
//      errMsg(err);
//    }
//  } 
//});

//Shuts down bot (only the main admin can run this)
//Disconnects from room, exits process.
//if (data.text.toLowerCase() == (config.botinfo.botname + ', shut down')) {
//	if (userid == config.admin) {
//		bot.speak('Shutting down...');
//		bot.roomDeregister();
//		process.exit(0);
//	}
//}
	
//debug commands
bot.on('speak', function (data) {
   
   // Respond to "/debug" command //for adding test sections //not required
   if ((data.text.match(/^\/debug$/)) && (data.userid == MASTERID)) { 
      try {
        bot.speak('debug reached');
        bot.speak(theUsersList);
      } catch (err) {
        bot.speak(err.toString());
      }
   }

});
// Test stuff
bot.on('speak', function (data) {
   if (data.text.match(/^\/testing$/)) {
      
    try {
    
  }
  catch (err) {
    bot.speak(err.toString());
  }

  
 }
}

// not entirely certain why this has to be here
);   


// Live tweeting //Code from - https://github.com/AvianFlu/ntwitter
//by default this is commented out for people who dont care about Twitter integration. Uncomment the below section, replace the parts with your own keys and URLs, delete the instructional comments out.

var twitter = require('ntwitter'); 
bot.on('newsong', function (data){ 
	// Tweet the new song from the twitter apps account you created. Gives the song name, artist, and #turntablefm hashtag
	var twit = new twitter({
		consumer_key: 'XXXXXX', //add your consumer key
		consumer_secret: 'XXXXXX', //add your consumer secret key
		access_token_key: 'XXXXXX', //add your access token
		access_token_secret: 'XXXXXX' //add your access token secret
	});
	try {
		bot.roomInfo(true, function(data) { //tweet on new song change event
			//var currDJ = data.room.metadata.current_dj							//grabs the current DJ
			var currSong = data.room.metadata.current_song.metadata.song;		//grabs the current songs name
			var currArtist = data.room.metadata.current_song.metadata.artist;	//grabs the current songs artist
			
			//TODO: convert currDJ from UserID to UserName
			twit
			.verifyCredentials(function (err, data) {
//				console.log(data);
			})
//			.updateStatus(currDJ + 'is playing "' + currSong + '" by: "' + currArtist + '" - Come listen! http://turntable.fm/chillout_tent5 #turntablefm #chillouttent', //replace the URL with your own rooms or delete.
			.updateStatus('Now playing "' + currSong + '" by: "' + currArtist + '" - Come listen! http://turntable.fm/chillout_tent5 #turntablefm #chillouttent', //replace the URL with your own rooms or delete.
				function (err, data) {
//					console.log(data);
				}
			);
		});
	} catch (err) {
		bot.speak(err.toString());
	}
});