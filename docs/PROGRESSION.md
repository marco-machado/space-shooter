# Player Progression System

## Overview

The space shooter features a comprehensive player progression system with multiple upgrade trees, level-based unlocks,
and a prestige system for long-term engagement. The system emphasizes meaningful choices through point scarcity and
prerequisite requirements.

## Level Progression Mathematics

### XP Requirements Formula

- **Base Formula**: `XP_required = 100 * level^1.5 + 50 * (level - 1)`
- Creates a smooth but escalating curve that feels rewarding early but becomes more challenging

### XP Requirements Examples

- Level 1→2: 100 XP
- Level 2→3: 333 XP
- Level 5→6: 1,320 XP
- Level 10→11: 4,610 XP
- Level 20→21: 18,420 XP

### Upgrade Points Per Level

- Levels 1-5: 3 points per level
- Levels 6-10: 4 points per level
- Levels 11-15: 5 points per level
- Levels 16-20: 6 points per level
- Levels 21+: 7 points per level

## Upgrade Trees

### 1. Weapons Tree

#### Laser Branch

- **Laser Damage I** (2 points) - +20% damage
- **Laser Damage II** (3 points) - +30% damage - *Requires: Laser Damage I*
- **Laser Damage III** (5 points) - +40% damage - *Requires: Laser Damage II*
- **Twin Lasers** (4 points) - Fire 2 parallel beams - *Requires: Laser Damage I*
- **Triple Threat** (6 points) - Fire 3 beams in spread pattern - *Requires: Twin Lasers*
- **Laser Velocity** (3 points) - +50% projectile speed
- **Piercing Shots** (5 points) - Lasers pierce through 2 enemies - *Requires: Laser Damage II*

#### Plasma Branch

- **Plasma Core I** (2 points) - +25% damage
- **Plasma Core II** (4 points) - +35% damage - *Requires: Plasma Core I*
- **Plasma Core III** (6 points) - +50% damage - *Requires: Plasma Core II*
- **Blast Radius I** (3 points) - +30% explosion radius
- **Blast Radius II** (5 points) - +50% explosion radius - *Requires: Blast Radius I*
- **Chain Reaction** (7 points) - Plasma explosions trigger mini-explosions - *Requires: Blast Radius II + Plasma Core
  II*
- **Overcharge** (4 points) - Critical hit chance 15% for double damage

#### Missile Branch

- **Missile Bay I** (3 points) - +30% damage
- **Missile Bay II** (5 points) - +45% damage - *Requires: Missile Bay I*
- **Missile Bay III** (7 points) - +60% damage - *Requires: Missile Bay II*
- **Homing System** (4 points) - Missiles track enemies
- **Advanced Targeting** (6 points) - Perfect tracking + faster turn rate - *Requires: Homing System*
- **Cluster Bombs** (5 points) - Missiles split into 3 on impact - *Requires: Missile Bay I*
- **MIRV Warheads** (8 points) - Missiles split mid-flight into 5 seekers - *Requires: Cluster Bombs + Advanced
  Targeting*

#### Universal Weapon Upgrades

- **Heat Sink I** (2 points) - +20% cooling rate
- **Heat Sink II** (3 points) - +35% cooling rate - *Requires: Heat Sink I*
- **Heat Sink III** (5 points) - +50% cooling rate + 20% max heat capacity - *Requires: Heat Sink II*
- **Rapid Fire** (4 points) - +15% fire rate all weapons
- **Ammunition Expert** (6 points) - +25% fire rate all weapons - *Requires: Rapid Fire*

### 2. Defense Tree

#### Hull Branch

- **Reinforced Hull I** (2 points) - +1 max health
- **Reinforced Hull II** (3 points) - +2 max health - *Requires: Reinforced Hull I*
- **Reinforced Hull III** (5 points) - +3 max health - *Requires: Reinforced Hull II*
- **Titanium Plating** (7 points) - +5 max health - *Requires: Reinforced Hull III*
- **Damage Reduction I** (4 points) - 10% damage reduction
- **Damage Reduction II** (6 points) - 20% damage reduction - *Requires: Damage Reduction I*

#### Shield Branch

- **Shield Generator I** (3 points) - Gain 1 regenerating shield point
- **Shield Generator II** (5 points) - 2 shield points - *Requires: Shield Generator I*
- **Shield Generator III** (7 points) - 3 shield points - *Requires: Shield Generator II*
- **Quick Recharge** (4 points) - Shields regenerate 50% faster - *Requires: Shield Generator I*
- **Instant Recharge** (6 points) - Shields regenerate 100% faster - *Requires: Quick Recharge*
- **Shield Burst** (5 points) - When shields break, damages nearby enemies - *Requires: Shield Generator II*

#### Emergency Systems

- **Emergency Repair** (4 points) - Restore 1 HP when below 25% health (60s cooldown)
- **Advanced Repair** (6 points) - Restore 2 HP and clear debuffs - *Requires: Emergency Repair*
- **Last Stand** (8 points) - When fatal damage taken, become invulnerable for 2 seconds (once per level) - *Requires:
  Advanced Repair*

### 3. Mobility Tree

#### Speed Branch

- **Engine Boost I** (2 points) - +15% movement speed
- **Engine Boost II** (3 points) - +25% movement speed - *Requires: Engine Boost I*
- **Engine Boost III** (5 points) - +35% movement speed - *Requires: Engine Boost II*
- **Afterburner** (4 points) - Double-tap for 2x speed burst (3s cooldown)
- **Advanced Afterburner** (6 points) - Longer burst + leaves damaging trail - *Requires: Afterburner*

#### Maneuverability Branch

- **Tight Controls** (2 points) - +30% acceleration/deceleration
- **Expert Pilot** (4 points) - +50% acceleration + smaller hitbox - *Requires: Tight Controls*
- **Barrel Roll** (5 points) - Double-tap to dodge with 0.5s invulnerability (5s cooldown)
- **Evasive Maneuvers** (7 points) - 15% dodge chance - *Requires: Barrel Roll*

### 4. Special Tree

#### Power-up Enhancement

- **Power Magnet** (2 points) - Increased pickup radius
- **Extended Duration I** (3 points) - +5 seconds to temporary power-ups
- **Extended Duration II** (5 points) - +10 seconds to temporary power-ups - *Requires: Extended Duration I*
- **Power Storage** (6 points) - Can hold 2 power-ups, activate with Q/E - *Requires: Extended Duration I*
- **Power Mastery** (8 points) - Power-ups 50% more effective - *Requires: Extended Duration II + Power Storage*

#### Experience Branch

- **Fast Learner I** (3 points) - +15% XP gain
- **Fast Learner II** (5 points) - +30% XP gain - *Requires: Fast Learner I*
- **Fast Learner III** (7 points) - +50% XP gain - *Requires: Fast Learner II*
- **Chain Bonus** (4 points) - Killing enemies quickly grants XP multiplier
- **Perfectionist** (6 points) - No-damage waves grant 2x XP - *Requires: Chain Bonus*

#### Ultimate Abilities (Level 15+ required)

- **Orbital Strike** (10 points) - Call down devastating beam (120s cooldown) - *Requires: Level 15 + any 3 weapon
  upgrades*
- **Time Dilation** (10 points) - Slow time by 50% for 5 seconds (90s cooldown) - *Requires: Level 15 + any 3 mobility
  upgrades*
- **Fortress Mode** (10 points) - Become immobile but gain 5x fire rate + invulnerability for 3 seconds (120s
  cooldown) - *Requires: Level 15 + any 3 defense upgrades*

## Progression Unlocks

### Level-Based Unlocks

- Level 5: Plasma Gun becomes available
- Level 10: Missile Launcher becomes available
- Level 15: Ultimate abilities become available
- Level 20: Elite enemy variants start spawning
- Level 25: Prestige system unlocks

## Prestige System (Level 25+)

Once reaching level 25, players can prestige to:

- Reset to level 1 with a permanent 10% XP bonus
- Keep one upgrade tree of choice
- Unlock exclusive prestige cosmetics
- Access to "Nightmare" difficulty with better rewards

## Point Economy Balance

### Total Points Available

- By Level 10: 35 points
- By Level 20: 85 points
- By Level 30: 155 points

This ensures players must make meaningful choices - they cannot unlock everything immediately and must specialize their
builds. A fully maxed character would require approximately level 35-40, providing long-term goals.

The system encourages experimentation through different build paths while maintaining game balance through point
scarcity and prerequisite requirements.

## Implementation Notes

- Upgrade choices should be persistent across game sessions
- UI should clearly show upgrade prerequisites and costs
- Visual feedback should indicate upgrade effects during gameplay
- Balance testing required to ensure no single path is overpowered
- Consider seasonal events that temporarily modify upgrade effectiveness
