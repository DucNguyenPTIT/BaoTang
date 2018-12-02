THREE.Cache.enabled = true;
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
var renderer = new THREE.WebGLRenderer({
    antialias: true
});
var pointerControls = new THREE.PointerLockControls(camera);
var oldControl = pointerControls;
var ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
var hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
var direcLight = new THREE.DirectionalLight(0xffffff, 0.8);

var POINTLIGHT = new THREE.PointLight(0xccff99, 1, 1000, 2);
var DIRECTLIGHT = new THREE.DirectionalLight(0xccff99, 1);
var SPOTLIGHT = new THREE.SpotLight(new THREE.Color(204, 255, 153), 1, 200, Math.PI / 6, 0.05, 2);

SPOTLIGHT.position.set(0, 80, 0);
SPOTLIGHT.castShadow = true;
SPOTLIGHT.shadow.camera.near = 10;
SPOTLIGHT.shadow.camera.far = 1000;

DIRECTLIGHT.position.set(0, 80, 0);
DIRECTLIGHT.castShadow = true;
DIRECTLIGHT.shadow.camera.near = 10;
DIRECTLIGHT.shadow.camera.far = 1000;

POINTLIGHT.position.set(0, 80, 0);
POINTLIGHT.castShadow = true;
POINTLIGHT.shadow.camera.near = 10;
POINTLIGHT.shadow.camera.far = 1000;

direcLight.position.set(-500, 5000, 2000);
direcLight.castShadow = true;
direcLight.shadow.mapSize.set(2048, 2048);

scene.add(ambientLight);
scene.add(direcLight);
scene.add(SPOTLIGHT);

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

var TARGETOBJ;
var SELECTEDLIGHT = SPOTLIGHT;
var SELECTEDOBJ;
var MUSEUM;
var CUBE;
var SPHERE;
var OCEAN;
var SKYBOX;
var GUI;
var FLOOR;
var instruction = document.getElementById('object');
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
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// LOAD MODEL
var count = 0;
var fbxLoader = new THREE.FBXLoader();
fbxLoader.load('../assets/models/baotang.fbx', (object) => {
    MUSEUM = object;
    MUSEUM.position.set(-40, 80, -40);
    MUSEUM.castShadow = true;
    MUSEUM.receiveShadow = true;

    var count = 0;
    MUSEUM.traverse((child) => {
        if (child.isMesh && count == 58) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material = new MeshPhongMaterial({
                shininess: 100
            });

            child.userData = {
                tag: 'museum',
                name: 'museum ' + count,
                texture: null,
                parentPosition: child.parent.position
            };

            FLOOR = child;
        }
    });

    scene.add(MUSEUM);
});

count = 0;
fbxLoader.load('../assets/models/sphere.fbx', (object) => {
    SPHERE = object;
    SPHERE.position.set(0, 30, 0);
    SPHERE.castShadow = true;
    SPHERE.receiveShadow = true;

    SPHERE.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshPhongMaterial({
                shininess: 100
            });
            loadTexture('TireTrack', child);

            child.userData = {
                tag: 'sphere',
                name: 'Sphere ' + count++,
                texture: 'TireTrack',
                parentPosition: child.parent.position
            };

            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    THREE.Cache.add('sphere', SPHERE);
});

count = 0;
fbxLoader.load('../assets/models/cube.fbx', (object) => {
    CUBE = object;
    CUBE.position.set(0, 30, 0);
    CUBE.castShadow = true;
    CUBE.receiveShadow = true;


    CUBE.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshPhongMaterial({
                shininess: 100
            });
            loadTexture('StoneBrick', child);

            child.userData = {
                tag: 'cube',
                name: 'Cube ' + count++,
                texture: 'StoneBrick',
                parentPosition: child.parent.position
            };

            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    THREE.Cache.add('cube', CUBE);
});
//

//  LOAD GEOMETRY
var video = document.getElementById('video');
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

interactGroup.add(plane);
scene.add(interactGroup);
//

// LOAD TEXTURES
function loadTexture(textureName, object) {
    var textureLoader = new THREE.TextureLoader();

    if (THREE.Cache.enabled) {
        var textureColor = THREE.Cache.get(textureName + 'Color');
        var textureDisplace = THREE.Cache.get(textureName + 'Displace');
        var textureNormal = THREE.Cache.get(textureName + 'Normal');

        if (textureColor) {
            object.material.map = textureColor;
        } else {
            textureLoader.load('../assets/models/textures/' + textureName + '/color.jpg', (texture) => {
                THREE.Cache.add(textureName + 'Color', texture);
                object.material.map = texture;
            });
        }

        if (textureDisplace) {
            object.material.displacementMap = textureDisplace;
            object.material.displacementScale = 0;
            object.material.displacementBias = 0;
        } else {
            textureLoader.load('../assets/models/textures/' + textureName + '/displace.jpg', (texture) => {
                THREE.Cache.add(textureName + 'Displace', texture);
                object.material.displacementMap = texture;
                object.material.displacementScale = 0;
                object.material.displacementBias = 0;
            });
        }

        if (textureNormal) {
            object.material.normalMap = textureNormal;
        } else {
            textureLoader.load('../assets/models/textures/' + textureName + '/normal.jpg', (texture) => {
                THREE.Cache.add(textureName + 'Normal', texture);
                object.material.normalMap = texture;
            });
        }
    }

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

    GUI.addColor(params, 'color').onChange((value) => {
        targetObj.material.color = value;
    });

    GUI.add(params, 'material', ['MeshBasicMaterial', 'MeshPhongMaterial', 'MeshLambertMaterial']).onChange((value) => {
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

    GUI.add(params, 'texture', ['StoneBrick', 'TireTrack']).onChange((value) => {
        loadTexture(value, targetObj);
    });
}

function generateLightGUI(targetObj) {
    var params = {
        name: targetObj.type,
        color: targetObj.color,
        intensity: targetObj.intensity,
        distance: targetObj.distance, // point, spot
        decay: targetObj.decay, // point, spot
        penumbra: targetObj.penumbra, // spot
        angle: targetObj.angle, // spot
        castShadow: targetObj.castShadow,
        displayObj: null
    };

    GUI = new dat.GUI();

    var distance, decay, penumbra, angle;
    var nameCtrl = GUI.add(params, 'name');
    nameCtrl.domElement.style.pointerEvents = 'none';

    GUI.addColor(params, 'color').onChange((value) => {
        targetObj.color = value;
    });

    GUI.add(params, 'intensity', 0, 2).onChange((value) => {
        targetObj.intensity = value;
    });

    if (targetObj.type === 'SpotLight' || targetObj.type === 'PointLight') {
        if (!distance && !decay) {
            distance = GUI.add(params, 'distance', 0, 1000).onChange((value) => {
                targetObj.distance = value;
            });
            decay = GUI.add(params, 'decay', 0, 2).onChange((value) => {
                targetObj.decay = value;
            });
        }

        if (targetObj.type === 'SpotLight') {
            if (!penumbra && !angle) {
                penumbra = GUI.add(params, 'penumbra', 0, 1).onChange((value) => {
                    targetObj.penumbra = value;
                });
                angle = GUI.add(params, 'angle', 0, Math.PI / 2).onChange((value) => {
                    targetObj.angle = value;
                });
            }
        } else {
            if (penumbra && angle) {
                GUI.remove(penumbra);
                GUI.remove(angle);
                penumbra = null;
                angle = null;
            }
        }
    } else {
        if (distance && decay) {
            GUI.remove(distance);
            GUI.remove(decay);
            distance = null;
            decay = null;

            if (penumbra && angle) {
                GUI.remove(penumbra);
                GUI.remove(angle);
                penumbra = null;
                angle = null;
            }
        }
    }

    GUI.add(params, 'castShadow').onChange((value) => {
        targetObj.castShadow = value;
        render();
    });

    GUI.add(params, 'displayObj', [null, 'Cube', 'Sphere']).onChange((value) => {
        switch (value) {
            case null:
                if (SELECTEDOBJ) {
                    interactGroup.remove(SELECTEDOBJ);
                }
                break;

            case 'Cube':
                if (SPHERE) {
                    interactGroup.remove(SPHERE);
                }

                SELECTEDOBJ = THREE.Cache.get('cube');
                interactGroup.add(SELECTEDOBJ);

                break;

            case 'Sphere':
                if (CUBE) {
                    interactGroup.remove(CUBE);
                }

                SELECTEDOBJ = THREE.Cache.get('sphere');
                interactGroup.add(SELECTEDOBJ);

                break;
        }

        render();
    });
}

function generateFloorUI(floor) {
    var params = {
        material: floor.material,
        texture: floor.userData.texture
    };

    GUI = new dat.GUI();
    GUI.add(params, 'material', {
        MeshNormalMaterial: new THREE.MeshNormalMaterial(),
        MeshPhongMaterial: new THREE.MeshPhongMaterial({
            shininess: 100
        }),
        MeshLambertMaterial: new THREE.MeshLambertMaterial()
    }).onChange((value) => {
        floor.material = value;

        if (floor.userData.texture) {
            loadTexture(floor.userData.texture);
        }
    });

    GUI.add(params, 'texture', ['']);
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

            case 83: // S
                moveDown = true;
                break;

            case 68: // D
                moveRight = true;
                break;

            case 32:
                if (canJump) {
                    velocity.y += 350;
                }
                canJump = false;
                break;

            case 69: // E
                if (TARGETOBJ) {
                    SELECTEDOBJ = TARGETOBJ;
                    instruction.setAttribute('style', 'display: none');
                    GUI = null;
                    generateUI(SELECTEDOBJ);
                    setControl({
                        x: 0,
                        y: 0,
                        z: SELECTEDOBJ.userData.parentPosition.z
                    }, SELECTEDOBJ.userData.parentPosition);
                }
                break;

            case 70: // F

                break;

            case 76: // L
                if (SELECTEDLIGHT) {
                    GUI = null;
                    generateLightGUI(SELECTEDLIGHT);
                    setControl({
                        x: 0,
                        y: 0,
                        z: 60
                    }, new THREE.Vector3(0, 35, 0));
                }
                break;

            case 80: // P
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
            prevTime = performance.now();
            camera.position.set(0, 0, 0);
            pointerControls.getObject().position.y = HEIGHT;
            pointerControls.lock();
        }
    });
}

function setControl(position, lookAt) {
    pointerControls.unlock();
    pointerControls = null;

    // tween camera to before object
    var tween = new TWEEN.Tween(camera.position);
    tween.to(position, 2000);
    tween.start();
    tween.onComplete(() => {
        camera.lookAt(lookAt);
    });
}

function rotateObj(targetObj) {
    if (targetObj.type === 'Group') {
        targetObj.children[0].rotation.y += 0.01;
    } else if (targetObj.geometry.type != 'PlaneGeometry' && !targetObj.userData.name.includes('museum')) {
        targetObj.rotation.y += 0.01;
    }
}

function animate() {
    requestAnimationFrame(animate);

    OCEAN.material.uniforms.time.value += 1.0 / 60.0;

    if (TARGETOBJ || SELECTEDLIGHT || SELECTEDOBJ) {
        if (TARGETOBJ) {
            rotateObj(TARGETOBJ);
        } else if (SELECTEDOBJ) {
            rotateObj(SELECTEDOBJ);
        }

        if (GUI && GUI.closed) {
            GUI.destroy();
            GUI = null;

            if (TARGETOBJ) {
                TARGETOBJ.rotation.y = 0;
                TARGETOBJ = null;
            }

            if (SELECTEDOBJ) {
                SELECTEDOBJ.rotation.y = 0;
                SELECTEDOBJ = null;
            }

            pointerControls = oldControl;
        }
    }

    if (pointerControls && pointerControls.isLocked) {
        raycaster.set(camera.getWorldPosition(rayOrigin), camera.getWorldDirection(rayDirect));
        raycaster.near = 0;
        raycaster.far = 20;

        var intersectObjects = raycaster.intersectObjects(interactGroup.children, true);

        if (intersectObjects.length != 0) {
            for (var i = 0; i < intersectObjects.length; i++) {
                TARGETOBJ = intersectObjects[i].object;
                instruction.setAttribute('style', '');
                action.innerHTML = 'xem ' + TARGETOBJ.userData.name;
            }
        } else {
            TARGETOBJ = null;
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