import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

const startBtn = document.getElementById("startBtn");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas3d");

const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha:true,
    antialias:true
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    window.devicePixelRatio
);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth/window.innerHeight,
    0.1,
    100
);

camera.position.z = 5;

scene.add(
    new THREE.HemisphereLight(
        0xffffff,
        0x444444,
        3
    )
);

let model = null;

new GLTFLoader().load(
    "scene.glb",

    (gltf)=>{

        model = gltf.scene;

        model.visible = false;

        model.scale.set(
            0.8,
            0.8,
            0.8
        );

        scene.add(model);

        console.log("GLB Loaded");
    },

    undefined,

    (err)=>{
        console.error(err);
        alert("scene.glb gagal dimuat");
    }
);

let smoothX = 0;
let smoothY = 0;
let smoothScale = 1;

startBtn.addEventListener(
    "click",
    startAR
);

async function startAR(){

    startBtn.style.display = "none";

    try{

        const stream =
        await navigator.mediaDevices.getUserMedia({
            video:{
                facingMode:{
                    ideal:"environment"
                }
            },
            audio:false
        });

        video.srcObject = stream;

        await video.play();

        startHandTracking();

    }

    catch(err){

        console.error(err);

        alert(
            "Kamera gagal: " +
            err.message
        );
    }
}

function startHandTracking(){

    const hands = new Hands({
        locateFile:(file)=>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
        maxNumHands:1,
        modelComplexity:1,
        minDetectionConfidence:0.7,
        minTrackingConfidence:0.7
    });

    hands.onResults((results)=>{

        if(!model) return;

        if(
            !results.multiHandLandmarks ||
            results.multiHandLandmarks.length === 0
        ){
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
        Math.hypot(
            indexBase.x - pinkyBase.x,
            indexBase.y - pinkyBase.y
        );

        const targetX =
        (palm.x - 0.5) * 8;

        const targetY =
        -(palm.y - 0.5) * 4;

        smoothX +=
        (targetX - smoothX)
        * 0.25;

        smoothY +=
        (targetY - smoothY)
        * 0.25;

        const targetScale =
        Math.max(
            0.5,
            Math.min(
                2.5,
                handWidth * 8
            )
        );

        smoothScale +=
        (targetScale - smoothScale)
        * 0.2;

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
        -Math.atan2(
            dy,
            dx
        );
    });

    const mpCamera =
    new Camera(video,{

        onFrame:async()=>{

            await hands.send({
                image:video
            });

        },

        width:640,
        height:480

    });

    mpCamera.start();
}

function animate(){

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
    ()=>{

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
