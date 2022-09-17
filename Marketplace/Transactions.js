import React, { useState, useEffect } from "react";
import { useMoralis } from "react-moralis";
import amplitude from "amplitude-js";
import { Table, Tag, Space } from "antd";
import moment from "moment";
import { MATICIcon } from "../../UI/Chains/Logos";

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
  table: {
    width: "1000px",
    margin: "0 auto",
  },
};
const PAGE = "Marketplace";
const FEATURE = "Marketplace-Transactions";

const Transactions = ({ reload, setReload }) => {
  const [data, setData] = useState();
  const [columns, setColumns] = useState();
  const { account, chainId, Moralis } = useMoralis();
  const getData = async () => {
    const marketItems = Moralis.Object.extend(MARKET_ITEMS[chainId]);
    const queryMarketItems = new Moralis.Query(marketItems);
    const data = await queryMarketItems.find();
    const processMarketItems = JSON.parse(
      JSON.stringify(data, [
        "updatedAt",
        "itemId",
        "seller",
        "owner",
        "nftContractAddress",
        "tokenId",
        "price",
        "sold",
      ])
    )
      .filter((item) => item.seller === account || item.owner === account)
      .sort((a, b) =>
        a.updatedAt < b.updatedAt ? 1 : b.updatedAt < a.updatedAt ? -1 : 0
      );
    const processedData = processMarketItems?.map((item, i) => ({
      key: i,
      date: moment(item.updatedAt).format("DD-MM-YYYY HH:mm"),
      collection: item.nftContractAddress,
      item: item.tokenId,
      tags: [item.seller, item.sold],
      price: item.price / ("1e" + 18),
    }));
    setData(processedData);
  };
  const getColumns = async () => {
    const itemImages = Moralis.Object.extend(ITEM_IMAGES[chainId]);
    const queryItemImages = new Moralis.Query(itemImages);
    const data = await queryItemImages.find();
    const processItemImages = JSON.parse(
      JSON.stringify(data, ["nftContractAddress", "tokenId", "name", "image"])
    );
    const getItemImagesName = (address, id) => {
      const itemImage = processItemImages.find(
        (element) =>
          element.nftContractAddress === address && element.tokenId === id
      );
      return itemImage?.name;
    };
    const getItemImagesImage = (address, id) => {
      const itemImage = processItemImages.find(
        (element) =>
          element.nftContractAddress === address && element.tokenId === id
      );
      return itemImage?.image;
    };
    const columns = [
      {
        key: "date",
        dataIndex: "date",
        title: "Date",
      },
      {
        key: "item",
        title: "Item",
        render: (text, record) => (
          <>
            <Space size="middle">
              <img
                src={getItemImagesImage(record.collection, record.item)}
                alt={getItemImagesName(record.collection, record.item)}
                style={{ width: "40px", borderRadius: "4px" }}
              />
              <span>#{record.item}</span>
            </Space>
          </>
        ),
      },
      {
        key: "collection",
        title: "Collection",
        render: (text, record) => (
          <>
            <Space size="middle">
              <span>{getItemImagesName(record.collection, record.item)}</span>
            </Space>
          </>
        ),
      },
      {
        key: "tags",
        dataIndex: "tags",
        title: "Status",
        render: (tags) => (
          <>
            {tags.map((tag) => {
              let status = "BUY";
              let color = "geekblue";
              if (tag === false) {
                status = "WAITING";
                color = "volcano";
              } else if (tag === true) {
                status = "CONFIRMED";
                color = "green";
              }
              if (tag === account) {
                status = "SELL";
              }
              return (
                <>
                  <Tag key={tag} color={color}>
                    {status.toUpperCase()}
                  </Tag>
                </>
              );
            })}
          </>
        ),
      },
      {
        key: "price",
        dataIndex: "price",
        title: "Price",
        render: (price) => (
          <>
            <Space size="middle">
              <MATICIcon />
              <span>{price}</span>
            </Space>
          </>
        ),
      },
    ];
    setColumns(columns);
  };

  useEffect(() => {
    if (reload.transactions) {
      getData();
      getColumns();
      setReload({ ...reload, transactions: false });
    }
  }, [reload, setReload, getData, getColumns]);

  useEffect(() => {
    amplitude.getInstance().logEvent("View " + FEATURE + " Feature", {
      Page: PAGE,
      Feature: FEATURE,
    });
  }, []);

  return (
    <>
      <div style={STYLES.table}>
        <Table columns={columns} dataSource={data} />
      </div>
    </>
  );
};

export default Transactions;
