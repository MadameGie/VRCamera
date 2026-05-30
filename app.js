import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas3d");
const statusBox = document.getElementById("status");

const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);

camera.position.z = 5;

const hemi = new THREE.HemisphereLight(
    0xffffff,
    0x666666,
    3
);

scene.add(hemi);

let model = null;

const loader = new GLTFLoader();

loader.load(
    "scene.glb",

    (gltf) => {

        model = gltf.scene;

        model.visible = false;

        model.scale.set(
            0.8,
            0.8,
            0.8
        );

        scene.add(model);

        statusBox.innerText =
        "Arahkan kamera ke telapak tangan";
    },

    undefined,

    (err) => {
        console.error(err);
        statusBox.innerText =
        "Gagal load scene.glb";
    }
);

const stream =
await navigator.mediaDevices.getUserMedia({
    video: {
        facingMode: {
            ideal: "environment"
        }
    },
    audio: false
});

video.srcObject = stream;

let smoothX = 0;
let smoothY = 0;
let smoothScale = 1;

const hands = new Hands({
    locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
});

hands.onResults((results) => {

    if (!model) return;

    if (
        !results.multiHandLandmarks ||
        results.multiHandLandmarks.length === 0
    ) {

        model.visible = false;
        return;
    }

    const hand =
    results.multiHandLandmarks[0];

    const palm =
    hand[9];

    const indexBase =
    hand[5];

    const pinkyBase =
    hand[17];

    const handWidth =
    Math.sqrt(
        Math.pow(
            indexBase.x - pinkyBase.x,
            2
        ) +
        Math.pow(
            indexBase.y - pinkyBase.y,
            2
        )
    );

    const targetX =
    (palm.x - 0.5) * 8;

    const targetY =
    -(palm.y - 0.5) * 4;

    smoothX +=
    (targetX - smoothX) * 0.18;

    smoothY +=
    (targetY - smoothY) * 0.18;

    const targetScale =
    Math.max(
        0.4,
        Math.min(
            2.0,
            handWidth * 8
        )
    );

    smoothScale +=
    (targetScale - smoothScale)
    * 0.15;

    model.visible = true;

    model.position.set(
        smoothX,
        smoothY,
        0
    );

    model.scale.set(
        smoothScale,
        smoothScale,
        smoothScale
    );

    const dx =
    pinkyBase.x - indexBase.x;

    const dy =
    pinkyBase.y - indexBase.y;

    model.rotation.z =
    -Math.atan2(dy, dx);
});

const mpCamera =
new Camera(video, {
    onFrame: async () => {
        await hands.send({
            image: video
        });
    },
    width: 640,
    height: 480
});

mpCamera.start();

function animate() {

    requestAnimationFrame(
        animate
    );

    renderer.render(
        scene,
        camera
    );
}

animate();

window.addEventListener(
    "resize",
    () => {

        camera.aspect =
        window.innerWidth /
        window.innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );
    }
);
