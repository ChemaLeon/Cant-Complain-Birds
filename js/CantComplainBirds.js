var frameRate = 60;
var numberOfMarkers = 35;
var markers = [];

var worldWidth = 1110;
var worldHeight = 600;
var wallsWidth = 2;
var PhysicsToCSSOffset = 0;
	
var worldScale = 30;
var physicalBoxes = [];
var offsetX = [];
var offsetY = [];
var startboxSizeX = 50;
var startboxSizeY = 50;
var boxBorder = 0;
var tempBoxDiv = new Box();

var b2Vec2 = Box2D.Common.Math.b2Vec2;
var b2AABB = Box2D.Collision.b2AABB;
var b2BodyDef = Box2D.Dynamics.b2BodyDef;
var b2Body = Box2D.Dynamics.b2Body;
var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
var b2Fixture = Box2D.Dynamics.b2Fixture;
var b2World = Box2D.Dynamics.b2World;
var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
var world = new b2World(new b2Vec2(0, 10),true);
	
var mouseDown;
var cannonPower = 100;

var editorMode = false;
var snapToGridSize = 25;
var angleInDegrees = 0;
var bulletWidth = 20;

$(document).ready(function() {
	init();
})

function init() {
	//debugDraw();
	createMarkers();	
	document.getElementById("gamewrap").style.width = "100%";
	document.getElementById("gamewrap").style.height = worldHeight+"px";
	document.getElementById("editor").style.height = (worldHeight+20)+"px";
	//document.getElementById("sidebar").style.left = (worldWidth+20)+"px";
	//document.getElementById("sidebar").style.height = worldHeight+"px";
	document.getElementById("cannon").style.top = (worldHeight-85)+"px";
	
	var boundingBox1 = new Box((worldWidth*0.5), worldHeight, worldWidth, wallsWidth);
	var boundingBox2 = new Box((worldWidth*0.5), 0, worldWidth, wallsWidth);
	var boundingBox3 = new Box(0, (worldHeight*0.5), wallsWidth, worldHeight);
	var boundingBox4 = new Box(worldWidth, (worldHeight*0.5), wallsWidth, worldHeight);
	
	createBox(boundingBox1, b2Body.b2_staticBody);
	createBox(boundingBox2, b2Body.b2_staticBody);
	createBox(boundingBox3, b2Body.b2_staticBody);
	createBox(boundingBox4, b2Body.b2_staticBody);
	
	window.setInterval(update,1000/frameRate);
}

function update() {
	if (editorMode) {
		world.Step(0,10,10);
	} else {
		if (keyisdown)
		{
			world.Step(1/600*2,10,10);
		} else {
			world.Step(1/frameRate*2,10,10);
		}
	}
	//world.DrawDebugData();
	var i = physicalBoxes.length-1;
	for (var b = world.GetBodyList(); b; b = b.GetNext())
	{
		if (b.GetNext() != null && b.GetType() == 2)
		{
			physicalBoxes[i].style.top = ((b.GetPosition().y*worldScale))-((parseInt(physicalBoxes[i].style.height)+(boxBorder*2))*0.5)+"px";
			physicalBoxes[i].style.left = ((b.GetPosition().x*worldScale))-((parseInt(physicalBoxes[i].style.width)+(boxBorder*2))*0.5)+"px";
			physicalBoxes[i].style.webkitTransform = "rotate("+(b.GetAngle()*(180/Math.PI))+"deg)";
		}
		i--;
	}
	//console.log(world.GetBodyCount());
	world.ClearForces();
}

// -------------------------------- EVENT LISTENERS START -------------------------------- //
document.addEventListener("mouseup",function(e) {
	if (mouseDown && editorMode)
	{
		spawnBox(tempBoxDiv);
	}
	mouseDown = false;
});

document.getElementById("gamewrap").addEventListener("mousedown",function(e) {
	mouseDown = true;
	if (editorMode)
	{
		var offset = $("#editor").offset();
		var offsetY = offset.top - $(window).scrollTop();
		var offsetX = offset.left - $(window).scrollLeft(); 
		createTempBox(e.clientX-offsetX, e.clientY-offsetY, startboxSizeX, startboxSizeY);
	} else {
		shootBullet();
	}
});

document.getElementById("gamewrap").addEventListener("mousemove",function(e) {
	if (!editorMode)
	{
		var offset = $("#editor").offset();
		var offsetY = offset.top - $(window).scrollTop();
		var offsetX = offset.left - $(window).scrollLeft(); 
		updateMarkers(e.clientX-offsetX, e.clientY-offsetY);
	}
	if (mouseDown && editorMode)
	{
		if (tempBoxDiv.div != null)
		{
			var offset = $("#editor").offset();
			var offsetY = offset.top - $(window).scrollTop();
			var offsetX = offset.left - $(window).scrollLeft(); 
			updateTempBox(e.clientX-offsetX, e.clientY-offsetY);
		}
	}
});

$("[name='editorModeSwitch']").bootstrapSwitch();
$("[name='snapToGridSwitch']").bootstrapSwitch();

$('input[name="editorModeSwitch"]').on('switchChange.bootstrapSwitch', function(event, state) {
	switchEditorMode();
	$('input[name="snapToGridSwitch"]').bootstrapSwitch('toggleDisabled');
	$('#saveLevelButton').prop('disabled', !state);
});

$('input[name="snapToGridSwitch"]').on('switchChange.bootstrapSwitch', function(event, state) {
	switchSnapToGrid();
});

document.getElementById("gamewrap").addEventListener("mousewheel", function(e) {
	if (!editorMode)
	{
		var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
		cannonPower += delta;
		var offset = $("#editor").offset();
		var offsetY = offset.top - $(window).scrollTop();
		var offsetX = offset.left - $(window).scrollLeft(); 
		updateMarkers(e.clientX-offsetX, e.clientY-offsetY);
	}
});
// --------------------------------  EVENT LISTENERS END  -------------------------------- //

function switchEditorMode() {
	editorMode  = !editorMode;
	if (editorMode)
	{
		document.getElementById("gamewrap").style.backgroundImage = "url(img/grid.png)";
		
	} else {
		document.getElementById("gamewrap").style.backgroundImage = "";
	}
}

function switchSnapToGrid() {
	if (snapToGridSize == 1)
	{
		snapToGridSize = 25;
	} else {
		snapToGridSize = 1;
	}
}

function createMarkers() {
	for (var i=0; i < numberOfMarkers; i++)
	{
		var img = document.createElement("img");
		img.className = "marker";
		img.src = "img/marker.png";
		img.style.left = "-50px";
		document.getElementById("markers").appendChild(img);
		markers.push(img);
	}
}

function updateMarkers(xPos, yPos) {
	
	var cannonOrigin = { x:50, y:(worldHeight-20) };
	var mouseOrigin = { x:xPos, y:yPos };
	var deltaX = (mouseOrigin.x-cannonOrigin.x);
	var deltaY = (mouseOrigin.y-cannonOrigin.y);
	var angleInRadians =  Math.atan(deltaY / deltaX);
	angleInDegrees = angleInRadians * 180 / Math.PI;
	//var shotMarker = document.getElementById("shotMarker");
	var cannonBody = document.getElementById("cannon-body");
	//shotMarker.style.left = cannonOrigin.x+"px";
	//shotMarker.style.top = cannonOrigin.y+"px";
	//shotMarker.style.width = (Math.sqrt(Math.pow(deltaX,2)+Math.pow(deltaY,2))-3)+"px";
	//shotMarker.style.width = cannonPower+"px";
	//shotMarker.style.height = 2+"px";
	//shotMarker.style.transform = 'rotate('+angleInDegrees+'deg)';
	cannonBody.style.transform = 'rotate('+angleInDegrees+'deg)';
	for (var i = 0; i < markers.length; i++)
	{
		markers[i].style.left = cannonOrigin.x+(cannonPower*i*Math.cos(-angleInRadians))-15+"px";
		markers[i].style.top = cannonOrigin.y-((cannonPower*i*Math.sin(-angleInRadians))-0.5*9.8*(Math.pow(i,2)))-15+"px";
	}
}

function changeBoxWidth(value) {
	startboxSizeX = value;
}

function changeBoxHeight(value) {
	startboxSizeY = value;
}

function Box(xPos, yPos, width, height) {
	this.x = xPos;
	this.y = yPos;
	this.width = width;
	this.height = height;
	this.div = null;
}

function createTempBox(xPos, yPos, width, height) {
	tempBoxDiv = new Box();
	var div = document.createElement("div");
	div.className = "tempBox";
	xPos = xPos - xPos%snapToGridSize;
	yPos = yPos - yPos%snapToGridSize;
	div.style.left = (xPos - PhysicsToCSSOffset)-((width-(boxBorder*2))/2)+PhysicsToCSSOffset+"px";
	div.style.top =  (yPos - PhysicsToCSSOffset)-((height-(boxBorder*2))/2)+PhysicsToCSSOffset+"px";
	div.style.width = (width-(boxBorder*2))+"px";
	div.style.height = (height-(boxBorder*2))+"px";
	div.style.border = boxBorder+"px solid black";
	document.getElementById("gamewrap").appendChild(div);
	tempBoxDiv.x = xPos;
	tempBoxDiv.y = yPos;
	tempBoxDiv.width = width;
	tempBoxDiv.height = height;
	tempBoxDiv.div = div;
}

function updateTempBox(xPos, yPos) {
	tempBoxDiv.x = xPos - xPos%snapToGridSize;
	tempBoxDiv.y = yPos - yPos%snapToGridSize;
	tempBoxDiv.div.style.left = (tempBoxDiv.x - PhysicsToCSSOffset)-((tempBoxDiv.width)/2)+PhysicsToCSSOffset+"px";
	tempBoxDiv.div.style.top =  (tempBoxDiv.y - PhysicsToCSSOffset)-((tempBoxDiv.height)/2)+PhysicsToCSSOffset+"px";
}

function spawnBox(box) {
	var boxSizeX = startboxSizeX;
	var boxSizeY = startboxSizeY;
	var randomX = Math.random()*0;
	var randomY = Math.random()*0;
	boxSizeX += randomX;
	boxSizeY += randomY;
	box.x = (box.x-PhysicsToCSSOffset);
	box.y = (box.y-PhysicsToCSSOffset);
	createBox(box, b2Body.b2_dynamicBody);
}

function createBox(box, type) {
	var bodyDef = new b2BodyDef;
	bodyDef.type = type;
	bodyDef.position.Set(box.x/worldScale,box.y/worldScale);
	var polygonShape = new b2PolygonShape;
	polygonShape.SetAsBox(box.width/2/worldScale,box.height/2/worldScale);
	var fixtureDef = new b2FixtureDef;
	fixtureDef.density = 1.0;
	fixtureDef.friction = 0.6;
	fixtureDef.restitution = 0.1;
	fixtureDef.shape = polygonShape;
	var body=world.CreateBody(bodyDef);
	body.CreateFixture(fixtureDef);
	if (type != b2Body.b2_staticBody)
	{
		releaseBox(box);
	} else {
		createDiv(box);
	}
}

function shootBullet() {
	var bodyDef = new b2BodyDef;
	bodyDef.type = b2Body.b2_dynamicBody;
	bodyDef.position.Set(35/worldScale,(worldHeight-20)/worldScale);
	var circleShape = new b2CircleShape;
	circleShape.SetRadius((bulletWidth*0.5)/worldScale);
	var fixtureDef = new b2FixtureDef;
	fixtureDef.density = 10.0;
	fixtureDef.friction = 1.0;
	fixtureDef.restitution = 0.5;
	fixtureDef.shape = circleShape;
	var body=world.CreateBody(bodyDef);
	body.CreateFixture(fixtureDef);
	var power = cannonPower*0.0654*fixtureDef.density;
	var vector = new b2Vec2(Math.cos(angleInDegrees*(Math.PI/180))*power, Math.sin(angleInDegrees*(Math.PI/180))*power);

	body.ApplyImpulse(vector, body.GetWorldCenter());
	
	var div = document.createElement("div");
	div.className = "bullet";
	div.style.top = -50+"px";
	div.style.left = -50+"px";
	div.style.width = bulletWidth+"px";
	div.style.height = bulletWidth+"px";
	div.style.borderRadius = bulletWidth*0.5+"px";
	document.getElementById("gamewrap").appendChild(div);
	physicalBoxes.push(div);
}

function releaseBox(box) {
	box.div.className = "box";
	box.div.style.top = (box.y-(box.height/2))+"px";
	box.div.style.left = (box.x-(box.width/2))+"px";
	document.getElementById("gamewrap").appendChild(box.div);
	physicalBoxes.push(box.div);
	tempBoxDiv = new Box();
}

function createDiv(box) {
	var div = document.createElement("div");
	div.className = "staticBox";
	div.style.top = (box.y-(box.height/2)+PhysicsToCSSOffset)+"px";
	div.style.left = (box.x-(box.width/2)+PhysicsToCSSOffset)+"px";
	div.style.width = box.width+"px";
	div.style.height = box.height+"px";
	document.getElementById("gamewrap").appendChild(div);
}

function debugDraw(){
	var debugDraw = new b2DebugDraw();
	debugDraw.SetSprite(document.getElementById("canvas").getContext("2d"));
	debugDraw.SetDrawScale(30.0);
	debugDraw.SetFillAlpha(1.0);
	debugDraw.SetLineThickness(5.0);
	debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
	world.SetDebugDraw(debugDraw);
}

var keyisdown = false;
$('body').bind('keydown',function(e){
	var keycode = 73;
	if (e.which === keycode) {
		keyisdown = true;
	}
}).bind('keyup',function(){
	keyisdown = false;
});