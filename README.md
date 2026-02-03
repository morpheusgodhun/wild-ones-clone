# 🎮 Wild Ones Clone

2D sıra tabanlı, fizik tabanlı, yıkılabilir harita özellikli web oyunu. Phaser 3 ve Matter.js ile geliştirilmiştir.

## 🚀 Kurulum

### Gereksinimler
- Node.js 16+
- npm veya yarn

### Adımlar

```bash
# Bağımlılıkları yükle
npm install

# Development server başlat
npm run dev

# Production build
npm run build
```

Tarayıcıda `http://localhost:5173` adresini açın.

## 🎯 Oyun Özellikleri

### ✅ Mevcut Özellikler (v1.0)

- **Sıra Tabanlı Sistem**: Her turda bir karakter aktif
- **Fizik Motoru**: Matter.js ile gerçekçi fizik
- **İki Takım**: Kırmızı vs Mavi (3v3)
- **İki Silah**: 
  - Bazooka (sınırsız mermi)
  - Grenade (5 mermi, timer ile patlar)
- **Power Sistem**: Basılı tutarak güç ayarlama
- **Aim Sistem**: Mouse ile nişan alma
- **Rüzgar Etkisi**: Her turda değişen rüzgar
- **Hasar Sistemi**: Mesafe tabanlı patlama hasarı
- **Health Bar**: Her karakter için HP göstergesi
- **Turn Timer**: 30 saniyelik tur süresi
- **Düşme Hasarı**: Yüksekten düşen karakterler hasar alır
- **Fizik Efektleri**: Patlama force, bounce, trail efektleri

## 🕹️ Kontroller

### Klavye
- **A / D**: Sol/Sağ hareket
- **W**: Zıplama
- **↑ / ↓**: Nişan açısı ayarlama
- **Q / E**: Silah değiştirme
- **SPACE**: Ateş etme (basılı tut = güç ayarla)

### Mouse
- **Mouse Move**: Nişan alma
- **Click & Hold**: Güç şarj etme
- **Release**: Ateş etme

## 📁 Proje Yapısı

```
wild-ones-clone/
├── src/
│   ├── config/
│   │   ├── Constants.js          # Oyun sabitleri
│   │   └── GameConfig.js         # Phaser konfigürasyonu
│   │
│   ├── scenes/
│   │   └── GameScene.js          # Ana oyun sahnesi
│   │
│   ├── entities/
│   │   └── Character.js          # Karakter sınıfı
│   │
│   ├── managers/
│   │   └── TurnManager.js        # Tur yönetimi
│   │
│   ├── weapons/
│   │   ├── BaseWeapon.js         # Silah base class
│   │   ├── Bazooka.js            # Bazooka silahı
│   │   └── Grenade.js            # Grenade silahı
│   │
│   ├── utils/
│   │   ├── EventBus.js           # Event sistemi
│   │   └── MathUtils.js          # Matematik yardımcıları
│   │
│   └── main.js                   # Entry point
│
├── index.html                    # Ana HTML
├── package.json
└── README.md
```

## 🏗️ Mimari

### Design Patterns

#### 1. **Event-Driven Architecture**
- EventBus singleton ile decoupled communication
- Component'ler arası loose coupling

#### 2. **State Management**
- TurnManager ile game state kontrolü
- Explicit state transitions

#### 3. **Strategy Pattern**
- BaseWeapon abstract class
- Her silah kendi fire() implementasyonu

#### 4. **Component-Based**
- Character = Physics + Graphics + Logic
- Modüler ve genişletilebilir

### Teknoloji Kararları

#### Neden Phaser 3?
✅ Mature ve stabil framework  
✅ Built-in scene management  
✅ Güçlü plugin sistemi  
✅ Excellent documentation  
✅ Active community  

#### Neden Matter.js?
✅ Polygon-based collision (destructible terrain için gerekli)  
✅ Composite bodies  
✅ Constraint system  
✅ Performans/realism dengesi  
✅ Phaser 3 ile native entegrasyon  

## 🎮 Oynanış

1. **Oyun Başlangıcı**: Kırmızı takım başlar
2. **Tur Akışı**:
   - Aktif karakter sarı çember ile gösterilir
   - 30 saniye içinde hareket et ve ateş et
   - Mouse ile nişan al
   - Click & hold ile güç ayarla
   - Release ile ateş et
3. **Fizik Simülasyonu**: Mermi uçar, patlar, karakterlere hasar verir
4. **Tur Sonu**: Fizik stabilize olunca sıra değişir
5. **Kazanma**: Rakip takımı yok et!

## 🐛 Bilinen Sınırlamalar (v1.0)

- Destructible terrain henüz implement edilmedi (placeholder)
- Sadece 2 silah var
- Bot AI yok
- Multiplayer yok
- Sound effects yok
- Sprite'lar placeholder (circle graphics)
- Terrain polygon-based değil, static rectangle

## 📚 Geliştirme Roadmap

### Phase 1: Temel Mekanikler ✅ (Tamamlandı)
- [x] Fizik motoru entegrasyonu
- [x] Karakter sistemi
- [x] Sıra tabanlı sistem
- [x] Temel silahlar (Bazooka, Grenade)
- [x] Hasar sistemi
- [x] UI (HUD, power bar, aim)

### Phase 2: Gelişmiş Özellikler (Sırada)
- [ ] **Destructible Terrain** (yıkılabilir arazi)
- [ ] Daha fazla silah (Shotgun, Minigun, Nuke, etc.)
- [ ] Power-ups (health pack, weapon crate)
- [ ] Animasyonlar (character sprites)
- [ ] Sound effects & music
- [ ] Particle effects (iyileştirme)
- [ ] Camera improvements (zoom, follow projectile)

### Phase 3: Polishing
- [ ] Main menu
- [ ] Settings menu
- [ ] Team selection
- [ ] Character customization
- [ ] Victory screen
- [ ] Statistics
- [ ] Achievements

### Phase 4: AI & Multiplayer
- [ ] Bot AI (basit heuristic)
- [ ] ASP.NET Core backend
- [ ] SignalR multiplayer
- [ ] Matchmaking
- [ ] Player profiles
- [ ] Leaderboard

### Phase 5: Content
- [ ] Multiple maps
- [ ] Weather effects
- [ ] Special game modes
- [ ] Daily challenges
- [ ] Unlockable content

## 🔧 Geliştirme Notları

### Performans
- Object pooling kullanılacak (projectile'lar için)
- Physics step 60 FPS'te sabitlendi
- Particle count optimize edilmeli

### Kod Kalitesi
- ESLint configuration eklenecek
- Unit tests yazılacak
- Documentation iyileştirilecek

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile support (touch controls)
- WebGL fallback to Canvas

## 📄 Lisans

MIT License - Eğitim ve öğrenme amaçlıdır.

## 🙏 Teşekkürler

- Phaser.js team
- Matter.js team
- Wild Ones (Playdom) - orijinal oyun için ilham

## 📞 İletişim

Sorularınız için issue açabilirsiniz.

---

**Not**: Bu bir eğitim projesidir. Wild Ones markası Playdom'a aittir.
