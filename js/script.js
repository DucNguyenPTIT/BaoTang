var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.focus = 100;
var renderer = new THREE.WebGLRenderer({
    antialias: true
});
var pointerControls = new THREE.PointerLockControls(camera);
var oldControl = pointerControls;
var trackballControls;
var ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
var hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
var direcLight = new THREE.DirectionalLight(0xffffff, 0.8);
var spotLight = new THREE.SpotLight(0xccff99, 1.8, 1000, Math.PI / 6, 0.25, 2);

spotLight.position.set(0, 80, 100);
spotLight.rotateX(Math.PI / 6);
direcLight.position.set(-500, 5000, 2000);
direcLight.castShadow = true;
direcLight.shadow.mapSize.set(2048, 2048);

scene.add(ambientLight);
scene.add(direcLight);
scene.add(spotLight);

var raycaster = new THREE.Raycaster();
var moveUp = false;
var moveDown = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;

const GRAVITY = 9.8;
const MASS = 100;
const HEIGHT = 35;
const AXIS_HELPER = new THREE.AxisHelper(1000);

var targetObj;
var selectedObj;
var MUSEUM;
var CUBE;
var SPHERE;
var OCEAN;
var SKYBOX;
var GUI;
var instruction = document.getElementById('instruction');
var action = document.getElementById('action');
var interactGroup = new THREE.Group();

scene.add(AXIS_HELPER);

var prevTime = performance.now();
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
var rayDirect = new THREE.Vector3();
var rayOrigin = new THREE.Vector3();

renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.setClearColor(new THREE.Color(0xf2f2f2), 1);
document.body.appendChild(renderer.domElement);

// LOAD MODEL
var fbxLoader = new THREE.FBXLoader();
fbxLoader.load('../assets/models/baotang/baotangbiendaomoi.fbx', (object) => {
    MUSEUM = object;
    MUSEUM.position.set(-40, 80, -50);
    MUSEUM.castShadow = true;
    MUSEUM.receiveShadow = true;

    MUSEUM.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    scene.add(MUSEUM);

    // LOAD GEOMETRY
    fbxLoader.load('../assets/models/geometry/cube.fbx', (object) => {
        CUBE = object;
        CUBE.position.set(0, 30, 0);
        CUBE.castShadow = true;
        CUBE.receiveShadow = true;

        CUBE.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material = new THREE.MeshPhongMaterial({
                    shininess: 100
                });
                loadTexture('DisplacedGround', child);
            }
        });

        scene.add(CUBE);

        fbxLoader.load('../assets/models/geometry/sphere.fbx', (object) => {
            SPHERE = object;
            SPHERE.position.set(120, 30, 0);
            SPHERE.castShadow = true;
            SPHERE.receiveShadow = true;

            SPHERE.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.material = new THREE.MeshPhongMaterial({
                        shininess: 100
                    });
                    loadTexture('TireTrack', child);
                }
            });

            scene.add(SPHERE);
        });
    });
});
//


//  LOAD GEOMETRY
var textureColor = new THREE.TextureLoader().load('../assets/models/textures/TireTrack/color.jpg');
var textureDisplace = new THREE.TextureLoader().load('../assets/models/textures/TireTrack/displace.tif');
var textureBump = new THREE.TextureLoader().load('../assets/models/textures/TireTrack/normal.jpg');
var video = document.getElementById('video');

var box = new THREE.Mesh(new THREE.BoxBufferGeometry(30, 30, 30), new THREE.MeshLambertMaterial({
    map: textureColor,
    displacementMap: textureDisplace,
    normalMap: textureBump
}));
box.material.color.setHex(0x00ff00);
box.position.set(-60, 30, 0);
box.castShadow = true;
box.receiveShadow = true;
box.userData = {
    tag: 'box',
    name: 'Khối hộp',
    texture: 'TireTrack'
};
// scene.add(box);

var sphere = new THREE.Mesh(new THREE.SphereBufferGeometry(30, 25, 25), new THREE.MeshPhongMaterial({
    shininess: 100,
    map: textureColor,
    displacementMap: textureDisplace,
    normalMap: textureBump
}));
sphere.position.set(60, 30, 0);
sphere.castShadow = true;
sphere.receiveShadow = true;
sphere.userData = {
    tag: 'sphere',
    name: 'Khối cầu',
    texture: 'TireTrack'
};

var videoTex = new THREE.VideoTexture(video);
videoTex.minFilter = THREE.LinearFilter;
videoTex.magFilter = THREE.LinearFilter;
videoTex.format = THREE.RGBFormat;
var plane = new THREE.Mesh(new THREE.PlaneGeometry(80, 60), new THREE.MeshBasicMaterial({
    map: videoTex
}));
plane.position.set(0, 30, -50);
plane.userData = {
    tag: 'plane',
    name: 'Mặt phẳng'
};

interactGroup.add(box);
interactGroup.add(sphere);
interactGroup.add(plane);
scene.add(interactGroup);
//

// LOAD TEXTURES
function loadTexture(textureName, object) {
    var textureColor = new THREE.TextureLoader().load('../assets/models/textures/' + textureName + '/color.jpg');
    var textureDisplace = new THREE.TextureLoader().load('../assets/models/textures/' + textureName + '/displace.tif');
    var textureNormal = new THREE.TextureLoader().load('../assets/models/textures/' + textureName + '/normal.jpg');

    object.material.map = textureColor;
    object.material.displacementMap = textureDisplace;
    object.material.normalMap = textureNormal;
    object.userData.texture = textureName;
}

// GUI
function generateUI(targetObj) {
    var params = {
        tag: targetObj.userData.tag,
        name: targetObj.userData.name,
        color: targetObj.material.color,
        material: targetObj.material.type,
        shininess: targetObj.material.shininess,
        texture: targetObj.userData.texture
    };

    GUI = new dat.GUI();
    var shininess;
    var tagCtrl = GUI.add(params, 'tag');
    tagCtrl.domElement.style.pointerEvents = 'none';

    var nameCtrl = GUI.add(params, 'name');
    nameCtrl.domElement.style.pointerEvents = 'none';

    var colorCtrl = GUI.addColor(params, 'color');
    var matCtrl = GUI.add(params, 'material', ['MeshBasicMaterial', 'MeshPhongMaterial', 'MeshLambertMaterial']).onChange((value) => {
        switch (value) {
            case 'MeshBasicMaterial':
                targetObj.material = new THREE.MeshBasicMaterial();
                loadTexture(targetObj.userData.texture, targetObj);

                if (shininess) {
                    GUI.remove(shininess);
                }

                break;

            case 'MeshPhongMaterial':
                targetObj.material = new THREE.MeshPhongMaterial();
                loadTexture(targetObj.userData.texture, targetObj);
                shininess = GUI.add(params, 'shininess', 0, 100, 1);
                break;

            case 'MeshLambertMaterial':
                targetObj.material = new THREE.MeshLambertMaterial();
                loadTexture(targetObj.userData.texture, targetObj);

                if (shininess) {
                    GUI.remove(shininess);
                }

                break;
        }
    });

    if (targetObj.material.type === 'MeshPhongMaterial') {
        shininess = GUI.add(params, 'shininess', 0, 100, 1).onChange((value) => {
            targetObj.material.shininess = value;
        });
    }

    var texCtrl = GUI.add(params, 'texture', ['DisplacedGround', 'Marble', 'TireTrack']).onChange((value) => {
        loadTexture(value, targetObj);
    });
}
//


// FUNCTIONS
function init() {
    scene.add(pointerControls.getObject());

    var cubeMaterials = [
        new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load('/assets/models/textures/Skybox/beach_ft.JPG'),
            side: THREE.DoubleSide
        }),
        new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load('/assets/models/textures/Skybox/beach_bk.JPG'),
            side: THREE.DoubleSide
        }),
        new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load('/assets/models/textures/Skybox/beach_up.JPG'),
            side: THREE.DoubleSide
        }),
        new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load('/assets/models/textures/Skybox/beach_dn.JPG'),
            side: THREE.DoubleSide
        }),
        new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load('/assets/models/textures/Skybox/beach_rt.JPG'),
            side: THREE.DoubleSide
        }),
        new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load('/assets/models/textures/Skybox/beach_lf.JPG'),
            side: THREE.DoubleSide
        })
    ];

    // var skyMaterial = new THREE.MultiMaterial(cubeMaterials);
    SKYBOX = new THREE.Mesh(new THREE.CubeGeometry(10000, 10000, 10000), cubeMaterials);
    scene.add(SKYBOX);

    OCEAN = new THREE.Water(new THREE.PlaneBufferGeometry(10000, 10000), {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new THREE.TextureLoader().load('../assets/models/textures/Water/waternormals.jpg', (waterTexture) => {
            waterTexture.wrapS = waterTexture.wrapT = THREE.RepeatWrapping;
        }),
        alpha: 1.0,
        sunDirection: direcLight.position.clone().normalize(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f, //0x001e0f
        distortionScale: 3.7,
        fog: scene.fog !== undefined
    });
    OCEAN.rotation.x = -Math.PI / 2;
    OCEAN.position.y = -70;
    scene.add(OCEAN);

    var sky = new THREE.Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);

    var uniforms = sky.material.uniforms;

    uniforms.turbidity.value = 10;
    uniforms.rayleigh.value = 2;
    uniforms.luminance.value = 1;
    uniforms.mieCoefficient.value = 0.005;
    uniforms.mieDirectionalG.value = 0.8;

    var cubeCamera = new THREE.CubeCamera(1, 10000, 256);
    cubeCamera.renderTarget.texture.minFilter = THREE.LinearMipMapLinearFilter;

    sky.material.uniforms.sunPosition.value = direcLight.position.copy(direcLight.position);
    OCEAN.material.uniforms.sunDirection.value.copy(direcLight.position).normalize();
    cubeCamera.update(renderer, scene);

    var onKeyDown = (event) => {
        switch (event.keyCode) {
            case 87:
                moveUp = true;
                break;

            case 65:
                moveLeft = true;
                break;

            case 83:
                moveDown = true;
                break;

            case 68:
                moveRight = true;
                break;

            case 32:
                if (canJump) {
                    velocity.y += 350;
                }
                canJump = false;
                break;

            case 69:
                if (targetObj) {
                    generateUI(targetObj);
                    setControl(targetObj);
                }
                break;
        }
    };

    var onKeyUp = (event) => {
        switch (event.keyCode) {
            case 87:
                moveUp = false;
                break;

            case 65:
                moveLeft = false;
                break;

            case 83:
                moveDown = false;
                break;

            case 68:
                moveRight = false;
                break;
        }
    };

    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    document.addEventListener('click', () => {
        if (pointerControls) {
            camera.position.set(0, 0, 0);
            pointerControls.getObject().position.y = HEIGHT;
            pointerControls.lock();
        }
    });
}

function setControl(targetObj) {
    var pos = pointerControls.getObject().position;
    pointerControls.unlock();
    pointerControls = null;

    // tween camera to before object
    var camPosition = {
        x: 0,
        y: 0,
        z: targetObj.position.z + 50
    };
    camera.lookAt(targetObj.position);
    var tween = new TWEEN.Tween(camera.position);
    tween.to(camPosition, 2000);
    tween.start();

    // set control
    // trackballControls = new THREE.TrackballControls(camera);
    // trackballControls.rotateSpeed = 1.0;
    // trackballControls.zoomSpeed = 1.2;
    // trackballControls.panSpeed = 0.8;
    // trackballControls.noZoom = false;
    // trackballControls.noPan = false;
    // trackballControls.staticMoving = true;
    // trackballControls.dynamicDampingFactor = 0.3;
    // trackballControls.keys = [65, 83, 68];
    // trackballControls.addEventListener('change', render);
}

function rotateObj(targetObj) {
    if (targetObj.geometry.type != 'PlaneGeometry') {
        targetObj.rotation.y += 0.01;
    }
}

function animate() {
    requestAnimationFrame(animate);

    OCEAN.material.uniforms.time.value += 1.0 / 60.0;

    if (targetObj) {
        rotateObj(targetObj);

        if (GUI && GUI.closed) {
            GUI.destroy();
            targetObj.rotation.y = 0;
            targetObj = null;
            GUI = null;

            pointerControls = oldControl;
            // trackballControls = null;
        }
    }

    if (trackballControls) {
        trackballControls.update();
    }

    if (pointerControls && pointerControls.isLocked) {
        raycaster.set(camera.getWorldPosition(rayOrigin), camera.getWorldDirection(rayDirect));
        raycaster.near = 0;
        raycaster.far = 20;

        var intersectObjects = raycaster.intersectObjects(interactGroup.children);

        if (intersectObjects.length != 0) {
            for (var i = 0; i < intersectObjects.length; i++) {
                targetObj = intersectObjects[i].object;
                instruction.setAttribute('style', '');
                action.innerHTML = 'xem ' + targetObj.userData.name;
            }
        } else {
            targetObj = null;
            instruction.setAttribute('style', 'display: none');
        }

        var time = performance.now();
        var delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10 * delta;
        velocity.z -= velocity.z * 10 * delta;
        velocity.y -= GRAVITY * MASS * delta;

        direction.z = Number(moveUp) - Number(moveDown);
        direction.x = Number(moveLeft) - Number(moveRight);
        direction.normalize();

        if (moveUp || moveDown) {
            velocity.z -= direction.z * 800 * delta;
        }
        if (moveLeft || moveRight) {
            velocity.x -= direction.x * 800 * delta;
        }

        pointerControls.getObject().translateX(velocity.x * delta);
        pointerControls.getObject().translateZ(velocity.z * delta);
        pointerControls.getObject().translateY(velocity.y * delta);

        if (pointerControls.getObject().position.y < HEIGHT) {
            velocity.y = 0;
            pointerControls.getObject().position.y = HEIGHT;

            canJump = true;
        }

        prevTime = time;
    }

    render();
}

function render() {
    renderer.render(scene, camera);
    TWEEN.update();
}
//


init();
animate();