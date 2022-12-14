// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "hardhat/console.sol";
import {Base64} from "./libraries/Base64.sol";

contract MogleMarketplace is ERC721URIStorage, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private tokenIds;
    Counters.Counter private itemIds;
    Counters.Counter private itemsSold;
    struct MarketItem {
        uint256 itemId;
        address payable seller;
        address payable owner;
        address nftContractAddress;
        uint256 tokenId;
        uint256 price;
        bool sold;
    }
    mapping(uint256 => MarketItem) private itemIdToMarketItem;
    string base =
        "<svg width='356' height='491' viewBox='0 0 356 491' fill='none' xmlns='http://www.w3.org/2000/svg'><style>.base { fill: white; font-family: serif; font-size: 24px; }</style><rect width='356' height='491' fill='#63293A'/><path d='M144.593 87.7325C143.379 87.7325 142.772 87.3923 142.772 86.7119C142.772 86.1786 143.112 85.9119 143.793 85.9119L145.172 86.0499C145.595 86.0499 145.944 85.9763 146.22 85.8292C146.496 85.6637 146.708 85.3235 146.855 84.8086C147.149 83.8707 147.296 81.7927 147.296 78.5745V70.3268C147.296 68.4879 147.177 67.3294 146.937 66.8512C146.698 66.3547 146.413 66.0237 146.082 65.8582C145.77 65.6743 145.255 65.5272 144.538 65.4168C143.82 65.3065 143.462 65.0215 143.462 64.5617C143.462 64.1388 143.931 63.8354 144.869 63.6515C147.057 63.1917 148.565 62.732 149.392 62.2722C150.514 61.6286 151.277 61.3068 151.682 61.3068C152.105 61.3068 152.316 61.5183 152.316 61.9412C152.316 62.1435 152.27 62.355 152.178 62.5757C152.105 62.7963 152.022 63.063 151.93 63.3756C151.801 63.8721 151.7 64.8284 151.627 66.2444C153.263 63.8721 155.314 62.3366 157.778 61.6378C158.569 61.4171 159.36 61.3068 160.15 61.3068C164.453 61.3068 167.111 63.2193 168.122 67.0443C169.759 64.3227 171.92 62.5481 174.604 61.7206C175.45 61.4447 176.305 61.3068 177.17 61.3068C179.855 61.3068 181.933 62.0883 183.404 63.6515C184.875 65.2146 185.611 67.6512 185.611 70.9613V78.5745C185.611 81.7927 185.721 83.7696 185.942 84.5051C186.162 85.2223 186.411 85.6637 186.686 85.8292C186.962 85.9763 187.312 86.0499 187.735 86.0499L189.114 85.9119C189.794 85.9119 190.134 86.1786 190.134 86.7119C190.134 87.3923 189.518 87.7325 188.286 87.7325C187.587 87.7325 186.843 87.6589 186.052 87.5118C185.261 87.3831 184.406 87.3187 183.487 87.3187C182.585 87.3187 181.721 87.3831 180.894 87.5118C180.085 87.6589 179.331 87.7325 178.632 87.7325C177.4 87.7325 176.784 87.3923 176.784 86.7119C176.784 86.1786 177.124 85.9119 177.804 85.9119L179.183 86.0499C179.606 86.0499 179.956 85.9763 180.232 85.8292C180.507 85.6637 180.728 85.3235 180.894 84.8086C181.188 83.8891 181.335 81.8111 181.335 78.5745V72.2853C181.335 68.258 180.25 65.803 178.08 64.9203C177.381 64.6445 176.627 64.5066 175.818 64.5066C175.027 64.5066 174.283 64.6537 173.584 64.9479C172.885 65.2238 172.232 65.6375 171.625 66.1892C170.283 67.3845 169.271 68.966 168.591 70.9337V78.5745C168.591 81.7927 168.701 83.7696 168.922 84.5051C169.143 85.2223 169.391 85.6637 169.667 85.8292C169.943 85.9763 170.292 86.0499 170.715 86.0499L172.094 85.9119C172.775 85.9119 173.115 86.1786 173.115 86.7119C173.115 87.3923 172.499 87.7325 171.267 87.7325C170.568 87.7325 169.823 87.6589 169.032 87.5118C168.242 87.3831 167.387 87.3187 166.467 87.3187C165.566 87.3187 164.702 87.3831 163.874 87.5118C163.065 87.6589 162.311 87.7325 161.612 87.7325C160.38 87.7325 159.764 87.3923 159.764 86.7119C159.764 86.1786 160.104 85.9119 160.785 85.9119L162.164 86.0499C162.587 86.0499 162.936 85.9763 163.212 85.8292C163.488 85.6637 163.709 85.3235 163.874 84.8086C164.168 83.8891 164.316 81.8111 164.316 78.5745V72.2853C164.316 68.258 163.24 65.803 161.088 64.9203C160.371 64.6445 159.608 64.5066 158.799 64.5066C158.008 64.5066 157.263 64.6537 156.564 64.9479C155.866 65.2238 155.204 65.6375 154.578 66.1892C153.254 67.3845 152.252 68.966 151.572 70.9337V78.5745C151.572 81.7927 151.682 83.7696 151.903 84.5051C152.123 85.2223 152.372 85.6637 152.647 85.8292C152.923 85.9763 153.273 86.0499 153.696 86.0499L155.075 85.9119C155.755 85.9119 156.095 86.1786 156.095 86.7119C156.095 87.3923 155.489 87.7325 154.275 87.7325C153.576 87.7325 152.85 87.6589 152.096 87.5118C151.342 87.3831 150.477 87.3187 149.503 87.3187C148.528 87.3187 147.636 87.3831 146.827 87.5118C146.036 87.6589 145.292 87.7325 144.593 87.7325ZM192.755 75.0713C192.755 73.2875 193.077 71.5589 193.72 69.8855C194.364 68.212 195.274 66.7409 196.451 65.472C199.026 62.6952 202.235 61.3068 206.078 61.3068C210.344 61.3068 213.627 62.5849 215.926 65.141C218.004 67.4581 219.043 70.4648 219.043 74.161C219.043 77.8941 217.801 81.1215 215.319 83.8431C212.781 86.6199 209.581 88.0083 205.719 88.0083C201.453 88.0083 198.18 86.7303 195.899 84.1741C193.803 81.857 192.755 78.8228 192.755 75.0713ZM197.417 73.9128C197.417 75.715 197.665 77.3976 198.161 78.9607C198.658 80.5238 199.338 81.8203 200.203 82.8501C201.913 84.9465 204.074 85.9947 206.685 85.9947C209.002 85.9947 210.887 85.0752 212.34 83.2363C213.848 81.3238 214.602 78.8596 214.602 75.8437C214.602 71.8532 213.682 68.727 211.843 66.465C210.115 64.387 207.945 63.348 205.333 63.348C203.016 63.348 201.131 64.2675 199.679 66.1065C198.171 68.019 197.417 70.6211 197.417 73.9128ZM230.6 78.4366C229.534 79.3377 229.001 79.9262 229.001 80.202C229.001 80.4778 229.065 80.7261 229.194 80.9468C229.341 81.1491 229.644 81.3605 230.104 81.5812C231.152 82.0409 232.945 82.4179 235.483 82.7122C238.039 82.988 240.172 83.3742 241.882 83.8707C243.593 84.3672 244.981 84.9649 246.048 85.6637C248.07 86.9877 249.082 88.8267 249.082 91.1805C249.082 93.6999 247.749 95.879 245.082 97.718C242.397 99.5569 239.216 100.476 235.538 100.476C231.842 100.476 228.835 99.7224 226.518 98.2145C224.183 96.6882 223.015 94.7573 223.015 92.4218C223.015 89.4427 224.982 87.19 228.918 85.6637C226.766 85.02 225.507 84.1925 225.139 83.1811C225.01 82.8685 224.946 82.5467 224.946 82.2156C224.946 81.2962 226.251 79.7515 228.863 77.5815C226.178 75.8713 224.835 73.3979 224.835 70.1613C224.872 67.6788 225.838 65.6007 227.732 63.9273C229.718 62.1803 232.292 61.3068 235.455 61.3068C236.834 61.3068 238.195 61.5551 239.538 62.0516C240.347 60.231 241.487 58.7966 242.958 57.7484C244.227 56.829 245.524 56.3692 246.848 56.3692C248.374 56.3692 249.431 56.9301 250.02 58.0519C250.204 58.3829 250.296 58.7599 250.296 59.1828C250.296 59.6058 250.066 59.9919 249.606 60.3413C249.165 60.6907 248.742 60.8654 248.337 60.8654C247.583 60.8654 246.995 60.6907 246.572 60.3413C245.891 59.7713 245.229 59.4862 244.586 59.4862C243.942 59.4862 243.308 59.7989 242.682 60.4241C242.075 61.031 241.616 61.8677 241.303 62.9343C244.19 64.6997 245.634 67.1363 245.634 70.2441C245.634 72.7083 244.632 74.8047 242.627 76.5333C240.549 78.2987 238.011 79.1814 235.014 79.1814C233.34 79.1814 231.869 78.9331 230.6 78.4366ZM231.483 75.1817C232.09 75.8621 232.78 76.3862 233.552 76.754C234.343 77.1034 235.115 77.2781 235.869 77.2781C236.641 77.2781 237.322 77.1493 237.91 76.8919C238.517 76.6344 239.041 76.2483 239.483 75.7333C240.42 74.63 240.889 73.26 240.889 71.6233C240.889 69.9866 240.742 68.6902 240.448 67.7339C240.172 66.7593 239.758 65.9318 239.207 65.2513C238.085 63.8721 236.54 63.1825 234.573 63.1825C232.311 63.1825 230.748 64.3503 229.883 66.6857C229.626 67.4213 229.497 68.35 229.497 69.4717C229.497 70.5751 229.672 71.6325 230.021 72.6439C230.389 73.6369 230.876 74.4829 231.483 75.1817ZM231.125 86.2154C228.513 87.2268 227.208 88.9922 227.208 91.5115C227.208 93.1482 228.09 94.5826 229.856 95.8147C231.731 97.1203 234.094 97.7731 236.945 97.7731C241.101 97.7731 243.712 96.8629 244.779 95.0423C245.165 94.3987 245.358 93.6539 245.358 92.808C245.358 91.9621 245.22 91.2449 244.944 90.6564C244.668 90.068 244.172 89.5439 243.455 89.0841C242.002 88.1279 239.464 87.4199 235.841 86.9601C233.451 86.6843 231.879 86.436 231.125 86.2154ZM252.999 87.7325C251.785 87.7325 251.178 87.3923 251.178 86.7119C251.178 86.1786 251.518 85.9119 252.199 85.9119L253.578 86.0499C254.001 86.0499 254.35 85.9763 254.626 85.8292C254.902 85.6637 255.114 85.3235 255.261 84.8086C255.555 83.8707 255.702 81.7927 255.702 78.5745V58.0243C255.702 54.9716 255.068 53.3533 253.799 53.1694C252.879 53.0223 252.42 52.7189 252.42 52.2592C252.42 51.8362 252.852 51.542 253.716 51.3765C254.58 51.1926 255.362 50.9719 256.061 50.7145C256.759 50.4386 257.376 50.1812 257.909 49.9421C258.442 49.6846 258.893 49.464 259.26 49.2801C259.647 49.0962 259.922 49.0042 260.088 49.0042C260.511 49.0042 260.722 49.2157 260.722 49.6387C260.722 49.841 260.686 50.0524 260.612 50.2731C260.226 51.2661 260.024 52.5258 260.005 54.0521C259.987 55.5785 259.978 56.829 259.978 57.8036V78.5745C259.978 81.7927 260.088 83.7696 260.309 84.5051C260.529 85.2223 260.778 85.6637 261.053 85.8292C261.329 85.9763 261.679 86.0499 262.102 86.0499L263.481 85.9119C264.161 85.9119 264.501 86.1786 264.501 86.7119C264.501 87.3923 263.895 87.7325 262.681 87.7325C261.982 87.7325 261.256 87.6589 260.502 87.5118C259.748 87.3831 258.883 87.3187 257.909 87.3187C256.934 87.3187 256.042 87.3831 255.233 87.5118C254.442 87.6589 253.698 87.7325 252.999 87.7325ZM271.48 84.2293C270.414 83.034 269.586 81.6272 268.998 80.0089C268.428 78.3906 268.143 76.5977 268.143 74.63C268.143 72.6439 268.483 70.8234 269.163 69.1683C269.844 67.5132 270.781 66.0973 271.977 64.9203C274.459 62.4745 277.521 61.2516 281.162 61.2516C284.178 61.2516 286.615 62.2447 288.472 64.2307C290.238 66.1432 291.12 68.5063 291.12 71.3199C291.12 72.2393 290.992 72.8738 290.734 73.2232C290.495 73.5542 290.192 73.7565 289.824 73.83C289.456 73.8852 288.95 73.9404 288.307 73.9955C287.663 74.0323 286.881 74.0783 285.962 74.1335C285.043 74.1886 284.013 74.2438 282.873 74.299C281.751 74.3541 280.601 74.4185 279.425 74.4921C276.721 74.6576 274.551 74.8231 272.915 74.9886C273.319 79.9353 275.213 83.1443 278.597 84.6155C279.7 85.0936 280.877 85.3327 282.128 85.3327C284.776 85.3327 286.872 84.5603 288.417 83.0156C289.079 82.3536 289.585 82.0226 289.934 82.0226C290.596 82.0226 290.927 82.4179 290.927 83.2087C290.927 83.6132 290.651 84.1006 290.1 84.6706C289.548 85.2407 288.757 85.8292 287.727 86.436C285.907 87.4842 283.783 88.0083 281.355 88.0083C278.928 88.0083 276.942 87.6773 275.397 87.0153C273.871 86.3349 272.565 85.4062 271.48 84.2293ZM272.859 72.9473C281.484 72.506 286.026 72.0371 286.486 71.5405C286.652 71.3567 286.734 70.8142 286.734 69.9131C286.734 69.012 286.56 68.1385 286.21 67.2926C285.861 66.4283 285.392 65.6927 284.803 65.0858C283.59 63.8537 282.082 63.2377 280.28 63.2377C278.238 63.2377 276.519 64.0928 275.121 65.803C273.65 67.5868 272.896 69.9682 272.859 72.9473Z' fill='white'/><path d='M59.4907 53.646V65.6361M121.224 53.646V65.6361M59.4907 65.6361V87.047H75.3213M59.4907 65.6361L90.3574 87.047M121.224 65.6361V87.047H105.51M121.224 65.6361L90.3574 87.047M90.3574 87.047H75.3213M90.3574 87.047H105.51M75.3213 87.047L90.3574 65.6361L105.51 87.047' stroke='#FFDA7A' stroke-width='3.36346' stroke-linecap='square' stroke-linejoin='bevel'/><rect x='59.8447' y='90.4317' width='61.3793' height='3.06548' fill='#FFDA7A'/><text x='50%' y='50%' class='base' dominant-baseline='middle' text-anchor='middle'>";
    address public owner;
    event NewMint(uint256 tokenId, address minter);
    event NewMarketItem(
        uint256 indexed itemId,
        address seller,
        address owner,
        address indexed nftContractAddress,
        uint256 indexed tokenId,
        uint256 price,
        bool sold
    );
    event NewMarketItemSale(uint256 indexed itemId, address owner);

    constructor() ERC721("Mogle V1", "MGLV1") {
        tokenIds.increment();
        itemIds.increment();
        owner = msg.sender;
    }

    function mintNFT(
        string memory account,
        string memory category,
        string memory deliverable
    ) public {
        uint256 _tokenId = tokenIds.current();
        string memory text = string(
            abi.encodePacked(category, ": ", deliverable)
        );
        string memory svg = string(
            abi.encodePacked(base, text, "</text></svg>")
        );
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "',
                        text,
                        '", "description": "',
                        "https://www.mogleinsurance.com/profiles/",
                        account,
                        '", "image": "data:image/svg+xml;base64,',
                        Base64.encode(bytes(svg)),
                        '"}'
                    )
                )
            )
        );
        string memory tokenURI = string(
            abi.encodePacked("data:application/json;base64,", json)
        );
        console.log("\n--------------------");
        console.log(
            string(
                abi.encodePacked(
                    "https://nftpreview.0xdev.codes/?code=",
                    tokenURI
                )
            )
        );
        console.log("--------------------\n");
        _safeMint(msg.sender, _tokenId);
        _setTokenURI(_tokenId, tokenURI);
        tokenIds.increment();
        console.log(
            "An NFT w/ ID %s has been minted to %s",
            _tokenId,
            msg.sender
        );
        emit NewMint(_tokenId, msg.sender);
    }

    function getMarketItems() public view returns (MarketItem[] memory) {
        uint256 itemCount = itemIds.current();
        uint256 itemsUnsold = itemCount - itemsSold.current();
        uint256 currentIndex = 0;
        MarketItem[] memory items = new MarketItem[](itemsUnsold);
        for (uint256 i = 0; i < itemCount; i++) {
            if (itemIdToMarketItem[i + 1].owner == address(0)) {
                uint256 currentId = i + 1;
                MarketItem storage currentItem = itemIdToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    function listMarketItem(
        address nftContractAddress,
        uint256 tokenId,
        uint256 price
    ) public payable nonReentrant {
        require(price > 0, "Price must be greater than 0");
        uint256 _itemId = itemIds.current();
        itemIdToMarketItem[_itemId] = MarketItem(
            _itemId,
            payable(msg.sender),
            payable(address(0)),
            nftContractAddress,
            tokenId,
            price,
            false
        );
        IERC721(nftContractAddress).transferFrom(
            msg.sender,
            address(this),
            tokenId
        );
        itemIds.increment();
        emit NewMarketItem(
            _itemId,
            msg.sender,
            address(0),
            nftContractAddress,
            tokenId,
            price,
            false
        );
    }

    function sellMarketItem(uint256 itemId, address nftContractAddress)
        public
        payable
        nonReentrant
    {
        uint256 tokenId = itemIdToMarketItem[itemId].tokenId;
        uint256 price = itemIdToMarketItem[itemId].price;
        bool sold = itemIdToMarketItem[itemId].sold;
        require(
            msg.value == price,
            "Must submit asking price to purchase item"
        );
        require(sold != true, "This item has already been sold");
        itemIdToMarketItem[itemId].seller.transfer(msg.value);
        IERC721(nftContractAddress).transferFrom(
            address(this),
            msg.sender,
            tokenId
        );
        itemIdToMarketItem[itemId].owner = payable(msg.sender);
        itemIdToMarketItem[itemId].sold = true;
        itemsSold.increment();
        emit NewMarketItemSale(itemId, msg.sender);
    }
}
