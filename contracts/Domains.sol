// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

import { StringUtils } from "./libraries/StringUtils.sol";
import "hardhat/console.sol";

contract Domains is ERC721URIStorage {

	using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

	// top level domain (tld)
	string public tld;
	address payable public owner;

	// Symbol
	string svgPartOne = '<svg xmlns="http://www.w3.org/2000/svg" width="270" height="270" fill="none"><path fill="url(#B)" d="M0 0h270v270H0z"/><defs><filter id="A" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse" height="270" width="270"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity=".225" width="200%" height="200%"/></filter></defs><path d="M72.863 42.949c-.668-.387-1.426-.59-2.197-.59s-1.529.204-2.197.59l-10.081 6.032-6.85 3.934-10.081 6.032c-.668.387-1.426.59-2.197.59s-1.529-.204-2.197-.59l-8.013-4.721a4.52 4.52 0 0 1-1.589-1.616c-.384-.665-.594-1.418-.608-2.187v-9.31c-.013-.775.185-1.538.572-2.208a4.25 4.25 0 0 1 1.625-1.595l7.884-4.59c.668-.387 1.426-.59 2.197-.59s1.529.204 2.197.59l7.884 4.59a4.52 4.52 0 0 1 1.589 1.616c.384.665.594 1.418.608 2.187v6.032l6.85-4.065v-6.032c.013-.775-.185-1.538-.572-2.208a4.25 4.25 0 0 0-1.625-1.595L41.456 24.59c-.668-.387-1.426-.59-2.197-.59s-1.529.204-2.197.59l-14.864 8.655a4.25 4.25 0 0 0-1.625 1.595c-.387.67-.585 1.434-.572 2.208v17.441c-.013.775.185 1.538.572 2.208a4.25 4.25 0 0 0 1.625 1.595l14.864 8.655c.668.387 1.426.59 2.197.59s1.529-.204 2.197-.59l10.081-5.901 6.85-4.065 10.081-5.901c.668-.387 1.426-.59 2.197-.59s1.529.204 2.197.59l7.884 4.59a4.52 4.52 0 0 1 1.589 1.616c.384.665.594 1.418.608 2.187v9.311c.013.775-.185 1.538-.572 2.208a4.25 4.25 0 0 1-1.625 1.595l-7.884 4.721c-.668.387-1.426.59-2.197.59s-1.529-.204-2.197-.59l-7.884-4.59a4.52 4.52 0 0 1-1.589-1.616c-.385-.665-.594-1.418-.608-2.187v-6.032l-6.85 4.065v6.032c-.013.775.185 1.538.572 2.208a4.25 4.25 0 0 0 1.625 1.595l14.864 8.655c.668.387 1.426.59 2.197.59s1.529-.204 2.197-.59l14.864-8.655c.657-.394 1.204-.95 1.589-1.616s.594-1.418.609-2.187V55.538c.013-.775-.185-1.538-.572-2.208a4.25 4.25 0 0 0-1.625-1.595l-14.993-8.786z" fill="';
	// 1st Gradient colour
	string svgPartTwo = '"/><defs><linearGradient id="B" x1="0" y1="0" x2="270" y2="270" gradientUnits="userSpaceOnUse"><stop stop-color="';
	// 2nd Gradient colour
	string svgPartThree = '"/><stop offset="1" stop-color="';
	// Text
	string svgPartFour = '" stop-opacity=".99"/></linearGradient></defs><text x="32.5" y="231" font-size="27" fill="#fff" filter="url(#A)" font-family="Plus Jakarta Sans,DejaVu Sans,Noto Color Emoji,Apple Color Emoji,sans-serif" font-weight="bold">';
	string svgPartFive = '</text></svg>';

	string[] colors = ["red", "black", "yellow", "blue", "green", "orange", "purple"];

	event NewDomainMinted(uint256 id, address owner, string name);
	event NewRecordSet(string name, string record);

	// Store user's names
	mapping(string => address) public domains;

	mapping(string => string) public records;

	mapping(uint => string) public names;

	error Unauthorised();
	error AlreadyRegistered();
	error InvalidName(string name);

	constructor(string memory _tld) payable ERC721("Melon Name Service", "MNS"){
		tld = _tld;
		owner = payable(msg.sender);
		// console.log("%s name service deployed", _tld);
	}

	function random(string memory input) internal pure returns (uint256){
        return uint256(keccak256(abi.encodePacked(input)));
    }

    function pickRandomColor(uint256 tokenId) public view returns (string memory) {
        uint256 rand = random(string(abi.encodePacked("COLOR", Strings.toString(tokenId), Strings.toString(tokenId), Strings.toString(block.timestamp), Strings.toString(block.difficulty))));
        rand = rand % colors.length;
        return colors[rand];
    }

    function compareStrings(string memory a, string memory b) public view returns (bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }

	// Give price of a domain based on length
	function price(string calldata name) public pure returns(uint){
		uint len = StringUtils.strlen(name);
		require(len > 0);
		if (len == 3){
			// 5 matic = 5 000 000 000 000 000 000 (18 decimals)
			return 5 * 10 ** 17; 
		}else if (len == 4){
			// 0.3 Matic
			return 3 * 10 ** 17; 
		}else{
			// 0.1 Matic
			return 1 * 10 ** 17; 
		}
	}

	// A register function that adds user's names to the mapping
	function register (string calldata name) public payable {
		// require(domains[name] == address(0));
		if (domains[name] != address(0)) revert AlreadyRegistered();
		if (!valid(name)) revert InvalidName(name);

		uint256 _price = price(name);

		require(msg.value >= _price, "Not enough Matic");

		uint256 newRecordId = _tokenIds.current();
		uint256 length = StringUtils.strlen(name);
		string memory strlen = Strings.toString(length);

		string memory _name = string(abi.encodePacked(name, ".", tld));
		string memory randomColorSymbol = pickRandomColor(newRecordId);
		string memory randomColorGradient1 = pickRandomColor(newRecordId);
		string memory randomColorGradient2 = pickRandomColor(newRecordId);
		
		while (compareStrings(randomColorSymbol, randomColorGradient1)){
			randomColorGradient1 = pickRandomColor(newRecordId + length);
		}

		string memory finalSvg = string(abi.encodePacked(svgPartOne, randomColorSymbol, svgPartTwo, randomColorGradient1, svgPartThree, randomColorGradient2, svgPartFour, _name, svgPartFive));
		
		

		console.log("Registering %s.%s on the contract with tokenID %d", name, tld, newRecordId);

		string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "',
                        _name,
                        '", "description": "A domain on the Melon name service',
                        '", "image": "data:image/svg+xml;base64,',
                        Base64.encode(bytes(finalSvg)),
                        '","length":"',
                        strlen,
                        '"}'
                    )
                )
            )
        );

        string memory finalTokenUri = string(abi.encodePacked("data:application/json;base64,", json));

        console.log("\n----------------------");
        console.log("Final tokenURI: ", finalTokenUri);
        console.log("----------------------\n");
        

        _safeMint(msg.sender, newRecordId);
        _setTokenURI(newRecordId, finalTokenUri);

        names[newRecordId] = name;
        domains[name] = msg.sender;

        emit NewDomainMinted(newRecordId, msg.sender, name);
        _tokenIds.increment();
	}

	function getAllNames() public view returns (string[] memory){
		string[] memory allNames = new string[](_tokenIds.current());
		for(uint i = 0; i < _tokenIds.current(); i++){
			allNames[i] = names[i];

		}
		return allNames;
	}

	function valid(string calldata name) public pure returns(bool){
		return StringUtils.strlen(name) >= 3 && StringUtils.strlen(name) <= 8;
	}

	function getAddress(string calldata name) public view returns (address){
		return domains[name];
	}

	function setRecord(string calldata name, string calldata record) public {
		// require(domains[name] == msg.sender);
		if(msg.sender != domains[name]) revert Unauthorised();
		records[name] = record;
		emit NewRecordSet(name, record);
	}

	function getRecord(string calldata name) public view returns(string memory){
		return records[name];
	}

	modifier onlyOwner(){
		require(isOwner());
		_;
	}

	function isOwner() public view returns (bool){
		return msg.sender == owner;
	}

	function withdraw() public onlyOwner{
		uint amount = address(this).balance;
		(bool success, ) = msg.sender.call{value: amount}("");
		require(success, "Failed to withdraw Matic");
	}
}