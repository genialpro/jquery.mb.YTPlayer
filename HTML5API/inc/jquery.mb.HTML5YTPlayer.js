/*******************************************************************************
 jquery.mb.components
 Copyright (c) 2001-2012. Matteo Bicocchi (Pupunzi); Open lab srl, Firenze - Italy
 email: mbicocchi@open-lab.com
 site: http://pupunzi.com

 Licences: MIT, GPL
 http://www.opensource.org/licenses/mit-license.php
 http://www.gnu.org/licenses/gpl.html

 jQuery.mb.components: jQuery.mb.HTML5YTPlayer
 version: 1.0.0
 © 2001 - 2012 Matteo Bicocchi (pupunzi), Open Lab

 ***************************************************************************/

String.prototype.getVideoID=function(){
	return this.indexOf("http")>-1 ? this.match(/[\\?&]v=([^&#]*)/)[1]:this;
};

/*
 * Metadata - jQuery plugin for parsing metadata from elements
 * Copyright (c) 2006 John Resig, Yehuda Katz, Jörn Zaefferer, Paul McLanahan
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */
(function(c){c.extend({metadata:{defaults:{type:"class",name:"metadata",cre:/({.*})/,single:"metadata"},setType:function(b,c){this.defaults.type=b;this.defaults.name=c},get:function(b,f){var d=c.extend({},this.defaults,f);d.single.length||(d.single="metadata");var a=c.data(b,d.single);if(a)return a;a="{}";if("class"==d.type){var e=d.cre.exec(b.className);e&&(a=e[1])}else if("elem"==d.type){if(!b.getElementsByTagName)return;e=b.getElementsByTagName(d.name);e.length&&(a=c.trim(e[0].innerHTML))}else void 0!= b.getAttribute&&(e=b.getAttribute(d.name))&&(a=e);0>a.indexOf("{")&&(a="{"+a+"}");a=eval("("+a+")");c.data(b,d.single,a);return a}}});c.fn.metadata=function(b){return c.metadata.get(this[0],b)}})(jQuery);

function onYouTubePlayerAPIReady() {
	jQuery(document).trigger("YTAPIReady");
	jQuery.mbYTPlayer.YTAPIReady=true;
}

(function(jQuery){

	jQuery.mbYTPlayer={
		name:"jquery.mb.YTPlayer",
		version:"2.0",
		author:"Matteo Bicocchi",
		defaults:{
			containment:"body",
			ratio:"16/9",
			chromeLess:true,
			forceHTML5:true,
			showYTLogo:false,
			videoURL:null,
			startAt:0,
			autoPlay:true,
			addRaster:false,
			opacity:1,
			quality:"default",
			mute:false,
			loop:true,
			showControls:true,
			printUrl:true,
			onReady:function(event){},
			onStateChange: function(event){},
			onPlaybackQualityChange: function(event){},
			onError: function(event){}
		},
		controls:{
			play:"<img src='../FlashAPI/images/play.png'>",
			pause:"<img src='../FlashAPI/images/pause.png'>",
			mute:"<img src='../FlashAPI/images/mute.png'>",
			unmute:"<img src='../FlashAPI/images/unmute.png'>",
			onlyYT:"<img src='../FlashAPI/images/onlyVideo.png'>",
			ytLogo:"<img src='../FlashAPI/images/YTLogo.png'>"
		},
		buildPlayer:function(options){

			return this.each(function(){
				var YTPlayer = this;
				var $YTPlayer=jQuery(YTPlayer);

				YTPlayer.loop=0;
				YTPlayer.opt={};
				var property = {};
				if(jQuery.metadata){
					jQuery.metadata.setType("class");
					property = $YTPlayer.metadata();
				}
				if(jQuery.isEmptyObject(property))
					property = $YTPlayer.data("property") ? eval('(' + $YTPlayer.data("property") + ')'):{};

				jQuery.extend(YTPlayer.opt, jQuery.mbYTPlayer.defaults,options,property);

				if(!$YTPlayer.attr("id"))
					$YTPlayer.attr("id","id_"+new Date().getTime());

				YTPlayer.opt.id = YTPlayer.id;
				YTPlayer.isAlone = false;

				/*to maintain back compatibility
				 * ***********************************************************/
				if(YTPlayer.opt.isBgndMovie)
					YTPlayer.opt.containment = "body";

				if(YTPlayer.opt.isBgndMovie && YTPlayer.opt.isBgndMovie.mute != undefined)
					YTPlayer.opt.mute = YTPlayer.opt.isBgndMovie.mute;

				if(!YTPlayer.opt.videoURL)
					YTPlayer.opt.videoURL = $YTPlayer.attr("href");

				/************************************************************/

				var playerID = "mbYTP_"+YTPlayer.id;
				var videoID= this.opt.videoURL ? this.opt.videoURL.getVideoID() : $YTPlayer.attr("href")? $YTPlayer.attr("href").getVideoID() : false;

				// 'start':this.opt.startAt,'modestbranding':1,
				var playerVars= { 'autoplay':0, 'controls':0, 'showinfo':this.opt.chromeLess ? 0 : 1, 'rel':0, 'enablejsapi':1, 'version':3, 'playerapiid':playerID, 'origin': '*', 'modestbranding':1, 'allowfullscreen':true, 'wmode':"transparent"};

				var canPlayHTML5 = false;
				var v = document.createElement('video');
				if(v.canPlayType) {
					canPlayHTML5 = true;
				}
				if(canPlayHTML5)
					jQuery.extend(playerVars,{'html5':1});

				var playerBox= jQuery("<div/>").attr("id",playerID).addClass("playerBox");
				var overlay=jQuery("<div/>").css({position:"fixed",top:0,left:0,width:"100%",height:"100%"}).addClass("YTPOverlay");

				console.debug(YTPlayer.opt.addRaster);
				if(YTPlayer.opt.addRaster)
					overlay.css({backgroundImage:"url("+jQuery.mbYTPlayer.rasterImg+")"});

				var wrapper= jQuery("<div/>").addClass("mbYTP_wrapper").attr("id","wrapper_"+playerID);
				wrapper.css({position:"absolute",zIndex:1,minWidth:"100%", minHeight:"100%", overflow:"hidden", opacity:0});
				playerBox.css({position:"absolute",zIndex:0,width:"100%",height:"100%",top:0,left:0, overflow:"hidden",opacity:this.opt.opacity});
				wrapper.append(playerBox);

				YTPlayer.opt.containment = YTPlayer.opt.containment == "self"? jQuery(this) : jQuery(YTPlayer.opt.containment);
				YTPlayer.opt.isBackground = YTPlayer.opt.containment.get(0).tagName.toLowerCase() == "body";

				if(YTPlayer.opt.isBackground && YTPlayer.opt.isInit)
					return;

				if(!YTPlayer.opt.isBackground){
					YTPlayer.opt.containment.children().each(function(){
						if(jQuery(this).css("position")=="static")
							jQuery(this).css("position","relative");
					});
					YTPlayer.opt.containment.prepend(wrapper);
				}else{
					jQuery("body").css({position:"relative",zIndex:1});
					wrapper.css({position:"fixed", top:0,zIndex:0});
					YTPlayer.opt.containment.prepend(wrapper);
					$YTPlayer.hide();
				}

				YTPlayer.opt.containment.children().each(function(){
					if(jQuery(this).css("position")=="static")
						jQuery(this).css("position","relative");
				});

				YTPlayer.wrapper = wrapper;

				this.opt.playerBoxID=playerID;
				playerBox.CSSAnimate({opacity:1},2000);
				playerBox.after(overlay);

				// add YT API to the header
				var tag = document.createElement('script');
				tag.src = "http://www.youtube.com/player_api";
				var firstScriptTag = document.getElementsByTagName('script')[0];
				firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

				jQuery(document).on("YTAPIReady",function(){

					if(YTPlayer.opt.isInit)
						return;

					YTPlayer.opt.isInit = true;

					var player = new YT.Player(playerID, {
						videoId: videoID,
						playerVars: playerVars,
						events: {
							'onReady': function(event){
								YTPlayer.player = event.target;

								YTPlayer.playerEl=YTPlayer.player.getIframe();
								$YTPlayer.optimizeDisplay();
								jQuery(window).resize(function(){
									$YTPlayer.optimizeDisplay();
								});

								if(YTPlayer.opt.showControls)
									jQuery(YTPlayer).buildYTPControls();

								if(YTPlayer.opt.mute){
									jQuery(YTPlayer).muteYTPVolume();
								}
								YTPlayer.player.setPlaybackQuality(YTPlayer.opt.quality);

								if(YTPlayer.opt.startAt>0)
									YTPlayer.player.seekTo(parseFloat(YTPlayer.opt.startAt),true);

								if(!YTPlayer.opt.autoPlay){
									YTPlayer.checkForStartAt = setInterval(function(){
										if(YTPlayer.player.getCurrentTime() == YTPlayer.opt.startAt){
											clearInterval(YTPlayer.checkForStartAt);
											YTPlayer.player.pauseVideo();
											setTimeout(function(){
												YTPlayer.wrapper.CSSAnimate({opacity:YTPlayer.opt.opacity},2000);
												jQuery(YTPlayer.playerEl).CSSAnimate({opacity:1},2000);
											},3000)
										}
									},1000);
								}else{
									YTPlayer.player.playVideo();
								}
								jQuery(YTPlayer.playerEl).CSSAnimate({opacity:1},2000);

								if(typeof YTPlayer.opt.onReady=="function")
									YTPlayer.opt.onReady($YTPlayer);
							},

							'onStateChange': function(event){

								/*
								 -1 (unstarted)
								 0 (ended)
								 1 (playing)
								 2 (paused)
								 3 (buffering)
								 5 (video cued).
								 */

								var state = event.target.getPlayerState();
								var playerBox = jQuery(YTPlayer.playerEl);
								var controls = jQuery("#controlBar_"+YTPlayer.id);
								playerBox.css({opacity:1});

								var data = YTPlayer.opt;

								if (state==0) {
									jQuery(document).trigger("YTPEnd");

									if(data.loop)
										YTPlayer.player.playVideo();
									else
										jQuery(YTPlayer.player).stopYTP();

									if(!data.loop)
										YTPlayer.wrapper.CSSAnimate({opacity:0},2000);
									else{
										YTPlayer.wrapper.css({opacity:0});
										YTPlayer.loop++;
									}
								}

								if ( state==3) {
									jQuery(document).trigger("YTPBuffering");
								}

								if (state==-1) {
									jQuery(document).trigger("YTPUnstarted");
								}

								if (state==1) {
									jQuery(document).trigger("YTPStart");
									if(YTPlayer.opt.autoPlay && YTPlayer.loop==0){
										YTPlayer.wrapper.CSSAnimate({opacity: YTPlayer.isAlone ? 1 : YTPlayer.opt.opacity},2000);
									}else if(YTPlayer.loop>0){
										YTPlayer.wrapper.css({opacity: YTPlayer.isAlone ? 1 : YTPlayer.opt.opacity});
									}
									controls.find(".mb_YTVPPlaypause").html(jQuery.mbYTPlayer.controls.pause);
								}

								if(state==2){
									jQuery(document).trigger("YTPPause");
									controls.find(".mb_YTVPPlaypause").html(jQuery.mbYTPlayer.controls.play);
								}
							},
							'onPlaybackQualityChange': function(){},
							'onError': function(){}
						}
					});
				})
			});
		},

		changeMovie:function(url, opt){
			var YTPlayer= jQuery(this).get(0);
			var data = YTPlayer.opt;
			if(opt){
				jQuery.extend(data,opt);
			}
			data.movieURL=(url.match( /[\\?&]v=([^&#]*)/))[1];
			if(url.substr(0,16)=="http://youtu.be/"){
				data.movieURL= url.replace("http://youtu.be/","");
			}else{
				data.movieURL=(url.match( /[\\?&]v=([^&#]*)/))[1];
			}
			jQuery(YTPlayer).getPlayer().loadVideoByUrl("http://www.youtube.com/v/"+data.movieURL, 0);
			jQuery(YTPlayer).optimizeDisplay();
		},

		getPlayer:function(){
			return jQuery(this).get(0).player;
		},

		playerDestroy:function(){
			var playerBox= this.get(0).opt.wrapper;
			playerBox.remove();
			jQuery("#controlBar_"+this.get(0).id).remove();
		},

		playYTP: function(){
			var YTPlayer= jQuery(this).get(0);
			var data = YTPlayer.opt;
			var controls = jQuery("#controlBar_"+YTPlayer.id);

			var playBtn=controls.find(".mb_YTVPPlaypause");
			playBtn.html(jQuery.mbYTPlayer.controls.pause);
			YTPlayer.player.playVideo();
		},

		stopYTP:function(){
			var YTPlayer= jQuery(this).get(0);
			var data = YTPlayer.opt;
			var controls = jQuery("#controlBar_"+YTPlayer.id);
			var playBtn=controls.find(".mb_YTVPPlaypause");
			playBtn.html(jQuery.mbYTPlayer.controls.play);
			YTPlayer.player.stopVideo();
		},

		pauseYTP:function(){
			var YTPlayer= jQuery(this).get(0);
			var data = YTPlayer.opt;
			var controls = jQuery("#controlBar_"+YTPlayer.id);
			var playBtn=controls.find(".mb_YTVPPlaypause");
			playBtn.html(jQuery.mbYTPlayer.controls.play);
			YTPlayer.player.pauseVideo();
		},

		setYTPVolume:function(val){
			var YTPlayer= jQuery(this).get(0);
			var data = YTPlayer.opt;
			if(!val && !data.vol && player.getVolume()==0)
				jQuery(YTPlayer).unmuteYTPVolume();
			else if((!val && YTPlayer.player.getVolume()>0) || (val && YTPlayer.player.getVolume()==val))
				jQuery(YTPlayer).muteYTPVolume();
			else
				data.vol=val;
			YTPlayer.player.setVolume(data.vol);
		},

		muteYTPVolume:function(){
			var YTPlayer= jQuery(this).get(0);
			var data = YTPlayer.opt;
			var controls = jQuery("#controlBar_"+YTPlayer.id);
			var muteBtn= controls.find(".mb_YTVPMuteUnmute");
			muteBtn.html(jQuery.mbYTPlayer.controls.unmute);
			YTPlayer.player.mute();
		},

		unmuteYTPVolume:function(){
			var YTPlayer= jQuery(this).get(0);
			var data = YTPlayer.opt;
			var controls = jQuery("#controlBar_"+YTPlayer.id);
			var muteBtn=controls.find(".mb_YTVPMuteUnmute");
			muteBtn.html(jQuery.mbYTPlayer.controls.mute);
			YTPlayer.player.unMute();
		},

		manageYTPProgress:function(){
			var YTPlayer= jQuery(this).get(0);
			var data = YTPlayer.opt;
			var controls = jQuery("#controlBar_"+YTPlayer.id);
			var progressBar= controls.find(".mb_YTVPProgress");
			var loadedBar=controls.find(".mb_YTVPLoaded");
			var timeBar=controls.find(".mb_YTVTime");
			var totW= progressBar.outerWidth();

			var currentTime=Math.floor(YTPlayer.player.getCurrentTime());
			var totalTime= Math.floor(YTPlayer.player.getDuration());
			var timeW= (currentTime*totW)/totalTime;
			var startLeft=0;

			var loadedW= YTPlayer.player.getVideoLoadedFraction()*100;

			loadedBar.css({left:startLeft, width:loadedW+"%"});
			timeBar.css({left:0,width:timeW});
			return {totalTime:totalTime,currentTime: currentTime};
		},

		buildYTPControls:function(){
			var YTPlayer= jQuery(this).get(0);
			var data = YTPlayer.opt;
			var controlBar=jQuery("<span/>").attr("id","controlBar_"+YTPlayer.id).addClass("mb_YTVPBar").css({whiteSpace:"noWrap",position: data.isBackground ? "fixed" : "absolute" }).hide();
			var buttonBar=jQuery("<div/>").addClass("buttonBar");
			var playpause =jQuery("<span>"+jQuery.mbYTPlayer.controls.play+"</span>").addClass("mb_YTVPPlaypause").click(function(){
				jQuery(YTPlayer).pauseYTP();
				if(YTPlayer.player.getPlayerState() == 1){
				}else{
					jQuery(YTPlayer).playYTP();
				}
			});

			var MuteUnmute=jQuery("<span>"+jQuery.mbYTPlayer.controls.mute+"</span>").addClass("mb_YTVPMuteUnmute").click(function(){
				if(YTPlayer.player.isMuted()){
					jQuery(YTPlayer).unmuteYTPVolume();
				}else{
					jQuery(YTPlayer).muteYTPVolume();
				}
			});

			var idx=jQuery("<span/>").addClass("mb_YTVPTime");

			var viewOnYT = jQuery(jQuery.mbYTPlayer.controls.ytLogo).on("click",function(){window.open(data.videoURL,"viewOnYT")});
			var viewOnlyYT = jQuery(jQuery.mbYTPlayer.controls.onlyYT).toggle(
					function(){
						jQuery(YTPlayer.wrapper).css({zIndex:10000}).CSSAnimate({opacity:1},500);
						YTPlayer.isAlone = true;
					},function(){
						jQuery(YTPlayer.wrapper).CSSAnimate({opacity:YTPlayer.opt.opacity},500,function(){
							jQuery(YTPlayer.wrapper).css({zIndex:0});
						});
						jQuery(YTPlayer.wrapper).
								YTPlayer.isAlone = false;
					});
			var movieUrl = jQuery("<span/>").addClass("mb_YTVPUrl").append(viewOnYT);
			var onlyVideo = jQuery("<span/>").addClass("mb_OnlyYT").append(viewOnlyYT);

			var progressBar =jQuery("<div/>").addClass("mb_YTVPProgress").css("position","absolute").click(function(e){
				timeBar.css({width:(e.clientX-timeBar.offset().left)});
				YTPlayer.timeW=e.clientX-timeBar.offset().left;
				controlBar.find(".mb_YTVPLoaded").css({width:0});
				var totalTime= Math.floor(YTPlayer.player.getDuration());
				YTPlayer.goto=(timeBar.outerWidth()*totalTime)/progressBar.outerWidth();

				YTPlayer.player.seekTo(parseFloat(YTPlayer.goto), true);
				controlBar.find(".mb_YTVPLoaded").css({width:0});
			});

			var loadedBar = jQuery("<div/>").addClass("mb_YTVPLoaded").css("position","absolute");
			var timeBar = jQuery("<div/>").addClass("mb_YTVTime").css("position","absolute");

			progressBar.append(loadedBar).append(timeBar);
			buttonBar.append(playpause).append(MuteUnmute).append(idx);

			if(data.printUrl && data.videoURL.indexOf("http")>=0)
				buttonBar.append(movieUrl);

			if(data.isBackground)
				buttonBar.append(onlyVideo);

			controlBar.append(buttonBar).append(progressBar);

			if (!data.isBackground){
				controlBar.addClass("inlinePlayer");
				YTPlayer.wrapper.before(controlBar);
			}else{
				jQuery("body").after(controlBar);
			}
			controlBar.fadeIn();

			clearInterval(YTPlayer.getState);
			YTPlayer.getState=setInterval(function(){
				var prog= jQuery(YTPlayer).manageYTPProgress();
				controlBar.find(".mb_YTVPTime").html(jQuery.mbYTPlayer.formatTime(prog.currentTime)+" / "+ jQuery.mbYTPlayer.formatTime(prog.totalTime));
			},100);
		},
		formatTime: function(s){
			var min= Math.floor(s/60);
			var sec= Math.floor(s-(60*min));
			return (min<9?"0"+min:min)+" : "+(sec<9?"0"+sec:sec);
		}
	};
	jQuery.fn.toggleVolume = function(){
		var YTPlayer = this.get(0);
		if(!YTPlayer)
			return;

		if(YTPlayer.player.isMuted()){
			jQuery(YTPlayer).unmuteYTPVolume();
			return true;
		}else{
			jQuery(YTPlayer).muteYTPVolume();
			return false;
		}
	};

	jQuery.fn.optimizeDisplay=function(){
		var YTPlayer=this.get(0);
		var data = YTPlayer.opt;
		var playerBox = jQuery(YTPlayer.playerEl);
		var win={};
		var el = !data.isBackground ? data.containment : jQuery(window);

		win.width = el.width();
		win.height = el.height();

		var vid={};
		vid.width= win.width +(win.width*20/100);
		vid.height = data.ratio=="16/9" ? Math.ceil((9*win.width)/16): Math.ceil((3*win.width)/4);
		vid.marginTop= -((vid.height-win.height)/2);
		vid.marginLeft= -(win.width*10/100);

		if(vid.height<win.height){
			vid.height = win.height +(win.height*20/100);
			vid.width= data.ratio=="16/9" ? Math.ceil((16*win.height)/9): Math.ceil((4*win.height)/3);
			vid.marginTop=-(win.height*10/100);
			vid.marginLeft= -((vid.width-win.width)/2);
		}
		playerBox.css({width:vid.width, height:vid.height, marginTop:vid.marginTop, marginLeft:vid.marginLeft});
	};

	jQuery.fn.mb_YTPlayer=jQuery.mbYTPlayer.buildPlayer;
	jQuery.fn.changeMovie=jQuery.mbYTPlayer.changeMovie;
	jQuery.fn.getPlayer=jQuery.mbYTPlayer.getPlayer;
	jQuery.fn.playerDestroy=jQuery.mbYTPlayer.playerDestroy;
	jQuery.fn.buildYTPControls = jQuery.mbYTPlayer.buildYTPControls;
	jQuery.fn.playYTP = jQuery.mbYTPlayer.playYTP;
	jQuery.fn.stopYTP = jQuery.mbYTPlayer.stopYTP;
	jQuery.fn.pauseYTP = jQuery.mbYTPlayer.pauseYTP;
	jQuery.fn.muteYTPVolume = jQuery.mbYTPlayer.muteYTPVolume;
	jQuery.fn.unmuteYTPVolume = jQuery.mbYTPlayer.unmuteYTPVolume;
	jQuery.fn.setYTPVolume = jQuery.mbYTPlayer.setYTPVolume;
	jQuery.fn.manageYTPProgress = jQuery.mbYTPlayer.manageYTPProgress;

	jQuery.mbYTPlayer.YTAPIReady=false;

})(jQuery);