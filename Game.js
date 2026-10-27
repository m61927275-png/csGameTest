// ============================================
// CS2 Web Game - Master Game Engine
// Integrates Renderer, Physics, Audio, Maps, AI & UI
// ============================================

import { CONFIG } from '../config.js';
import { WEAPONS, WEAPON_SLOTS } from '../data/weapons.js';
import { Player } from './Player.js';
import { Bot } from './Bot.js';
import { WeaponSystem } from './Weapon.js';
import { RoundManager } from './Round.js';
import { Dust2Map } from '../maps/Dust2.js';
import { MirageMap } from '../maps/Mirage.js';
import { InfernoMap } from '../maps/Inferno.js';

export class Game {
    constructor(renderer, input, physics, audio, hud) {
        this.renderer = renderer;
        this.input = input;
        this.physics = physics;
        this.audio = audio;
        this.hud = hud;

        this.scene = renderer.getScene();
        this.camera = renderer.getCamera();

        this.weaponSystem = new WeaponSystem(this.scene, this.physics, this.audio);
        this.roundManager = new RoundManager(this.audio);

        this.player = null;
        this.bots = [];
        this.currentMap = null;
        this.mapName = 'dust2';
        this.isRunning = false;

        // Attach viewmodel container to camera
        this.camera.add(new THREE.Group()); // holder
        this.lastTime = performance.now();

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // Round start reset
        window.addEventListener('reset-round-positions', () => {
            this.resetPositions();
        });

        // Respawn event (for deathmatch)
        window.addEventListener('respawn-player', (e) => {
            const p = e.detail.player;
            const spawns = p.team === 'ct' ? this.currentMap.ctSpawns : this.currentMap.tSpawns;
            const spawn = spawns[Math.floor(Math.random() * spawns.length)];
            p.respawn(spawn);
        });

        // Keyboard triggers
        this.input.onKeyDown((key) => {
            if (!this.isRunning) return;

            // Buy Menu (B)
            if (key === 'b') {
                if (this.roundManager.phase === 'freeze' || this.roundManager.gameMode === CONFIG.MODES.DEATHMATCH) {
                    this.hud.toggleBuyMenu(this.player);
                }
            }

            // Reload (R)
            if (key === 'r') {
                if (this.player.startReload()) {
                    this.audio.playReload();
                }
            }

            // Weapon Slots (1-5)
            if (key === '1') this.player.switchWeapon(WEAPON_SLOTS.PRIMARY);
            if (key === '2') this.player.switchWeapon(WEAPON_SLOTS.PISTOL);
            if (key === '3') this.player.switchWeapon(WEAPON_SLOTS.KNIFE);
            if (key === '4') this.player.switchWeapon(WEAPON_SLOTS.GRENADE);
            if (key === '5') this.player.switchWeapon(WEAPON_SLOTS.EQUIPMENT);

            // Quick Switch (Q)
            if (key === 'q') this.player.quickSwitch();

            // Inspect Weapon (F)
            if (key === 'f') this.player.inspectTimer = 2.0;

            // Bomb Plant / Defuse (E)
            if (key === 'e') this.handleInteraction();
        });
    }

    start(mapName = 'dust2', mode = CONFIG.MODES.COMPETITIVE, botCount = 9, difficulty = 'NORMAL') {
        this.mapName = mapName;
        this.renderer.setSkyTheme(mapName);

        // Load chosen map
        this.loadMap(mapName);

        // Create Local Human Player (Default on CT)
        this.player = new Player('You', 'ct');
        this.camera.add(this.player.viewmodel);
        this.scene.add(this.camera);

        // Spawn Bots (split evenly between CT and T)
        this.spawnBots(botCount, difficulty);

        // Reset round and start match
        this.roundManager.startMatch(mode);
        this.resetPositions();

        this.isRunning = true;
        this.lastTime = performance.now();
        this.animate();
    }

    loadMap(name) {
        if (this.currentMap?.group) {
            this.scene.remove(this.currentMap.group);
        }

        if (name === 'mirage') {
            this.currentMap = new MirageMap(this.scene, this.physics);
        } else if (name === 'inferno') {
            this.currentMap = new InfernoMap(this.scene, this.physics);
        } else {
            this.currentMap = new Dust2Map(this.scene, this.physics);
        }

        this.currentMap.build();
    }

    spawnBots(count, difficulty) {
        // Clear previous bots
        for (const b of this.bots) {
            b.dispose();
        }
        this.bots = [];

        // Half CT allies, Half T enemies
        const ctCount = Math.floor(count / 2);
        const tCount = Math.ceil(count / 2);

        const botNamesCT = ['S1mple', 'Device', 'NiKo', 'ZywOo', 'M0NESY'];
        const botNamesT = ['FalleN', 'Stewie2K', 'Shroud', 'KennyS', 'Olofmeister'];

        // CT Ally Bots
        for (let i = 0; i < ctCount; i++) {
            const name = botNamesCT[i % botNamesCT.length];
            const bot = new Bot(name, 'ct', difficulty, this.scene);
            bot.setMapWaypoints(this.currentMap.waypoints);
            this.bots.push(bot);
        }

        // T Enemy Bots
        for (let i = 0; i < tCount; i++) {
            const name = botNamesT[i % botNamesT.length];
            const bot = new Bot(name, 't', difficulty, this.scene);
            bot.setMapWaypoints(this.currentMap.waypoints);
            this.bots.push(bot);
        }
    }

    resetPositions() {
        // Spawn CTs
        const ctSpawns = this.currentMap.ctSpawns;
        const tSpawns = this.currentMap.tSpawns;

        if (this.player.team === 'ct') {
            this.player.respawn(ctSpawns[0]);
        } else {
            this.player.respawn(tSpawns[0]);
        }

        let ctIndex = 1;
        let tIndex = 1;

        for (const bot of this.bots) {
            if (bot.team === 'ct') {
                const spawn = ctSpawns[ctIndex % ctSpawns.length];
                bot.respawn(spawn);
                ctIndex++;
            } else {
                const spawn = tSpawns[tIndex % tSpawns.length];
                bot.respawn(spawn);
                tIndex++;
            }
        }
    }

    animate() {
        if (!this.isRunning) return;
        requestAnimationFrame(() => this.animate());

        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.1);
        this.lastTime = now;

        this.update(dt);
        this.renderer.render();
    }

    update(dt) {
        const allEntities = [this.player, ...this.bots];

        // 1. Process Local Player Input & Movement
        if (this.input.isLocked && this.player.isAlive) {
            this.handlePlayerLook();
            this.handlePlayerMovement(dt);
            this.handlePlayerWeapons(dt, allEntities);
        }

        this.player.update(dt);

        // 2. Process Bots AI
        for (const bot of this.bots) {
            bot.updateAI(dt, allEntities, this.physics, this.weaponSystem, this.audio);
        }

        // 3. Process Ballistics, Grenades & C4
        this.weaponSystem.update(dt, allEntities, this.camera);

        // 4. Process Match / Round Flow
        this.roundManager.update(dt, allEntities, this.weaponSystem.activePlantedC4);

        // 5. Update HUD
        this.hud.update(dt, this.player, this.roundManager, allEntities, this.currentMap);

        // Scoreboard toggle with Tab key
        if (this.input.isKeyDown('tab') !== this.hud.scoreboardOpen) {
            this.hud.toggleScoreboard(this.input.isKeyDown('tab'), allEntities);
        }

        // Mouse scroll for weapon cycling
        const scroll = this.input.getScroll();
        if (scroll !== 0) {
            const nextSlot = (this.player.currentSlot + Math.sign(scroll) + 5) % 5;
            this.player.switchWeapon(nextSlot);
        }

        this.input.update();
    }

    handlePlayerLook() {
        const delta = this.input.getMouseDelta();
        this.player.rotation.y -= delta.x;
        this.player.rotation.x -= delta.y;

        // Clamp vertical look (pitch)
        this.player.rotation.x = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, this.player.rotation.x));

        // Apply rotation to Camera
        this.camera.rotation.set(this.player.rotation.x, this.player.rotation.y, 0, 'YXZ');
    }

    handlePlayerMovement(dt) {
        // Freeze time restriction
        if (this.roundManager.phase === 'freeze') {
            this.player.velocity.set(0, 0, 0);
            return;
        }

        // Walking / Running / Crouching speeds
        this.player.isWalking = this.input.isKeyDown('shift');
        this.player.isCrouching = this.input.isKeyDown('control');

        let speed = CONFIG.MOVEMENT.RUN_SPEED;
        if (this.player.isCrouching) speed = CONFIG.MOVEMENT.CROUCH_SPEED;
        else if (this.player.isWalking) speed = CONFIG.MOVEMENT.WALK_SPEED;

        // Snipers move slower when scoped
        if (this.player.isScoped) speed *= 0.6;

        // Forward / Strafe movement vectors relative to camera look
        const moveVector = new THREE.Vector3();
        if (this.input.isKeyDown('w')) moveVector.z -= 1;
        if (this.input.isKeyDown('s')) moveVector.z += 1;
        if (this.input.isKeyDown('a')) moveVector.x -= 1;
        if (this.input.isKeyDown('d')) moveVector.x += 1;

        if (moveVector.lengthSq() > 0) {
            moveVector.normalize();
            // Apply yaw rotation
            moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.rotation.y);

            // CS source-style acceleration
            this.player.velocity.x += moveVector.x * speed * CONFIG.MOVEMENT.ACCELERATION * dt;
            this.player.velocity.z += moveVector.z * speed * CONFIG.MOVEMENT.ACCELERATION * dt;

            // Footstep audio
            this.audio.playFootstep('concrete');
        }

        // Ground friction
        const friction = this.player.isOnGround ? CONFIG.PHYSICS.FRICTION : CONFIG.PHYSICS.AIR_FRICTION;
        this.player.velocity.x *= Math.pow(friction, dt * 60);
        this.player.velocity.z *= Math.pow(friction, dt * 60);

        // Jump (Space)
        if (this.input.wasKeyPressed(' ') && this.player.isOnGround) {
            this.player.velocity.y = CONFIG.PHYSICS.JUMP_FORCE;
            this.player.isOnGround = false;
        }

        // Gravity
        this.player.velocity.y += CONFIG.PHYSICS.GRAVITY * dt;

        // Move entity with swept AABB and wall sliding
        const height = this.player.isCrouching ? CONFIG.PHYSICS.CROUCH_HEIGHT : CONFIG.PHYSICS.PLAYER_HEIGHT;
        const result = this.physics.moveEntity(this.player.position, this.player.velocity, CONFIG.PHYSICS.PLAYER_RADIUS, height, dt);

        this.player.isOnGround = result.onGround;

        // Camera position follows player eye height
        this.camera.position.copy(this.player.position);
        this.camera.position.y += height * 0.92;
    }

    handlePlayerWeapons(dt, allEntities) {
        const weapon = this.player.getWeaponData();
        const enemies = allEntities.filter(e => e.team !== this.player.team);

        // Left Click: Shoot or Throw Grenade
        const isShooting = weapon.automatic ? this.input.isMouseDown(0) : this.input.wasMousePressed(0);

        if (isShooting && this.roundManager.phase !== 'freeze') {
            if (weapon.type === 'grenade') {
                this.weaponSystem.throwGrenade(this.player, this.camera, weapon.id);
                // Remove grenade from inventory
                this.player.inventory[WEAPON_SLOTS.GRENADE] = null;
                this.player.switchWeapon(WEAPON_SLOTS.PISTOL);
            } else {
                const shotResult = this.weaponSystem.shoot(this.player, this.camera, enemies);
                if (shotResult?.hits?.length > 0) {
                    this.hud.triggerHitmarker();
                    for (const hit of shotResult.hits) {
                        if (hit.killed) {
                            this.hud.addKillfeedEntry(this.player, hit.entity, weapon.id, hit.headshot);
                        }
                    }
                }
            }
        }

        // Right Click: Scoping / Zoom for Snipers & Silencer / Burst toggle
        if (this.input.wasMousePressed(2)) {
            if (weapon.scope) {
                this.player.isScoped = !this.player.isScoped;
                this.camera.fov = this.player.isScoped ? (weapon.scopeZoom ? 90 / weapon.scopeZoom : 40) : CONFIG.RENDER.FOV;
                this.camera.updateProjectionMatrix();
            }
        }
    }

    handleInteraction() {
        // E key: Plant C4 if on Bomb site, or Defuse planted C4
        if (this.player.team === 't' && this.player.inventory[WEAPON_SLOTS.EQUIPMENT] === 'c4') {
            // Check if player is on Bombsite A or B
            for (const site of Object.values(this.currentMap.bombSites)) {
                if (this.player.position.distanceTo(site.center) <= site.radius) {
                    this.weaponSystem.plantC4(this.player, this.player.position);
                    this.player.inventory[WEAPON_SLOTS.EQUIPMENT] = null;
                    return;
                }
            }
        }

        // Defuse logic for CT
        if (this.player.team === 'ct' && this.weaponSystem.activePlantedC4) {
            const dist = this.player.position.distanceTo(this.weaponSystem.activePlantedC4.mesh.position);
            if (dist < 3.0) {
                this.weaponSystem.activePlantedC4.isDefused = true;
                this.audio.playRadio('Bomb has been defused');
            }
        }
    }
}

