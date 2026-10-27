// ============================================
// CS2 Web Game - Inferno Map (de_inferno)
// Detailed layout: Banana, B Site (Fountain), Mid, A Site (Pit, Apps, Arch)
// ============================================

import { TextureGenerator } from '../engine/Textures.js';

export class InfernoMap {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;
        this.colliders = [];
        this.interactiveObjects = [];
        this.name = 'de_inferno';
        this.callout = 'Inferno';

        this.ctSpawns = [
            new THREE.Vector3(0, 0, -45),
            new THREE.Vector3(3, 0, -45),
            new THREE.Vector3(-3, 0, -45),
            new THREE.Vector3(6, 0, -48),
            new THREE.Vector3(-6, 0, -48)
        ];

        this.tSpawns = [
            new THREE.Vector3(0, 0, 80),
            new THREE.Vector3(4, 0, 80),
            new THREE.Vector3(-4, 0, 80),
            new THREE.Vector3(0, 0, 83),
            new THREE.Vector3(4, 0, 83)
        ];

        this.bombSites = {
            A: { center: new THREE.Vector3(35, 0, -20), radius: 6 },
            B: { center: new THREE.Vector3(-42, 0, -25), radius: 6 }
        };

        this.waypoints = [
            // T side & Banana to B
            { id: 't_spawn', pos: new THREE.Vector3(0, 0, 80), connections: ['t_ramp', 'second_mid'] },
            { id: 't_ramp', pos: new THREE.Vector3(-25, 0, 70), connections: ['t_spawn', 'banana_bottom'] },
            { id: 'banana_bottom', pos: new THREE.Vector3(-35, 0, 45), connections: ['t_ramp', 'banana_car', 'logs'] },
            { id: 'logs', pos: new THREE.Vector3(-45, 0, 35), connections: ['banana_bottom', 'banana_car'] },
            { id: 'banana_car', pos: new THREE.Vector3(-38, 0, 20), connections: ['banana_bottom', 'sandbags', 'half_wall'] },
            { id: 'sandbags', pos: new THREE.Vector3(-46, 0, 5), connections: ['banana_car', 'half_wall', 'b_site'] },
            { id: 'half_wall', pos: new THREE.Vector3(-34, 0, 5), connections: ['banana_car', 'sandbags', 'b_site'] },
            { id: 'b_site', pos: new THREE.Vector3(-42, 0, -25), connections: ['half_wall', 'sandbags', 'fountain', 'coffins', 'ruins'] },
            { id: 'fountain', pos: new THREE.Vector3(-42, 0, -22), connections: ['b_site', 'new_box'] },
            { id: 'new_box', pos: new THREE.Vector3(-50, 0, -30), connections: ['fountain', 'b_site'] },
            { id: 'coffins', pos: new THREE.Vector3(-32, 0, -32), connections: ['b_site', 'construction'] },
            { id: 'construction', pos: new THREE.Vector3(-24, 0, -40), connections: ['coffins', 'ct_spawn'] },
            { id: 'ruins', pos: new THREE.Vector3(-35, 0, -45), connections: ['b_site', 'ct_spawn'] },

            // Mid & Apartments to A
            { id: 'second_mid', pos: new THREE.Vector3(10, 0, 60), connections: ['t_spawn', 'mexico', 'top_mid'] },
            { id: 'mexico', pos: new THREE.Vector3(-5, -1, 35), connections: ['second_mid', 'top_mid'] },
            { id: 'top_mid', pos: new THREE.Vector3(12, 0, 30), connections: ['second_mid', 'mexico', 'boiler', 'short_a', 'long_a'] },
            { id: 'boiler', pos: new THREE.Vector3(22, 1, 15), connections: ['top_mid', 'apps'] },
            { id: 'apps', pos: new THREE.Vector3(32, 2.2, 5), connections: ['boiler', 'balcony_a', 'bedroom'] },
            { id: 'balcony_a', pos: new THREE.Vector3(30, 2, -10), connections: ['apps', 'pit', 'a_site'] },
            { id: 'short_a', pos: new THREE.Vector3(20, 0, -5), connections: ['top_mid', 'a_site', 'truck'] },
            { id: 'truck', pos: new THREE.Vector3(22, 0, -18), connections: ['short_a', 'a_site'] },
            { id: 'long_a', pos: new THREE.Vector3(8, 0, 0), connections: ['top_mid', 'arch'] },
            { id: 'arch', pos: new THREE.Vector3(10, 0, -25), connections: ['long_a', 'speedway', 'library'] },
            { id: 'library', pos: new THREE.Vector3(20, 0, -30), connections: ['arch', 'a_site'] },
            { id: 'pit', pos: new THREE.Vector3(45, 0, -15), connections: ['balcony_a', 'a_site', 'graveyard'] },
            { id: 'graveyard', pos: new THREE.Vector3(42, 0, -28), connections: ['pit', 'a_site'] },
            { id: 'a_site', pos: new THREE.Vector3(35, 0, -20), connections: ['truck', 'pit', 'graveyard', 'library', 'balcony_a'] },
            { id: 'speedway', pos: new THREE.Vector3(-5, 0, -35), connections: ['arch', 'ct_spawn'] },

            // CT Spawn
            { id: 'ct_spawn', pos: new THREE.Vector3(0, 0, -45), connections: ['speedway', 'construction', 'ruins'] }
        ];
    }

    build() {
        this.group = new THREE.Group();
        this.group.name = 'Map_Inferno';

        const cobbleMat = new THREE.MeshStandardMaterial({
            map: TextureGenerator.createCobblestoneTexture(1024, 1024),
            roughness: 0.85,
            metalness: 0.1
        });
        cobbleMat.map.repeat.set(16, 16);

        const villaWallMat = new THREE.MeshStandardMaterial({
            map: TextureGenerator.createMirageWallTexture(512, 512),
            roughness: 0.8,
            metalness: 0.05
        });
        villaWallMat.map.repeat.set(2, 2);

        // Ground Plane
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(280, 280), cobbleMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        this.group.add(ground);

        // Outer Borders
        this.createWall(0, 7, 105, 240, 14, 6, villaWallMat);
        this.createWall(0, 7, -70, 240, 14, 6, villaWallMat);
        this.createWall(-75, 7, 15, 6, 14, 180, villaWallMat);
        this.createWall(75, 7, 15, 6, 14, 180, villaWallMat);

        // 1. BANANA STREET & B SITE
        // Banana outer curves & buildings
        this.createBuilding(-52, 6, 30, 16, 12, 50, villaWallMat);
        this.createBuilding(-22, 6, 35, 14, 12, 40, villaWallMat);
        // Half Wall on Banana
        this.createWall(-34, 0.7, 5, 8, 1.4, 1.2, villaWallMat);
        // Sandbags
        this.createCrate(-44, 0.6, 6, 2, 1.2, 2, 'B');
        // Car prop on Banana
        this.createCarProp(-38, 0.75, 20);

        // B SITE
        // Fountain in center of B
        this.createFountain(-42, 0.5, -22);
        // New Box
        this.createCrate(-50, 1.2, -30, 2.4, 2.4, 2.4, 'B');
        this.createCrate(-48, 1.2, -32, 2.4, 2.4, 2.4, 'B');
        // Coffins prop
        this.createCrate(-32, 0.8, -32, 2.2, 1.6, 3.6, 'B');
        // Ruins / Church building
        this.createBuilding(-48, 7, -50, 30, 14, 25, villaWallMat);

        // 2. MID & APARTMENTS
        // Mid central buildings
        this.createBuilding(-5, 6, 10, 14, 12, 28, villaWallMat);
        // Apartments 2-story complex
        this.createBuilding(38, 7, 15, 22, 14, 45, villaWallMat);
        // Balcony overlooking A Site & Pit
        this.createPlatform(30, 2.2, -10, 8, 0.4, 6, villaWallMat);

        // 3. A SITE & PIT
        // Pit sunken area walls
        this.createWall(48, 4, -15, 12, 8, 20, villaWallMat);
        // Graveyard wall
        this.createWall(45, 4, -30, 14, 8, 8, villaWallMat);
        // Arch / Speedway building
        this.createBuilding(10, 6, -18, 12, 12, 14, villaWallMat);
        // Archway opening
        this.createPlatform(10, 4.5, -24, 6, 1, 2, villaWallMat);
        // Library building
        this.createBuilding(20, 5, -34, 14, 10, 16, villaWallMat);
        // A Site boxes / crates
        this.createCrate(35, 1.2, -20, 2.4, 2.4, 2.4, 'A');
        this.createCrate(33, 1.2, -18, 2, 2, 2, 'A');

        // 4. CT SPAWN AREA
        this.createWall(0, 5, -55, 36, 10, 4, villaWallMat);

        this.scene.add(this.group);
        this.physics.setColliders(this.colliders);
        return this;
    }

    createWall(x, y, z, w, h, d, material) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.group.add(mesh);

        const box = new THREE.Box3();
        box.setFromObject(mesh);
        this.colliders.push(box);
        return mesh;
    }

    createBuilding(x, y, z, w, h, d, material) {
        return this.createWall(x, y, z, w, h, d, material);
    }

    createPlatform(x, y, z, w, h, d, material) {
        return this.createWall(x, y, z, w, h, d, material);
    }

    createCrate(x, y, z, w, h, d, label = 'A') {
        const crateMat = new THREE.MeshStandardMaterial({
            map: TextureGenerator.createCrateTexture(512, 512, label),
            roughness: 0.7,
            metalness: 0.2
        });
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), crateMat);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.group.add(mesh);

        const box = new THREE.Box3();
        box.setFromObject(mesh);
        this.colliders.push(box);
    }

    createFountain(x, y, z) {
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0x7E7870, roughness: 0.8 });
        const base = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.8, 1.0, 16), stoneMat);
        base.position.set(x, y + 0.5, z);
        base.castShadow = true;
        this.group.add(base);

        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 2.2, 10), stoneMat);
        pillar.position.set(x, y + 1.6, z);
        pillar.castShadow = true;
        this.group.add(pillar);

        const box = new THREE.Box3();
        box.setFromObject(base);
        this.colliders.push(box);
    }

    createCarProp(x, y, z) {
        const carMat = new THREE.MeshStandardMaterial({ color: 0x887766, roughness: 0.5, metalness: 0.6 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 4.2), carMat);
        body.position.set(x, y, z);
        body.castShadow = true;
        this.group.add(body);

        const box = new THREE.Box3();
        box.setFromObject(body);
        this.colliders.push(box);
    }
}

