import Game from "../core/Game";
import { Mission, PlayerIdentity, Resource } from "../core/HoneycombService";
import Logger from "../tools/Logger";

export default class MissionPanel {
  private container: HTMLDivElement;
  private honeycombService: any;
  private isVisible: boolean = false;

  constructor() {
    this.honeycombService = Game.instance().getHoneycombService();
    this.container = this.createContainer();
    this.updateDisplay();
  }

  private createContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.id = 'mission-panel';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 350px;
      max-height: 600px;
      background: linear-gradient(135deg, rgba(20, 20, 30, 0.95), rgba(30, 30, 50, 0.95));
      color: #ffffff;
      border: 2px solid #4a90e2;
      border-radius: 12px;
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 13px;
      overflow-y: auto;
      z-index: 1000;
      display: none;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(10px);
    `;

    document.body.appendChild(container);
    return container;
  }

  show(): void {
    this.isVisible = true;
    this.container.style.display = 'block';
    this.updateDisplay();
  }

  hide(): void {
    this.isVisible = false;
    this.container.style.display = 'none';
  }

  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  updateDisplay(): void {
    if (!this.isVisible) return;

    const playerIdentity = this.honeycombService.getPlayerIdentity();
    const activeMissions = this.honeycombService.getActiveMissions();
    const isConnected = this.honeycombService.isWalletConnected();

    console.log(`📊 Mission Panel Update - Connected: ${isConnected}, Missions: ${activeMissions.length}, Level: ${playerIdentity?.level || 0}, XP: ${playerIdentity?.experience || 0}`);

    this.container.innerHTML = this.generateHTML(playerIdentity, activeMissions, isConnected);
  }

  private generateHTML(
    playerIdentity: PlayerIdentity | null,
    missions: Mission[],
    isConnected: boolean
  ): string {
    let html = '<div style="margin-bottom: 15px;">';

    // Header
    html += '<h3 style="margin: 0 0 15px 0; color: #4a90e2; font-size: 18px; text-align: center; text-shadow: 0 2px 4px rgba(0,0,0,0.5); border-bottom: 2px solid #4a90e2; padding-bottom: 10px;">🏗️ ThreeCraft Builder Missions</h3>';

    // Connection Status
    if (isConnected && playerIdentity) {
      html += `<div style="margin-bottom: 15px; padding: 12px; background: linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(76, 175, 80, 0.1)); border: 1px solid rgba(76, 175, 80, 0.5); border-radius: 8px; box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 16px; margin-right: 8px;">✅</span>
          <strong style="color: #4caf50;">Connected</strong>
        </div>
        <div style="font-size: 11px; color: #b0b0b0; margin-bottom: 4px;">Wallet: ${playerIdentity.publicKey.toString().slice(0, 8)}...</div>
        <div style="font-size: 11px; color: #b0b0b0; margin-bottom: 4px;">Network: <span style="color: #ff9800;">Devnet</span></div>
        <div style="font-size: 11px; color: #b0b0b0; margin-bottom: 4px;">Level: ${playerIdentity.level} | XP: ${playerIdentity.experience}</div>
        <div style="font-size: 11px; color: #b0b0b0;">Character ID: ${playerIdentity.characterId || 'Not Created'}</div>
      </div>`;
    } else {
      html += `<div style="margin-bottom: 15px; padding: 12px; background: linear-gradient(135deg, rgba(244, 67, 54, 0.3), rgba(244, 67, 54, 0.1)); border: 1px solid rgba(244, 67, 54, 0.5); border-radius: 8px; box-shadow: 0 2px 8px rgba(244, 67, 54, 0.2);">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 16px; margin-right: 8px;">❌</span>
          <strong style="color: #f44336;">Not Connected</strong>
        </div>
        <div style="font-size: 11px; color: #b0b0b0;">Connect wallet to start building and earning XP</div>
      </div>`;
    }

    // Nectar Balance
    if (playerIdentity) {
      html += `<div style="margin-bottom: 15px; padding: 12px; background: linear-gradient(135deg, rgba(255, 193, 7, 0.3), rgba(255, 193, 7, 0.1)); border: 1px solid rgba(255, 193, 7, 0.5); border-radius: 8px; box-shadow: 0 2px 8px rgba(255, 193, 7, 0.2);">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center;">
            <span style="font-size: 16px; margin-right: 8px;">🍯</span>
            <strong style="color: #ffc107;">Nectar Balance</strong>
          </div>
          <span style="color: #ffc107; font-weight: bold; font-size: 16px;">${playerIdentity.nectarBalance}</span>
        </div>
        <div style="font-size: 11px; color: #b0b0b0; margin-top: 4px;">Honeycomb's native currency</div>
      </div>`;
    }

    // Resources
    if (playerIdentity && playerIdentity.resources.length > 0) {
      html += '<div style="margin-bottom: 20px;">';
      html += '<h4 style="margin: 0 0 12px 0; color: #9c27b0; font-size: 14px; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">💎 Resources</h4>';
      playerIdentity.resources.forEach(resource => {
        const rarityColor = this.getRarityColor(resource.rarity);
        html += `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 6px 10px; background: rgba(156, 39, 176, 0.1); border: 1px solid ${rarityColor}; border-radius: 6px;">
          <span style="color: ${rarityColor}; font-weight: 500;">${resource.name}</span>
          <span style="color: #ffffff; font-weight: bold; background: rgba(156, 39, 176, 0.2); padding: 2px 8px; border-radius: 4px; min-width: 20px; text-align: center;">${resource.amount}</span>
        </div>`;
      });
      html += '</div>';
    }

    // Player Traits
    if (playerIdentity) {
      html += '<div style="margin-bottom: 20px;">';
      html += '<h4 style="margin: 0 0 12px 0; color: #ffd700; font-size: 14px; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">⚡ Traits</h4>';
      playerIdentity.traits.forEach(trait => {
        html += `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 6px 10px; background: rgba(255, 215, 0, 0.1); border: 1px solid rgba(255, 215, 0, 0.3); border-radius: 6px;">
          <span style="color: #ffd700; font-weight: 500;">${trait.name}</span>
          <span style="color: #ffffff; font-weight: bold; background: rgba(255, 215, 0, 0.2); padding: 2px 8px; border-radius: 4px; min-width: 20px; text-align: center;">${trait.value}</span>
        </div>`;
      });
      html += '</div>';
    }

    // Active Missions
    html += '<div style="margin-bottom: 20px;">';
    html += '<h4 style="margin: 0 0 12px 0; color: #4a90e2; font-size: 14px; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">🏗️ Building Missions</h4>';

    if (missions.length === 0) {
      html += '<div style="color: #888; font-style: italic; text-align: center; padding: 20px;">No active missions</div>';
    } else {
      missions.forEach(mission => {
        const progressPercent = Math.round(mission.progress * 100);
        const progressColor = mission.completed ? '#4caf50' : '#ff9800';
        const borderColor = mission.completed ? '#4caf50' : '#4a90e2';

        html += `<div style="margin-bottom: 12px; padding: 12px; background: linear-gradient(135deg, rgba(74, 144, 226, 0.1), rgba(74, 144, 226, 0.05)); border: 1px solid ${borderColor}; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 14px; margin-right: 8px;">${mission.completed ? '✅' : '🏗️'}</span>
            <div style="font-weight: bold; color: #ffffff; font-size: 13px;">${mission.title}</div>
          </div>
          <div style="font-size: 11px; color: #b0b0b0; margin-bottom: 10px; line-height: 1.4;">${mission.description}</div>
          <div style="margin-bottom: 8px;">
            <div style="background: rgba(0,0,0,0.3); height: 6px; border-radius: 3px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
              <div style="background: linear-gradient(90deg, ${progressColor}, ${progressColor}dd); height: 100%; width: ${progressPercent}%; transition: width 0.3s ease; box-shadow: 0 0 4px ${progressColor}40;"></div>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
            <span style="color: #888;">Progress: ${progressPercent}%</span>
            <span style="color: ${progressColor}; font-weight: bold;">${mission.completed ? 'COMPLETED!' : 'In Progress'}</span>
          </div>
          ${this.generateMissionRewards(mission)}
        </div>`;
      });
    }
    html += '</div>';

    // Controls
    html += '<div style="text-align: center; padding-top: 10px; border-top: 1px solid rgba(74, 144, 226, 0.3);">';
    html += '<button id="connect-wallet" style="background: linear-gradient(135deg, #4a90e2, #357abd); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-right: 10px; font-weight: 500; box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3); transition: all 0.2s ease;">Connect Wallet</button>';
    html += '<button id="refresh-missions" style="background: linear-gradient(135deg, #666, #555); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 500; box-shadow: 0 2px 8px rgba(0,0,0,0.3); transition: all 0.2s ease;">Refresh</button>';
    html += '</div>';

    html += '</div>';

    // Add event listeners after rendering
    setTimeout(() => {
      this.addEventListeners();
    }, 0);

    return html;
  }

  private generateMissionRewards(mission: Mission): string {
    if (mission.rewards.length === 0) return '';

    let rewardsHtml = '<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">';
    rewardsHtml += '<div style="font-size: 10px; color: #888; margin-bottom: 4px;">Rewards:</div>';

    mission.rewards.forEach(reward => {
      const rewardIcon = this.getRewardIcon(reward.type);
      const rewardColor = this.getRewardColor(reward.type);
      const rewardText = this.getRewardText(reward);

      rewardsHtml += `<span style="display: inline-block; margin-right: 8px; padding: 2px 6px; background: rgba(${rewardColor}, 0.2); border: 1px solid rgba(${rewardColor}, 0.5); border-radius: 4px; font-size: 10px; color: rgb(${rewardColor});">
        ${rewardIcon} ${rewardText}
      </span>`;
    });

    rewardsHtml += '</div>';
    return rewardsHtml;
  }

  private getRewardIcon(type: string): string {
    switch (type) {
      case 'xp': return '⭐';
      case 'trait': return '⚡';
      case 'nectar': return '🍯';
      case 'resource': return '💎';
      case 'achievement': return '🏆';
      default: return '🎁';
    }
  }

  private getRewardColor(type: string): string {
    switch (type) {
      case 'xp': return '255, 193, 7';
      case 'trait': return '255, 215, 0';
      case 'nectar': return '255, 193, 7';
      case 'resource': return '156, 39, 176';
      case 'achievement': return '76, 175, 80';
      default: return '74, 144, 226';
    }
  }

  private getRewardText(reward: any): string {
    switch (reward.type) {
      case 'xp': return `${reward.value} XP`;
      case 'trait': return `${reward.value}`;
      case 'nectar': return `${reward.value} Nectar`;
      case 'resource': return `${reward.value}`;
      case 'achievement': return 'Achievement';
      default: return reward.value;
    }
  }

  private getRarityColor(rarity: string): string {
    switch (rarity) {
      case 'common': return 'rgba(255, 255, 255, 0.5)';
      case 'rare': return 'rgba(74, 144, 226, 0.8)';
      case 'epic': return 'rgba(156, 39, 176, 0.8)';
      case 'legendary': return 'rgba(255, 193, 7, 0.8)';
      default: return 'rgba(255, 255, 255, 0.5)';
    }
  }

  private addEventListeners(): void {
    const connectButton = document.getElementById('connect-wallet');
    const refreshButton = document.getElementById('refresh-missions');

    if (connectButton) {
      connectButton.addEventListener('click', () => {
        this.connectWallet();
      });

      // Add hover effects
      connectButton.addEventListener('mouseenter', () => {
        connectButton.style.transform = 'translateY(-2px)';
        connectButton.style.boxShadow = '0 4px 12px rgba(74, 144, 226, 0.4)';
      });

      connectButton.addEventListener('mouseleave', () => {
        connectButton.style.transform = 'translateY(0)';
        connectButton.style.boxShadow = '0 2px 8px rgba(74, 144, 226, 0.3)';
      });
    }

    if (refreshButton) {
      refreshButton.addEventListener('click', () => {
        this.updateDisplay();
      });

      // Add hover effects
      refreshButton.addEventListener('mouseenter', () => {
        refreshButton.style.transform = 'translateY(-2px)';
        refreshButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
      });

      refreshButton.addEventListener('mouseleave', () => {
        refreshButton.style.transform = 'translateY(0)';
        refreshButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      });
    }
  }

  private async connectWallet(): Promise<void> {
    try {
      // Check if Solana wallet is available
      if (!window.solana || !window.solana.isPhantom) {
        // If Phantom is not installed, show instructions
        this.showWalletInstallInstructions();
        return;
      }

      // Connect to Phantom wallet
      const response = await window.solana.connect();
      const publicKey = response.publicKey;

      if (publicKey) {
        const success = await this.honeycombService.connectWallet(publicKey);

        if (success) {
          Logger.info(`Real wallet connected: ${publicKey.toString()}`, Logger.INIT_KEY);
          this.updateDisplay();
        } else {
          Logger.warn('Failed to connect wallet');
        }
      }
    } catch (error) {
      Logger.error(new ErrorEvent('error', { error: error as Error }));
      console.error('Error connecting wallet:', error);

      // Show user-friendly error message
      this.showConnectionError();
    }
  }

  private showWalletInstallInstructions(): void {
    const message = `
      <div style="text-align: center; padding: 20px;">
        <h4 style="color: #ff9800; margin-bottom: 15px;">🔗 Wallet Required</h4>
        <p style="color: #b0b0b0; margin-bottom: 15px; line-height: 1.4;">
          To play ThreeCraft with blockchain features, you need a Solana wallet.
        </p>
        <a href="https://phantom.app/" target="_blank" style="
          background: linear-gradient(135deg, #4a90e2, #357abd);
          color: white;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 6px;
          display: inline-block;
          font-weight: 500;
          box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
        ">Install Phantom Wallet</a>
      </div>
    `;

    // Update the panel content to show installation instructions
    this.container.innerHTML = this.generateHTML(null, [], false) + message;
  }

  private showConnectionError(): void {
    const message = `
      <div style="text-align: center; padding: 20px; color: #f44336;">
        <h4 style="margin-bottom: 10px;">❌ Connection Failed</h4>
        <p style="color: #b0b0b0; font-size: 12px;">
          Please make sure your wallet is unlocked and try again.
        </p>
      </div>
    `;

    // Update the panel content to show error
    this.container.innerHTML = this.generateHTML(null, [], false) + message;
  }

  // Public method to update the display from external calls
  public refresh(): void {
    this.updateDisplay();
  }
}
