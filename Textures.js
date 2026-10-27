// ============================================
// CS2 Web Game - Procedural Texture Generator
// Creates high-res PBR textures using Canvas
// No external downloads needed - 100% self-contained!
// ============================================

export class TextureGenerator {
    static cache = new Map();

    /**
     * Create noise pattern on canvas context
     */
    static addNoise(ctx, width, height, opacity = 0.08, mono = true) {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 255 * opacity;
            if (mono) {
                data[i] = Math.min(255, Math.max(0, data[i] + noise));
                data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
                data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
            } else {
                data[i] = Math.min(255, Math.max(0, data[i] + (Math.random() - 0.5) * 255 * opacity));
                data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + (Math.random() - 0.5) * 255 * opacity));
                data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + (Math.random() - 0.5) * 255 * opacity));
            }
        }
        ctx.putImageData(imgData, 0, 0);
    }

    /**
     * Sandstone / Desert Brick (Dust 2 walls)
     */
    static createSandstoneTexture(width = 512, height = 512) {
        const key = `sandstone_${width}_${height}`;
        if (this.cache.has(key)) return this.cache.get(key);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Base sand color
        ctx.fillStyle = '#D9BF8F';
        ctx.fillRect(0, 0, width, height);

        // Brick pattern
        const rows = 8;
        const rowHeight = height / rows;
        ctx.strokeStyle = '#9E855C';
        ctx.lineWidth = 4;

        for (let r = 0; r < rows; r++) {
            const y = r * rowHeight;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();

            const cols = 4;
            const colWidth = width / cols;
            const offset = (r % 2) * (colWidth / 2);

            for (let c = -1; c <= cols; c++) {
                const x = c * colWidth + offset;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + rowHeight);
                ctx.stroke();

                // Subtle brick tint variation
                ctx.fillStyle = `rgba(${(Math.random() * 30 - 15) | 0}, ${(Math.random() * 20 - 10) | 0}, ${(Math.random() * 10 - 5) | 0}, 0.12)`;
                ctx.fillRect(x + 2, y + 2, colWidth - 4, rowHeight - 4);
            }
        }

        // Dirt/weathering streaks
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const grad = ctx.createRadialGradient(x, y, 2, x, y, 25 + Math.random() * 40);
            grad.addColorStop(0, 'rgba(100, 75, 45, 0.25)');
            grad.addColorStop(1, 'rgba(100, 75, 45, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
        }

        this.addNoise(ctx, width, height, 0.12);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        this.cache.set(key, texture);
        return texture;
    }

    /**
     * Desert Ground / Sand Ground
     */
    static createGroundTexture(width = 512, height = 512) {
        const key = `ground_${width}_${height}`;
        if (this.cache.has(key)) return this.cache.get(key);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Sandy soil base
        ctx.fillStyle = '#C2AA7A';
        ctx.fillRect(0, 0, width, height);

        // Pebbles and stone variations
        for (let i = 0; i < 400; i++) {
            const px = Math.random() * width;
            const py = Math.random() * height;
            const pr = 1 + Math.random() * 3.5;
            ctx.fillStyle = Math.random() > 0.5 ? '#8C754B' : '#DFCCA6';
            ctx.beginPath();
            ctx.arc(px, py, pr, 0, Math.PI * 2);
            ctx.fill();
        }

        // Dirt trails / tire tracks
        ctx.strokeStyle = 'rgba(130, 105, 70, 0.15)';
        ctx.lineWidth = 30;
        ctx.beginPath();
        ctx.moveTo(0, height * 0.3);
        ctx.bezierCurveTo(width * 0.4, height * 0.2, width * 0.6, height * 0.5, width, height * 0.4);
        ctx.stroke();

        this.addNoise(ctx, width, height, 0.18);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        this.cache.set(key, texture);
        return texture;
    }

    /**
     * Wooden Crate (Iconic CS boxes with metal frames & stencil text)
     */
    static createCrateTexture(width = 512, height = 512, label = 'A') {
        const key = `crate_${label}_${width}`;
        if (this.cache.has(key)) return this.cache.get(key);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Wood plank base
        ctx.fillStyle = '#8B5A2B';
        ctx.fillRect(0, 0, width, height);

        // Planks
        const planks = 6;
        const plankH = height / planks;
        ctx.strokeStyle = '#4A2A0C';
        ctx.lineWidth = 4;

        for (let i = 0; i < planks; i++) {
            const y = i * plankH;
            ctx.strokeRect(0, y, width, plankH);
            // Wood grain
            for (let j = 0; j < 6; j++) {
                ctx.strokeStyle = 'rgba(60, 30, 10, 0.15)';
                ctx.lineWidth = 1 + Math.random() * 2;
                ctx.beginPath();
                ctx.moveTo(0, y + Math.random() * plankH);
                ctx.lineTo(width, y + Math.random() * plankH);
                ctx.stroke();
            }
        }

        // Metal border reinforcements
        const border = 36;
        ctx.fillStyle = '#4A4A4A';
        ctx.fillRect(0, 0, width, border);
        ctx.fillRect(0, height - border, width, border);
        ctx.fillRect(0, 0, border, height);
        ctx.fillRect(width - border, 0, border, height);

        // Corner braces & diagonal metal cross
        ctx.strokeStyle = '#3D3D3D';
        ctx.lineWidth = 28;
        ctx.beginPath();
        ctx.moveTo(border, border);
        ctx.lineTo(width - border, height - border);
        ctx.stroke();

        // Rivets/bolts on metal corners
        ctx.fillStyle = '#888888';
        const rivetOffsets = [border / 2, width - border / 2];
        for (const rx of rivetOffsets) {
            for (const ry of [border / 2, height / 2, height - border / 2]) {
                ctx.beginPath();
                ctx.arc(rx, ry, 6, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Stencil symbol in center
        ctx.fillStyle = '#E5C158';
        ctx.font = `bold ${width * 0.28}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 6;
        ctx.fillText(label, width / 2, height / 2);
        ctx.shadowBlur = 0;

        this.addNoise(ctx, width, height, 0.12);

        const texture = new THREE.CanvasTexture(canvas);
        this.cache.set(key, texture);
        return texture;
    }

    /**
     * Mirage Terracotta & Stucco Wall
     */
    static createMirageWallTexture(width = 512, height = 512) {
        const key = `mirage_wall_${width}`;
        if (this.cache.has(key)) return this.cache.get(key);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Warm Moroccan stucco base
        ctx.fillStyle = '#D68962';
        ctx.fillRect(0, 0, width, height);

        // Weathering and plaster peel
        for (let i = 0; i < 8; i++) {
            const cx = Math.random() * width;
            const cy = Math.random() * height;
            const r = 20 + Math.random() * 50;
            ctx.fillStyle = '#BF724D';
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Bottom stone foundation
        ctx.fillStyle = '#736B65';
        ctx.fillRect(0, height - 90, width, 90);
        ctx.strokeStyle = '#47423E';
        ctx.lineWidth = 3;
        for (let x = 0; x < width; x += 80) {
            ctx.strokeRect(x, height - 90, 80, 45);
            ctx.strokeRect(x - 40, height - 45, 80, 45);
        }

        this.addNoise(ctx, width, height, 0.15);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        this.cache.set(key, texture);
        return texture;
    }

    /**
     * Inferno European Cobblestone Street
     */
    static createCobblestoneTexture(width = 512, height = 512) {
        const key = `cobble_${width}`;
        if (this.cache.has(key)) return this.cache.get(key);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#3E3C38';
        ctx.fillRect(0, 0, width, height);

        const stoneRows = 10;
        const rH = height / stoneRows;
        for (let r = 0; r < stoneRows; r++) {
            const y = r * rH;
            const stoneCols = 8;
            const cW = width / stoneCols;
            const offset = (r % 2) * (cW * 0.5);

            for (let c = -1; c <= stoneCols; c++) {
                const x = c * cW + offset;
                const shade = 100 + ((Math.random() * 40 - 20) | 0);
                ctx.fillStyle = `rgb(${shade}, ${shade - 5}, ${shade - 10})`;

                ctx.beginPath();
                ctx.roundRect(x + 3, y + 3, cW - 6, rH - 6, 8);
                ctx.fill();
            }
        }

        this.addNoise(ctx, width, height, 0.2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        this.cache.set(key, texture);
        return texture;
    }

    /**
     * Concrete & Asphalt (Inferno & Mirage streets)
     */
    static createConcreteTexture(width = 512, height = 512) {
        const key = `concrete_${width}`;
        if (this.cache.has(key)) return this.cache.get(key);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#6E7072';
        ctx.fillRect(0, 0, width, height);

        // Cracks
        ctx.strokeStyle = '#424446';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 4; i++) {
            let x = Math.random() * width;
            let y = Math.random() * height;
            ctx.beginPath();
            ctx.moveTo(x, y);
            for (let s = 0; s < 5; s++) {
                x += (Math.random() - 0.5) * 60;
                y += (Math.random() - 0.5) * 60;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        this.addNoise(ctx, width, height, 0.22);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        this.cache.set(key, texture);
        return texture;
    }

    /**
     * Gun Metal / Weapon Texture
     */
    static createGunMetalTexture(width = 256, height = 256, colorHex = '#2B2E33') {
        const key = `gun_${colorHex}_${width}`;
        if (this.cache.has(key)) return this.cache.get(key);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = colorHex;
        ctx.fillRect(0, 0, width, height);

        // Brushed metal highlights
        for (let y = 0; y < height; y += 2) {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.05})`;
            ctx.fillRect(0, y, width, 1);
        }

        this.addNoise(ctx, width, height, 0.06);

        const texture = new THREE.CanvasTexture(canvas);
        this.cache.set(key, texture);
        return texture;
    }

    /**
     * Wood texture for AK-47 stock / handles
     */
    static createWoodTexture(width = 256, height = 256) {
        const key = `wood_${width}`;
        if (this.cache.has(key)) return this.cache.get(key);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#783A14';
        ctx.fillRect(0, 0, width, height);

        for (let i = 0; i < 40; i++) {
            ctx.strokeStyle = `rgba(55, 22, 6, ${0.1 + Math.random() * 0.25})`;
            ctx.lineWidth = 2 + Math.random() * 4;
            ctx.beginPath();
            const y = Math.random() * height;
            ctx.moveTo(0, y);
            ctx.bezierCurveTo(width * 0.3, y + (Math.random() - 0.5) * 30, width * 0.7, y + (Math.random() - 0.5) * 30, width, y);
            ctx.stroke();
        }

        this.addNoise(ctx, width, height, 0.08);

        const texture = new THREE.CanvasTexture(canvas);
        this.cache.set(key, texture);
        return texture;
    }
}

