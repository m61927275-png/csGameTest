// ============================================
// CS2 Web Game - Bot AI (Allies & Enemies)
// Waypoint navigation, sight raycast, smart combat & economy
// ============================================

import { CONFIG } from '../config.js';
import { WEAPONS, WEAPON_SLOTS } from '../data/weapons.js';
import { ModelFactory } from '../engine/Models.js';
import { Player } from './Player.js';

export class Bot extends Player {
    constructor(name, team, difficulty = 'NORMAL', scene) {
        super(name, team);
        this.difficultyName = difficulty;
        this.difficulty = CONFIG.BOT_DIFFICULTY[difficulty] || CONFIG.BOT_DIFFICULTY.NORMAL;
        this.scene = scene;

        // Bot AI states: 'patrol', 'combat', 'retreat', 'plant', 'defuse'
        this.state = 'patrol';
        this.target = null;
        this.targetLastKnownPos = null;
        this.reactionTimer = 0;
        this.shootTimer = 0;
        this.burstCount = 0;
        this.strafeDirection = 1;
        this.strafeTimer = 0;

        // Navigation
        this.currentWaypointIndex = 0;
        this.waypoints = [];
        this.path = [];

        // 3D Visual Mesh
        this.mesh = team === 'ct' ? ModelFactory.createCTModel() : ModelFactory.createTModel();
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);

        // Name tag / icon for allies
        this.nameTag = null;
    }

    setMapWaypoints(waypoints) {
        this.waypoints = waypoints || [];
        this.findNearestWaypoint();
    }

    findNearestWaypoint() {
        if (!this.waypoints.length) return;
        let minDist = Infinity;
        let nearestIdx = 0;

        for (let i = 0; i < this.waypoints.length; i++) {
            const dist = this.position.distanceTo(this.waypoints[i].pos);
            if (dist < minDist) {
                minDist = dist;
                nearestIdx = i;
            }
        }
        this.currentWaypointIndex = nearestIdx;
    }

    autoBuy() {
        if (this.money >= 1000) {
            this.buyWeapon('kevlarhelmet');
        } else if (this.money >= 650) {
            this.buyWeapon('kevlar');
        }

        if (this.team === 'ct' && this.money >= 400 && !this.inventory[WEAPON_SLOTS.EQUIPMENT]) {
            this.buyWeapon('defusekit');
        }

        // Buy Primary Weapon based on money & team
        if (this.team === 't') {
            if (this.money >= 4750 && Math.random() > 0.6) this.buyWeapon('awp');
            else if (this.money >= 2700) this.buyWeapon('ak47');
            else if (this.money >= 1800) this.buyWeapon('galil');
            else if (this.money >= 1050) this.buyWeapon('mac10');
            else if (this.money >= 700) this.buyWeapon('deagle');
        } else {
            if (this.money >= 4750 && Math.random() > 0.6) this.buyWeapon('awp');
            else if (this.money >= 3100) this.buyWeapon('m4a4');
            else if (this.money >= 2050) this.buyWeapon('famas');
            else if (this.money >= 1250) this.buyWeapon('mp9');
            else if (this.money >= 700) this.buyWeapon('deagle');
        }

        // Buy Grenades
        if (this.money >= 300) {
            this.buyWeapon('hegrenade');
        }
        if (this.money >= 200) {
            this.buyWeapon('flashbang');
        }
    }

    updateAI(dt, allEntities, physics, weaponSystem, audio) {
        if (!this.isAlive) {
            if (this.mesh.visible) {
                this.mesh.visible = false;
            }
            return;
        }

        this.mesh.visible = true;
        super.update(dt);

        // Find potential enemies
        const enemies = allEntities.filter(e => e.isAlive && e.team !== this.team);
        const visibleEnemy = this.scanForEnemies(enemies, physics);

        if (visibleEnemy) {
            if (this.target !== visibleEnemy) {
                this.target = visibleEnemy;
                this.reactionTimer = this.difficulty.reactionTime / 1000;
            }
            this.targetLastKnownPos = visibleEnemy.position.clone();
            this.state = 'combat';
        } else if (this.state === 'combat') {
            // Target lost, continue search near last known position
            if (this.targetLastKnownPos && this.position.distanceTo(this.targetLastKnownPos) < 4) {
                this.target = null;
                this.targetLastKnownPos = null;
                this.state = 'patrol';
            }
        }

        // Execute behavior
        switch (this.state) {
            case 'combat':
                this.handleCombat(dt, physics, weaponSystem, audio);
                break;
            case 'patrol':
            default:
                this.handlePatrol(dt, physics);
                break;
        }

        // Synchronize 3D mesh position and rotation
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.rotation.y;
    }

    scanForEnemies(enemies, physics) {
        const eyePos = this.position.clone();
        eyePos.y += 1.5;

        for (const enemy of enemies) {
            const enemyEyePos = enemy.position.clone();
            enemyEyePos.y += 1.5;

            const dist = eyePos.distanceTo(enemyEyePos);
            if (dist > 80) continue;

            // Check field of view (120 degrees forward)
            const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
            const toEnemy = enemyEyePos.clone().sub(eyePos).normalize();
            const angle = forward.angleTo(toEnemy);

            if (angle < Math.PI * 0.45) {
                // Raycast line of sight
                const hit = physics.raycast(eyePos, toEnemy, dist, physics.colliders);
                // If no blocking wall between bot and enemy
                if (hit.distance >= dist - 0.5) {
                    return enemy;
                }
            }
        }
        return null;
    }

    handleCombat(dt, physics, weaponSystem, audio) {
        if (!this.target || !this.target.isAlive) {
            this.target = null;
            this.state = 'patrol';
            return;
        }

        const eyePos = this.position.clone();
        eyePos.y += 1.5;
        const targetEye = this.target.position.clone();
        targetEye.y += 1.5;

        // Smoothly aim toward enemy
        const toTarget = targetEye.clone().sub(eyePos);
        const targetYaw = Math.atan2(-toTarget.x, -toTarget.z);
        const angleDiff = targetYaw - this.rotation.y;
        this.rotation.y += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), this.difficulty.aimSpeed * 40 * dt);

        // Counter-strafing during firefight
        this.strafeTimer -= dt;
        if (this.strafeTimer <= 0) {
            this.strafeDirection = Math.random() > 0.5 ? 1 : -1;
            this.strafeTimer = 0.5 + Math.random() * 0.8;
        }

        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
        this.velocity.x = right.x * this.strafeDirection * 2.5;
        this.velocity.z = right.z * this.strafeDirection * 2.5;

        // Move entity
        physics.moveEntity(this.position, this.velocity, CONFIG.PHYSICS.PLAYER_RADIUS, CONFIG.PHYSICS.PLAYER_HEIGHT, dt);

        // Reaction delay before firing
        if (this.reactionTimer > 0) {
            this.reactionTimer -= dt;
            return;
        }

        // Fire weapon at target
        this.shootTimer -= dt;
        if (this.shootTimer <= 0) {
            const weapon = this.getWeaponData();
            if (this.ammoInMag.get(weapon.id) <= 0) {
                this.startReload();
                audio.playReload();
                this.shootTimer = weapon.reloadTime || 2.5;
                return;
            }

            // Accuracy spread based on bot difficulty
            const spreadFactor = (1 - this.difficulty.accuracy) * 0.08;
            const aimDir = toTarget.clone().normalize();
            aimDir.x += (Math.random() - 0.5) * spreadFactor;
            aimDir.y += (Math.random() - 0.5) * spreadFactor;
            aimDir.z += (Math.random() - 0.5) * spreadFactor;
            aimDir.normalize();

            // Fire shot
            const currentAmmo = this.ammoInMag.get(weapon.id) || 1;
            this.ammoInMag.set(weapon.id, currentAmmo - 1);
            audio.playShot(weapon);

            // Hitscan check against enemy
            const isHeadshot = Math.random() < (this.difficulty.accuracy * 0.35);
            const dist = toTarget.length();
            const dmgResult = this.target.takeDamage(weapon.damage, weapon.armorPen || 0.5, isHeadshot, this);

            if (dmgResult.killed) {
                audio.playDeath?.();
                this.target = null;
                this.state = 'patrol';
            }

            this.shootTimer = weapon.fireRate || 0.12;
        }
    }

    handlePatrol(dt, physics) {
        if (!this.waypoints.length) return;

        const currentWp = this.waypoints[this.currentWaypointIndex];
        if (!currentWp) return;

        const targetPos = currentWp.pos;
        const toWp = targetPos.clone().sub(this.position);
        toWp.y = 0;
        const dist = toWp.length();

        if (dist < 2.0) {
            // Next waypoint along connections
            if (currentWp.connections && currentWp.connections.length > 0) {
                const nextId = currentWp.connections[Math.floor(Math.random() * currentWp.connections.length)];
                const nextIdx = this.waypoints.findIndex(w => w.id === nextId);
                if (nextIdx !== -1) {
                    this.currentWaypointIndex = nextIdx;
                }
            } else {
                this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
            }
            return;
        }

        toWp.normalize();
        this.rotation.y = Math.atan2(-toWp.x, -toWp.z);

        const moveSpeed = CONFIG.MOVEMENT.RUN_SPEED * 0.75;
        this.velocity.x = toWp.x * moveSpeed;
        this.velocity.z = toWp.z * moveSpeed;

        physics.moveEntity(this.position, this.velocity, CONFIG.PHYSICS.PLAYER_RADIUS, CONFIG.PHYSICS.PLAYER_HEIGHT, dt);
    }

    respawn(spawnPos) {
        super.respawn(spawnPos);
        this.state = 'patrol';
        this.target = null;
        this.targetLastKnownPos = null;
        this.mesh.position.copy(this.position);
        this.mesh.visible = true;
        this.findNearestWaypoint();
        this.autoBuy();
    }

    dispose() {
        if (this.mesh && this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
    }
}

