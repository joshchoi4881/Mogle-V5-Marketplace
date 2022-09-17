import React, { useState, useEffect } from "react";
import {
  useMoralis,
  useMoralisWeb3Api,
  useWeb3ExecuteFunction,
} from "react-moralis";
import { ethers } from "ethers";
import amplitude from "amplitude-js";
import { Card, Modal, Image, Tooltip, Input, Button, Spin, Alert } from "antd";
import { FileSearchOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { useMarketplace } from "../../../providers/MarketplaceProvider";
import { useIPFS } from "../../../hooks/useIPFS";
import { getBlockExplorerUrl } from "../../../helpers/networks";
import Loader from "../../UI/Loader";

const { Meta } = Card;

const SET_APPROVAL_FOR_ALL = "setApprovalForAll";
const IS_APPROVED_FOR_ALL = "isApprovedForAll";
const GET_MARKET_ITEMS = "getMarketItems";
const LIST_MARKET_ITEM = "listMarketItem";
const ITEM_IMAGES = {
  "0x1": "EthereumItemImages",
  "0x4": "RinkebyItemImages",
  "0x13881": "MumbaiItemImages",
};
const STYLES = {
  nfts: {
    display: "flex",
    justifyContent: "flex-start",
    maxWidth: "1000px",
    gap: "10px",
    margin: "0 auto",
    flexWrap: "wrap",
    WebkitBoxPack: "start",
  },
};
const PAGE = "Marketplace";
const FEATURE = "Sell";

const Sell = ({ reload, setReload }) => {
  const [balanceNfts, setBalanceNfts] = useState([]);
  const [isBalanceNftsLoading, setIsBalanceNftsLoading] = useState(null);
  const [isBalanceNftsSuccess, setIsBalanceNftsSuccess] = useState(true);
  const [nft, setNft] = useState(null);
  const [approved, setApproved] = useState(false);
  const [listed, setListed] = useState(false);
  const [price, setPrice] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { account, chainId, Moralis } = useMoralis();
  const Web3Api = useMoralisWeb3Api();
  const contractProcessor = useWeb3ExecuteFunction();
  const { contractAddress, contractAbi } = useMarketplace();
  const { resolveLink } = useIPFS();
  const getBalanceNfts = async () => {
    setIsBalanceNftsLoading(true);
    try {
      const options = { address: account, chain: chainId };
      const balanceNfts = await Web3Api.account.getNFTs(options);
      if (balanceNfts?.result) {
        const nfts = balanceNfts.result.filter(
          (nft) => nft.token_address === contractAddress[chainId].toLowerCase()
        );
        setIsBalanceNftsSuccess(true);
        for (let nft of nfts) {
          if (nft?.metadata) {
            nft.metadata = JSON.parse(nft.metadata);
            nft.image = resolveLink(nft.metadata?.image);
          } else if (nft?.token_uri) {
            try {
              await fetch(nft.token_uri)
                .then((response) => response.json())
                .then((n) => {
                  nft.image = resolveLink(n.image);
                });
            } catch (error) {
              console.error(error);
              setIsBalanceNftsSuccess(false);
            }
          }
        }
        setBalanceNfts(nfts);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsBalanceNftsLoading(false);
    }
  };

  useEffect(() => {
    if (reload.sell) {
      getBalanceNfts();
      setReload({ ...reload, sell: false });
    }
  }, [reload, setReload]);

  useEffect(() => {
    amplitude.getInstance().logEvent("View " + FEATURE + " Feature", {
      Page: PAGE,
      Feature: FEATURE,
    });
  }, []);

  const isApproved = async (nft) => {
    const options = {
      contractAddress: nft.token_address,
      functionName: IS_APPROVED_FOR_ALL,
      abi: contractAbi,
      params: {
        owner: account,
        operator: contractAddress[chainId],
      },
    };
    const approved = await contractProcessor.fetch({
      params: options,
      onError: (error) => {
        console.error(error);
      },
    });
    return approved;
  };

  const approve = async (nft) => {
    setIsLoading(true);
    const options = {
      contractAddress: nft.token_address,
      functionName: SET_APPROVAL_FOR_ALL,
      abi: contractAbi,
      params: {
        operator: contractAddress[chainId],
        approved: true,
      },
    };
    await contractProcessor.fetch({
      params: options,
      onSuccess: () => {
        onApproveSuccess();
      },
      onError: (error) => {
        console.error(error);
        actionMessage("approve", "fail");
        setIsLoading(false);
      },
    });
  };

  const onApproveSuccess = () => {
    const onApprovalForAll = (owner, operator, approved) => {
      setApproved(true);
      actionMessage("approve", "success");
      setIsLoading(false);
    };
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(
      contractAddress[chainId],
      contractAbi,
      signer
    );
    if (contract) {
      contract.on("ApprovalForAll", onApprovalForAll);
    }
    return () => {
      if (contract) {
        contract.off("ApprovalForAll", onApprovalForAll);
      }
    };
  };

  const isListed = async (nft) => {
    const options = {
      contractAddress: contractAddress[chainId],
      functionName: GET_MARKET_ITEMS,
      abi: contractAbi,
    };
    const marketItems = await contractProcessor.fetch({
      params: options,
      onError: (error) => {
        console.error(error);
      },
    });
    const processMarketItems = JSON.parse(
      JSON.stringify(marketItems, [
        "itemId",
        "seller",
        "owner",
        "nftContractAddress",
        "tokenId",
        "price",
        "sold",
      ])
    );
    const result = processMarketItems?.find(
      (item) =>
        item.nftContractAddress === nft?.token_address &&
        item.tokenId === nft?.token_id &&
        item.sold === false &&
        item.confirmed === true
    );
    const listed = result ? true : false;
    return listed;
  };

  const list = async (nft, price) => {
    setIsLoading(true);
    const p = ethers.utils.parseUnits(price, 18);
    const options = {
      contractAddress: contractAddress[chainId],
      functionName: LIST_MARKET_ITEM,
      abi: contractAbi,
      params: {
        nftContractAddress: nft.token_address,
        tokenId: nft.token_id,
        price: String(p),
      },
    };
    await contractProcessor.fetch({
      params: options,
      onSuccess: () => {
        addItemImage();
        onListSuccess();
      },
      onError: (error) => {
        console.error(error);
        actionMessage("list", "fail");
        setIsLoading(false);
      },
    });
  };

  const addItemImage = () => {
    const ItemImages = Moralis.Object.extend(ITEM_IMAGES[chainId]);
    const itemImage = new ItemImages();
    itemImage.set("seller", account);
    itemImage.set("nftContractAddress", nft.token_address);
    itemImage.set("tokenId", nft.token_id);
    itemImage.set("name", nft.name);
    itemImage.set("image", nft.image);
    itemImage.save();
  };

  const onListSuccess = () => {
    const onNewMarketItem = (
      itemId,
      seller,
      owner,
      nftContractAddress,
      tokenId,
      price,
      sold
    ) => {
      setListed(true);
      actionMessage("list", "success");
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
      contract.on("NewMarketItem", onNewMarketItem);
    }
    return () => {
      if (contract) {
        contract.off("NewMarketItem", onNewMarketItem);
      }
    };
  };

  const actionMessage = (action, state) => {
    const seconds = 5;
    let modal;
    if (action === "approve") {
      if (state === "success") {
        modal = Modal.success({
          title: "Success!",
          content: `Approval is now set, you may list your NFT`,
        });
      } else if (state === "fail") {
        modal = Modal.error({
          title: "Error!",
          content: `There was a problem with setting approval`,
        });
      }
    } else if (action === "list") {
      if (state === "success") {
        modal = Modal.success({
          title: "Success!",
          content: `Your NFT was listed on the marketplace`,
        });
      } else if (state === "fail") {
        modal = Modal.error({
          title: "Error!",
          content: `There was a problem listing your NFT`,
        });
      }
    }
    setTimeout(() => {
      modal.destroy();
    }, seconds * 1000);
  };

  const handleSellClick = async (nft) => {
    const approved = await isApproved(nft);
    const listed = await isListed(nft);
    setNft(nft);
    setApproved(approved);
    setListed(listed);
    setIsModalVisible(true);
  };

  return (
    <>
      <div style={STYLES.nfts}>
        {contractAbi.noContractDeployed && (
          <>
            <Alert
              type="error"
              message="No Smart Contract Details Provided. Please deploy smart contract and provide address + ABI in the MoralisDappProvider.js file"
            />
            <div style={{ marginBottom: "10px" }}></div>
          </>
        )}
        {!isBalanceNftsSuccess && (
          <>
            <Alert
              message="Unable to fetch all NFT metadata... We are searching for a solution, please try again later!"
              type="warning"
            />
            <div style={{ marginBottom: "10px" }}></div>
          </>
        )}
        {isBalanceNftsLoading ? (
          <Loader header="Loading" />
        ) : (
          balanceNfts &&
          balanceNfts.map((nft, i) => (
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
              actions={[
                <Tooltip title="View On Blockexplorer">
                  <FileSearchOutlined
                    onClick={() =>
                      window.open(
                        `${getBlockExplorerUrl(chainId)}address/${
                          nft.token_address
                        }`,
                        "_blank"
                      )
                    }
                  />
                </Tooltip>,
                <Tooltip title="List NFT for sale">
                  <ShoppingCartOutlined onClick={() => handleSellClick(nft)} />
                </Tooltip>,
              ]}
              style={{ width: 240, border: "2px solid #e7eaf3" }}
            >
              <Meta title={nft.name} description={nft.contract_type} />
            </Card>
          ))
        )}
      </div>
      <Modal
        visible={isModalVisible}
        title={`List ${nft?.name} #${nft?.token_id} For Sale`}
        okText="List"
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>,
          <Button
            onClick={() => approve(nft)}
            type="primary"
            disabled={approved}
          >
            Approve
          </Button>,
          <Button
            onClick={() => list(nft, price)}
            type="primary"
            disabled={!approved || listed}
          >
            List
          </Button>,
        ]}
      >
        <Spin spinning={isLoading}>
          <img
            src={`${nft?.image}`}
            alt={nft?.name}
            style={{
              width: "250px",
              margin: "auto",
              marginBottom: "15px",
              borderRadius: "10px",
            }}
          />
          <Input
            placeholder="Listing Price in MATIC"
            autoFocus
            onChange={(e) => setPrice(e.target.value)}
          />
        </Spin>
      </Modal>
    </>
  );
};

export default Sell;
