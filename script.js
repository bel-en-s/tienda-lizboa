let renderer,
scene,
camera,
sphereBg,
nucleus,
tienda,
stars,
controls,
container = document.getElementById("canvas_container"),
timeout_Debounce,
noise = new SimplexNoise(),
cameraSpeed = 0,
loaderContainer = document.getElementById("loader"),
blobScale = 3;

init();
animate();

function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.01, 1000);
    camera.position.set(30, 0,  -40); 

    const directionalLight = new THREE.DirectionalLight("#ffffff", 0.5); // Reduced intensity
    directionalLight.position.set(50, 100, -40); // Higher angle for softer shadows
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;  // Shadow map size for better quality shadows
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    scene.add(directionalLight);
    
    // Slightly brighter ambient light to fill shadows without overwhelming the scene
    let ambientLight = new THREE.AmbientLight("#ffffff", 0.3); // Increased to 0.3 for better illumination
    scene.add(ambientLight);
    
    // Optional: Add a point light for subtle accent lighting
    const pointLight = new THREE.PointLight("#ffffff", 0.3, 200); // Low intensity for subtle lighting
    pointLight.position.set(0, 50, 0); // Positioned above the scene to simulate bounce lighting
    scene.add(pointLight);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // OrbitControl
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.autoRotate = false;
    controls.autoRotateSpeed = 4;
    controls.maxDistance = 1050;
    controls.minDistance = 50;
    controls.enableZoom = true;
    controls.enablePan = false;

    // Block camera rotation at camera.position.x: 49.63, y: 5.48, z: 2.62
    controls.addEventListener('change', function() {
        if (camera.position.x > 49.63) {
            camera.position.x = 49.63;
        }
        if (camera.position.y > 5.48 || camera.position.y < -5.48) {
            camera.position.y = THREE.MathUtils.clamp(camera.position.y, -5.48, 5.48);
        }
        if (camera.position.z > 2.62) {
            camera.position.z = 2.62;
        }
    });
    const loader = new THREE.TextureLoader();
    const textureSphereBg = loader.load('assets/sky.jpg');
    const texturenucleus = loader.load('');
    const textureStar = loader.load("https://i.ibb.co/ZKsdYSz/p1-g3zb2a.png");
    const texture1 = loader.load("https://i.ibb.co/F8by6wW/p2-b3gnym.png");
    const texture2 = loader.load("https://i.ibb.co/yYS2yx5/p3-ttfn70.png");
    const texture4 = loader.load("https://i.ibb.co/yWfKkHh/p4-avirap.png");

    /* GLTF Loader - Load model */
    const gltfLoader = new THREE.GLTFLoader();
    loaderContainer.style.display = 'flex'; // Show loader

    gltfLoader.load('assets/itinerante-join.glb', function (gltf) {
        tienda = gltf.scene;
        tienda.scale.set(50, 50, 50); // Adjust model size as needed
        tienda.position.set(0, -30, -100); // Place model at the center of the stars
        scene.add(tienda);
        loaderContainer.style.display = 'none'; // Hide loader
    }, undefined, function (error) {
        console.error('An error occurred while loading the model:', error);
        loaderContainer.style.display = 'none'; // Hide loader in case of error
    });

    /* Sphere Background */
    textureSphereBg.anisotropy = 16;
    let geometrySphereBg = new THREE.SphereBufferGeometry(500, 40, 40); // Make the sphere large enough to contain the model
    let materialSphereBg = new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
        map: textureSphereBg,
    });
    sphereBg = new THREE.Mesh(geometrySphereBg, materialSphereBg);
    scene.add(sphereBg);

    /* Moving Stars */
    let starsGeometry = new THREE.Geometry();
    for (let i = 0; i < 50; i++) {
        let particleStar = randomPointSphere(150);

        particleStar.velocity = THREE.MathUtils.randInt(50, 200);
        particleStar.startX = particleStar.x;
        particleStar.startY = particleStar.y;
        particleStar.startZ = particleStar.z;

        starsGeometry.vertices.push(particleStar);
    }
    let starsMaterial = new THREE.PointsMaterial({
        size: 5,
        color: "#ffffff",
        transparent: true,
        opacity: 0.8,
        map: textureStar,
        blending: THREE.AdditiveBlending,
    });
    starsMaterial.depthWrite = false;
    stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    /* Fixed Stars */
    function createStars(texture, size, total) {
        let pointGeometry = new THREE.Geometry();
        let pointMaterial = new THREE.PointsMaterial({
            size: size,
            map: texture,
            blending: THREE.AdditiveBlending,
        });

        for (let i = 0; i < total; i++) {
            let radius = THREE.MathUtils.randInt(149, 70);
            let particles = randomPointSphere(radius);
            pointGeometry.vertices.push(particles);
        }
        return new THREE.Points(pointGeometry, pointMaterial);
    }
    scene.add(createStars(texture1, 15, 20));
    scene.add(createStars(texture2, 5, 5));
    scene.add(createStars(texture4, 7, 5));

    /* Random point generator for stars */
    function randomPointSphere(radius) {
        let theta = 2 * Math.PI * Math.random();
        let phi = Math.acos(2 * Math.random() - 1);
        let dx = 0 + (radius * Math.sin(phi) * Math.cos(theta));
        let dy = 0 + (radius * Math.sin(phi) * Math.sin(theta));
        let dz = 0 + (radius * Math.cos(phi));
        return new THREE.Vector3(dx, dy, dz);
    }
}

function animate() {
    // Stars animation
    stars.geometry.vertices.forEach(function (v) {
        v.x += (0 - v.x) / v.velocity;
        v.y += (0 - v.y) / v.velocity;
        v.z += (0 - v.z) / v.velocity;

        v.velocity -= 0.3;

        // Ensure stars move towards the center (where the model is placed)
        if (v.x <= 1 && v.x >= -1 && v.z <= 1 && v.z >= -1 && v.y <= 1 && v.y >= -1) {
            v.x = v.startX;
            v.y = v.startY;
            v.z = v.startZ;
            v.velocity = THREE.MathUtils.randInt(50, 300);
        }
    });

    // Sphere Background Animation (optional, can be enabled)
    // sphereBg.rotation.x += 0.0002;
    // sphereBg.rotation.y += 0.0002;
    // sphereBg.rotation.z += 0.0002;

    controls.update();
    stars.geometry.verticesNeedUpdate = true;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
    console.log(`camera.position.x: ${camera.position.x.toFixed(2)}, y: ${camera.position.y.toFixed(2)}, z: ${camera.position.z.toFixed(2)}`);
}

/* Resize */
window.addEventListener("resize", () => {
    clearTimeout(timeout_Debounce);
    timeout_Debounce = setTimeout(onWindowResize, 80);
});
function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

/* Fullscreen button */
let fullscreen;
let fsEnter = document.getElementById('fullscr');
fsEnter.addEventListener('click', function (e) {
    e.preventDefault();
    if (!fullscreen) {
        fullscreen = true;
        document.documentElement.requestFullscreen();
        fsEnter.innerHTML = "Exit Fullscreen";
    } else {
        fullscreen = false;
        document.exitFullscreen();
        fsEnter.innerHTML = "Go Fullscreen";
    }
});
