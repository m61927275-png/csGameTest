// ============================================
// CS2 Web Game - Player Entity
// Health, Armor, Inventory, Weapons, Viewmodel & Damage
// ============================================

import { CONFIG } from '../config.js';
import { WEAPONS, WEAPON_SLOTS } from '../data/weapons.js';
import { ModelFactory } from '../engine/Models.js';

export class Player {
    constructor(name = 'Player', team = 'ct') {
        this.name = name;
        this.team = team;

        // Vital stats
        this.health = 100;
        this.maxHealth = 100;
        this.armor = 0;
        this.hasHelmet = false;
        this.money = CONFIG.GAME.START_MONEY;
        this.isAlive = true;

        // Match statistics
        this.kills = 0;
        this.deaths = 0;
        this.assists = 0;
        this.mvps = 0;
        this.score = 0;

        // Position & Physics
        this.position = new THREE.Vector3(0, CONFIG.PHYSICS.PLAYER_HEIGHT, 0);
        this.velocity = new THREE.Vector3();
        this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
        this.isCrouching = false;
        this.isWalking = false;
        this.isOnGround = true;

        // Inventory [0: Primary, 1: Secondary, 2: Knife, 3: Grenade, 4: Equipment/C4]
        this.inventory = {
            [WEAPON_SLOTS.PRIMARY]: null,
            [WEAPON_SLOTS.PISTOL]: team === 'ct' ? 'usp' : 'glock',
            [WEAPON_SLOTS.KNIFE]: 'knife',
            [WEAPON_SLOTS.GRENADE]: null,
            [WEAPON_SLOTS.EQUIPMENT]: null
        };
        this.grenadePouch = []; // Store multiple grenades up to 4

        // Active weapon state
        this.currentSlot = WEAPON_SLOTS.PISTOL;
        this.currentWeapon = this.inventory[this.currentSlot];
        this.lastWeaponSlot = WEAPON_SLOTS.KNIFE;
        this.ammoInMag = new Map();
        this.ammoReserve = new Map();
        this.isReloading = false;
        this.reloadTimer = 0;
        this.lastShotTime = 0;
        this.drawTimer = 0;
        this.inspectTimer = 0;

        // Scoping / Zoom
        this.isScoped = false;
        this.zoomLevel = 1;

        // Recoil tracking
        this.recoilPitch = 0;
        this.recoilYaw = 0;
        this.continuousShots = 0;

        // Viewmodel mesh container
        this.viewmodel = new THREE.Group();
        this.viewmodel.name = 'Viewmodel';
        this.initAmmo();
    }

    initAmmo() {
        for (const [id, data] of Object.entries(WEAPONS)) {
            if (data.magazine) {
                this.ammoInMag.set(id, data.magazine);
                this.ammoReserve.set(id, data.reserve);
            }
        }
    }

    getWeaponData() {
        return WEAPONS[this.currentWeapon] || WEAPONS.knife;
    }

    switchWeapon(slot) {
        if (this.currentSlot === slot && this.currentWeapon) return;

        let targetWeapon = this.inventory[slot];
        if (slot === WEAPON_SLOTS.GRENADE && this.grenadePouch.length > 0) {
            targetWeapon = this.grenadePouch[0];
        }

        if (!targetWeapon) return;

        this.lastWeaponSlot = this.currentSlot;
        this.currentSlot = slot;
        this.currentWeapon = targetWeapon;
        this.isReloading = false;
        this.isScoped = false;
        this.zoomLevel = 1;
        this.drawTimer = 0.45; // Switch delay
        this.continuousShots = 0;

        this.updateViewmodelMesh();
    }

    quickSwitch() {
        if (this.inventory[this.lastWeaponSlot]) {
            this.switchWeapon(this.lastWeaponSlot);
        }
    }

    updateViewmodelMesh() {
        // Clear previous weapon model from viewmodel
        while (this.viewmodel.children.length > 0) {
            this.viewmodel.remove(this.viewmodel.children[0]);
        }

        if (!this.currentWeapon) return;

        const weaponMesh = ModelFactory.createWeaponModel(this.currentWeapon);
        // Position weapon in hands relative to camera
        const isSniper = this.getWeaponData().type === 'sniper';
        const isPistol = this.getWeaponData().type === 'pistol';
        const isKnife = this.currentWeapon === 'knife';

        if (isKnife) {
            weaponMesh.position.set(0.24, -0.22, -0.45);
            weaponMesh.rotation.set(0.1, -0.2, 0.1);
        } else if (isPistol) {
            weaponMesh.position.set(0.22, -0.2, -0.42);
            weaponMesh.rotation.set(0.05, -0.05, 0);
        } else if (isSniper) {
            weaponMesh.position.set(0.25, -0.25, -0.55);
            weaponMesh.rotation.set(0.04, -0.08, 0);
        } else {
            // Rifles / SMGs
            weaponMesh.position.set(0.26, -0.22, -0.48);
            weaponMesh.rotation.set(0.05, -0.1, 0);
        }

        this.viewmodel.add(weaponMesh);
    }

    canBuy(weaponId) {
        const weapon = WEAPONS[weaponId];
        if (!weapon) return { success: false, reason: 'Invalid weapon' };
        if (this.money < weapon.price) return { success: false, reason: 'Not enough money' };
        if (weapon.team !== 'both' && weapon.team !== this.team) {
            return { success: false, reason: 'Team restricted' };
        }
        return { success: true };
    }

    buyWeapon(weaponId) {
        const check = this.canBuy(weaponId);
        if (!check.success) return check;

        const weapon = WEAPONS[weaponId];
        this.money -= weapon.price;

        if (weapon.slot === WEAPON_SLOTS.GRENADE) {
            if (this.grenadePouch.length < 4) {
                this.grenadePouch.push(weaponId);
                this.inventory[WEAPON_SLOTS.GRENADE] = weaponId;
                this.switchWeapon(WEAPON_SLOTS.GRENADE);
            }
        } else if (weapon.id === 'kevlar') {
            this.armor = 100;
        } else if (weapon.id === 'kevlarhelmet') {
            this.armor = 100;
            this.hasHelmet = true;
        } else if (weapon.id === 'defusekit') {
            this.inventory[WEAPON_SLOTS.EQUIPMENT] = 'defusekit';
        } else {
            // Primary or Secondary
            this.inventory[weapon.slot] = weaponId;
            this.ammoInMag.set(weaponId, weapon.magazine);
            this.ammoReserve.set(weaponId, weapon.reserve);
            this.switchWeapon(weapon.slot);
        }

        return { success: true };
    }

    takeDamage(amount, armorPen = 0.5, isHeadshot = false, attacker = null) {
        if (!this.isAlive) return { killed: false, damageDealt: 0 };

        let finalDamage = amount;
        if (isHeadshot) {
            finalDamage *= CONFIG.GAME.HEADSHOT_MULTIPLIER;
            if (this.hasHelmet) {
                finalDamage *= (1 - (1 - armorPen) * 0.5);
                this.armor = Math.max(0, this.armor - 15);
            }
        } else {
            if (this.armor > 0) {
                const armorAbsorb = finalDamage * (1 - armorPen) * 0.5;
                const healthDamage = finalDamage - armorAbsorb;
                this.armor = Math.max(0, this.armor - (armorAbsorb * 0.5));
                finalDamage = healthDamage;
            }
        }

        finalDamage = Math.round(finalDamage);
        this.health -= finalDamage;

        let killed = false;
        if (this.health <= 0) {
            this.health = 0;
            this.isAlive = false;
            this.deaths++;
            killed = true;
            if (attacker) {
                attacker.kills++;
                attacker.score += isHeadshot ? 3 : 2;
                const reward = this.getWeaponData().killReward || CONFIG.GAME.KILL_REWARD_DEFAULT;
                attacker.money = Math.min(CONFIG.GAME.MAX_MONEY, attacker.money + reward);
            }
        }

        return { killed, damageDealt: finalDamage, isHeadshot };
    }

    respawn(spawnPosition) {
        this.health = 100;
        this.isAlive = true;
        this.isReloading = false;
        this.isScoped = false;
        this.zoomLevel = 1;
        this.position.copy(spawnPosition);
        this.position.y += CONFIG.PHYSICS.PLAYER_HEIGHT;
        this.velocity.set(0, 0, 0);

        // Reset ammo for carried weapons
        for (const slot of Object.values(this.inventory)) {
            if (slot && WEAPONS[slot]?.magazine) {
                this.ammoInMag.set(slot, WEAPONS[slot].magazine);
                this.ammoReserve.set(slot, WEAPONS[slot].reserve);
            }
        }

        this.updateViewmodelMesh();
    }

    update(dt) {
        if (!this.isAlive) return;

        if (this.drawTimer > 0) {
            this.drawTimer -= dt;
        }

        if (this.inspectTimer > 0) {
            this.inspectTimer -= dt;
        }

        if (this.isReloading) {
            this.reloadTimer -= dt;
            if (this.reloadTimer <= 0) {
                this.finishReload();
            }
        }

        // Decay recoil recovery
        this.recoilPitch = Math.max(0, this.recoilPitch - dt * 1.5);
        this.recoilYaw *= Math.max(0, 1 - dt * 8);

        // Weapon bobbing animation when moving
        const speed = this.velocity.length();
        if (speed > 0.5 && this.isOnGround) {
            const time = performance.now() * 0.008;
            const bobX = Math.cos(time) * 0.012;
            const bobY = Math.abs(Math.sin(time)) * 0.015;
            this.viewmodel.position.set(bobX, -bobY, 0);
        } else {
            this.viewmodel.position.set(0, 0, 0);
        }
    }

    startReload() {
        const weapon = this.getWeaponData();
        if (!weapon.magazine) return false;
        const currentInMag = this.ammoInMag.get(weapon.id) || 0;
        const currentReserve = this.ammoReserve.get(weapon.id) || 0;

        if (currentInMag >= weapon.magazine || currentReserve <= 0 || this.isReloading) {
            return false;
        }

        this.isReloading = true;
        this.reloadTimer = weapon.reloadTime || 2.5;
        this.isScoped = false;
        this.zoomLevel = 1;
        return true;
    }

    finishReload() {
        const weapon = this.getWeaponData();
        const currentInMag = this.ammoInMag.get(weapon.id) || 0;
        const currentReserve = this.ammoReserve.get(weapon.id) || 0;
        const needed = weapon.magazine - currentInMag;
        const toLoad = Math.min(needed, currentReserve);

        this.ammoInMag.set(weapon.id, currentInMag + toLoad);
        this.ammoReserve.set(weapon.id, currentReserve - toLoad);
        this.isReloading = false;
    }
}

