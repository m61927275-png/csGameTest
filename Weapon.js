// ============================================
// CS2 Web Game - Weapon & Ballistics System
// Recoil, Tracers, Muzzle Flash, Grenades & C4
// ============================================

import { CONFIG } from '../config.js';
import { WEAPONS, WEAPON_TYPES } from '../data/weapons.js';
import { ModelFactory } from '../engine/Models.js';

export class WeaponSystem {
    constructor(scene, physics, audio) {
        this.scene = scene;
        this.physics = physics;
        this.audio = audio;

        // Active dynamic effects
        this.activeGrenades = [];
        this.activeSmokes = [];
        this.activeFires = [];
        this.activeTracers = [];
        this.bulletDecals = [];
        this.activePlantedC4 = null;

        // Shared materials
        this.tracerMat = new THREE.LineBasicMaterial({ color: 0xFFDD88, linewidth: 2 });
        this.decalMat = new THREE.MeshBasicMaterial({ color: 0x1A1A1A, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 });

        // Muzzle Flash Point Light
        this.muzzleLight = new THREE.PointLight(0xFFCC66, 0, 10);
        this.scene.add(this.muzzleLight);
        this.muzzleFlashTimer = 0;
    }

    shoot(player, camera, targets = []) {
        const weapon = player.getWeaponData();
        if (!weapon) return { success: false };

        const now = performance.now();
        const fireInterval = (weapon.fireRate || 0.1) * 1000;

        // Fire rate cooldown
        if (now - player.lastShotTime < fireInterval) {
            return { success: false, reason: 'cooldown' };
        }

        // Knife logic
        if (weapon.type === WEAPON_TYPES.KNIFE) {
            player.lastShotTime = now;
            this.audio.playKnife();
            return this.processKnifeAttack(player, camera, targets);
        }

        // Ammo check
        const inMag = player.ammoInMag.get(weapon.id) || 0;
        if (inMag <= 0) {
            player.startReload();
            this.audio.playReload();
            return { success: false, reason: 'empty' };
        }

        // Deduct ammo
        player.ammoInMag.set(weapon.id, inMag - 1);
        player.lastShotTime = now;
        player.continuousShots++;

        // Audio
        this.audio.playShot(weapon);

        // Muzzle Flash Effect
        this.triggerMuzzleFlash(camera);

        // Recoil kick to camera
        const recoilAmount = weapon.recoil || 0.02;
        player.recoilPitch = Math.min(0.2, player.recoilPitch + recoilAmount);
        const sprayX = (Math.sin(player.continuousShots * 0.8) * recoilAmount * 0.4);
        player.recoilYaw += sprayX;
        camera.rotation.x += recoilAmount * 0.5;

        // Calculate bullet spread
        let spread = weapon.spread || 0.01;
        const speed = player.velocity.length();
        if (speed > 1.0) spread += weapon.movementSpread || 0.03;
        if (!player.isOnGround) spread *= 2.5;
        if (player.isCrouching) spread *= 0.6;

        // Determine number of rays (Shotguns fire pellets)
        const rayCount = weapon.pellets || 1;
        const hits = [];

        const barrelPos = camera.position.clone();
        barrelPos.y -= 0.15;

        for (let i = 0; i < rayCount; i++) {
            const spreadVector = new THREE.Vector3(
                (Math.random() - 0.5) * spread,
                (Math.random() - 0.5) * spread,
                -1
            ).normalize();

            const bulletDir = spreadVector.applyEuler(camera.rotation);

            // Create bullet tracer
            this.createBulletTracer(barrelPos, bulletDir, weapon.range || 200);

            // Raycast hit detection
            const hitResult = this.physics.raycast(camera.position, bulletDir, weapon.range || 200, this.scene.children);

            if (hitResult.hit) {
                // Check if hit an enemy entity
                const hitEntity = this.findHitEntity(hitResult.point, targets);

                if (hitEntity && hitEntity.isAlive) {
                    const isHeadshot = (hitResult.point.y - hitEntity.position.y) > 1.45;
                    const damageResult = hitEntity.takeDamage(weapon.damage, weapon.armorPen || 0.5, isHeadshot, player);

                    if (isHeadshot) {
                        this.audio.playHeadshot();
                    } else {
                        this.audio.playHit();
                    }

                    this.createBloodSplatter(hitResult.point);
                    hits.push({ entity: hitEntity, headshot: isHeadshot, damage: damageResult.damageDealt, killed: damageResult.killed });
                } else {
                    // Hit world wall / box - create impact decal
                    this.createBulletHole(hitResult.point, hitResult.normal);
                }
            }
        }

        return { success: true, hits };
    }

    processKnifeAttack(player, camera, targets) {
        const attackDir = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation);
        const hitResult = this.physics.raycast(camera.position, attackDir, 2.5, this.scene.children);

        if (hitResult.hit) {
            const hitEntity = this.findHitEntity(hitResult.point, targets);
            if (hitEntity && hitEntity.isAlive) {
                // Backstab detection
                const toVictim = hitEntity.position.clone().sub(player.position).normalize();
                const victimFacing = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), hitEntity.rotation.y);
                const isBackstab = toVictim.dot(victimFacing) > 0.6;

                const damage = isBackstab ? 180 : 55;
                const result = hitEntity.takeDamage(damage, 0.85, false, player);
                this.audio.playHit();
                this.createBloodSplatter(hitResult.point);
                return { success: true, hits: [{ entity: hitEntity, damage, killed: result.killed }] };
            }
        }
        return { success: true, hits: [] };
    }

    findHitEntity(point, targets) {
        for (const entity of targets) {
            if (!entity.isAlive) continue;
            const dist = point.distanceTo(entity.position);
            // Cylindrical check
            const dx = point.x - entity.position.x;
            const dz = point.z - entity.position.z;
            const horizDist = Math.sqrt(dx * dx + dz * dz);
            const dy = point.y - entity.position.y;

            if (horizDist < 0.65 && dy >= -0.2 && dy <= 1.9) {
                return entity;
            }
        }
        return null;
    }

    triggerMuzzleFlash(camera) {
        const offset = new THREE.Vector3(0.2, -0.15, -0.6).applyEuler(camera.rotation);
        this.muzzleLight.position.copy(camera.position).add(offset);
        this.muzzleLight.intensity = 3.5;
        this.muzzleFlashTimer = 0.04;
    }

    createBulletTracer(origin, direction, maxDist) {
        const end = origin.clone().addScaledVector(direction, Math.min(maxDist, 40));
        const geom = new THREE.BufferGeometry().setFromPoints([origin, end]);
        const line = new THREE.Line(geom, this.tracerMat);
        this.scene.add(line);
        this.activeTracers.push({ line, life: 0.06 });
    }

    createBulletHole(point, normal) {
        const decalGeo = new THREE.PlaneGeometry(0.12, 0.12);
        const decal = new THREE.Mesh(decalGeo, this.decalMat);
        decal.position.copy(point).addScaledVector(normal, 0.01);
        decal.lookAt(point.clone().add(normal));
        this.scene.add(decal);

        this.bulletDecals.push(decal);
        if (this.bulletDecals.length > 50) {
            const old = this.bulletDecals.shift();
            this.scene.remove(old);
            old.geometry.dispose();
        }
    }

    createBloodSplatter(point) {
        const count = 12;
        const pGeo = new THREE.BufferGeometry();
        const positions = [];

        for (let i = 0; i < count; i++) {
            positions.push(
                point.x + (Math.random() - 0.5) * 0.2,
                point.y + (Math.random() - 0.5) * 0.2,
                point.z + (Math.random() - 0.5) * 0.2
            );
        }

        pGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const pMat = new THREE.PointsMaterial({ color: 0x990000, size: 0.08 });
        const particles = new THREE.Points(pGeo, pMat);
        this.scene.add(particles);

        setTimeout(() => {
            this.scene.remove(particles);
            pGeo.dispose();
            pMat.dispose();
        }, 600);
    }

    throwGrenade(player, camera, grenadeId) {
        const grenadeMesh = ModelFactory.createGrenadeMesh(grenadeId);
        grenadeMesh.position.copy(camera.position);

        const throwDir = new THREE.Vector3(0, 0.15, -1).applyEuler(camera.rotation).normalize();
        const throwVelocity = throwDir.multiplyScalar(22);

        this.scene.add(grenadeMesh);

        this.activeGrenades.push({
            id: grenadeId,
            mesh: grenadeMesh,
            velocity: throwVelocity,
            fuse: WEAPONS[grenadeId]?.fuseTime || 1.8,
            owner: player
        });
    }

    plantC4(player, plantPosition) {
        const c4Mesh = ModelFactory.createWeaponModel('c4');
        c4Mesh.position.copy(plantPosition);
        c4Mesh.position.y = 0.05;
        this.scene.add(c4Mesh);

        this.activePlantedC4 = {
            mesh: c4Mesh,
            timer: CONFIG.GAME.BOMB_TIMER,
            plantedBy: player,
            isDefused: false,
            beepInterval: 1.0,
            lastBeep: 0
        };

        this.audio.playRadio('Bomb has been planted');
        return this.activePlantedC4;
    }

    update(dt, allEntities, camera) {
        // 1. Muzzle Flash Decay
        if (this.muzzleFlashTimer > 0) {
            this.muzzleFlashTimer -= dt;
            if (this.muzzleFlashTimer <= 0) {
                this.muzzleLight.intensity = 0;
            }
        }

        // 2. Bullet Tracers Decay
        for (let i = this.activeTracers.length - 1; i >= 0; i--) {
            const tracer = this.activeTracers[i];
            tracer.life -= dt;
            if (tracer.life <= 0) {
                this.scene.remove(tracer.line);
                tracer.line.geometry.dispose();
                this.activeTracers.splice(i, 1);
            }
        }

        // 3. Active Grenades Physics & Detonation
        for (let i = this.activeGrenades.length - 1; i >= 0; i--) {
            const g = this.activeGrenades[i];
            g.fuse -= dt;

            // Gravity
            g.velocity.y += CONFIG.PHYSICS.GRAVITY * dt;

            // Movement & Collision
            const newPos = g.mesh.position.clone().addScaledVector(g.velocity, dt);
            if (newPos.y <= 0.1) {
                newPos.y = 0.1;
                g.velocity.y *= -0.45; // bounce
                g.velocity.x *= 0.75;  // ground friction
                g.velocity.z *= 0.75;
            }
            g.mesh.position.copy(newPos);
            g.mesh.rotation.x += dt * 5;

            // Fuse expiration -> Detonate
            if (g.fuse <= 0) {
                this.detonateGrenade(g, allEntities, camera);
                this.scene.remove(g.mesh);
                this.activeGrenades.splice(i, 1);
            }
        }

        // 4. Smoke Clouds Dissipation
        for (let i = this.activeSmokes.length - 1; i >= 0; i--) {
            const s = this.activeSmokes[i];
            s.duration -= dt;
            if (s.duration <= 0) {
                this.scene.remove(s.group);
                this.activeSmokes.splice(i, 1);
            }
        }

        // 5. Molotov Fire Damage over time
        for (let i = this.activeFires.length - 1; i >= 0; i--) {
            const f = this.activeFires[i];
            f.duration -= dt;
            // Damage entities in fire radius
            for (const entity of allEntities) {
                if (entity.isAlive && entity.position.distanceTo(f.position) < 3.5) {
                    entity.takeDamage(40 * dt, 0.9, false, f.owner);
                }
            }
            if (f.duration <= 0) {
                this.scene.remove(f.group);
                this.activeFires.splice(i, 1);
            }
        }

        // 6. Planted C4 Countdown & Beeping
        if (this.activePlantedC4 && !this.activePlantedC4.isDefused) {
            this.activePlantedC4.timer -= dt;

            // Accelerate beeps as timer runs down
            const progress = 1 - (this.activePlantedC4.timer / CONFIG.GAME.BOMB_TIMER);
            const beepFreq = Math.max(0.12, 1.0 - progress * 0.88);

            const now = performance.now() / 1000;
            if (now - this.activePlantedC4.lastBeep >= beepFreq) {
                this.audio.playBombBeep(beepFreq);
                this.activePlantedC4.lastBeep = now;
            }

            if (this.activePlantedC4.timer <= 0) {
                this.detonateC4(allEntities);
            }
        }
    }

    detonateGrenade(grenade, allEntities, camera) {
        const pos = grenade.mesh.position;

        if (grenade.id === 'hegrenade') {
            this.audio.playExplosion();
            // Damage in radius
            for (const entity of allEntities) {
                if (!entity.isAlive) continue;
                const dist = pos.distanceTo(entity.position);
                if (dist < 8.0) {
                    const dmg = Math.round(98 * (1 - dist / 8.0));
                    entity.takeDamage(dmg, 0.6, false, grenade.owner);
                }
            }
        } else if (grenade.id === 'flashbang') {
            const dist = pos.distanceTo(camera.position);
            if (dist < 25.0) {
                const toFlash = pos.clone().sub(camera.position).normalize();
                const camDir = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation);
                const dot = camDir.dot(toFlash);
                if (dot > 0.2) {
                    const flashDuration = (1 - dist / 25.0) * 3.5;
                    this.audio.playFlashTinnitus(flashDuration);
                    window.dispatchEvent(new CustomEvent('player-flashed', { detail: { duration: flashDuration } }));
                }
            }
        } else if (grenade.id === 'smoke') {
            this.audio.playSmokeHiss();
            this.createSmokeCloud(pos);
        } else if (grenade.id === 'molotov' || grenade.id === 'incendiary') {
            this.createFireZone(pos, grenade.owner);
        }
    }

    createSmokeCloud(position) {
        const group = new THREE.Group();
        const sphereGeo = new THREE.SphereGeometry(1.6, 8, 8);
        const smokeMat = new THREE.MeshStandardMaterial({
            color: 0xCCCCCC,
            transparent: true,
            opacity: 0.82,
            roughness: 0.95
        });

        for (let i = 0; i < 9; i++) {
            const sphere = new THREE.Mesh(sphereGeo, smokeMat);
            sphere.position.set(
                position.x + (Math.random() - 0.5) * 3.0,
                position.y + 0.8 + Math.random() * 1.5,
                position.z + (Math.random() - 0.5) * 3.0
            );
            group.add(sphere);
        }

        this.scene.add(group);
        this.activeSmokes.push({ group, duration: 18.0 });
    }

    createFireZone(position, owner) {
        const group = new THREE.Group();
        const fireLight = new THREE.PointLight(0xFF6600, 2.0, 8);
        fireLight.position.set(position.x, position.y + 0.5, position.z);
        group.add(fireLight);

        const fireMat = new THREE.MeshBasicMaterial({ color: 0xFF4400 });
        for (let i = 0; i < 6; i++) {
            const mesh = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 5), fireMat);
            mesh.position.set(
                position.x + (Math.random() - 0.5) * 2.5,
                0.6,
                position.z + (Math.random() - 0.5) * 2.5
            );
            group.add(mesh);
        }

        this.scene.add(group);
        this.activeFires.push({ group, position, duration: 7.0, owner });
    }

    detonateC4(allEntities) {
        this.audio.playExplosion();
        for (const entity of allEntities) {
            entity.takeDamage(500, 1.0, false, null);
        }
        if (this.activePlantedC4?.mesh) {
            this.scene.remove(this.activePlantedC4.mesh);
        }
        this.activePlantedC4 = null;
        window.dispatchEvent(new CustomEvent('c4-detonated'));
    }
}

