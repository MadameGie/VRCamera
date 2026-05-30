window.addEventListener("load", () => {

const btn = document.getElementById("startBtn");
const video = document.getElementById("cameraFeed");

const handAnchor = document.getElementById("handAnchor");

let camera;

// sembunyikan dulu
handAnchor.object3D.visible = false;

btn.addEventListener("click", async () => {

    try {

        // 📷 kamera belakang
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
            audio: false
        });

        video.srcObject = stream;

        btn.style.display = "none";

        const scene = document.querySelector("a-scene");
        if (scene.enterVR) scene.enterVR();

        startTracking();

    } catch (err) {
        alert("Kamera error: " + err.message);
    }
});

function startTracking() {

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

    hands.onResults(onHands);

    camera = new Camera(video, {
        onFrame: async () => {
            await hands.send({ image: video });
        },
        width: 640,
        height: 480
    });

    camera.start();
}

// 📍 tracking utama
function onHands(results) {

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        handAnchor.object3D.visible = false;
        return;
    }

    const hand = results.multiHandLandmarks[0];

    // ✋ telapak tangan (wrist + palm center)
    const palm = hand[9];

    // convert ke world space A-Frame
    const x = (palm.x - 0.5) * 4;
    const y = -(palm.y - 0.5) * 4;
    const z = -2;

    // tampilkan GLB
    handAnchor.object3D.visible = true;

    // 🔥 NEMPEL KE TELAPAK (INI KUNCI)
    handAnchor.object3D.position.set(x, y, z);
}

});