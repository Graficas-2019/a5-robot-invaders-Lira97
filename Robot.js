var renderer = null, 
scene = null,raycaster , 
camera = null,
root = null,
robot_idle = null,
robot_attack = null,
flamingo = null,
stork = null,
group = null,
orbitControls = null;
var game = false;
var mouse = new THREE.Vector2(), INTERSECTED, CLICKED;
var counter = 0;
var actualTime = 0;
var highScore = 0;
var animator = null,
duration1 = 1, 
loopAnimation = false;
var robot_mixer = {};
var deadAnimator;
var morphs = [];
var dancers = [];
var robot_mixers = [];
var animationsFromFBX = [];
var score = 0;
var duration = 20000; // ms
var currentTime = Date.now();
var max = 100;
var min =-100;
var MAXRobots = 15;
var animation = "idle";

function initAnimations() 
{
    animator = new KF.KeyFrameAnimator;
    animator.init({ 
        interps:
            [
                { 
                    keys:[0, .30, .60, 1], 
                    values:[
                            { x: 0, y : 0, z : 0 },
                            { x:-Math.PI/6, y : Math.PI/7, z : 0 },
                            { x:-Math.PI/6 * 2, y : Math.PI/7 *2, z : 0},
                            { x:-Math.PI/6 * 3, y : Math.PI/7 *3, z : 0 },
                            ],
                },
            ],
        loop: loopAnimation,
        duration1:duration,
    });    

}

function playAnimations()
{
    animator.start();
}

function startGame()
{

    if(highScore<score)
    {
         highScore = score;
    }
        
    document.getElementById("highScore").innerHTML = "best score: " +highScore;
    gameMinutes = 0
    gameStarted = Date.now();
    actualTime = Date.now();
    actualTime2 = Date.now();
    score = 0;
    names = 0;
    robotsSpawned = 0;
    document.getElementById("time").innerHTML = 60+" s";
    document.getElementById("score").innerHTML = "score: " +score;
    document.getElementById("startButton").style.display="none";
    document.getElementById("startButton").disabled = true;
    

    game = true;
    
}
function changeAnimation(animation_text)
{
    animation = animation_text;

    if(animation =="dead")
    {
        createDeadAnimation();
    }
    else
    {
        robot_idle.rotation.x = 0;
    }
}

function createDeadAnimation()
{

}

function loadFBX()
{
    mixer = new THREE.AnimationMixer( scene );

    var loader = new THREE.FBXLoader();
    loader.load( 'models/Robot/robot_walk.fbx', function ( object ) 
    {
        object.mixer = new THREE.AnimationMixer( scene );
        var action = object.mixer.clipAction( object.animations[ 0 ], object );
        object.scale.set(0.02, 0.02, 0.02);
        object.position.set(Math.random() * (max - min) + min, -100, -300);
        action.play();
        object.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        } );
        dancer = object;
        dancers.push(dancer);
        scene.add( object );
        createDeadAnimation();

    } );
}
function clone (i)
{
    var newDancer = cloneFbx(dancer);
    newDancer.position.set(Math.random() * (max - min) + min, -4, -100);        
    newDancer.mixer =  new THREE.AnimationMixer( scene );
    var action = newDancer.mixer.clipAction( newDancer.animations[ 0 ], newDancer );
    action.play();
    newDancer.name = i;
    newDancer.living = 1;
    newDancer.dead = 0;
    dancers.push(newDancer);
    scene.add(newDancer);
}

function animate() {

    var now = Date.now();
    var deltat = now - currentTime;
    var finish = now - gameStarted;
    currentTime = now;
   
    var seconds = (now - actualTime)/1000


    if (seconds >= 1.5 )
    {
        if ( counter < MAXRobots) 
        {
                counter += 1;
                clone(counter);
                actualTime = now; 
                console.log(dancers.length)   
        }
    }

    if ( dancers.length > 0) 
    {
        for(dancer_i of dancers)
        {
            if(dancer_i.living==1)
            {
                dancer_i.lookAt(camera.position);
                dancer_i.translateZ(.1);
                dancer_i.position.y = -4 ;   
                dancer_i.mixer.update( ( deltat ) * 0.001 );        

            } 
            else if (dancer_i.living==0) 
            {
                var seconds2 = (now - dancer_i.dead)/1000
                if (seconds2 >= 1 )
                {
                    score ++;
                    document.getElementById("score").innerHTML = "score: " +score;
                    dancer_i.position.set(Math.random() * (max - min) + min, -4, -100);
                    dancer_i.rotation.set(0,0,0);  
                    dancer_i.mixer.update( ( deltat ) * 0.001 ); 
                    dancer_i.living=1; 
                }
                
            }
            if(dancer_i.position.z >= camera.position.z-5)
            {  
                    score --;
                    dancer_i.position.set(Math.random() * 100 - 10, -4, -100); 
                    dancer_i.mixer.update( ( deltat ) * 0.001 ); 
                    document.getElementById("score").innerHTML = "score: " +score;
                
            }
        }
    
    }
    if(finish>1000)
    {
        gameStarted = now;
        gameMinutes+=1;
        document.getElementById("time").innerHTML = 60-gameMinutes+ " s";
        if(gameMinutes==60)
        {
            document.getElementById("startButton").style.display="block";
            document.getElementById("startButton").disabled = false;
            game=false;
            for(dancer_i of dancers)
            {
                scene.remove(dancer_i); 
                
            }
            dancers.splice(1, dancers.length-1)
            counter = 0;
            
        }
    }
    
    if(animation =="dead")
    {
        KF.update();
    }
}
function run() 
{
    requestAnimationFrame(function() { run(); });
    
        // Render the scene
        renderer.render( scene, camera );

        if(game)
        {
            animate();
            KF.update();


        }
}

function setLightColor(light, r, g, b)
{
    r /= 255;
    g /= 255;
    b /= 255;
    
    light.color.setRGB(r, g, b);
}

var directionalLight = null;
var spotLight = null;
var ambientLight = null;
var mapUrl = "images/checker_large.gif";

var SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 2048;

function createScene(canvas) {
    
    // Create the Three.js renderer and attach it to our canvas
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );

    // Set the viewport size
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Turn on shadows
    renderer.shadowMap.enabled = true;
    // Options are THREE.BasicShadowMap, THREE.PCFShadowMap, PCFSoftShadowMap
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Create a new Three.js scene
    scene = new THREE.Scene();

    // Add  a camera so we can view the scene
    camera = new THREE.PerspectiveCamera( 45, canvas.width / canvas.height, 1, 4000 );
    // camera.position.set(0, 150, 180);
    camera.position.set(0, 3, 95);

    camera.rotation.set(0,0,0);
    scene.add(camera);

        
    // Create a group to hold all the objects
    root = new THREE.Object3D;
    
    spotLight = new THREE.SpotLight (0xffffff);
    spotLight.position.set(-30, 8, -10);
    spotLight.target.position.set(-2, 0, -2);
    root.add(spotLight);

    spotLight.castShadow = true;

    spotLight.shadow.camera.near = 1;
    spotLight.shadow.camera.far = 200;
    spotLight.shadow.camera.fov = 45;
    
    spotLight.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    spotLight.shadow.mapSize.height = SHADOW_MAP_HEIGHT;

    ambientLight = new THREE.AmbientLight ( 0x888888 );
    root.add(ambientLight);

    loadFBX();    

    // Create a group to hold the objects
    group = new THREE.Object3D;
    root.add(group);

    // Create a texture map
    var map = new THREE.TextureLoader().load(mapUrl);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(8, 8);

    var color = 0xffffff;

    // Put in a ground plane to show off the lighting
    geometry = new THREE.PlaneGeometry(200, 200, 50, 50);
    var mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:color, map:map, side:THREE.DoubleSide}));

    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -4.02;
    
    // Add the mesh to our group
    group.add( mesh );
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    // Now add the group to our scene
    scene.add( root );

    raycaster = new THREE.Raycaster();
        
    // document.addEventListener( 'mousemove', onDocumentMouseMove );
    document.addEventListener('mousedown', onDocumentMouseDown);
    
    window.addEventListener( 'resize', onWindowResize);
    initAnimations();
}

function onWindowResize() 
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}
function onDocumentMouseDown(event)
{
    event.preventDefault();

    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera( mouse, camera );

    var intersects = raycaster.intersectObjects( dancers, true );

    if ( intersects.length > 0 ) 
    {
        CLICKED = intersects[ 0 ].object;
        if(!animator.running)
        {
            for(var i = 0; i<= animator.interps.length -1; i++)
            {
                animator.interps[i].target = dancers[CLICKED.parent.name].rotation;
                dancers[CLICKED.parent.name].living = 0;
                dancers[CLICKED.parent.name].dead = Date.now();
            
            }
            
            playAnimations();
        }
    } 
    else 
    {
        if ( CLICKED ) 
            CLICKED.material.emissive.setHex( CLICKED.currentHex );

        CLICKED = null;
    }
}
