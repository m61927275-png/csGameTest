// ============================================
// CS2 Web Game - Input Manager
// Pointer Lock, Mouse Look & Keyboard Controls
// ============================================

import { CONFIG } from '../config.js';

export class Input {
    constructor(domElement) {
        this.domElement = domElement;

        this.keys = new Map();
        this.keysPressed = new Map(); // Edge detection (true only on down frame)
        this.keysReleased = new Map();

        this.mouseDelta = { x: 0, y: 0 };
        this.mouseButtons = new Map();
        this.mousePressed = new Map();
        this.mouseReleased = new Map();
        this.scrollDelta = 0;

        this.isLocked = false;
        this.sensitivity = CONFIG.MOVEMENT.MOUSE_SENSITIVITY;

        this.onLockChangeCallbacks = [];
        this.onKeyDownCallbacks = [];
    }

    init() {
        // Pointer Lock events
        this.domElement.addEventListener('click', () => {
            if (!this.isLocked) {
                this.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.isLocked = document.pointerLockElement === this.domElement;
            this.onLockChangeCallbacks.forEach(cb => cb(this.isLocked));
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isLocked) {
                this.mouseDelta.x += e.movementX * this.sensitivity;
                this.mouseDelta.y += e.movementY * this.sensitivity;
            }
        });

        // Mouse buttons
        document.addEventListener('mousedown', (e) => {
            if (this.isLocked) {
                this.mouseButtons.set(e.button, true);
                this.mousePressed.set(e.button, true);
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (this.isLocked) {
                this.mouseButtons.set(e.button, false);
                this.mouseReleased.set(e.button, true);
            }
        });

        // Prevent right click menu
        this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

        // Mouse wheel for switching weapons
        document.addEventListener('wheel', (e) => {
            if (this.isLocked) {
                this.scrollDelta += Math.sign(e.deltaY);
            }
        });

        // Keyboard events
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (!this.keys.get(key)) {
                this.keysPressed.set(key, true);
            }
            this.keys.set(key, true);

            this.onKeyDownCallbacks.forEach(cb => cb(key, e));

            // Prevent space from scrolling page
            if ([' ', 'tab', 'e', 'b'].includes(key) && this.isLocked) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            this.keys.set(key, false);
            this.keysReleased.set(key, true);
        });
    }

    requestPointerLock() {
        this.domElement.requestPointerLock();
    }

    exitPointerLock() {
        if (document.exitPointerLock) {
            document.exitPointerLock();
        }
    }

    onLockChange(cb) {
        this.onLockChangeCallbacks.push(cb);
    }

    onKeyDown(cb) {
        this.onKeyDownCallbacks.push(cb);
    }

    isKeyDown(key) {
        return !!this.keys.get(key.toLowerCase());
    }

    wasKeyPressed(key) {
        return !!this.keysPressed.get(key.toLowerCase());
    }

    isMouseDown(button = 0) {
        return !!this.mouseButtons.get(button);
    }

    wasMousePressed(button = 0) {
        return !!this.mousePressed.get(button);
    }

    getMouseDelta() {
        const delta = { x: this.mouseDelta.x, y: this.mouseDelta.y };
        this.mouseDelta.x = 0;
        this.mouseDelta.y = 0;
        return delta;
    }

    getScroll() {
        const delta = this.scrollDelta;
        this.scrollDelta = 0;
        return delta;
    }

    update() {
        // Clear single-frame edge triggers
        this.keysPressed.clear();
        this.keysReleased.clear();
        this.mousePressed.clear();
        this.mouseReleased.clear();
    }
}

