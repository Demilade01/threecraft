# ThreeCraft

This is a Minecraft clone built using Three.js and TypeScript. It is a 3D sandbox game where players can explore, build, and destroy their own world made up of blocks.

You can play a demo [here](threecraft-steel.vercel.app/).

**Important**: It is suggested to play the game with Chrome, since it was developed and tested only it.

![Main Menu](/docs/MainMenu.png)

## Features

- Procedurally generated terrain
- Trees and foliage generation
- Caves and ores generation
- Basic player movement and collision detection
- World editing
- Inventory system
- Game saving system
- Sound Effects

## Installation

Use the package manager npm to install on your local machine.

```bash
npm install
```

## Core Technologies

- Three.js: a lightweight 3D graphics library for creating WebGL applications.
- TypeScript: a typed superset of JavaScript that compiles to plain JavaScript.
- Vite: a web application bundler and development server.

## Known Issues

- Opening and closing the inventory without doing any action cause the camera to behave weirdly.
- Locking the mouse cursor fails if the unlock operation occurred in less than 1 second.
- Collision detection is not always accurate. Sometimes weird collision responses can occur when the player is moving around.
- Since the framerate is capped at 75, the game feels a bit choppy on higher framerate devices. (This is due the fact the draw calls are not interpolated between frames)

## Todo

Here are some important tasks and features that i'd like to implement in the future.

### Gameplay

- [ ] Block breaking animation
- [ ] Crafting system
- [ ] Visible arm/block selected
- [ ] Improve collision detection

### Environment

- [ ] Block lighting system
- [ ] Better sky
- [ ] Day/Night cycle
- [ ] Block color tint ( very useful for grass block )

### Codebase

- [ ] Implement ECS pattern

## 🏗️ Honeycomb Protocol Integration

ThreeCraft now features **real blockchain integration** using Honeycomb Protocol for on-chain progression and missions!

### 🎮 How to Play with Blockchain Features:

1. **Install Phantom Wallet** (or any Solana wallet)
   - Download from [phantom.app](https://phantom.app/)
   - Create a new wallet or import existing

2. **Switch to Devnet**
   - Open Phantom wallet
   - Go to Settings → Developer Settings
   - Select "Devnet" network
   - Get some devnet SOL from [faucet](https://faucet.solana.com/)

3. **Connect & Play**
   - Start ThreeCraft game
   - Press `M` to open mission panel
   - Click "Connect Wallet"
   - Start building blocks to earn XP and complete missions!

### 🏆 Building Missions:
- **First Builder** - Place your first block
- **Stone House** - Build with 20 stone blocks
- **Wooden Structures** - Place 15 wooden planks
- **Glass Artist** - Create with 10 glass blocks
- **Master Builder** - Place 50 blocks total

### ⚡ Player Traits:
- **Builder** - Basic construction experience
- **Architect** - Complex building design
- **Artist** - Beautiful structure creation
- **Craftsman** - Detailed construction work

### 🔗 Blockchain Features:
- **Real wallet connection** (Phantom, Solflare, etc.)
- **Devnet testing** (no real SOL required)
- **On-chain progression** tracking
- **Permanent achievements** stored on Solana
- **Honeycomb Protocol** integration for missions and traits

### 🚀 Development Status:
- ✅ Real wallet connection
- ✅ Devnet integration
- ✅ Mission system
- ✅ XP and trait progression
- ✅ Building-focused gameplay
- 🔄 Full Honeycomb API integration (in progress)
- 🔄 NFT rewards (planned)
- 🔄 Multiplayer missions (planned)

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
