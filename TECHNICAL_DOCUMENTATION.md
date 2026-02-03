# 🎮 Wild Ones Clone - Teknik Döküman

## 📋 İçindekiler
1. [Teknoloji Seçimleri](#teknoloji-secimleri)
2. [Sistem Mimarisi](#sistem-mimarisi)
3. [Detaylı Tasarım Kararları](#detayli-tasarim-kararlari)
4. [Klasör Yapısı](#klasor-yapisi)
5. [Kritik Sistemler](#kritik-sistemler)

---

## 🔧 Teknoloji Seçimleri

### Frontend Stack

#### 1. Phaser 3 (v3.80+)
**Neden seçildi:**
- ✅ **Mature Framework**: 10+ yıllık development history
- ✅ **Built-in Scene Management**: State yönetimi için ideal
- ✅ **Matter.js Entegrasyonu**: Native physics plugin
- ✅ **Particle System**: Patlama efektleri için hazır sistem
- ✅ **Input Handling**: Mouse, keyboard, touch desteği
- ✅ **Asset Management**: Efficient loading & caching
- ✅ **Animation System**: Sprite animations için
- ✅ **Camera System**: Follow, zoom, shake özellikleri
- ✅ **Tween Engine**: Smooth animations
- ✅ **Cross-platform**: Web, mobile, desktop

**Alternatifler ve neden tercih edilmedi:**
- **PixiJS**: Daha low-level, oyun özellikleri yok
- **Three.js**: 3D odaklı, 2D için overkill
- **Vanilla Canvas**: Too much boilerplate

#### 2. Matter.js
**Neden seçildi:**
- ✅ **Polygon-based Collision**: Destructible terrain için kritik
- ✅ **Composite Bodies**: Kompleks şekiller
- ✅ **Constraints**: Rope, chain weapons için
- ✅ **Performans**: 60 FPS stable
- ✅ **Realistic Physics**: Cartoon feel için ayarlanabilir
- ✅ **Phaser Integration**: Built-in plugin

**Alternatifler:**
- **Box2D.js**: Daha ağır, overkill
- **p2.js**: Eski, deprecated
- **Arcade Physics**: Çok basit, polygon collision yok

#### 3. Vite
**Neden seçildi:**
- ✅ **Lightning Fast**: HMR instant
- ✅ **Simple Config**: Minimal setup
- ✅ **ES Modules**: Modern JavaScript
- ✅ **Build Optimization**: Production için

### Backend Stack (Phase 4)

#### 1. ASP.NET Core 8 Web API
**Neden seçildi:**
- ✅ **Performance**: Fastest web framework
- ✅ **C# Integration**: Mevcut skill set
- ✅ **Entity Framework Core**: ORM
- ✅ **SignalR**: Built-in real-time
- ✅ **Cross-platform**: Linux deployment

#### 2. SignalR
**Neden seçildi:**
- ✅ **Real-time**: WebSocket fallback
- ✅ **Scalable**: Redis backplane
- ✅ **Typed Hubs**: C# strong typing
- ✅ **Auto reconnection**: Stable connections

#### 3. SQL Server / PostgreSQL
**Neden seçildi:**
- ✅ **Relational**: User profiles, matches
- ✅ **EF Core**: Code-first migrations
- ✅ **Performance**: Indexing

---

## 🏗️ Sistem Mimarisi

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  GameScene   │  │  MainMenu    │  │  GameOver    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│                     GAME LOGIC LAYER                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ TurnManager  │  │TeamManager   │  │WeaponManager │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │TerrainMgr    │  │ CameraMgr    │  │  WindMgr     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│                   CORE SYSTEMS LAYER                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  EventBus    │  │PhysicsSystem │  │DamageSystem  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│                    ENGINE LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Phaser 3    │  │  Matter.js   │  │  Browser     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Component Diagram

```
Character
├── Physics Body (Matter.js Circle)
├── Graphics (Phaser Graphics)
├── Health System
│   ├── Current Health
│   ├── Max Health
│   └── Health Bar
├── Weapon Inventory
│   ├── Weapon[] array
│   └── Current Weapon Index
├── Movement
│   ├── moveLeft()
│   ├── moveRight()
│   └── jump()
└── State
    ├── isAlive
    ├── isActive
    └── teamId
```

### Data Flow

```
User Input (Mouse/Keyboard)
    │
    ↓
GameScene.update()
    │
    ├─→ Character Movement
    │   └─→ Matter.js Body Update
    │
    ├─→ Aim Angle Calculation
    │   └─→ UI Update (Aim Line)
    │
    └─→ Fire Weapon
        │
        ↓
    BaseWeapon.fire()
        │
        ├─→ Create Projectile (Matter.js)
        │
        ├─→ EventBus.emit(WEAPON_FIRED)
        │   └─→ TurnManager.onWeaponFired()
        │
        └─→ Collision Detection
            └─→ Explosion
                ├─→ Damage Calculation
                │   └─→ Character.takeDamage()
                │
                ├─→ Force Application
                │   └─→ Matter.js applyForce()
                │
                └─→ Terrain Destruction
                    └─→ TerrainManager.destroyCircle()
```

---

## 🎯 Detaylı Tasarım Kararları

### 1. Event-Driven Architecture

**Karar:** EventBus singleton pattern  
**Neden:**
- Decoupled communication
- Managers birbirini bilmez
- Test edilebilir
- Extensible

**Implementation:**
```javascript
// Tight coupling - KÖTÜ
class TurnManager {
    onWeaponFired() {
        this.ui.updateTimer(); // UI'ya bağımlı
        this.camera.followProjectile(); // Camera'ya bağımlı
    }
}

// Event-driven - İYİ
class TurnManager {
    onWeaponFired() {
        EventBus.emit(EVENTS.WEAPON_FIRED);
        // UI ve Camera kendi listener'larında handle eder
    }
}
```

### 2. State Management

**Karar:** Explicit game states  
**States:**
- MENU
- PLAYER_TURN
- PROJECTILE_FLIGHT
- PHYSICS_RESOLVE
- TURN_END
- GAME_OVER

**Neden:**
- Clear state transitions
- Easier debugging
- Predictable behavior

### 3. Physics Timestep

**Karar:** Fixed timestep (60 FPS)  
**Neden:**
- Deterministic physics
- Multiplayer consistency
- Predictable trajectories

### 4. Weapon System - Strategy Pattern

**Karar:** BaseWeapon abstract class  
**Neden:**
- Open/Closed Principle
- Easy to add new weapons
- Shared explosion logic
- Polymorphism

```javascript
class BaseWeapon {
    fire(x, y, angle, power) {
        // Common logic
    }
    createExplosion(x, y) {
        // Shared explosion
    }
}

class Bazooka extends BaseWeapon {
    fire(x, y, angle, power) {
        // Bazooka-specific
        super.fire(x, y, angle, power);
    }
}
```

### 5. Object Pooling (Phase 2)

**Karar:** Pool pattern for projectiles  
**Neden:**
- Reduce GC pressure
- Better performance
- Reuse objects

```javascript
class ProjectilePool {
    constructor(size = 50) {
        this.pool = [];
        this.active = [];
    }
    
    get() {
        return this.pool.pop() || this.create();
    }
    
    release(projectile) {
        this.pool.push(projectile);
    }
}
```

### 6. Damage System - Distance-based

**Karar:** Linear falloff formula  
```javascript
damage = maxDamage * (1 - distance / radius)
```

**Neden:**
- Simple & predictable
- Wild Ones authentic feel
- Easy to balance

### 7. Camera System

**Karar:** Lerp-based smooth follow  
**Neden:**
- Smooth transitions
- No jarring movements
- Professional feel

---

## 📁 Klasör Yapısı - Detaylı

```
wild-ones-clone/
│
├── src/
│   │
│   ├── config/                    # Konfigürasyon
│   │   ├── Constants.js           # Oyun sabitleri (readonly)
│   │   └── GameConfig.js          # Phaser config
│   │
│   ├── scenes/                    # Phaser scenes
│   │   ├── BootScene.js           # Asset loading
│   │   ├── MainMenuScene.js       # Ana menü
│   │   ├── GameScene.js           # Ana oyun
│   │   └── GameOverScene.js       # Sonuç ekranı
│   │
│   ├── entities/                  # Game entities
│   │   ├── Character.js           # Oyuncu karakteri
│   │   ├── Projectile.js          # Mermi (Phase 2)
│   │   ├── Explosion.js           # Patlama efekti
│   │   └── PowerUp.js             # Bonus item
│   │
│   ├── managers/                  # Game managers (Singleton)
│   │   ├── TurnManager.js         # Tur kontrolü
│   │   ├── TeamManager.js         # Takım yönetimi
│   │   ├── WeaponManager.js       # Silah envanteri
│   │   ├── TerrainManager.js      # Arazi yıkımı
│   │   ├── CameraManager.js       # Kamera kontrolü
│   │   ├── WindManager.js         # Rüzgar sistemi
│   │   └── PowerUpManager.js      # Item spawning
│   │
│   ├── weapons/                   # Silah implementasyonları
│   │   ├── BaseWeapon.js          # Abstract base
│   │   ├── Bazooka.js
│   │   ├── Grenade.js
│   │   ├── ShotGun.js             # Phase 2
│   │   ├── Minigun.js             # Phase 2
│   │   ├── Nuke.js                # Phase 2
│   │   └── [+15 more weapons]
│   │
│   ├── systems/                   # Core systems
│   │   ├── PhysicsSystem.js       # Matter.js wrapper
│   │   ├── DamageSystem.js        # Hasar hesaplama
│   │   ├── CollisionSystem.js     # Çarpışma mantığı
│   │   └── ParticleSystem.js      # Particle manager
│   │
│   ├── ui/                        # UI components
│   │   ├── HUD.js                 # Main HUD
│   │   ├── PowerBar.js            # Güç göstergesi
│   │   ├── WindIndicator.js       # Rüzgar oku
│   │   ├── TrajectoryPreview.js   # Yörünge tahmini
│   │   └── WeaponSelector.js      # Silah seçim wheel
│   │
│   ├── ai/                        # AI sistemi (Phase 4)
│   │   ├── BotAI.js               # Bot controller
│   │   └── TargetingSystem.js     # Hedefleme algoritması
│   │
│   ├── network/                   # Multiplayer (Phase 4)
│   │   ├── SignalRClient.js       # Backend bağlantı
│   │   └── GameSync.js            # State sync
│   │
│   └── utils/                     # Utility functions
│       ├── MathUtils.js           # Math helpers
│       ├── ObjectPool.js          # Object pooling
│       └── EventBus.js            # Event system
│
├── assets/                        # Game assets
│   ├── images/
│   │   ├── characters/            # Character sprites
│   │   ├── weapons/               # Weapon icons
│   │   ├── ui/                    # UI elements
│   │   └── terrain/               # Terrain textures
│   ├── sounds/
│   │   ├── weapons/               # Weapon SFX
│   │   ├── explosions/            # Explosion SFX
│   │   └── music/                 # Background music
│   └── particles/                 # Particle sprites
│
├── backend/                       # ASP.NET Core (Phase 4)
│   ├── WildOnes.API/
│   │   ├── Controllers/
│   │   │   ├── AuthController.cs
│   │   │   ├── ProfileController.cs
│   │   │   └── MatchController.cs
│   │   ├── Hubs/
│   │   │   └── GameHub.cs         # SignalR hub
│   │   ├── Models/
│   │   │   ├── User.cs
│   │   │   ├── Match.cs
│   │   │   └── PlayerStats.cs
│   │   ├── Services/
│   │   │   ├── MatchmakingService.cs
│   │   │   └── StatisticsService.cs
│   │   └── Program.cs
│   └── WildOnes.Data/
│       ├── ApplicationDbContext.cs
│       └── Migrations/
│
├── tests/                         # Unit tests
│   ├── utils/
│   ├── systems/
│   └── weapons/
│
├── index.html                     # Entry HTML
├── package.json
├── vite.config.js
├── README.md
├── ROADMAP.md
└── .gitignore
```

---

## 🔑 Kritik Sistemler

### 1. TurnManager

**Sorumluluklar:**
- Sıra kontrolü
- Timer management
- Game state transitions
- Win condition

**Algoritma:**
```
while (game is active):
    1. Find next alive character
    2. Set character active
    3. Start turn timer (30s)
    4. Wait for weapon fire OR timeout
    5. Wait for physics to settle
    6. End turn
    7. Next character
```

### 2. Damage System

**Hasar Hesaplama:**
```javascript
function calculateDamage(explosion, character) {
    const distance = Math.distance(
        explosion.x, explosion.y,
        character.x, character.y
    );
    
    if (distance > explosion.radius) return 0;
    
    const damagePercent = 1 - (distance / explosion.radius);
    return Math.floor(explosion.maxDamage * damagePercent);
}
```

**Force Hesaplama:**
```javascript
function calculateForce(explosion, character) {
    const distance = Math.distance(...);
    const forceMagnitude = maxForce * (1 - distance / radius);
    const angle = Math.atan2(char.y - exp.y, char.x - exp.x);
    
    return {
        x: Math.cos(angle) * forceMagnitude,
        y: Math.sin(angle) * forceMagnitude
    };
}
```

### 3. Trajectory Prediction (Phase 2)

**Fizik Simulasyonu:**
```javascript
function predictTrajectory(x, y, angle, power, wind) {
    const points = [];
    const velocity = power / 10;
    let vx = Math.cos(angle) * velocity;
    let vy = Math.sin(angle) * velocity;
    let px = x;
    let py = y;
    const dt = 0.1;
    
    for (let i = 0; i < 50; i++) {
        points.push({ x: px, y: py });
        
        vx += wind * dt;      // Wind effect
        vy += gravity * dt;    // Gravity
        
        px += vx;
        py += vy;
    }
    
    return points;
}
```

### 4. Destructible Terrain (Phase 2)

**Bitmap Yaklaşımı:**
```javascript
class TerrainManager {
    constructor(width, height) {
        this.bitmap = new Uint8Array(width * height);
        this.generateTerrain();
    }
    
    generateTerrain() {
        // Perlin noise
        for (let x = 0; x < width; x++) {
            const height = perlin.noise(x / 100) * 200;
            for (let y = 0; y < height; y++) {
                this.bitmap[x + y * width] = 1;
            }
        }
    }
    
    destroyCircle(x, y, radius) {
        // Clear circle from bitmap
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                if (dx*dx + dy*dy <= radius*radius) {
                    this.bitmap[(x+dx) + (y+dy) * width] = 0;
                }
            }
        }
        
        // Rebuild physics
        this.updatePhysicsBodies();
    }
    
    updatePhysicsBodies() {
        // Marching squares algorithm
        const polygons = this.marchingSquares(this.bitmap);
        
        // Remove old bodies
        this.bodies.forEach(b => world.remove(b));
        
        // Create new bodies
        this.bodies = polygons.map(poly => 
            Matter.Bodies.fromVertices(poly, { isStatic: true })
        );
    }
}
```

---

## 🎨 Visual Design Decisions

### Color Palette
```javascript
const COLORS = {
    // Teams
    RED_TEAM: '#FF3333',
    BLUE_TEAM: '#3333FF',
    
    // Environment
    SKY: '#87CEEB',          // Sky blue
    GROUND: '#8B4513',       // Brown
    GRASS: '#228B22',        // Forest green
    
    // Effects
    EXPLOSION: '#FF6600',    // Orange
    FIRE: '#FFFF00',         // Yellow
    SMOKE: '#888888',        // Gray
    
    // UI
    UI_BG: '#333333',        // Dark gray
    UI_TEXT: '#FFFFFF',      // White
    HEALTH_GOOD: '#00FF00',  // Green
    HEALTH_MID: '#FFFF00',   // Yellow
    HEALTH_LOW: '#FF0000'    // Red
};
```

### Font Choices
- **Primary**: Arial, bold
- **Secondary**: Verdana
- **Numbers**: Courier New (monospace)

---

## 📊 Performance Targets

### Frame Rate
- **Target**: 60 FPS constant
- **Minimum**: 30 FPS
- **Mobile**: 30 FPS acceptable

### Memory
- **Target**: < 200 MB
- **Maximum**: < 500 MB

### Load Time
- **Initial**: < 3 seconds
- **Assets**: < 5 seconds total

### Network (Multiplayer)
- **Latency**: < 100ms ideal
- **Maximum**: < 300ms acceptable
- **Update Rate**: 20 Hz

---

## 🔒 Security Considerations (Phase 4)

### Client-Side
- Input validation
- Anti-cheat measures
- Rate limiting

### Server-Side
- JWT authentication
- SQL injection prevention
- XSS protection
- CORS configuration
- Rate limiting (API)
- Input sanitization

---

## 📝 Code Standards

### JavaScript Style
- ES6+ syntax
- const/let (no var)
- Arrow functions
- Template literals
- Destructuring
- Async/await

### Naming Conventions
- Classes: PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Private: _prefix

### Comments
- JSDoc for public methods
- Inline for complex logic
- TODO for future work

---

**Son Güncelleme:** Aralık 2024  
**Versiyon:** 1.0.0
