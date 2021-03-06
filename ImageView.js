var imageViewer = (function(){

	var imgSource, wrap, sync;

	//计算图片指针
	var point = 0;
	var readyQueue = [], rowArr = [];
	var renderTimer, orientationTimer;
	var clientObj = {
		height : window.screen.height,
		width : window.innerWidth,
	};
	var hiddenDiv;

	//生成一行已经调整好大小的图片列表
	var renderByRow = function(arr){
		var l = arr.length;
		var gap = (l + 1) * 4;
		var wholeWidth = clientObj['width'] - gap;
		var divisor = arr[0]['height']/arr[0]['width'];
		var multiple = 1;
		var h;

		if(arr.length > 1){
			for(var i = 1; i < arr.length; i++){
				temp = arr[i];
				multiple += (divisor/(temp['height']/temp['width']));
				h = (wholeWidth / multiple) * divisor;
			}
		}else if(point > imgSource.length - 1){
			h = window.innerHeight / 3;
		}else{
			return
		}

		var html = '<div class="row">';
		for(var j = 0; j < arr.length; j++){
			html += '<img class="render" height="'+ h +'" src="'+ arr[j]['url'] +'"/>';
		}
		html += '</div>';

		$('#main').append($(html));
	};

	//返回一行已经调整好大小的图片
	var resizeByRow = function(){
		if(point == readyQueue.length) return;
		var getSumRate = function(arr){
			var res = 0;
			for(var i = 0; i < arr.length; i++){
				res += arr[i]['width']/arr[i]['height'];
			}
			return res;
		};
		var res = rowArr.length ? getSumRate(rowArr) : 0;

		while(res < 2){
			if(readyQueue[point]){
				rowArr.push(readyQueue[point]);
				point ++
				res = getSumRate(rowArr);
			}else{
				break;
			}
		}

		renderByRow(rowArr);
		rowArr = [];
	};

	var resizeQueue = function(){
		renderTimer = setTimeout(function(){
			window.scrollTo(0, 0);
			clearTimeout(renderTimer);
			resizeByRow();
		}, 200);
	};

	var initImageRender = function(){
		var data = imgSource;

		if(!hiddenDiv){
			hiddenDiv = $('<div style="position:absolute; top:0; left:0; width:1px;height:1px;visibility:hidden; overflow:hidden"></div>');
			$('body').append(hiddenDiv);
		}

		var l = data.length;
		var imgloadHandler = function(i, img){
			hiddenDiv.append(img);
 			data[i]['height'] = img.clientHeight;
 			data[i]['width'] = img.clientWidth;
			readyQueue.push(data[i]);
			resizeQueue();
		};
		var loadImg = function(i, data){
			var img = new Image();
			
			if(sync){
				img.onload = function(){
					imgloadHandler(i, img);
					if(i < (l-1)) loadImg(++i, data);
				};
			}else{
				if(i < l-1) loadImg(++i, data);
				img.onload = function(){
					imgloadHandler(i, img);
				};
			}
			
			img.src = data[i]['url'];
		};

		loadImg(0, data);
	};

	var orientationchange = function(obj){
		clientObj = {
			height : window.screen.height,
			width : window.innerWidth,
		};
		point = 0;

		$('#main').html('');

		orientationTimer = setInterval(function(){
			window.scrollTo(0, 0);
			if(point != readyQueue.length){
				initImageRender();
			}else{
				clearInterval(orientationTimer);
			}
		}, 200);
	};

	var zoom = false;
	var zoomDuration = '200ms';
	var zoomAni = function(){

		var target = $(this)[0];
		var innerWidth = window.innerWidth;
		var innerHeight = window.innerHeight;
		var pix = innerWidth/innerHeight;
		var sy = window.scrollY;
		var scale, state = {};
		var nX, nY;

		console.log('target.x:' + target.x);
		console.log('target.y:' + target.y);

		if(target.width/target.height > pix){
			scale = innerWidth/(target.offsetWidth);
			state['base'] = 'width';
		}else{
			scale = innerHeight/(target.offsetHeight);
			state['base'] = 'height';
		}

		state['width'] = target.width * scale;
		state['height'] = target.height * scale;

		//以宽度放大为标准，对齐高度
		var scaleHeight = target.offsetHeight * scale;
		var offsetY = (innerHeight - scaleHeight)/2;

		//以高度放大为标准，对齐宽度
		var scaleWidth = target.offsetWidth * scale;
		var offsetX = (innerWidth - scaleWidth)/2;

		console.log('scaleHeight:' + scaleHeight);
		console.log('offsetY:' + offsetY);
		console.log('clientObj[height]:' + clientObj['height']);
		console.log('scaleWidth:' + scaleWidth);
		console.log('offsetX:' + offsetX);
		console.log('clientObj[width]:' + clientObj['width']);

		var parent = $(this).parent().parent();

		//基准点偏移量
		//to-do 提炼出坐标计算公式
		var originX = (target.x*scale - offsetX)/(scale-1);
		var originY = ((target.y*scale) - window.scrollY - offsetY)/(scale-1);

		parent.css({'-webkit-transform-origin' : originX+'px ' + originY + 'px',
			'-webkit-transition':'none'});

		wrap[0].getBoundingClientRect();

		parent.css({'-webkit-transform': 'scale('+ scale +') translateZ(0)',
			'-webkit-transition':' all '+ zoomDuration +' ease-in'});

		parent.bind('webkitTransitionEnd', function(){
			parent.unbind('webkitTransitionEnd');
			coverBackground(target, scale, state);
		})

		zoom = true;
	};

	var backLayer;
	var coverBackground = function(dom, s, state){
		backLayer = $('<div style="position:absolute; opacity:0; -webkit-transition:opacity 100ms linear; z-index:99;background:#000;height:'+ innerHeight +'px;width:'+ innerWidth +'px"></div>');
		var target = dom.cloneNode();
		var top = 0,left = 0;
		if(state['base'] == 'height'){
			target.height = window.innerHeight;
			target.width = state['width'];
			top = window.scrollY;
			left = (window.innerWidth - state['width']) / 2;
		}else if(state['base'] == 'width'){
			target.width = window.innerWidth;
			target.height = state['height'];
			top = window.scrollY + ((window.innerHeight - state['height']) / 2);
		}

		target.className = 'cloneNode';
		backLayer.css({'top': window.scrollY + 'px', 'left' : '0px'});
		$(target).css({'position':'absolute', 'z-index':'100', 'top': top + 'px', 'left' : left + 'px'});

		$('body').append(backLayer);
		$('body').append(target);

		backLayer[0].getBoundingClientRect();
		backLayer.css('opacity', 1);

		$(target).bind('touchstart', function(e){ e.preventDefault(); e.stopImmediatePropagation();uncover(); });
		backLayer.bind('touchstart', function(e){ e.preventDefault(); e.stopImmediatePropagation();uncover(); });
	};

	var uncover = function(){
		backLayer.bind('webkitTransitionEnd', function(){
			backLayer.unbind('webkitTransitionEnd');
			$('.cloneNode').remove();
			backLayer.remove();
			wrap.css({'-webkit-transform' : 'scale(1) translateZ(0)'});
			setTimeout(function(){
				wrap.css({'-webkit-transform-origin':'0 0'});
				setTimeout(function(){
					wrap.css({'-webkit-transform':'none'});	
				},200);
				wrap[0].getBoundingClientRect();
			},200);
		});
		backLayer.css('-webkit-transition-duration','150ms');
		backLayer.css('opacity', 0);
	};

	var initFunctional = function(){
		initImageRender();
		window.addEventListener("orientationchange", orientationchange);
		wrap.delegate('img', 'click', zoomAni);
	};

	return function(dom, imgArr, isSync){
		imgSource = imgArr;
		wrap = dom;
		sync = isSync;
		initFunctional();
	};
})();
