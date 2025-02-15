// --- Constants ---
const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;
const TITLE = "Chroma Quest";
const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];
const BUTTON_COLOR = [100, 100, 100];
const FONT_SIZE = 24;
const OUTLINE_COLOR = BLACK;
const OUTLINE_THICKNESS = 2;
const HOVER_OUTLINE_THICKNESS = 4;
const DEBUG_MODE = false;
const BASE_SEED = 6398032171;
const SAVE_FILE_EXTENSION = ".chromaquestsave";
const SAVE_FILENAME = "save" + SAVE_FILE_EXTENSION; // Filename is now constant
const ENCRYPTION_KEY = "ChromaQuestEncryptionKey123"; // Simple encryption key

// --- Colors ---
const COLORS = [
    [255, 0, 0],     // Red
    [0, 255, 0],     // Green
    [0, 0, 255],     // Blue
    [255, 255, 0],   // Yellow
    [255, 0, 255],   // Magenta
    [0, 255, 255],   // Cyan
    [128, 0, 0],     // Maroon
    [0, 128, 0],     // Dark Green
    [0, 0, 128],     // Navy
    [128, 128, 128], // Gray
    [192, 192, 192], // Silver
    [255, 165, 0],   // Orange
    [128, 0, 128],   // Purple
    [0, 128, 128],   // Teal
    [255, 255, 255], // White
    [0, 0, 0],       // Black
    [210, 105, 30],  // Chocolate
    [255, 20, 147],  // Deep Pink
    [60, 179, 113], // Medium Sea Green
    [107, 142, 35]  // Olive Drab
];

const COLOR_NAMES = {
    "[255,0,0]": "Red",
    "[0,255,0]": "Green",
    "[0,0,255]": "Blue",
    "[255,255,0]": "Yellow",
    "[255,0,255]": "Magenta",
    "[0,255,255]": "Cyan",
    "[128,0,0]": "Maroon",
    "[0,128,0]": "Dark Green",
    "[0,0,128]": "Navy",
    "[128,128,128]": "Gray",
    "[192,192,192]": "Silver",
    "[255,165,0]": "Orange",
    "[128,0,128]": "Purple",
    "[0,128,128]": "Teal",
    "[255,255,255]": "White",
    "[0,0,0]": "Black",
    "[210,105,30]": "Chocolate",
    "[255,20,147]": "Deep Pink",
    "[60,179,113]": "Medium Sea Green",
    "[107,142,35]": "Olive Drab"
};

// --- Seeded Random Number Generator ---
function SeededRandom(seed) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
}

SeededRandom.prototype.next = function() {
    this.seed = this.seed * 16807 % 2147483647;
    return this.seed;
};

SeededRandom.prototype.random = function() {
    return (this.next() - 1) / 2147483646;
};

SeededRandom.prototype.choice = function(array) {
    return array[Math.floor(this.random() * array.length)];
};

SeededRandom.prototype.sample = function(array, count) {
    const shuffled = [...array];
    let selected = [];
    for (let i = 0; i < count; i++) {
        const index = Math.floor(this.random() * shuffled.length);
        selected.push(shuffled.splice(index, 1)[0]);
    }
    return selected;
};


// --- Helper Functions ---
function colorDistance(color1, color2) {
    const r1 = color1[0], g1 = color1[1], b1 = color1[2];
    const r2 = color2[0], g2 = color2[1], b2 = color2[2];
    return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
}

function accuracy(targetColor, mixedColor) {
    const distance = colorDistance(targetColor, mixedColor);
    const maxDistance = colorDistance([0, 0, 0], [255, 255, 255]);
    const similarity = (maxDistance - distance) / maxDistance;
    return similarity * 100;
}

function generateTargetColor(mixingColors, rng) {
    const numColors = Math.floor(rng.random() * 8) + 3;
    const selectedColors = [];
    for (let i = 0; i < numColors; i++) {
        if (rng.random() < 0.25) {
            selectedColors.push(rng.choice(mixingColors));
        } else {
             selectedColors.push(rng.choice(mixingColors));
        }
    }
    let mixedColor = [255, 255, 255];
    for (let i = 0; i < selectedColors.length; i++) {
        if (i === 0) {
            mixedColor = selectedColors[i];
        } else {
            const n = i + 1;
            mixedColor = [
                Math.round(((n - 1) * mixedColor[0] + selectedColors[i][0]) / n),
                Math.round(((n - 1) * mixedColor[1] + selectedColors[i][1]) / n),
                Math.round(((n - 1) * mixedColor[2] + selectedColors[i][2]) / n)
            ];
        }
    }
    return { targetColor: mixedColor, mixedColorsList: selectedColors };
}

function generateMixingColors(rng) {
    return rng.sample(COLORS, 5);
}

function getColorName(color) {
    const colorString = JSON.stringify(color);
    return COLOR_NAMES[colorString] || "Unknown";
}

// --- Cookie Functions ---
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

// --- Encryption/Decryption ---
function encryptSaveData(data) {
    let encryptedData = '';
    for (let i = 0; i < data.length; i++) {
        encryptedData += String.fromCharCode(data.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length));
    }
    return btoa(encryptedData); // Base64 encode for file safety
}

function decryptSaveData(encryptedBase64Data) {
    try {
        const encryptedData = atob(encryptedBase64Data); // Base64 decode
        let decryptedData = '';
        for (let i = 0; i < encryptedData.length; i++) {
            decryptedData += String.fromCharCode(encryptedData.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length));
        }
        return decryptedData;
    } catch (e) {
        console.error("Error decrypting save data:", e);
        alert("Failed to load game save. The save file might be corrupted or invalid.");
        return null;
    }
}

// --- Game Class (Object) ---
const game = {
    level: 1,
    mixingColors: [],
    targetColor: [],
    mixedColorsList: [],
    mixedColor: [255, 255, 255],
    colorsAdded: 0,
    accuracyValue: 0,
    colorHistory: [],
    submitEnabled: false,
    perfectMessage: false,
    colorButtons: [],
    over95Matches: 0,
    perfectMatches: 0,
    rng: null,

    init: function() {
        this.instructionsPage = document.getElementById('instructions-page');
        this.gamePage = document.getElementById('game-page');
        this.levelDisplay = document.getElementById('level-number');
        this.targetPreview = document.getElementById('target-preview');
        this.mixedPreview = document.getElementById('mixed-preview');
        this.accuracyDisplay = document.getElementById('accuracy-percentage');
        this.perfectMessageDisplay = document.getElementById('perfect-message');
        this.colorPalette = document.getElementById('color-palette');
        this.undoButton = document.getElementById('undo-button');
        this.resetButton = document.getElementById('reset-button');
        this.submitButton = document.getElementById('submit-button');
        this.startGameButton = document.getElementById('start-game-button');
        this.over95CounterDisplay = document.getElementById('over-95-count');
        this.perfectCounterDisplay = document.getElementById('perfect-count');
        this.saveGameButton = document.getElementById('save-game-button'); // Footer buttons
        this.loadGameButton = document.getElementById('load-game-button'); // Footer buttons
        this.loadFileInput = document.getElementById('load-file-input');

        this.startGameButton.addEventListener('click', () => {
            this.showGamePage();
            this.startLevel();
        });
        this.undoButton.addEventListener('click', () => this.undoColor());
        this.resetButton.addEventListener('click', () => this.resetLevel());
        this.submitButton.addEventListener('click', () => this.nextLevel());
        this.saveGameButton.addEventListener('click', () => this.saveGame()); // Footer buttons
        this.loadGameButton.addEventListener('click', () => this.loadFileInput.click()); // Footer buttons
        this.loadFileInput.addEventListener('change', () => this.loadGame());

        this.loadCounters();
        this.loadLevel();
        this.updateCounterDisplays();
        this.showInstructionsPage();
    },

    loadCounters: function() {
        this.over95Matches = parseInt(getCookie('over95Matches')) || 0;
        this.perfectMatches = parseInt(getCookie('perfectMatches')) || 0;
    },

    saveCounters: function() {
        setCookie('over95Matches', this.over95Matches, 365);
        setCookie('perfectMatches', this.perfectMatches, 365);
    },

    updateCounterDisplays: function() {
        this.over95CounterDisplay.textContent = this.over95Matches;
        this.perfectCounterDisplay.textContent = this.perfectMatches;
    },

    loadLevel: function() {
        this.level = parseInt(getCookie('gameLevel')) || 1;
    },

    saveLevel: function() {
        setCookie('gameLevel', this.level, 365);
    },


    showInstructionsPage: function() {
        this.instructionsPage.classList.remove('hidden');
        this.gamePage.classList.add('hidden');
    },

    showGamePage: function() {
        this.instructionsPage.classList.add('hidden');
        this.gamePage.classList.remove('hidden');
    },

    startLevel: function() {
        this.levelDisplay.textContent = this.level;
        const levelSeed = BASE_SEED + this.level;
        this.rng = new SeededRandom(levelSeed);
        this.mixingColors = generateMixingColors(this.rng);
        const targetData = generateTargetColor(this.mixingColors, this.rng);
        this.targetColor = targetData.targetColor;
        this.mixedColorsList = targetData.mixedColorsList;
        this.mixedColor = [255, 255, 255];
        this.colorsAdded = 0;
        this.colorHistory = [];
        this.accuracyValue = 0;
        this.submitEnabled = false;
        this.perfectMessage = false;
        this.submitButton.disabled = true;
        this.perfectMessageDisplay.classList.add('hidden');
        this.createColorButtons();
        this.updateUI();
    },

    createColorButtons: function() {
        this.colorPalette.innerHTML = '';
        this.colorButtons = [];
        this.mixingColors.forEach(color => {
            const button = document.createElement('button');
            button.classList.add('color-button');
            button.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
            button.addEventListener('click', () => this.addColor(color));
            this.colorPalette.appendChild(button);
            this.colorButtons.push(button);
        });
    },

    addColor: function(color) {
        this.colorHistory.push([...this.mixedColor]);
        this.colorsAdded += 1;
        if (this.colorsAdded === 1) {
            this.mixedColor = color;
        } else {
            const n = this.colorsAdded;
            this.mixedColor = [
                Math.round(((n - 1) * this.mixedColor[0] + color[0]) / n),
                Math.round(((n - 1) * this.mixedColor[1] + color[1]) / n),
                Math.round(((n - 1) * this.mixedColor[2] + color[2]) / n)
            ];
        }
        this.updateAccuracy();
        this.updateUI();
    },

    updateAccuracy: function() {
        this.accuracyValue = accuracy(this.targetColor, this.mixedColor);
        this.submitEnabled = this.accuracyValue >= 85;
        this.perfectMessage = this.accuracyValue >= 99.99;
        this.submitButton.disabled = !this.submitEnabled;

        if (this.perfectMessage) {
            this.perfectMessageDisplay.classList.remove('hidden');
        } else {
            this.perfectMessageDisplay.classList.add('hidden');
        }
    },


    nextLevel: function() {
        if (this.submitEnabled) {
            if (this.accuracyValue >= 95) {
                this.over95Matches += 1;
            }
            if (this.perfectMessage) {
                this.perfectMatches += 1;
            }
            this.updateCounterDisplays();
            this.saveCounters();
            this.level += 1;
            this.saveLevel();
            this.startLevel();
        }
    },

    resetLevel: function() {
        this.mixedColor = [255, 255, 255];
        this.colorsAdded = 0;
        this.colorHistory = [];
        this.accuracyValue = 0;
        this.submitEnabled = false;
        this.perfectMessage = false;
        this.submitButton.disabled = true;
        this.perfectMessageDisplay.classList.add('hidden');
        this.updateUI();
    },

    undoColor: function() {
        if (this.colorHistory.length > 0) {
            this.mixedColor = this.colorHistory.pop();
            this.colorsAdded -= 1;
            this.updateAccuracy();
        }
        if (this.colorsAdded === 0) {
            this.mixedColor = [255, 255, 255];
        }
        this.updateUI();
    },

    updateUI: function() {
        this.targetPreview.style.backgroundColor = `rgb(${this.targetColor[0]}, ${this.targetColor[1]}, ${this.targetColor[2]})`;
        this.mixedPreview.style.backgroundColor = `rgb(${this.mixedColor[0]}, ${this.mixedColor[1]}, ${this.mixedColor[2]})`;
        this.accuracyDisplay.textContent = `${this.accuracyValue.toFixed(2)}%`;

        if (DEBUG_MODE) {
            const colorNames = this.mixedColorsList.map(getColorName);
            console.log("Mixed Colors:", colorNames.join(', '));
        }
    },


    saveGame: function() {
        const saveData = {
            level: this.level,
            over95Matches: this.over95Matches,
            perfectMatches: this.perfectMatches
            // No need to save colors, as they are generated based on level and seed
        };
        const jsonData = JSON.stringify(saveData);
        const encryptedData = encryptSaveData(jsonData);
        const filename = SAVE_FILENAME; // Use constant filename
        const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(encryptedData);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href",     dataStr);
        downloadAnchorNode.setAttribute("download", filename);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    },

    loadGame: function() {
        const file = this.loadFileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const encryptedData = event.target.result;
                const decryptedData = decryptSaveData(encryptedData);
                if (decryptedData) {
                    try {
                        const saveData = JSON.parse(decryptedData);
                        this.level = saveData.level;
                        this.over95Matches = saveData.over95Matches;
                        this.perfectMatches = saveData.perfectMatches;
                        this.saveLevel();
                        this.saveCounters();
                        this.updateCounterDisplays();
                        this.startLevel();
                        alert("Game loaded successfully!");
                    } catch (e) {
                        console.error("Error parsing save data:", e);
                        alert("Failed to load game save. The save file might be corrupted.");
                    }
                }
            };
            reader.onerror = (error) => {
                console.error("Error reading file:", error);
                alert("Failed to load game save. Could not read the save file.");
            };
            reader.readAsText(file);
        }
        this.loadFileInput.value = '';
    }
};

// Initialize the game when the script loads
game.init();