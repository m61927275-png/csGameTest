// ============================================
// CS2 Web Game - Physics Engine
// Source-style Movement, Collisions & Raycasting
// ============================================

import { CONFIG } from '../config.js';

export class Physics {
    constructor(colliders = []) {
        this.colliders = colliders; // Array of THREE.Box3
        this.raycaster = new THREE.Raycaster();
        this.gravity = CONFIG.PHYSICS.GRAVITY;
    }

    setColliders(colliders) {
        this.colliders = colliders;
    }

    addCollider(box3) {
        this.colliders.push(box3);
    }

    /**
     * Check if a point/box intersects with any world collider
     */
    checkCollision(box) {
        for (let i = 0; i < this.colliders.length; i++) {
            if (box.intersectsBox(this.colliders[i])) {
                return this.colliders[i];
            }
        }
        return null;
    }

    /**
     * Move an entity (player / bot) with swept AABB and wall sliding
     */
    moveEntity(position, velocity, radius, height, dt) {
        const stepHeight = CONFIG.PHYSICS.STEP_HEIGHT;
        const currentPos = position.clone();
        const targetPos = currentPos.clone().addScaledVector(velocity, dt);

        // Resolve X axis
        let testBoxX = new THREE.Box3(
            new THREE.Vector3(targetPos.x - radius, currentPos.y, currentPos.z - radius),
            new THREE.Vector3(targetPos.x + radius, currentPos.y + height, currentPos.z + radius)
        );

        let hitX = this.checkCollision(testBoxX);
        if (hitX) {
            // Try step-up
            let stepBoxX = new THREE.Box3(
                new THREE.Vector3(targetPos.x - radius, currentPos.y + stepHeight, currentPos.z - radius),
                new THREE.Vector3(targetPos.x + radius, currentPos.y + height + stepHeight, currentPos.z + radius)
            );
            if (!this.checkCollision(stepBoxX)) {
                currentPos.y += stepHeight * 0.5;
                currentPos.x = targetPos.x;
            } else {
                velocity.x = 0; // slide along Y/Z
            }
        } else {
            currentPos.x = targetPos.x;
        }

        // Resolve Z axis
        let testBoxZ = new THREE.Box3(
            new THREE.Vector3(currentPos.x - radius, currentPos.y, targetPos.z - radius),
            new THREE.Vector3(currentPos.x + radius, currentPos.y + height, targetPos.z + radius)
        );

        let hitZ = this.checkCollision(testBoxZ);
        if (hitZ) {
            // Try step-up
            let stepBoxZ = new THREE.Box3(
                new THREE.Vector3(currentPos.x - radius, currentPos.y + stepHeight, targetPos.z - radius),
                new THREE.Vector3(currentPos.x + radius, currentPos.y + height + stepHeight, targetPos.z + radius)
            );
            if (!this.checkCollision(stepBoxZ)) {
                currentPos.y += stepHeight * 0.5;
                currentPos.z = targetPos.z;
            } else {
                velocity.z = 0; // slide along X/Y
            }
        } else {
            currentPos.z = targetPos.z;
        }

        // Resolve Y axis (gravity / jumping)
        const newY = currentPos.y + velocity.y * dt;
        let testBoxY = new THREE.Box3(
            new THREE.Vector3(currentPos.x - radius, newY, currentPos.z - radius),
            new THREE.Vector3(currentPos.x + radius, newY + height, currentPos.z + radius)
        );

        const hitY = this.checkCollision(testBoxY);
        let onGround = false;

        if (hitY) {
            if (velocity.y < 0) {
                // Landed on floor/box
                currentPos.y = hitY.max.y;
                velocity.y = 0;
                onGround = true;
            } else if (velocity.y > 0) {
                // Hit ceiling
                currentPos.y = hitY.min.y - height;
                velocity.y = 0;
            }
        } else {
            currentPos.y = newY;
            if (currentPos.y <= CONFIG.PHYSICS.GROUND_LEVEL) {
                currentPos.y = CONFIG.PHYSICS.GROUND_LEVEL;
                velocity.y = 0;
                onGround = true;
            }
        }

        position.copy(currentPos);
        return { position: currentPos, velocity, onGround };
    }

    /**
     * Check if entity is on ground
     */
    isOnGround(position, radius, height) {
        if (position.y <= CONFIG.PHYSICS.GROUND_LEVEL + 0.05) return true;

        const feetBox = new THREE.Box3(
            new THREE.Vector3(position.x - radius * 0.8, position.y - 0.1, position.z - radius * 0.8),
            new THREE.Vector3(position.x + radius * 0.8, position.y + 0.05, position.z + radius * 0.8)
        );

        for (let i = 0; i < this.colliders.length; i++) {
            if (feetBox.intersectsBox(this.colliders[i])) {
                return true;
            }
        }
        return false;
    }

    /**
     * Raycast for shooting and line-of-sight checks
     */
    raycast(origin, direction, maxDistance = 300, objectsToTest = []) {
        this.raycaster.set(origin, direction.normalize());
        this.raycaster.far = maxDistance;

        const hits = this.raycaster.intersectObjects(objectsToTest, true);
        if (hits.length > 0) {
            return {
                hit: true,
                point: hits[0].point,
                distance: hits[0].distance,
                normal: hits[0].face ? hits[0].face.normal : new THREE.Vector3(0, 1, 0),
                object: hits[0].object
            };
        }

        return {
            hit: false,
            point: origin.clone().addScaledVector(direction, maxDistance),
            distance: maxDistance,
            normal: new THREE.Vector3(0, 1, 0),
            object: null
        };
    }

    /**
     * Line of sight check between two points
     */
    hasLineOfSight(from, to, obstacles) {
        const dir = to.clone().sub(from);
        const dist = dir.length();
        dir.normalize();

        this.raycaster.set(from, dir);
        this.raycaster.far = dist;

        const hits = this.raycaster.intersectObjects(obstacles, true);
        return hits.length === 0;
    }
}

