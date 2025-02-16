const rarityList = [
    { name: "basic", chance: 30 },
    { name: "rare holo", chance: 15 },
    { name: "radiant rare", chance: 10 },
    { name: "rare rainbow alt", chance: 8 },
    { name: "rare holo vmax", chance: 7 },
    { name: "rare rainbow", chance: 6 },
    { name: "rare secret", chance: 5 },
    { name: "rare shiny", chance: 4 },
    { name: "rare shiny v", chance: 3 },
    { name: "rare shiny vmax", chance: 2.5 },
    { name: "trainer gallery rare holo", chance: 2 },
    { name: "rare holo v", chance: 2 },
    { name: "rare holo vstar", chance: 2 },
    { name: "rare ultra", chance: 0.5 },
    { name: "rare holo cosmos", chance: 0.5 },
];

export function getRandomRarity(): string {
    const totalChance = rarityList.reduce((sum, rarity) => sum + rarity.chance, 0);
    let random = Math.random() * totalChance;
    
    for (const rarity of rarityList) {
        if (random < rarity.chance) {
            return rarity.name;
        }
        random -= rarity.chance;
    }
    
    return "basic";
}

const typeList = [
    { name: "blueAura", chance: 15 },
    { name: "redAura", chance: 15 },
    { name: "greenAura", chance: 14 },
    { name: "purpleAura", chance: 12 },
    { name: "orangeAura", chance: 11 },
    { name: "darkGreenAura", chance: 10 },
    { name: "lightBlueAura", chance: 9 },
    { name: "soilAura", chance: 8 },
    { name: "pinkAura", chance: 5.5 },
    { name: "ultraAura", chance: 0.5 }
];

export function getRandomType(): string {
    const totalChance = typeList.reduce((sum, type) => sum + type.chance, 0);
    let random = Math.random() * totalChance;
    
    for (const type of typeList) {
        if (random < type.chance) {
            return type.name;
        }
        random -= type.chance;
    }
    
    return "blueAura";
}