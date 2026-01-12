// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PatternProof {
    bytes32[] public hashes;
    
    event HashStored(bytes32 indexed hash, uint256 index);

    function storeHash(bytes32 _hash) public {
        hashes.push(_hash);
        emit HashStored(_hash, hashes.length - 1);
    }

    function getHashCount() public view returns (uint256) {
        return hashes.length;
    }
}
