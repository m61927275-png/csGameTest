// ============================================
// CS2 Web Game - High Quality 3D Models
// Detailed Procedural Player and Weapon Meshes
// ============================================

import { TextureGenerator } from './Textures.js';

export class ModelFactory {
    /**
     * Counter-Terrorist (SAS / GSG9) Player Model
     * Detailed tactical helmet with NVG mount, dark navy/blue uniform,
     * ballistic plate carrier with ammo pouches, knee pads, combat boots.
     */
    static createCTModel() {
        const ctGroup = new THREE.Group();
        ctGroup.name = 'CT_Player';

        // Materials
        const uniformMat = new THREE.MeshStandardMaterial({
            color: 0x2A3B4D,
            roughness: 0.8,
            metalness: 0.1
        });
        const vestMat = new THREE.MeshStandardMaterial({
            color: 0x1A222B,
            roughness: 0.85,
            metalness: 0.2
        });
        const helmetMat = new THREE.MeshStandardMaterial({
            color: 0x26333D,
            roughness: 0.6,
            metalness: 0.3
        });
        const skinMat = new THREE.MeshStandardMaterial({
            color: 0xC89678,
            roughness: 0.7
        });
        const visorMat = new THREE.MeshStandardMaterial({
            color: 0x0A0D12,
            roughness: 0.2,
            metalness: 0.9
        });
        const pouchMat = new THREE.MeshStandardMaterial({
            color: 0x1E2933,
            roughness: 0.9
        });

        // 1. Pelvis / Hips (Y: 0.85)
        const hips = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.2, 0.26), uniformMat);
        hips.position.y = 0.88;
        ctGroup.add(hips);

        // 2. Legs & Tactical Boots
        for (const side of [-1, 1]) {
            // Upper leg
            const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.42, 8), uniformMat);
            thigh.position.set(side * 0.12, 0.65, 0);
            ctGroup.add(thigh);

            // Knee pad
            const kneePad = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.08), vestMat);
            kneePad.position.set(side * 0.12, 0.45, 0.06);
            ctGroup.add(kneePad);

            // Lower leg / Shin
            const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.07, 0.4, 8), uniformMat);
            shin.position.set(side * 0.12, 0.26, 0);
            ctGroup.add(shin);

            // Combat boot
            const boot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.22), vestMat);
            boot.position.set(side * 0.12, 0.07, 0.04);
            ctGroup.add(boot);
        }

        // 3. Torso / Ballistic Vest (Y: 1.25)
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.28), uniformMat);
        torso.position.y = 1.22;
        ctGroup.add(torso);

        // Heavy Tactical Plate Carrier Vest
        const vest = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.42, 0.32), vestMat);
        vest.position.y = 1.23;
        ctGroup.add(vest);

        // Ammo Pouches on chest
        for (let i = -1; i <= 1; i++) {
            const magPouch = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.16, 0.06), pouchMat);
            magPouch.position.set(i * 0.11, 1.18, 0.18);
            ctGroup.add(magPouch);
        }

        // Radio / Walkie-talkie on left shoulder
        const radio = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.05), vestMat);
        radio.position.set(-0.16, 1.45, 0.12);
        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.14), vestMat);
        antenna.position.set(-0.16, 1.56, 0.12);
        ctGroup.add(radio, antenna);

        // 4. Arms & Gloves
        for (const side of [-1, 1]) {
            // Shoulder
            const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), uniformMat);
            shoulder.position.set(side * 0.26, 1.4, 0);
            ctGroup.add(shoulder);

            // Arm
            const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.45, 8), uniformMat);
            arm.position.set(side * 0.26, 1.16, 0.04);
            arm.rotation.x = 0.2;
            ctGroup.add(arm);

            // Tactical Glove
            const glove = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.09), vestMat);
            glove.position.set(side * 0.26, 0.92, 0.1);
            ctGroup.add(glove);
        }

        // 5. Head (Y: 1.62) & High-Cut Tactical Helmet
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), skinMat);
        head.position.y = 1.62;
        head.name = 'head'; // Hitbox detection
        ctGroup.add(head);

        // Balaclava mask
        const balaclava = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.2, 10), vestMat);
        balaclava.position.y = 1.58;
        ctGroup.add(balaclava);

        // Tactical Helmet
        const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), helmetMat);
        helmet.position.y = 1.65;
        ctGroup.add(helmet);

        // Visor / Tactical Goggles
        const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 0.1), visorMat);
        goggles.position.set(0, 1.65, 0.11);
        ctGroup.add(goggles);

        // Enable shadows for all meshes
        ctGroup.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        return ctGroup;
    }

    /**
     * Terrorist (Phoenix Connexion / Elite Crew) Player Model
     * Urban guerrilla look, tan/brown hoodie, bandolier rig, cargo pants, mask.
     */
    static createTModel() {
        const tGroup = new THREE.Group();
        tGroup.name = 'T_Player';

        const jacketMat = new THREE.MeshStandardMaterial({
            color: 0x8C6B46, // Tan/Desert Brown
            roughness: 0.85
        });
        const pantsMat = new THREE.MeshStandardMaterial({
            color: 0x4A463B, // Olive / Drab Green
            roughness: 0.9
        });
        const gearMat = new THREE.MeshStandardMaterial({
            color: 0x2B241D, // Dark leather/canvas
            roughness: 0.8
        });
        const maskMat = new THREE.MeshStandardMaterial({
            color: 0xF5F0E6, // White balaclava
            roughness: 0.9
        });
        const skinMat = new THREE.MeshStandardMaterial({
            color: 0xC49272,
            roughness: 0.7
        });

        // 1. Hips
        const hips = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.2, 0.26), pantsMat);
        hips.position.y = 0.88;
        tGroup.add(hips);

        // 2. Legs & Boots
        for (const side of [-1, 1]) {
            const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.42, 8), pantsMat);
            thigh.position.set(side * 0.12, 0.65, 0);
            tGroup.add(thigh);

            // Cargo Pocket
            const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.1), gearMat);
            pocket.position.set(side * 0.21, 0.62, 0);
            tGroup.add(pocket);

            const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.07, 0.4, 8), pantsMat);
            shin.position.set(side * 0.12, 0.26, 0);
            tGroup.add(shin);

            const boot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.22), gearMat);
            boot.position.set(side * 0.12, 0.07, 0.04);
            tGroup.add(boot);
        }

        // 3. Torso / Jacket
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.48, 0.28), jacketMat);
        torso.position.y = 1.22;
        tGroup.add(torso);

        // Chest Rig / Bandolier
        const rig = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32, 0.31), gearMat);
        rig.position.y = 1.2;
        tGroup.add(rig);

        // Ammo Mags on chest
        for (let i = -1; i <= 1; i++) {
            const mag = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.05), gearMat);
            mag.position.set(i * 0.1, 1.18, 0.17);
            tGroup.add(mag);
        }

        // 4. Arms
        for (const side of [-1, 1]) {
            const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.45, 8), jacketMat);
            arm.position.set(side * 0.26, 1.16, 0.04);
            arm.rotation.x = 0.2;
            tGroup.add(arm);

            const hand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.08), skinMat);
            hand.position.set(side * 0.26, 0.92, 0.1);
            tGroup.add(hand);
        }

        // 5. Head & Balaclava Mask
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), maskMat);
        head.position.y = 1.62;
        head.name = 'head';
        tGroup.add(head);

        // Eye slit with eyes
        const eyeSlit = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.05), skinMat);
        eyeSlit.position.set(0, 1.63, 0.11);
        tGroup.add(eyeSlit);

        // Aviator sunglasses
        const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.05, 0.06), new THREE.MeshStandardMaterial({
            color: 0x111111,
            metalness: 0.9,
            roughness: 0.1
        }));
        glasses.position.set(0, 1.64, 0.13);
        tGroup.add(glasses);

        tGroup.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        return tGroup;
    }

    /**
     * Create Detailed Weapon 3D Model
     */
    static createWeaponModel(weaponId) {
        const group = new THREE.Group();
        group.name = `Weapon_${weaponId}`;

        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x222428,
            metalness: 0.85,
            roughness: 0.35
        });
        const steelMat = new THREE.MeshStandardMaterial({
            color: 0x40454E,
            metalness: 0.9,
            roughness: 0.25
        });
        const darkPolymer = new THREE.MeshStandardMaterial({
            color: 0x18191B,
            metalness: 0.2,
            roughness: 0.7
        });
        const woodMat = new THREE.MeshStandardMaterial({
            color: 0x6A3414,
            roughness: 0.65,
            metalness: 0.05
        });

        switch (weaponId) {
            case 'ak47': {
                // Receiver
                const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.34), steelMat);
                // Wooden Stock
                const stock = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.11, 0.26), woodMat);
                stock.position.set(0, -0.02, 0.28);
                stock.rotation.x = 0.08;
                // Wooden Foregrip
                const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.2), woodMat);
                handguard.position.set(0, 0.01, -0.22);
                // Long Steel Barrel
                const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.38, 8), steelMat);
                barrel.rotation.x = Math.PI / 2;
                barrel.position.set(0, 0.02, -0.38);
                // Gas Tube
                const gasTube = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.25, 8), steelMat);
                gasTube.rotation.x = Math.PI / 2;
                gasTube.position.set(0, 0.05, -0.26);
                // Banana Curved Magazine
                const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.09), steelMat);
                mag.position.set(0, -0.14, -0.06);
                mag.rotation.x = -0.35;
                // Pistol Grip
                const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.06), woodMat);
                grip.position.set(0, -0.1, 0.12);
                grip.rotation.x = 0.35;
                // Front Sight & Muzzle Brake
                const sight = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.04, 0.02), steelMat);
                sight.position.set(0, 0.05, -0.52);

                group.add(receiver, stock, handguard, barrel, gasTube, mag, grip, sight);
                break;
            }

            case 'm4a4':
            case 'm4a1s': {
                const isSilenced = weaponId === 'm4a1s';
                // Upper & Lower Receiver
                const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.085, 0.28), darkPolymer);
                // Quad-rail Handguard
                const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.055, 0.22), darkPolymer);
                handguard.position.set(0, 0.01, -0.22);
                // Barrel
                const barrelLen = isSilenced ? 0.35 : 0.28;
                const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, barrelLen, 8), steelMat);
                barrel.rotation.x = Math.PI / 2;
                barrel.position.set(0, 0.015, -0.32);
                // Suppressor for M4A1-S
                if (isSilenced) {
                    const suppressor = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.28, 12), steelMat);
                    suppressor.rotation.x = Math.PI / 2;
                    suppressor.position.set(0, 0.015, -0.48);
                    group.add(suppressor);
                }
                // Collapsible Crane Stock
                const bufferTube = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 8), steelMat);
                bufferTube.rotation.x = Math.PI / 2;
                bufferTube.position.set(0, 0.02, 0.22);
                const stock = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.12, 0.18), darkPolymer);
                stock.position.set(0, 0, 0.26);
                // STANAG Magazine
                const mag = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.18, 0.075), steelMat);
                mag.position.set(0, -0.12, -0.04);
                mag.rotation.x = -0.15;
                // Pistol Grip
                const grip = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.13, 0.055), darkPolymer);
                grip.position.set(0, -0.09, 0.1);
                grip.rotation.x = 0.3;
                // Carry Handle / Top Rail
                const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.24), darkPolymer);
                topRail.position.set(0, 0.06, -0.02);

                group.add(receiver, handguard, barrel, bufferTube, stock, mag, grip, topRail);
                break;
            }

            case 'awp': {
                const awpGreen = new THREE.MeshStandardMaterial({
                    color: 0x334430, // Arctic Warfare Green chassis
                    roughness: 0.6
                });
                // Main Thumbhole Stock & Chassis
                const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.11, 0.58), awpGreen);
                chassis.position.set(0, -0.02, 0.1);
                // Heavy Floating Barrel
                const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.55, 10), steelMat);
                barrel.rotation.x = Math.PI / 2;
                barrel.position.set(0, 0.035, -0.42);
                // Big Muzzle Brake
                const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.038, 0.09), steelMat);
                muzzle.position.set(0, 0.035, -0.7);
                // Massive Sniper Scope
                const scopeBody = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.32, 12), darkPolymer);
                scopeBody.rotation.x = Math.PI / 2;
                scopeBody.position.set(0, 0.11, -0.04);
                const scopeBellFront = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.025, 0.08, 12), darkPolymer);
                scopeBellFront.rotation.x = Math.PI / 2;
                scopeBellFront.position.set(0, 0.11, -0.22);
                const scopeBellBack = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.032, 0.06, 12), darkPolymer);
                scopeBellBack.rotation.x = Math.PI / 2;
                scopeBellBack.position.set(0, 0.11, 0.14);
                // Scope Mount Rings
                const scopeRings = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.18), steelMat);
                scopeRings.position.set(0, 0.065, -0.04);
                // Bolt Action Handle
                const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.09), steelMat);
                bolt.position.set(0.05, 0.04, 0.02);
                bolt.rotation.z = Math.PI / 3;
                // Box Mag
                const mag = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.14, 0.09), darkPolymer);
                mag.position.set(0, -0.1, -0.06);

                group.add(chassis, barrel, muzzle, scopeBody, scopeBellFront, scopeBellBack, scopeRings, bolt, mag);
                break;
            }

            case 'deagle': {
                // Heavy Slide
                const slide = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.055, 0.26), steelMat);
                slide.position.set(0, 0.035, -0.04);
                // Polymer Grip
                const frame = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.13, 0.07), darkPolymer);
                frame.position.set(0, -0.05, 0.04);
                frame.rotation.x = 0.25;
                // Triangular Barrel shape
                const barrelTop = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.18, 8), steelMat);
                barrelTop.rotation.x = Math.PI / 2;
                barrelTop.position.set(0, 0.035, -0.12);

                group.add(slide, frame, barrelTop);
                break;
            }

            case 'knife': {
                // Blade
                const blade = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.048, 0.22), steelMat);
                blade.position.set(0, 0.01, -0.13);
                // Serrated Guard
                const guard = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.07, 0.018), darkPolymer);
                guard.position.set(0, 0, -0.02);
                // Ergonomic Textured Handle
                const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.018, 0.14, 8), darkPolymer);
                handle.rotation.x = Math.PI / 2;
                handle.position.set(0, 0, 0.06);

                group.add(blade, guard, handle);
                break;
            }

            case 'c4': {
                // Explosive Blocks
                const c4Base = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.22), new THREE.MeshStandardMaterial({
                    color: 0x8A7355, // Tan explosive brick
                    roughness: 0.95
                }));
                // Digital Timer & Keypad
                const keypad = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.14), darkPolymer);
                keypad.position.set(0, 0.07, 0);
                // Glowing Red LED Display
                const led = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.03), new THREE.MeshBasicMaterial({
                    color: 0xFF0000
                }));
                led.rotation.x = -Math.PI / 2;
                led.position.set(0, 0.092, -0.02);
                // Detonator wire loops
                const wire = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.006, 6, 12), new THREE.MeshBasicMaterial({
                    color: 0xFFDD00
                }));
                wire.position.set(0.07, 0.06, 0.06);

                group.add(c4Base, keypad, led, wire);
                break;
            }

            default: {
                // General SMG / Pistol / Shotgun fallback with clean model
                const body = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.07, 0.25), darkPolymer);
                const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.18, 8), steelMat);
                barrel.rotation.x = Math.PI / 2;
                barrel.position.set(0, 0.02, -0.18);
                const grip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.11, 0.05), darkPolymer);
                grip.position.set(0, -0.07, 0.04);
                grip.rotation.x = 0.25;
                group.add(body, barrel, grip);
            }
        }

        group.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        return group;
    }

    /**
     * Create Grenade Mesh
     */
    static createGrenadeMesh(grenadeId) {
        const group = new THREE.Group();
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });
        const pinMat = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, metalness: 0.9, roughness: 0.2 });

        if (grenadeId === 'smoke') {
            const body = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.12, 12), new THREE.MeshStandardMaterial({
                color: 0x2E6B38, // Olive green smoke canister
                roughness: 0.6
            }));
            const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.03, 8), metalMat);
            cap.position.y = 0.07;
            group.add(body, cap);
        } else if (grenadeId === 'molotov' || grenadeId === 'incendiary') {
            // Glass bottle with rag
            const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.18, 10), new THREE.MeshStandardMaterial({
                color: 0x553311,
                roughness: 0.2,
                transparent: true,
                opacity: 0.8
            }));
            const rag = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.08, 6), new THREE.MeshBasicMaterial({
                color: 0xFF5500
            }));
            rag.position.y = 0.12;
            group.add(bottle, rag);
        } else {
            // HE Grenade / Flashbang (spherical / ribbed)
            const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 10), new THREE.MeshStandardMaterial({
                color: grenadeId === 'flashbang' ? 0x999999 : 0x3F4F30,
                roughness: 0.5
            }));
            const pin = new THREE.Mesh(new THREE.TorusGeometry(0.015, 0.003, 6, 12), pinMat);
            pin.position.set(0.02, 0.05, 0);
            group.add(sphere, pin);
        }

        group.traverse(c => { if (c.isMesh) c.castShadow = true; });
        return group;
    }
}

