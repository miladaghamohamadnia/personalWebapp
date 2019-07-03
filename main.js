
if ( WEBGL.isWebGLAvailable() === false ) {
    document.body.appendChild( WEBGL.getWebGLErrorMessage() );
}

THREE.Cache.enabled = true;
var stlLoader = new THREE.STLLoader()
// Colored binary STL

const stlfile = "models/object.stl"
const colorfile = "models/temps.txt"

var colormapController = {
    colorMap: "grayscale",
    MINcolor: 66.0,
    MAXcolor: 77.0
};
var colorMap = colormapController.colorMap;
var MINcolor = colormapController.MINcolor;
var MAXcolor = colormapController.MAXcolor;

var camera, stats, controls, scene, Geom, Material,Colors;
var mesh, renderer,gui1, gui2;

var gui = new dat.GUI();

p1 = new Promise( (resolve) => {

    stlLoader.load( stlfile, function ( geometry ) {
        resolve(geometry)
    });

} )


p2 = new Promise( (resolve, reject) => {

    var loader = new THREE.FileLoader();
    // var data;
    //load a text file and output the result to the console
    loader.load(
        // resource URL
        colorfile,
        // onLoad callback
        function ( data ) {
            var fahrenheit = textTotemps(data)
            resolve( fahrenheit )
        },
        // onProgress callback
        function ( xhr ) {
            console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
        },
        // onError callback
        function ( err ) {
            reject(err)
            console.error( 'An error happened' );
        }
    );

} )

p3 = new Promise( resolve => {
    p1.then( (geom) => {
        p2.then( (colors) => {
            Colors = colors;
            var Length = geom.attributes.position.array.length/9
            lut = new THREE.Lut( colorMap, Length )
            lut.setMax( colormapController.MAXcolor )
            lut.setMin( colormapController.MINcolor )
            var lutColors = []
            promises=[]
            for ( var i = 0; i < Length; i ++ ) {
                p = new Promise( r => {
                    var color = lut.getColor( colors[i] );
                    // console.log(colors[i])
                    for ( var j = 0; j < 3; j ++ ) {
                        // var color = lut.getColor( geom.attributes.position.array[9*i+3*j+2] );
                        lutColors.push(color.r)
                        lutColors.push(color.g)
                        lutColors.push(color.b)
                        geom.attributes.position.array[9*i+3*j+0] = (geom.attributes.position.array[9*i+3*j+0]-987770)/1
                        geom.attributes.position.array[9*i+3*j+1] = (geom.attributes.position.array[9*i+3*j+1]-211601)/1
                        geom.attributes.position.array[9*i+3*j+2] = (geom.attributes.position.array[9*i+3*j+2]-50)/1
                    }
                    r()
                })
                promises.push(p)
            }
            Promise.all(promises).then(()=>{
                geom.addAttribute( 'color', new THREE.Float32BufferAttribute( lutColors, 3 ) );
                resolve(geom)
            })
        
        } )
    } )

} )


function init(geom) {
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x555555 );
    // scene.fog = new THREE.FogExp2( 0xffffff, 0.00005 );
    // scene.fog = new THREE.Fog( 0xccddff, 50, 22 )
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    stats = new Stats();
    document.body.appendChild( stats.dom );
    camera = new THREE.PerspectiveCamera( 100, window.innerWidth / window.innerHeight, 10, 5000 );
    camera.position.set( 0, -1500, 1000 );
    // camera.rotation.set( 1, -0.05, 0.1 );
    // camera.lookAt(new THREE.Vector3(100,100, 10));

    // controls
    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)
    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.35;
    controls.screenSpacePanning = false;
    controls.minDistance = 10;
    controls.maxDistance = 2000;
    // controls.maxPolarAngle = Math.PI;
    // world

    var material = new THREE.MeshPhongMaterial( {
        specular: 0xffffff, 
        shininess: 20000,
        // flatShading: true,
        side: THREE.DoubleSide, 
        vertexColors: THREE.VertexColors,
        blending: THREE.MultiplyBlending
    } );
    
    Material = material;
    mesh = new THREE.Mesh( geom, material );
    scene.add( mesh );

    // lights
    // var light = new THREE.DirectionalLight( 0xffffff ,1);
    // light.position.set( 1, 1, 1 );
    // scene.add( light );
    // var light = new THREE.DirectionalLight( 0xffffff ,1 );
    // light.position.set( - 1, - 1, - 1 );
    // scene.add( light );
    var light = new THREE.AmbientLight( 0xffffff, 1 );
    scene.add( light );

    // projector = new THREE.Projector();

    // Create the floor of the scene.
    createFloor()
    //
    // GUI
    setupGui();
    window.addEventListener( 'resize', onWindowResize, false );
    // document.addEventListener( 'mousedown', onDocumentMouseDown, false );
}


// function onDocumentMouseDown( event ) {
//     event.preventDefault();
//     var vector = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
//     projector.unprojectVector( vector, camera );
//     var ray = new THREE.Ray( camera.position, vector.subSelf( camera.position ).normalize() );
//     var intersects = ray.intersectObjects( objects );
//     if ( intersects.length > 0 ) {
//         intersects[ 0 ].object.material.color.setHex( Math.random() * 0xffffff );
//         var particle = new THREE.Particle( particleMaterial );
//         particle.position = intersects[ 0 ].point;
//         particle.scale.x = particle.scale.y = 8;
//         scene.add( particle );
//     }
//     /*
//     // Parse all the faces
//     for ( var i in intersects ) {
//         intersects[ i ].face.material[ 0 ].color.setHex( Math.random() * 0xffffff | 0x80000000 );
//     }
//     */
// }
//

function createFloor() {
    var geometry = new THREE.PlaneBufferGeometry( 100000, 100000 );
    var material = new THREE.MeshToonMaterial( {color: 0x111111} );
    var plane = new THREE.Mesh( geometry, material );
    plane.position.z = -60;
    scene.add( plane );
}

function textTotemps(tempsText){
    var temperatures = []
    filtered = tempsText.split('\n').filter(v=>v!='');
    filtered.forEach((elem)=>{
        var temp_ = (parseFloat(elem.split(' ')[1]) - 273.0) * (9/5) + 32;
        temperatures.push(temp_)
    })
    var fahrenheit = temperatures.filter(function (value) {
        return !Number.isNaN(value);
    });
    return fahrenheit
}


function setupGui() {
    gui1 = gui.add( Material, 'wireframe' );
    gui2 = gui.add( colormapController, "colorMap", [ "grayscale", "rainbow", "cooltowarm", "blackbody" ] ).name( "color map" ).onChange( render );
    gui.add( colormapController, 'MINcolor', 20, 100 ).step( .1 ).name( 'Minimum color' ).onChange( render );
    gui.add( colormapController, 'MAXcolor', 40, 120 ).step( .1 ).name( 'Maximum color' ).onChange( render );

}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}
function animate() {
    requestAnimationFrame( animate );
    controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
    render();
    stats.update();
}

function render() {
    if (colormapController.colorMap !== colorMap) {
        colorMap = colormapController.colorMap;
        if ( mesh !== undefined ) {
            createNewScene(Geom)
        }
    }

    if (colormapController.MINcolor !== MINcolor) {
        MINcolor = colormapController.MINcolor
        if ( mesh !== undefined ) {
            createNewScene(Geom)
        }
    }

    if (colormapController.MAXcolor !== MAXcolor) {
        MAXcolor = colormapController.MAXcolor
        if ( mesh !== undefined ) {
            createNewScene(Geom)
        }
    }

    // camera.updateProjectionMatrix();
    // var vector = camera.position.clone();
    // console.log(vector)
    // var vector = camera.rotation.clone();
    // console.log(vector)

    renderer.render( scene, camera );
}

p3.then( geom => {
    Geom = geom;
    init(geom);
    animate();
} )



function createNewScene(geom) {
    mesh.geometry.dispose();
    scene.remove( mesh );
    p_update = new Promise(resolve => {
        var Length = geom.attributes.position.array.length/9
        lut = new THREE.Lut( colorMap, Length )
        lut.setMax( colormapController.MAXcolor )
        lut.setMin( colormapController.MINcolor )
        var lutColors = []
        promises=[]
        for ( var i = 0; i < Length; i ++ ) {
            p = new Promise( r => {
                var color = lut.getColor( Colors[i] );
                for ( var j = 0; j < 3; j ++ ) {
                    // var color = lut.getColor( geom.attributes.position.array[9*i+3*j+2] );
                    // console.log(Colors[i])
                    lutColors.push(color.r)
                    lutColors.push(color.g)
                    lutColors.push(color.b)
                    geom.attributes.color.array[9*i+3*j+0] = color.r
                    geom.attributes.color.array[9*i+3*j+1] = color.g
                    geom.attributes.color.array[9*i+3*j+2] = color.b
                }
                r()
            })
            promises.push(p)
        }
        Promise.all(promises).then(()=>{
            // geom.addAttribute( 'color', new THREE.Float32BufferAttribute( lutColors, 3 ) );
            resolve(geom)
        })
    })

    p_update.then(geom => {
        mesh = new THREE.Mesh( geom, Material );
        scene.add( mesh );
    })

}

