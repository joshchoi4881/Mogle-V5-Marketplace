import React, { useState, useEffect } from "react";
import {
  useMoralis,
  useMoralisWeb3Api,
  useWeb3ExecuteFunction,
} from "react-moralis";
import { ethers } from "ethers";
import amplitude from "amplitude-js";
import { Card, Modal, Image, Tooltip, Badge, Spin, Alert } from "antd";
import { RightCircleOutlined } from "@ant-design/icons";
import { useMarketplace } from "../../../providers/MarketplaceProvider";
import {
  getCurrencySymbol,
  getBlockExplorerUrl,
} from "../../../helpers/networks";
import { getEllipsisTxt } from "../../../helpers/formatters";
import CollectionNFT from "./CollectionNFT";
import Loader from "../../UI/Loader";

const { Meta } = Card;

const SELL_MARKET_ITEM = "sellMarketItem";
const MARKET_ITEMS = {
  "0x1": "EthereumMarketItemsD",
  "0x4": "RinkebyMarketItemsD",
  "0x13881": "MumbaiMarketItemsD",
};
const ITEM_IMAGES = {
  "0x1": "EthereumItemImages",
  "0x4": "RinkebyItemImages",
  "0x13881": "MumbaiItemImages",
};
const STYLES = {
  search: {
    marginBottom: "80px",
  },
  nfts: {
    display: "flex",
    justifyContent: "flex-start",
    maxWidth: "1000px",
    gap: "10px",
    margin: "0 auto",
    flexWrap: "wrap",
    WebkitBoxPack: "start",
  },
  banner: {
    display: "flex",
    justifyContent: "space-evenly",
    alignItems: "center",
    width: "600px",
    height: "150px",
    margin: "0 auto",
    marginBottom: "40px",
    borderBottom: "solid 1px #e3e3e3",
    paddingBottom: "20px",
  },
  logo: {
    width: "115px",
    height: "115px",
    border: "solid 4px white",
    borderRadius: "50%",
  },
  text: {
    fontSize: "27px",
    fontWeight: "bold",
    color: "#041836",
  },
};
const PAGE = "Marketplace";
const FEATURE = "Buy";

const Buy = ({ search, setSearch, reload, setReload }) => {
  const [collections, setCollections] = useState([]);
  const [collectionNfts, setCollectionNfts] = useState([]);
  const [collectionNftsTotal, setCollectionNftsTotal] = useState(null);
  const [isCollectionNftsLoading, setIsCollectionNftsLoading] = useState(null);
  const [isCollectionNftsSuccess, setIsCollectionNftsSuccess] = useState(true);
  const [nft, setNft] = useState(null);
  const [nftBuyStatus, setNftBuyStatus] = useState();
  const [price, setPrice] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { account, chainId, Moralis } = useMoralis();
  const Web3Api = useMoralisWeb3Api();
  const contractProcessor = useWeb3ExecuteFunction();
  const { contractAddress, contractAbi } = useMarketplace();
  const currencySymbol = getCurrencySymbol(chainId);
  const blockExplorerUrl = getBlockExplorerUrl(chainId);
  const getCollections = async () => {
    const collections = [];
    const sellers = {};
    const itemImages = Moralis.Object.extend(ITEM_IMAGES[chainId]);
    const queryItemImages = new Moralis.Query(itemImages);
    const data = await queryItemImages.find();
    const processItemImages = JSON.parse(
      JSON.stringify(data, [
        "seller",
        "nftContractAddress",
        "tokenId",
        "name",
        "image",
      ])
    );
    for (const item of processItemImages) {
      const seller = item.seller;
      if (!sellers[seller]) {
        sellers[seller] = true;
        const collection = {
          seller: item.seller,
          address: item.nftContractAddress,
          name: item.name,
          image: item.image,
        };
        collections.push(collection);
      }
    }
    setCollections(collections);
  };
  const getCollectionNfts = async () => {
    setIsCollectionNftsLoading(true);
    try {
      const itemImages = Moralis.Object.extend(ITEM_IMAGES[chainId]);
      const queryItemImages = new Moralis.Query(itemImages);
      const data = await queryItemImages.find();
      const collectionNfts = JSON.parse(
        JSON.stringify(data, [
          "seller",
          "nftContractAddress",
          "tokenId",
          "name",
          "image",
        ])
      );
      if (collectionNfts) {
        const nfts = collectionNfts.filter((nft) => nft.seller === search);
        setCollectionNfts(nfts);
        setCollectionNftsTotal(nfts.length);
        setIsCollectionNftsSuccess(true);
      }
    } catch (error) {
      console.error(error);
      setIsCollectionNftsSuccess(false);
    } finally {
      setIsCollectionNftsLoading(false);
    }
  };

  useEffect(() => {
    if (reload.buy) {
      getCollections();
      if (search !== "explore") {
        getCollectionNfts();
      }
      setReload({ ...reload, buy: false });
    }
  }, [reload, setReload, getCollections]);

  useEffect(() => {
    amplitude.getInstance().logEvent("View " + FEATURE + " Feature", {
      Page: PAGE,
      Feature: FEATURE,
    });
  }, []);

  const purchase = async () => {
    setIsLoading(true);
    const marketItem = await getMarketItem(nft);
    const itemId = marketItem.itemId;
    const price = marketItem.price;
    const options = {
      contractAddress: contractAddress[chainId],
      functionName: SELL_MARKET_ITEM,
      abi: contractAbi,
      params: {
        itemId: itemId,
        nftContractAddress: nft.nftContractAddress,
      },
      msgValue: price,
    };
    await contractProcessor.fetch({
      params: options,
      onSuccess: () => {
        updateMarketItem();
        onSaleSuccess();
      },
      onError: (error) => {
        console.error(error);
        actionMessage("fail");
        setIsLoading(false);
      },
    });
  };

  const getMarketItem = async (nft) => {
    if (nft) {
      const marketItems = Moralis.Object.extend(MARKET_ITEMS[chainId]);
      const queryMarketItems = new Moralis.Query(marketItems);
      const data = await queryMarketItems.find();
      const processMarketItems = JSON.parse(
        JSON.stringify(data, [
          "objectId",
          "createdAt",
          "itemId",
          "seller",
          "owner",
          "nftContractAddress",
          "tokenId",
          "price",
          "sold",
          "confirmed",
        ])
      );
      const result = processMarketItems?.find(
        (item) =>
          item.nftContractAddress === nft?.nftContractAddress &&
          item.tokenId === nft?.tokenId &&
          item.sold === false &&
          item.confirmed === true
      );
      if (result !== undefined) {
        const price = result.price / ("1e" + 18);
        setPrice(price);
        return result;
      } else {
        return false;
      }
    }
  };

  const updateMarketItem = async () => {
    const marketItem = await getMarketItem(nft);
    const objectId = marketItem["objectId"];
    const marketItems = Moralis.Object.extend(MARKET_ITEMS[chainId]);
    const query = new Moralis.Query(marketItems);
    await query.get(objectId).then((item) => {
      item.set("owner", account);
      item.set("sold", true);
      item.save();
    });
  };

  const onSaleSuccess = () => {
    const onNewMarketItemSale = (itemId, owner) => {
      actionMessage("success");
      setIsLoading(false);
      setReload({
        ...reload,
        search: true,
        buy: true,
        sell: true,
        transactions: true,
      });
    };
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(
      contractAddress[chainId],
      contractAbi,
      signer
    );
    if (contract) {
      contract.on("NewMarketItemSale", onNewMarketItemSale);
    }
    return () => {
      if (contract) {
        contract.off("NewMarketItemSale", onNewMarketItemSale);
      }
    };
  };

  const actionMessage = (state) => {
    const seconds = 5;
    let modal;
    if (state === "success") {
      modal = Modal.success({
        title: "Success!",
        content: `You have purchased this NFT`,
      });
    } else if (state === "fail") {
      modal = Modal.error({
        title: "Error!",
        content: `There was a problem when purchasing this NFT`,
      });
    }
    setTimeout(() => {
      modal.destroy();
    }, seconds * 1000);
  };

  const handleViewClick = (address) => {
    setSearch(address);
    setReload({ ...reload, buy: true });
  };

  const handleBuyClick = async (nft) => {
    const nftBuyStatus = await getMarketItem(nft);
    setNft(nft);
    setNftBuyStatus(nftBuyStatus);
    setIsModalVisible(true);
  };

  return (
    <>
      {contractAbi.noContractDeployed && (
        <>
          <Alert
            type="error"
            message="No Smart Contract Details Provided. Please deploy smart contract and provide address + ABI in the MoralisDappProvider.js file"
          />
          <div style={{ marginBottom: "10px" }}></div>
        </>
      )}
      {search !== "explore" && collectionNftsTotal !== undefined && (
        <>
          {!isCollectionNftsSuccess && (
            <>
              <Alert
                type="warning"
                message="Unable to fetch all NFT metadata... We are searching for a solution, please try again later!"
              />
              <div style={{ marginBottom: "10px" }}></div>
            </>
          )}
          {isCollectionNftsLoading ? (
            <Loader header="Loading" />
          ) : (
            <>
              <div style={STYLES.banner}>
                {/* <Image
                  preview={false}
                  src={collectionNfts[0]?.image || "error"}
                  alt={collectionNfts[0]?.name}
                  style={STYLES.logo}
                /> */}
                <div style={STYLES.text}>
                  <div>{`${getEllipsisTxt(collectionNfts[0]?.seller)}`}</div>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: "normal",
                      color: "#9c9c9c",
                    }}
                  >
                    Collection Size: {`${collectionNftsTotal}`}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
      <div style={STYLES.nfts}>
        {search === "explore"
          ? collections?.map((nft, i) => (
              <>
                <Card
                  key={i}
                  cover={
                    <Image
                      preview={false}
                      src={nft?.image || "error"}
                      alt={nft?.name}
                      style={{ height: "240px" }}
                    />
                  }
                  hoverable
                  style={{ width: 240, border: "2px solid #e7eaf3" }}
                  actions={[
                    <Tooltip title="View Collection">
                      <RightCircleOutlined
                        onClick={() => handleViewClick(nft?.seller)}
                      />
                    </Tooltip>,
                  ]}
                >
                  <Meta title={nft.name} />
                </Card>
              </>
            ))
          : collectionNfts.slice(0, 20).map((nft, i) => {
              return (
                <>
                  <CollectionNFT
                    nft={nft}
                    i={i}
                    getMarketItem={getMarketItem}
                    handleBuyClick={handleBuyClick}
                  />
                </>
              );
            })}
      </div>
      {nftBuyStatus ? (
        <>
          <Modal
            key={nft?.name}
            visible={isModalVisible}
            title={`Buy ${nft?.name} #${nft?.tokenId}`}
            okText="Buy"
            onOk={() => purchase()}
            onCancel={() => setIsModalVisible(false)}
          >
            <Spin spinning={isLoading}>
              <div
                style={{
                  width: "250px",
                  margin: "auto",
                }}
              >
                <Badge.Ribbon text={`${price} ${currencySymbol}`} color="green">
                  <img
                    src={nft?.image}
                    alt={nft?.name}
                    style={{
                      width: "250px",
                      marginBottom: "15px",
                      borderRadius: "10px",
                    }}
                  />
                </Badge.Ribbon>
              </div>
            </Spin>
          </Modal>
        </>
      ) : (
        <>
          <Modal
            key={nft?.name}
            visible={isModalVisible}
            title={`Buy ${nft?.name} #${nft?.tokenId}`}
            onOk={() => setIsModalVisible(false)}
            onCancel={() => setIsModalVisible(false)}
          >
            <img
              src={nft?.image}
              alt={nft?.name}
              style={{
                width: "250px",
                margin: "auto",
                marginBottom: "15px",
                borderRadius: "10px",
              }}
            />
            <Alert
              type="warning"
              message="This NFT is currently not for sale"
            />
          </Modal>
        </>
      )}
    </>
  );
};

export default Buy;
