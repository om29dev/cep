// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PatternProof {
    bytes32[] public hashes;
    
    event HashStored(bytes32 indexed hash, uint256 index);

    function storeHash(bytes32 _hash) public {
        // Enforcement of Proof-of-Work Rule: Hash must satisfy difficulty
        // checking the first 1.5 bytes (equivalent to roughly 3 hex zeros)
        require(_hash[0] == 0 && uint8(_hash[1]) < 16, "Incomplete Proof: Hash must start with 000 Difficulty");
        
        hashes.push(_hash);
        emit HashStored(_hash, hashes.length - 1);
    }

    function getHashCount() public view returns (uint256) {
        return hashes.length;
    }
}
