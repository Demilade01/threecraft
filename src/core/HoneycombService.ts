import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import EdgeClient from '@honeycomb-protocol/edge-client';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import Logger from '../tools/Logger';

// TypeScript declarations for Solana wallet
declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect(): Promise<{ publicKey: { toString(): string } }>;
      request(params: any): Promise<any>;
    };
  }
}

export interface PlayerIdentity {
  publicKey: PublicKey;
  traits: PlayerTrait[];
  experience: number;
  level: number;
  characterId?: string;
  nectarBalance: number;
  resources: Resource[];
}

export interface PlayerTrait {
  id: string;
  name: string;
  value: number;
  description: string;
  onChainId?: string;
}

export interface Resource {
  id: string;
  name: string;
  amount: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  onChainId?: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  requirements: MissionRequirement[];
  rewards: MissionReward[];
  completed: boolean;
  progress: number;
  onChainId?: string;
}

export interface MissionRequirement {
  type: 'block_break' | 'block_place' | 'distance_travel' | 'item_collect';
  target: string;
  amount: number;
  current: number;
}

export interface MissionReward {
  type: 'xp' | 'trait' | 'achievement' | 'nectar' | 'resource';
  value: string | number;
}

export default class HoneycombService {
  private static _instance: HoneycombService;

  private connection: Connection | null = null;
  private edgeClient: any = null;
  private playerIdentity: PlayerIdentity | null = null;
  private isConnected: boolean = false;
  private wallet: any = null;

  // Mission tracking
  private activeMissions: Map<string, Mission> = new Map();
  private completedMissions: Set<string> = new Set();

  // Action tracking
  private actionCounts: Map<string, number> = new Map();

  // Event emitters
  private eventEmitter: EventTarget = new EventTarget();

  // Honeycomb Protocol specific
  private gameId: string = 'threecraft-v1';
  private characterProgramId: PublicKey | null = null;
  private missionProgramId: PublicKey | null = null;
  private resourceProgramId: PublicKey | null = null;

  static instance(): HoneycombService {
    if (!HoneycombService._instance) {
      throw new Error('HoneycombService not initialized');
    }
    return HoneycombService._instance;
  }

  static init(): HoneycombService {
    if (!HoneycombService._instance) {
      Logger.info('Initializing HoneycombService...', Logger.INIT_KEY);
      HoneycombService._instance = new HoneycombService();
    }
    return HoneycombService._instance;
  }

  private constructor() {
    this.initializeConnection();
  }

  private async initializeConnection() {
    try {
      // Connect to Solana devnet for development
      this.connection = new Connection(
        'https://api.devnet.solana.com',
        'confirmed'
      );

      Logger.info('Connected to Solana devnet', Logger.INIT_KEY);

      // Initialize Honeycomb Edge Client with proper configuration
      this.edgeClient = {
        connection: this.connection,
        network: WalletAdapterNetwork.Devnet,
        cluster: 'devnet',
        // Honeycomb specific configuration
        honeycombConfig: {
          gameId: this.gameId,
          version: '1.0.0',
          environment: 'development'
        },
        // Mock API methods for development
        getCharacter: async (params: any) => {
          // Mock character data for development
          return {
            id: `char_${params.publicKey.slice(0, 8)}`,
            experience: 0,
            level: 1,
            nectarBalance: 0,
            traits: [],
            resources: [],
            completedMissions: []
          };
        },
        updateCharacter: async (params: any) => {
          console.log('Saving character data:', params);
          return true;
        },
        createCharacter: async (params: any) => {
          console.log('Creating character:', params);
          return {
            id: `char_${params.publicKey.slice(0, 8)}`,
            name: params.name
          };
        },
        createTrade: async (params: any) => {
          console.log('Creating trade:', params);
          return { id: `trade_${Date.now()}` };
        }
      };

      Logger.info('Honeycomb Edge Client initialized for devnet', Logger.INIT_KEY);

    } catch (error) {
      Logger.error(new ErrorEvent('error', { error: error as Error }));
      console.error('Failed to initialize Honeycomb connection:', error);
    }
  }

  // Wallet Connection Methods
  async connectWallet(publicKey: PublicKey): Promise<boolean> {
    try {
      if (!this.edgeClient) {
        throw new Error('Edge client not initialized');
      }

      // Store wallet reference
      this.wallet = window.solana;

      // Check if wallet is on devnet, switch if needed
      await this.ensureDevnetConnection();

      // Initialize player identity
      this.playerIdentity = {
        publicKey,
        traits: this.getDefaultTraits(),
        experience: 0,
        level: 1,
        nectarBalance: 0,
        resources: this.getDefaultResources(),
      };

      this.isConnected = true;

      Logger.info(`Real wallet connected to devnet: ${publicKey.toString()}`, Logger.INIT_KEY);

      // Load player data from Honeycomb
      await this.loadPlayerData();

      // Initialize default missions
      this.initializeDefaultMissions();

      return true;
    } catch (error) {
      Logger.error(new ErrorEvent('error', { error: error as Error }));
      console.error('Failed to connect wallet:', error);
      return false;
    }
  }

  private async ensureDevnetConnection(): Promise<void> {
    try {
      // Check if wallet is available and switch to devnet if needed
      if (window.solana && window.solana.isPhantom) {
        // Request to switch to devnet
        try {
          await window.solana.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x67' }], // Devnet chain ID
          });
        } catch (switchError: any) {
          // If devnet is not available, add it
          if (switchError.code === 4902) {
            await window.solana.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x67',
                chainName: 'Solana Devnet',
                nativeCurrency: {
                  name: 'SOL',
                  symbol: 'SOL',
                  decimals: 9
                },
                rpcUrls: ['https://api.devnet.solana.com'],
                blockExplorerUrls: ['https://explorer.solana.com/?cluster=devnet']
              }],
            });
          }
        }
      }
    } catch (error) {
      Logger.warn('Could not switch to devnet, continuing with current network');
    }
  }

  disconnectWallet(): void {
    this.isConnected = false;
    this.playerIdentity = null;
    this.wallet = null;
    this.activeMissions.clear();
    this.completedMissions.clear();
    this.actionCounts.clear();

    Logger.info('Wallet disconnected', Logger.INIT_KEY);
  }

  // Player Identity Methods
  getPlayerIdentity(): PlayerIdentity | null {
    return this.playerIdentity;
  }

  private getDefaultTraits(): PlayerTrait[] {
    return [
      {
        id: 'builder',
        name: 'Builder',
        value: 0,
        description: 'Experience in building structures'
      },
      {
        id: 'architect',
        name: 'Architect',
        value: 0,
        description: 'Experience in designing complex buildings'
      },
      {
        id: 'artist',
        name: 'Artist',
        value: 0,
        description: 'Experience in creating beautiful structures'
      },
      {
        id: 'craftsman',
        name: 'Craftsman',
        value: 0,
        description: 'Experience in detailed construction work'
      }
    ];
  }

  private getDefaultResources(): Resource[] {
    return [
      {
        id: 'stone',
        name: 'Stone',
        amount: 0,
        rarity: 'common'
      },
      {
        id: 'wood',
        name: 'Wood',
        amount: 0,
        rarity: 'common'
      },
      {
        id: 'glass',
        name: 'Glass',
        amount: 0,
        rarity: 'rare'
      },
      {
        id: 'diamond',
        name: 'Diamond',
        amount: 0,
        rarity: 'legendary'
      }
    ];
  }

  // Mission Methods
  getActiveMissions(): Mission[] {
    return Array.from(this.activeMissions.values());
  }

  getCompletedMissions(): string[] {
    return Array.from(this.completedMissions);
  }

  private initializeDefaultMissions(): void {
    const defaultMissions: Mission[] = [
      {
        id: 'first_builder',
        title: 'First Builder',
        description: 'Place your first block to start building',
        requirements: [
          {
            type: 'block_place',
            target: 'any',
            amount: 1,
            current: 0
          }
        ],
        rewards: [
          {
            type: 'xp',
            value: 10
          },
          {
            type: 'nectar',
            value: 5
          },
          {
            type: 'trait',
            value: 'builder'
          }
        ],
        completed: false,
        progress: 0
      },
      {
        id: 'stone_house',
        title: 'Stone House',
        description: 'Build a house using 20 stone blocks',
        requirements: [
          {
            type: 'block_place',
            target: 'STONE',
            amount: 20,
            current: 0
          }
        ],
        rewards: [
          {
            type: 'xp',
            value: 50
          },
          {
            type: 'nectar',
            value: 25
          },
          {
            type: 'resource',
            value: 'stone'
          },
          {
            type: 'trait',
            value: 'builder'
          }
        ],
        completed: false,
        progress: 0
      },
      {
        id: 'wooden_structures',
        title: 'Wooden Structures',
        description: 'Place 15 wooden blocks (planks or logs)',
        requirements: [
          {
            type: 'block_place',
            target: 'PLANKS',
            amount: 15,
            current: 0
          }
        ],
        rewards: [
          {
            type: 'xp',
            value: 30
          },
          {
            type: 'nectar',
            value: 15
          },
          {
            type: 'resource',
            value: 'wood'
          },
          {
            type: 'trait',
            value: 'builder'
          }
        ],
        completed: false,
        progress: 0
      },
      {
        id: 'glass_artist',
        title: 'Glass Artist',
        description: 'Create beautiful structures with 10 glass blocks',
        requirements: [
          {
            type: 'block_place',
            target: 'GLASS',
            amount: 10,
            current: 0
          }
        ],
        rewards: [
          {
            type: 'xp',
            value: 40
          },
          {
            type: 'nectar',
            value: 20
          },
          {
            type: 'resource',
            value: 'glass'
          },
          {
            type: 'trait',
            value: 'artist'
          }
        ],
        completed: false,
        progress: 0
      },
      {
        id: 'master_builder',
        title: 'Master Builder',
        description: 'Place 50 blocks of any type to become a master',
        requirements: [
          {
            type: 'block_place',
            target: 'any',
            amount: 50,
            current: 0
          }
        ],
        rewards: [
          {
            type: 'xp',
            value: 100
          },
          {
            type: 'nectar',
            value: 50
          },
          {
            type: 'resource',
            value: 'diamond'
          },
          {
            type: 'trait',
            value: 'architect'
          }
        ],
        completed: false,
        progress: 0
      }
    ];

    defaultMissions.forEach(mission => {
      this.activeMissions.set(mission.id, mission);
    });
  }

  // Action Tracking Methods
  trackBlockBreak(blockType: string): void {
    if (!this.isConnected) return;

    const currentCount = this.actionCounts.get(`break_${blockType}`) || 0;
    this.actionCounts.set(`break_${blockType}`, currentCount + 1);

    this.updateMissionProgress('block_break', blockType);

    Logger.debug(`Block broken: ${blockType}`, Logger.PLAYER_KEY);
  }

  trackBlockPlace(blockType: string): void {
    if (!this.isConnected) return;

    const currentCount = this.actionCounts.get(`place_${blockType}`) || 0;
    this.actionCounts.set(`place_${blockType}`, currentCount + 1);

    console.log(`🏗️ Block placed: ${blockType} (Total: ${currentCount + 1})`);

    this.updateMissionProgress('block_place', blockType);

    Logger.debug(`Block placed: ${blockType}`, Logger.PLAYER_KEY);
  }

  private updateMissionProgress(actionType: string, target: string): void {
    this.activeMissions.forEach((mission, missionId) => {
      if (mission.completed) return;

      mission.requirements.forEach(requirement => {
        if (requirement.type === actionType &&
            (requirement.target === target || requirement.target === 'any')) {
          requirement.current++;

          console.log(`🎯 Mission progress: ${mission.title} - ${requirement.current}/${requirement.amount}`);

          // Update mission progress
          const totalRequired = mission.requirements.reduce((sum, req) => sum + req.amount, 0);
          const totalCurrent = mission.requirements.reduce((sum, req) => sum + req.current, 0);
          mission.progress = Math.min(totalCurrent / totalRequired, 1);

          // Check if mission is completed
          if (mission.progress >= 1 && !mission.completed) {
            console.log(`🎉 Mission completed: ${mission.title}!`);
            this.completeMission(missionId);
          }
        }
      });
    });
  }

  private async completeMission(missionId: string): Promise<void> {
    const mission = this.activeMissions.get(missionId);
    if (!mission || mission.completed) return;

    mission.completed = true;
    this.completedMissions.add(missionId);

    // Award rewards
    mission.rewards.forEach(reward => {
      if (reward.type === 'xp') {
        this.addExperience(reward.value as number);
      } else if (reward.type === 'trait') {
        this.addTraitExperience(reward.value as string, 1);
      } else if (reward.type === 'nectar') {
        this.addNectar(reward.value as number);
      } else if (reward.type === 'resource') {
        this.addResource(reward.value as string, 1);
      }
    });

    console.log(`🏆 Mission completed: ${mission.title} - XP gained: ${mission.rewards.find(r => r.type === 'xp')?.value || 0}`);
    Logger.info(`Mission completed: ${mission.title}`, Logger.PLAYER_KEY);

    // Save to Honeycomb
    await this.savePlayerData();
  }

  // Experience and Leveling Methods
  private addExperience(amount: number): void {
    if (!this.playerIdentity) return;

    this.playerIdentity.experience += amount;

    // Simple leveling system: 100 XP per level
    const newLevel = Math.floor(this.playerIdentity.experience / 100) + 1;
    if (newLevel > this.playerIdentity.level) {
      this.playerIdentity.level = newLevel;
      Logger.info(`Level up! Now level ${newLevel}`, Logger.PLAYER_KEY);
    }
  }

  private addTraitExperience(traitId: string, amount: number): void {
    if (!this.playerIdentity) return;

    const trait = this.playerIdentity.traits.find(t => t.id === traitId);
    if (trait) {
      trait.value += amount;
      Logger.debug(`Trait ${traitId} increased to ${trait.value}`, Logger.PLAYER_KEY);
    }
  }

  private addNectar(amount: number): void {
    if (!this.playerIdentity) return;

    this.playerIdentity.nectarBalance += amount;
    Logger.debug(`Nectar balance increased to ${this.playerIdentity.nectarBalance}`, Logger.PLAYER_KEY);
  }

  private addResource(resourceId: string, amount: number): void {
    if (!this.playerIdentity) return;

    const resource = this.playerIdentity.resources.find(r => r.id === resourceId);
    if (resource) {
      resource.amount += amount;
      Logger.debug(`Resource ${resourceId} increased to ${resource.amount}`, Logger.PLAYER_KEY);
    }
  }

  // Honeycomb Data Methods
  private async loadPlayerData(): Promise<void> {
    try {
      if (!this.edgeClient || !this.playerIdentity) return;

      // Load character data from Honeycomb
      const characterData = await this.edgeClient.getCharacter({
        publicKey: this.playerIdentity.publicKey.toString(),
        gameId: this.gameId
      });

      if (characterData) {
        this.playerIdentity.characterId = characterData.id;
        this.playerIdentity.experience = characterData.experience || 0;
        this.playerIdentity.level = characterData.level || 1;
        this.playerIdentity.nectarBalance = characterData.nectarBalance || 0;

        // Load traits
        if (characterData.traits) {
          this.playerIdentity.traits = this.playerIdentity.traits.map(trait => {
            const onChainTrait = characterData.traits.find((ct: any) => ct.id === trait.id);
            return {
              ...trait,
              value: onChainTrait?.value || trait.value,
              onChainId: onChainTrait?.onChainId
            };
          });
        }

        // Load resources
        if (characterData.resources) {
          this.playerIdentity.resources = this.playerIdentity.resources.map(resource => {
            const onChainResource = characterData.resources.find((cr: any) => cr.id === resource.id);
            return {
              ...resource,
              amount: onChainResource?.amount || resource.amount,
              onChainId: onChainResource?.onChainId
            };
          });
        }

        // Load completed missions
        if (characterData.completedMissions) {
          this.completedMissions = new Set(characterData.completedMissions);
        }
      }

      Logger.info('Player data loaded from Honeycomb', Logger.LOADING_KEY);
    } catch (error) {
      Logger.error(new ErrorEvent('error', { error: error as Error }));
      console.error('Failed to load player data:', error);
    }
  }

  private async savePlayerData(): Promise<void> {
    try {
      if (!this.edgeClient || !this.playerIdentity) return;

      // Save character data to Honeycomb
      await this.edgeClient.updateCharacter({
        publicKey: this.playerIdentity.publicKey.toString(),
        gameId: this.gameId,
        characterId: this.playerIdentity.characterId,
        data: {
          experience: this.playerIdentity.experience,
          level: this.playerIdentity.level,
          nectarBalance: this.playerIdentity.nectarBalance,
          traits: this.playerIdentity.traits.map(trait => ({
            id: trait.id,
            value: trait.value,
            onChainId: trait.onChainId
          })),
          resources: this.playerIdentity.resources.map(resource => ({
            id: resource.id,
            amount: resource.amount,
            onChainId: resource.onChainId
          })),
          completedMissions: Array.from(this.completedMissions),
          lastUpdated: new Date().toISOString()
        }
      });

      Logger.info('Player data saved to Honeycomb', Logger.DATA_KEY);
    } catch (error) {
      Logger.error(new ErrorEvent('error', { error: error as Error }));
      console.error('Failed to save player data:', error);
    }
  }

  // Character Management Methods
  async createCharacter(name: string): Promise<boolean> {
    try {
      if (!this.edgeClient || !this.playerIdentity) return false;

      const character = await this.edgeClient.createCharacter({
        publicKey: this.playerIdentity.publicKey.toString(),
        gameId: this.gameId,
        name: name,
        traits: this.playerIdentity.traits.map(trait => ({
          id: trait.id,
          name: trait.name,
          value: trait.value,
          description: trait.description
        })),
        initialExperience: 0,
        initialLevel: 1
      });

      if (character) {
        this.playerIdentity.characterId = character.id;
        await this.savePlayerData();
        return true;
      }

      return false;
    } catch (error) {
      Logger.error(new ErrorEvent('error', { error: error as Error }));
      console.error('Failed to create character:', error);
      return false;
    }
  }

  // Resource Management Methods
  async tradeResource(resourceId: string, amount: number, targetPlayer: string): Promise<boolean> {
    try {
      if (!this.edgeClient || !this.playerIdentity) return false;

      const trade = await this.edgeClient.createTrade({
        fromPlayer: this.playerIdentity.publicKey.toString(),
        toPlayer: targetPlayer,
        gameId: this.gameId,
        resources: [{
          id: resourceId,
          amount: amount
        }],
        nectarAmount: 0
      });

      return !!trade;
    } catch (error) {
      Logger.error(new ErrorEvent('error', { error: error as Error }));
      console.error('Failed to trade resource:', error);
      return false;
    }
  }

  // Utility Methods
  isWalletConnected(): boolean {
    return this.isConnected;
  }

  getConnection(): Connection | null {
    return this.connection;
  }

  getEdgeClient(): any {
    return this.edgeClient;
  }

  // Event handling
  addEventListener(type: string, listener: EventListener): void {
    this.eventEmitter.addEventListener(type, listener);
  }

  removeEventListener(type: string, listener: EventListener): void {
    this.eventEmitter.removeEventListener(type, listener);
  }

  private emitEvent(type: string, detail?: any): void {
    this.eventEmitter.dispatchEvent(new CustomEvent(type, { detail }));
  }
}
