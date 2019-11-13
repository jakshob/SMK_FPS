import * as THREE from './nm/three/build/three.module.js';
import { PointerLockControls } from './nm/three/examples/jsm/controls/PointerLockControls.js';
var camera, scene, renderer, controls;
var objects = [];
var textureList = [];
var raycaster;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;
var prevTime = performance.now();
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
var vertex = new THREE.Vector3();
var color = new THREE.Color();
init();
animate();
function init() {

	//Load background picture from file
	var backgroundTex = new THREE.TextureLoader().load("textures/back.jpg");

	//Camera 
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
	camera.position.y = 10;

	//Scene
	scene = new THREE.Scene();
	scene.background = backgroundTex; //Baggrundsfarve
	
	//Renderer
	renderer = new THREE.WebGLRenderer({ antialias: true });

	//Render

	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	window.addEventListener('resize', onWindowResize, false);
	
	//Light
	var light = new THREE.HemisphereLight(0xeeeeff, 0x686868, 0.75);
	light.position.set(0.5, 1, 0.75);
	scene.add(light);

	// floor
	var floorGeometry = new THREE.PlaneBufferGeometry(20000, 20000, 100, 100);
	floorGeometry.rotateX(- Math.PI / 2);

	//Control system
	raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, - 1, 0), 0, 10);
	controls = new PointerLockControls(camera);
	var blocker = document.getElementById('blocker');
	var instructions = document.getElementById('instructions');
	instructions.addEventListener('click', function () {
		controls.lock();
	}, false);
	controls.addEventListener('lock', function () {
		instructions.style.display = 'none';
		blocker.style.display = 'none';
	});
	controls.addEventListener('unlock', function () {
		blocker.style.display = 'block';
		instructions.style.display = '';
	});
	scene.add(controls.getObject());

	var onKeyDown = function (event) {
		switch (event.keyCode) {
			case 38: // up
			case 87: // w
				moveForward = true;
				break;
			case 37: // left
			case 65: // a
				moveLeft = true;
				break;
			case 40: // down
			case 83: // s
				moveBackward = true;
				break;
			case 39: // right
			case 68: // d
				moveRight = true;
				break;
			case 32: // space
				if (canJump === true) velocity.y += 350*2;
				canJump = false;
				break;
		}
	};

	var onKeyUp = function (event) {
		switch (event.keyCode) {
			case 38: // up
			case 87: // w
				moveForward = false;
				break;
			case 37: // left
			case 65: // a
				moveLeft = false;
				break;
			case 40: // down
			case 83: // s
				moveBackward = false;
				break;
			case 39: // right
			case 68: // d
				moveRight = false;
				break;
		}
	};


	document.addEventListener('keydown', onKeyDown, false);
	document.addEventListener('keyup', onKeyUp, false);

	//Making a random string to make random highlight URL random.
	function makeid(length) {
		var result = '';
		var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		var charactersLength = characters.length;
		for (var i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}
		return result;
	}

	var random = makeid(5);


	//HTTP Request
	var request = new XMLHttpRequest();

	//This URL asks SMKs server for random highlights based on a random string. If you want to make a universe based on something else change the URL
	request.open('GET', 'https://api.smk.dk/api/v1/art/search/?keys=*&offset=0&rows=30&randomHighlights=' + random, true);


	//This will happen when the request gets a response from SMKs server.
	request.onload = function () {


		// Begin accessing JSON data here

		var data = JSON.parse(this.response);
		if (request.status >= 200 && request.status < 400) {

			data.items.forEach(image => {
				if (image.image_thumbnail !== undefined) {
					
					textureList.push(image.image_thumbnail);

				}


			});

		} else {
			const errorMessage = document.createElement('marquee');
			errorMessage.textContent = `HTTP-request failure`;
			app.appendChild(errorMessage);
		}

	

		//Load texture to floor
		var texture = new THREE.TextureLoader().load(textureList[3]);

		//Map floor material to the texture just loaded
		var floorMaterial = new THREE.MeshBasicMaterial({ map: texture });

		//Create floor from material and geometry
		var floor = new THREE.Mesh(floorGeometry, floorMaterial);

		//Add floor to scene
		scene.add(floor);

		//Geometry for the images 
		var boxGeometry = new THREE.BoxBufferGeometry(40, 40, 0.1);

		//Looping through the textureList to make the image objects. They all share the same geometry at the moment.
		for (var i = 0; i < textureList.length; i++) {
 
			var textureFromAPI = new THREE.TextureLoader().load(textureList[i]);
			var boxMaterial = new THREE.MeshPhongMaterial({
				specular: 0xffffff,
				flatShading: true,
				map: textureFromAPI
			});
		
			var box = new THREE.Mesh(boxGeometry, boxMaterial);

			//Position the box based on the location in array, feel free to make a more fun positioning
			box.position.x = i * 10;
			box.position.y = 30;
			box.position.z = i * 30;
			scene.add(box);
			objects.push(box);
		}
		
	}

	//Send request, when the request gets the response, everything in the onload function will happen
	request.send();
}


//Function that makes the page responsive
function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

//This is where the animation happens.
function animate() {
	requestAnimationFrame(animate);
	if (controls.isLocked === true) {
		raycaster.ray.origin.copy(controls.getObject().position);
		raycaster.ray.origin.y -= 10;
		var intersections = raycaster.intersectObjects(objects);
		var onObject = intersections.length > 0;
		var time = performance.now();
		var delta = (time - prevTime) / 1000;
		velocity.x -= velocity.x * 10.0 * delta;
		velocity.z -= velocity.z * 10.0 * delta;
		velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
		direction.z = Number(moveForward) - Number(moveBackward);
		direction.x = Number(moveRight) - Number(moveLeft);
		direction.normalize(); // this ensures consistent movements in all directions
		if (moveForward || moveBackward) velocity.z -= direction.z * 2400.0 * delta;
		if (moveLeft || moveRight) velocity.x -= direction.x * 2400.0 * delta;
		if (onObject === true) {
			velocity.y = Math.max(0, velocity.y);
			canJump = true;
		}
		controls.moveRight(- velocity.x * delta);
		controls.moveForward(- velocity.z * delta);
		controls.getObject().position.y += (velocity.y * delta); // new behavior
		if (controls.getObject().position.y < 10) {
			velocity.y = 0;
			controls.getObject().position.y = 10;
			canJump = true;
		}
		prevTime = time;
	}
	renderer.render(scene, camera);
}