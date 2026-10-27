// ============================================
// CS2 Web Game - Mirage Map (de_mirage)
// Detailed layout: A Site (Palace, Tetris), Mid (Window, Connector), B Site (Apps, Market)
// ============================================

import { TextureGenerator } from '../engine/Textures.js';

export class MirageMap {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;
        this.colliders = [];
        this.interactiveObjects = [];
        this.name = 'de_mirage';
        this.callout = 'Mirage';

        this.ctSpawns = [
            new THREE.Vector3(0, 0, -45),
            new THREE.Vector3(3, 0, -45),
            new THREE.Vector3(-3, 0, -45),
            new THREE.Vector3(6, 0, -48),
            new THREE.Vector3(-6, 0, -48)
        ];

        this.tSpawns = [
            new THREE.Vector3(0, 0, 75),
            new THREE.Vector3(4, 0, 75),
            new THREE.Vector3(-4, 0, 75),
            new THREE.Vector3(0, 0, 78),
            new THREE.Vector3(4, 0, 78)
        ];

        this.bombSites = {
            A: { center: new THREE.Vector3(35, 0, -15), radius: 6 },
            B: { center: new THREE.Vector3(-40, 0, -10), radius: 6 }
        };

        this.waypoints = [
            // T side & A Route
            { id: 't_spawn', pos: new THREE.Vector3(0, 0, 75), connections: ['t_roof', 'top_mid', 'b_apps_entrance'] },
            { id: 't_roof', pos: new THREE.Vector3(20, 0, 60), connections: ['t_spawn', 'a_ramp', 'palace_entrance'] },
            { id: 'a_ramp', pos: new THREE.Vector3(35, 0, 20), connections: ['t_roof', 'tetris', 'a_site'] },
            { id: 'palace_entrance', pos: new THREE.Vector3(48, 2, 35), connections: ['t_roof', 'palace_balcony'] },
            { id: 'palace_balcony', pos: new THREE.Vector3(45, 2.5, 0), connections: ['palace_entrance', 'a_site'] },
            { id: 'tetris', pos: new THREE.Vector3(32, 0, 5), connections: ['a_ramp', 'sandwich', 'stairs'] },
            { id: 'sandwich', pos: new THREE.Vector3(28, 0, -8), connections: ['tetris', 'stairs', 'a_site'] },
            { id: 'stairs', pos: new THREE.Vector3(22, 1.2, -12), connections: ['sandwich', 'connector'] },
            { id: 'a_site', pos: new THREE.Vector3(35, 0, -15), connections: ['a_ramp', 'sandwich', 'triple_box', 'firebox', 'ticket'] },
            { id: 'triple_box', pos: new THREE.Vector3(38, 0, -22), connections: ['a_site', 'ticket'] },
            { id: 'firebox', pos: new THREE.Vector3(45, 0, -18), connections: ['a_site', 'ninja'] },
            { id: 'ninja', pos: new THREE.Vector3(45, 0, -26), connections: ['firebox', 'triple_box'] },
            { id: 'ticket', pos: new THREE.Vector3(28, 0, -32), connections: ['a_site', 'ct_spawn'] },

            // Mid & Connector
            { id: 'top_mid', pos: new THREE.Vector3(0, 0, 45), connections: ['t_spawn', 'mid_boxes', 'underpass'] },
            { id: 'mid_boxes', pos: new THREE.Vector3(0, 0, 20), connections: ['top_mid', 'connector', 'catwalk'] },
            { id: 'connector', pos: new THREE.Vector3(12, 0, 0), connections: ['mid_boxes', 'stairs', 'jungle'] },
            { id: 'jungle', pos: new THREE.Vector3(18, 0, -22), connections: ['connector', 'window_room', 'ct_spawn'] },
            { id: 'window_room', pos: new THREE.Vector3(5, 2, -10), connections: ['jungle', 'catwalk'] },
            { id: 'catwalk', pos: new THREE.Vector3(-12, 1.5, 10), connections: ['mid_boxes', 'window_room', 'short_b'] },
            { id: 'short_b', pos: new THREE.Vector3(-22, 0, 0), connections: ['catwalk', 'b_site'] },
            { id: 'underpass', pos: new THREE.Vector3(-10, -1, 30), connections: ['top_mid', 'b_apps_entrance'] },

            // B Route & Apartments
            { id: 'b_apps_entrance', pos: new THREE.Vector3(-25, 0, 60), connections: ['t_spawn', 'underpass', 'b_apps'] },
            { id: 'b_apps', pos: new THREE.Vector3(-42, 2, 25), connections: ['b_apps_entrance', 'b_balcony'] },
            { id: 'b_balcony', pos: new THREE.Vector3(-42, 1.8, 5), connections: ['b_apps', 'b_site'] },
            { id: 'b_site', pos: new THREE.Vector3(-40, 0, -10), connections: ['b_balcony', 'short_b', 'van', 'bench', 'market_window'] },
            { id: 'van', pos: new THREE.Vector3(-48, 0.8, -5), connections: ['b_site', 'b_balcony'] },
            { id: 'bench', pos: new THREE.Vector3(-48, 0, -20), connections: ['b_site', 'arches'] },
            { id: 'arches', pos: new THREE.Vector3(-35, 0, -28), connections: ['bench', 'market_door', 'ct_spawn'] },
            { id: 'market_window', pos: new THREE.Vector3(-28, 1, -12), connections: ['b_site', 'market'] },
            { id: 'market_door', pos: new THREE.Vector3(-28, 0, -25), connections: ['arches', 'market'] },
            { id: 'market', pos: new THREE.Vector3(-18, 0, -20), connections: ['market_window', 'market_door', 'ct_spawn'] },

            // CT Spawn
            { id: 'ct_spawn', pos: new THREE.Vector3(0, 0, -45), connections: ['ticket', 'jungle', 'market', 'arches'] }
        ];
    }

    build() {
        this.group = new THREE.Group();
        this.group.name = 'Map_Mirage';

        const groundMat = new THREE.MeshStandardMaterial({
            map: TextureGenerator.createConcreteTexture(1024, 1024),
            roughness: 0.9,
            metalness: 0.05
        });
        groundMat.map.repeat.set(14, 14);

        const wallMat = new THREE.MeshStandardMaterial({
            map: TextureGenerator.createMirageWallTexture(512, 512),
            roughness: 0.8,
            metalness: 0.1
        });
        wallMat.map.repeat.set(2, 2);

        // Ground Plane
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(280, 280), groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        this.group.add(ground);

        // Outer Borders
        this.createWall(0, 7, 100, 240, 14, 6, wallMat);
        this.createWall(0, 7, -70, 240, 14, 6, wallMat);
        this.createWall(-75, 7, 15, 6, 14, 170, wallMat);
        this.createWall(75, 7, 15, 6, 14, 170, wallMat);

        // 1. PALACE (A Site)
        // Palace Building Exterior & Balcony
        this.createBuilding(55, 6, 20, 22, 12, 40, wallMat);
        this.createPlatform(45, 2.5, 0, 10, 0.4, 12, wallMat); // Balcony
        // Palace pillars
        for (const pz of [-4, 4]) {
            this.createPillar(49, 1.25, pz, 0.4, 2.5);
        }

        // 2. A SITE & TETRIS
        // Tetris boxes
        this.createCrate(32, 1, 5, 2, 2, 2, 'A');
        this.createCrate(34, 1, 3, 2, 2, 2, 'A');
        this.createCrate(32, 3, 4, 1.8, 1.8, 1.8, 'A');
        // Sandwich wall
        this.createWall(28, 3, -6, 1, 6, 8, wallMat);
        // Stairs to Connector
        this.createPlatform(22, 1.2, -12, 8, 2.4, 6, wallMat);
        // Triple Box on A
        this.createCrate(38, 1.2, -22, 2.4, 2.4, 2.4, 'A');
        this.createCrate(40, 1.2, -20, 2.4, 2.4, 2.4, 'A');
        this.createCrate(39, 3, -21, 2, 2, 2, 'A');
        // Firebox & Ninja
        this.createCrate(46, 1.2, -18, 2.4, 2.4, 2.4, 'A');
        this.createWall(48, 5, -28, 4, 10, 14, wallMat); // Ninja corner

        // Ticket Booth (CT Spawn to A Site)
        this.createBuilding(26, 2.5, -34, 6, 5, 6, wallMat);

        // 3. MID & WINDOW ROOM
        // Top Mid divider wall
        this.createWall(14, 5, 35, 4, 10, 30, wallMat);
        // Mid Boxes
        this.createCrate(0, 1, 20, 2, 2, 2, 'A');
        this.createCrate(-2, 1, 18, 2, 2, 2, 'A');
        // Window Room (Sniper's Nest)
        this.createBuilding(6, 4, -10, 14, 8, 14, wallMat);
        // Window opening cutout / ledge
        this.createPlatform(5, 2.1, -3, 6, 0.4, 2, wallMat);
        // Connector & Jungle building
        this.createBuilding(18, 5, -15, 14, 10, 20, wallMat);

        // Catwalk / Short B
        this.createPlatform(-12, 1.6, 10, 6, 3.2, 24, wallMat);

        // 4. B APARTMENTS & B SITE
        // B Apartments 2-story building
        this.createBuilding(-48, 6, 30, 24, 12, 50, wallMat);
        // B Balcony / TV room exit
        this.createPlatform(-42, 1.8, 5, 8, 0.4, 6, wallMat);
        // Van prop (jump spot onto site)
        this.createVan(-48, 0.8, -5);
        // Bench wall
        this.createWall(-55, 3, -20, 6, 6, 14, wallMat);
        // B Site Crates
        this.createCrate(-40, 1.2, -10, 2.4, 2.4, 2.4, 'B');
        this.createCrate(-38, 1.2, -8, 2, 2, 2, 'B');
        // Kitchen / Market building
        this.createBuilding(-22, 5, -18, 18, 10, 22, wallMat);

        // 5. CT SPAWN AREA
        this.createWall(0, 5, -55, 36, 10, 4, wallMat);

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

    createPillar(x, y, z, radius, height) {
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0xBA987A, roughness: 0.8 });
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 10), pillarMat);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        this.group.add(mesh);

        const box = new THREE.Box3();
        box.setFromObject(mesh);
        this.colliders.push(box);
    }

    createVan(x, y, z) {
        const vanMat = new THREE.MeshStandardMaterial({ color: 0xD0D4D8, roughness: 0.4, metalness: 0.7 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 4.5), vanMat);
        body.position.set(x, y, z);
        body.castShadow = true;
        this.group.add(body);

        const box = new THREE.Box3();
        box.setFromObject(body);
        this.colliders.push(box);
    }
}

