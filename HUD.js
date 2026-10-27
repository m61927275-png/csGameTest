// ============================================
// CS2 Web Game - HUD & Interface Manager
// Radar, Health, Ammo, Buy Menu, Killfeed & Scoreboard
// ============================================

import { CONFIG } from '../config.js';
import { WEAPONS, getBuyMenuCategories } from '../data/weapons.js';

export class HUD {
    constructor() {
        this.container = document.getElementById('hud');
        this.killfeedContainer = document.getElementById('killfeed');
        this.radarCanvas = document.getElementById('radar-canvas');
        this.radarCtx = this.radarCanvas ? this.radarCanvas.getContext('2d') : null;

        this.buyMenuOpen = false;
        this.scoreboardOpen = false;

        this.hitmarkerTimer = 0;
        this.flashDuration = 0;
        this.flashElapsed = 0;

        this.initEventListeners();
    }

    initEventListeners() {
        window.addEventListener('player-flashed', (e) => {
            this.triggerFlash(e.detail.duration);
        });
    }

    triggerHitmarker() {
        const hm = document.getElementById('hitmarker');
        if (hm) {
            hm.style.opacity = '1';
            clearTimeout(this.hmTimeout);
            this.hmTimeout = setTimeout(() => {
                hm.style.opacity = '0';
            }, 120);
        }
    }

    triggerFlash(duration) {
        this.flashDuration = duration;
        this.flashElapsed = 0;
        const flashOverlay = document.getElementById('flash-overlay');
        if (flashOverlay) {
            flashOverlay.style.opacity = '1';
        }
    }

    addKillfeedEntry(killer, victim, weaponId, isHeadshot) {
        if (!this.killfeedContainer) return;

        const entry = document.createElement('div');
        entry.className = 'kill-entry';

        const killerSpan = `<span class="${killer.team}-text">${killer.name}</span>`;
        const weaponSpan = `<span class="kill-weapon">${weaponId.toUpperCase()}</span>`;
        const hsSpan = isHeadshot ? `<span class="kill-hs">🎯</span>` : '';
        const victimSpan = `<span class="${victim.team}-text">${victim.name}</span>`;

        entry.innerHTML = `${killerSpan} ${weaponSpan} ${hsSpan} ${victimSpan}`;
        this.killfeedContainer.appendChild(entry);

        setTimeout(() => {
            entry.classList.add('fade-out');
            setTimeout(() => entry.remove(), 500);
        }, 4500);
    }

    update(dt, player, roundManager, allEntities, currentMap) {
        // 1. Health & Armor
        const hpElem = document.getElementById('hud-health');
        const hpBar = document.getElementById('health-bar-fill');
        if (hpElem) hpElem.innerText = Math.max(0, player.health);
        if (hpBar) hpBar.style.width = `${Math.max(0, player.health)}%`;

        const armorElem = document.getElementById('hud-armor');
        const armorBar = document.getElementById('armor-bar-fill');
        const helmetIcon = document.getElementById('hud-helmet');
        if (armorElem) armorElem.innerText = Math.max(0, Math.round(player.armor));
        if (armorBar) armorBar.style.width = `${Math.max(0, player.armor)}%`;
        if (helmetIcon) helmetIcon.style.display = player.hasHelmet ? 'inline-block' : 'none';

        // 2. Ammo & Weapon
        const weapon = player.getWeaponData();
        const weaponNameElem = document.getElementById('hud-weapon-name');
        const ammoElem = document.getElementById('hud-ammo');
        const reserveElem = document.getElementById('hud-reserve');

        if (weaponNameElem) weaponNameElem.innerText = weapon.name;
        if (weapon.magazine) {
            const inMag = player.ammoInMag.get(weapon.id) || 0;
            const inRes = player.ammoReserve.get(weapon.id) || 0;
            if (ammoElem) ammoElem.innerText = inMag;
            if (reserveElem) reserveElem.innerText = ` / ${inRes}`;
        } else {
            if (ammoElem) ammoElem.innerText = '—';
            if (reserveElem) reserveElem.innerText = '';
        }

        // 3. Money
        const moneyElem = document.getElementById('hud-money');
        if (moneyElem) moneyElem.innerText = `$${player.money}`;

        // 4. Round Header (Scores, Timer, Phase)
        const ctScoreElem = document.getElementById('score-ct');
        const tScoreElem = document.getElementById('score-t');
        const timerElem = document.getElementById('round-timer');

        if (ctScoreElem) ctScoreElem.innerText = roundManager.scoreCT;
        if (tScoreElem) tScoreElem.innerText = roundManager.scoreT;

        if (timerElem) {
            if (roundManager.isBombPlanted) {
                timerElem.innerText = '⚠️ BOMB';
                timerElem.style.color = '#FF2222';
            } else {
                const mins = Math.floor(Math.max(0, roundManager.timer) / 60);
                const secs = Math.floor(Math.max(0, roundManager.timer) % 60).toString().padStart(2, '0');
                timerElem.innerText = `${mins}:${secs}`;
                timerElem.style.color = '#FFFFFF';
            }
        }

        // 5. Flashbang recovery
        if (this.flashDuration > 0) {
            this.flashElapsed += dt;
            const remaining = 1 - (this.flashElapsed / this.flashDuration);
            const flashOverlay = document.getElementById('flash-overlay');
            if (remaining <= 0) {
                this.flashDuration = 0;
                if (flashOverlay) flashOverlay.style.opacity = '0';
            } else if (flashOverlay) {
                flashOverlay.style.opacity = remaining.toString();
            }
        }

        // 6. Sniper Scope overlay
        const scopeElem = document.getElementById('sniper-scope');
        if (scopeElem) {
            scopeElem.style.display = player.isScoped ? 'block' : 'none';
        }

        // 7. Radar rendering
        this.renderRadar(player, allEntities, currentMap);
    }

    renderRadar(player, allEntities, currentMap) {
        if (!this.radarCtx) return;
        const ctx = this.radarCtx;
        const size = 180;
        ctx.clearRect(0, 0, size, size);

        // Center is player
        const cx = size / 2;
        const cy = size / 2;
        const scale = 1.1; // Radar zoom factor

        // Draw radar background circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, size / 2 - 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(12, 16, 22, 0.75)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.clip();

        // Rotate radar world according to player yaw
        ctx.translate(cx, cy);
        ctx.rotate(player.rotation.y);

        // Draw bomb sites markers
        if (currentMap?.bombSites) {
            for (const [siteName, site] of Object.entries(currentMap.bombSites)) {
                const rx = (site.center.x - player.position.x) * scale;
                const rz = (site.center.z - player.position.z) * scale;
                ctx.fillStyle = '#E5C158';
                ctx.font = 'bold 12px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(siteName, rx, rz);
            }
        }

        // Draw other entities
        for (const ent of allEntities) {
            if (ent === player || !ent.isAlive) continue;

            const rx = (ent.position.x - player.position.x) * scale;
            const rz = (ent.position.z - player.position.z) * scale;

            // Only draw if within radar radius
            if (Math.hypot(rx, rz) < size / 2 - 8) {
                ctx.beginPath();
                ctx.arc(rx, rz, 4.5, 0, Math.PI * 2);
                ctx.fillStyle = ent.team === player.team ? '#4A7AB5' : '#E03C3C';
                ctx.fill();
            }
        }

        ctx.restore();

        // Draw local player arrow in center
        ctx.save();
        ctx.translate(cx, cy);
        ctx.fillStyle = '#00FF66';
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(5, 6);
        ctx.lineTo(-5, 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    toggleBuyMenu(player, forceState = null) {
        const menu = document.getElementById('buy-menu');
        if (!menu) return;

        this.buyMenuOpen = forceState !== null ? forceState : !this.buyMenuOpen;
        menu.style.display = this.buyMenuOpen ? 'flex' : 'none';

        if (this.buyMenuOpen) {
            this.populateBuyMenu(player);
        }
    }

    populateBuyMenu(player) {
        const categories = getBuyMenuCategories();
        const content = document.getElementById('buy-items-grid');
        if (!content) return;

        content.innerHTML = '';
        const allWeps = Object.values(WEAPONS).filter(w => w.price > 0 && (w.team === 'both' || w.team === player.team));

        for (const wep of allWeps) {
            const card = document.createElement('div');
            card.className = `buy-card ${player.money >= wep.price ? 'affordable' : 'unaffordable'}`;
            card.innerHTML = `
                <div class="buy-card-name">${wep.name}</div>
                <div class="buy-card-price">$${wep.price}</div>
                <div class="buy-card-type">${wep.type.toUpperCase()}</div>
            `;
            card.onclick = () => {
                const res = player.buyWeapon(wep.id);
                if (res.success) {
                    this.populateBuyMenu(player);
                }
            };
            content.appendChild(card);
        }
    }

    toggleScoreboard(show, allPlayers) {
        const sb = document.getElementById('scoreboard');
        if (!sb) return;

        this.scoreboardOpen = show;
        sb.style.display = show ? 'block' : 'none';

        if (show) {
            this.populateScoreboard(allPlayers);
        }
    }

    populateScoreboard(allPlayers) {
        const ctList = document.getElementById('sb-ct-list');
        const tList = document.getElementById('sb-t-list');
        if (!ctList || !tList) return;

        ctList.innerHTML = '';
        tList.innerHTML = '';

        for (const p of allPlayers) {
            const row = document.createElement('tr');
            row.className = p.isAlive ? '' : 'dead-row';
            row.innerHTML = `
                <td>${p.name}</td>
                <td>$${p.money}</td>
                <td>${p.kills}</td>
                <td>${p.assists}</td>
                <td>${p.deaths}</td>
                <td>${p.score}</td>
            `;

            if (p.team === 'ct') {
                ctList.appendChild(row);
            } else {
                tList.appendChild(row);
            }
        }
    }
}

