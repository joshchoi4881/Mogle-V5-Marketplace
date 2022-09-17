import React, { useState, useEffect } from "react";
import { useMoralis } from "react-moralis";
import { Card, Image, Tooltip, Badge } from "antd";
import { FileSearchOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { getBlockExplorerUrl } from "../../../helpers/networks";

const { Meta } = Card;

const CollectionNFT = ({ nft, i, getMarketItem, handleBuyClick }) => {
  const [nftBuyStatus, setNftBuyStatus] = useState();
  const { chainId } = useMoralis();
  const blockExplorerUrl = getBlockExplorerUrl(chainId);

  useEffect(() => {
    const getNftBuyStatus = async () => {
      const nftBuyStatus = await getMarketItem(nft);
      setNftBuyStatus(nftBuyStatus);
    };
    getNftBuyStatus();
  }, []);

  return (
    <Card
      key={i}
      cover={
        <Image
          preview={false}
          src={nft.image || "error"}
          alt={nft.name}
          style={{ height: "240px" }}
        />
      }
      hoverable
      style={{ width: 240, border: "2px solid #e7eaf3" }}
      actions={[
        <Tooltip title="View On Blockexplorer">
          <FileSearchOutlined
            onClick={() =>
              window.open(
                `${blockExplorerUrl}address/${nft.nftContractAddress}`,
                "_blank"
              )
            }
          />
        </Tooltip>,
        <Tooltip title="Buy NFT">
          <ShoppingCartOutlined onClick={() => handleBuyClick(nft)} />
        </Tooltip>,
      ]}
    >
      {nftBuyStatus && (
        <>
          <Badge.Ribbon text="Buy Now" color="green"></Badge.Ribbon>
        </>
      )}
      <Meta title={nft.name} description={`#${nft.tokenId}`} />
    </Card>
  );
};

export default CollectionNFT;
