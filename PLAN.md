# Player Progression System Implementation Plan

## Overview

This plan details the implementation of the comprehensive player progression system described in `docs/PROGRESSION.md`.
The system will be implemented using an Agile approach, broken down into 7 epics that each deliver fully working
functionality.

**Reference Documentation:** `docs/PROGRESSION.md`  
**Target Architecture:** Scene-based Phaser.js game with EventBus communication  
**Integration Point:** Extends existing GameStateManager and creates new UpgradeSystem

## Epic Delivery Order

1. **Level Progression with XP Calculation** - Foundation XP/leveling system
2. **Points Accumulation** - Point earning and spending mechanics
3. **Weapons Tree - Laser Branch** - First upgrade tree with UI infrastructure
4. **Universal Tree Upgrades** - Cross-weapon upgrade effects
5. **Defense Tree - Hull Branch** - Health and damage reduction upgrades
6. **Mobility Tree Upgrades** - Speed and movement enhancement upgrades
7. **Remaining Functionality** - Complete the progression system

---

## Architecture Integration Strategy

### Core Integration Points

1. **GameStateManager Extension**
    - Replace simple level progression with complex XP formula
    - Add upgrade points calculation and tracking
    - Integrate with save/load system for persistence

2. **New UpgradeSystem Class**
    - Manages upgrade trees, prerequisites, and effects
    - Validates upgrade purchases and applies effects
    - Integrates with EventBus for upgrade notifications

3. **EventBus Enhancement**
    - Add progression events: `XP_GAINED`, `LEVEL_UP`, `POINTS_EARNED`, `UPGRADE_PURCHASED`
    - Maintain backward compatibility with existing events

4. **UI Infrastructure**
    - New UpgradeTreeScene for upgrade selection interface
    - Enhanced UIScene with progression displays
    - Responsive design for upgrade tree navigation

### Data Persistence Strategy

```javascript
// Enhanced save data structure
{
  // Existing fields preserved
  characterLevel: number,
  totalEnemiesDestroyed: number,
  // New progression fields
  experience: number,
  totalUpgradePoints: number,
  spentUpgradePoints: number,
  purchasedUpgrades: {
    upgradeId: { level: number, purchaseDate: string }
  },
  upgradeEffects: {
    weaponDamageMultiplier: number,
    movementSpeedMultiplier: number,
    // ... other calculated effects
  }
}
```

---

## Epic 1: Level Progression with XP Calculation

### Goals & Deliverables

- Replace simple leveling with mathematical formula: `XP_required = 100 * level^1.5 + 50 * (level - 1)`
- XP gain from enemy kills, level completion bonuses
- Proper level-up events and UI feedback
- Foundation for all subsequent progression features

### Dependencies

- None (foundational epic)

### Tasks

#### 1.1 Update GameStateManager XP Logic (3 points)

- Replace existing `experienceToNextLevel` calculation with formula
- Update `addExperience()` method for proper overflow handling
- Add `calculateXPRequired(level)` helper method
- Update `levelUp()` to use new calculations

#### 1.2 Enhanced XP Sources (2 points)

- Modify enemy destruction handler for XP scaling
- Add level completion XP bonuses
- Add XP multiplier support for future features
- Create XP gain visual feedback system

#### 1.3 Level Progression Events (2 points)

- Enhance `LEVEL_UP` event with detailed data
- Add `XP_GAINED` event for real-time tracking
- Update UIScene to display XP progress bar
- Add level progression animations

#### 1.4 Testing & Validation (2 points)

- Unit tests for XP formula calculations
- Integration tests for level progression flow
- Validate XP requirements match specification examples
- Performance testing for rapid XP gain scenarios

### Definition of Done

- [ ] XP formula matches specification exactly
- [ ] Level progression works from level 1 to 30+
- [ ] XP sources (enemies, levels) provide appropriate amounts
- [ ] UI displays current XP and progress to next level
- [ ] Level-up events trigger properly with correct data
- [ ] Save/load preserves XP and level state
- [ ] No regression in existing gameplay

**Estimated Duration:** 1-2 sprints  
**Story Points:** 9

---

## Epic 2: Points Accumulation

### Goals & Deliverables

- Point allocation system based on level ranges (3-7 points per level)
- Point spending validation and tracking
- Available/spent points display in UI
- Foundation for upgrade purchasing system

### Dependencies

- Epic 1 (Level Progression)

### Tasks

#### 2.1 Points Calculation System (3 points)

- Implement level-based point allocation:
    - Levels 1-5: 3 points per level
    - Levels 6-10: 4 points per level
    - Levels 11-15: 5 points per level
    - Levels 16-20: 6 points per level
    - Levels 21+: 7 points per level
- Add `calculatePointsForLevel(level)` method
- Update level-up handler to award points

#### 2.2 Point Spending Infrastructure (4 points)

- Create point validation system (can't spend more than available)
- Add `spendPoints(amount, reason)` method
- Create `POINTS_EARNED` and `POINTS_SPENT` events
- Implement point refund system for future respec functionality

#### 2.3 Points UI Display (2 points)

- Add available/spent points to UIScene
- Create points history for debugging
- Add points-earned notification animations
- Update progression display layout

#### 2.4 Data Persistence (2 points)

- Extend save system for points data
- Add data migration for existing saves
- Validate point calculations on load
- Add corruption detection/recovery

### Definition of Done

- [ ] Points awarded correctly based on level ranges
- [ ] Point spending validation prevents overspending
- [ ] Available/spent points displayed accurately in UI
- [ ] Points earned notifications appear on level-up
- [ ] Point data persists across game sessions
- [ ] Point history tracking works for debugging
- [ ] Data migration handles existing saves gracefully

**Estimated Duration:** 1-2 sprints  
**Story Points:** 11

---

## Epic 3: Weapons Tree - Laser Branch

### Goals & Deliverables

- Complete upgrade tree infrastructure with UI
- Laser weapon upgrade branch with 7 upgrades
- Prerequisite system and upgrade validation
- First fully functional upgrade tree demonstrating the system

### Dependencies

- Epic 2 (Points Accumulation)

### Tasks

#### 3.1 Upgrade System Architecture (5 points)

- Create `UpgradeSystem` class for managing upgrades
- Design upgrade data structure with prerequisites
- Implement upgrade validation and purchase logic
- Create upgrade effect application system

#### 3.2 Upgrade Tree UI Scene (6 points)

- Create `UpgradeTreeScene` with tree navigation
- Design responsive upgrade tree layout
- Implement upgrade purchase interface
- Add prerequisite visualization and tooltips

#### 3.3 Laser Branch Implementation (4 points)

- Implement 7 laser upgrades from specification:
    - Laser Damage I, II, III (damage multipliers)
    - Twin Lasers (dual projectiles)
    - Triple Threat (spread pattern)
    - Laser Velocity (speed increase)
    - Piercing Shots (penetration mechanics)
- Create prerequisite relationships
- Implement upgrade effects in weapon system

#### 3.4 Weapon System Integration (4 points)

- Modify Player weapon firing for upgrade effects
- Add laser upgrade visual feedback
- Implement piercing projectile mechanics
- Update projectile pooling for multiple types

#### 3.5 Testing & Polish (3 points)

- Test all laser upgrade combinations
- Validate prerequisite enforcement
- Test UI navigation and purchase flow
- Performance testing with upgraded weapons

### Definition of Done

- [ ] Upgrade tree UI allows navigation and purchase
- [ ] All 7 laser upgrades implemented with correct effects
- [ ] Prerequisites prevent invalid purchases
- [ ] Upgrade effects visible in gameplay (damage, patterns, etc.)
- [ ] Purchased upgrades persist across sessions
- [ ] UI clearly shows upgrade costs and requirements
- [ ] No performance degradation with upgraded weapons
- [ ] Upgrade purchase flow is intuitive and bug-free

**Estimated Duration:** 2-3 sprints  
**Story Points:** 22

---

## Epic 4: Universal Tree Upgrades

### Goals & Deliverables

- Heat Sink system affecting weapon cooling for all weapons
- Rapid Fire system affecting fire rate for all weapons
- Cross-weapon upgrade effect infrastructure
- Demonstration of universal upgrade mechanics

### Dependencies

- Epic 3 (Upgrade Infrastructure)

### Tasks

#### 4.1 Universal Upgrade Framework (3 points)

- Design system for upgrades affecting multiple weapon types
- Create weapon modification pipeline
- Implement universal effect stacking
- Add universal upgrade categories to UI

#### 4.2 Heat Sink System (4 points)

- Implement weapon overheating mechanics
- Create cooling rate system for all weapons
- Add Heat Sink I, II, III upgrades (20%, 35%, 50% + capacity)
- Add overheating visual feedback and UI

#### 4.3 Rapid Fire System (3 points)

- Implement fire rate modification system
- Add Rapid Fire (15% increase) and Ammunition Expert (25% increase)
- Ensure fire rate changes work across all weapon types
- Add fire rate visual/audio feedback

#### 4.4 Weapon System Expansion (3 points)

- Prepare weapon system for Plasma and Missile weapons
- Create weapon type abstraction for universal effects
- Add weapon switching validation with upgrades
- Update weapon configuration system

### Definition of Done

- [ ] Heat Sink upgrades affect cooling for all weapons
- [ ] Rapid Fire upgrades affect fire rate for all weapons
- [ ] Universal upgrades work with existing laser upgrades
- [ ] Weapon overheating system works intuitively
- [ ] Universal upgrade effects visible in UI and gameplay
- [ ] System ready for additional weapon types
- [ ] Performance remains stable with multiple upgrades

**Estimated Duration:** 2 sprints  
**Story Points:** 13

---

## Epic 5: Defense Tree - Hull Branch

### Goals & Deliverables

- Hull upgrades affecting player max health
- Damage reduction system
- Health system integration with upgrades
- Defense upgrade tree UI section

### Dependencies

- Epic 2 (Points system established)

### Tasks

#### 5.1 Enhanced Health System (4 points)

- Extend HealthComponent for max health modifications
- Add health upgrade visual feedback
- Implement health increase notifications
- Update health display for variable max health

#### 5.2 Hull Branch Upgrades (4 points)

- Implement Reinforced Hull I, II, III (+1, +2, +3 health)
- Add Titanium Plating (+5 health)
- Create health upgrade purchase validation
- Add hull upgrade visual effects

#### 5.3 Damage Reduction System (5 points)

- Implement damage calculation modification pipeline
- Add Damage Reduction I, II (10%, 20% reduction)
- Integrate damage reduction with collision system
- Add damage reduction visual feedback

#### 5.4 Defense Tree UI (3 points)

- Add Defense tree section to upgrade UI
- Implement hull branch visualization
- Add defense upgrade tooltips and descriptions
- Update upgrade tree navigation

### Definition of Done

- [ ] Hull upgrades increase player max health correctly
- [ ] Damage reduction upgrades reduce incoming damage
- [ ] Health system properly handles variable max health
- [ ] Defense upgrades visible in upgrade tree UI
- [ ] Damage reduction effects clear to player
- [ ] Health/defense upgrades persist across sessions
- [ ] Visual feedback confirms upgrade effects

**Estimated Duration:** 2 sprints  
**Story Points:** 16

---

## Epic 6: Mobility Tree Upgrades

### Goals & Deliverables

- Speed upgrades affecting player movement
- Special abilities: Afterburner and Barrel Roll
- Enhanced movement system with upgrade effects
- Mobility upgrade tree UI section

### Dependencies

- Epic 2 (Points system established)

### Tasks

#### 6.1 Enhanced Movement System (4 points)

- Modify Player movement for speed multipliers
- Add movement upgrade effect pipeline
- Implement speed change visual feedback
- Update movement configuration system

#### 6.2 Speed Branch Upgrades (3 points)

- Implement Engine Boost I, II, III (15%, 25%, 35% speed)
- Add speed upgrade purchase validation
- Create speed change notifications
- Add speed upgrade visual effects

#### 6.3 Afterburner Special Ability (5 points)

- Implement double-tap detection for activation
- Add Afterburner (2x speed burst, 3s cooldown)
- Create Advanced Afterburner (longer + damage trail)
- Add afterburner visual and audio effects

#### 6.4 Maneuverability & Dodge System (5 points)

- Add Tight Controls (30% acceleration increase)
- Implement Expert Pilot (50% acceleration + smaller hitbox)
- Create Barrel Roll (double-tap dodge + 0.5s invulnerability)
- Add Evasive Maneuvers (15% passive dodge chance)

#### 6.5 Mobility Tree UI (2 points)

- Add Mobility tree section to upgrade UI
- Implement speed/maneuverability branch visualization
- Add special ability upgrade descriptions
- Update tree navigation for mobility upgrades

### Definition of Done

- [ ] Speed upgrades affect player movement speed
- [ ] Afterburner special ability works with double-tap
- [ ] Barrel Roll provides invulnerability frames
- [ ] Dodge chance system works for Evasive Maneuvers
- [ ] Special abilities have appropriate cooldowns
- [ ] Mobility upgrades visible in upgrade tree UI
- [ ] Movement feels responsive with upgrades
- [ ] Special abilities have clear visual feedback

**Estimated Duration:** 2-3 sprints  
**Story Points:** 19

---

## Epic 7: Remaining Functionality

This epic completes the progression system by implementing all remaining features in priority order.

### Dependencies

- Epics 1-6 (Complete progression infrastructure)

### 7A: Plasma & Missile Weapon Branches (8 points)

#### Tasks

- Implement Plasma weapon with explosion mechanics
- Add Plasma Core I, II, III damage upgrades
- Create Blast Radius upgrades with area effects
- Implement Chain Reaction upgrade
- Add Overcharge upgrade with critical hit system
- Create Missile weapon with tracking mechanics
- Implement Missile Bay damage upgrades
- Add Homing System and Advanced Targeting
- Create Cluster Bombs and MIRV Warheads

### 7B: Shield Branch (Defense Tree) (6 points)

#### Tasks

- Implement regenerating shield system
- Add Shield Generator I, II, III upgrades
- Create Quick Recharge and Instant Recharge upgrades
- Implement Shield Burst upgrade with area damage
- Add shield visual effects and UI

### 7C: Special Tree - Power-up Enhancement (4 points)

#### Tasks

- Implement Power Magnet upgrade
- Add Extended Duration upgrades for power-ups
- Create Power Storage system (hold 2 power-ups)
- Implement Power Mastery upgrade

### 7D: Experience Branch (Special Tree) (3 points)

#### Tasks

- Add Fast Learner I, II, III XP multipliers
- Implement Chain Bonus XP system
- Create Perfectionist upgrade (no-damage XP bonus)

### 7E: Emergency Systems (Defense Tree) (5 points)

#### Tasks

- Implement Emergency Repair with cooldown system
- Add Advanced Repair upgrade
- Create Last Stand ultimate ability
- Add emergency system UI and notifications

### 7F: Ultimate Abilities (Special Tree) (6 points)

#### Tasks

- Implement Orbital Strike ultimate ability
- Add Time Dilation ultimate ability
- Create Fortress Mode ultimate ability
- Add ultimate ability UI and cooldown management

### 7G: Level-based Unlocks (3 points)

#### Tasks

- Implement weapon availability gates
- Add level-based feature unlocks
- Create unlock notification system
- Update UI for locked content

### 7H: Prestige System (8 points)

#### Tasks

- Implement prestige reset mechanics
- Add permanent XP bonus system
- Create upgrade tree preservation choice
- Implement Nightmare difficulty mode
- Add prestige UI and cosmetics

### Definition of Done for Epic 7

- [ ] All weapon branches fully implemented and balanced
- [ ] Shield system works with regeneration mechanics
- [ ] Special tree enhances power-ups and XP gain
- [ ] Emergency systems provide tactical options
- [ ] Ultimate abilities provide powerful late-game options
- [ ] Level-based unlocks gate progression appropriately
- [ ] Prestige system provides long-term goals
- [ ] All upgrade trees complete and balanced
- [ ] Full progression system ready for release

**Estimated Duration:** 4-5 sprints  
**Story Points:** 43

---

## Cross-Epic Considerations

### Performance Requirements

- Maintain 60 FPS with all upgrades active
- Memory usage increase <20% from baseline
- Upgrade calculations optimized for real-time application
- UI rendering efficient for complex upgrade trees

### Balance & Testing Strategy

- Comprehensive balance testing after each epic
- Player feedback integration for upgrade effectiveness
- Automated testing for upgrade combinations
- Performance benchmarking with maximum upgrades

### Risk Mitigation

- Modular upgrade system allows easy balance adjustments
- Config-driven upgrade values for runtime adjustments
- Rollback capability for problematic upgrades
- Save system versioning for upgrade data changes

### Success Criteria

- All progression features work as specified
- Player engagement metrics show increased session time
- Upgrade system provides meaningful player choices
- No performance regression from baseline game
- Save system maintains backwards compatibility

---

## Implementation Timeline

### Sprint Planning Suggestions

- **Sprints 1-2:** Epic 1 (Level Progression)
- **Sprints 3-4:** Epic 2 (Points Accumulation)
- **Sprints 5-7:** Epic 3 (Weapons Tree - Laser Branch)
- **Sprints 8-9:** Epic 4 (Universal Tree Upgrades)
- **Sprints 10-11:** Epic 5 (Defense Tree - Hull Branch)
- **Sprints 12-14:** Epic 6 (Mobility Tree Upgrades)
- **Sprints 15-19:** Epic 7 (Remaining Functionality)

### Total Estimated Effort

- **Story Points:** 133 points
- **Duration:** 15-19 sprints
- **Team Size:** 2-3 developers recommended

---

This plan provides a comprehensive roadmap for implementing the full progression system while maintaining the existing
game's quality and performance. Each epic delivers working functionality that enhances the player experience, building
toward the complete progression system described in the specification.
