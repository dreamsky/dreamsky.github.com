window.onload = function() {
		this.zoom = 4;
		this.numTentacles = 6;
		this.numSegments = 2000;
		this.redPhase = 0;
		this.greenPhase = .33;
		this.bluePhase = .66;
		this.followMouse = true;

		var gui = new DAT.GUI({width:400});
		gui.add(this, "zoom", 1, 20).name("Zoom");
		gui.add(this, "numTentacles", 1, 24).name("Number of Tentacles");
		gui.add(this, "numSegments", 100, 40000).name("Number of Segments");
		gui.add(this, "redPhase", 0, 1).name("Red Phase");
		gui.add(this, "greenPhase", 0, 1).name("Green Phase");
		gui.add(this, "bluePhase", 0, 1).name("Blue Phase");
		gui.add(this, "followMouse").name("Follow Mouse");

		var g = new GEE({ fullscreen: true, container: document.getElementById("backgroundHolder")});

		var x1 = 0;
		var x2 = 0;

		var minx,miny,maxx,maxy;
		var p = new Array(4000);

		var clear = false;

		var mouseMoved = false;
		g.draw = function() {
			var ctx = g.ctx;

			// erase previous frame using bounding box
			if (clear)
				ctx.clearRect(minx-2,miny-2,maxx-minx+4,maxy-miny+4);

			x1 += .05;
			x2 += .002;

			var a1 = Math.sin(x1)*.001;
			var a2 = Math.sin(x2)/20;

			// calculating the points of the tentacles
			var x = 0;
			var y = 0;
			for (var i=0;i<numSegments;i+=2) {
				// magic
				x = p[i] = x + 3*Math.cos((a1+a2*Math.sin(i/7.5/zoom))*i);
				y = p[i+1] = y + 3*Math.sin((a1+a2*Math.sin(i/7.5/zoom))*i);
			}

			// move to mouse
			var midx = followMouse && mouseMoved ? g.mouseX : g.width/2;
			var midy = followMouse && mouseMoved ? g.mouseY : g.height/2;

			minx = midx;
			maxx = midx;
			miny = midy;
			maxy = midy;
			var a3 = 2*Math.PI/numTentacles;

			// draw!
			var frequency = .1;
			var k = g.frameCount;

			for (var j=0;j<numTentacles;j++) {
				// finding a color from the rainbow
				var red = parseInt(Math.sin(frequency*k+(j+redPhase*6)*Math.PI/3)*127+128);
				var green = parseInt(Math.sin(frequency*k+(j+greenPhase*6)*Math.PI/3)*127+128);
				var blue = parseInt(Math.sin(frequency*k+(j+bluePhase*6)*Math.PI/3)*127+128);
				ctx.strokeStyle = "rgb("+red+","+green+","+blue+")";
				ctx.beginPath();
				ctx.moveTo(midx, midy);
				var a4 = a3*j;
				var s = Math.sin(a4);
				var c = Math.cos(a4);
				for (i=0;i<numSegments;i+=2) {
					x = p[i];
					y = p[i+1];
					// rotation transform
					var nx = midx+x*c-y*s;
					var ny = midy+x*s+y*c;

					// finding bounding box of drawing so clearRect operates as efficiently as possible
					if (nx<minx) {
						minx = nx;
					} else if (nx>maxx) {
						maxx = nx;
					}
					if (ny<miny) {
						miny = ny;
					} else if (ny>maxy) {
						maxy = ny;
					}

					// draw the line
					ctx.lineTo(nx,ny);
				}
				ctx.stroke();
				if (minx<0)
					minx=0;
				if (maxx>g.width)
					maxx = g.width;
				if (miny<0)
					miny = 0;
				if (maxy > g.height)
					maxy = g.height;
			}
		};
		g.mousedown = function() {
			clear = !clear;
			minx = 0;
			miny = 0;
			maxx = g.width;
			maxy = g.height;
		};
		g.mousemove = function() {
			mouseMoved = true;
		}
	}