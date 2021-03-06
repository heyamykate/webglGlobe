console.clear();

var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.01, 700 );
camera.position.set( 0, 0, 60 );

scene.add(camera);

var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

function render() {
  renderer.render(scene, camera);
}
TweenLite.ticker.addEventListener('tick', render );


////////////////////////////////////////


var object3d  = new THREE.DirectionalLight('white', 1);
object3d.position.set(2.6,1,3);
object3d.name = 'Back light';
scene.add(object3d);

var material = new THREE.MeshLambertMaterial( { side: THREE.DoubleSide, color: '#F00' } );

var object = new THREE.Mesh( new THREE.SphereGeometry( 4, 20, 20 ), material );
object.position.set( -10, 0, 0 );
object.name = 'Object 1';
scene.add( object );

var object = object.clone();
object.material = object.material.clone();
object.material.color.set('#0F0');
object.position.set(0, 0, 0 );
object.name = 'Object 2';
scene.add( object );

var object = object.clone();
object.material = object.material.clone();
object.material.color.set('#00F');
object.position.set(10, 0, 0 );
object.name = 'Object 3';
scene.add( object );



////////////////////////////////////////

var controls = new THREE.TrackballControls( camera );

controls.rotateSpeed = 3.6;
controls.zoomSpeed = 0.8;
controls.panSpeed = 1;

controls.noZoom = false;
controls.noPan = false;

controls.staticMoving = false;
controls.dynamicDampingFactor = 0.12;

controls.enabled = true;
TweenLite.ticker.addEventListener("tick", controls.update );


////////////////////////////////////////

var timeline = new TimelineLite({
  onStart: function(){
    TweenLite.ticker.removeEventListener("tick", controls.update );
    controls.enabled = false;
  },
  onComplete: function(){
    TweenLite.ticker.addEventListener("tick", controls.update );
    controls.position0.copy(camera.position);
    controls.reset();
    controls.enabled = true;
  }
});
easing = 'Expo.easeInOut';


////////////////////////////////////////


camera.reset = function(){

  var pos = { x: 0, y: 0 };
  var distance = 60;
  var speed = 1;
  
  if ( camera.parent !== scene ) {
    var pos = camera.position.clone();
    camera.parent.localToWorld(camera.position);
    scene.add(camera);
  }
  
  timeline.clear();
  timeline.to( camera.position, speed, { 
    x: pos.x, 
    y: pos.y, 
    z: distance, 
    ease: easing 
  }, 0);
  timeline.to( camera.rotation, speed, { x: 0, y: 0, z: 0, ease: easing}, 0);
  
}; 


////////////////////////////////////////

camera.getDistance = function(object) {

  var helper = new THREE.BoundingBoxHelper(object, 0xff0000);
  helper.update();

  var width = helper.scale.x,
      height = helper.scale.y;

  // Set camera distance
  var vFOV = camera.fov * Math.PI / 180,
      ratio = 2 * Math.tan( vFOV / 2 ),
      screen = ratio * camera.aspect, //( renderer.domElement.width / renderer.domElement.height ),
      size = Math.max(height,width),
      distance = (size / screen) + (helper.box.max.z / screen);

  return distance;
};


////////////////////////////////////////


camera.zoom = function(object){

  var pos = camera.position.clone();
  object.worldToLocal(camera.position);
  object.add(camera);

  var speed = 1;
  timeline.clear();

  timeline.to( camera.position, speed, {
    x: pos.x,
    y: pos.y,
    z: camera.getDistance(object),
    ease: easing
  },0);

};


////////////////////////////////////////


var startX, startY,
    $target = $(renderer.domElement),
    selected;

function mouseUp(e) {
  e = e.originalEvent || e;
  e.preventDefault();

  var x = ( e.touches ? e.touches[0].clientX : e.clientX ),
      y = ( e.touches ? e.touches[0].clientY : e.clientY ),
      diff = Math.max(Math.abs(startX - x), Math.abs(startY - y));

  if ( diff > 40 ) { return; }

  var mouse = {
    x: ( x / window.innerWidth ) * 2 - 1,
    y: - ( y / window.innerHeight ) * 2 + 1
  };

  var vector = new THREE.Vector3( mouse.x, mouse.y ).unproject( camera );
  var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
  var intersects = raycaster.intersectObject( scene, true );

  if ( intersects.length > 0 && intersects[ 0 ].object !== selected ) {
    selected = intersects[ 0 ].object;
    camera.zoom(selected);
  } else {
    selected = null;
    camera.reset(); 
  }
}

function mouseDown( e ) {
  e = e.originalEvent || e;
  startX = ( e.touches ? e.touches[0].clientX : e.clientX );
  startY = ( e.touches ? e.touches[0].clientY : e.clientY );

  $target.one('mouseup touchend', mouseUp );

  setTimeout(function(){ $target.off('mouseup.part touchend.part'); },300);
}


$target.on('mousedown touchend', mouseDown );
