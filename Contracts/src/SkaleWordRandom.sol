
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "skale-rng/RNG.sol";

/**
 * @title SkaleWordRandom
 * @dev A contract that uses SKALE Network RNG to select random words of specified lengths.
 */
contract SkaleWordRandom is AccessControl, RNG {

    bytes32 public constant ADMIN = keccak256("ADMIN");
    bytes32 public constant WORD_PICKER = keccak256("WORD_PICKER");

    struct Words {
        uint32 wordsLength;
        string[] words;
    }

    // Mapping from word length to Words struct
    mapping(uint32 => Words) private wordsByLength;

    // Supported word lengths (3-8)
    uint32[] private supportedLengths;

    event WordsAdded(uint32 indexed length, uint256 count);
    event RandomWordPicked(uint32 indexed length, string word, uint256 index);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN, msg.sender);
        _grantRole(WORD_PICKER, msg.sender);

        // Initialize supported lengths
        for (uint32 i = 3; i <= 8; i++) {
            supportedLengths.push(i);
        }

        // Initialize words for each length
        _initializeWords();
    }

    /**
     * @dev Internal function to initialize word lists for each length.
     */
    function _initializeWords() private {
        // 3-letter words
        wordsByLength[3].wordsLength = 3;
        wordsByLength[3].words = ["cat", "dog", "bat", "car", "sun", "run", "fun", "top", "hot", "new", "old", "big", "red", "yes", "win", "box", "cup", "pen", "key", "ice", "sky", "sea", "bag", "bed", "eye", "ear", "arm", "leg", "map", "toy"];

        // 4-letter words
        wordsByLength[4].wordsLength = 4;
        wordsByLength[4].words = ["word", "game", "play", "time", "work", "life", "hand", "moon", "star", "tree", "bird", "fish", "book", "love", "hope", "door", "wall", "road", "fire", "wind", "rain", "snow", "gold", "team", "lion", "bear", "duck", "rock", "sand", "gift"];

        // 5-letter words
        wordsByLength[5].wordsLength = 5;
        wordsByLength[5].words = ["happy", "world", "house", "water", "light", "music", "power", "money", "table", "chair", "plant", "dream", "peace", "trust", "brave", "smile", "heart", "beach", "clock", "cloud", "dance", "grape", "lemon", "movie", "ocean", "piano", "queen", "river", "stone", "tiger"];

        // 6-letter words
        wordsByLength[6].wordsLength = 6;
        wordsByLength[6].words = ["random", "skater", "bright", "simple", "friend", "number", "system", "change", "create", "nature", "wonder", "pocket", "castle", "garden", "bridge", "forest", "island", "rocket", "window", "dragon", "planet", "animal", "banana", "flower", "kitten", "magnet", "orange", "rabbit", "summer", "winter"];

        // 7-letter words
        wordsByLength[7].wordsLength = 7;
        wordsByLength[7].words = ["promise", "journey", "reading", "kitchen", "freedom", "network", "balance", "imagine", "purpose", "captain", "harmony", "sunrise", "picture", "library", "mineral", "crystal", "fantasy", "morning", "rainbow", "shelter", "teacher", "trouble", "volcano", "whisper", "ancient", "blanket", "chicken", "dolphin", "elephant", "general"];

        // 8-letter words
        wordsByLength[8].wordsLength = 8;
        wordsByLength[8].words = ["mountain", "keyboard", "strength", "treasure", "standard", "platform", "document", "question", "universe", "champion", "software", "business", "calendar", "language", "surprise", "diamonds", "elephant", "festival", "graphics", "hospital", "internet", "kangaroo", "landmark", "marathon", "notebook", "operator", "passport", "question", "sandwich", "umbrella"];
    }

    /**
     * @notice Gets a random word of the specified length.
     * @dev Only callable by addresses with WORD_PICKER role.
     * @param wordLength The desired word length (must be between 3 and 8).
     * @return The randomly selected word.
     */
    function getRandomWord(uint32 wordLength) public view onlyRole(WORD_PICKER) returns (string memory) {
        require(wordLength >= 3 && wordLength <= 8, "Word length must be between 3 and 8");
        require(wordsByLength[wordLength].words.length > 0, "No words available for this length");

        uint256 arrayLength = wordsByLength[wordLength].words.length;
        uint256 randomIndex = getRandomRange(arrayLength);

        return wordsByLength[wordLength].words[randomIndex];
    }

    /**
     * @notice Gets the number of words available for a specific length.
     * @param wordLength The word length to query.
     * @return The number of words available.
     */
    function getWordCount(uint32 wordLength) public view returns (uint256) {
        return wordsByLength[wordLength].words.length;
    }

    /**
     * @notice Gets a specific word by length and index (for testing/verification).
     * @param wordLength The word length.
     * @param index The index in the array.
     * @return The word at the specified index.
     */
    function getWordAt(uint32 wordLength, uint256 index) public view returns (string memory) {
        require(index < wordsByLength[wordLength].words.length, "Index out of bounds");
        return wordsByLength[wordLength].words[index];
    }

    /**
     * @notice Adds words to a specific length category.
     * @dev Only callable by ADMIN role. Useful for extending word lists after deployment.
     * @param wordLength The word length category.
     * @param newWords Array of new words to add.
     */
    function addWords(uint32 wordLength, string[] memory newWords) public onlyRole(ADMIN) {
        require(wordLength >= 3 && wordLength <= 8, "Word length must be between 3 and 8");
        
        for (uint256 i = 0; i < newWords.length; i++) {
            wordsByLength[wordLength].words.push(newWords[i]);
        }

        emit WordsAdded(wordLength, newWords.length);
    }

    /**
     * @notice Gets all supported word lengths.
     * @return Array of supported word lengths.
     */
    function getSupportedLengths() public view returns (uint32[] memory) {
        return supportedLengths;
    }
}