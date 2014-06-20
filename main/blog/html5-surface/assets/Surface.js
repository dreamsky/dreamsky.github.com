/**
 * Copyright (C) 2011 by Paul Lewis
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var AEROTWIST = AEROTWIST || {};
AEROTWIST.Surface = new function()
{
	// internal vars
	var camera,
		scene,
		renderer		= null,
		canvas			= null,
		context			= null,
		$container 		= $('#container'),
		width			= $container.width(),
		height			= $container.height(),
		$gui			= $('#gui'),
		vars			= [],
		projector		= new THREE.Projector(),
		center			= new THREE.Vector3(),
		orbitCamera		= true,
		orbitValue		= 0,
		lastRainDrop	= 0,
		image			= null,
		running 		= true,
		
	// core objects
		surface			= null,
		surfaceVerts	= [],
		raindrops		= [],
		
	// constants
		DAMPEN			= .9,
		AGGRESSION		= 400,
		DEPTH 			= 500,
		NEAR 			= 1,
		FAR 			= 10000,
		X_RESOLUTION	= 20,
		Y_RESOLUTION	= 20,
		SURFACE_WIDTH	= 400,
		SURFACE_HEIGHT	= 400,
		DROP_RATE		= 200,
		fin 			= true;
	
	this.pause = function() {
		running = false;
	}
	
	this.play = function() {
		if(!running) {
			running = true;
			update();
		}
	}
	
	/**
	 * Initializes the experiment and kicks
	 * everything off. Yay!
	 */
	this.init = function()
	{
		// stop the user clicking
		document.onselectstart		= function(){ return false; };
		
		// set up our initial vars
		vars["magnitude"]			= 30;
		vars["orbitSpeed"]			= 0.001;
		vars["orbit"]				= true;
		vars["wireframeOpacity"]	= 1;
		vars["raindrops"]			= true;
		vars["elasticity"]			= 0.001;
		
		// add listeners
		addEventListeners();
		
		// create our stuff
		if(createRenderer())
		{
			createObjects();
			addLights();
		
			// start rendering, which will
			// do nothing until the image is dropped
			update();
		
			$gui.addClass('live');
		}
		else
		{
			$('html').removeClass('webgl').addClass('no-webgl');
		}
	};
	
	/**
	 * Handles when a file is dropped by
	 * the user onto the container
	 */
	function dropFile(event)
	{
		// stop the browser doing
		// it's normal thing of going
		// to the item
		event.stopPropagation();
		event.preventDefault();
		
		// query what was dropped
		var files = event.dataTransfer.files;
		
		// if we have something
		if(files.length) {
			handleFile(files[0]);
		}
		
		return false;
	}
	
	/**
	 * Handles the uploaded file
	 */
	function handleFile(file)
	{
		var fileReader 			= new FileReader();
		fileReader.onloadend	= fileUploaded;
		fileReader.readAsDataURL(file);
	}
	
	/**
	 * File upload handled
	 */
	function fileUploaded(event)
	{		
		// check it's an image
		if(event.target.result.match(/^data:image/))
		{
		    // create a new image
			image 		= document.createElement('img');
			image.src 	= event.target.result;
			
			// give the browser chance to
			// create the image object
			setTimeout(function(){
				
				// split the image
				updatePlane();
				
			}, 100);
		}
		else
		{
			// time to whinge
			alert("Umm, images only? ... Yeah");
		}
	}
	
	/**
	 * Simple handler function for 
	 * the events we don't care about
	 */
	function cancel(event)
	{
		if(event.preventDefault)
			event.preventDefault();
		
		return false;
	}
	
	/**
	 * Adds some basic lighting to the
	 * scene. Only applies to the centres
	 */
	function addLights()
	{
		// point
		pointLight = new THREE.PointLight( 0xFFFFFF );
		pointLight.position.x = 10;
		pointLight.position.y = 100;
		pointLight.position.z = 10;
		scene.addLight( pointLight );
	}
	
	/**
	 * Creates the objects we need
	 */
	function createObjects()
	{
		var planeMaterial 		= new THREE.MeshLambertMaterial({color: 0xFFFFFF, map: ImageUtils.loadTexture("images/72lions_sterik.jpg"), shading: THREE.SmoothShading}),
			planeMaterialWire 	= new THREE.MeshLambertMaterial({color: 0xFFFFFF, wireframe:true});
		
		surface 				= new THREE.Mesh(new Plane(SURFACE_WIDTH, SURFACE_HEIGHT, X_RESOLUTION, Y_RESOLUTION), [planeMaterial, planeMaterialWire]);
		surface.rotation.x 		= -Math.PI * .5;
		surface.overdraw		= true;
		scene.addChild(surface);
		
		// go through each vertex
		surfaceVerts 	= surface.geometry.vertices;
		sCount			= surfaceVerts.length;
		
		// three.js creates the verts for the
		// mesh in x,y,z order I think
		while(sCount--)
		{
			var vertex 		= surfaceVerts[sCount];
			vertex.springs 	= [];
			vertex.velocity = new THREE.Vector3();
			
			// connect this vertex to the ones around it
			if(vertex.position.x > (-SURFACE_WIDTH * .5))
			{
				// connect to left
				vertex.springs.push({start:sCount, end:sCount-1});
			}
			
			if(vertex.position.x < (SURFACE_WIDTH * .5))
			{
				// connect to right
				vertex.springs.push({start:sCount, end:sCount+1});
			}
			
			if(vertex.position.y < (SURFACE_HEIGHT * .5))
			{
				// connect above
				vertex.springs.push({start:sCount, end:sCount-(X_RESOLUTION+1)});
			}

			if(vertex.position.y > (-SURFACE_HEIGHT * .5))
			{
				// connect below
				vertex.springs.push({start:sCount, end:sCount+(X_RESOLUTION+1)});
			}
		}
	}
	
	/**
	 * Creates the WebGL renderer
	 */
	function createRenderer()
	{
		var ok = false;
		
		try
		{
			renderer 					= new THREE.WebGLRenderer();
			camera 						= new THREE.Camera(45, width / height, NEAR, FAR);
			scene 						= new THREE.Scene();
			canvas						= document.createElement('canvas');
			canvas.width				= SURFACE_WIDTH;
			canvas.height				= SURFACE_HEIGHT;
			context						= canvas.getContext('2d');
			
			context.fillStyle = "#000000";
			context.beginPath();
			context.fillRect(0,0,SURFACE_WIDTH,SURFACE_HEIGHT);
			context.closePath();
			context.fill();
	
		
		    // position the camera
			camera.position.y 			= 220;
			camera.position.z			= DEPTH;
		    
		    // start the renderer
		    renderer.setSize(width, height);
		    $container.append(renderer.domElement);
		
		    ok = true;
		}
		catch(e)
		{
			ok = false;
		}
		
		return ok;
	}
	
	/**
	 * Sets up the event listeners for DnD, the GUI
	 * and window resize
	 */
	function addEventListeners()
	{
		// window event
		$(window).resize(callbacks.windowResize);
		$(window).keydown(callbacks.keyDown);
		
		// click handler
		$(document.body).mousedown(callbacks.mouseDown);
		$(document.body).mouseup(callbacks.mouseUp);
		$(document.body).click(callbacks.mouseClick);
		
		var container = $container[0];
		container.addEventListener('dragover', cancel, false);
		container.addEventListener('dragenter', cancel, false);
		container.addEventListener('dragexit', cancel, false);
		container.addEventListener('drop', dropFile, false);
		
		// GUI events
		$(".gui-set a").click(callbacks.guiClick);
		$(".gui-set a.default").trigger('click');
	}
	
	function updatePlane()
	{
		var ratio				= 1 / Math.max(image.width/SURFACE_WIDTH, image.height/SURFACE_HEIGHT);
		var scaledWidth			= image.width * ratio;
		var scaledHeight		= image.height * ratio;
		context.drawImage(image,
							0,0,image.width,image.height,
							(SURFACE_WIDTH - scaledWidth) * .5, (SURFACE_HEIGHT - scaledHeight) *.5, scaledWidth, scaledHeight);
	
		var newPlaneMaterial 	= new THREE.MeshLambertMaterial({color: 0xFFFFFF, map: ImageUtils.loadTexture(canvas.toDataURL("image/png")), shading: THREE.SmoothShading});
		surface.materials[0] 	= newPlaneMaterial;
	}
	
	/**
	 * Updates the velocity and position
	 * of the particles in the view
	 */
	function update()
	{
		orbitValue 			+= vars["orbit"] ? vars["orbitSpeed"] : 0;
		camera.position.x 	= Math.sin(orbitValue) * DEPTH;
		camera.position.z 	= Math.cos(orbitValue) * DEPTH;
		camera.update();
		
		if(vars["raindrops"])
		{
			if(new Date().getTime() - lastRainDrop > DROP_RATE)
			{
				var raindropMaterial 	= new THREE.MeshBasicMaterial({color:0xFFFFFF, opacity: 0.7});
				var raindrop 			= new THREE.Mesh(new Sphere(2,2,8,8), raindropMaterial);
				raindrop.velocity 		= new THREE.Vector3(0,0,0);
				raindrop.position		= new THREE.Vector3(SURFACE_WIDTH * .5 - Math.random() * SURFACE_WIDTH,600,SURFACE_HEIGHT * .5 - Math.random() * SURFACE_HEIGHT);
				raindrops.push(raindrop);
				scene.addChild(raindrop);
				
				lastRainDrop = new Date().getTime();
			}
		}
		
		var r = raindrops.length;
		while(r--)
		{
			var raindrop = raindrops[r];
			raindrop.velocity.addSelf(new THREE.Vector3(0,-0.3,0));
			raindrop.position.addSelf(raindrop.velocity);
			
			if(raindrop.position.y < 0)
			{
				scene.removeChild(raindrop);
				raindrops.splice(r,1);
				
				var xVal	= Math.floor((raindrop.position.x / SURFACE_WIDTH) * X_RESOLUTION),
				yVal		= Math.floor((raindrop.position.z / SURFACE_HEIGHT) * Y_RESOLUTION);
			
				xVal 		+= X_RESOLUTION * .5;
				yVal 		+= Y_RESOLUTION * .5;
	
				index		= (yVal * (X_RESOLUTION + 1)) + xVal;
				
				surfaceVerts[index].velocity.z += vars["magnitude"] * 5;
			}
		}
		
		surface.materials[1].opacity = vars["wireframeOpacity"];
		
		var v = surfaceVerts.length;
		while(v--) {
			var vertex			= surfaceVerts[v],
				acceleration 	= new THREE.Vector3(0, 0, -vertex.position.z * vars["elasticity"]),
				springs			= vertex.springs,
				s				= springs.length;
			
			vertex.velocity.addSelf(acceleration);
			
			while(s--) {
				var spring 		= springs[s],
					extension	= surfaceVerts[spring.start].position.z - surfaceVerts[spring.end].position.z;
				
				acceleration 	= new THREE.Vector3(0, 0, extension * vars["elasticity"] * 50);
				surfaceVerts[spring.end].velocity.addSelf(acceleration);
				surfaceVerts[spring.start].velocity.subSelf(acceleration);
			}

			vertex.position.addSelf(vertex.velocity);
			
			vertex.velocity.multiplyScalar(DAMPEN);
		}
		
		surface.geometry.computeFaceNormals(true);
		surface.geometry.__dirtyVertices = true;
		surface.geometry.__dirtyNormals = true;
		
		// set up a request for a render
		requestAnimationFrame(render);
	}
	
	/**
	 * Renders the current state
	 */
	function render()
	{
		// only render
		if(renderer) {
			renderer.render(scene, camera);
		}
		
		// set up the next frame
		if(running) {
			update();
		}
	}
	
	function disturbSurface(event, magnitude)
	{
		if(running) {
			var mouseX	= event.offsetX || (event.clientX - 220);
			var mouseY	= event.offsetY || event.clientY;
			
			var vector 	= new THREE.Vector3((mouseX / width) * 2 - 1, -(mouseY / height) * 2 + 1, 0.5);
			projector.unprojectVector(vector, camera);
			
			var ray 		= new THREE.Ray(camera.position, vector.subSelf(camera.position).normalize()),
				intersects	= ray.intersectObject(surface);
			
			// if the ray intersects with the
			// surface work out where
			if(intersects.length) {
				var iPoint 	= intersects[0].point,
				 	xVal	= Math.floor((iPoint.x / SURFACE_WIDTH) * X_RESOLUTION),
					yVal	= Math.floor((iPoint.z / SURFACE_HEIGHT) * Y_RESOLUTION);
				
				xVal 		+= X_RESOLUTION * .5;
				yVal 		+= Y_RESOLUTION * .5;
				
				index		= (yVal * (X_RESOLUTION + 1)) + xVal;
				
				if(index >= 0 && index < surfaceVerts.length) {
					surfaceVerts[index].velocity.z += magnitude;
				}
			}
		}
	}
	
	/**
	 * Our internal callbacks object - a neat
	 * and tidy way to organise the various
	 * callbacks in operation.
	 */
	callbacks = {
		mouseDown:function() {
			document.addEventListener('mousemove', callbacks.mouseMove, false);
		},
		mouseMove:function(event) {
			disturbSurface(event, vars["magnitude"]);
		},
		mouseClick: function(event) {
			disturbSurface(event, vars["magnitude"] * 5);
		},
		mouseUp:function() {
			document.removeEventListener('mousemove', callbacks.mouseMove, false);
		},
		guiClick:function() {
			var $this 	= $(this),
				varName	= $this.data("guivar"),
				varVal	= $this.data("guival");
			if(vars[varName] !== null) {
				vars[varName] = varVal;
			}
			
			$this.siblings().addClass('disabled');
			$this.removeClass('disabled');
			
			return false;
		},
		windowResize: function() {
			
			if(camera)
			{
				width			= $container.width(),
				height			= $container.height(),
				camera.aspect 	= width / height,
				renderer.setSize(width, height);
			
				camera.updateProjectionMatrix();
			}
		},
		keyDown: function(event) {
			
			if(camera)
			{
				switch(event.keyCode)
				{
				case 37: // Left
						orbitValue -= 0.1;
						break;
						
				case 39: // Right
						orbitValue += 0.1;
						break;
						
				}
				camera.update();
			}
		}
	};
};

// Surfaceize!
$(document).ready(function(){
	
	if(Modernizr.webgl) {
		// Go!
		AEROTWIST.Surface.init();
	}
});