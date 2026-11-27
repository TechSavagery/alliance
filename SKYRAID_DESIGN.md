# 🚀 Sky Raid - Complete Game Design Document

## Overview
Sky Raid is a multiplayer vertical scrolling shooter designed for 30-minute team bonding sessions with both cooperative and competitive modes.

---

## 🎮 Game Modes

### Mode 1: Co-op (Default)
- **Players**: 2-6 players working together
- **Goal**: Survive 30 minutes and reach highest wave/score possible
- **Win Condition**: Team rank based on waves cleared and total score
- **Special Mechanics**:
  - Revive downed teammates (fly near them for 2 seconds)
  - Shared wave progression
  - Team score visible
  - Individual scores also tracked for MVP awards

### Mode 2: Free-For-All
- **Players**: 2-6 players competing
- **Goal**: Highest individual score after 30 minutes
- **Win Condition**: Player with most points wins
- **Special Mechanics**:
  - No revives (auto-respawn after 2 seconds)
  - Compete for power-up pickups
  - Individual leaderboard

---

## ⚡ Power-Up System

### Drop Mechanics
- Enemies have 25% chance to drop power-up on death
- Power-ups drift downward slowly (can be missed)
- First player to touch gets it (competitive)
- Visual indicator: glowing icon with colored aura

### Power-Up Types

#### 1. 🔫 Weapon Upgrade (Orange)
**Tiers:**
- Tier 1 (Base): Single shot, 180ms cooldown
- Tier 2: Double shot (spread), 170ms cooldown
- Tier 3: Triple shot (wider spread), 160ms cooldown
- Tier 4: Quad shot, 150ms cooldown
- Tier 5 (MAX): Spray pattern (5 bullets), 140ms cooldown + piercing

**Lost on death** - restart at Tier 1

#### 2. ⚡ Speed Boost (Blue)
**Levels:**
- Level 1 (Base): 4.2 speed
- Level 2: 5.0 speed
- Level 3: 5.8 speed
- Level 4 (MAX): 6.6 speed

**Lost on death** - restart at Level 1

#### 3. 🛡️ Shield (Green)
- Adds +1 shield (max 3)
- Each shield absorbs one hit
- Visual: Glowing ring around plane (1 ring per shield)
- **Shields persist through death** (keeps your lives)

#### 4. 💣 Bomb (Red)
- Adds +1 screen-clear bomb (max 3)
- Activated with 'B' key
- Clears all enemies and bullets on screen
- Drops item pickups from cleared enemies
- **Bombs lost on death**

#### 5. ⭐ Score Multiplier (Yellow - Rare, 5% drop)
- Temporary 2x score multiplier for 15 seconds
- Stacks: 2x → 3x → 4x (max)
- Visual: Glowing trail behind plane

---

## 📈 Progression System

### Session Structure (30 Minutes)

**Timeline:**
```
0:00 - Start: Wave 1 (Tutorial pace)
5:00 - Milestone 1: Upgrade choice + mini-boss
10:00 - Milestone 2: Upgrade choice + BOSS 1
15:00 - Milestone 3: Upgrade choice + mini-boss  
20:00 - Milestone 4: Upgrade choice + BOSS 2
25:00 - Milestone 5: Upgrade choice + elite waves
30:00 - FINAL BOSS + Victory
```

### Milestone Upgrade Choices
When you reach a milestone, game pauses briefly and shows 3 upgrade options (pick 1):

**Example choices:**
- Homing Missiles (bullets track enemies)
- Faster Fire Rate (-30ms cooldown)
- Side Guns (shoot left+right)
- Rear Guard (rear-facing gun)
- Lucky (25% → 40% power-up drop rate)
- Magnetism (auto-collect nearby power-ups)
- Second Life (auto-revive once)
- Team Shield (everyone gets +1 shield in co-op)

### Difficulty Scaling (Gradual)

**Per Minute:**
- Enemy HP: +3% (max +150% at 30 min)
- Enemy Speed: +4% (max +180% at 30 min)
- Enemy Spawn Rate: -50ms interval per minute
- Enemy Count per Wave: +1 every 3 minutes
- Enemy Fire Rate: +5% per minute

**Wave Rotation:**
- Waves 1-5: Circle fighters only
- Waves 6-10: Circles + Squares
- Waves 11-15: All types + shooting back
- Waves 16-20: Dense formations + bullet patterns
- Waves 21-25: Aggressive + divebombs
- Waves 26-30: Bullet hell patterns

---

## 👾 Enemy Types

### Current Enemies (Enhanced)

#### Circle Fighter (Red) - 1 HP
- **Behavior**: Weaving pattern, can shoot single bullets (wave 11+)
- **Speed**: Medium, increases with difficulty
- **Score**: 50 points
- **Drop Rate**: 25%

#### Square Tank (Pink) - 3 HP
- **Behavior**: Straight path, shoots spread (wave 15+)
- **Speed**: Slow
- **Score**: 150 points
- **Drop Rate**: 35%

#### Diamond Bomber (Purple) - 2 HP
- **Behavior**: Fast, drops bullet spreads downward
- **Speed**: Fast
- **Score**: 100 points
- **Drop Rate**: 30%

### New Enemy Types (To Add)

#### Triangle Interceptor (Green) - 1 HP
- **Behavior**: Fast horizontal dash attacks
- **Speed**: Very fast
- **Score**: 75 points
- **Appears**: Wave 8+

#### Hexagon Carrier (Blue) - 5 HP
- **Behavior**: Spawns 2 circle fighters when destroyed
- **Speed**: Slow
- **Score**: 300 points
- **Appears**: Wave 12+

#### Star Elite (Gold) - 8 HP
- **Behavior**: Complex bullet patterns, rarely appears
- **Speed**: Medium
- **Score**: 500 points
- **Appears**: Wave 15+, 10% spawn chance

---

## 🏆 Boss Battles

### Boss 1: "The Destroyer" (10-min mark / ~Wave 15)
- **HP**: 300
- **Size**: 3x regular enemy
- **Phases**:
  1. Shoots rotating spreads
  2. Spawns 4 turrets at corners (20 HP each)
  3. Bullet spiral pattern + fast movement
- **Drops**: Guaranteed weapon upgrade + 2 shields + 2 bombs

### Boss 2: "Sky Fortress" (20-min mark / ~Wave 30)
- **HP**: 600
- **Size**: 5x regular enemy
- **Parts**: Wings (100 HP each), Turrets (80 HP each), Core (200 HP)
- **Phases**:
  1. Defensive - turrets active
  2. Aggressive - shoots laser beams
  3. Desperation - bullet hell + enemy spawns
- **Drops**: Max weapon + 3 shields + 3 bombs + temporary invincibility

### Final Boss: "Void Commander" (30-min mark / ~Wave 45)
- **HP**: 1000
- **Size**: Massive (screen-filling)
- **Mechanics**: 
  - Telegraphed attacks (warnings show safe zones)
  - Summons all enemy types
  - 4 phases with different bullet patterns
- **Victory**: Beating this = S-Rank team

---

## 🎯 Co-op Specific Mechanics

### Revive System
1. When player dies, ghost plane appears at death location
2. Living player flies within 50px radius for 2 seconds (progress bar)
3. Revived player spawns with 1 shield, Tier 1 weapon, loses other upgrades
4. Revive grants 200 points to reviver

### Team Score Display
```
╔════════════════════════════════════╗
║ TEAM SCORE: 45,320                 ║
║ Wave 18 | Time: 15:32               ║
╠════════════════════════════════════╣
║ You: 12,450  ⚡⚡🛡️💣💣             ║
║ Player2: 8,900  ⚡🛡️🛡️              ║
║ Player3: 11,200  ⚡⚡⚡🛡️💣          ║
║ [DEAD] Player4: 7,450               ║
╚════════════════════════════════════╝
```

---

## 🏁 Victory Conditions & Ranks

### Team Ranks (Co-op)
- **S-Rank**: Defeated Final Boss (30 min)
- **A-Rank**: Reached wave 35+ (25+ min)
- **B-Rank**: Reached wave 25+ (20+ min)
- **C-Rank**: Reached wave 15+ (15+ min)
- **D-Rank**: Below wave 15

### Post-Game Screen

```
╔══════════════════════════════════════════╗
║          MISSION COMPLETE!               ║
║                                          ║
║  Rank: A                                 ║
║  Team Score: 125,450                     ║
║  Waves Cleared: 32                       ║
║  Time Survived: 25:43                    ║
║                                          ║
║  MVP AWARDS:                             ║
║  🏆 Top Score: Player3 (38,920)          ║
║  💀 Most Kills: Player1 (142)            ║
║  🤝 Team Player: Player2 (8 revives)     ║
║  🛡️ Survivor: Player3 (1 death)          ║
║                                          ║
║  WINNER BONUS:                           ║
║  Player3 starts next round with:         ║
║  [ Tier 2 Weapon ] or [ +1 Shield ]      ║
╚══════════════════════════════════════════╝
```

---

## 🎨 Visual Design (Minimalist)

### Color Palette
- **Background**: Dark space (0x07111f)
- **Player Ships**: Bright colors (existing palette)
- **Enemies**: 
  - Red (fighter), Pink (tank), Purple (bomber)
  - Green (interceptor), Blue (carrier), Gold (elite)
- **Power-ups**:
  - Orange (weapon), Blue (speed), Green (shield)
  - Red (bomb), Yellow (multiplier)
- **UI**: Cyan text (0x9be7ff), Yellow headers (0xffd166)

### Visual Effects (Keep Clean)
- Bullet trails (subtle glow)
- Explosion particles (simple circles)
- Shield rings (animated pulse)
- Power-up glow (rotating gradient)
- Screen shake on bomb use
- Slow-motion on boss defeat (1 second)

---

## 🎮 Controls

### Keyboard
- **WASD / Arrow Keys**: Movement
- **Space**: Shoot
- **B**: Use bomb (when available)
- **Shift**: Focus mode (slower movement, precise dodging)
- **Tab**: Show full scoreboard
- **Esc**: Pause menu

---

## 💾 Persistent Data (Minimal)

### Account Level
- Total games played
- Best co-op rank achieved
- Highest FFA score
- Total enemies killed
- Favorite plane color choice

### Session Winner Bonus
- Winner of previous round gets choice:
  - Start with Tier 2 weapon, OR
  - Start with +1 shield
- Resets when player closes game

---

## 🔧 Technical Implementation Notes

### Schema Changes Needed
```typescript
// Add to SkyRaidPlayer
powerLevel: number = 1;        // weapon tier (1-5)
speedLevel: number = 1;        // speed tier (1-4)
shields: number = 0;           // current shields (0-3)
bombs: number = 0;             // bombs available (0-3)
multiplier: number = 1.0;      // score multiplier
multiplierEnds: number = 0;    // timestamp when multiplier expires

// New schema
class PowerUp extends Schema {
  x: number;
  y: number;
  type: number;  // 0=weapon, 1=speed, 2=shield, 3=bomb, 4=multiplier
  vy: number = 1; // drift speed
}

// Add to SkyRaidState
powerUps: MapSchema<PowerUp>;
gameMode: string = "coop";     // "coop" or "ffa"
sessionTime: number = 0;        // seconds elapsed
nextMilestone: number = 300;    // next milestone at 5 min
```

### Server Logic
1. Power-up spawning on enemy death
2. Power-up collection detection
3. Upgrade application
4. Revive progress tracking (co-op)
5. Milestone detection and pause
6. Boss spawning logic
7. Difficulty scaling per minute

### Client Rendering
1. Power-up sprites with glow effect
2. Weapon tier visual differences
3. Shield rings animation
4. Bomb UI counter
5. Score multiplier indicator
6. Revive progress bar
7. Session timer display

---

## 🚀 Implementation Priority

### Phase 1: Core Upgrades ✅ Next
1. Add power-up schema & drops
2. Weapon tier system
3. Speed upgrades
4. Shield system
5. Bomb functionality

### Phase 2: Session Structure
1. 30-minute timer
2. Milestone system
3. Upgrade choice UI
4. Difficulty scaling

### Phase 3: Game Modes
1. Mode selection screen
2. Co-op revive mechanic
3. FFA scoring differences

### Phase 4: Bosses
1. Boss spawn system
2. Boss 1 implementation
3. Boss 2 implementation
4. Final boss

### Phase 5: Polish
1. Victory screen
2. MVP awards
3. Winner bonus system
4. Visual effects
5. Sound effects (optional)

---

## 📊 Balancing Goals

### Difficulty Curve
- Minutes 0-10: Learning, forgiving
- Minutes 10-20: Challenging, requires upgrades
- Minutes 20-30: Intense, requires teamwork & skill

### Power-Up Economy
- Average 1 power-up every 4 enemy kills
- Should reach Tier 3 weapon by 10 minutes with average play
- Max build (Tier 5 + Speed 4 + 3 shields + 3 bombs) rare but achievable by 20 min

### Death Penalty
- Losing all upgrades is harsh but fair
- Encourages careful play
- Shields provide forgiveness for mistakes
- Revives in co-op reduce frustration

---

## 🎯 Success Metrics

### Team Bonding Goals
- 90%+ of teams reach 15 minutes (C-Rank minimum)
- 50% of teams reach 20 minutes (B-Rank)
- 20% of teams reach 30 minutes (S/A-Rank)
- Average session: 18-22 minutes

### Engagement
- Players want to retry immediately after loss
- Discussions about strategy between rounds
- "One more game!" factor
- Competition for MVP awards drives improvement

---

*Document Version 1.0 - Ready for Implementation*
