// ============================================
// CS2 Web Game - Renderer
// Three.js Scene, Camera, Lighting & Post-FX setup
// ============================================

import { CONFIG } from '../config.js';

export class Renderer {
    constructor(container) {
        this.container = container;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xA5C9EB);
        this.scene.fog = new THREE.FogExp2(0xB9D6F2, 0.0035);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            CONFIG.RENDER.FOV,
            window.innerWidth / window.innerHeight,
            CONFIG.RENDER.NEAR,
            CONFIG.RENDER.FAR
        );
        this.camera.position.set(0, CONFIG.PHYSICS.PLAYER_HEIGHT, 0);

        // WebGL Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: CONFIG.RENDER.ANTIALIAS,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.05;

        container.appendChild(this.renderer.domElement);

        this.setupLights();
        this.setupSky();

        window.addEventListener('resize', () => this.resize());
    }

    setupLights() {
        // Ambient & Hemisphere sunlight
        const hemiLight = new THREE.HemisphereLight(0xFCE8D0, 0x8899AA, 0.65);
        hemiLight.position.set(0, 50, 0);
        this.scene.add(hemiLight);

        // Main Sun directional light with shadows
        this.sunLight = new THREE.DirectionalLight(0xFFF6E5, 1.25);
        this.sunLight.position.set(80, 140, 60);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 10;
        this.sunLight.shadow.camera.far = 400;

        const d = 120;
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;
        this.sunLight.shadow.bias = -0.0004;

        this.scene.add(this.sunLight);

        // Fill sky light
        const fillLight = new THREE.DirectionalLight(0xA6C8E0, 0.35);
        fillLight.position.set(-60, 40, -50);
        this.scene.add(fillLight);
    }

    setupSky() {
        // Procedural sky dome with clouds
        const vertexShader = `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            uniform float offset;
            uniform float exponent;
            varying vec3 vWorldPosition;
            void main() {
                float h = normalize(vWorldPosition + offset).y;
                gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
            }
        `;

        const uniforms = {
            topColor: { value: new THREE.Color(0x3B88C3) },
            bottomColor: { value: new THREE.Color(0xE8F0F8) },
            offset: { value: 33 },
            exponent: { value: 0.6 }
        };

        const skyGeo = new THREE.SphereGeometry(600, 32, 15);
        const skyMat = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms,
            side: THREE.BackSide
        });

        this.skyDome = new THREE.Mesh(skyGeo, skyMat);
        this.scene.add(this.skyDome);
    }

    setSkyTheme(theme = 'dust2') {
        if (theme === 'dust2') {
            this.scene.background = new THREE.Color(0x98C3EB);
            this.scene.fog.color = new THREE.Color(0xE0D4B8);
            this.scene.fog.density = 0.0025;
            this.sunLight.color = new THREE.Color(0xFFF2D1);
        } else if (theme === 'mirage') {
            this.scene.background = new THREE.Color(0x7FB5E0);
            this.scene.fog.color = new THREE.Color(0xE4D5C7);
            this.scene.fog.density = 0.0028;
            this.sunLight.color = new THREE.Color(0xFFEDC9);
        } else if (theme === 'inferno') {
            this.scene.background = new THREE.Color(0x69A3D6);
            this.scene.fog.color = new THREE.Color(0xC6D5DE);
            this.scene.fog.density = 0.003;
            this.sunLight.color = new THREE.Color(0xFFE5B4);
        }
    }

    resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    getScene() { return this.scene; }
    getCamera() { return this.camera; }
    getRenderer() { return this.renderer; }
}

