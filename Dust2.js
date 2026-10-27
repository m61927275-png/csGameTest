// ============================================
// CS2 Web Game - Dust II Map
// Accurate layout: Long A, Catwalk, Mid, B Site, T/CT Spawns
// ============================================

import { TextureGenerator } from '../engine/Textures.js';

export class Dust2Map {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;
        this.colliders = [];
        this.interactiveObjects = [];
        this.name = 'de_dust2';
        this.callout = 'Dust II';

        // Spawns (5 CT, 5 T)
        this.ctSpawns = [
            new THREE.Vector3(0, 0, -50),
            new THREE.Vector3(3, 0, -50),
            new THREE.Vector3(-3, 0, -50),
            new THREE.Vector3(6, 0, -52),
            new THREE.Vector3(-6, 0, -52)
        ];

        this.tSpawns = [
            new THREE.Vector3(-20, 0, 80),
            new THREE.Vector3(-17, 0, 80),
            new THREE.Vector3(-23, 0, 80),
            new THREE.Vector3(-20, 0, 83),
            new THREE.Vector3(-17, 0, 83)
        ];

        // Bomb sites zones
        this.bombSites = {
            A: { center: new THREE.Vector3(42, 0, -25), radius: 6 },
            B: { center: new THREE.Vector3(-45, 0, -25), radius: 6 }
        };

        // Navigation Waypoints for Bots
        this.waypoints = [
            // T side & Long
            { id: 't_spawn', pos: new THREE.Vector3(-20, 0, 80), connections: ['t_ramp', 'suicide'] },
            { id: 't_ramp', pos: new THREE.Vector3(15, 0, 75), connections: ['t_spawn', 'long_doors'] },
            { id: 'long_doors', pos: new THREE.Vector3(38, 0, 60), connections: ['t_ramp', 'pit', 'long_a'] },
            { id: 'pit', pos: new THREE.Vector3(45, -1, 35), connections: ['long_doors', 'long_a'] },
            { id: 'long_a', pos: new THREE.Vector3(42, 0, 15), connections: ['long_doors', 'pit', 'a_site', 'a_cross'] },
            { id: 'a_cross', pos: new THREE.Vector3(35, 0, -10), connections: ['long_a', 'a_site', 'ct_spawn'] },
            { id: 'a_site', pos: new THREE.Vector3(42, 1, -25), connections: ['long_a', 'a_cross', 'short_a'] },

            // Mid & Short
            { id: 'suicide', pos: new THREE.Vector3(-5, 0, 50), connections: ['t_spawn', 'top_mid'] },
            { id: 'top_mid', pos: new THREE.Vector3(-5, 0, 30), connections: ['suicide', 'xbox', 'catwalk'] },
            { id: 'xbox', pos: new THREE.Vector3(-6, 0, 10), connections: ['top_mid', 'mid_doors', 'catwalk'] },
            { id: 'mid_doors', pos: new THREE.Vector3(-5, 0, -15), connections: ['xbox', 'ct_mid'] },
            { id: 'catwalk', pos: new THREE.Vector3(10, 2, 15), connections: ['top_mid', 'xbox', 'short_a'] },
            { id: 'short_a', pos: new THREE.Vector3(25, 2, -15), connections: ['catwalk', 'a_site'] },

            // B Site & Tunnels
            { id: 'upper_tunnels', pos: new THREE.Vector3(-38, 0, 45), connections: ['suicide', 'lower_tunnels', 'b_tunnels'] },
            { id: 'lower_tunnels', pos: new THREE.Vector3(-22, -1, 20), connections: ['upper_tunnels', 'xbox'] },
            { id: 'b_tunnels', pos: new THREE.Vector3(-45, 0, 15), connections: ['upper_tunnels', 'b_site'] },
            { id: 'b_site', pos: new THREE.Vector3(-45, 1, -25), connections: ['b_tunnels', 'b_doors', 'b_window'] },
            { id: 'b_doors', pos: new THREE.Vector3(-32, 0, -30), connections: ['b_site', 'ct_mid'] },
            { id: 'b_window', pos: new THREE.Vector3(-38, 1.5, -35), connections: ['b_site', 'ct_mid'] },

            // CT Mid & Spawn
            { id: 'ct_mid', pos: new THREE.Vector3(-15, 0, -35), connections: ['mid_doors', 'b_doors', 'b_window', 'ct_spawn'] },
            { id: 'ct_spawn', pos: new THREE.Vector3(0, 0, -50), connections: ['ct_mid', 'a_cross'] }
        ];
    }

    build() {
        this.group = new THREE.Group();
        this.group.name = 'Map_Dust2';

        // Materials
        const sandGroundMat = new THREE.MeshStandardMaterial({
            map: TextureGenerator.createGroundTexture(1024, 1024),
            roughness: 0.9,
            metalness: 0.05
        });
        sandGroundMat.map.repeat.set(16, 16);

        const sandstoneMat = new THREE.MeshStandardMaterial({
            map: TextureGenerator.createSandstoneTexture(512, 512),
            roughness: 0.85,
            metalness: 0.1
        });
        sandstoneMat.map.repeat.set(2, 2);

        // 1. Main Ground Plane
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), sandGroundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        this.group.add(ground);

        // 2. Outer Perimeter Boundaries
        this.createWall(0, 6, 120, 240, 12, 6, sandstoneMat); // South wall
        this.createWall(0, 6, -80, 240, 12, 6, sandstoneMat); // North wall
        this.createWall(-85, 6, 20, 6, 12, 200, sandstoneMat); // West wall
        this.createWall(85, 6, 20, 6, 12, 200, sandstoneMat); // East wall

        // 3. LONG A SECTION
        // Long Doors corridor & building
        this.createBuilding(38, 5, 60, 14, 10, 18, sandstoneMat);
        // Long A walls (separating Long from Mid)
        this.createWall(22, 5, 30, 4, 10, 60, sandstoneMat);
        // Pit elevation & walls
        this.createWall(55, 4, 40, 16, 8, 30, sandstoneMat);
        // A Site elevated platform
        this.createPlatform(42, 1, -25, 24, 2, 22, sandstoneMat);
        // Ramp up to A site
        this.createRamp(42, 0.5, -12, 12, 1, 6, sandstoneMat);
        // Goose corner walls
        this.createWall(54, 5, -34, 4, 10, 16, sandstoneMat);
        this.createWall(42, 5, -37, 24, 10, 4, sandstoneMat);

        // 4. CATWALK & SHORT A
        // Catwalk elevated walkway
        this.createPlatform(12, 2, 15, 6, 4, 30, sandstoneMat);
        // Short A elevated corridor
        this.createPlatform(25, 2, -15, 22, 4, 8, sandstoneMat);
        // Short A wall to Mid
        this.createWall(14, 6, -5, 4, 12, 22, sandstoneMat);

        // 5. MID SECTION
        // Xbox crate
        this.createCrate(-6, 1.25, 10, 2.5, 2.5, 2.5, 'X');
        // Mid Doors frame & doors
        this.createBuilding(-16, 6, -10, 6, 12, 14, sandstoneMat);
        this.createBuilding(4, 6, -10, 6, 12, 14, sandstoneMat);
        // Mid Double Doors (slightly ajar with gap)
        this.createDoorProp(-8, 3, -10, 3.5, 6, 0.4, 0.3);
        this.createDoorProp(-2, 3, -10, 3.5, 6, 0.4, -0.3);

        // 6. B SITE SECTION
        // B Tunnels building
        this.createBuilding(-40, 5, 35, 18, 10, 32, sandstoneMat);
        // B Site elevated platform
        this.createPlatform(-45, 1, -25, 26, 2, 26, sandstoneMat);
        // B Site Back Wall
        this.createWall(-45, 6, -38, 28, 12, 4, sandstoneMat);
        this.createWall(-59, 6, -25, 4, 12, 26, sandstoneMat);
        // B Window & Doors wall
        this.createWall(-32, 6, -25, 4, 12, 26, sandstoneMat);
        // B Big Box & Crates
        this.createCrate(-45, 2.5, -25, 3, 3, 3, 'B');
        this.createCrate(-42, 1.75, -23, 1.5, 1.5, 1.5, 'A');
        this.createCrate(-48, 1.75, -27, 1.5, 1.5, 1.5, 'B');

        // 7. A SITE CRATES
        this.createCrate(42, 2.5, -25, 2.5, 2.5, 2.5, 'A');
        this.createCrate(44, 2.5, -22, 2.2, 2.2, 2.2, 'A');
        this.createCrate(38, 2.5, -26, 2, 2, 2, 'A');

        // 8. CT SPAWN AREA
        this.createWall(0, 5, -60, 40, 10, 4, sandstoneMat);
        this.createWall(-20, 5, -45, 4, 10, 30, sandstoneMat);
        this.createWall(20, 5, -45, 4, 10, 30, sandstoneMat);

        // 9. PROPS & DECORATIONS
        this.createPalmTree(25, 0, 70);
        this.createPalmTree(50, 0, 0);
        this.createPalmTree(-30, 0, -45);
        this.createBarrels(-10, 0, -32);
        this.createBarrels(36, 0, 8);

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

    createRamp(x, y, z, w, h, d, material) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
        mesh.position.set(x, y, z);
        mesh.rotation.x = -0.15;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.group.add(mesh);

        const box = new THREE.Box3();
        box.setFromObject(mesh);
        this.colliders.push(box);
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

    createDoorProp(x, y, z, w, h, d, angle = 0) {
        const doorMat = new THREE.MeshStandardMaterial({
            color: 0x485848,
            roughness: 0.6,
            metalness: 0.4
        });
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), doorMat);
        mesh.position.set(x, y, z);
        mesh.rotation.y = angle;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.group.add(mesh);

        const box = new THREE.Box3();
        box.setFromObject(mesh);
        this.colliders.push(box);
    }

    createPalmTree(x, y, z) {
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5C4033, roughness: 0.9 });
        const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2E6B38, roughness: 0.7 });

        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 12, 8), trunkMat);
        trunk.position.set(x, y + 6, z);
        trunk.castShadow = true;
        this.group.add(trunk);

        // Fronds
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const frond = new THREE.Mesh(new THREE.ConeGeometry(1.8, 5, 5), leavesMat);
            frond.position.set(x + Math.cos(angle) * 2, y + 12, z + Math.sin(angle) * 2);
            frond.rotation.z = Math.cos(angle) * 0.6;
            frond.rotation.x = Math.sin(angle) * 0.6;
            frond.castShadow = true;
            this.group.add(frond);
        }
    }

    createBarrels(x, y, z) {
        const barrelMat = new THREE.MeshStandardMaterial({ color: 0x334466, metalness: 0.8, roughness: 0.3 });
        for (let i = 0; i < 3; i++) {
            const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.2, 10), barrelMat);
            barrel.position.set(x + (i % 2) * 0.85, y + 0.6, z + Math.floor(i / 2) * 0.85);
            barrel.castShadow = true;
            this.group.add(barrel);

            const box = new THREE.Box3();
            box.setFromObject(barrel);
            this.colliders.push(box);
        }
    }
}

