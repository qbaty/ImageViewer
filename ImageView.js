ImageViewer = (function(){

  	var imgSource, wrap;

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

			if(arr.length > 1){
				for(var i = 1; i < arr.length; i++){
					temp = arr[i];
					multiple += (divisor/(temp['height']/temp['width']));
				}
			}
			
			var h = (wholeWidth / multiple) * divisor;
			var html = '<div class="row">';
			for(var j = 0; j < arr.length; j++){
				html += '<img class="render" height="'+ h +'" src="'+ arr[j]['url'] +'"/>';
			}
			html += '</div>';

			$('#main').append($(html));
		};

		//返回一行已经调整好大小的图片
		var resizeByRow = function(){
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
					return ;
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

			var loadImg = function(i, data){
				var img = new Image();
				img.onload = function(){
					hiddenDiv.append(img);
		 			data[i]['height'] = img.clientHeight;
		 			data[i]['width'] = img.clientWidth;
					readyQueue.push(data[i]);
		 			resizeQueue();
				};
				img.src = data[i]['url'];
			}

			for(var i = 0; i < data.length; i++){
				loadImg(i, data);
			}
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
					compute();
				}else{
					clearInterval(orientationTimer);
				}
			}, 200);
		};

		var zoom = false;
		var zoomAni = function(){
			if(zoom){
				wrap.css({'-webkit-transform' : 'scale(1) translateZ(0)'});
				setTimeout(function(){
					wrap.css({'-webkit-transform-origin':'0 0'});
					setTimeout(function(){
						wrap.css({'-webkit-transform':'none'});	
					},200);
					wrap[0].getBoundingClientRect();
				},200);
				zoom = false;
				return ;
			}
			
			var target = $(this)[0];
			var innerWidth = window.innerWidth;
			var innerHeight = window.innerHeight;
			var pix = innerWidth/innerHeight;
			var sy = window.scrollY;
			var scale;
			var nX, nY;

			console.log('target.x:' + target.x);
			console.log('target.y:' + target.y);

			if(target.width/target.height > pix){
				scale = innerWidth/(target.offsetWidth);
			}else{
				scale = innerHeight/(target.offsetHeight);
			}

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

			parent.css({'-webkit-transform-origin' : originX+'px ' + originY + 'px', '-webkit-transition':'none'});

			wrap[0].getBoundingClientRect();

			parent.css({'-webkit-transform': 'scale('+ scale +') translateZ(0)','-webkit-transition':' all 200ms ease-out'});

			zoom = true;
		};

		var initFunctional = function(){
			initImageRender();
			window.addEventListener("orientationchange", orientationchange);
			wrap.delegate('img', 'click', zoomAni);
		};

		return function(dom, imgArr){
			imgSource = imgArr;
			wrap = dom;
			initFunctional();
		};
	})();
