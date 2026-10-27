// ============================================
// CS2 Web Game - Round Manager (MR12 Competitive & Deathmatch)
// Round flow, win conditions, halftime switch & economy
// ============================================

import { CONFIG } from '../config.js';

export class RoundManager {
    constructor(audio) {
        this.audio = audio;

        this.gameMode = CONFIG.MODES.COMPETITIVE;
        this.roundNum = 1;
        this.phase = 'freeze'; // 'freeze', 'live', 'over', 'ended'
        this.timer = CONFIG.GAME.FREEZE_TIME;

        // Team Scores
        this.scoreCT = 0;
        this.scoreT = 0;
        this.consecutiveLossesCT = 0;
        this.consecutiveLossesT = 0;

        // Round outcome info
        this.roundWinner = null;
        this.roundEndReason = '';
        this.isHalftime = false;
        this.isMatchOver = false;

        // Bomb state
        this.isBombPlanted = false;
        this.isBombDefused = false;
    }

    startMatch(mode = CONFIG.MODES.COMPETITIVE) {
        this.gameMode = mode;
        this.roundNum = 1;
        this.scoreCT = 0;
        this.scoreT = 0;
        this.consecutiveLossesCT = 0;
        this.consecutiveLossesT = 0;
        this.isMatchOver = false;
        this.startRound();
    }

    startRound() {
        this.phase = 'freeze';
        this.timer = CONFIG.GAME.FREEZE_TIME;
        this.isBombPlanted = false;
        this.isBombDefused = false;
        this.roundWinner = null;
        this.roundEndReason = '';

        this.audio.playRadio('Get ready');
        window.dispatchEvent(new CustomEvent('round-start', { detail: { round: this.roundNum, phase: this.phase } }));
    }

    update(dt, allPlayers, c4Active) {
        if (this.isMatchOver) return;

        this.timer -= dt;

        if (this.phase === 'freeze') {
            if (this.timer <= 0) {
                this.phase = 'live';
                this.timer = CONFIG.GAME.ROUND_TIME;
                this.audio.playRadio('Go go go');
            }
            return;
        }

        if (this.phase === 'live') {
            // Check team eliminations
            const aliveCT = allPlayers.filter(p => p.team === 'ct' && p.isAlive).length;
            const aliveT = allPlayers.filter(p => p.team === 't' && p.isAlive).length;

            if (this.gameMode === CONFIG.MODES.COMPETITIVE) {
                // If bomb is planted, round timer stops - C4 timer takes over
                if (c4Active && !this.isBombPlanted) {
                    this.isBombPlanted = true;
                }

                if (this.isBombPlanted) {
                    if (c4Active?.isDefused) {
                        this.endRound('ct', 'Bomb has been defused');
                        return;
                    }
                    if (c4Active?.timer <= 0) {
                        this.endRound('t', 'Target destroyed');
                        return;
                    }
                }

                // If all T eliminated
                if (aliveT === 0 && (!this.isBombPlanted || aliveCT > 0)) {
                    if (!this.isBombPlanted) {
                        this.endRound('ct', 'Terrorists eliminated');
                        return;
                    }
                }

                // If all CT eliminated
                if (aliveCT === 0) {
                    if (this.isBombPlanted) {
                        // T will win when bomb explodes or now
                        this.endRound('t', 'Counter-Terrorists eliminated');
                        return;
                    } else if (aliveT > 0) {
                        this.endRound('t', 'Counter-Terrorists eliminated');
                        return;
                    }
                }

                // Time ran out (CT wins if bomb not planted)
                if (this.timer <= 0 && !this.isBombPlanted) {
                    this.endRound('ct', 'Time ran out');
                    return;
                }
            } else if (this.gameMode === CONFIG.MODES.DEATHMATCH) {
                // Respawn dead players immediately
                for (const player of allPlayers) {
                    if (!player.isAlive && (!player.respawnTimer || player.respawnTimer <= 0)) {
                        player.respawnTimer = 2.0;
                    } else if (player.respawnTimer > 0) {
                        player.respawnTimer -= dt;
                        if (player.respawnTimer <= 0) {
                            window.dispatchEvent(new CustomEvent('respawn-player', { detail: { player } }));
                        }
                    }
                }

                if (this.timer <= 0) {
                    this.isMatchOver = true;
                }
            }
        }

        if (this.phase === 'over') {
            if (this.timer <= 0) {
                this.checkNextRound(allPlayers);
            }
        }
    }

    endRound(winner, reason) {
        if (this.phase === 'over') return;

        this.phase = 'over';
        this.timer = 5.0; // 5 second celebration delay
        this.roundWinner = winner;
        this.roundEndReason = reason;

        if (winner === 'ct') {
            this.scoreCT++;
            this.consecutiveLossesCT = 0;
            this.consecutiveLossesT++;
            this.audio.playRadio('Counter-Terrorists win');
        } else if (winner === 't') {
            this.scoreT++;
            this.consecutiveLossesT = 0;
            this.consecutiveLossesCT++;
            this.audio.playRadio('Terrorists win');
        }

        window.dispatchEvent(new CustomEvent('round-ended', {
            detail: {
                winner,
                reason,
                scoreCT: this.scoreCT,
                scoreT: this.scoreT
            }
        }));
    }

    checkNextRound(allPlayers) {
        // Halftime at Round 12 (MR12 format)
        if (this.roundNum === 12) {
            this.switchSides(allPlayers);
        }

        // Check Match Victory (13 rounds to win)
        if (this.scoreCT >= CONFIG.GAME.ROUNDS_TO_WIN || this.scoreT >= CONFIG.GAME.ROUNDS_TO_WIN) {
            this.isMatchOver = true;
            this.phase = 'ended';
            const winner = this.scoreCT >= CONFIG.GAME.ROUNDS_TO_WIN ? 'Counter-Terrorists' : 'Terrorists';
            this.audio.playRadio(`${winner} victory`);
            return;
        }

        // Distribute round end money
        this.distributeEconomy(allPlayers);

        this.roundNum++;
        this.startRound();
        window.dispatchEvent(new CustomEvent('reset-round-positions'));
    }

    switchSides(allPlayers) {
        this.isHalftime = true;
        // Swap scores
        const tempScore = this.scoreCT;
        this.scoreCT = this.scoreT;
        this.scoreT = tempScore;

        // Swap player teams
        for (const player of allPlayers) {
            player.team = player.team === 'ct' ? 't' : 'ct';
            player.money = CONFIG.GAME.START_MONEY;
            player.inventory = {
                0: null,
                1: player.team === 'ct' ? 'usp' : 'glock',
                2: 'knife',
                3: null,
                4: null
            };
            player.currentWeapon = player.inventory[1];
        }

        this.audio.playRadio('Halftime. Switching sides.');
    }

    distributeEconomy(allPlayers) {
        for (const player of allPlayers) {
            if (player.team === this.roundWinner) {
                player.money = Math.min(CONFIG.GAME.MAX_MONEY, player.money + CONFIG.GAME.ROUND_WIN_REWARD);
            } else {
                const lossStreak = player.team === 'ct' ? this.consecutiveLossesCT : this.consecutiveLossesT;
                const bonus = Math.min(CONFIG.GAME.MAX_LOSS_BONUS, CONFIG.GAME.ROUND_LOSS_BASE + lossStreak * CONFIG.GAME.ROUND_LOSS_INCREMENT);
                player.money = Math.min(CONFIG.GAME.MAX_MONEY, player.money + bonus);
            }
        }
    }
}

